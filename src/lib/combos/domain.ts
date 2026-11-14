// Regras de combos e datas, sem dependência de servidor (testáveis).

export type ComboStatus = "montado" | "comprado" | "dado";

export type ComboLine = {
  id: string;
  itemId: string | null;
  isExtra: boolean;
  title: string;
  url: string | null;
  imageUrl: string | null;
  category: string | null;
  kind: "unico" | "sempre" | null;
  itemStatus: "desejado" | "ja_tenho" | "recebido" | null; // null = extra ou item excluído
  quantity: number;
  unitPriceCents: number | null;
  paidCents: number | null;
};

export type Combo = {
  id: string;
  recipientId: string;
  name: string;
  occasionId: string | null;
  occasionName: string | null;
  occasionDate: string | null; // YYYY-MM-DD
  budgetCents: number | null;
  status: ComboStatus;
  purchasedAt: string | null;
  givenAt: string | null;
  lines: ComboLine[];
};

/** RN06: por linha vale "paguei"; senão preço × quantidade. Sem preço conta 0 e é sinalizado. */
export function lineTotal(l: Pick<ComboLine, "paidCents" | "unitPriceCents" | "quantity">): number {
  if (l.paidCents != null) return l.paidCents;
  return (l.unitPriceCents ?? 0) * l.quantity;
}

export function comboTotal(lines: ComboLine[]): { totalCents: number; missingPrice: number } {
  return {
    totalCents: lines.reduce((s, l) => s + lineTotal(l), 0),
    missingPrice: lines.filter((l) => l.paidCents == null && l.unitPriceCents == null).length,
  };
}

/** Quanto do orçamento já foi usado (0..1+) e quanto falta (negativo = passou). */
export function budgetState(totalCents: number, budgetCents: number | null) {
  if (!budgetCents) return null;
  return { ratio: totalCents / budgetCents, remainingCents: budgetCents - totalCents };
}

/** RF33: item que o dono comprou sozinho enquanto estava num combo comprado. */
export function boughtByOwnerAlerts(combo: Combo): ComboLine[] {
  if (combo.status !== "comprado") return [];
  return combo.lines.filter((l) => l.kind === "unico" && l.itemStatus === "ja_tenho");
}

// ---------- datas (fuso de Brasília) ----------
export function todayInSaoPaulo(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(now); // YYYY-MM-DD
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const pad = (n: number) => String(n).padStart(2, "0");

/** Próxima ocorrência (hoje conta) de uma data anual. 29/02 cai em 28/02 em anos comuns. */
export function nextOccurrence(month: number, day: number, today: string): string {
  const [y] = today.split("-").map(Number);
  for (const year of [y, y + 1]) {
    const d = month === 2 && day === 29 && !isLeap(year) ? 28 : day;
    const iso = `${year}-${pad(month)}-${pad(d)}`;
    if (iso >= today) return iso;
  }
  return `${y + 1}-${pad(month)}-${pad(day)}`;
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = Date.UTC(...(fromIso.split("-").map(Number) as [number, number, number]).map((v, i) => (i === 1 ? v - 1 : v)) as [number, number, number]);
  const b = Date.UTC(...(toIso.split("-").map(Number) as [number, number, number]).map((v, i) => (i === 1 ? v - 1 : v)) as [number, number, number]);
  return Math.round((b - a) / 86_400_000);
}

export function countdownLabel(days: number): string {
  if (days === 0) return "é hoje!";
  if (days === 1) return "é amanhã";
  if (days < 0) return days === -1 ? "foi ontem" : `foi há ${-days} dias`;
  return `faltam ${days} dias`;
}

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
const MONTHS_LONG = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
export const monthShort = (m: number) => MONTHS[m - 1];
export const monthLong = (m: number) => MONTHS_LONG[m - 1];

/** "2026-12-25" → "25 de dezembro" */
export function formatDayMonth(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} de ${monthLong(m)}`;
}

/** Timestamp → "14/nov" (para "presente de X em 14/nov" e "última em"). */
export function shortDate(ts: string): string {
  const iso = todayInSaoPaulo(new Date(ts));
  const [, m, d] = iso.split("-").map(Number);
  return `${d}/${monthShort(m)}`;
}
