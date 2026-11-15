"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { giveThis, shouldWaitBeforeOwning } from "@/app/actions/combos";
import { createGroup, deleteItem, restoreItem, setOwned } from "@/app/actions/items";
import { shortDate } from "@/lib/combos/domain";
import { CATEGORIES, CATEGORY_EMOJI, formatPrice, matchesSearch, parsePrice, type Item } from "@/lib/items/domain";
import { useConfirm } from "./confirm";
import { PencilIcon, TrashIcon } from "./icons";
import { Swipe } from "./swipe";
import { TagCard } from "./tag-card";

type Tab = "desejado" | "ja_tenho" | "recebido";
type Sort = "recentes" | "menor" | "maior" | "nome";

const TAB_LABEL: Record<Tab, string> = { desejado: "Desejos", ja_tenho: "Já tenho", recebido: "Recebidos" };
export const UNDO_KEY = "nw:undo-delete";

export type Gift = { times: number; lastAt: string; fromName: string };

export function ItemBrowser({ items, mode, ownerName, gifts = {}, purchasedByMe = [], inMyCombos = [] }: {
  items: Item[]; mode: "mine" | "partner"; ownerName: string;
  gifts?: Record<string, Gift>; purchasedByMe?: string[];
  /** itens do outro que já estão em algum presente meu (montado ou comprado) */
  inMyCombos?: string[];
}) {
  const inCombos = useMemo(() => new Set(inMyCombos), [inMyCombos]);
  // modo "Agrupar": escolher itens únicos para virar um grupo "quero um desses"
  const [grouping, setGrouping] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [groupError, setGroupError] = useState<string | null>(null);
  const ask = useConfirm();
  const router = useRouter();
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
      if (await shouldWaitBeforeOwning(item.id)
        && !(await ask({ title: "Tem certeza?", body: "Talvez seja melhor esperar um pouco 👀", confirmLabel: "Marcar mesmo assim", cancelLabel: "Vou esperar" }))) return;
      toggleOwned(item, true);
    });

  const toggleOwned = (item: Item, owned: boolean) =>
    startTransition(async () => {
      const res = await setOwned(item.id, owned);
      setToast(res.ok
        ? { text: owned ? (item.group ? `"${item.title}" foi para "Já tenho" e o grupo ${item.group.name} saiu junto.` : `"${item.title}" foi para "Já tenho".`) : `"${item.title}" voltou para os desejos.`, undo: () => startTransition(async () => { await setOwned(item.id, !owned); setToast(null); }) }
        : { text: res.error ?? "Não deu para atualizar." });
    });

  const remove = async (item: Item) => {
    const ok = await ask({ title: "Excluir este item?", body: <>“{item.title}” sai da sua lista. Dá para desfazer logo em seguida.</>, confirmLabel: "Excluir item", tone: "danger" });
    if (!ok) return;
    startTransition(async () => {
      const res = await deleteItem(item.id);
      const snapshot = res.snapshot;
      setToast(res.ok && snapshot
        ? { text: `"${item.title}" foi excluído.`, undo: () => startTransition(async () => { await restoreItem(snapshot); setToast({ text: "Item restaurado." }); }) }
        : { text: "Não deu para excluir." });
    });
  };

  const filtersActive = query || category || kind !== "todos" || budget;

  const toggleSelected = (id: string) => setSelected((prev) => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const stopGrouping = () => { setGrouping(false); setSelected(new Set()); setGroupName(""); setGroupError(null); };
  const submitGroup = () => startTransition(async () => {
    setGroupError(null);
    const res = await createGroup([...selected], groupName);
    if (res.ok) { setToast({ text: `Grupo "${groupName.trim()}" criado. Se quiser, marque uma ⭐ de preferido na edição do item.` }); stopGrouping(); }
    else setGroupError(res.error);
  });

  // na lista do outro, itens do mesmo grupo viram um card só
  type Entry = { type: "item"; item: Item } | { type: "group"; id: string; name: string; items: Item[] };
  const entries = useMemo<Entry[]>(() => {
    if (mode !== "partner") return visible.map((item) => ({ type: "item", item }));
    const out: Entry[] = [];
    const byGroup = new Map<string, Entry & { type: "group" }>();
    for (const item of visible) {
      if (!item.group) { out.push({ type: "item", item }); continue; }
      let g = byGroup.get(item.group.id);
      if (!g) { g = { type: "group", id: item.group.id, name: item.group.name, items: [] }; byGroup.set(item.group.id, g); out.push(g); }
      g.items.push(item);
    }
    for (const g of byGroup.values()) g.items.sort((a, b) => Number(Boolean(b.group?.preferred)) - Number(Boolean(a.group?.preferred)));
    return out;
  }, [visible, mode]);

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
      {mode === "mine" && tab === "desejado" && !grouping && items.filter((i) => i.kind === "unico" && i.status === "desejado").length >= 2 && (
        <p className="text-sm -mt-1" style={{ color: "var(--ink-2)" }}>
          Tem opções parecidas (ex.: 3 mouses)?{" "}
          <button type="button" className="font-extrabold underline" style={{ color: "var(--ink)" }} onClick={() => setGrouping(true)}>Agrupar como “quero um desses”</button>
        </p>
      )}
      {grouping && (
        <div className="rounded-[18px] border-2 p-4 flex flex-col gap-1" style={{ background: "var(--surface)", borderColor: "var(--secondary)" }}>
          <p className="font-extrabold">Escolha as opções do grupo</p>
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>Toque em 2 ou mais itens únicos. Quando um deles for dado (ou você marcar “Já tenho”), os outros saem da lista junto.</p>
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
          {entries.map((entry) => {
            if (entry.type === "group") {
              return (
                <li key={entry.id} className="md:col-span-2 2xl:col-span-3">
                  <GroupCard name={entry.name} items={entry.items} inCombos={inCombos} purchased={purchased} pending={pending}
                    onGive={(id) => startTransition(async () => { await giveThis(id); })} />
                </li>
              );
            }
            const item = entry.item;
            if (grouping) {
              const selectable = item.kind === "unico" && item.status === "desejado";
              const on = selected.has(item.id);
              return (
                <li key={item.id}>
                  <button type="button" disabled={!selectable} aria-pressed={on} onClick={() => toggleSelected(item.id)}
                    className="block w-full text-left relative rounded-[16px] disabled:opacity-40"
                    style={{ outline: on ? "3px solid var(--secondary)" : "none", outlineOffset: 2 }}>
                    <TagCard item={item} badge={!selectable ? <span className="badge">Sempre bem-vindo não entra em grupo</span> : undefined}
                      action={selectable && (
                        <span aria-hidden="true" className="w-8 h-8 rounded-full grid place-items-center font-black border-2"
                          style={on ? { background: "var(--secondary)", borderColor: "var(--secondary)", color: "var(--on-secondary)" } : { borderColor: "var(--line)" }}>{on ? "✓" : ""}</span>
                      )} />
                  </button>
                </li>
              );
            }
            return (
            <li key={item.id}>
              {mode === "mine" ? (
                <Swipe radius="0 16px 16px 0" label={`Ações de ${item.title}`}
                  actions={[{ label: "Editar", icon: <PencilIcon />, style: { background: "var(--secondary)", color: "var(--on-secondary)" }, onClick: () => router.push(`/item/${item.id}`) },
                    { label: "Excluir", icon: <TrashIcon />, style: { background: "#C81E4A", color: "#fff" }, disabled: pending, onClick: () => remove(item) }]}>
                <TagCard item={item} href={item.url || `/item/${item.id}`} external={Boolean(item.url)} desktopHref={`/item/${item.id}`} dim={item.status !== "desejado"}
                  badge={<Badges>
                    {item.kind === "sempre"
                      ? <span className="badge sempre">{gifts[item.id] ? `Sempre bem-vindo, ganhou ${gifts[item.id].times}x, última em ${shortDate(gifts[item.id].lastAt)}` : "Sempre bem-vindo"}</span>
                      : item.status === "recebido"
                        ? <span className="badge">{gifts[item.id] ? `Presente de ${gifts[item.id].fromName} em ${shortDate(gifts[item.id].lastAt)}` : "Recebido"}</span>
                        : null}
                    {item.group && <span className="badge">{item.group.preferred ? "⭐ " : ""}Grupo: {item.group.name}</span>}
                    {item.leftWithGroup && item.status === "ja_tenho" && <span className="badge">Saiu junto com o grupo</span>}
                  </Badges>}
                  action={item.kind === "unico" && item.status !== "recebido" && (
                    <button type="button" className="btn btn-ghost btn-sm relative z-10" disabled={pending}
                      onClick={() => (item.status === "desejado" ? askOwned(item) : toggleOwned(item, false))}>
                      {item.status === "desejado" ? "Já tenho" : "Voltar"}
                    </button>
                  )} />
                </Swipe>
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
            );
          })}
        </ul>
      )}

      {grouping && <div aria-hidden="true" className="h-36" />}
      {grouping && (
        <div className="fixed inset-x-0 bottom-[76px] lg:bottom-0 lg:left-[252px] z-40 px-4 pb-4 pt-3 border-t-2 flex flex-col gap-2"
          style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
          {groupError && <p role="alert" className="text-sm font-semibold" style={{ color: "var(--error-ink)" }}>{groupError}</p>}
          <div className="flex flex-col sm:flex-row gap-2 max-w-[900px] w-full mx-auto">
            <input className="field !text-base !py-3 flex-1" placeholder="Nome do grupo (ex.: Mouse)" value={groupName} maxLength={60}
              onChange={(e) => setGroupName(e.target.value)} aria-label="Nome do grupo" />
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button type="button" className="btn btn-ghost" onClick={stopGrouping}>Cancelar</button>
              <button type="button" className="btn btn-primary" disabled={pending || selected.size < 2 || !groupName.trim()} onClick={submitGroup}>
                Agrupar{selected.size ? ` (${selected.size})` : ""}
              </button>
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

function Badges({ children }: { children: React.ReactNode }) {
  const list = (Array.isArray(children) ? children : [children]).filter(Boolean);
  if (!list.length) return null;
  return <span className="flex flex-wrap gap-1">{list}</span>;
}

/** Lista do outro: "quero um desses", com o preferido (⭐) em primeiro. */
function GroupCard({ name, items, inCombos, purchased, pending, onGive }: {
  name: string; items: Item[]; inCombos: Set<string>; purchased: Set<string>; pending: boolean; onGive: (itemId: string) => void;
}) {
  const chosen = items.find((i) => inCombos.has(i.id));
  return (
    <section className="rounded-[20px] border-2 p-4 flex flex-col gap-3" style={{ background: "var(--surface)", borderColor: "var(--line)" }} aria-label={`Quero um desses: ${name}`}>
      <div>
        <p className="text-xs font-bold" style={{ color: "var(--ink-2)" }}>Quero um desses</p>
        <h3 className="text-lg font-extrabold leading-tight" style={{ fontVariationSettings: "'wdth' 85" }}>{name}</h3>
        {chosen && <p className="text-sm font-semibold mt-1" style={{ color: "var(--secondary)" }}>No seu presente: {chosen.title}</p>}
      </div>
      <ul className="grid gap-2 md:grid-cols-2 2xl:grid-cols-3">
        {items.map((i) => {
          const bought = purchased.has(i.id);
          return (
            <li key={i.id} className="relative flex items-center gap-3 rounded-xl p-2 border-2"
              style={{ background: "var(--bg)", borderColor: i.group?.preferred ? "var(--ribbon)" : "transparent" }}>
              {i.url && <a href={i.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-[1] rounded-xl" aria-label={`${i.title} (abre na loja)`} />}
              <div className="w-12 h-12 rounded-lg overflow-hidden grid place-items-center text-xl shrink-0" style={{ background: "var(--surface)" }}>
                {i.imageUrl ? <img src={i.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : CATEGORY_EMOJI[i.category]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm leading-tight line-clamp-2">{i.title}</p>
                <p className="text-xs truncate" style={{ color: i.group?.preferred ? "var(--ink)" : "var(--ink-2)" }}>
                  {i.group?.preferred ? "⭐ Preferido" : bought ? "Você já comprou" : inCombos.has(i.id) ? "No seu presente" : (i.store ?? i.category)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-sm font-extrabold whitespace-nowrap">{formatPrice(i.priceCents)}</span>
                {!bought && <button type="button" className="btn btn-primary btn-sm relative z-10 !min-h-0 !py-1.5" disabled={pending} onClick={() => onGive(i.id)}>Dar este</button>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
