"use client";

import { useState, useTransition } from "react";
import { deleteOccasion, saveOccasion } from "@/app/actions/occasions";
import { monthLong, monthShort } from "@/lib/combos/domain";
import { useConfirm } from "./confirm";
import { IconButton, PencilIcon } from "./icons";

type Person = { id: string; displayName: string; avatar: string | null };
export type OccasionRow = {
  id: string; name: string; kind: string; month: number; day: number; honoreeId: string | null;
  countdown: string; status: string;
};

const KINDS: Array<[string, string]> = [["aniversario", "Aniversário"], ["namoro", "Aniversário de namoro"], ["natal", "Natal"], ["dia_namorados", "Dia dos Namorados"], ["outra", "Outra"]];

/** RF35: lista das datas, com edição na própria linha e botão para adicionar. */
export function OccasionList({ occasions, people }: { occasions: OccasionRow[]; people: Person[] }) {
  const [editing, setEditing] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-2">
      <ul className="grid gap-2">
        {occasions.map((o) => {
          if (editing === o.id) return <li key={o.id}><OccasionForm people={people} occasion={o} onDone={() => setEditing(null)} /></li>;
          const person = people.find((p) => p.id === o.honoreeId);
          return (
            <li key={o.id} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-2xl p-3 border-2" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
              <div className="w-14 h-14 rounded-xl grid place-items-center leading-none text-center border-2" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
                <span><b className="display block text-[1.4rem]">{String(o.day).padStart(2, "0")}</b><span className="text-[.7rem] font-bold" style={{ color: "var(--ink-2)" }}>{monthShort(o.month)}</span></span>
              </div>
              <div className="min-w-0">
                <p className="font-bold leading-tight">{o.name}</p>
                <p className="text-sm" style={{ color: "var(--ink-2)" }}>{o.countdown}. {o.status}</p>
              </div>
              <div className="flex items-center gap-3">
                {person?.avatar && <img src={`/avatars/${person.avatar}.svg`} alt={person.displayName} className="w-9 h-9 hidden sm:block" />}
                <IconButton label={`Editar ${o.name}`} onClick={() => setEditing(o.id)}><PencilIcon /></IconButton>
              </div>
            </li>
          );
        })}
      </ul>
      {editing === "new"
        ? <OccasionForm people={people} onDone={() => setEditing(null)} />
        : <button className="btn btn-ghost self-start" onClick={() => setEditing("new")}>Adicionar data</button>}
    </div>
  );
}

function OccasionForm({ people, occasion, onDone }: { people: Person[]; occasion?: OccasionRow; onDone: () => void }) {
  const [name, setName] = useState(occasion?.name ?? "");
  const [kind, setKind] = useState(occasion?.kind ?? "outra");
  const [month, setMonth] = useState(occasion?.month ?? 1);
  const [day, setDay] = useState(occasion?.day ?? 1);
  const [honoreeId, setHonoreeId] = useState<string>(occasion?.honoreeId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const ask = useConfirm();

  return (
    <form className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_80px_1fr] items-end rounded-[18px] border-2 p-4"
      style={{ background: "var(--surface)", borderColor: "var(--primary)" }}
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const res = await saveOccasion(occasion?.id ?? null, { name, kind: kind as never, month, day, honoreeId: honoreeId || null });
          if (res.ok) onDone(); else setError(res.error);
        });
      }}>
      <label className="flex flex-col gap-1 sm:col-span-2 xl:col-span-1"><span className="text-sm font-bold">Nome</span>
        <input className="field !text-base" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Dia em que nos conhecemos" maxLength={60} required /></label>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">Tipo</span>
        <select className="field !text-base" value={kind} onChange={(e) => setKind(e.target.value)}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">De quem</span>
        <select className="field !text-base" value={honoreeId} onChange={(e) => setHonoreeId(e.target.value)}>
          <option value="">Do casal</option>{people.map((p) => <option key={p.id} value={p.id}>{p.displayName}</option>)}
        </select></label>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">Dia</span>
        <input className="field !text-base" type="number" min={1} max={31} value={day} onChange={(e) => setDay(Number(e.target.value))} required /></label>
      <label className="flex flex-col gap-1"><span className="text-sm font-bold">Mês</span>
        <select className="field !text-base" value={month} onChange={(e) => setMonth(Number(e.target.value))}>{Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{monthLong(i + 1)}</option>)}</select></label>
      {error && <p role="alert" className="sm:col-span-2 xl:col-span-5 rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: "var(--error-bg)", color: "var(--error-ink)" }}>{error}</p>}
      <div className="sm:col-span-2 xl:col-span-5 actions">
        <button className="btn btn-primary btn-sm" disabled={pending}>{occasion ? "Salvar data" : "Adicionar data"}</button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onDone}>Cancelar</button>
        {occasion && (
          <button type="button" className="btn btn-ghost btn-sm ml-auto" style={{ color: "var(--error-ink)" }} disabled={pending}
            onClick={async () => {
              if (await ask({ title: "Excluir esta data?", body: <>“{occasion.name}” sai do calendário e para de ter lembrete.</>, confirmLabel: "Excluir data", tone: "danger" }))
                start(async () => { const r = await deleteOccasion(occasion.id); if (r.ok) onDone(); else setError(r.error); });
            }}>
            Excluir data
          </button>
        )}
      </div>
    </form>
  );
}
