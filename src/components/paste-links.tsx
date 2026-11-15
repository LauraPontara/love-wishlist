"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createItems, type Draft } from "@/app/actions/items";
import { CATEGORIES, CATEGORY_EMOJI, centsToMoneyInput, type Category } from "@/lib/items/domain";
import { extractUrls } from "@/lib/scrape/parse";
import { bunnyCheer } from "./bunnies";
import { CopyIcon, IconButton, TrashIcon } from "./icons";
import type { ScrapeResult } from "@/lib/scrape/scrape";
import { MoneyInput } from "./money-input";

type Card = Draft & { key: string; errors?: Record<string, string> };

const NOTES: Record<Draft["scrapeStatus"], { tone: "ok" | "warn" | "err"; text: string } | null> = {
  ok: { tone: "ok", text: "Tudo encontrado." },
  parcial: { tone: "warn", text: "Achamos parte dos dados. Complete o que estiver destacado." },
  bloqueado: { tone: "warn", text: "Esse site não deixa a gente ler os dados automaticamente. O link está salvo, é só preencher nome e preço." },
  link_quebrado: { tone: "err", text: "Não conseguimos acessar esse link. Verifique se ele está correto ou traga o link de outra loja." },
  manual: null,
};
const TONE = {
  ok: { background: "var(--ok-bg)", color: "var(--ok-ink)" },
  warn: { background: "var(--warn-bg)", color: "var(--warn-ink)" },
  err: { background: "var(--error-bg)", color: "var(--error-ink)" },
};

const toDraft = (r: ScrapeResult): Card => ({
  key: crypto.randomUUID(),
  url: r.url, title: r.title ?? "", price: centsToMoneyInput(r.priceCents),
  store: r.store ?? "", category: r.category, kind: r.kind,
  variant: Object.entries(r.variant).map(([k, v]) => `${k}: ${v}`).join("; "),
  notes: "", imageUrl: r.imageUrl ?? "", scrapeStatus: r.status,
});

// RF04–RF09: colar um ou vários links → extração → revisão em cartões → Salvar todos.
export function PasteLinks({ initialText = "", autoFetch = false, onManual }: { initialText?: string; autoFetch?: boolean; onManual?: () => void }) {
  const router = useRouter();
  const [text, setText] = useState(initialText);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, startSaving] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const urls = useMemo(() => extractUrls(text), [text]);

  async function fetchData() {
    setMessage(null);
    setLoading(true);
    const batch = urls.slice(0, 10);
    // placeholders "buscando…" na ordem colada
    setCards(batch.map((url) => ({ ...toDraft({ url, status: "parcial", title: null, imageUrl: null, priceCents: null, store: null, category: "Outros", kind: "unico", variant: {} }), scrapeStatus: "manual", title: "" })));
    try {
      const res = await fetch("/api/scrape", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ urls: batch }) });
      const data = (await res.json()) as { results?: ScrapeResult[]; error?: string };
      if (!res.ok || !data.results) throw new Error(data.error ?? "erro");
      setCards(data.results.map(toDraft));
      if (urls.length > 10) setMessage("Buscamos os 10 primeiros links. Cole o resto depois de salvar.");
    } catch (e) {
      setCards([]);
      setMessage(e instanceof Error && e.message !== "erro" ? e.message : "Não deu para buscar os dados agora. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  // veio do "Compartilhar" do Android: já busca sem precisar tocar no botão
  const started = useRef(false);
  useEffect(() => {
    if (!autoFetch || started.current || !urls.length) return;
    started.current = true;
    void fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, urls.length]);

  const update = (key: string, patch: Partial<Card>) => setCards((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch, errors: undefined } : c)));
  const remove = (key: string) => setCards((cs) => cs.filter((c) => c.key !== key));
  // mesma loja/link, outra opção (cor, modelo): copia o cartão logo abaixo
  const duplicate = (key: string) => setCards((cs) => cs.flatMap((c) => (c.key === key ? [c, { ...c, key: crypto.randomUUID(), errors: undefined }] : [c])));

  function saveAll() {
    startSaving(async () => {
      const drafts: Draft[] = cards.map((c) => ({
        url: c.url, title: c.title, price: c.price, store: c.store, category: c.category, kind: c.kind,
        variant: c.variant, notes: c.notes, imageUrl: c.imageUrl, scrapeStatus: c.scrapeStatus,
      }));
      const { savedIndexes, errors } = await createItems(drafts);
      if (savedIndexes.length) bunnyCheer("item:salvo");
      const remaining = cards.map((c, i) => ({ ...c, errors: errors[i] })).filter((_, i) => !savedIndexes.includes(i));
      if (!remaining.length) { setCards([]); setText(""); setMessage(null); router.push("/"); return; }
      setCards(remaining);
      setMessage(savedIndexes.length
        ? `${savedIndexes.length} ${savedIndexes.length === 1 ? "item salvo" : "itens salvos"}. Confira ${remaining.length === 1 ? "o que ficou" : "os que ficaram"}.`
        : "Confira os campos destacados.");
    });
  }

  if (cards.length === 0 || loading && cards.every((c) => !c.title)) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-bold">Links</span>
            <textarea className="field min-h-[180px] sm:min-h-[220px] resize-y !text-[.95rem] leading-relaxed" value={text} onChange={(e) => setText(e.target.value)}
              placeholder={"Cole um link por linha.\nTambém dá para colar a mensagem inteira do WhatsApp."} disabled={loading} />
          </label>
          {message && <p role="alert" className="rounded-xl px-4 py-3 font-semibold" style={TONE.err}>{message}</p>}
          <div className="actions items-center">
            <button className="btn btn-primary" disabled={!urls.length || loading} onClick={fetchData}>
              {loading ? `Buscando ${Math.min(urls.length, 10)} ${urls.length === 1 ? "link" : "links"}…` : urls.length > 1 ? `Buscar dados dos ${Math.min(urls.length, 10)} links` : "Buscar dados"}
            </button>
            <span className="text-sm" style={{ color: "var(--ink-2)" }}>
              {urls.length ? `${urls.length} ${urls.length === 1 ? "link encontrado" : "links encontrados"}` : "Nenhum link ainda"}
            </span>
          </div>
          {loading && (
            <ul className="grid gap-3 md:grid-cols-2 mt-2" aria-live="polite">
              {cards.map((c) => (
                <li key={c.key} className="tag animate-pulse">
                  <div className="w-[58px] h-[58px] rounded-xl" style={{ background: "var(--bg)" }} />
                  <div className="min-w-0"><p className="font-bold">Buscando dados…</p><p className="text-sm truncate" style={{ color: "var(--ink-2)" }}>{c.store}</p></div>
                  <span />
                </li>
              ))}
            </ul>
          )}
        </div>
        <aside className="rounded-[20px] border-2 border-dashed p-5 text-sm leading-relaxed" style={{ borderColor: "var(--line)", color: "var(--ink-2)" }}>
          <p className="font-bold mb-2" style={{ color: "var(--ink)" }}>Como funciona</p>
          <p>A gente abre cada link e tenta trazer nome, foto, preço e a variação escolhida. Você confere tudo antes de salvar.</p>
          <p className="mt-2">Algumas lojas (Shein, Magalu, Beleza na Web) não deixam ler os dados. Nelas o link fica salvo e você preenche o resto.</p>
          {onManual && <p className="mt-3"><button type="button" onClick={onManual} className="font-bold underline" style={{ color: "var(--ink)" }}>Prefiro preencher à mão</button></p>}
        </aside>
      </div>
    );
  }

  const needAttention = cards.filter((c) => c.scrapeStatus !== "ok" || c.errors).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p style={{ color: "var(--ink-2)" }}>
          {cards.length} {cards.length === 1 ? "item" : "itens"}{needAttention ? `, ${needAttention} ${needAttention === 1 ? "precisa" : "precisam"} de você` : ", tudo certo"}
        </p>
        <button className="btn btn-ghost btn-sm" onClick={() => { setCards([]); setMessage(null); }}>Colar outros links</button>
      </div>
      {message && <p role="status" className="rounded-xl px-4 py-3 font-semibold" style={TONE.warn}>{message}</p>}

      <ul className="grid gap-4 xl:grid-cols-2">
        {cards.map((c) => <ReviewCard key={c.key} card={c} onChange={(p) => update(c.key, p)} onRemove={() => remove(c.key)} onDuplicate={() => duplicate(c.key)} />)}
      </ul>

      <div className="sticky bottom-[96px] lg:bottom-6 z-30 flex justify-end">
        <button className="btn btn-primary shadow-lg w-full sm:w-auto" disabled={saving || !cards.length} onClick={saveAll}>
          {saving ? "Salvando…" : cards.length === 1 ? "Salvar item" : `Salvar ${cards.length} itens`}
        </button>
      </div>
    </div>
  );
}

function ReviewCard({ card, onChange, onRemove, onDuplicate }: { card: Card; onChange: (p: Partial<Card>) => void; onRemove: () => void; onDuplicate: () => void }) {
  const note = card.errors?.form ? { tone: "err" as const, text: card.errors.form } : card.errors?.url ? { tone: "err" as const, text: card.errors.url } : NOTES[card.scrapeStatus];
  const missing = (v: string) => (card.scrapeStatus !== "ok" && !v.trim() ? { borderStyle: "dashed", borderColor: "var(--primary)" } : undefined);
  const err = card.errors ?? {};
  return (
    <li className="rounded-[20px] border-2 overflow-hidden flex flex-col" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
      {note && <p className="px-4 py-2.5 text-sm font-semibold" style={TONE[note.tone]}>{note.text}</p>}
      <div className="p-4 grid grid-cols-[72px_1fr] gap-x-3 gap-y-3">
        <div className="w-[72px] h-[72px] rounded-xl overflow-hidden grid place-items-center text-[30px] row-span-2" style={{ background: "var(--bg)" }}>
          {card.imageUrl
            ? <img src={card.imageUrl} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            : <span aria-hidden="true">{CATEGORY_EMOJI[card.category as Category] ?? "🎁"}</span>}
        </div>
        <label className="flex flex-col gap-1 min-w-0">
          <span className="text-xs font-bold" style={{ color: "var(--ink-2)" }}>Nome</span>
          <input className="field !py-2.5 !text-[.95rem]" style={missing(card.title)} value={card.title} onChange={(e) => onChange({ title: e.target.value })} placeholder="Nome do item" />
          {err.title && <span className="text-xs font-semibold" style={{ color: "var(--error-ink)" }}>{err.title}</span>}
        </label>
        <div className="grid grid-cols-2 gap-2 min-w-0">
          <label className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-bold" style={{ color: "var(--ink-2)" }}>Preço</span>
            <MoneyInput className="field !py-2.5 !text-[.95rem]" style={missing(card.price)} label="Preço" value={card.price} onChange={(v) => onChange({ price: v })} />
            {err.price && <span className="text-xs font-semibold" style={{ color: "var(--error-ink)" }}>{err.price}</span>}
          </label>
          <label className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-bold" style={{ color: "var(--ink-2)" }}>Categoria</span>
            <select className="field !py-2.5 !text-[.95rem]" value={card.category} onChange={(e) => onChange({ category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-xs font-bold" style={{ color: "var(--ink-2)" }}>Variação (cor, tamanho…)</span>
          <input className="field !py-2.5 !text-[.95rem]" value={card.variant} onChange={(e) => onChange({ variant: e.target.value })} placeholder="Ex.: Cor: Laranja; Tamanho: M" />
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-xs font-bold" style={{ color: "var(--ink-2)" }}>Link</span>
          <input className="field !py-2.5 !text-[.85rem]" value={card.url} onChange={(e) => onChange({ url: e.target.value })} />
          {err.url && <span className="text-xs font-semibold" style={{ color: "var(--error-ink)" }}>{err.url}</span>}
        </label>
        <label className="flex flex-col gap-1 col-span-2">
          <span className="text-xs font-bold" style={{ color: "var(--ink-2)" }}>Link da foto (opcional)</span>
          <input className="field !py-2.5 !text-[.85rem]" value={card.imageUrl} onChange={(e) => onChange({ imageUrl: e.target.value })} placeholder="https://" />
          {err.imageUrl && <span className="text-xs font-semibold" style={{ color: "var(--error-ink)" }}>{err.imageUrl}</span>}
        </label>
        <div className="col-span-2 flex flex-wrap items-center justify-between gap-3">
          <div role="radiogroup" aria-label="Tipo" className="grid grid-cols-2 p-1 rounded-xl" style={{ background: "var(--surface-sunk)" }}>
            {([["unico", "Único"], ["sempre", "Sempre bem-vindo"]] as const).map(([v, label]) => (
              <button key={v} type="button" role="radio" aria-checked={card.kind === v} onClick={() => onChange({ kind: v })}
                className="rounded-lg px-3 py-1.5 text-sm font-bold"
                style={card.kind === v ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 4px rgba(28,26,74,.12)" } : { color: "var(--ink-2)" }}>
                {label}
              </button>
            ))}
          </div>
          <span className="flex gap-2">
            <IconButton label="Duplicar (outra opção do mesmo link)" onClick={onDuplicate}><CopyIcon /></IconButton>
            <IconButton label="Descartar" tone="danger" onClick={onRemove}><TrashIcon /></IconButton>
          </span>
        </div>
      </div>
    </li>
  );
}
