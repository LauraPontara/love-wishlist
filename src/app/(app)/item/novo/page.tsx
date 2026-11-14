import type { Metadata } from "next";
import { createItem } from "@/app/actions/items";
import { ItemForm } from "@/components/item-form";
import { PageHeader, Sheet } from "@/components/page-header";

export const metadata: Metadata = { title: "Adicionar item · Nossa Wishlist" };

// Fase 2: cadastro manual. Na Fase 3 entra "colar vários links" com extração.
export default function NewItemPage() {
  return (
    <main className="flex-1 flex flex-col">
      <PageHeader title="Adicionar item" subtitle="Cole o link e preencha o resto." back={{ href: "/", label: "Minha lista" }} />
      <Sheet>
        <ItemForm action={createItem} />
      </Sheet>
    </main>
  );
}
