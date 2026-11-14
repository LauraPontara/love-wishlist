"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { giveThis, shouldWaitBeforeOwning } from "@/app/actions/combos";
import { restoreItem, setOwned } from "@/app/actions/items";
import { shortDate } from "@/lib/combos/domain";
import { CATEGORIES, matchesSearch, parsePrice, type Item } from "@/lib/items/domain";
import { TagCard } from "./tag-card";

type Tab = "desejado" | "ja_tenho" | "recebido";
type Sort = "recentes" | "menor" | "maior" | "nome";

const TAB_LABEL: Record<Tab, string> = { desejado: "Desejos", ja_tenho: "Já tenho", recebido: "Recebidos" };
export const UNDO_KEY = "nw:undo-delete";

export type Gift = { times: number; lastAt: string; fromName: string };

export function ItemBrowser({ items, mode, ownerName, gifts = {}, purchasedByMe = [] }: {
  items: Item[]; mode: "mine" | "partner"; ownerName: string;
  gifts?: Record<string, Gift>; purchasedByMe?: string[];
}) {
  const [confirmWait, setConfirmWait] = useState<Item | null>(null);
  const purchased = useMemo(() => new Set(purchasedByMe), [purchasedByMe]);
  const [tab, setTab] = useState<Tab>("desejado");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [kind, setKind] = useState<"todos" | "unico" | "sempre">("todos");
  const [budget, setBudget] = useState("");
  const [sort, setSort] = useState<Sort>("recentes");
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState<{ text: string; undo?: () => void } | null>(null);

  // "Desfazer" depois de excluir na tela de edição (RF13)
  useEffect(() => {
    if (mode !== "mine") return;
    let raw: string | null = null;
    try { raw = sessionStorage.getItem(UNDO_KEY); sessionStorage.removeItem(UNDO_KEY); } catch {}
    if (!raw) return;
    const snapshot = JSON.parse(raw) as Record<string, unknown>;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mostra o aviso uma vez ao chegar da exclusão
    setToast({ text: `"${String(snapshot.title)}" foi excluído.`, undo: () => startTransition(async () => { await restoreItem(snapshot); setToast({ text: "Item restaurado." }); }) });
  }, [mode]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), toast.undo ? 7000 : 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const counts = useMemo(() => ({
    desejado: items.filter((i) => i.status === "desejado").length,
    ja_tenho: items.filter((i) => i.status === "ja_tenho").length,
    recebido: items.filter((i) => i.status === "recebido").length,
  }), [items]);

  const presentCategories = useMemo(() => CATEGORIES.filter((c) => items.some((i) => i.category === c)), [items]);

  const visible = useMemo(() => {
    const max = parsePrice(budget);
    const list = items
      .filter((i) => mode === "partner" || i.status === tab)
      .filter((i) => matchesSearch(i, query))
      .filter((i) => !category || i.category === category)
      .filter((i) => kind === "todos" || i.kind === kind)
      .filter((i) => typeof max !== "number" || (i.priceCents !== null && i.priceCents <= max));
    const byPrice = (a: Item, b: Item) => (a.priceCents ?? Infinity) - (b.priceCents ?? Infinity);
    if (sort === "menor") list.sort(byPrice);
    if (sort === "maior") list.sort((a, b) => (b.priceCents ?? -1) - (a.priceCents ?? -1));
    if (sort === "nome") list.sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
    return list;
  }, [items, mode, tab, query, category, kind, budget, sort]);

  // RF15: antes de marcar "Já tenho", um aviso vago se o outro já comprou (sem revelar nada)
  const askOwned = (item: Item) =>
    startTransition(async () => {
      if (await shouldWaitBeforeOwning(item.id)) setConfirmWait(item);
      else toggleOwned(item, true);
    });

  const toggleOwned = (item: Item, owned: boolean) =>
    startTransition(async () => {
      const res = await setOwned(item.id, owned);
      setToast(res.ok
        ? { text: owned ? `"${item.title}" foi para "Já tenho".` : `"${item.title}" voltou para os desejos.`, undo: () => startTransition(async () => { await setOwned(item.id, !owned); setToast(null); }) }
        : { text: res.error ?? "Não deu para atualizar." });
    });

  const filtersActive = query || category || kind !== "todos" || budget;

  return (
    <div className="flex flex-col gap-4">
      {mode === "mine" && (
        <div role="tablist" aria-label="Situação dos itens" className="grid grid-cols-3 p-1 rounded-full max-w-[520px]" style={{ background: "var(--surface-sunk)" }}>
          {(Object.keys(TAB_LABEL) as Tab[]).map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
              className="rounded-full py-2 text-[.9rem] font-bold transition-colors"
              style={tab === t ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 2px 6px rgba(28,26,74,.12)" } : { color: "var(--ink-2)" }}>
              {TAB_LABEL[t]} <span className="opacity-70">{counts[t]}</span>
            </button>
          ))}
        </div>
      )}

      {/* busca + orçamento + ordenação: empilham no celular, ficam em linha a partir do tablet */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-[1fr_170px_190px]">
        <input type="search" className="field !text-base col-span-2 md:col-span-1" placeholder="Buscar por nome, loja ou cor" value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Buscar" />
        <input className="field !text-base" inputMode="decimal" placeholder="Até R$" value={budget} onChange={(e) => setBudget(e.target.value)} aria-label="Orçamento máximo em reais" />
        <select className="field !text-base" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Ordenar">
          <option value="recentes">Mais recentes</option>
          <option value="menor">Menor preço</option>
          <option value="maior">Maior preço</option>
          <option value="nome">Nome (A–Z)</option>
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none]">
        <button className="chip" aria-pressed={kind === "sempre"} onClick={() => setKind(kind === "sempre" ? "todos" : "sempre")}>Sempre bem-vindos</button>
        <button className="chip" aria-pressed={kind === "unico"} onClick={() => setKind(kind === "unico" ? "todos" : "unico")}>Únicos</button>
        {presentCategories.map((c) => (
          <button key={c} className="chip" aria-pressed={category === c} onClick={() => setCategory(category === c ? null : c)}>{c}</button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState mode={mode} tab={tab} filtered={Boolean(filtersActive)} ownerName={ownerName} total={items.length} />
      ) : (
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3" aria-busy={pending}>
          {visible.map((item) => (
            <li key={item.id}>
              {mode === "mine" ? (
                <TagCard item={item} href={`/item/${item.id}`} dim={item.status !== "desejado"}
                  badge={item.kind === "sempre"
                    ? <span className="badge sempre">{gifts[item.id] ? `Sempre bem-vindo, ganhou ${gifts[item.id].times}x, última em ${shortDate(gifts[item.id].lastAt)}` : "Sempre bem-vindo"}</span>
                    : item.status === "recebido"
                      ? <span className="badge">{gifts[item.id] ? `Presente de ${gifts[item.id].fromName} em ${shortDate(gifts[item.id].lastAt)}` : "Recebido"}</span>
                      : undefined}
                  action={item.kind === "unico" && item.status !== "recebido" && (
                    <button type="button" className="btn btn-ghost btn-sm relative z-10" disabled={pending}
                      onClick={() => (item.status === "desejado" ? askOwned(item) : toggleOwned(item, false))}>
                      {item.status === "desejado" ? "Já tenho" : "Voltar"}
                    </button>
                  )} />
              ) : (
                <TagCard item={item} href={item.url} external dim={purchased.has(item.id) && item.kind === "unico"}
                  badge={purchased.has(item.id)
                    ? <span className="badge">Você já comprou</span>
                    : item.kind === "sempre" ? <span className="badge sempre">Sempre bem-vindo</span> : undefined}
                  action={!(purchased.has(item.id) && item.kind === "unico") && (
                    <button type="button" className="btn btn-primary btn-sm relative z-10" disabled={pending}
                      onClick={() => startTransition(async () => { await giveThis(item.id); })}>Dar este</button>
                  )} />
              )}
            </li>
          ))}
        </ul>
      )}

      {confirmWait && (
        <div role="alertdialog" aria-modal="true" aria-labelledby="wait-title" className="fixed inset-0 z-50 grid place-items-center p-4" style={{ background: "rgba(14,12,38,.55)" }}>
          <div className="w-full max-w-[420px] rounded-[24px] p-6 flex flex-col gap-4" style={{ background: "var(--surface)" }}>
            <h2 id="wait-title" className="text-xl font-extrabold">Tem certeza?</h2>
            <p style={{ color: "var(--ink-2)" }}>Talvez seja melhor esperar um pouco 👀</p>
            <div className="flex flex-wrap gap-2 justify-end">
              <button className="btn btn-ghost" onClick={() => setConfirmWait(null)}>Vou esperar</button>
              <button className="btn btn-primary" onClick={() => { const item = confirmWait; setConfirmWait(null); toggleOwned(item, true); }}>Marcar mesmo assim</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div role="status" className="fixed left-1/2 -translate-x-1/2 bottom-[100px] lg:bottom-8 z-50 flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold shadow-lg max-w-[calc(100vw-32px)]"
          style={{ background: "var(--ink)", color: "var(--bg)" }}>
          <span className="truncate">{toast.text}</span>
          {toast.undo && <button className="font-extrabold underline shrink-0" onClick={toast.undo}>Desfazer</button>}
        </div>
      )}
    </div>
  );
}

function EmptyState({ mode, tab, filtered, ownerName, total }: { mode: "mine" | "partner"; tab: Tab; filtered: boolean; ownerName: string; total: number }) {
  let text: string;
  if (filtered && total > 0) text = "Nada encontrado com esses filtros. Tente outra busca ou limpe os filtros.";
  else if (mode === "partner") text = `${ownerName} ainda não adicionou desejos. Que tal dar uma dica?`;
  else if (tab === "ja_tenho") text = "Quando você comprar algo da sua lista, marque como \"Já tenho\" e ele aparece aqui.";
  else if (tab === "recebido") text = "Os presentes que você ganhar pelos combos aparecem aqui.";
  else text = "Sua lista está vazia. Adicione o link de algo que você quer ganhar.";
  return (
    <div className="rounded-[20px] border-2 border-dashed p-6 sm:p-8 text-center flex flex-col items-center gap-4" style={{ borderColor: "var(--line)" }}>
      <p className="max-w-[46ch] leading-relaxed" style={{ color: "var(--ink-2)" }}>{text}</p>
      {mode === "mine" && tab === "desejado" && !filtered && <Link href="/item/novo" className="btn btn-ribbon">Adicionar item</Link>}
    </div>
  );
}
