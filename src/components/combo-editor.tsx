"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  addExtra, addItemToCombo, deleteCombo, refreshPrices, removeLine, setComboStage, setPaid, setQuantity, updateComboMeta,
} from "@/app/actions/combos";
import { boughtByOwnerAlerts, budgetState, comboTotal, countdownLabel, daysBetween, formatDayMonth, lineTotal, todayInSaoPaulo, type Combo, type ComboLine } from "@/lib/combos/domain";
import { CATEGORY_EMOJI, centsToMoneyInput, formatPrice, matchesSearch, type Category, type Item } from "@/lib/items/domain";
import { bunnyCheer } from "./bunnies";
import { useConfirm } from "./confirm";
import { Heart } from "./heart";
import { CheckIcon, CloseIcon, IconButton, MinusIcon, PencilIcon, PlusIcon, StarIcon, TrashIcon } from "./icons";
import { MoneyInput } from "./money-input";
import { StageSteps } from "./stage-steps";
import { TourScreen, tourSignal } from "./tour/tour";

type Occ = { id: string; name: string; label: string };
const centsToInput = centsToMoneyInput;

export function ComboEditor({ combo, available, purchasedElsewhere, occasions, recipientName, startBuilding = false }: {
  combo: Combo; available: Item[]; purchasedElsewhere: string[]; occasions: Occ[]; recipientName: string; startBuilding?: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const ask = useConfirm();
  // "Montando": adicionar/tirar itens. "Resumo": avançar etapas. Só presentes montados podem ser editados.
  const [building, setBuilding] = useState(startBuilding && combo.status === "montado");
  const editable = building && combo.status === "montado";
  const { totalCents, missingPrice } = comboTotal(combo.lines);
  const budget = budgetState(totalCents, combo.budgetCents);
  const alerts = boughtByOwnerAlerts(combo);

  const run = (fn: () => Promise<{ ok: boolean; error?: string } | { ok: true }>) =>
    start(async () => {
      setError(null);
      const res = await fn();
      if (!res.ok) setError("error" in res && res.error ? res.error : "Não deu para salvar.");
    });

  // RF26: preços desatualizados são reconsultados em segundo plano ao abrir
  const refreshed = useRef(false);
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    if (refreshed.current || combo.status === "dado") return;
    refreshed.current = true;
    const stale = (i: Item) => !i.priceCheckedAt || Date.now() - new Date(i.priceCheckedAt).getTime() > 24 * 3600_000;
    const ids = [...available.filter(stale).map((i) => i.id), ...combo.lines.filter((l) => l.itemId).map((l) => l.itemId!)];
    const unique = [...new Set(ids)];
    if (!unique.length) return;
    (async () => {
      setRefreshing(true);
      for (let i = 0; i < unique.length; i += 10) await refreshPrices(unique.slice(i, i + 10));
      setRefreshing(false);
    })();
  }, [available, combo]);

  const days = combo.occasionDate ? daysBetween(todayInSaoPaulo(), combo.occasionDate) : null;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] items-start">
      <div className="flex flex-col gap-5 min-w-0">
        <MetaEditor combo={combo} occasions={occasions} disabled={combo.status === "dado"} onSave={(m) => run(() => updateComboMeta(combo.id, m))} />

        {combo.occasionDate && (
          <p className="text-sm -mt-2" style={{ color: "var(--ink-2)" }}>{formatDayMonth(combo.occasionDate)}, {countdownLabel(days!)}</p>
        )}

        {/* fita de orçamento */}
        <div className="rounded-[18px] border-2 p-4" style={{ background: "var(--surface)", borderColor: "var(--line)" }} data-tour="budget">
          <div className="flex items-end justify-between gap-3">
            <span className="text-sm leading-snug" style={{ color: "var(--ink-2)" }}>
              {combo.lines.length} {combo.lines.length === 1 ? "item" : "itens"}
              {missingPrice > 0 && <><br />{missingPrice} sem preço (conta R$ 0)</>}
            </span>
            <strong className="text-right whitespace-nowrap text-[1.5rem] font-extrabold" style={{ fontVariationSettings: "'wdth' 82" }}>
              {formatPrice(totalCents)}
              {combo.budgetCents ? <em className="block not-italic text-sm font-semibold" style={{ color: "var(--ink-2)" }}>de {formatPrice(combo.budgetCents)}</em> : null}
            </strong>
          </div>
          {budget && <BudgetBar totalCents={totalCents} budgetCents={combo.budgetCents!} className="mt-3" />}
        </div>

        <div className="flex flex-col gap-3">
          <StageSteps status={combo.status} />
          {combo.status === "dado" && (
            <div className="relative rounded-[18px] p-5 overflow-hidden" style={{ background: "var(--surface)" }}>
              <Heart className={`absolute -right-6 -top-6 w-36 h-36 opacity-70 ${celebrate ? "burst" : ""}`} blur={4} />
              <p className="relative font-extrabold text-lg">Presente entregue 🎉</p>
              <p className="relative text-sm" style={{ color: "var(--ink-2)" }}>Os itens únicos foram para “Recebidos” de {recipientName}.</p>
            </div>
          )}
        </div>

        {alerts.map((l) => (
          <p key={l.id} className="rounded-xl px-4 py-3 font-semibold" style={{ background: "var(--warn-bg)", color: "var(--warn-ink)" }}>
            {recipientName} já comprou “{l.title}”. Que tal trocar por outra coisa?
          </p>
        ))}
        {error && <p role="alert" className="rounded-xl px-4 py-3 font-semibold" style={{ background: "var(--error-bg)", color: "var(--error-ink)" }}>{error}</p>}

        <ul className="flex flex-col gap-3" aria-busy={pending} data-tour="lines">
          {combo.lines.length === 0 && (
            <li className="rounded-[20px] border-2 border-dashed p-6 text-center" style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}>
              O presente está vazio. Escolha itens da lista {recipientName.endsWith("a") ? "da" : "do"} {recipientName} ou adicione um extra.
            </li>
          )}
          {combo.lines.map((l) => (
            <ComboLineRow key={l.id} line={l} status={combo.status} editing={editable} pending={pending}
              onQty={(q) => run(() => setQuantity(combo.id, l.id, q))}
              onPaid={(v) => run(() => setPaid(combo.id, l.id, v))}
              onRemove={async () => {
                if (await ask({ title: "Tirar do presente?", body: <>“{l.title}” sai deste presente, mas continua na lista.</>, confirmLabel: "Tirar", tone: "danger" }))
                  run(() => removeLine(combo.id, l.id));
              }} />
          ))}
        </ul>

        {editable ? (
          <>
            <TourScreen id="build" />
            <div className="lg:hidden">
              <button type="button" className="btn btn-ribbon w-full" data-tour="add-from-list" onClick={() => setListOpen(true)}>
                <PlusIcon /> Adicionar da lista {recipientName.endsWith("a") ? "da" : "do"} {recipientName}
              </button>
            </div>
            <ExtraForm onAdd={(e) => run(() => addExtra(combo.id, e))} pending={pending} />
            <p className="text-sm" style={{ color: "var(--ink-2)" }}>Tudo o que você adiciona já fica salvo no presente.</p>
            <div className="actions">
              <button className="btn btn-primary" disabled={pending} data-tour="finish" onClick={() => { setBuilding(false); router.push("/combos"); }}>Concluir presente</button>
              <button className="btn btn-ghost" style={{ color: "var(--error-ink)" }} disabled={pending}
                onClick={async () => {
                  if (await ask({ title: "Excluir este presente?", body: <>“{combo.name}” some dos seus presentes. Os itens continuam na lista.</>, confirmLabel: "Excluir presente", tone: "danger" }))
                    run(() => deleteCombo(combo.id));
                }}>
                Excluir presente
              </button>
            </div>
          </>
        ) : combo.status !== "dado" && (
          <div className="actions pt-2">
            {combo.status === "montado" && (
              <button className="btn btn-primary" disabled={pending || !combo.lines.length} onClick={() => run(() => setComboStage(combo.id, "comprado"))}>Marcar como comprado</button>
            )}
            <GiveButton disabled={pending || !combo.lines.length} recipientName={recipientName} ask={ask}
              onConfirm={() => start(async () => {
                setError(null);
                const res = await setComboStage(combo.id, "dado");
                if (res.ok) { setCelebrate(true); bunnyCheer("combo:dado"); } else setError(res.error);
              })} />
            {combo.status === "montado" && <button className="btn btn-ghost" disabled={pending} onClick={() => setBuilding(true)}>Editar itens</button>}
            {combo.status === "comprado" && <button className="btn btn-ghost" disabled={pending} onClick={() => run(() => setComboStage(combo.id, "montado"))}>Voltar para montado</button>}
          </div>
        )}
        {combo.status === "comprado" && <p className="text-sm -mt-2" style={{ color: "var(--ink-2)" }}>Os itens únicos estão reservados em segredo: {recipientName} não vê.</p>}
      </div>

      {editable && (
        <AddFromList available={available} combo={combo} purchasedElsewhere={purchasedElsewhere} recipientName={recipientName}
          remainingCents={budget?.remainingCents ?? null} refreshing={refreshing} pending={pending}
          onAdd={(itemId) => run(() => addItemToCombo(combo.id, itemId))}
          onRemoveLine={async (l) => {
            if (await ask({ title: "Tirar do presente?", body: <>“{l.title}” sai deste presente, mas continua na lista.</>, confirmLabel: "Tirar", tone: "danger" }))
              run(() => removeLine(combo.id, l.id));
          }}
          onQty={(l, q) => run(() => setQuantity(combo.id, l.id, q))}
          open={listOpen} onClose={() => setListOpen(false)} />
      )}
    </div>
  );
}

function MetaEditor({ combo, occasions, disabled, onSave }: { combo: Combo; occasions: Occ[]; disabled: boolean; onSave: (m: { name: string; occasionId: string | null; budget: string }) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(combo.name);
  const [occasionId, setOccasionId] = useState(combo.occasionId ?? "");
  const [budget, setBudget] = useState(centsToInput(combo.budgetCents));
  if (!open) {
    return (
      <div className="flex items-start justify-between gap-3">
        <h2 className="display text-[1.8rem] sm:text-[2.2rem] min-w-0 break-words">{combo.name}</h2>
        {!disabled && <IconButton label="Editar nome, data e orçamento" onClick={() => setOpen(true)}><PencilIcon /></IconButton>}
      </div>
    );
  }
  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_1fr_150px] items-end rounded-[18px] border-2 p-4" style={{ background: "var(--surface)", borderColor: "var(--line)" }}
      onSubmit={(e) => { e.preventDefault(); onSave({ name, occasionId: occasionId || null, budget }); setOpen(false); }}>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">Nome</span>
        <input className="field !text-base" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required /></label>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">Ocasião</span>
        <select className="field !text-base" value={occasionId} onChange={(e) => setOccasionId(e.target.value)}>
          {occasions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}<option value="">Sem ocasião</option>
        </select></label>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">Orçamento</span>
        <MoneyInput className="field !text-base" label="Orçamento" placeholder="opcional" value={budget} onChange={setBudget} /></label>
      <div className="sm:col-span-3 actions"><button className="btn btn-primary btn-sm">Salvar</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancelar</button></div>
    </form>
  );
}

function ComboLineRow({ line, status, editing, pending, onQty, onPaid, onRemove }: {
  line: ComboLine; status: Combo["status"]; editing: boolean; pending: boolean; onQty: (q: number) => void; onPaid: (v: string) => void; onRemove: () => void;
}) {
  const [paid, setPaidValue] = useState(centsToInput(line.paidCents));
  const canQty = editing && (line.isExtra || line.kind === "sempre");
  const emoji = line.category ? CATEGORY_EMOJI[line.category as Category] : line.isExtra ? "✨" : "🎁";
  return (
    <li className={`tag ${line.kind === "sempre" ? "sempre" : ""}`} style={{ gridTemplateColumns: "52px 1fr auto" }}>
      <div className="w-[52px] h-[52px] rounded-xl overflow-hidden grid place-items-center text-[24px]" style={{ background: "var(--bg)" }}>
        {line.imageUrl ? <img src={line.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <span aria-hidden="true">{emoji}</span>}
      </div>
      <div className="min-w-0">
        <p className="font-bold leading-tight line-clamp-2">{line.title}</p>
        <div className="flex flex-wrap items-center gap-2 mt-1">
          {line.isExtra && <span className="badge">Extra, fora da lista</span>}
          {!line.isExtra && line.itemId === null && <span className="badge">Removido da lista</span>}
          {canQty ? (
            <span className="inline-flex items-center gap-1.5 font-extrabold text-sm">
              <button type="button" className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: "var(--surface-sunk)" }} disabled={pending || line.quantity <= 1} onClick={() => onQty(line.quantity - 1)} aria-label="Diminuir quantidade"><MinusIcon /></button>
              {line.quantity}
              <button type="button" className="w-7 h-7 rounded-lg grid place-items-center" style={{ background: "var(--surface-sunk)" }} disabled={pending} onClick={() => onQty(line.quantity + 1)} aria-label="Aumentar quantidade"><PlusIcon /></button>
            </span>
          ) : line.quantity > 1 ? <span className="text-sm font-bold">{line.quantity}x</span> : null}
          {status === "comprado" && (
            <label className="inline-flex items-center gap-1.5 text-sm">
              <span style={{ color: "var(--ink-2)" }}>Paguei</span>
              <span className="w-[120px]"><MoneyInput className="field !py-1 !pr-2 !text-sm" label="Quanto paguei" value={paid}
                onChange={setPaidValue} onBlur={() => paid !== centsToInput(line.paidCents) && onPaid(paid)} /></span>
            </label>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className="font-extrabold whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 80" }}>
          {line.paidCents == null && line.unitPriceCents == null ? "Sem preço" : formatPrice(lineTotal(line))}
        </span>
        {editing && <IconButton label={`Tirar ${line.title} do presente`} disabled={pending} onClick={onRemove} className="relative z-10"><TrashIcon /></IconButton>}
      </div>
    </li>
  );
}

function ExtraForm({ onAdd, pending }: { onAdd: (e: { title: string; price: string; url: string }) => void; pending: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [url, setUrl] = useState("");
  if (!open) return <button type="button" className="btn btn-soft btn-sm self-end" onClick={() => setOpen(true)}><PlusIcon /> Adicionar extra</button>;
  return (
    <form className="grid gap-3 sm:grid-cols-[1fr_130px] rounded-[18px] border-2 border-dashed p-4" style={{ borderColor: "var(--line)" }}
      onSubmit={(e) => { e.preventDefault(); onAdd({ title, price, url }); setTitle(""); setPrice(""); setUrl(""); setOpen(false); }}>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">Extra</span>
        <input className="field !text-base" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Flores do Vitório" required maxLength={120} /></label>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">Preço</span>
        <MoneyInput className="field !text-base" label="Preço do extra" value={price} onChange={setPrice} /></label>
      <label className="flex flex-col gap-1 sm:col-span-2"><span className="text-sm font-bold">Link (opcional)</span>
        <input className="field !text-base" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" /></label>
      <div className="sm:col-span-2 actions"><button className="btn btn-primary btn-sm" disabled={pending}>Adicionar extra</button><button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(false)}>Cancelar</button></div>
    </form>
  );
}

function GiveButton({ disabled, recipientName, ask, onConfirm }: { disabled: boolean; recipientName: string; ask: ReturnType<typeof useConfirm>; onConfirm: () => void }) {
  return (
    <button className="btn btn-ghost" disabled={disabled} onClick={async () => {
      if (await ask({ title: `Já entregou para ${recipientName}?`, body: "Os itens únicos vão para os Recebidos e isso não dá para desfazer.", confirmLabel: "Sim, já dei" })) onConfirm();
    }}>Marcar como dado</button>
  );
}

type ListProps = {
  available: Item[]; combo: Combo; purchasedElsewhere: string[]; recipientName: string; remainingCents: number | null;
  refreshing: boolean; pending: boolean; onAdd: (itemId: string) => void;
  onRemoveLine: (line: ComboLine) => void; onQty: (line: ComboLine, q: number) => void;
};
type PriceFilter = "todos" | "cabe" | "50" | "100" | "200" | "300";
const PRICE_CHIPS: Array<[PriceFilter, string]> = [["50", "Até R$ 50"], ["100", "Até R$ 100"], ["200", "Até R$ 200"], ["300", "Até R$ 300"]];

/** Desktop: painel fixo ao lado. Celular: tela cheia com o resumo do presente no topo e a lista embaixo. */
function AddFromList({ open, onClose, ...props }: ListProps & { open: boolean; onClose: () => void }) {
  const setOpen = (v: boolean) => { if (!v) onClose(); };
  const { recipientName } = props;
  const article = recipientName.endsWith("a") ? "da" : "do";
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  return (
    <>
      <aside className="hidden lg:flex flex-col gap-3 sticky top-6 rounded-[20px] border-2 p-4 max-h-[calc(100dvh-48px)]"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }} aria-label="Adicionar da lista">
        <ListPanel {...props} />
      </aside>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={`Lista ${article} ${recipientName}`}
          className="lg:hidden fixed inset-0 z-[60] flex flex-col" style={{ background: "var(--bg)" }}>
          <div className="px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 flex items-start gap-2 border-b-2" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
            <div className="flex-1 min-w-0" data-tour="gift-summary"><GiftSummary {...props} expandable /></div>
            <IconButton label="Fechar" onClick={() => setOpen(false)}><CloseIcon /></IconButton>
          </div>
          <div className="flex-1 min-h-0 flex flex-col gap-3 px-4 pt-3">
            <ListPanel {...props} />
          </div>
          <div className="px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
            <button type="button" className="btn btn-primary w-full" data-tour="list-done" onClick={() => setOpen(false)}>Pronto</button>
          </div>
        </div>
      )}
    </>
  );
}

/** Barra do orçamento: listrada rosa, amarela a partir de 90% ("quase lá") e vermelha quando estoura. */
function BudgetBar({ totalCents, budgetCents, compact = false, className = "" }: { totalCents: number; budgetCents: number; compact?: boolean; className?: string }) {
  const { ratio, remainingCents } = budgetState(totalCents, budgetCents)!;
  const level = remainingCents < 0 ? "over" : ratio >= 0.9 ? "near" : "ok";
  const stripes = level === "over" ? ["#C81E4A", "#E0456E"] : level === "near" ? ["#FFC22E", "#FFD866"] : ["var(--stripe-a)", "var(--stripe-b)"];
  const label = level === "over" ? `Passou ${formatPrice(-remainingCents)} do orçamento`
    : level === "near" ? `Quase lá: cabem mais ${formatPrice(remainingCents)}` : `Cabem mais ${formatPrice(remainingCents)}`;
  return (
    <div className={className}>
      <div className={`relative ${compact ? "h-2.5" : "h-4"} rounded overflow-hidden`} style={{ background: "var(--line)" }}
        role="progressbar" aria-label="Orçamento usado" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(Math.min(ratio, 1) * 100)}>
        <i className="absolute inset-y-0 left-0 rounded transition-[width] duration-500"
          style={{ width: `${Math.min(100, ratio * 100)}%`, background: `repeating-linear-gradient(-45deg, ${stripes[0]} 0 8px, ${stripes[1]} 8px 16px)` }} />
      </div>
      <p className={`${compact ? "text-xs mt-1.5" : "text-sm mt-2"} font-semibold`} aria-live="polite"
        style={{ color: level === "over" ? "var(--error-ink)" : level === "near" ? "var(--warn-ink)" : "var(--ink-2)" }}>{label}</p>
    </div>
  );
}

/** Resumo do presente em cima da lista: nome, quantos itens, total e a barra. No celular, toque para ver e mexer nos itens. */
function GiftSummary({ combo, pending, expandable, onRemoveLine, onQty }: ListProps & { expandable: boolean }) {
  const [open, setOpen] = useState(false);
  const { totalCents } = comboTotal(combo.lines);
  const count = combo.lines.reduce((n, l) => n + l.quantity, 0);
  const head = (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0">
        <span className="block font-extrabold truncate" style={{ fontVariationSettings: "'wdth' 85" }}>🎁 {combo.name}</span>
        <span className="text-xs font-semibold" style={{ color: "var(--ink-2)" }}>
          {count} {count === 1 ? "item" : "itens"}{expandable && combo.lines.length > 0 ? (open ? " · esconder" : " · ver itens") : ""}
        </span>
      </span>
      <strong className="whitespace-nowrap text-right font-extrabold text-lg leading-tight" style={{ fontVariationSettings: "'wdth' 82" }}>
        {formatPrice(totalCents)}
        {combo.budgetCents ? <em className="block not-italic text-xs font-semibold" style={{ color: "var(--ink-2)" }}>de {formatPrice(combo.budgetCents)}</em> : null}
      </strong>
    </div>
  );
  return (
    <div className="flex flex-col gap-2">
      {expandable && combo.lines.length > 0
        ? <button type="button" className="text-left w-full" aria-expanded={open} onClick={() => setOpen(!open)}>{head}</button>
        : head}
      {combo.budgetCents ? <BudgetBar totalCents={totalCents} budgetCents={combo.budgetCents} compact /> : null}
      {expandable && open && (
        <ul className="flex flex-col gap-1.5 max-h-[38dvh] overflow-y-auto overscroll-contain mt-1" aria-busy={pending}>
          {combo.lines.map((l) => {
            const canQty = l.isExtra || l.kind === "sempre";
            return (
              <li key={l.id} className="flex items-center gap-2 rounded-xl px-3 py-1.5" style={{ background: "var(--bg)" }}>
                <span className="flex-1 min-w-0 text-sm font-bold leading-tight line-clamp-2">{l.title}</span>
                {canQty ? (
                  <span className="inline-flex items-center gap-1 font-extrabold text-sm">
                    <button type="button" className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: "var(--surface-sunk)" }} disabled={pending || l.quantity <= 1} onClick={() => onQty(l, l.quantity - 1)} aria-label={`Diminuir ${l.title}`}><MinusIcon /></button>
                    {l.quantity}
                    <button type="button" className="w-8 h-8 rounded-lg grid place-items-center" style={{ background: "var(--surface-sunk)" }} disabled={pending} onClick={() => onQty(l, l.quantity + 1)} aria-label={`Aumentar ${l.title}`}><PlusIcon /></button>
                  </span>
                ) : null}
                <span className="text-sm font-extrabold whitespace-nowrap">{l.unitPriceCents == null && l.paidCents == null ? "—" : formatPrice(lineTotal(l))}</span>
                <IconButton label={`Tirar ${l.title} do presente`} disabled={pending} onClick={() => onRemoveLine(l)} className="!w-9 !h-9"><TrashIcon /></IconButton>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ListPanel({ available, combo, purchasedElsewhere, recipientName, remainingCents, refreshing, pending, onAdd, onRemoveLine }: ListProps) {
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState<PriceFilter>("todos");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<"menor" | "maior" | "recentes">("menor");
  const [added, setAdded] = useState<string | null>(null);
  const lineByItem = useMemo(() => new Map(combo.lines.filter((l) => l.itemId).map((l) => [l.itemId!, l])), [combo.lines]);
  const elsewhere = useMemo(() => new Set(purchasedElsewhere), [purchasedElsewhere]);
  const categories = useMemo(() => [...new Set(available.map((i) => i.category))].sort((a, b) => a.localeCompare(b, "pt-BR")), [available]);

  const list = useMemo(() => {
    const max = price === "todos" ? null : price === "cabe" ? remainingCents : Number(price) * 100;
    const out = available
      .filter((i) => matchesSearch(i, query))
      .filter((i) => !category || i.category === category)
      .filter((i) => max == null || (i.priceCents !== null && i.priceCents <= max));
    if (sort === "menor") out.sort((a, b) => (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity));
    if (sort === "maior") out.sort((a, b) => (b.priceCents ?? -1) - (a.priceCents ?? -1));
    if (sort === "recentes") out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return out;
  }, [available, query, category, price, sort, remainingCents]);

  const priceChips: Array<[PriceFilter, string]> = remainingCents != null && remainingCents > 0
    ? [["cabe", `Cabe em ${formatPrice(remainingCents)}`], ...PRICE_CHIPS]
    : PRICE_CHIPS;

  return (
    <>
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-extrabold" style={{ fontVariationSettings: "'wdth' 85" }}>Da lista {recipientName.endsWith("a") ? "da" : "do"} {recipientName}</h2>
        {refreshing && <span className="text-xs font-semibold" style={{ color: "var(--ink-2)" }}>atualizando preços…</span>}
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input type="search" className="field !text-base min-w-0" placeholder="Buscar" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar por nome, loja ou cor" />
        <select className="field !text-base" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} aria-label="Ordenar">
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
          <option value="recentes">Recentes</option>
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]" role="group" aria-label="Preço">
          {priceChips.map(([v, label]) => (
            <button key={v} type="button" className="chip" aria-pressed={price === v} onClick={() => setPrice(price === v ? "todos" : v)}>{label}</button>
          ))}
        </div>
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]" role="group" aria-label="Categoria">
            {categories.map((c) => (
              <button key={c} type="button" className="chip" aria-pressed={category === c} onClick={() => setCategory(category === c ? null : c)}>
                {CATEGORY_EMOJI[c]} {c}
              </button>
            ))}
          </div>
        )}
      </div>
      <p className="text-xs font-semibold" style={{ color: "var(--ink-2)" }} aria-live="polite">
        {added ? `“${added}” entrou no presente.` : `${list.length} ${list.length === 1 ? "item" : "itens"}`}
      </p>
      <ul className="flex flex-col gap-2 flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
        {list.length === 0 && <li className="text-sm py-6 text-center" style={{ color: "var(--ink-2)" }}>Nada com esses filtros.</li>}
        {list.map((i) => {
          const blocked = i.kind === "unico" && elsewhere.has(i.id);
          const line = lineByItem.get(i.id);
          return (
            <li key={i.id} className="flex items-center gap-3 rounded-xl p-2 border-2"
              style={{ background: "var(--bg)", borderColor: line ? "var(--secondary)" : "transparent" }}>
              <div className="w-12 h-12 rounded-lg overflow-hidden grid place-items-center text-xl shrink-0" style={{ background: "var(--surface)" }}>
                {i.imageUrl ? <img src={i.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : CATEGORY_EMOJI[i.category]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm leading-tight line-clamp-2">{i.title}</p>
                <p className="text-xs truncate" style={{ color: "var(--ink-2)" }}>
                  {line ? (line.quantity > 1 ? `No presente, ${line.quantity}x` : "No presente") : blocked ? "Já está em outro presente comprado" : i.group ? <span className="inline-flex items-center gap-1">{i.group.preferred && <StarIcon filled size={13} />}Um destes: {i.group.name}</span> : i.kind === "sempre" ? "Sempre bem-vindo" : (i.store ?? i.category)}
                </p>
              </div>
              <span className="text-sm font-extrabold whitespace-nowrap">{formatPrice(i.priceCents)}</span>
              {line ? (
                <button type="button" className="w-11 h-11 rounded-full grid place-items-center text-lg font-black shrink-0 disabled:opacity-40"
                  aria-label={`${i.title} está no presente. Tirar`} aria-pressed="true" style={{ background: "var(--secondary)", color: "var(--on-secondary)" }} disabled={pending}
                  onClick={() => { setAdded(null); onRemoveLine(line); }}><CheckIcon /></button>
              ) : (
                <button type="button" className="w-11 h-11 rounded-full grid place-items-center text-lg font-black shrink-0 disabled:opacity-40"
                  aria-label={`Adicionar ${i.title}`} style={{ background: "var(--ribbon)", color: "var(--on-ribbon)" }} disabled={pending || blocked} data-tour={blocked ? undefined : "add-item"}
                  onClick={() => { onAdd(i.id); setAdded(i.title); tourSignal("item-added"); }}><PlusIcon /></button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
