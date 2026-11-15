"use client";

import { QueryClient, useQueryClient } from "@tanstack/react-query";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { MotionConfig } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";

const DAY = 24 * 60 * 60 * 1000;
const SEEN_KEY = "nw:v-seen";

/**
 * Cache dos dados do app (TanStack Query), guardado no aparelho:
 * abrir uma lista já visitada é instantâneo, e ela se atualiza em segundo plano.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 2 * 60 * 1000, gcTime: DAY, refetchOnWindowFocus: true, retry: 1 } },
  }));
  const [persister] = useState(() => createSyncStoragePersister({
    storage: typeof window === "undefined" ? undefined : window.localStorage,
    key: "nw:cache",
  }));
  return (
    <PersistQueryClientProvider client={client} persistOptions={{ persister, maxAge: DAY, buster: "1" }}>
      <ListsVersionWatcher />
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </PersistQueryClientProvider>
  );
}

/**
 * Toda ação que mexe em itens ou presentes grava a hora no cookie "nw-v" (bumpLists no servidor).
 * Se alguma lista em cache é mais velha que isso, ela se atualiza. Ler o cookie não faz requisição.
 */
function ListsVersionWatcher() {
  const client = useQueryClient();
  useEffect(() => {
    const check = () => {
      const v = Number(document.cookie.match(/(?:^|; )nw-v=(\d+)/)?.[1] ?? 0);
      let seen = 0;
      try { seen = Number(localStorage.getItem(SEEN_KEY) ?? 0); } catch {}
      if (!v || v <= seen) return;
      // compara versões do servidor entre si (nunca com o relógio do aparelho, que pode estar adiantado/atrasado)
      try { localStorage.setItem(SEEN_KEY, String(v)); } catch {}
      client.invalidateQueries({ queryKey: ["list"] });
    };
    check();
    const t = setInterval(check, 1000);
    const onVis = () => { if (document.visibilityState === "visible") check(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", onVis); };
  }, [client]);
  return null;
}
