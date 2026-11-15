"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import type { Item } from "@/lib/items/domain";
import { ItemBrowser, type Gift } from "./item-browser";
import { ListSkeleton } from "./skeleton";

export type MineData = { items: Item[]; gifts: Record<string, Gift> };
export type PartnerData = { items: Item[]; purchased: string[]; inCombos: string[] };

export const listKey = (scope: "mine" | "partner", userId: string) => ["list", scope, userId] as const;

async function fetchList<T>(scope: string): Promise<T> {
  const res = await fetch(`/api/lists/${scope}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Não deu para carregar a lista.");
  return res.json();
}

export function useList<T>(scope: "mine" | "partner", userId: string) {
  return useQuery({ queryKey: listKey(scope, userId), queryFn: () => fetchList<T>(scope) });
}

/** Lista com cache: mostra na hora o que já está guardado e atualiza em segundo plano. */
export function ListLoader({ scope, userId, ownerName }: { scope: "mine" | "partner"; userId: string; ownerName: string }) {
  const q = useList<MineData & PartnerData>(scope, userId);
  return (
    <AnimatePresence mode="wait" initial={false}>
      {q.data ? (
        <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          {scope === "mine"
            ? <ItemBrowser items={q.data.items} mode="mine" ownerName={ownerName} gifts={q.data.gifts} queryKey={listKey(scope, userId)} />
            : <ItemBrowser items={q.data.items} mode="partner" ownerName={ownerName} purchasedByMe={q.data.purchased} inMyCombos={q.data.inCombos} queryKey={listKey(scope, userId)} />}
        </motion.div>
      ) : q.isError ? (
        <motion.p key="err" className="rounded-xl px-4 py-3 font-semibold" style={{ background: "var(--error-bg)", color: "var(--error-ink)" }}>
          Não deu para carregar a lista. <button className="underline font-extrabold" onClick={() => q.refetch()}>Tentar de novo</button>
        </motion.p>
      ) : (
        <motion.div key="skeleton" exit={{ opacity: 0, transition: { duration: 0.15 } }}>
          <ListSkeleton tabs={scope === "mine"} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Contagem do cabeçalho, lida do mesmo cache da lista. */
export function ListCount({ scope, userId, prefix = "", suffix }: { scope: "mine" | "partner"; userId: string; prefix?: string; suffix: [string, string] }) {
  const q = useList<MineData>(scope, userId);
  if (!q.data) return <>{prefix}…</>;
  const n = scope === "mine" ? q.data.items.filter((i) => i.status === "desejado").length : q.data.items.length;
  return <>{prefix}{n} {n === 1 ? suffix[0] : suffix[1]}</>;
}
