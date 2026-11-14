import type { ComboStatus } from "@/lib/combos/domain";

const STEPS: Array<[ComboStatus, string]> = [["montado", "Montado"], ["comprado", "Comprado"], ["dado", "Dado"]];

/** Etapas Montado → Comprado → Dado (RF30). */
export function StageSteps({ status, compact }: { status: ComboStatus; compact?: boolean }) {
  const current = STEPS.findIndex(([s]) => s === status);
  return (
    <ol className="flex items-center gap-1.5" aria-label={`Etapa: ${STEPS[current][1]}`}>
      {STEPS.map(([s, label], i) => (
        <li key={s} className="flex items-center gap-1.5 flex-1 last:flex-none">
          <span className={`rounded-full font-bold whitespace-nowrap ${compact ? "text-[.72rem] px-2.5 py-1" : "text-sm px-3 py-1.5"}`}
            aria-current={i === current ? "step" : undefined}
            style={i === current ? { background: "var(--primary)", color: "var(--on-primary)" }
              : i < current ? { background: "var(--badge-info)", color: "var(--ink)" }
              : { background: "var(--surface-sunk)", color: "var(--ink-2)" }}>
            {label}
          </span>
          {i < STEPS.length - 1 && <span className="h-0.5 flex-1 min-w-3 rounded" style={{ background: "var(--line)" }} />}
        </li>
      ))}
    </ol>
  );
}
