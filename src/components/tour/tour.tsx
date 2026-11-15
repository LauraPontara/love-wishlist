"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { HelpIcon } from "../icons";
import { closeAllSwipes, TOUR_OPEN } from "../swipe";
import { lessonsFor, type Gesture, type Lesson, type Step } from "./lessons";

/**
 * Tutorial em "rascunho": a tela escurece um pouco, uma caneta rosa contorna o que importa,
 * a frase aparece escrita à mão e uma mãozinha mostra o gesto. Nunca trava: a página continua
 * usável por baixo, e "Pular" / "Próximo" ficam sempre visíveis.
 */

const SIGNAL = "nw:tour";
const SEEN_KEY = "nw:tour-seen";
/** O tutorial pediu para continuar na próxima tela (ex.: Editar presente → tutorial de montar). */
const CONTINUE_KEY = "nw:tour-continue";

/** As telas avisam o tutorial quando a pessoa faz o gesto ("swipe-open", "grouping-on"...). */
export function tourSignal(name: string) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SIGNAL, { detail: name }));
}

type Ctx = { screens: string[]; register: (id: string) => () => void; start: (lessons: Lesson[]) => void; running: boolean; ready: boolean };
const TourCtx = createContext<Ctx | null>(null);

function readSeen(): string[] {
  try { return JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]"); } catch { return []; }
}
function writeSeen(list: string[]) {
  try { localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set(list)])); } catch {}
}
/** Guarda no aparelho (rápido) e na conta (vale em qualquer aparelho e navegador). */
function markSeen(id: string) {
  writeSeen([...readSeen(), id]);
  fetch("/api/tours", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seen: [id] }), keepalive: true }).catch(() => {});
}
const isMouse = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export function TourProvider({ children }: { children: ReactNode }) {
  const [screens, setScreens] = useState<string[]>([]);
  const [run, setRun] = useState<{ lessons: Lesson[]; key: number } | null>(null);
  const register = useCallback((id: string) => {
    setScreens((s) => [...s, id]);
    return () => setScreens((s) => { const i = s.indexOf(id); return i < 0 ? s : [...s.slice(0, i), ...s.slice(i + 1)]; });
  }, []);
  const start = useCallback((lessons: Lesson[]) => setRun({ lessons, key: Date.now() }), []);
  const end = useCallback(() => setRun(null), []);

  // antes de decidir se mostra um tutorial sozinho, junta o que a conta já viu com o que este aparelho já viu
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/tours", { cache: "no-store" });
        if (res.ok) {
          const { seen } = (await res.json()) as { seen: string[] };
          const local = readSeen();
          writeSeen([...seen, ...local]);
          const missing = local.filter((s) => !seen.includes(s));
          if (missing.length) fetch("/api/tours", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ seen: missing }) }).catch(() => {});
        }
      } catch {}
      if (alive) setReady(true);
    })();
    return () => { alive = false; };
  }, []);

  const value = useMemo(() => ({ screens, register, start, running: Boolean(run), ready }), [screens, register, start, run, ready]);
  return (
    <TourCtx.Provider value={value}>
      {children}
      {run && <TourRunner key={run.key} lessons={run.lessons} onEnd={end} />}
    </TourCtx.Provider>
  );
}

/**
 * Marca a tela atual. Na primeira vez que a pessoa chega nela (vale para a conta, em qualquer aparelho),
 * o tutorial da tela começa sozinho, se houver o que mostrar.
 */
export function TourScreen({ id }: { id: string }) {
  const ctx = useContext(TourCtx);
  const register = ctx?.register;
  const start = ctx?.start;
  const ready = ctx?.ready;
  useEffect(() => register?.(id), [register, id]);
  useEffect(() => {
    if (!start || !ready) return;
    let cont = false;
    try { cont = sessionStorage.getItem(CONTINUE_KEY) === id; } catch {}
    if (!cont && readSeen().includes(id)) return;
    const t = setTimeout(() => {
      const lessons = lessonsFor(id);
      const first = lessons[0]?.[isMouse() ? "mouse" : "touch"][0];
      if (!first?.target || !findVisible(first.target)) return; // lista vazia: espera ter itens
      if (document.querySelector('[role="dialog"]')) return;
      markSeen(id);
      if (cont) { try { sessionStorage.removeItem(CONTINUE_KEY); } catch {} }
      start(lessons);
    }, 900);
    return () => clearTimeout(t);
  }, [start, id, ready]);
  return null;
}

/** Botão "?" do cabeçalho: abre o balão com as ajudas da tela atual. */
export function HelpButton() {
  const ctx = useContext(TourCtx);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, right: 0 });
  const box = useRef<HTMLDivElement>(null);
  const pop = useRef<HTMLDivElement>(null);
  const lessons = useMemo(() => [...new Set(ctx?.screens ?? [])].flatMap(lessonsFor), [ctx?.screens]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { const t = e.target as Node; if (!box.current?.contains(t) && !pop.current?.contains(t)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!ctx) return null;
  const go = (list: Lesson[]) => { setOpen(false); ctx.start(list); };
  return (
    <div ref={box} className="relative">
      <button type="button" aria-label="Ajuda" title="Ajuda" aria-expanded={open} onClick={() => {
          const r = box.current!.getBoundingClientRect();
          setPos({ top: r.bottom + 6, right: Math.max(16, window.innerWidth - r.right) });
          setOpen(!open);
        }}
        className="w-11 h-11 -mt-1 grid place-items-center rounded-full opacity-90 hover:opacity-100">
        <HelpIcon />
      </button>
      {open && createPortal(
        <div ref={pop} role="menu" className="help-pop fixed z-[85] w-[min(300px,calc(100vw-32px))] rounded-[22px] border-2 p-4 flex flex-col gap-2 shadow-xl"
          style={{ top: pos.top, right: pos.right, background: "var(--surface)", borderColor: "var(--line)", color: "var(--ink)" }}>
          <p className="hand text-[1.7rem] leading-none mb-1 text-center" style={{ color: "var(--pen)" }}>Quer ajuda com o quê?</p>
          {lessons.length ? (
            <>
              {lessons.length > 1 && (
                <button role="menuitem" type="button" className="btn btn-primary btn-sm w-full" onClick={() => go(lessons)}>Ver tudo desta tela</button>
              )}
              {lessons.map((l) => (
                <button key={l.id} role="menuitem" type="button" className="chip w-full text-center !py-2.5" onClick={() => go([l])}>{l.title}</button>
              ))}
            </>
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>Nesta tela não tem nenhum gesto escondido: é só tocar no que aparece.</p>
          )}
        </div>,
        document.body,
      )}
    </div>
  );
}

// ---------------------------------------------------------------- execução

type Rect = { left: number; top: number; width: number; height: number };

function findVisible(selector: string): Element | null {
  for (const el of document.querySelectorAll(selector)) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return el;
  }
  return null;
}
const sameRect = (a: Rect | null, b: Rect | null) =>
  a === b || (!!a && !!b && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.width - b.width) < 0.5 && Math.abs(a.height - b.height) < 0.5);
const toRect = (r: DOMRect): Rect => ({ left: r.left, top: r.top, width: r.width, height: r.height });

const DURATION: Record<Gesture, number> = { swipe: 2600, tap: 2000, hold: 2400 };

function TourRunner({ lessons, onEnd }: { lessons: Lesson[]; onEnd: () => void }) {
  const mouse = useMemo(() => isMouse(), []);
  // passos marcados como opcionais somem quando o alvo não existe na tela (ex.: nenhum grupo criado)
  const steps = useMemo(() => lessons.flatMap((l) => l[mouse ? "mouse" : "touch"].map((s) => ({ lesson: l, step: s })))
    .filter(({ step }) => !step.optional || (step.target && findVisible(step.target))), [lessons, mouse]);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"show" | "try" | "done">("show");
  const [rect, setRect] = useState<Rect | null>(null);
  const [textBox, setTextBox] = useState<Rect | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });
  const el = useRef<Element | null>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const startPath = useRef(typeof window === "undefined" ? "" : window.location.pathname);
  // desvio: um botão tocado leva a um passo próprio (ex.: Excluir → explica a confirmação e termina)
  const [branch, setBranch] = useState<Step | null>(null);
  const { step: baseStep, lesson } = steps[index] ?? {};
  const step = branch ?? baseStep;
  const waits = Boolean(step?.wait || step?.waitClick || step?.waitGone);
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  const next = useCallback(() => {
    if (branch || index + 1 >= steps.length) { onEnd(); return; }
    setPhase("show");
    setIndex(index + 1);
  }, [index, steps.length, onEnd, branch]);

  // acompanha o alvo (rolagem, abrir de diálogo, troca de layout) quadro a quadro
  useEffect(() => {
    if (!step) return;
    el.current = null;
    let raf = 0, scrolled = false;
    const tick = () => {
      if (window.location.pathname !== startPath.current) { onEnd(); return; } // mudou de tela: o tutorial daquela tela acabou
      if (step.target && (!el.current || !el.current.isConnected || el.current.getBoundingClientRect().width === 0)) el.current = findVisible(step.target);
      const r = el.current ? toRect(el.current.getBoundingClientRect()) : null;
      if (r && !scrolled) {
        scrolled = true;
        if (r.top < 70 || r.top + r.height > window.innerHeight - 180) (el.current as HTMLElement).scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
      }
      setRect((prev) => (sameRect(prev, r) ? prev : r));
      const t = textRef.current ? toRect(textRef.current.getBoundingClientRect()) : null;
      setTextBox((prev) => (sameRect(prev, t) ? prev : t));
      setVp((prev) => (prev.w === window.innerWidth && prev.h === window.innerHeight ? prev : { w: window.innerWidth, h: window.innerHeight }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, reduced, onEnd]);

  // a pessoa pulou o gesto: o tutorial abre o cartão para mostrar as ações
  useEffect(() => {
    if (!step) return;
    if (!step.open) { if (!step.wait) closeAllSwipes(); return; }
    const t = setTimeout(() => {
      if (!document.querySelector(`${step.open} .swipe.is-open`)) window.dispatchEvent(new CustomEvent(TOUR_OPEN, { detail: step.open }));
    }, 250);
    return () => clearTimeout(t);
  }, [step]);
  useEffect(() => () => closeAllSwipes(), []);

  // espera a pessoa fazer o gesto
  useEffect(() => {
    if (!step || !waits || phase === "done") return;
    const success = () => setPhase("done");
    const onSignal = (e: Event) => { if ((e as CustomEvent<string>).detail === step.wait) success(); };
    const onClick = (e: MouseEvent) => { if (step.waitClick && step.target && (e.target as Element).closest?.(step.target)) success(); };
    window.addEventListener(SIGNAL, onSignal);
    document.addEventListener("click", onClick, true);
    return () => { window.removeEventListener(SIGNAL, onSignal); document.removeEventListener("click", onClick, true); };
  }, [step, waits, phase]);

  // o alvo só existe depois de um toque (ex.: aba "Preencher à mão"): o tutorial faz esse toque
  useEffect(() => {
    if (!step?.ensure || !step.target) return;
    const t = setTimeout(() => {
      if (!findVisible(step.target!)) (document.querySelector(step.ensure!) as HTMLElement | null)?.click();
    }, 150);
    return () => clearTimeout(t);
  }, [step]);

  // passo que espera algo sumir da tela (ex.: o pop-up de confirmação fechar)
  useEffect(() => {
    if (!step?.waitGone || !step.target || phase === "done") return;
    let appeared = false;
    const t = setInterval(() => {
      if (findVisible(step.target!)) appeared = true;
      else if (appeared) setPhase("done");
    }, 200);
    return () => clearInterval(t);
  }, [step, phase]);

  // botões que mudam o rumo do tutorial
  useEffect(() => {
    if (!step?.branches) return;
    const onClick = (e: MouseEvent) => {
      for (const b of step.branches!) {
        if (!(e.target as Element).closest?.(b.click)) continue;
        if (b.continueOn) { try { sessionStorage.setItem(CONTINUE_KEY, b.continueOn); } catch {} }
        if (b.step) { setBranch(b.step); setPhase("show"); }
        return;
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [step]);

  // "Isso!" fica um instante e segue
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(next, branch || index === steps.length - 1 ? 2000 : 1100); // no fim, comemora um pouco mais e fecha sozinho
    return () => clearTimeout(t);
  }, [phase, next, index, steps.length, branch]);

  // depois de duas demonstrações, é a vez da pessoa
  useEffect(() => {
    if (!step?.gesture || !waits || phase !== "show") return;
    const t = setTimeout(() => setPhase((p) => (p === "show" ? "try" : p)), DURATION[step.gesture] * 2);
    return () => clearTimeout(t);
  }, [step, waits, phase]);

  // o cartão de verdade desliza junto com a mãozinha
  const hasTarget = Boolean(rect);
  useEffect(() => {
    if (step?.demo !== "swipe" || phase !== "show" || !hasTarget || reduced) return;
    const swipe = el.current?.querySelector(".swipe");
    const front = swipe?.querySelector<HTMLElement>(".swipe-front");
    const actions = swipe?.querySelector<HTMLElement>(".swipe-actions");
    if (!front || !actions) return;
    const d = actions.offsetWidth;
    // classe em vez de mexer no style: o React continua dono da transparência dos botões
    swipe!.classList.add("is-demo");
    const anim = front.animate([
      { transform: "translateX(0)", offset: 0 }, { transform: "translateX(0)", offset: 0.18 },
      { transform: `translateX(${-d}px)`, offset: 0.5, easing: "ease-out" }, { transform: `translateX(${-d}px)`, offset: 0.76 },
      { transform: "translateX(0)", offset: 0.92 }, { transform: "translateX(0)", offset: 1 },
    ], { duration: DURATION.swipe, iterations: 2, easing: "ease-in-out" });
    const stop = () => { anim.cancel(); swipe!.classList.remove("is-demo"); };
    anim.onfinish = stop;
    front.addEventListener("pointerdown", stop, { once: true }); // a pessoa começou a deslizar: sai da frente
    return () => { front.removeEventListener("pointerdown", stop); stop(); };
  }, [step, phase, hasTarget, reduced]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onEnd(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onEnd]);

  if (!step || !vp.w) return <div ref={textRef} hidden />;

  const isLast = Boolean(branch) || index === steps.length - 1;
  const text = phase === "done" ? (step.doneText ?? (isLast ? "Isso! Você aprendeu 🎉" : "Isso! ✓")) : phase === "try" && step.doText ? step.doText : step.text;
  const pad = 10;
  const hole = rect && { x: rect.left - pad, y: rect.top - pad, w: rect.width + pad * 2, h: rect.height + pad * 2 };
  // a frase vai para o lado com mais espaço (sem cair atrás dos botões de baixo)
  // alvo lá embaixo (ex.: botões de um diálogo): a barra do tutorial sobe para não cobrir
  const barTop = Boolean(rect && rect.top + rect.height > vp.h - 170);
  const barSpace = barTop ? 24 : 170;
  const textH = textBox?.height ?? 90;
  let place: "above" | "below" | "center" = "center";
  if (rect) {
    const roomBelow = vp.h - barSpace - (rect.top + rect.height + 54);
    const roomAbove = rect.top - 54;
    place = roomBelow >= textH || roomBelow > roomAbove ? "below" : "above";
  }
  const textStyle: React.CSSProperties = place === "center"
    ? { top: "38%", transform: "translateY(-50%)" }
    : place === "below" ? { top: Math.min(rect!.top + rect!.height + 54, vp.h - barSpace - textH) } : { bottom: Math.max(vp.h - rect!.top + 54, barSpace) };
  // a frase fica em cima do alvo (no desktop, não no meio da tela)
  const textW = Math.min(420, vp.w - 16);
  const textLeft = rect ? Math.max(8, Math.min(vp.w - textW - 8, rect.left + rect.width / 2 - textW / 2)) : (vp.w - textW) / 2;
  const last = isLast;
  const seed = index * 7 + 3;

  return (
    <div className="tour fixed inset-0 z-[90] pointer-events-none" aria-live="polite">
      <svg className="absolute inset-0 w-full h-full" width={vp.w} height={vp.h} aria-hidden="true">
        <defs>
          <mask id="tour-hole">
            <rect width={vp.w} height={vp.h} fill="#fff" />
            {hole && <rect x={hole.x} y={hole.y} width={hole.w} height={hole.h} rx={18} fill="#000" />}
          </mask>
        </defs>
        <rect width={vp.w} height={vp.h} fill="var(--tour-dim)" mask="url(#tour-hole)" className="tour-dim" />
        {rect && (
          <g key={`s${index}`} fill="none" stroke="var(--pen)" strokeLinecap="round" strokeLinejoin="round">
            <path className="tour-draw" pathLength={1} strokeWidth={3.2} d={scribble(rect, pad, seed, vp.w)} />
            <path className="tour-draw tour-draw-2" pathLength={1} strokeWidth={1.6} opacity={0.55} d={scribble(rect, pad + 3, seed + 1, vp.w)} />
            {place !== "center" && textBox && (
              <path className="tour-draw tour-draw-arrow" pathLength={1} strokeWidth={2.6} d={arrow(textBox, rect, place, pad)} />
            )}
          </g>
        )}
      </svg>

      <div ref={textRef} className="absolute px-6 text-center" style={{ ...textStyle, left: textLeft, width: textW }}>
        <p key={`${index}-${phase}`} className="hand tour-text">{ink(text, reduced)}</p>
      </div>

      {rect && step.gesture && phase !== "done" && (
        <Hand key={`h${index}-${phase}`} gesture={step.gesture} rect={rect} faded={phase === "try"} reduced={reduced}
          from={step.target?.includes("tag-photo-link") ? "photo" : "center"} />
      )}

      <div className={`tour-bar ${barTop ? "is-top" : ""} pointer-events-auto absolute left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full border-2 p-1.5 pl-2 shadow-lg`}
        style={{ background: "var(--surface)", borderColor: "var(--line)", color: "var(--ink)" }}>
        <button type="button" className="px-3 py-2 rounded-full font-bold text-sm" style={{ color: "var(--ink-2)" }} onClick={onEnd}>Pular</button>
        <span className="text-xs font-bold tabular-nums whitespace-nowrap px-1" style={{ color: "var(--ink-2)" }} title={lesson?.title}>{index + 1} de {steps.length}</span>
        <button type="button" className="btn btn-primary btn-sm !rounded-full" onClick={next}>{last ? "Concluir" : "Próximo"}</button>
      </div>
    </div>
  );
}

/** Cada letra aparece um pouquinho depois da outra, como se estivesse sendo escrita. */
function ink(text: string, reduced: boolean) {
  if (reduced) return text;
  return [...text].map((ch, i) => <span key={i} className="tour-ch" style={{ animationDelay: `${i * 24}ms` }}>{ch}</span>);
}

// ---------------------------------------------------------------- traços à mão

function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** Contorno de caneta em volta do alvo: um "retângulo arredondado" tremido que passa um pouco do ponto onde começou. */
function scribble(r: Rect, pad: number, seed: number, vw: number) {
  const rand = rng(seed);
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  const hw = r.width / 2 + pad + Math.min(28, r.width * 0.06), hh = r.height / 2 + pad + Math.min(18, r.height * 0.1);
  const n = 6, p1 = rand() * 6, p2 = rand() * 6, start = -2.3 + rand() * 0.4;
  const pts: string[] = [];
  const steps = 96;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const th = start + t * Math.PI * 2 * 1.1;
    const c = Math.cos(th), s = Math.sin(th);
    const wob = 1 + 0.022 * Math.sin(3 * th + p1) + 0.012 * Math.sin(7 * th + p2) + 0.035 * t;
    const x = cx + hw * wob * Math.sign(c) * Math.abs(c) ** (2 / n);
    const y = cy + hh * wob * Math.sign(s) * Math.abs(s) ** (2 / n);
    pts.push(`${i ? "L" : "M"}${Math.max(3, Math.min(vw - 3, x)).toFixed(1)} ${y.toFixed(1)}`);
  }
  return pts.join("");
}

/** Setinha curva da frase até o contorno. */
function arrow(text: Rect, r: Rect, place: "above" | "below", pad: number) {
  const sx = text.left + text.width / 2 + (text.width > 200 ? 40 : 0);
  const sy = place === "below" ? text.top - 4 : text.top + text.height + 4;
  const inset = Math.min(30, r.width / 2);
  const ex = Math.max(r.left + inset, Math.min(r.left + r.width - inset, sx + 30));
  const ey = place === "below" ? r.top + r.height + pad + 8 : r.top - pad - 8;
  const mx = (sx + ex) / 2 + (place === "below" ? 34 : -34), my = (sy + ey) / 2;
  const ang = Math.atan2(ey - my, ex - mx);
  const head = (a: number) => `M${ex.toFixed(1)} ${ey.toFixed(1)}l${(-12 * Math.cos(ang + a)).toFixed(1)} ${(-12 * Math.sin(ang + a)).toFixed(1)}`;
  return `M${sx.toFixed(1)} ${sy.toFixed(1)}Q${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}${head(0.5)}${head(-0.5)}`;
}

// ---------------------------------------------------------------- mãozinha

const HAND_PATH = "M9 27V6.5a4 4 0 0 1 8 0V19a3.6 3.6 0 0 1 7 .6V21a3.6 3.6 0 0 1 7 .8V23a3.4 3.4 0 0 1 6.5 1.2V32c0 8-5 13.5-12.5 13.5h-4c-5 0-8-2.5-10.5-6.5L3.2 31c-1.6-2.8 1.4-5.4 4-3.4L9 29z";
const TIP = { x: 13, y: 3 }; // ponta do dedo

function Hand({ gesture, rect, faded, reduced, from }: { gesture: Gesture; rect: Rect; faded: boolean; reduced: boolean; from: "center" | "photo" }) {
  const hand = useRef<HTMLDivElement>(null);
  const ring = useRef<SVGSVGElement>(null);
  const w = Math.round(rect.width), h = Math.round(rect.height);

  // pontos relativos ao alvo
  const point = from === "photo" ? { x: Math.min(56, w / 2), y: h / 2 } : gesture === "swipe" ? { x: Math.round(w * 0.62), y: h / 2 } : { x: w / 2, y: h / 2 };

  useEffect(() => {
    const el = hand.current, rg = ring.current;
    if (!el || !rg || reduced) return;
    const at = (x: number, y: number, s = 1) => `translate(${x - TIP.x}px, ${y - TIP.y}px) scale(${s})`;
    const p = point;
    let frames: Keyframe[];
    let ringFrames: Keyframe[] = [{ opacity: 0 }, { opacity: 0 }];
    if (gesture === "swipe") {
      const swipeEl = (document.elementFromPoint(rect.left + 4, rect.top + h / 2)?.closest(".swipe") as HTMLElement | null);
      const d = swipeEl?.querySelector<HTMLElement>(".swipe-actions")?.offsetWidth ?? Math.min(168, w * 0.5);
      frames = [
        { transform: at(p.x + 16, p.y + 26), opacity: 0, offset: 0 },
        { transform: at(p.x, p.y), opacity: 1, offset: 0.1 },
        { transform: at(p.x, p.y, 0.88), opacity: 1, offset: 0.18 },
        { transform: at(p.x - d, p.y, 0.88), opacity: 1, offset: 0.5, easing: "ease-out" },
        { transform: at(p.x - d, p.y, 0.88), opacity: 1, offset: 0.66 },
        { transform: at(p.x - d + 10, p.y + 18, 1), opacity: 0, offset: 0.8 },
        { transform: at(p.x - d + 10, p.y + 18, 1), opacity: 0, offset: 1 },
      ];
    } else if (gesture === "tap") {
      frames = [
        { transform: at(p.x + 18, p.y + 28), opacity: 0, offset: 0 },
        { transform: at(p.x, p.y), opacity: 1, offset: 0.2 },
        { transform: at(p.x, p.y, 0.84), offset: 0.3 },
        { transform: at(p.x, p.y), offset: 0.4 },
        { transform: at(p.x, p.y, 0.84), offset: 0.5 },
        { transform: at(p.x, p.y), opacity: 1, offset: 0.62 },
        { transform: at(p.x + 18, p.y + 28), opacity: 0, offset: 0.9 },
        { transform: at(p.x + 18, p.y + 28), opacity: 0, offset: 1 },
      ];
      ringFrames = [
        { opacity: 0, transform: "scale(.3)", offset: 0 }, { opacity: 0, transform: "scale(.3)", offset: 0.28 },
        { opacity: 1, transform: "scale(.8)", offset: 0.34 }, { opacity: 0, transform: "scale(1.3)", offset: 0.46 },
        { opacity: 1, transform: "scale(.8)", offset: 0.52 }, { opacity: 0, transform: "scale(1.3)", offset: 0.66 },
        { opacity: 0, transform: "scale(1.3)", offset: 1 },
      ];
    } else {
      frames = [
        { transform: at(p.x + 18, p.y + 28), opacity: 0, offset: 0 },
        { transform: at(p.x, p.y), opacity: 1, offset: 0.15 },
        { transform: at(p.x, p.y, 0.84), offset: 0.25 },
        { transform: at(p.x, p.y, 0.84), offset: 0.72 },
        { transform: at(p.x, p.y), opacity: 1, offset: 0.8 },
        { transform: at(p.x + 18, p.y + 28), opacity: 0, offset: 0.96 },
        { transform: at(p.x + 18, p.y + 28), opacity: 0, offset: 1 },
      ];
      ringFrames = [
        { opacity: 0, transform: "scale(.3)", offset: 0 }, { opacity: 0, transform: "scale(.3)", offset: 0.25 },
        { opacity: 1, transform: "scale(1.25)", offset: 0.7 }, { opacity: 0, transform: "scale(1.4)", offset: 0.8 },
        { opacity: 0, transform: "scale(1.4)", offset: 1 },
      ];
    }
    const opts = { duration: DURATION[gesture], iterations: Infinity, easing: "ease-in-out" };
    const a = el.animate(frames, opts);
    const b = rg.animate(ringFrames, opts);
    return () => { a.cancel(); b.cancel(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reinicia só quando o alvo muda de tamanho
  }, [gesture, w, h, reduced, from]);

  return (
    <div className="absolute" style={{ left: rect.left, top: rect.top, width: w, height: h, opacity: faded ? 0.55 : 1, transition: "opacity .4s" }} aria-hidden="true">
      <svg ref={ring} className="absolute" width="56" height="56" viewBox="0 0 56 56" style={{ left: point.x - 28, top: point.y - 28, opacity: 0 }}>
        <path d="M28 5c13 0 23 9 23 22 0 14-10 24-23 24C14 51 5 41 5 28 5 16 14 6 27 6" fill="none" stroke="var(--pen)" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <div ref={hand} className="absolute left-0 top-0 w-[40px] h-[48px] origin-[13px_3px]" style={reduced ? { transform: `translate(${point.x - TIP.x}px, ${point.y - TIP.y}px)` } : { opacity: 0 }}>
        <svg width="40" height="48" viewBox="0 0 40 48" className="overflow-visible drop-shadow-md">
          <path d={HAND_PATH} fill="var(--paper)" stroke="var(--pen)" strokeWidth="2.2" strokeLinejoin="round" />
          <path d={HAND_PATH} fill="none" stroke="var(--pen)" strokeWidth="1" opacity=".35" transform="translate(1 .8)" />
          <path d="M24 21.5v4.5M31 23.5v4.5" stroke="var(--pen)" strokeWidth="1.6" strokeLinecap="round" opacity=".7" />
        </svg>
      </div>
    </div>
  );
}

export type { Step };
