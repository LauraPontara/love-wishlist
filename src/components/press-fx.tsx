"use client";

import { useEffect } from "react";

const SELECTOR = ".btn-primary, .btn-ribbon, .btn-danger";
const MIN_PRESS = 130; // ms: mesmo num toque rapidinho o botão chega a afundar

/**
 * Afunda os botões 3D de verdade. O :active do navegador dura poucos ms num toque
 * (e no iPhone às vezes nem aparece), então o app controla a classe .is-pressed.
 */
export function PressFx() {
  useEffect(() => {
    let current: HTMLElement | null = null;
    let since = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const press = (el: HTMLElement) => {
      clearTimeout(timer);
      current?.classList.remove("is-pressed");
      current = el; since = performance.now();
      el.classList.add("is-pressed");
    };
    const release = () => {
      const el = current;
      if (!el) return;
      const wait = Math.max(0, MIN_PRESS - (performance.now() - since));
      timer = setTimeout(() => { el.classList.remove("is-pressed"); if (current === el) current = null; }, wait);
    };
    const target = (e: Event) => {
      const el = (e.target as Element | null)?.closest?.(SELECTOR) as HTMLElement | null;
      return el && !(el as HTMLButtonElement).disabled ? el : null;
    };

    const onDown = (e: PointerEvent) => { if (e.button === 0) { const el = target(e); if (el) press(el); } };
    const onKeyDown = (e: KeyboardEvent) => { if ((e.key === "Enter" || e.key === " ") && !e.repeat) { const el = target(e); if (el) press(el); } };
    // arrastou o dedo para fora (rolagem): solta sem esperar
    const onCancel = () => { if (current) { clearTimeout(timer); current.classList.remove("is-pressed"); current = null; } };

    addEventListener("pointerdown", onDown, { passive: true });
    addEventListener("pointerup", release, { passive: true });
    addEventListener("pointercancel", onCancel, { passive: true });
    addEventListener("keydown", onKeyDown);
    addEventListener("keyup", release);
    addEventListener("blur", onCancel);
    return () => {
      removeEventListener("pointerdown", onDown);
      removeEventListener("pointerup", release);
      removeEventListener("pointercancel", onCancel);
      removeEventListener("keydown", onKeyDown);
      removeEventListener("keyup", release);
      removeEventListener("blur", onCancel);
      clearTimeout(timer);
    };
  }, []);
  return null;
}
