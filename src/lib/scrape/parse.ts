// Leitura de dados de produto a partir do HTML (sem rede, testável).
// Ordem: leitor da loja → JSON-LD Product → OpenGraph/meta (ADR-008, pesquisa-extracao.md).
import { parsePrice } from "@/lib/items/domain";

export type Parsed = {
  title?: string;
  imageUrl?: string;
  priceCents?: number;
  variant?: Record<string, string>;
};

const ENTITIES: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
export function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

export function absoluteUrl(src: string | undefined, base: string): string | undefined {
  if (!src) return undefined;
  try {
    const u = new URL(decodeEntities(src), base);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

/** Preço vindo de JSON-LD/meta: número, "299.90", "299,90" ou "R$ 1.234,56". */
export function priceToCents(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return Math.round(value * 100);
  if (typeof value === "string") {
    const s = value.trim();
    if (/^\d+(\.\d{1,2})?$/.test(s)) return Number(s) > 0 ? Math.round(Number(s) * 100) : undefined;
    const p = parsePrice(s);
    if (typeof p === "number" && p > 0) return p;
  }
  return undefined;
}

function meta(html: string, key: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    const name = tag.match(/\b(?:property|name|itemprop)\s*=\s*["']([^"']+)["']/i)?.[1];
    if (name?.toLowerCase() === key.toLowerCase()) {
      const content = tag.match(/\bcontent\s*=\s*"([^"]*)"/i)?.[1] ?? tag.match(/\bcontent\s*=\s*'([^']*)'/i)?.[1];
      if (content) return decodeEntities(content);
    }
  }
  return undefined;
}

// ---------- JSON-LD ----------
type Node = Record<string, unknown>;
const types = (n: Node) => ([] as unknown[]).concat(n["@type"] ?? []).map(String);

function jsonLdNodes(html: string): Node[] {
  const out: Node[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (v && typeof v === "object") {
      out.push(v as Node);
      const g = (v as Node)["@graph"];
      if (g) walk(g);
    }
  };
  for (const m of html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try { walk(JSON.parse(m[1].trim())); } catch { /* bloco malformado: ignora */ }
  }
  return out;
}

function firstImage(img: unknown): string | undefined {
  if (typeof img === "string") return img;
  if (Array.isArray(img)) return firstImage(img[0]);
  if (img && typeof img === "object") return firstImage((img as Node).url ?? (img as Node).contentUrl);
  return undefined;
}

export function parseJsonLd(html: string, base: string): Parsed {
  const nodes = jsonLdNodes(html);
  const product = nodes.find((n) => types(n).some((t) => /^(Product|ProductGroup|IndividualProduct)$/i.test(t)));
  if (!product) return {};
  const offersRaw = product.offers ?? (Array.isArray(product.hasVariant) ? (product.hasVariant[0] as Node)?.offers : undefined);
  const offers = ([] as unknown[]).concat(offersRaw ?? []) as Node[];
  const offer = offers[0] ?? {};
  const inner = ([] as unknown[]).concat(offer.offers ?? []) as Node[]; // AggregateOffer com offers
  const spec = offer.priceSpecification as Node | undefined;
  const price = priceToCents(offer.price) ?? priceToCents(offer.lowPrice) ?? priceToCents(inner[0]?.price) ?? priceToCents(spec?.price);
  const variant: Record<string, string> = {};
  if (typeof product.color === "string" && product.color) variant.Cor = decodeEntities(product.color);
  if (typeof product.size === "string" && product.size) variant.Tamanho = decodeEntities(product.size);
  return {
    title: typeof product.name === "string" ? decodeEntities(product.name) : undefined,
    imageUrl: absoluteUrl(firstImage(product.image), base),
    priceCents: price,
    variant: Object.keys(variant).length ? variant : undefined,
  };
}

export function parseOpenGraph(html: string, base: string): Parsed {
  const title = meta(html, "og:title") ?? meta(html, "twitter:title") ?? decodeEntities(html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ?? "");
  return {
    title: title || undefined,
    imageUrl: absoluteUrl(meta(html, "og:image") ?? meta(html, "og:image:secure_url") ?? meta(html, "twitter:image"), base),
    priceCents: priceToCents(meta(html, "product:price:amount") ?? meta(html, "og:price:amount") ?? meta(html, "price")),
  };
}

// ---------- Amazon (sem JSON-LD; seletores próprios) ----------
export function parseAmazon(html: string, base: string): Parsed {
  const title = html.match(/id="productTitle"[^>]*>([\s\S]*?)<\/span>/i)?.[1];
  const image = html.match(/data-old-hires="([^"]+)"/i)?.[1] ?? html.match(/"hiRes":"([^"]+)"/)?.[1] ?? html.match(/"large":"([^"]+)"/)?.[1];
  // o preço "de verdade" fica no bloco corePrice; o resto da página tem fretes, parcelas etc.
  const coreIdx = html.search(/id="(corePrice(?:Display)?_desktop_feature_div|corePriceDisplay_desktop_feature_div|corePrice_feature_div|apex_desktop)"/i);
  const scope = coreIdx >= 0 ? html.slice(coreIdx, coreIdx + 6000) : "";
  const offscreen = scope.match(/class="a-offscreen">\s*([^<]+)</i)?.[1];
  const whole = scope.match(/class="a-price-whole">([\d.]+)/i)?.[1];
  const fraction = scope.match(/class="a-price-fraction">(\d{2})/i)?.[1];
  const price = priceToCents(offscreen ? decodeEntities(offscreen) : undefined)
    ?? (whole ? priceToCents(`${whole.replace(/\./g, "")}.${fraction ?? "00"}`) : undefined);
  const color = html.match(/id="inline-twister-expanded-dimension-text-color_name"[^>]*>([^<]+)</i)?.[1]
    ?? html.match(/id="variation_color_name"[\s\S]{0,400}?class="selection"[^>]*>([^<]+)</i)?.[1];
  const size = html.match(/id="inline-twister-expanded-dimension-text-size_name"[^>]*>([^<]+)</i)?.[1];
  const variant: Record<string, string> = {};
  if (color?.trim()) variant.Cor = decodeEntities(color);
  if (size?.trim()) variant.Tamanho = decodeEntities(size);
  return {
    title: title ? decodeEntities(title) : undefined,
    imageUrl: absoluteUrl(image, base),
    priceCents: price,
    variant: Object.keys(variant).length ? variant : undefined,
  };
}

/** Junta as fontes: a primeira que tiver cada campo vence. */
export function merge(...parts: Parsed[]): Parsed {
  const out: Parsed = {};
  for (const p of parts) {
    out.title ??= p.title;
    out.imageUrl ??= p.imageUrl;
    out.priceCents ??= p.priceCents;
    if (p.variant) out.variant = { ...p.variant, ...out.variant };
  }
  return out;
}

/** Títulos que na verdade são páginas de erro ou de bloqueio. */
export function isJunkTitle(title: string | undefined): boolean {
  if (!title) return true;
  return /access denied|acesso negado|robot check|captcha|attention required|just a moment|page not found|página não encontrada|unable to give you access|403 forbidden|404|ops!/i.test(title)
    || /^(amazon\.com\.br|mercado livre|mercado libre|shopee brasil|shein|aliexpress|magazine luiza|magalu)[^a-z]*$/i.test(title.trim())
    // slogans de página inicial que aparecem quando a loja não mostra o produto
    || /^shein\.com is |ofertas incr[ií]veis\. melhores pre[cç]os|compre online com seguran[cç]a|onde comprar e vender de tudo/i.test(title.trim());
}

/** Remove o sufixo da loja: "Fone JBL | Amazon.com.br" → "Fone JBL". */
export function cleanTitle(title: string): string {
  return title
    .replace(/\s*[|–-]\s*(amazon\.com\.br|mercado livre|kabum!?|magazine luiza|magalu|shopee brasil|shein|americanas|natura|o botic[aá]rio|sephora|época cosméticos|beleza na web)\b.*$/i, "")
    .replace(/^amazon\.com\.br\s*:\s*/i, "")
    .replace(/\s*:\s*amazon\.com\.br.*$/i, "")
    .trim()
    .slice(0, 300);
}

/** Pega todos os links http(s) de um texto colado (inclusive mensagens do WhatsApp). */
export function extractUrls(text: string): string[] {
  const found = text.match(/https?:\/\/[^\s<>"'`]+/gi) ?? [];
  const cleaned = found.map((u) => u.replace(/[),.;!?]+$/, ""));
  return [...new Set(cleaned)];
}
