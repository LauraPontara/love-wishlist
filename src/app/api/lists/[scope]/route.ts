import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMyActiveComboItemIds, getMyPurchasedItemIds, getReceivedGifts } from "@/lib/combos/queries";
import { getMyItems, getPartnerItems } from "@/lib/items/queries";

/**
 * Dados das listas para o cache do app (TanStack Query).
 * "mine": meus itens + presentes que ganhei. "partner": desejos do outro + o que eu já comprei/pus em presentes.
 */
export async function GET(_req: Request, { params }: RouteContext<"/api/lists/[scope]">) {
  const { scope } = await params;
  const user = await getCurrentUser();
  const headers = { "cache-control": "private, no-store" };

  if (scope === "mine") {
    const [items, gifts] = await Promise.all([getMyItems(user.id), getReceivedGifts(user.id)]);
    return NextResponse.json({ items, gifts }, { headers });
  }
  if (scope === "partner" && user.partner) {
    const [items, purchased, inCombos] = await Promise.all([
      getPartnerItems(user.partner.id), getMyPurchasedItemIds(user.id), getMyActiveComboItemIds(user.id),
    ]);
    return NextResponse.json({ items, purchased: [...purchased], inCombos: [...inCombos] }, { headers });
  }
  return NextResponse.json({ error: "lista não encontrada" }, { status: 404, headers });
}
