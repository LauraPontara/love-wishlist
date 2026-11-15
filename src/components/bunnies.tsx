"use client";

import { useEffect } from "react";

export const BUNNIES_KEY = "nw:bunnies";          // "off" desliga neste aparelho
export const BUNNIES_EVENT = "nw:bunnies";        // detail: "item:salvo" | "combo:dado" | "toggle"

/** Dispara uma reação dos coelhos (RF46). Seguro chamar mesmo com eles desligados. */
export function bunnyCheer(kind: "item:salvo" | "combo:dado") {
  window.dispatchEvent(new CustomEvent(BUNNIES_EVENT, { detail: kind }));
}

/** Os dois coelhinhos passeando pelo app (RF40–RF48). */
export function Bunnies() {
  useEffect(() => {
    let api: { emit: (e: string) => void; setCalm: (on: boolean) => void; setEnabled: (on: boolean) => void; destroy: () => void } | null = null;
    let cancelled = false;
    const enabled = () => { try { return localStorage.getItem(BUNNIES_KEY) !== "off"; } catch { return true; } };
    const small = matchMedia("(max-width: 1023px)");

    const start = async () => {
      if (api || !enabled()) return;
      const { startBunnies } = await import("@/lib/bunnies/bunnies");
      if (cancelled || api) return;
      // pousam em etiquetas, botões, campos e caixas de presente; no celular ficam calmos
      api = startBunnies({ perchSelector: ".tag, .btn:not(.btn-sm), .field, .gift-box", calm: small.matches });
    };
    const onEvent = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail === "toggle") {
        if (enabled()) void start(); else { api?.destroy(); api = null; }
        return;
      }
      api?.emit(detail);
    };
    const onSize = () => api?.setCalm(small.matches);

    void start();
    window.addEventListener(BUNNIES_EVENT, onEvent);
    small.addEventListener("change", onSize);
    return () => {
      cancelled = true;
      window.removeEventListener(BUNNIES_EVENT, onEvent);
      small.removeEventListener("change", onSize);
      api?.destroy();
    };
  }, []);
  return null;
}
