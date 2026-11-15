"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

export type ConfirmOptions = {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
};

type Pending = ConfirmOptions & { resolve: (ok: boolean) => void };
const Ctx = createContext<((o: ConfirmOptions) => Promise<boolean>) | null>(null);

/** Diálogo de confirmação no visual do app (no lugar do confirm() do navegador). */
export function useConfirm() {
  const ask = useContext(Ctx);
  if (!ask) throw new Error("useConfirm precisa estar dentro de <ConfirmProvider>");
  return ask;
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const ask = useCallback((o: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ ...o, resolve })), []);
  const close = (ok: boolean) => { pending?.resolve(ok); setPending(null); };
  return (
    <Ctx value={ask}>
      {children}
      {pending && <ConfirmDialog {...pending} onClose={close} />}
    </Ctx>
  );
}

function ConfirmDialog({ title, body, confirmLabel = "Confirmar", cancelLabel = "Cancelar", tone = "default", onClose }: ConfirmOptions & { onClose: (ok: boolean) => void }) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previous = useRef<Element | null>(null);

  useEffect(() => {
    previous.current = document.activeElement;
    cancelRef.current?.focus(); // ação segura em foco (Enter não exclui sem querer)
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(false); };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      (previous.current as HTMLElement | null)?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] grid items-end sm:place-items-center p-0 sm:p-4 confirm-backdrop" style={{ background: "rgba(10,8,30,.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(false); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby={body ? "confirm-body" : undefined}
        className="confirm-sheet w-full sm:max-w-[420px] rounded-t-[28px] sm:rounded-[28px] p-6 pb-[max(24px,env(safe-area-inset-bottom))] flex flex-col gap-4 border-2"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <div className="flex items-start gap-3">
          <span aria-hidden="true" className="w-11 h-11 shrink-0 rounded-2xl grid place-items-center text-xl"
            style={{ background: tone === "danger" ? "var(--error-bg)" : "var(--badge-info)" }}>
            {tone === "danger" ? "🗑️" : "💭"}
          </span>
          <div className="min-w-0">
            <h2 id="confirm-title" className="text-xl font-extrabold leading-tight" style={{ fontVariationSettings: "'wdth' 85" }}>{title}</h2>
            {body && <div id="confirm-body" className="mt-1 leading-relaxed" style={{ color: "var(--ink-2)" }}>{body}</div>}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-1">
          <button ref={cancelRef} type="button" className="btn btn-ghost w-full order-2 sm:order-1" onClick={() => onClose(false)}>{cancelLabel}</button>
          <button type="button" className={`btn w-full order-1 sm:order-2 ${tone === "danger" ? "btn-danger" : "btn-primary"}`} onClick={() => onClose(true)}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
