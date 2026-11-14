import type { Metadata } from "next";
import { NewItem } from "@/components/new-item";
import { PageHeader, Sheet } from "@/components/page-header";

export const metadata: Metadata = { title: "Adicionar · Nossa Wishlist" };
export const maxDuration = 60; // "Salvar todos" pode salvar vários itens

export default function NewItemPage() {
  return (
    <main className="flex-1 flex flex-col">
      <PageHeader title="Adicionar" subtitle="Cole um ou vários links. A gente busca nome, foto e preço." back={{ href: "/", label: "Minha lista" }} />
      <Sheet>
        <NewItem />
      </Sheet>
    </main>
  );
}
