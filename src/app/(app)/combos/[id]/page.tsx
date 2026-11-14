import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ComboEditor } from "@/components/combo-editor";
import { PageHeader, Sheet } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";
import { countdownLabel, formatDayMonth } from "@/lib/combos/domain";
import { getMyCombo, getMyPurchasedItemIds, getOccasions } from "@/lib/combos/queries";
import { getPartnerItems } from "@/lib/items/queries";

export const maxDuration = 60; // a atualização de preços roda nas ações desta página

export default function ComboPage({ params }: PageProps<"/combos/[id]">) {
  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<><PageHeader title="Montar presente" back={{ href: "/combos", label: "Meus combos" }} /><Sheet><p style={{ color: "var(--ink-2)" }}>Carregando…</p></Sheet></>}>
        <ComboView params={params} />
      </Suspense>
    </main>
  );
}

async function ComboView({ params }: { params: PageProps<"/combos/[id]">["params"] }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const combo = await getMyCombo(id, user.id);
  if (!combo || !user.partner) notFound();
  const [available, purchased, occasions] = await Promise.all([
    getPartnerItems(combo.recipientId), getMyPurchasedItemIds(user.id), getOccasions(),
  ]);
  // itens deste combo não contam como "comprado em outro presente"
  const inThis = new Set(combo.lines.map((l) => l.itemId));
  const elsewhere = [...purchased].filter((itemId) => !inThis.has(itemId));
  const giftable = occasions.filter((o) => o.honoreeId === null || o.honoreeId === user.partner!.id)
    .map((o) => ({ id: o.id, name: o.name, label: `${o.name}, ${formatDayMonth(o.nextDate)} (${countdownLabel(o.daysUntil)})` }));

  return (
    <>
      <PageHeader title={combo.status === "dado" ? "Presente dado" : "Montar presente"} avatar={user.partner.avatar}
        subtitle={`Para ${user.partner.displayName}. Só você vê.`} back={{ href: "/combos", label: "Meus combos" }} />
      <Sheet>
        <ComboEditor combo={combo} available={available} purchasedElsewhere={elsewhere} occasions={giftable} recipientName={user.partner.displayName} />
      </Sheet>
    </>
  );
}
