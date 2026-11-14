import Link from "next/link";
import { Suspense } from "react";
import { ItemBrowser } from "@/components/item-browser";
import { PageHeader, Sheet } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMyItems } from "@/lib/items/queries";

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
  const items = await getMyItems(user.id);
  const wishes = items.filter((i) => i.status === "desejado").length;
  return (
    <>
      <PageHeader title="Minha lista" avatar={user.avatar}
        subtitle={`${user.displayName}, ${wishes} ${wishes === 1 ? "desejo" : "desejos"}`}
        action={<Link href="/item/novo" className="btn btn-ribbon">Adicionar item</Link>} />
      <Sheet>
        <ItemBrowser items={items} mode="mine" ownerName={user.displayName} />
      </Sheet>
    </>
  );
}

function Loading() {
  return (
    <>
      <PageHeader title="Minha lista" />
      <Sheet><p style={{ color: "var(--ink-2)" }}>Carregando…</p></Sheet>
    </>
  );
}
