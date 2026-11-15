import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ItemBrowser } from "@/components/item-browser";
import { PageHeader, Sheet } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeleton";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMyActiveComboItemIds, getMyPurchasedItemIds } from "@/lib/combos/queries";
import { getPartnerItems } from "@/lib/items/queries";

export default function PartnerListPage({ params }: PageProps<"/lista/[perfil]">) {
  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<><PageHeader title="Lista" /><Sheet><ListSkeleton /></Sheet></>}>
        <PartnerList params={params} />
      </Suspense>
    </main>
  );
}

async function PartnerList({ params }: { params: PageProps<"/lista/[perfil]">["params"] }) {
  const { perfil } = await params;
  const user = await getCurrentUser();
  // só existe a lista do outro: a própria fica em "/"
  if (!user.partner || user.partner.id !== perfil) notFound();
  const partner = user.partner;
  const [items, purchased, inCombos] = await Promise.all([getPartnerItems(partner.id), getMyPurchasedItemIds(user.id), getMyActiveComboItemIds(user.id)]);
  const article = partner.displayName.endsWith("a") ? "da" : "do";
  return (
    <>
      <PageHeader title={`Lista ${article} ${partner.displayName}`} avatar={partner.avatar}
        subtitle={`${items.length} ${items.length === 1 ? "desejo" : "desejos"} para presentear`} />
      <Sheet>
        <ItemBrowser items={items} mode="partner" ownerName={partner.displayName} purchasedByMe={[...purchased]} inMyCombos={[...inCombos]} />
      </Sheet>
    </>
  );
}
