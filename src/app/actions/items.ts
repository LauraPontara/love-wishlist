"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfileId } from "@/lib/auth/current-user";
import { db } from "@/lib/db/server";
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
      url: f.url,
      url_normalized: normalizeUrl(f.url)!,
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

export async function createItem(_prev: FormState, formData: FormData): Promise<FormState> {
  const profileId = await requireProfileId();
  const parsed = readForm(formData);
  if (!parsed.success) return fieldErrors(parsed);
  const { price, row } = toRow(parsed);
  if (price === "invalido") return { error: "Confira os campos destacados.", fieldErrors: { price: "Use um valor como 129,90." } };

  const { error } = await db().from("items").insert({ ...row, owner_id: profileId, scrape_status: "manual" });
  if (error) {
    if (error.code === "23505") return { error: DUPLICATE, fieldErrors: { url: DUPLICATE } };
    return { error: "Não deu para salvar agora. Tente de novo." };
  }
  redirect("/");
}

export async function updateItem(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const profileId = await requireProfileId();
  const parsed = readForm(formData);
  if (!parsed.success) return fieldErrors(parsed);
  const { price, row } = toRow(parsed);
  if (price === "invalido") return { error: "Confira os campos destacados.", fieldErrors: { price: "Use um valor como 129,90." } };

  // Itens "sempre bem-vindo" nunca ficam como "já tenho" (RN03)
  const patch: Record<string, unknown> = { ...row };
  if (row.kind === "sempre") Object.assign(patch, { status: "desejado", status_changed_at: null });

  const { error } = await db().from("items").update(patch).eq("id", id).eq("owner_id", profileId);
  if (error) {
    if (error.code === "23505") return { error: DUPLICATE, fieldErrors: { url: DUPLICATE } };
    return { error: "Não deu para salvar agora. Tente de novo." };
  }
  redirect("/");
}

/** RF14: "Já tenho" (e desfazer). Só para itens únicos. */
export async function setOwned(id: string, owned: boolean): Promise<{ ok: boolean; error?: string }> {
  const profileId = await requireProfileId();
  const { error } = await db().from("items")
    .update(owned ? { status: "ja_tenho", status_changed_at: new Date().toISOString() } : { status: "desejado", status_changed_at: null })
    .eq("id", id).eq("owner_id", profileId).eq("kind", "unico");
  if (error) return { ok: false, error: "Não deu para atualizar agora." };
  refresh();
  return { ok: true };
}

/** RF13: exclui e devolve a linha para o "desfazer" poder restaurar com o mesmo id. */
export async function deleteItem(id: string): Promise<{ ok: boolean; snapshot?: Record<string, unknown> }> {
  const profileId = await requireProfileId();
  const { data, error } = await db().from("items").delete().eq("id", id).eq("owner_id", profileId).select("*").maybeSingle();
  if (error || !data) return { ok: false };
  refresh();
  return { ok: true, snapshot: data };
}

export async function restoreItem(snapshot: Record<string, unknown>): Promise<{ ok: boolean }> {
  const profileId = await requireProfileId();
  if (snapshot.owner_id !== profileId) return { ok: false };
  const { error } = await db().from("items").insert(snapshot);
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}
