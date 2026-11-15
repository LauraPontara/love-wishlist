"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createCombo } from "@/app/actions/combos";
import { MoneyInput } from "./money-input";

type Occ = { id: string; name: string; label: string };

/** Começar um presente: nome, ocasião (do calendário) e orçamento. */
export function NewComboForm({ occasions, partnerName }: { occasions: Occ[]; partnerName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [occasionId, setOccasionId] = useState<string>(occasions[0]?.id ?? "");
  const [name, setName] = useState(occasions[0]?.name ?? "");
  const [budget, setBudget] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) return <button className="btn btn-ribbon" onClick={() => setOpen(true)}>Montar novo presente</button>;

  return (
    <form className="rounded-[20px] border-2 p-4 sm:p-5 grid gap-3 sm:grid-cols-[1fr_1fr_160px] items-end" style={{ background: "var(--surface)", borderColor: "var(--line)" }}
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => {
          const res = await createCombo({ name, occasionId: occasionId || null, budget });
          if (res.ok && res.id) {
            // a tela de Meus combos fica guardada na navegação: fecha o formulário antes de sair
            setOpen(false); setBudget(""); setOccasionId(occasions[0]?.id ?? ""); setName(occasions[0]?.name ?? "");
            router.push(`/combos/${res.id}?montar=1`);
          }
          else setError("error" in res ? res.error : "Não deu para criar.");
        });
      }}>
      <label className="flex flex-col gap-1.5">
        <span className="font-bold text-sm">Ocasião</span>
        <select className="field !text-base" value={occasionId} onChange={(e) => {
          setOccasionId(e.target.value);
          const occ = occasions.find((o) => o.id === e.target.value);
          if (occ) setName(occ.name); else if (!name) setName(`Presente para ${partnerName}`);
        }}>
          {occasions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          <option value="">Sem ocasião</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-bold text-sm">Nome do presente</span>
        <input className="field !text-base" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} required />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="font-bold text-sm">Orçamento</span>
        <MoneyInput className="field !text-base" label="Orçamento" placeholder="opcional" value={budget} onChange={setBudget} />
      </label>
      {error && <p role="alert" className="sm:col-span-3 rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: "var(--error-bg)", color: "var(--error-ink)" }}>{error}</p>}
      <div className="sm:col-span-3 actions">
        <button className="btn btn-primary" disabled={pending || !name.trim()}>{pending ? "Criando…" : "Começar a montar"}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>Cancelar</button>
      </div>
    </form>
  );
}
