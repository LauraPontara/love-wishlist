"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireProfileId } from "@/lib/auth/current-user";
import { nextOccurrence, todayInSaoPaulo } from "@/lib/combos/domain";
import { isReservedByPartner } from "@/lib/combos/queries";
import { db } from "@/lib/db/server";
import { parsePrice } from "@/lib/items/domain";
import { scrapeMany } from "@/lib/scrape/scrape";

type Result = { ok: true } | { ok: false; error: string };
const fail = (error: string): Result => ({ ok: false, error });

/** Mensagens das funções do banco já vêm em português; o resto vira genérico. */
function dbError(message: string | undefined): string {
  if (!message) return "Não deu para salvar agora. Tente de novo.";
  if (/combo|item|quantidade|dispon|lista/i.test(message)) return message;
  return "Não deu para salvar agora. Tente de novo.";
}

async function partnerOf(profileId: string): Promise<string> {
  const { data } = await db().from("profiles").select("id").neq("id", profileId).limit(1).maybeSingle();
  if (!data) throw new Error("Perfil do outro não encontrado.");
  return data.id;
}

async function ownCombo(comboId: string, creatorId: string) {
  const { data } = await db().from("combos").select("id, status, recipient_id").eq("id", comboId).eq("creator_id", creatorId).maybeSingle();
  return data;
}

// ---------- criar e editar ----------
const comboMeta = z.object({
  name: z.string().trim().min(1, "Dê um nome ao presente.").max(80),
  occasionId: z.string().uuid().nullable(),
  budget: z.string().trim().max(20).optional(),
});

export async function createCombo(input: { name: string; occasionId: string | null; budget?: string; itemId?: string }): Promise<Result & { id?: string }> {
  const creatorId = await requireProfileId();
  const parsed = comboMeta.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const budget = parsePrice(parsed.data.budget);
  if (budget === "invalido") return fail("Orçamento inválido. Use um valor como 300.");
  const recipientId = await partnerOf(creatorId);

  let occasionDate: string | null = null;
  if (parsed.data.occasionId) {
    const { data: occ } = await db().from("occasions").select("month, day").eq("id", parsed.data.occasionId).maybeSingle();
    if (occ) occasionDate = nextOccurrence(occ.month, occ.day, todayInSaoPaulo());
  }

  const { data: combo, error } = await db().from("combos").insert({
    creator_id: creatorId, recipient_id: recipientId, name: parsed.data.name,
    occasion_id: parsed.data.occasionId, occasion_date: occasionDate, budget_cents: budget,
  }).select("id").single();
  if (error || !combo) return fail(dbError(error?.message));

  if (input.itemId) {
    const added = await addItemToCombo(combo.id, input.itemId);
    if (!added.ok) return { ...added, id: combo.id };
  }
  return { ok: true, id: combo.id };
}

/** RF31: "Dar este" cria na hora um combo de 1 item e abre o editor. */
export async function giveThis(itemId: string): Promise<Result> {
  await requireProfileId();
  const { data: item } = await db().from("items").select("title").eq("id", itemId).maybeSingle();
  if (!item) return fail("Item não encontrado.");
  const res = await createCombo({ name: `Presente: ${item.title}`.slice(0, 80), occasionId: null, itemId });
  if (!res.id) return fail("error" in res ? res.error : "Não deu para criar o presente.");
  redirect(`/combos/${res.id}?montar=1`);
}

export async function updateComboMeta(comboId: string, input: { name: string; occasionId: string | null; budget?: string }): Promise<Result> {
  const creatorId = await requireProfileId();
  const parsed = comboMeta.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const budget = parsePrice(parsed.data.budget);
  if (budget === "invalido") return fail("Orçamento inválido. Use um valor como 300.");
  let occasionDate: string | null = null;
  if (parsed.data.occasionId) {
    const { data: occ } = await db().from("occasions").select("month, day").eq("id", parsed.data.occasionId).maybeSingle();
    if (occ) occasionDate = nextOccurrence(occ.month, occ.day, todayInSaoPaulo());
  }
  const { error } = await db().from("combos")
    .update({ name: parsed.data.name, occasion_id: parsed.data.occasionId, occasion_date: occasionDate, budget_cents: budget })
    .eq("id", comboId).eq("creator_id", creatorId);
  if (error) return fail(dbError(error.message));
  refresh();
  return { ok: true };
}

export async function deleteCombo(comboId: string): Promise<Result> {
  const creatorId = await requireProfileId();
  const combo = await ownCombo(comboId, creatorId);
  if (!combo) return fail("Presente não encontrado.");
  if (combo.status === "dado") return fail("Um presente já dado fica no histórico.");
  const { error } = await db().from("combos").delete().eq("id", comboId).eq("creator_id", creatorId);
  if (error) return fail(dbError(error.message));
  redirect("/combos");
}

// ---------- itens do combo ----------
export async function addItemToCombo(comboId: string, itemId: string): Promise<Result> {
  const creatorId = await requireProfileId();
  const combo = await ownCombo(comboId, creatorId);
  if (!combo) return fail("Presente não encontrado.");
  const { data: item } = await db().from("items").select("title, price_cents, owner_id").eq("id", itemId).maybeSingle();
  if (!item || item.owner_id !== combo.recipient_id) return fail("Esse item não é da lista de quem vai ganhar.");
  const { error } = await db().from("combo_items").insert({ combo_id: comboId, item_id: itemId, snapshot_title: item.title, unit_price_cents: item.price_cents });
  if (error) return fail(error.code === "23505" ? "Esse item já está no presente." : dbError(error.message));
  refresh();
  return { ok: true };
}

const extraSchema = z.object({
  title: z.string().trim().min(1, "Dê um nome ao extra.").max(120),
  price: z.string().trim().max(20).optional(),
  url: z.string().trim().max(2000).optional().refine((v) => !v || /^https?:\/\/\S+$/.test(v), "O link precisa começar com https://"),
});

/** RF29: extras (flores, cartão…) só existem no combo. */
export async function addExtra(comboId: string, input: { title: string; price?: string; url?: string }): Promise<Result> {
  const creatorId = await requireProfileId();
  if (!(await ownCombo(comboId, creatorId))) return fail("Presente não encontrado.");
  const parsed = extraSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const price = parsePrice(parsed.data.price);
  if (price === "invalido") return fail("Preço inválido. Use um valor como 58,00.");
  const { error } = await db().from("combo_items").insert({
    combo_id: comboId, is_extra: true, snapshot_title: parsed.data.title, unit_price_cents: price, extra_url: parsed.data.url || null,
  });
  if (error) return fail(dbError(error.message));
  refresh();
  return { ok: true };
}

export async function removeLine(comboId: string, lineId: string): Promise<Result> {
  const creatorId = await requireProfileId();
  if (!(await ownCombo(comboId, creatorId))) return fail("Presente não encontrado.");
  const { error } = await db().from("combo_items").delete().eq("id", lineId).eq("combo_id", comboId);
  if (error) return fail(dbError(error.message));
  refresh();
  return { ok: true };
}

/** RF28: quantidade só em "sempre bem-vindo" e extras (o banco garante). */
export async function setQuantity(comboId: string, lineId: string, quantity: number): Promise<Result> {
  const creatorId = await requireProfileId();
  if (!(await ownCombo(comboId, creatorId))) return fail("Presente não encontrado.");
  const q = Math.max(1, Math.min(99, Math.round(quantity)));
  const { error } = await db().from("combo_items").update({ quantity: q }).eq("id", lineId).eq("combo_id", comboId);
  if (error) return fail(dbError(error.message));
  refresh();
  return { ok: true };
}

/** RF30: "paguei R$ …" substitui o preço na soma. Vazio volta a usar o preço. */
export async function setPaid(comboId: string, lineId: string, value: string): Promise<Result> {
  const creatorId = await requireProfileId();
  if (!(await ownCombo(comboId, creatorId))) return fail("Presente não encontrado.");
  const paid = parsePrice(value);
  if (paid === "invalido") return fail("Valor inválido. Use algo como 179,90.");
  const { error } = await db().from("combo_items").update({ paid_cents: paid }).eq("id", lineId).eq("combo_id", comboId);
  if (error) return fail(dbError(error.message));
  refresh();
  return { ok: true };
}

// ---------- etapas (funções atômicas no banco) ----------
export async function setComboStage(comboId: string, stage: "comprado" | "montado" | "dado"): Promise<Result> {
  const creatorId = await requireProfileId();
  const fn = stage === "comprado" ? "combo_mark_purchased" : stage === "montado" ? "combo_unmark_purchased" : "combo_mark_given";
  const { error } = await db().rpc(fn, { p_combo: comboId, p_creator: creatorId });
  if (error) return fail(dbError(error.message));
  refresh();
  return { ok: true };
}

// ---------- preços atualizados ao montar (RF26) ----------
/** Reconsulta preços antigos (> 24h) dos itens pedidos e atualiza itens e combos montados. */
export async function refreshPrices(itemIds: string[]): Promise<{ updated: Record<string, number> }> {
  const me = await requireProfileId();
  const ids = itemIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id)).slice(0, 10);
  if (!ids.length) return { updated: {} };
  const staleBefore = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data: items } = await db().from("items").select("id, url, price_cents, price_checked_at").in("id", ids).not("url", "is", null)
    .or(`price_checked_at.is.null,price_checked_at.lt.${staleBefore}`);
  if (!items?.length) return { updated: {} };

  const results = await scrapeMany(items.map((i) => i.url));
  const updated: Record<string, number> = {};
  const now = new Date().toISOString();
  await Promise.all(items.map(async (item, i) => {
    const price = results[i]?.priceCents;
    if (price == null) return;
    await db().from("items").update({ price_cents: price, price_checked_at: now }).eq("id", item.id);
    if (price !== item.price_cents) updated[item.id] = price;
  }));
  // combos ainda montados acompanham o preço novo
  for (const [itemId, price] of Object.entries(updated)) {
    const { data: lines } = await db().from("combo_items").select("id, combos!inner(creator_id, status)")
      .eq("item_id", itemId).eq("combos.creator_id", me).eq("combos.status", "montado");
    for (const l of lines ?? []) await db().from("combo_items").update({ unit_price_cents: price }).eq("id", l.id);
  }
  if (Object.keys(updated).length) refresh();
  return { updated };
}

// ---------- aviso vago (RF15) ----------
export async function shouldWaitBeforeOwning(itemId: string): Promise<boolean> {
  const me = await requireProfileId();
  // vale para o grupo todo, sem revelar qual item foi comprado
  const { data: item } = await db().from("items").select("group_id").eq("id", itemId).eq("owner_id", me).maybeSingle();
  if (!item?.group_id) return isReservedByPartner(itemId, me);
  const { data: members } = await db().from("items").select("id").eq("group_id", item.group_id);
  return isReservedByPartner((members ?? []).map((m) => m.id), me);
}
