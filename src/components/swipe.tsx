"use client";

import { tourSignal } from "./tour/tour";
import { useEffect, useId, useRef, useState, type CSSProperties, type PointerEvent as RPointerEvent, type ReactNode } from "react";

export type SwipeAction = { label: string; icon: ReactNode; onClick: () => void; style: CSSProperties; disabled?: boolean };

const ACTION_W = 84;    // largura de cada ação
const CLOSE_OTHERS = "nw:swipe-open";
export const TOUR_OPEN = "nw:swipe-tour-open";
/** Fecha todos os cartões abertos. */
export const closeAllSwipes = () => { window.dispatchEvent(new CustomEvent(CLOSE_OTHERS, { detail: "" })); };

/**
 * Desliza o conteúdo para a esquerda e revela ações por trás (dedo ou mouse).
 * Pelo teclado: Tab chega nas ações e o cartão abre sozinho; Esc fecha.
 */
export function Swipe({ actions, radius = 20, label, children }: { actions: SwipeAction[]; radius?: number | string; label: string; children: ReactNode }) {
  const id = useId();
  const width = actions.length * ACTION_W;
  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startX: number; startY: number; base: number; locked: "x" | "y" | null; moved: boolean; last: number } | null>(null);
  const suppressClick = useRef(false);
  const isOpen = x === -width;

  // só um aberto por vez
  useEffect(() => {
    const onOther = (e: Event) => { if ((e as CustomEvent<string>).detail !== id) setX(0); };
    window.addEventListener(CLOSE_OTHERS, onOther);
    return () => window.removeEventListener(CLOSE_OTHERS, onOther);
  }, [id]);

  const root = useRef<HTMLDivElement>(null);
  // o tutorial pede para abrir o primeiro cartão de uma lista
  useEffect(() => {
    const onTour = (e: Event) => {
      const sel = (e as CustomEvent<string>).detail;
      if (root.current && document.querySelector(`${sel} .swipe`) === root.current) { setX(-width); window.dispatchEvent(new CustomEvent(CLOSE_OTHERS, { detail: id })); }
    };
    window.addEventListener(TOUR_OPEN, onTour);
    return () => window.removeEventListener(TOUR_OPEN, onTour);
  }, [id, width]);

  const open = () => { setX(-width); window.dispatchEvent(new CustomEvent(CLOSE_OTHERS, { detail: id })); tourSignal("swipe-open"); };
  const close = () => setX(0);

  function onPointerDown(e: RPointerEvent) {
    if (e.pointerType === "mouse") return; // deslizar é gesto de toque; no desktop o clique abre os detalhes
    suppressClick.current = false; // o clique de um arraste anterior (se houve) já passou
    drag.current = { startX: e.clientX, startY: e.clientY, base: x, locked: null, moved: false, last: x };
  }
  function onPointerMove(e: RPointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.startX, dy = e.clientY - d.startY;
    if (!d.locked && Math.hypot(dx, dy) > 8) d.locked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
    if (d.locked !== "x") return;
    d.moved = true;
    if (!dragging) { setDragging(true); try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* ponteiro já solto */ } }
    d.last = Math.max(-width - 24, Math.min(0, d.base + dx));
    setX(d.last);
  }
  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    setDragging(false);
    if (d.moved) {
      suppressClick.current = true; // arrastar não conta como toque no cartão
      if (d.last < -width / 3) open(); else close();
    }
  }

  return (
    <div ref={root} className={`swipe ${isOpen ? "is-open" : ""}`} style={{ borderRadius: radius }}>
      <div className="swipe-actions" role="group" aria-label={label} style={{ width, opacity: x === 0 && !dragging ? 0 : 1 }}
        onFocus={open} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) close(); }}>
        {actions.map((a) => (
          <button key={a.label} type="button" style={a.style} disabled={a.disabled}
            onClick={() => { close(); a.onClick(); }}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>
      <div className={`swipe-front ${dragging ? "" : "settle"}`} style={{ translate: `${x}px 0` }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}
        onClickCapture={(e) => {
          if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; return; }
          if (isOpen) { e.preventDefault(); e.stopPropagation(); close(); } // aberto: tocar no cartão só fecha
        }}
        onKeyDown={(e) => { if (e.key === "Escape") close(); }}>
        {children}
      </div>
    </div>
  );
}
