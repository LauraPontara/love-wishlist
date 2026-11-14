"use client";

import { useRouter } from "next/navigation";
import { useActionState, useState, useTransition } from "react";
import { deleteItem, setOwned, type FormState } from "@/app/actions/items";
import { CATEGORIES, parsePrice, parseVariant, storeFromUrl, variantToText, type Item } from "@/lib/items/domain";
import { TagCard } from "./tag-card";
import { UNDO_KEY } from "./item-browser";

type Action = (state: FormState, formData: FormData) => Promise<FormState>;

// Formulário de item (RF11/RF12). Responsivo: uma coluna no celular,
// campos em pares no tablet e prévia da etiqueta ao lado no desktop.
export function ItemForm({ action, item }: { action: Action; item?: Item }) {
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

        <Field label="Link do produto" hint="O link exato, com a cor e o tamanho já escolhidos no site." error={err.url}>
          <input name="url" className="field" type="url" inputMode="url" placeholder="https://" value={values.url} onChange={set("url")} required />
        </Field>
        {linkChanged && (
          <p className="text-sm -mt-2" style={{ color: "var(--ink-2)" }}>
            Você trocou o link. Confira nome, preço e foto (na Fase 3 vai ter o botão “Buscar dados de novo”).
          </p>
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
        <Field label="Link da foto" hint="Opcional. Na Fase 3 a foto vem sozinha do link." error={err.imageUrl}>
          <input name="imageUrl" className="field" type="url" placeholder="https://" value={values.imageUrl} onChange={set("imageUrl")} />
        </Field>
        <Field label="Observação" hint="Opcional. Ex.: tamanho 38, cor da segunda foto" error={err.notes}>
          <textarea name="notes" className="field min-h-[90px] resize-y" value={values.notes} onChange={set("notes")} maxLength={1000} />
        </Field>

        <div className="flex flex-wrap gap-3 pt-2">
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

function ItemExtraActions({ item }: { item: Item }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [confirming, setConfirming] = useState(false);

  return (
    <>
      {item.kind === "unico" && (
        <button type="button" className="btn btn-ghost" disabled={pending}
          onClick={() => start(async () => { await setOwned(item.id, item.status === "desejado"); router.push("/"); })}>
          {item.status === "desejado" ? "Já tenho" : "Voltar para os desejos"}
        </button>
      )}
      {!confirming ? (
        <button type="button" className="btn btn-ghost" style={{ color: "var(--error-ink)" }} onClick={() => setConfirming(true)}>Excluir</button>
      ) : (
        <span className="flex flex-wrap items-center gap-2 rounded-2xl px-3 py-2" style={{ background: "var(--error-bg)", color: "var(--error-ink)" }}>
          <span className="font-semibold">Excluir este item?</span>
          <button type="button" className="btn btn-primary btn-sm" disabled={pending}
            onClick={() => start(async () => {
              const res = await deleteItem(item.id);
              if (res.ok && res.snapshot) { try { sessionStorage.setItem(UNDO_KEY, JSON.stringify(res.snapshot)); } catch {} }
              router.push("/");
            })}>Sim, excluir</button>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>Cancelar</button>
        </span>
      )}
    </>
  );
}
