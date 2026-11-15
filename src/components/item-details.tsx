"use client";

import { motion } from "motion/react";
import { useEffect, useRef } from "react";
import { CATEGORY_EMOJI, formatPrice, type Item } from "@/lib/items/domain";
import { CloseIcon, ExternalIcon, StarIcon } from "./icons";

/**
 * Detalhes de um item da lista do outro: foto, preço, opção (cor, tamanho…), loja, observações,
 * o link da loja e o "Dar este". No celular sobe de baixo; no desktop abre no centro.
 */
export function ItemDetails({ item, ownerName, bought, inMyGift, pending, onGive, onClose }: {
  item: Item; ownerName: string; bought: boolean; inMyGift: boolean; pending: boolean;
  onGive: () => void; onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const before = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); before?.focus?.(); };
  }, [onClose]);

  const variant = Object.entries(item.variant).filter(([, v]) => v);
  const article = ownerName.endsWith("a") ? "da" : "do";

  return (
    <div className="fixed inset-0 z-[80] grid items-end sm:place-items-center sm:p-4 confirm-backdrop" style={{ background: "rgba(10,8,30,.6)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <motion.div role="dialog" aria-modal="true" aria-labelledby="item-details-title" data-tour="item-details"
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.3, ease: [0.34, 1.3, 0.64, 1] }}
        className="w-full sm:max-w-[460px] max-h-[92dvh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] border-2 flex flex-col"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <div className="relative">
          <div className="h-[200px] sm:h-[220px] grid place-items-center overflow-hidden rounded-t-[26px]" style={{ background: "var(--bg)" }}>
            {item.imageUrl
              ? <img src={item.imageUrl} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              : <span className="text-[72px]" aria-hidden="true">{CATEGORY_EMOJI[item.category]}</span>}
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fechar" title="Fechar"
            className="absolute top-3 right-3 w-10 h-10 rounded-full grid place-items-center shadow-md" style={{ background: "var(--surface)", color: "var(--ink)" }}>
            <CloseIcon />
          </button>
        </div>

        <div className="p-5 sm:p-6 pb-[max(20px,env(safe-area-inset-bottom))] flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 id="item-details-title" className="text-xl font-extrabold leading-tight" style={{ fontVariationSettings: "'wdth' 85" }}>{item.title}</h2>
              <p className="text-sm mt-1" style={{ color: "var(--ink-2)" }}>
                {[item.store, `${CATEGORY_EMOJI[item.category]} ${item.category}`].filter(Boolean).join(" · ")}
              </p>
            </div>
            <strong className="text-[1.5rem] font-extrabold whitespace-nowrap leading-none" style={{ fontVariationSettings: "'wdth' 80", color: item.priceCents === null ? "var(--ink-2)" : undefined }}>
              {formatPrice(item.priceCents)}
            </strong>
          </div>

          <div className="flex flex-wrap gap-1.5">
            <span className={`badge ${item.kind === "sempre" ? "sempre" : ""}`}>{item.kind === "sempre" ? "Sempre bem-vindo: pode ganhar mais de uma vez" : "Único: basta ganhar uma vez"}</span>
            {item.group && <span className="badge inline-flex items-center gap-1">{item.group.preferred && <StarIcon filled size={14} />}Quero um desses: {item.group.name}</span>}
            {bought && <span className="badge">Você já comprou</span>}
            {!bought && inMyGift && <span className="badge">Já está no seu presente</span>}
          </div>

          {variant.length > 0 && (
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-2xl p-3.5" style={{ background: "var(--bg)" }}>
              {variant.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-sm font-bold capitalize" style={{ color: "var(--ink-2)" }}>{k}</dt>
                  <dd className="text-sm font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {item.notes && (
            <section className="rounded-2xl p-3.5 border-2 border-dashed" style={{ borderColor: "var(--line)" }}>
              <h3 className="text-xs font-bold mb-1" style={{ color: "var(--ink-2)" }}>Observação {article} {ownerName}</h3>
              <p className="text-[.95rem] leading-relaxed whitespace-pre-line">{item.notes}</p>
            </section>
          )}

          <div className="grid gap-2 sm:grid-cols-2 pt-1">
            {item.url
              ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="btn btn-soft"><ExternalIcon /> Abrir na loja</a>
              : <span className="text-sm self-center" style={{ color: "var(--ink-2)" }}>Sem link da loja</span>}
            {!bought && (
              <button type="button" className="btn btn-primary" disabled={pending} onClick={onGive}>Dar este</button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
