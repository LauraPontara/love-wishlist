import { describe, expect, it } from "vitest";
import { newItemsMessage, occasionMessage } from "../src/lib/push/messages";

describe("avisos", () => {
  it("item novo: singular, plural e link da lista", () => {
    expect(newItemsMessage("Vítor", "vitor", 1)).toMatchObject({ title: "Vítor adicionou 1 item", body: "Veja o que entrou na lista dele.", url: "/lista/vitor" });
    expect(newItemsMessage("Laura", "laura", 5)).toMatchObject({ title: "Laura adicionou 5 itens", body: "Veja o que entrou na lista dela." });
  });
  it("lembrete: muda conforme o presente de quem recebe", () => {
    expect(occasionMessage("Natal", 7, null, false)).toMatchObject({ title: "Faltam 7 dias: Natal", url: "/combos" });
    expect(occasionMessage("Natal", 7, null, false).body).toMatch(/ainda não montou/);
    expect(occasionMessage("Natal", 7, "montado", false).body).toMatch(/ainda não foi comprado/);
    expect(occasionMessage("Natal", 7, "comprado", false).body).toMatch(/Só falta entregar/);
  });
  it("no próprio aniversário não fala de presente", () => {
    const m = occasionMessage("Aniversário da Laura", 7, null, true);
    expect(m.url).toBe("/");
    expect(m.body).not.toMatch(/presente/i);
  });
});
