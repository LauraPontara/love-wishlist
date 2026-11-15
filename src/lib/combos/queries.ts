import "server-only";
import { db } from "@/lib/db/server";
import { daysBetween, nextOccurrence, todayInSaoPaulo, type Combo, type ComboLine, type ComboStatus } from "./domain";

type LineRow = {
  id: string; item_id: string | null; is_extra: boolean; snapshot_title: string; extra_url: string | null;
  quantity: number; unit_price_cents: number | null; paid_cents: number | null; created_at: string;
  items: { url: string; image_url: string | null; category: string; kind: "unico" | "sempre"; status: "desejado" | "ja_tenho" | "recebido" } | null;
};
type ComboRow = {
  id: string; recipient_id: string; name: string; occasion_id: string | null; occasion_date: string | null;
  budget_cents: number | null; status: ComboStatus; purchased_at: string | null; given_at: string | null; created_at: string;
  occasions: { name: string } | null;
  combo_items: LineRow[];
};

const SELECT = `id, recipient_id, name, occasion_id, occasion_date, budget_cents, status, purchased_at, given_at, created_at,
  occasions ( name ),
  combo_items ( id, item_id, is_extra, snapshot_title, extra_url, quantity, unit_price_cents, paid_cents, created_at,
    items ( url, image_url, category, kind, status ) )`;

function toCombo(r: ComboRow): Combo {
  const lines: ComboLine[] = [...r.combo_items]
    .sort((a, b) => Number(a.is_extra) - Number(b.is_extra) || a.created_at.localeCompare(b.created_at))
    .map((l) => ({
      id: l.id, itemId: l.item_id, isExtra: l.is_extra, title: l.snapshot_title,
      url: l.items?.url ?? l.extra_url, imageUrl: l.items?.image_url ?? null,
      category: l.items?.category ?? null, kind: l.is_extra ? null : (l.items?.kind ?? null),
      itemStatus: l.items?.status ?? null, quantity: l.quantity, unitPriceCents: l.unit_price_cents, paidCents: l.paid_cents,
    }));
  return {
    id: r.id, recipientId: r.recipient_id, name: r.name, occasionId: r.occasion_id, occasionName: r.occasions?.name ?? null,
    occasionDate: r.occasion_date, budgetCents: r.budget_cents, status: r.status,
    purchasedAt: r.purchased_at, givenAt: r.given_at, lines,
  };
}

/** RN02: só os combos que a própria pessoa montou. */
export async function getMyCombos(creatorId: string): Promise<Combo[]> {
  const { data, error } = await db().from("combos").select(SELECT).eq("creator_id", creatorId).order("created_at", { ascending: false });
  if (error) throw new Error(`combos: ${error.message}`);
  return (data as unknown as ComboRow[]).map(toCombo);
}

export async function getMyCombo(id: string, creatorId: string): Promise<Combo | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await db().from("combos").select(SELECT).eq("id", id).eq("creator_id", creatorId).maybeSingle();
  if (error) throw new Error(`combo: ${error.message}`);
  return data ? toCombo(data as unknown as ComboRow) : null;
}

/** RF21: ids de itens que EU já comprei (estão nos meus combos comprados). */
export async function getMyPurchasedItemIds(creatorId: string): Promise<Set<string>> {
  const { data, error } = await db().from("combo_items").select("item_id, combos!inner(creator_id, status)")
    .eq("combos.creator_id", creatorId).eq("combos.status", "comprado").not("item_id", "is", null);
  if (error) throw new Error(`reservas: ${error.message}`);
  return new Set((data ?? []).map((r) => r.item_id as string));
}

/** RF15: o item está em algum combo comprado do OUTRO? Só devolve sim/não (RN01). */
export async function isReservedByPartner(itemId: string, ownerId: string): Promise<boolean> {
  const { count, error } = await db().from("combo_items").select("id, combos!inner(recipient_id, status)", { count: "exact", head: true })
    .eq("item_id", itemId).eq("combos.recipient_id", ownerId).eq("combos.status", "comprado");
  if (error) throw new Error(`reserva: ${error.message}`);
  return (count ?? 0) > 0;
}

export type GiftInfo = { times: number; lastAt: string; fromName: string };

/** RF16/RF17: presentes recebidos por item (só combos DADOS; nada de combos em andamento). */
export async function getReceivedGifts(recipientId: string): Promise<Record<string, GiftInfo>> {
  const { data, error } = await db().from("combo_items")
    .select("item_id, combos!inner(recipient_id, status, given_at, creator:profiles!combos_creator_id_fkey(display_name))")
    .eq("combos.recipient_id", recipientId).eq("combos.status", "dado").not("item_id", "is", null);
  if (error) throw new Error(`recebidos: ${error.message}`);
  const out: Record<string, GiftInfo> = {};
  for (const r of (data ?? []) as unknown as Array<{ item_id: string; combos: { given_at: string; creator: { display_name: string } | null } }>) {
    const prev = out[r.item_id];
    const at = r.combos.given_at;
    out[r.item_id] = {
      times: (prev?.times ?? 0) + 1,
      lastAt: !prev || at > prev.lastAt ? at : prev.lastAt,
      fromName: r.combos.creator?.display_name ?? "",
    };
  }
  return out;
}

// ---------- calendário ----------
export type Occasion = {
  id: string; name: string; kind: string; month: number; day: number; honoreeId: string | null;
  nextDate: string; daysUntil: number;
};

export async function getOccasions(): Promise<Occasion[]> {
  const { data, error } = await db().from("occasions").select("id, name, kind, month, day, honoree_id");
  if (error) throw new Error(`datas: ${error.message}`);
  const today = todayInSaoPaulo();
  return (data ?? [])
    .map((o) => {
      const nextDate = nextOccurrence(o.month, o.day, today);
      return { id: o.id, name: o.name, kind: o.kind, month: o.month, day: o.day, honoreeId: o.honoree_id, nextDate, daysUntil: daysBetween(today, nextDate) };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
}
