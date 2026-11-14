#!/usr/bin/env node
// Cadastra o telefone de um perfil no .env.local SEM salvar o número.
// Uso: npm run phone:hash
// Ele pergunta o perfil e o telefone, calcula HMAC-SHA256(PHONE_PEPPER, +55...) e
// grava só o hash em ALLOWED_PHONE_HASHES. O número não é impresso nem salvo.
import { createHmac } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const ENV_FILE = ".env.local";
if (!existsSync(ENV_FILE)) {
  console.error(`Não encontrei ${ENV_FILE}. Rode na pasta do projeto.`);
  process.exit(1);
}

const text = readFileSync(ENV_FILE, "utf8");
const read = (key) => text.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim() ?? "";
const pepper = read("PHONE_PEPPER");
if (pepper.length < 32) {
  console.error("PHONE_PEPPER ausente ou curto demais no .env.local.");
  process.exit(1);
}

function normalizePhone(input) {
  const digits = input.replace(/\D/g, "");
  let national;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) national = digits.slice(2);
  else if (digits.length === 10 || digits.length === 11) national = digits;
  else return null;
  if (national.length === 11 && national[2] !== "9") return null;
  return `+55${national}`;
}

const rl = createInterface({ input: stdin, output: stdout });
const profile = (await rl.question("Perfil (laura ou vitor): ")).trim().toLowerCase();
if (!/^[a-z0-9_-]{2,32}$/.test(profile)) { console.error("Perfil inválido."); process.exit(1); }
const phone = normalizePhone(await rl.question("Telefone com DDD (ex.: 31 9 0000-0000): "));
rl.close();
if (!phone) { console.error("Telefone inválido. Use DDD + número."); process.exit(1); }

const hash = createHmac("sha256", pepper).update(phone).digest("hex");
const entries = read("ALLOWED_PHONE_HASHES").split(",").map((s) => s.trim()).filter(Boolean)
  .filter((pair) => !pair.startsWith(`${profile}:`));
entries.push(`${profile}:${hash}`);

const line = `ALLOWED_PHONE_HASHES=${entries.join(",")}`;
const updated = /^ALLOWED_PHONE_HASHES=.*$/m.test(text)
  ? text.replace(/^ALLOWED_PHONE_HASHES=.*$/m, line)
  : `${text.trimEnd()}\n${line}\n`;
writeFileSync(ENV_FILE, updated);
console.log(`Pronto: telefone de "${profile}" registrado (só o hash foi salvo). Perfis cadastrados: ${entries.map((e) => e.split(":")[0]).join(", ")}`);
