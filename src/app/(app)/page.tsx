import Link from "next/link";
import { Suspense } from "react";
import { ListCount, ListLoader } from "@/components/list-loader";
import { PlusIcon } from "@/components/icons";
import { PageHeader, Sheet } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeleton";
import { getCurrentUser } from "@/lib/auth/current-user";

export default function MyListPage() {
  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<Loading />}>
        <MyList />
      </Suspense>
    </main>
  );
}

async function MyList() {
  const user = await getCurrentUser();
  return (
    <>
      <PageHeader title="Minha lista" avatar={user.avatar}
        subtitle={<ListCount scope="mine" userId={user.id} prefix={`${user.displayName}, `} suffix={["desejo", "desejos"]} />}
        action={<Link href="/item/novo" className="btn btn-ribbon"><PlusIcon /> Adicionar item</Link>} />
      <Sheet>
        <ListLoader scope="mine" userId={user.id} ownerName={user.displayName} />
      </Sheet>
    </>
  );
}

function Loading() {
  return (
    <>
      <PageHeader title="Minha lista" />
      <Sheet><ListSkeleton /></Sheet>
    </>
  );
}
