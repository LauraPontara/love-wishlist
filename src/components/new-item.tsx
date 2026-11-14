"use client";

import { useState } from "react";
import { createItem } from "@/app/actions/items";
import { ItemForm } from "./item-form";
import { PasteLinks } from "./paste-links";

/** Adicionar: "Colar links" (padrão, Fase 3) ou "Preencher à mão". */
export function NewItem() {
  const [mode, setMode] = useState<"links" | "manual">("links");
  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" aria-label="Como adicionar" className="grid grid-cols-2 p-1 rounded-full max-w-[420px]" style={{ background: "var(--surface-sunk)" }}>
        {([["links", "Colar links"], ["manual", "Preencher à mão"]] as const).map(([m, label]) => (
          <button key={m} role="tab" aria-selected={mode === m} onClick={() => setMode(m)} className="rounded-full py-2 text-[.92rem] font-bold"
            style={mode === m ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 2px 6px rgba(28,26,74,.12)" } : { color: "var(--ink-2)" }}>
            {label}
          </button>
        ))}
      </div>
      {mode === "links" ? <PasteLinks onManual={() => setMode("manual")} /> : <ItemForm action={createItem} />}
    </div>
  );
}
