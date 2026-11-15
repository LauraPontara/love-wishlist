import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Heart } from "@/components/heart";
import { OccasionList } from "@/components/occasion-manager";
import { PageHeader, Sheet } from "@/components/page-header";
import { DatesSkeleton } from "@/components/skeleton";
import { getCurrentUser } from "@/lib/auth/current-user";
import { countdownLabel, formatDayMonth } from "@/lib/combos/domain";
import { getMyCombos, getOccasions } from "@/lib/combos/queries";

export const metadata: Metadata = { title: "Nossas datas · Nossa Wishlist" };

export default function DatesPage() {
  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<><PageHeader title="Nossas datas" /><Sheet><DatesSkeleton /></Sheet></>}>
        <Dates />
      </Suspense>
    </main>
  );
}

const STAGE: Record<string, string> = { montado: "Seu presente está montado", comprado: "Seu presente está comprado", dado: "Presente dado" };

async function Dates() {
  const user = await getCurrentUser();
  const [occasions, combos] = await Promise.all([getOccasions(), getMyCombos(user.id)]);
  const people = [{ id: user.id, displayName: user.displayName, avatar: user.avatar }, ...(user.partner ? [user.partner] : [])];
  const next = occasions[0];

  const statusFor = (o: (typeof occasions)[number]) => {
    if (o.honoreeId === user.id) return `Só ${user.partner?.displayName ?? "o outro"} vê os presentes ${user.partner?.displayName.endsWith("a") ? "dela" : "dele"}`;
    const combo = combos.find((c) => c.occasionId === o.id && c.occasionDate === o.nextDate);
    return combo ? STAGE[combo.status] : "Nenhum presente montado ainda";
  };

  return (
    <>
      <PageHeader title="Nossas datas" subtitle="Lembrete 7 dias antes de cada uma." />
      <Sheet>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-start">
          {next && (
            <section className="relative isolate overflow-hidden rounded-[24px] border-2 p-6 sm:p-8 grid grid-cols-[1fr_auto] items-center gap-4 lg:sticky lg:top-6"
              style={{ background: "var(--surface)", borderColor: "var(--line)" }} aria-label="Próxima data">
              <Heart className="beat absolute -right-6 top-1/2 -translate-y-1/2 w-[200px] h-[190px] -z-10 opacity-90" blur={6} />
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--ink-2)" }}>Próxima data</p>
                <h2 className="display text-[2rem] sm:text-[2.4rem] mt-1">{next.name}</h2>
                <p className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>{formatDayMonth(next.nextDate)}</p>
                <p className="text-sm font-semibold mt-3">{statusFor(next)}</p>
                {next.honoreeId !== user.id && <Link href="/combos" className="btn btn-ribbon btn-sm mt-4">Ver presentes</Link>}
              </div>
              <div className="text-center text-white [text-shadow:0_2px_10px_rgba(28,26,74,.35)]">
                <b className="display block text-[3.2rem] sm:text-[4rem]">{next.daysUntil}</b>
                <span className="text-sm font-bold">{next.daysUntil === 1 ? "dia" : "dias"}</span>
              </div>
            </section>
          )}

          <section aria-label="Todas as datas">
            <OccasionList people={people} occasions={occasions.map((o) => ({
              id: o.id, name: o.name, kind: o.kind, month: o.month, day: o.day, honoreeId: o.honoreeId,
              countdown: countdownLabel(o.daysUntil).replace(/^./, (c) => c.toUpperCase()), status: statusFor(o),
            }))} />
          </section>
        </div>
      </Sheet>
    </>
  );
}
