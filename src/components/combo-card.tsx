import Link from "next/link";
import { comboTotal, countdownLabel, daysBetween, formatDayMonth, shortDate, todayInSaoPaulo, type Combo } from "@/lib/combos/domain";
import { formatPrice } from "@/lib/items/domain";
import { GiftBow } from "./gift-bow";
import { StageSteps } from "./stage-steps";

/** Combo como caixa de presente com fita no canto (design-system §5). */
export function ComboCard({ combo }: { combo: Combo }) {
  const { totalCents } = comboTotal(combo.lines);
  const days = combo.occasionDate ? daysBetween(todayInSaoPaulo(), combo.occasionDate) : null;
  const when = combo.status === "dado" && combo.givenAt
    ? `Dado em ${shortDate(combo.givenAt)}`
    : combo.occasionDate ? `${formatDayMonth(combo.occasionDate)}, ${countdownLabel(days!)}` : "Sem data";
  const alerts = combo.status === "comprado" ? combo.lines.filter((l) => l.kind === "unico" && l.itemStatus === "ja_tenho") : [];
  return (
    <Link href={`/combos/${combo.id}`} className="gift-box block rounded-[20px] border-2 p-4 sm:p-5 transition-transform hover:-translate-y-0.5 focus-visible:outline-3"
      style={{ background: "var(--surface)", borderColor: "var(--line)", opacity: combo.status === "dado" ? 0.8 : 1 }}>
      <GiftBow />
      <h3 className="font-extrabold text-lg leading-tight pr-20">{combo.name}</h3>
      <p className="text-sm mt-0.5" style={{ color: "var(--ink-2)" }}>{when}</p>
      {combo.status !== "dado" && <div className="mt-3"><StageSteps status={combo.status} compact /></div>}
      <div className="flex items-baseline justify-between mt-3 text-sm" style={{ color: "var(--ink-2)" }}>
        <span>{combo.lines.length} {combo.lines.length === 1 ? "item" : "itens"}</span>
        <strong className="text-lg" style={{ color: "var(--ink)", fontVariationSettings: "'wdth' 82" }}>
          {formatPrice(totalCents)}{combo.budgetCents ? <span className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}> de {formatPrice(combo.budgetCents)}</span> : null}
        </strong>
      </div>
      {alerts.map((l) => (
        <p key={l.id} className="mt-3 rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: "var(--warn-bg)", color: "var(--warn-ink)" }}>
          “{l.title}” já foi comprado por quem vai ganhar. Que tal trocar?
        </p>
      ))}
    </Link>
  );
}
