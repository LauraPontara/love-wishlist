import { notFound } from "next/navigation";
import { Suspense } from "react";
import { updateItem } from "@/app/actions/items";
import { ItemForm } from "@/components/item-form";
import { PageHeader, Sheet } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeleton";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getMyGroups, getMyItems, getOwnItem } from "@/lib/items/queries";

export default function EditItemPage({ params }: PageProps<"/item/[id]">) {
  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<><PageHeader title="Editar item" back={{ href: "/", label: "Minha lista" }} /><Sheet><ListSkeleton /></Sheet></>}>
        <EditItem params={params} />
      </Suspense>
    </main>
  );
}

async function EditItem({ params }: { params: PageProps<"/item/[id]">["params"] }) {
  const { id } = await params;
  const user = await getCurrentUser();
  const [item, groups, mine] = await Promise.all([getOwnItem(id, user.id), getMyGroups(user.id), getMyItems(user.id)]);
  if (!item) notFound();
  // opções para criar um grupo novo junto com este item
  const partners = mine.filter((i) => i.id !== item.id && i.kind === "unico" && i.status === "desejado" && !i.group).map((i) => ({ id: i.id, title: i.title }));
  const status = item.status === "ja_tenho" ? "Está em \"Já tenho\"" : item.status === "recebido" ? "Recebido de presente" : undefined;
  return (
    <>
      <PageHeader title="Editar item" subtitle={status} back={{ href: "/", label: "Minha lista" }} />
      <Sheet>
        <ItemForm action={updateItem.bind(null, item.id)} item={item} groups={groups} groupCandidates={partners} />
      </Sheet>
    </>
  );
}
