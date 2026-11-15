"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfileId } from "@/lib/auth/current-user";
import { bumpLists } from "@/lib/lists/version";
import { db } from "@/lib/db/server";
import { newItemsMessage } from "@/lib/push/messages";
import { sendToProfile } from "@/lib/push/send";
import { itemFormSchema, normalizeUrl, parsePrice, parseVariant, storeFromUrl } from "@/lib/items/domain";

export type FormState = { error?: string; fieldErrors?: Record<string, string> };

function readForm(formData: FormData) {
  const get = (k: string) => (formData.get(k) as string | null) ?? undefined;
  return itemFormSchema.safeParse({
    url: get("url"), title: get("title"), price: get("price"), store: get("store"),
    category: get("category"), kind: get("kind"), variant: get("variant"), notes: get("notes"), imageUrl: get("imageUrl"),
  });
}

function toRow(data: ReturnType<typeof readForm> & { success: true }) {
  const f = data.data;
  const price = parsePrice(f.price);
  return {
    price,
    row: {
      url: f.url || null,
      url_normalized: normalizeUrl(f.url),
      title: f.title,
      price_cents: price === "invalido" ? null : price,
      price_checked_at: price === null || price === "invalido" ? null : new Date().toISOString(),
      store: f.store || storeFromUrl(f.url),
      category: f.category,
      kind: f.kind,
      variant: parseVariant(f.variant),
      notes: f.notes || null,
      image_url: f.imageUrl || null,
    },
  };
}

function fieldErrors(result: ReturnType<typeof readForm>): FormState {
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) out[String(issue.path[0])] ??= issue.message;
  return { error: "Confira os campos destacados.", fieldErrors: out };
}

const DUPLICATE = "Esse link já está na sua lista.";

/** RF37: avisa o outro que entraram itens na lista (um aviso por cadastro). */
async function notifyPartner(ownerId: string, count: number): Promise<void> {
  try {
    const { data } = await db().from("profiles").select("id, display_name, notify_new_items");
    const me = data?.find((p) => p.id === ownerId);
    const partner = data?.find((p) => p.id !== ownerId);
    if (!me || !partner?.notify_new_items) return;
    await sendToProfile(partner.id, newItemsMessage(me.display_name, me.id, count));
  } catch { /* aviso é melhor esforço */ }
}

export type Draft = {
  url: string; title: string; price: string; store: string; category: string; kind: string;
  variant: string; notes: string; imageUrl: string;
  scrapeStatus: "ok" | "parcial" | "bloqueado" | "link_quebrado" | "manual";
};

/** RF07: "Salvar todos". Salva o que dá e devolve o erro de cada cartão que falhou. */
export async function createItems(drafts: Draft[]): Promise<{ savedIndexes: number[]; errors: Record<number, Record<string, string>> }> {
  const profileId = await requireProfileId();
  await bumpLists();
  const savedIndexes: number[] = [];
  const errors: Record<number, Record<string, string>> = {};

  for (const [i, d] of drafts.slice(0, 20).entries()) {
    const parsed = itemFormSchema.safeParse(d);
    if (!parsed.success) {
      const out: Record<string, string> = {};
      for (const issue of parsed.error.issues) out[String(issue.path[0])] ??= issue.message;
      errors[i] = out;
      continue;
    }
    const { price, row } = toRow(parsed);
    if (price === "invalido") { errors[i] = { price: "Use um valor como 129,90." }; continue; }
    const status = ["ok", "parcial", "bloqueado", "link_quebrado", "manual"].includes(d.scrapeStatus) ? d.scrapeStatus : "manual";
    const { error } = await db().from("items").insert({ ...row, owner_id: profileId, scrape_status: status });
    if (error) errors[i] = error.code === "23505" ? { url: DUPLICATE } : { form: "Não deu para salvar este item." };
    else savedIndexes.push(i);
  }
  if (savedIndexes.length) { await notifyPartner(profileId, savedIndexes.length); refresh(); }
  return { savedIndexes, errors };
}

export async function createItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const profileId = await requireProfileId();
  await bumpLists();
  const parsed = readForm(formData);
  if (!parsed.success) return fieldErrors(parsed);
  const { price, row } = toRow(parsed);
  if (price === "invalido") return { error: "Confira os campos destacados.", fieldErrors: { price: "Use um valor como 129,90." } };

  const { error } = await db().from("items").insert({ ...row, owner_id: profileId, scrape_status: "manual" });
  if (error) {
    if (error.code === "23505") return { error: DUPLICATE, fieldErrors: { url: DUPLICATE } };
    return { error: "Não deu para salvar agora. Tente de novo." };
  }
  await notifyPartner(profileId, 1);
  redirect("/");
}

export async function updateItem(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const profileId = await requireProfileId();
  await bumpLists();
  const parsed = readForm(formData);
  if (!parsed.success) return fieldErrors(parsed);
  const { price, row } = toRow(parsed);
  if (price === "invalido") return { error: "Confira os campos destacados.", fieldErrors: { price: "Use um valor como 129,90." } };

  // Itens "sempre bem-vindo" nunca ficam como "já tenho" (RN03)
  const patch: Record<string, unknown> = { ...row };
  if (row.kind === "sempre") Object.assign(patch, { status: "desejado", status_changed_at: null, group_id: null });

  const { error } = await db().from("items").update(patch).eq("id", id).eq("owner_id", profileId);
  if (error) {
    if (error.code === "23505") return { error: DUPLICATE, fieldErrors: { url: DUPLICATE } };
    return { error: "Não deu para salvar agora. Tente de novo." };
  }
  if (row.kind === "sempre") await cleanupGroups(profileId);
  else {
    const res = await applyGroupChanges(id, formData);
    if (!res.ok) return { error: res.error };
  }
  redirect("/");
}

/** Mudanças do quadro "Quero um desses", aplicadas só ao salvar o item. */
async function applyGroupChanges(id: string, formData: FormData): Promise<GroupResult> {
  const get = (k: string) => String(formData.get(k) ?? "");
  const action = get("group_action");
  const groupId = get("group_id");
  if (action === "dissolve" && groupId) return deleteGroup(groupId);
  if (action === "leave") return setItemGroup(id, null);
  if (action === "join") return setItemGroup(id, { groupId: get("group_target") });
  if (action === "new") return setItemGroup(id, { newName: get("group_new_name"), withItemId: get("group_new_with") });
  if (groupId) {
    const rename = get("group_rename").trim();
    if (rename) { const r = await renameGroup(groupId, rename); if (!r.ok) return r; }
    const pref = get("group_preferred");
    if (pref === "1" || pref === "0") return setPreferred(id, pref === "1");
  }
  return { ok: true };
}

/** RF14: "Já tenho" (e desfazer). Só para itens únicos. */
export async function setOwned(id: string, owned: boolean): Promise<{ ok: boolean; error?: string }> {
  const profileId = await requireProfileId();
  await bumpLists();
  const { data: before } = await db().from("items").select("group_id, left_with_group").eq("id", id).eq("owner_id", profileId).maybeSingle();
  const { error } = await db().from("items")
    .update(owned ? { status: "ja_tenho", status_changed_at: new Date().toISOString() } : { status: "desejado", status_changed_at: null, left_with_group: false })
    .eq("id", id).eq("owner_id", profileId).eq("kind", "unico");
  if (error) return { ok: false, error: "Não deu para atualizar agora." };
  if (owned) await db().rpc("settle_item_groups", { p_items: [id] });
  else if (before?.group_id && !before.left_with_group) {
    // voltar o item que levou o grupo junto traz as outras opções de volta
    await db().from("items").update({ status: "desejado", status_changed_at: null, left_with_group: false })
      .eq("group_id", before.group_id).eq("owner_id", profileId).eq("left_with_group", true);
  }
  refresh();
  return { ok: true };
}

/** RF13: exclui e devolve a linha para o "desfazer" poder restaurar com o mesmo id. */
export async function deleteItem(id: string): Promise<{ ok: boolean; snapshot?: Record<string, unknown> }> {
  const profileId = await requireProfileId();
  await bumpLists();
  const { data, error } = await db().from("items").delete().eq("id", id).eq("owner_id", profileId).select("*").maybeSingle();
  if (error || !data) return { ok: false };
  await cleanupGroups(profileId);
  refresh();
  return { ok: true, snapshot: data };
}

export async function restoreItem(snapshot: Record<string, unknown>): Promise<{ ok: boolean }> {
  const profileId = await requireProfileId();
  await bumpLists();
  if (snapshot.owner_id !== profileId) return { ok: false };
  let { error } = await db().from("items").insert(snapshot);
  // o grupo pode ter sumido enquanto o item estava excluído: volta sem grupo
  if (error?.code === "23503") ({ error } = await db().from("items").insert({ ...snapshot, group_id: null }));
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}

// ---------- grupos "quero um desses" ----------
type GroupResult = { ok: true; groupId?: string } | { ok: false; error: string };
const UUID = /^[0-9a-f-]{36}$/i;

/** Grupo com menos de 2 itens não faz sentido: desfaz. */
async function cleanupGroups(ownerId: string): Promise<void> {
  const [{ data: groups }, { data: members }] = await Promise.all([
    db().from("item_groups").select("id").eq("owner_id", ownerId),
    db().from("items").select("group_id").eq("owner_id", ownerId).not("group_id", "is", null),
  ]);
  const count = new Map<string, number>();
  for (const m of members ?? []) count.set(m.group_id as string, (count.get(m.group_id as string) ?? 0) + 1);
  const empty = (groups ?? []).filter((g) => (count.get(g.id) ?? 0) < 2).map((g) => g.id);
  if (empty.length) await db().from("item_groups").delete().in("id", empty).eq("owner_id", ownerId);
}

/** Agrupa 2 ou mais itens únicos da própria lista. */
export async function createGroup(itemIds: string[], name: string): Promise<GroupResult> {
  const profileId = await requireProfileId();
  await bumpLists();
  const ids = [...new Set(itemIds)].filter((id) => UUID.test(id));
  const clean = name.trim().slice(0, 60);
  if (!clean) return { ok: false, error: "Dê um nome ao grupo (ex.: Mouse)." };
  if (ids.length < 2) return { ok: false, error: "Escolha pelo menos 2 itens." };
  const { data: items } = await db().from("items").select("id, kind").in("id", ids).eq("owner_id", profileId);
  if (!items || items.length !== ids.length) return { ok: false, error: "Item não encontrado." };
  if (items.some((i) => i.kind !== "unico")) return { ok: false, error: "Só itens únicos podem entrar num grupo." };
  const { data: group, error } = await db().from("item_groups").insert({ owner_id: profileId, name: clean }).select("id").single();
  if (error || !group) return { ok: false, error: "Não deu para criar o grupo." };
  await db().from("items").update({ group_id: group.id }).in("id", ids).eq("owner_id", profileId);
  await cleanupGroups(profileId);
  refresh();
  return { ok: true, groupId: group.id };
}

/** Coloca o item num grupo existente, num grupo novo (com outro item escolhido) ou tira do grupo. */
export async function setItemGroup(itemId: string, target: { groupId: string } | { newName: string; withItemId: string } | null): Promise<GroupResult> {
  const profileId = await requireProfileId();
  await bumpLists();
  if (!UUID.test(itemId)) return { ok: false, error: "Item não encontrado." };
  if (target && "newName" in target) return createGroup([itemId, target.withItemId], target.newName);
  if (target) {
    const { data: g } = await db().from("item_groups").select("id").eq("id", target.groupId).eq("owner_id", profileId).maybeSingle();
    if (!g) return { ok: false, error: "Grupo não encontrado." };
  }
  const { error } = await db().from("items").update({ group_id: target?.groupId ?? null }).eq("id", itemId).eq("owner_id", profileId).eq("kind", "unico");
  if (error) return { ok: false, error: "Não deu para mudar o grupo." };
  await cleanupGroups(profileId);
  refresh();
  return { ok: true };
}

/** ⭐ preferido do grupo (um por grupo). */
export async function setPreferred(itemId: string, preferred: boolean): Promise<GroupResult> {
  const profileId = await requireProfileId();
  await bumpLists();
  const { data: item } = await db().from("items").select("group_id").eq("id", itemId).eq("owner_id", profileId).maybeSingle();
  if (!item?.group_id) return { ok: false, error: "O item não está em um grupo." };
  const { error } = await db().from("item_groups").update({ preferred_item_id: preferred ? itemId : null }).eq("id", item.group_id).eq("owner_id", profileId);
  if (error) return { ok: false, error: "Não deu para marcar o preferido." };
  refresh();
  return { ok: true };
}

/** Renomear o grupo. */
export async function renameGroup(groupId: string, name: string): Promise<GroupResult> {
  const profileId = await requireProfileId();
  await bumpLists();
  const clean = name.trim().slice(0, 60);
  if (!clean) return { ok: false, error: "Dê um nome ao grupo." };
  const { error } = await db().from("item_groups").update({ name: clean }).eq("id", groupId).eq("owner_id", profileId);
  if (error) return { ok: false, error: "Não deu para renomear." };
  refresh();
  return { ok: true };
}

/** Desfaz o grupo: os itens continuam na lista, só deixam de ser "um desses". */
export async function deleteGroup(groupId: string): Promise<GroupResult> {
  const profileId = await requireProfileId();
  await bumpLists();
  if (!UUID.test(groupId)) return { ok: false, error: "Grupo não encontrado." };
  // sem grupo, a etiqueta "saiu junto" não faz mais sentido (o item fica onde está; dá para Voltar)
  await db().from("items").update({ left_with_group: false }).eq("group_id", groupId).eq("owner_id", profileId);
  const { error } = await db().from("item_groups").delete().eq("id", groupId).eq("owner_id", profileId);
  if (error) return { ok: false, error: "Não deu para desfazer o grupo." };
  refresh();
  return { ok: true };
}
