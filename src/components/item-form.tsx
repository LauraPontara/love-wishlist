"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { shouldWaitBeforeOwning } from "@/app/actions/combos";
import { deleteItem, renameGroup, setItemGroup, setOwned, setPreferred, type FormState } from "@/app/actions/items";
import { CATEGORIES, parsePrice, parseVariant, storeFromUrl, variantToText, type Item, type ItemGroup } from "@/lib/items/domain";
import { useConfirm } from "./confirm";
import { ExternalIcon } from "./icons";
import { TagCard } from "./tag-card";
import { UNDO_KEY } from "./item-browser";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

// Formulário de item (RF11/RF12). Responsivo: uma coluna no celular,
// campos em pares no tablet e prévia da etiqueta ao lado no desktop.
export function ItemForm({ action, item, groups = [], groupCandidates = [] }: {
  action: Action; item?: Item; groups?: ItemGroup[]; groupCandidates?: Array<{ id: string; title: string }>;
}) {
  const [state, formAction, saving] = useActionState(action, {});
  const [values, setValues] = useState({
    url: item?.url ?? "",
    title: item?.title ?? "",
    price: item?.priceCents != null ? (item.priceCents / 100).toFixed(2).replace(".", ",") : "",
    store: item?.store ?? "",
    category: item?.category ?? "Outros",
    kind: item?.kind ?? "unico",
    variant: item ? variantToText(item.variant) : "",
    notes: item?.notes ?? "",
    imageUrl: item?.imageUrl ?? "",
  });
  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));
  const err = state.fieldErrors ?? {};
  const linkChanged = item && values.url.trim() !== item.url;

  const price = parsePrice(values.price);
  const preview: Item = {
    id: "preview", ownerId: "", url: values.url, title: values.title || "Nome do item",
    imageUrl: /^https?:\/\//.test(values.imageUrl) ? values.imageUrl : null,
    priceCents: typeof price === "number" ? price : null, priceCheckedAt: null,
    store: values.store || storeFromUrl(values.url), category: values.category as Item["category"],
    variant: parseVariant(values.variant), notes: values.notes, kind: values.kind as Item["kind"],
    status: "desejado", statusChangedAt: null, createdAt: "",
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
      <form action={formAction} className="flex flex-col gap-4" noValidate>
        {state.error && <p role="alert" className="rounded-xl px-4 py-3 font-semibold" style={{ background: "var(--error-bg)", color: "var(--error-ink)" }}>{state.error}</p>}

        <Field label="Link do produto (opcional)" hint="Se tiver, cole o link com a cor e o tamanho já escolhidos no site." error={err.url}>
          <div className="flex gap-2">
            <input name="url" className="field" type="url" inputMode="url" placeholder="https://" value={values.url} onChange={set("url")} />
            {/^https?:\/\//.test(values.url.trim()) && (
              <a href={values.url.trim()} target="_blank" rel="noopener noreferrer" className="icon-btn !w-[54px] !h-auto"
                aria-label="Abrir o link na loja" title="Abrir na loja"><ExternalIcon /></a>
            )}
          </div>
        </Field>
        {item && values.url.trim() && (
          <RefetchPanel url={values.url} linkChanged={Boolean(linkChanged)}
            onApply={(patch) => setValues((v) => ({ ...v, ...patch }))} />
        )}

        <Field label="Nome" error={err.title}>
          <input name="title" className="field" value={values.title} onChange={set("title")} required maxLength={300} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Preço" hint="Opcional. Ex.: 129,90" error={err.price}>
            <input name="price" className="field" inputMode="decimal" placeholder="R$" value={values.price} onChange={set("price")} />
          </Field>
          <Field label="Loja" hint="Se ficar vazio, usamos o nome do site." error={err.store}>
            <input name="store" className="field" value={values.store} onChange={set("store")} placeholder={storeFromUrl(values.url) ?? ""} maxLength={80} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoria" error={err.category}>
            <select name="category" className="field" value={values.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <fieldset>
            <legend className="font-bold mb-1.5">Tipo</legend>
            <div className="grid grid-cols-2 p-1 rounded-2xl" style={{ background: "var(--surface-sunk)" }}>
              {([["unico", "Único"], ["sempre", "Sempre bem-vindo"]] as const).map(([v, label]) => (
                <label key={v} className="rounded-xl py-2.5 text-center text-sm font-bold cursor-pointer has-[:focus-visible]:outline has-[:focus-visible]:outline-3"
                  style={values.kind === v ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 4px rgba(28,26,74,.12)" } : { color: "var(--ink-2)" }}>
                  <input type="radio" name="kind" value={v} checked={values.kind === v} onChange={set("kind")} className="sr-only" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        <Field label="Variação" hint="Opcional. Ex.: Cor: Laranja; Tamanho: M" error={err.variant}>
          <input name="variant" className="field" value={values.variant} onChange={set("variant")} maxLength={300} />
        </Field>
        <Field label="Link da foto" hint="Opcional. Ao colar links, a foto vem sozinha quando a loja deixa." error={err.imageUrl}>
          <input name="imageUrl" className="field" type="url" placeholder="https://" value={values.imageUrl} onChange={set("imageUrl")} />
        </Field>
        <Field label="Observação" hint="Opcional. Ex.: tamanho 38, cor da segunda foto" error={err.notes}>
          <textarea name="notes" className="field min-h-[90px] resize-y" value={values.notes} onChange={set("notes")} maxLength={1000} />
        </Field>

        {item && item.kind === "unico" && values.kind === "unico" && <GroupEditor item={item} groups={groups} candidates={groupCandidates} />}

        <div className="actions pt-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Salvando…" : item ? "Salvar alterações" : "Adicionar à lista"}</button>
          {item && <ItemExtraActions item={item} />}
        </div>
      </form>

      <aside className="hidden lg:block sticky top-8" aria-label="Prévia">
        <p className="font-bold mb-3" style={{ color: "var(--ink-2)" }}>Como vai aparecer</p>
        <TagCard item={preview} badge={preview.kind === "sempre" ? <span className="badge sempre">Sempre bem-vindo</span> : undefined} />
      </aside>
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-bold">{label}</span>
      {children}
      {error ? <span className="text-sm font-semibold" style={{ color: "var(--error-ink)" }}>{error}</span>
        : hint ? <span className="text-sm" style={{ color: "var(--ink-2)" }}>{hint}</span> : null}
    </label>
  );
}

type Found = { status: string; title: string | null; imageUrl: string | null; priceCents: number | null; variant: Record<string, string> };

/** RF12/RF18: "Buscar dados de novo" e "Atualizar preço". Mostra o que achou e só aplica se a pessoa quiser. */
function RefetchPanel({ url, linkChanged, onApply }: { url: string; linkChanged: boolean; onApply: (p: Record<string, string>) => void }) {
  const [loading, setLoading] = useState(false);
  const [found, setFound] = useState<Found | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true); setError(null); setFound(null);
    try {
      const res = await fetch("/api/scrape", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ urls: [url] }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const r = data.results[0] as Found;
      if (r.status === "link_quebrado") setError("Não conseguimos acessar esse link. Verifique se ele está correto.");
      else if (r.status === "bloqueado") setError("Esse site não deixa a gente ler os dados automaticamente.");
      else setFound(r);
    } catch {
      setError("Não deu para buscar agora. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  const priceText = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));
  return (
    <div className="-mt-1 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={run} disabled={loading || !/^https?:\/\//.test(url)}>
          {loading ? "Buscando…" : linkChanged ? "Buscar dados do novo link" : "Atualizar preço e dados"}
        </button>
        {linkChanged && !found && <span className="text-sm" style={{ color: "var(--ink-2)" }}>Você trocou o link. Confira nome, preço e foto.</span>}
      </div>
      {error && <p className="rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: "var(--warn-bg)", color: "var(--warn-ink)" }}>{error}</p>}
      {found && (
        <div className="rounded-xl px-3 py-3 text-sm flex flex-col gap-2" style={{ background: "var(--ok-bg)", color: "var(--ok-ink)" }}>
          <p className="font-semibold">
            Encontramos: {[found.title, found.priceCents != null && `R$ ${priceText(found.priceCents)}`, found.imageUrl && "foto"].filter(Boolean).join(", ") || "poucos dados"}.
          </p>
          <div className="flex flex-wrap gap-2">
            {found.priceCents != null && <button type="button" className="btn btn-ghost btn-sm" onClick={() => { onApply({ price: priceText(found.priceCents) }); setFound(null); }}>Usar só o preço</button>}
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
              const patch: Record<string, string> = {};
              if (found.title) patch.title = found.title;
              if (found.priceCents != null) patch.price = priceText(found.priceCents);
              if (found.imageUrl) patch.imageUrl = found.imageUrl;
              if (Object.keys(found.variant).length) patch.variant = variantToText(found.variant);
              onApply(patch); setFound(null);
            }}>Usar tudo</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemExtraActions({ item }: { item: Item }) {
  const router = useRouter();
  const ask = useConfirm();
  const [pending, start] = useTransition();

  return (
    <>
      {item.kind === "unico" && (
        <button type="button" className="btn btn-ghost" disabled={pending}
          onClick={() => start(async () => {
            const owning = item.status === "desejado";
            // RF15: aviso vago se o outro já comprou, sem revelar nada
            if (owning && (await shouldWaitBeforeOwning(item.id))
              && !(await ask({ title: "Tem certeza?", body: "Talvez seja melhor esperar um pouco 👀", confirmLabel: "Marcar mesmo assim", cancelLabel: "Vou esperar" }))) return;
            await setOwned(item.id, owning); router.push("/");
          })}>
          {item.status === "desejado" ? "Já tenho" : "Voltar para os desejos"}
        </button>
      )}
      <button type="button" className="btn btn-ghost" style={{ color: "var(--error-ink)" }} disabled={pending}
        onClick={async () => {
          const ok = await ask({ title: "Excluir este item?", body: <>“{item.title}” sai da sua lista. Dá para desfazer logo em seguida.</>, confirmLabel: "Excluir item", tone: "danger" });
          if (!ok) return;
          start(async () => {
            const res = await deleteItem(item.id);
            if (res.ok && res.snapshot) { try { sessionStorage.setItem(UNDO_KEY, JSON.stringify(res.snapshot)); } catch {} }
            router.push("/");
          });
        }}>Excluir</button>
    </>
  );
}

/** "Quero um desses": colocar o item num grupo, escolher a ⭐, renomear ou tirar do grupo. */
function GroupEditor({ item, groups, candidates }: { item: Item; groups: ItemGroup[]; candidates: Array<{ id: string; title: string }> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [choice, setChoice] = useState("");
  const [newName, setNewName] = useState("");
  const [withItem, setWithItem] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(item.group?.name ?? "");
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => {
    setError(null);
    const res = await fn();
    if (!res.ok) setError(res.error ?? "Não deu para salvar.");
    else { setChoice(""); setRenaming(false); router.refresh(); }
  });
  const g = item.group;

  return (
    <fieldset className="rounded-[18px] border-2 p-4 flex flex-col gap-3" style={{ borderColor: "var(--line)" }}>
      <legend className="font-bold px-1">Quero um desses</legend>
      {error && <p role="alert" className="text-sm font-semibold" style={{ color: "var(--error-ink)" }}>{error}</p>}
      {g ? (
        <>
          {renaming ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input className="field !text-base !py-3 flex-1" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} aria-label="Nome do grupo" />
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setRenaming(false); setName(g.name); }}>Cancelar</button>
                <button type="button" className="btn btn-primary btn-sm" disabled={pending || !name.trim()} onClick={() => run(() => renameGroup(g.id, name))}>Salvar nome</button>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color: "var(--ink-2)" }}>
              Faz parte do grupo <strong style={{ color: "var(--ink)" }}>{g.name}</strong>. Quando uma opção for dada, as outras saem da lista junto.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button type="button" className="chip" aria-pressed={g.preferred} disabled={pending}
              onClick={() => run(() => setPreferred(item.id, !g.preferred))}>{g.preferred ? "⭐ É o preferido" : "☆ Marcar como preferido"}</button>
            {!renaming && <button type="button" className="chip" disabled={pending} onClick={() => setRenaming(true)}>Renomear grupo</button>}
            <button type="button" className="chip" disabled={pending} onClick={() => run(() => setItemGroup(item.id, null))}>Tirar do grupo</button>
          </div>
        </>
      ) : (
        <>
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>Junte opções parecidas (ex.: 3 mouses). {"Quem for dar vê todas juntas e escolhe uma."}</p>
          <select className="field !text-base" value={choice} onChange={(e) => setChoice(e.target.value)} aria-label="Grupo">
            <option value="">Não faz parte de um grupo</option>
            {groups.map((gr) => <option key={gr.id} value={gr.id}>Grupo: {gr.name}</option>)}
            {candidates.length > 0 && <option value="novo">Criar grupo novo…</option>}
          </select>
          {choice === "novo" && (
            <div className="grid gap-2 sm:grid-cols-2">
              <input className="field !text-base" placeholder="Nome do grupo (ex.: Mouse)" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={60} aria-label="Nome do grupo novo" />
              <select className="field !text-base" value={withItem} onChange={(e) => setWithItem(e.target.value)} aria-label="Outra opção do grupo">
                <option value="">Junto com qual item?</option>
                {candidates.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </div>
          )}
          {choice && (
            <button type="button" className="btn btn-ghost btn-sm self-start" disabled={pending || (choice === "novo" && (!newName.trim() || !withItem))}
              onClick={() => run(() => setItemGroup(item.id, choice === "novo" ? { newName, withItemId: withItem } : { groupId: choice }))}>
              {choice === "novo" ? "Criar grupo" : "Colocar no grupo"}
            </button>
          )}
        </>
      )}
    </fieldset>
  );
}
