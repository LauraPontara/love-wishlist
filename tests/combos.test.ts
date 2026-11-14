import { describe, expect, it } from "vitest";
import { boughtByOwnerAlerts, budgetState, comboTotal, countdownLabel, daysBetween, formatDayMonth, lineTotal, nextOccurrence, todayInSaoPaulo, type Combo, type ComboLine } from "../src/lib/combos/domain";

const line = (p: Partial<ComboLine>): ComboLine => ({
  id: "l", itemId: "i", isExtra: false, title: "x", url: null, imageUrl: null, category: null, kind: "unico",
  itemStatus: "desejado", quantity: 1, unitPriceCents: null, paidCents: null, ...p,
});

describe("soma do combo (RN06)", () => {
  it("usa 'paguei' quando existe, senão preço × quantidade", () => {
    expect(lineTotal(line({ unitPriceCents: 1000, quantity: 3 }))).toBe(3000);
    expect(lineTotal(line({ unitPriceCents: 1000, quantity: 3, paidCents: 2500 }))).toBe(2500);
  });
  it("item sem preço conta zero e é sinalizado", () => {
    expect(comboTotal([line({ unitPriceCents: 18990 }), line({}), line({ isExtra: true, unitPriceCents: 5800 })]))
      .toEqual({ totalCents: 24790, missingPrice: 1 });
  });
  it("orçamento: quanto falta e quando passa", () => {
    expect(budgetState(27337, 30000)).toEqual({ ratio: 27337 / 30000, remainingCents: 2663 });
    expect(budgetState(31000, 30000)?.remainingCents).toBe(-1000);
    expect(budgetState(100, null)).toBeNull();
  });
});

describe("alerta 'ela já comprou' (RF33)", () => {
  const combo = (status: Combo["status"], lines: ComboLine[]): Combo => ({
    id: "c", recipientId: "laura", name: "x", occasionId: null, occasionName: null, occasionDate: null,
    budgetCents: null, status, purchasedAt: null, givenAt: null, lines,
  });
  it("aparece só em combo comprado com item único marcado como já tenho", () => {
    const l = line({ itemStatus: "ja_tenho" });
    expect(boughtByOwnerAlerts(combo("comprado", [l, line({})]))).toEqual([l]);
    expect(boughtByOwnerAlerts(combo("montado", [l]))).toEqual([]);
    expect(boughtByOwnerAlerts(combo("comprado", [line({ kind: "sempre", itemStatus: "ja_tenho" })]))).toEqual([]);
  });
});

describe("datas", () => {
  it("próxima ocorrência: hoje conta, senão vai para o ano seguinte", () => {
    expect(nextOccurrence(12, 25, "2026-11-14")).toBe("2026-12-25");
    expect(nextOccurrence(1, 14, "2026-11-14")).toBe("2027-01-14");
    expect(nextOccurrence(11, 14, "2026-11-14")).toBe("2026-11-14");
  });
  it("29 de fevereiro vira 28 em ano comum", () => {
    expect(nextOccurrence(2, 29, "2026-11-14")).toBe("2027-02-28");
    expect(nextOccurrence(2, 29, "2027-11-14")).toBe("2028-02-29");
  });
  it("dias entre datas e textos", () => {
    expect(daysBetween("2026-11-14", "2026-12-25")).toBe(41);
    expect(daysBetween("2026-12-31", "2027-01-14")).toBe(14);
    expect(countdownLabel(0)).toBe("é hoje!");
    expect(countdownLabel(1)).toBe("é amanhã");
    expect(countdownLabel(41)).toBe("faltam 41 dias");
    expect(formatDayMonth("2026-09-06")).toBe("6 de setembro");
  });
  it("'hoje' usa o fuso de Brasília", () => {
    // 02:00 UTC de 15/11 ainda é 14/11 em Brasília (UTC-3)
    expect(todayInSaoPaulo(new Date("2026-11-15T02:00:00Z"))).toBe("2026-11-14");
  });
});
