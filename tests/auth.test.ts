import { describe, expect, it } from "vitest";
import { hashPhone, matchProfile, normalizePhone, parseAllowed } from "../src/lib/auth/phone";
import { createSessionToken, verifySessionToken } from "../src/lib/auth/session";

const PEPPER = "p".repeat(48);
const SECRET = "s".repeat(48);
// números de teste fictícios (não são de ninguém)
const LAURA = "+5511987654321";
const VITOR = "+5521912345678";
const allowed = `laura:${hashPhone(LAURA, PEPPER)},vitor:${hashPhone(VITOR, PEPPER)}`;

describe("normalizePhone", () => {
  it.each([
    ["(11) 9 8765-4321", "+5511987654321"],
    ["11987654321", "+5511987654321"],
    ["+55 11 98765-4321", "+5511987654321"],
    ["55 11 98765 4321", "+5511987654321"],
    ["(11) 3456-7890", "+551134567890"],
  ])("%s → %s", (input, expected) => expect(normalizePhone(input)).toBe(expected));

  it.each(["123", "(11) 8 8765-4321", "(00) 9 8765-4321", "+1 415 555 0100", ""])("recusa %s", (input) =>
    expect(normalizePhone(input)).toBeNull(),
  );
});

describe("matchProfile", () => {
  it("reconhece cada perfil pelo telefone, em qualquer formato", () => {
    expect(matchProfile("(11) 9 8765-4321", PEPPER, allowed)).toBe("laura");
    expect(matchProfile("21912345678", PEPPER, allowed)).toBe("vitor");
  });
  it("recusa números não cadastrados", () => {
    expect(matchProfile("(11) 9 1111-2222", PEPPER, allowed)).toBeNull();
  });
  it("recusa com pepper errado (hash vazado sozinho não serve)", () => {
    expect(matchProfile("(11) 9 8765-4321", "x".repeat(48), allowed)).toBeNull();
  });
  it("ignora entradas malformadas na variável", () => {
    expect(parseAllowed("laura:abc, :123, vitor:" + "f".repeat(64))).toEqual([{ profileId: "vitor", hash: "f".repeat(64) }]);
  });
});

describe("sessão", () => {
  it("cria e valida o token", async () => {
    const token = await createSessionToken("laura", SECRET);
    expect(await verifySessionToken(token, SECRET)).toBe("laura");
  });
  it("recusa token adulterado, segredo errado ou ausente", async () => {
    const token = await createSessionToken("laura", SECRET);
    expect(await verifySessionToken(token.slice(0, -2) + "xx", SECRET)).toBeNull();
    expect(await verifySessionToken(token, "z".repeat(48))).toBeNull();
    expect(await verifySessionToken(undefined, SECRET)).toBeNull();
  });
});
