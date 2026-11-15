import { timingSafeEqual } from "node:crypto";
import { connection, type NextRequest } from "next/server";
import { getOccasions } from "@/lib/combos/queries";
import { db } from "@/lib/db/server";
import { occasionMessage } from "@/lib/push/messages";
import { sendToProfile } from "@/lib/push/send";
import { env } from "@/lib/env";

// Vercel Cron, 1x por dia às 09:00 de Brasília (ver vercel.json).
// 1. keep-alive: consulta o banco para o Supabase Free nunca pausar (ADR-005)
// 2. limpeza de tentativas de login e cache de extração antigos
// 3. lembretes de ocasião: 7 dias antes, um por pessoa e por ano (notification_log)
function authorized(request: NextRequest): boolean {
  const expected = Buffer.from(`Bearer ${env().CRON_SECRET}`);
  const got = Buffer.from(request.headers.get("authorization") ?? "");
  return got.length === expected.length && timingSafeEqual(got, expected);
}

const REMIND_DAYS = 7;

async function sendOccasionReminders(): Promise<number> {
  const client = db();
  const due = (await getOccasions()).filter((o) => o.daysUntil === REMIND_DAYS);
  if (!due.length) return 0;
  const { data: profiles } = await client.from("profiles").select("id, notify_occasions");
  let sent = 0;
  for (const occ of due) {
    const year = Number(occ.nextDate.slice(0, 4));
    for (const p of profiles ?? []) {
      if (!p.notify_occasions) continue;
      // o registro vem antes do envio: se já existe, este lembrete já saiu
      const { error: dup } = await client.from("notification_log").insert({ occasion_id: occ.id, year, profile_id: p.id });
      if (dup) continue;
      const isOwn = occ.honoreeId === p.id;
      let status: "montado" | "comprado" | "dado" | null = null;
      if (!isOwn) {
        const { data: combo } = await client.from("combos").select("status").eq("creator_id", p.id).eq("occasion_id", occ.id).eq("occasion_date", occ.nextDate)
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        status = (combo?.status as typeof status) ?? null;
      }
      sent += await sendToProfile(p.id, occasionMessage(occ.name, occ.daysUntil, status, isOwn));
    }
  }
  return sent;
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

  const reminders = await sendOccasionReminders().catch(() => -1);

  return Response.json({
    keepAlive: "ok",
    reminders,
    cleanup: { loginAttempts: attempts.error ? "erro" : "ok", scrapeCache: cache.error ? "erro" : "ok" },
  });
}
