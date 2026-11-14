import { describe, expect, it } from "vitest";
import { suggestCategory, suggestKind } from "../src/lib/scrape/category";
import { cleanTitle, decodeEntities, extractUrls, isJunkTitle, merge, parseAmazon, parseJsonLd, parseOpenGraph, priceToCents } from "../src/lib/scrape/parse";

const BASE = "https://loja.com/p/1";

describe("JSON-LD", () => {
  it("lê Product com offers (padrão VTEX/Kabum)", () => {
    const html = `<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Fone JBL &amp; Cia","image":["/img/a.jpg"],"color":"Azul","offers":{"@type":"Offer","price":"239.40","priceCurrency":"BRL"}}</script>`;
    expect(parseJsonLd(html, BASE)).toEqual({ title: "Fone JBL & Cia", imageUrl: "https://loja.com/img/a.jpg", priceCents: 23940, variant: { Cor: "Azul" } });
  });
  it("acha o produto dentro de @graph e AggregateOffer", () => {
    const html = `<script type="application/ld+json">{"@graph":[{"@type":"BreadcrumbList"},{"@type":["Product"],"name":"Creme","image":{"url":"https://cdn.x/c.png"},"offers":{"@type":"AggregateOffer","lowPrice":89.9}}]}</script>`;
    expect(parseJsonLd(html, BASE)).toMatchObject({ title: "Creme", imageUrl: "https://cdn.x/c.png", priceCents: 8990 });
  });
  it("ignora JSON malformado sem quebrar", () => {
    expect(parseJsonLd(`<script type="application/ld+json">{oops</script>`, BASE)).toEqual({});
  });
});

describe("OpenGraph", () => {
  it("lê título, imagem e preço das metatags em qualquer ordem de atributos", () => {
    const html = `<meta content="Boné laranja" property="og:title"><meta property="og:image" content="//cdn.loja.com/b.jpg"><meta property="product:price:amount" content="89,90">`;
    expect(parseOpenGraph(html, BASE)).toEqual({ title: "Boné laranja", imageUrl: "https://cdn.loja.com/b.jpg", priceCents: 8990 });
  });
  it("cai para <title> quando não há og:title", () => {
    expect(parseOpenGraph("<title>Vestido midi</title>", BASE).title).toBe("Vestido midi");
  });
});

describe("Amazon", () => {
  it("pega título, foto, preço do bloco principal e cor", () => {
    const html = `
      <span class="a-price-whole">18</span>
      <span id="productTitle" class="a-size-large"> JBL, Fone de Ouvido On ear, Tune 520BT - Preto </span>
      <img data-old-hires="https://m.media-amazon.com/images/I/61R9.jpg">
      <div id="corePriceDisplay_desktop_feature_div"><span class="a-offscreen">R$ 213,90</span></div>
      <span id="inline-twister-expanded-dimension-text-color_name" class="x"> preto </span>`;
    expect(parseAmazon(html, "https://www.amazon.com.br/dp/X")).toEqual({
      title: "JBL, Fone de Ouvido On ear, Tune 520BT - Preto",
      imageUrl: "https://m.media-amazon.com/images/I/61R9.jpg",
      priceCents: 21390,
      variant: { Cor: "preto" },
    });
  });
});

describe("utilitários", () => {
  it("merge: o primeiro que tiver o campo vence", () => {
    expect(merge({ title: "A" }, { title: "B", priceCents: 100 }, { imageUrl: "x" })).toEqual({ title: "A", priceCents: 100, imageUrl: "x" });
  });
  it("preços de várias formas", () => {
    expect(priceToCents(299.9)).toBe(29990);
    expect(priceToCents("299.90")).toBe(29990);
    expect(priceToCents("R$ 1.234,56")).toBe(123456);
    expect(priceToCents("0")).toBeUndefined();
  });
  it("entidades HTML", () => expect(decodeEntities("Caf&eacute; &#233; &#x27;bom&#x27;")).toBe("Caf&eacute; é 'bom'"));
  it("títulos de bloqueio e de loja vazia são descartados", () => {
    expect(isJunkTitle("Access Denied")).toBe(true);
    expect(isJunkTitle("Shopee Brasil")).toBe(true);
    expect(isJunkTitle("Fone JBL")).toBe(false);
    expect(isJunkTitle("SHEIN.com is mainly design and produce fashion")).toBe(true);
    expect(isJunkTitle("Shopee Brasil | Ofertas incríveis. Melhores preços do mercado")).toBe(true);
  });
  it("limpa o sufixo da loja no título", () => {
    expect(cleanTitle("Paleta 16 Cores | Fosco E Brilhante | Shopee Brasil")).toBe("Paleta 16 Cores | Fosco E Brilhante");
    expect(cleanTitle("JBL Tune 520BT : Amazon.com.br: Eletrônicos")).toBe("JBL Tune 520BT");
  });
  it("extrai links de texto do WhatsApp", () => {
    const text = "olha esse: https://shopee.com.br/x-i.1.2?a=1, e esse https://kabum.com.br/p/1). repetido https://shopee.com.br/x-i.1.2?a=1";
    expect(extractUrls(text)).toEqual(["https://shopee.com.br/x-i.1.2?a=1", "https://kabum.com.br/p/1"]);
  });
});

describe("categoria sugerida", () => {
  it.each([
    ["Fone de Ouvido JBL Tune 520BT", "Tecnologia"],
    ["Sabonete Líquido Nativa SPA Ameixa", "Cuidados pessoais"],
    ["Paleta de Sombras 16 cores", "Beleza"],
    ["Chocolate Lacta ao Leite", "Comida & doces"],
    ["Vestido midi linho", "Roupas"],
    ["Boné dad hat", "Acessórios"],
    ["Coisa aleatória", "Outros"],
  ])("%s → %s", (title, cat) => expect(suggestCategory(title)).toBe(cat));
  it("comida e cuidados pessoais viram 'sempre bem-vindo'", () => {
    expect(suggestKind("Comida & doces")).toBe("sempre");
    expect(suggestKind("Tecnologia")).toBe("unico");
  });
});
