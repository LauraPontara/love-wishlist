import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ListCount, ListLoader } from "@/components/list-loader";
import { PageHeader, Sheet } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeleton";
import { getCurrentUser } from "@/lib/auth/current-user";

export default function PartnerListPage({ params }: PageProps<"/lista/[perfil]">) {
  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<><PageHeader title="Lista" /><Sheet><ListSkeleton tabs={false} /></Sheet></>}>
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
  const article = partner.displayName.endsWith("a") ? "da" : "do";
  return (
    <>
      <PageHeader title={`Lista ${article} ${partner.displayName}`} avatar={partner.avatar}
        subtitle={<ListCount scope="partner" userId={user.id} suffix={["desejo para presentear", "desejos para presentear"]} />} />
      <Sheet>
        <ListLoader scope="partner" userId={user.id} ownerName={partner.displayName} />
      </Sheet>
    </>
  );
}
