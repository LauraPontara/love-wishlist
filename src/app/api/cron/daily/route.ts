import { timingSafeEqual } from "node:crypto";
import { connection, type NextRequest } from "next/server";
import { db } from "@/lib/db/server";
import { env } from "@/lib/env";

// Vercel Cron, 1x por dia às 09:00 de Brasília (ver vercel.json).
// 1. keep-alive: consulta o banco para o Supabase Free nunca pausar (ADR-005)
// 2. limpeza de tentativas de login e cache de extração antigos
// (os lembretes de ocasião entram na Fase 5)
function authorized(request: NextRequest): boolean {
  const expected = Buffer.from(`Bearer ${env().CRON_SECRET}`);
  const got = Buffer.from(request.headers.get("authorization") ?? "");
  return got.length === expected.length && timingSafeEqual(got, expected);
}

export async function GET(request: NextRequest) {
  await connection(); // nunca pré-renderizar no build
  if (!authorized(request)) return Response.json({ error: "não autorizado" }, { status: 401 });

  const client = db();
  const { error: pingError } = await client.from("profiles").select("id").limit(1);
  if (pingError) return Response.json({ keepAlive: "erro", detail: pingError.message }, { status: 503 });

  const dayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const [attempts, cache] = await Promise.all([
    client.from("login_attempts").delete().lt("attempted_at", dayAgo),
    client.from("scrape_cache").delete().lt("created_at", weekAgo),
  ]);

  return Response.json({
    keepAlive: "ok",
    cleanup: { loginAttempts: attempts.error ? "erro" : "ok", scrapeCache: cache.error ? "erro" : "ok" },
  });
}
