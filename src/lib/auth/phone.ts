import { createHmac, timingSafeEqual } from "node:crypto";

// ADR-003: o telefone nunca é guardado. Comparamos HMAC-SHA256(pepper, telefone E.164)
// com os hashes da variável ALLOWED_PHONE_HASHES ("perfil:hash,perfil:hash").

/** Normaliza um telefone brasileiro para E.164 (+55DDDNÚMERO). Retorna null se não parecer válido. */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let national: string;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) national = digits.slice(2);
  else if (digits.length === 10 || digits.length === 11) national = digits;
  else return null;
  // DDD de 11 a 99; celular com 9 dígitos começa com 9
  const ddd = Number(national.slice(0, 2));
  if (ddd < 11 || ddd > 99) return null;
  if (national.length === 11 && national[2] !== "9") return null;
  return `+55${national}`;
}

export function hashPhone(e164: string, pepper: string): string {
  return createHmac("sha256", pepper).update(e164).digest("hex");
}

export function parseAllowed(raw: string): Array<{ profileId: string; hash: string }> {
  return raw
    .split(",")
    .map((pair) => pair.trim())
    .filter(Boolean)
    .map((pair) => {
      const [profileId, hash] = pair.split(":");
      return { profileId: profileId?.trim() ?? "", hash: hash?.trim().toLowerCase() ?? "" };
    })
    .filter((e) => /^[a-z0-9_-]{2,32}$/.test(e.profileId) && /^[0-9a-f]{64}$/.test(e.hash));
}

/** Descobre o perfil dono do telefone, comparando em tempo constante. */
export function matchProfile(input: string, pepper: string, allowedRaw: string): string | null {
  const e164 = normalizePhone(input);
  if (!e164) return null;
  const candidate = Buffer.from(hashPhone(e164, pepper), "hex");
  let found: string | null = null;
  for (const { profileId, hash } of parseAllowed(allowedRaw)) {
    // compara todos (sem sair cedo) para não vazar tempo
    if (timingSafeEqual(candidate, Buffer.from(hash, "hex"))) found = profileId;
  }
  return found;
}
