import { describe, expect, it } from "vitest";
import { centsToMoneyInput, formatPrice, itemFormSchema, maskMoney, matchesSearch, normalizeUrl, parsePrice, parseVariant, storeFromUrl, variantToText } from "../src/lib/items/domain";

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
    ["R$ 129,90", 12990], ["129,9", 12990], ["1.234,56", 123456], ["1234.56", 123456], ["1.234.567", 123456700], ["40", 4000], ["1.234", 123400], ["60.5", 6050],
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

describe("máscara de dinheiro", () => {
  it.each([
    ["60", "60"], ["1234", "1.234"], ["1234,5", "1.234,5"], ["1234,567", "1.234,56"], ["60.5", "60,5"], ["60.50", "60,50"],
    ["1.234", "1.234"], ["R$ 129,90", "129,90"], ["abc", ""], [",5", "0,5"], ["0060", "60"], ["12,3,4", "12,34"],
  ])("%s → %s", (input, out) => expect(maskMoney(input)).toBe(out));
  it("o que a máscara mostra é lido com o valor certo", () => {
    for (const [typed, cents] of [["60", 6000], ["1234", 123400], ["1234,5", 123450], ["60.5", 6050]] as const)
      expect(parsePrice(maskMoney(typed))).toBe(cents);
  });
  it("centavos voltam para o campo formatados", () => {
    expect(centsToMoneyInput(123450)).toBe("1.234,50");
    expect(centsToMoneyInput(null)).toBe("");
  });
});
