import { z } from "zod";

// Regras e formatos dos itens, sem dependência de servidor (testáveis).

export const CATEGORIES = [
  "Beleza", "Cuidados pessoais", "Comida & doces", "Roupas", "Acessórios",
  "Tecnologia", "Casa", "Livros & papelaria", "Experiências", "Outros",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_EMOJI: Record<Category, string> = {
  "Beleza": "💄", "Cuidados pessoais": "🧼", "Comida & doces": "🍫", "Roupas": "👗", "Acessórios": "🧢",
  "Tecnologia": "🎧", "Casa": "🪴", "Livros & papelaria": "📚", "Experiências": "🎟️", "Outros": "🎁",
};

export type Kind = "unico" | "sempre";
export type Status = "desejado" | "ja_tenho" | "recebido";

export type Item = {
  id: string;
  ownerId: string;
  url: string;
  title: string;
  imageUrl: string | null;
  priceCents: number | null;
  priceCheckedAt: string | null;
  store: string | null;
  category: Category;
  variant: Record<string, string>;
  notes: string | null;
  kind: Kind;
  status: Status;
  statusChangedAt: string | null;
  createdAt: string;
};

// ---------- URL ----------
const TRACKING = /^(utm_\w+|fbclid|gclid|gbraid|wbraid|mc_\w+|igshid|si|ref_?|spm|_ga|srsltid|sp_atk|xptdk|sr_\w+)$/i;

/** Normaliza o link para detectar duplicados (RF10). Mantém parâmetros de variação. */
export function normalizeUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/^m\./, "");
  const params = [...url.searchParams.entries()]
    .filter(([k]) => !TRACKING.test(k))
    .sort(([a], [b]) => a.localeCompare(b));
  const query = params.length ? `?${new URLSearchParams(params).toString()}` : "";
  const path = url.pathname.replace(/\/+$/, "") || "";
  return `${host}${path}${query}`;
}

/** Nome da loja a partir do domínio: "www.kabum.com.br" → "Kabum". */
export function storeFromUrl(input: string): string | null {
  try {
    const host = new URL(input).hostname.toLowerCase().replace(/^(www|m|produto|pt|br)\./, "");
    const name = host.split(".")[0];
    const known: Record<string, string> = {
      mercadolivre: "Mercado Livre", amazon: "Amazon", magazineluiza: "Magalu", belezanaweb: "Beleza na Web",
      boticario: "Boticário", epocacosmeticos: "Época Cosméticos", aliexpress: "AliExpress", americanas: "Americanas",
    };
    return known[name] ?? (name ? name[0].toUpperCase() + name.slice(1) : null);
  } catch {
    return null;
  }
}

// ---------- preço ----------
/** "R$ 1.234,56" | "1234.56" | "129,9" → centavos. Vazio → null. */
export function parsePrice(input: string | null | undefined): number | null | "invalido" {
  const raw = (input ?? "").replace(/R\$|\s/gi, "");
  if (!raw) return null;
  let normalized = raw;
  if (raw.includes(",")) normalized = raw.replace(/\./g, "").replace(",", ".");
  else if ((raw.match(/\./g) ?? []).length > 1) normalized = raw.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return "invalido";
  return Math.round(Number(normalized) * 100);
}

export function formatPrice(cents: number | null): string {
  if (cents === null) return "Sem preço";
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// ---------- variação ----------
/** "Cor: Laranja; Tamanho: M" → { Cor: "Laranja", Tamanho: "M" } */
export function parseVariant(input: string | null | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (input ?? "").split(/[;\n]/)) {
    const [k, ...rest] = part.split(":");
    const key = k?.trim();
    const value = rest.join(":").trim();
    if (key && value) out[key.slice(0, 30)] = value.slice(0, 60);
  }
  return out;
}

export function variantToText(variant: Record<string, string>): string {
  return Object.entries(variant).map(([k, v]) => `${k}: ${v}`).join("; ");
}

// ---------- formulário ----------
export const itemFormSchema = z.object({
  url: z.string().trim().max(2000).default("")
    .refine((v) => !v || normalizeUrl(v) !== null, "Esse link não parece válido. Ele precisa começar com https://"),
  title: z.string().trim().min(1, "Dê um nome para o item.").max(300),
  price: z.string().trim().max(30).optional(),
  store: z.string().trim().max(80).optional(),
  category: z.enum(CATEGORIES),
  kind: z.enum(["unico", "sempre"]),
  variant: z.string().trim().max(300).optional(),
  notes: z.string().trim().max(1000).optional(),
  imageUrl: z.string().trim().max(2000).optional()
    .refine((v) => !v || /^https?:\/\/\S+$/.test(v), "A foto precisa ser um link https://"),
});
export type ItemForm = z.infer<typeof itemFormSchema>;

// ---------- busca (RF22) ----------
export const fold = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

export function matchesSearch(item: Pick<Item, "title" | "store" | "notes" | "variant">, query: string): boolean {
  const q = fold(query.trim());
  if (!q) return true;
  const hay = fold([item.title, item.store ?? "", item.notes ?? "", ...Object.entries(item.variant).flat()].join(" "));
  return q.split(/\s+/).every((word) => hay.includes(word));
}
