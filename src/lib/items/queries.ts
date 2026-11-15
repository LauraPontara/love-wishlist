import "server-only";
import { db } from "@/lib/db/server";
import type { Category, Item, Kind, Status } from "./domain";

type Row = {
  id: string; owner_id: string; url: string | null; title: string; image_url: string | null;
  price_cents: number | null; price_checked_at: string | null; store: string | null; category: Category;
  variant: Record<string, string> | null; notes: string | null; kind: Kind; status: Status;
  status_changed_at: string | null; created_at: string;
};

const COLUMNS = "id, owner_id, url, title, image_url, price_cents, price_checked_at, store, category, variant, notes, kind, status, status_changed_at, created_at";

export function toItem(r: Row): Item {
  return {
    id: r.id, ownerId: r.owner_id, url: r.url ?? "", title: r.title, imageUrl: r.image_url,
    priceCents: r.price_cents, priceCheckedAt: r.price_checked_at, store: r.store, category: r.category,
    variant: r.variant ?? {}, notes: r.notes, kind: r.kind, status: r.status,
    statusChangedAt: r.status_changed_at, createdAt: r.created_at,
  };
}

/** Todos os itens do próprio usuário (desejos, já tenho e recebidos). */
export async function getMyItems(profileId: string): Promise<Item[]> {
  const { data, error } = await db().from("items").select(COLUMNS).eq("owner_id", profileId).order("created_at", { ascending: false });
  if (error) throw new Error(`itens: ${error.message}`);
  return (data as Row[]).map(toItem);
}

/** Lista do outro (RF19): só o que ainda pode ser dado. Nunca expõe "já tenho" nem recebidos. */
export async function getPartnerItems(partnerId: string): Promise<Item[]> {
  const { data, error } = await db().from("items").select(COLUMNS).eq("owner_id", partnerId).eq("status", "desejado")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`itens: ${error.message}`);
  return (data as Row[]).map(toItem);
}

export async function getOwnItem(id: string, profileId: string): Promise<Item | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await db().from("items").select(COLUMNS).eq("id", id).eq("owner_id", profileId).maybeSingle();
  if (error) throw new Error(`item: ${error.message}`);
  return data ? toItem(data as Row) : null;
}
