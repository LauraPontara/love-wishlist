import type { Metadata } from "next";
import { Suspense } from "react";
import { NewItem } from "@/components/new-item";
import { PageHeader, Sheet } from "@/components/page-header";
import { ListSkeleton } from "@/components/skeleton";

export const metadata: Metadata = { title: "Adicionar · Nossa Wishlist" };
export const maxDuration = 60;

// Entrada do "Compartilhar → Nossa Wishlist" do Android (RF05).
// O link pode vir em `url` ou no meio de `text` (WhatsApp e apps de loja mandam no texto).
export default function SharePage({ searchParams }: PageProps<"/share">) {
  return (
    <main className="flex-1 flex flex-col">
      <PageHeader title="Adicionar" subtitle="Buscando os dados do link que você compartilhou." back={{ href: "/", label: "Minha lista" }} />
      <Sheet>
        <Suspense fallback={<ListSkeleton count={2} />}>
          <Shared searchParams={searchParams} />
        </Suspense>
      </Sheet>
    </main>
  );
}

async function Shared({ searchParams }: { searchParams: PageProps<"/share">["searchParams"] }) {
  const sp = await searchParams;
  const pick = (k: string) => { const v = sp[k]; return Array.isArray(v) ? v.join(" ") : (v ?? ""); };
  const text = [pick("url"), pick("text"), pick("title")].filter(Boolean).join("\n");
  return <NewItem initialText={text} autoFetch />;
}
