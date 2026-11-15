import { describe, expect, it } from "vitest";
import { formatPrice, itemFormSchema, matchesSearch, normalizeUrl, parsePrice, parseVariant, storeFromUrl, variantToText } from "../src/lib/items/domain";

describe("normalizeUrl", () => {
  it("ignora www, barra final e rastreadores, mas mantém a variação", () => {
    expect(normalizeUrl("https://www.Kabum.com.br/produto/1/fone/?utm_source=x&cor=preto&gclid=1")).toBe("kabum.com.br/produto/1/fone?cor=preto");
  });
  it("trata links iguais como iguais mesmo com parâmetros em outra ordem", () => {
    expect(normalizeUrl("https://loja.com/p?b=2&a=1")).toBe(normalizeUrl("https://loja.com/p?a=1&b=2"));
  });
  it("recusa o que não é link http(s)", () => {
    expect(normalizeUrl("kabum.com.br/produto")).toBeNull();
    expect(normalizeUrl("javascript:alert(1)")).toBeNull();
  });
});

describe("storeFromUrl", () => {
  it("dá nomes conhecidos e capitaliza o resto", () => {
    expect(storeFromUrl("https://produto.mercadolivre.com.br/MLB-1")).toBe("Mercado Livre");
    expect(storeFromUrl("https://www.kabum.com.br/produto/1")).toBe("Kabum");
  });
});

describe("preço", () => {
  it.each([
    ["R$ 129,90", 12990], ["129,9", 12990], ["1.234,56", 123456], ["1234.56", 123456], ["1.234.567", 123456700], ["40", 4000],
  ])("%s → %d centavos", (input, cents) => expect(parsePrice(input)).toBe(cents));
  it("vazio vira sem preço e texto vira inválido", () => {
    expect(parsePrice("")).toBeNull();
    expect(parsePrice("abc")).toBe("invalido");
  });
  it("formata em reais", () => {
    expect(formatPrice(123456).replace(/\s/g, " ")).toBe("R$ 1.234,56");
    expect(formatPrice(null)).toBe("Sem preço");
  });
});

describe("variação", () => {
  it("vai e volta entre texto e objeto", () => {
    const v = parseVariant("Cor: Laranja; Tamanho: M");
    expect(v).toEqual({ Cor: "Laranja", Tamanho: "M" });
    expect(variantToText(v)).toBe("Cor: Laranja; Tamanho: M");
  });
});

describe("busca", () => {
  const item = { title: "Sabão de Côco", store: "Boticário", notes: null, variant: { Cor: "Laranja" } };
  it("ignora acentos e maiúsculas e procura em nome, loja e variação", () => {
    expect(matchesSearch(item, "sabao")).toBe(true);
    expect(matchesSearch(item, "BOTICARIO")).toBe(true);
    expect(matchesSearch(item, "laranja coco")).toBe(true);
    expect(matchesSearch(item, "azul")).toBe(false);
  });
});

describe("formulário", () => {
  const base = { url: "https://loja.com/p", title: "Fone", category: "Tecnologia", kind: "unico" };
  it("aceita o mínimo", () => expect(itemFormSchema.safeParse(base).success).toBe(true));
  it.each(["", "   ", undefined])("aceita item sem link (%s)", (url) => {
    expect(itemFormSchema.parse({ ...base, url }).url).toBe("");
  });
  it("recusa links inválidos quando informados", () => {
    expect(itemFormSchema.safeParse({ ...base, url: "javascript:alert(1)" }).success).toBe(false);
    expect(itemFormSchema.safeParse({ ...base, url: "loja.com/p" }).success).toBe(false);
  });
});
