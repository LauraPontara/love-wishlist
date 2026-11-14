import type { Metadata } from "next";
import { Suspense } from "react";
import { ComboCard } from "@/components/combo-card";
import { NewComboForm } from "@/components/new-combo-form";
import { PageHeader, Sheet } from "@/components/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";
import { countdownLabel, formatDayMonth } from "@/lib/combos/domain";
import { getMyCombos, getOccasions } from "@/lib/combos/queries";

export const metadata: Metadata = { title: "Meus combos · Nossa Wishlist" };

export default function CombosPage() {
  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<><PageHeader title="Meus combos" /><Sheet><p style={{ color: "var(--ink-2)" }}>Carregando…</p></Sheet></>}>
        <Combos />
      </Suspense>
    </main>
  );
}

async function Combos() {
  const user = await getCurrentUser();
  const [combos, occasions] = await Promise.all([getMyCombos(user.id), getOccasions()]);
  const partnerName = user.partner?.displayName ?? "";
  // datas que fazem sentido presentear o outro: as do casal e o aniversário dele(a)
  const giftable = occasions.filter((o) => o.honoreeId === null || o.honoreeId === user.partner?.id)
    .map((o) => ({ id: o.id, name: o.name, label: `${o.name}, ${formatDayMonth(o.nextDate)} (${countdownLabel(o.daysUntil)})` }));

  const active = combos.filter((c) => c.status !== "dado")
    .sort((a, b) => (a.occasionDate ?? "9999").localeCompare(b.occasionDate ?? "9999"));
  const given = combos.filter((c) => c.status === "dado").sort((a, b) => (b.givenAt ?? "").localeCompare(a.givenAt ?? ""));

  return (
    <>
      <PageHeader title="Meus combos" subtitle={`Só você vê os presentes que monta para ${partnerName}.`} />
      <Sheet>
        <div className="flex flex-col gap-6">
          <NewComboForm occasions={giftable} partnerName={partnerName} />
          {active.length > 0 ? (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-extrabold" style={{ fontVariationSettings: "'wdth' 85" }}>Em andamento</h2>
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{active.map((c) => <li key={c.id}><ComboCard combo={c} /></li>)}</ul>
            </section>
          ) : (
            <div className="rounded-[20px] border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}>
              Nenhum presente em andamento. Monte um aqui ou toque em “Dar este” num item da lista {partnerName.endsWith("a") ? "da" : "do"} {partnerName}.
            </div>
          )}
          {given.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="text-xl font-extrabold" style={{ fontVariationSettings: "'wdth' 85" }}>Já dados <span className="text-base" style={{ color: "var(--ink-2)" }}>{given.length}</span></h2>
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{given.map((c) => <li key={c.id}><ComboCard combo={c} /></li>)}</ul>
            </section>
          )}
        </div>
      </Sheet>
    </>
  );
}
