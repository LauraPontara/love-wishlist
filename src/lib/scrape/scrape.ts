import "server-only";
import { db } from "@/lib/db/server";
import { normalizeUrl, storeFromUrl, type Category } from "@/lib/items/domain";
import { suggestCategory, suggestKind } from "./category";
import { cleanTitle, isJunkTitle, merge, parseAmazon, parseJsonLd, parseOpenGraph, type Parsed } from "./parse";

// Pipeline de extração (ADR-008, docs/pesquisa-extracao.md). Sem IA.
// Cada link é independente: um link ruim nunca derruba os outros.

export type ScrapeStatus = "ok" | "parcial" | "bloqueado" | "link_quebrado";

export type ScrapeResult = {
  url: string;
  status: ScrapeStatus;
  title: string | null;
  imageUrl: string | null;
  priceCents: number | null;
  store: string | null;
  category: Category;
  kind: "unico" | "sempre";
  variant: Record<string, string>;
};

const UA = {
  desktop: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  mobile: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  // Mercado Livre: só entrega as metatags de preview para robôs de preview de link (decisão registrada na pesquisa)
  preview: "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
};

const BLOCK_MARKERS = /captcha|access denied|acesso negado|are you a robot|robot check|unusual traffic|px-captcha|cf-chl|challenge-platform|account-verification|suspicious-traffic/i;
const MAX_BYTES = 3_000_000;
const CACHE_HOURS = 24;

type Fetched = { kind: "html"; status: number; html: string; finalUrl: string } | { kind: "error"; reason: "dns" | "timeout" | "other" };

async function fetchPage(url: string, userAgent: string, timeoutMs = 9000): Promise<Fetched> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": userAgent, "accept-language": "pt-BR,pt;q=0.9,en;q=0.6", accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    const reader = res.body?.getReader();
    let html = "";
    if (reader) {
      const decoder = new TextDecoder();
      let size = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        html += decoder.decode(value, { stream: true });
        if (size > MAX_BYTES) { await reader.cancel(); break; }
      }
    }
    return { kind: "html", status: res.status, html, finalUrl: res.url || url };
  } catch (e) {
    const err = e as { name?: string; cause?: { code?: string } };
    if (err.name === "TimeoutError" || err.name === "AbortError") return { kind: "error", reason: "timeout" };
    if (err.cause?.code === "ENOTFOUND" || err.cause?.code === "EAI_AGAIN") return { kind: "error", reason: "dns" };
    return { kind: "error", reason: "other" };
  }
}

/** Jina Reader (grátis, sem chave): só para tentar o nome quando a loja bloqueia. */
async function jinaTitle(url: string): Promise<string | undefined> {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, { headers: { accept: "text/plain" }, signal: AbortSignal.timeout(12000), cache: "no-store" });
    const text = (await res.text()).slice(0, 4000);
    if (/Target URL returned error (4|5)\d\d/.test(text)) return undefined;
    const title = text.match(/^Title:\s*(.+)$/m)?.[1]?.trim();
    return isJunkTitle(title) ? undefined : title;
  } catch {
    return undefined;
  }
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.toLowerCase(); } catch { return ""; }
}

function parseFor(host: string, html: string, finalUrl: string): Parsed {
  const generic = merge(parseJsonLd(html, finalUrl), parseOpenGraph(html, finalUrl));
  if (/(^|\.)amazon\./.test(host)) return merge(parseAmazon(html, finalUrl), generic);
  return generic;
}

async function extract(url: string): Promise<{ status: ScrapeStatus; parsed: Parsed }> {
  const host = hostOf(url);
  const isML = /(^|\.)mercadolivre\.com\.br$|(^|\.)mercadolibre\./.test(host);
  const attempts = isML ? [UA.preview, UA.desktop] : [UA.desktop, UA.mobile];

  let best: Parsed = {};

  // "Link quebrado" só quando é certeza: domínio inexistente ou página 404/410.
  // Conexão derrubada, timeout, 403/429/5xx e captcha contam como "site não deixa ler".
  for (const ua of attempts) {
    const page = await fetchPage(url, ua);
    if (page.kind === "error") {
      if (page.reason === "dns") return { status: "link_quebrado", parsed: {} };
      continue;
    }
    if (page.status === 404 || page.status === 410) return { status: "link_quebrado", parsed: {} };
    const blocked = page.status >= 400 || (page.html.length < 60_000 && BLOCK_MARKERS.test(page.html.slice(0, 60_000)));
    if (blocked) continue;

    const parsed = parseFor(host, page.html, page.finalUrl);
    if (isJunkTitle(parsed.title)) parsed.title = undefined;
    best = merge(best, parsed);
    if (best.title && best.priceCents) break; // já temos o principal
  }

  if (!best.title) {
    const title = await jinaTitle(url);
    if (title) best.title = title;
  }

  if (best.title && best.priceCents) return { status: "ok", parsed: best };
  if (best.title || best.imageUrl) return { status: "parcial", parsed: best };
  return { status: "bloqueado", parsed: best };
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const key = normalizeUrl(url);
  if (!key) return build(url, "link_quebrado", {});

  // cache de 24h (scrape_cache)
  const since = new Date(Date.now() - CACHE_HOURS * 3600_000).toISOString();
  const { data: cached } = await db().from("scrape_cache").select("payload").eq("url_normalized", key).gte("created_at", since).maybeSingle();
  if (cached?.payload) return { ...(cached.payload as ScrapeResult), url };

  const { status, parsed } = await extract(url);
  const result = build(url, status, parsed);
  // só guarda resultados úteis: bloqueio/erro pode ser passageiro
  if (status === "ok" || status === "parcial") {
    await db().from("scrape_cache").upsert({ url_normalized: key, payload: result, created_at: new Date().toISOString() });
  }
  return result;
}

function build(url: string, status: ScrapeStatus, p: Parsed): ScrapeResult {
  const title = p.title ? cleanTitle(p.title) : null;
  const category = suggestCategory(title ?? "", url);
  return {
    url, status, title,
    imageUrl: p.imageUrl ?? null,
    priceCents: p.priceCents ?? null,
    store: storeFromUrl(url),
    category,
    kind: suggestKind(category),
    variant: p.variant ?? {},
  };
}

/** Processa vários links com no máximo `limit` ao mesmo tempo. */
export async function scrapeMany(urls: string[], limit = 3): Promise<ScrapeResult[]> {
  const results: ScrapeResult[] = new Array(urls.length);
  let next = 0;
  const worker = async () => {
    while (next < urls.length) {
      const i = next++;
      try { results[i] = await scrapeUrl(urls[i]); }
      catch { results[i] = build(urls[i], "bloqueado", {}); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, urls.length) }, worker));
  return results;
}
