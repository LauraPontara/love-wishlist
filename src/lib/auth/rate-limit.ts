import "server-only";
import { createHmac } from "node:crypto";
import { db } from "@/lib/db/server";
import { env } from "@/lib/env";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

/** O IP nunca é salvo em texto puro: guardamos só um HMAC dele. */
export function hashIp(ip: string): string {
  return createHmac("sha256", env().PHONE_PEPPER).update(`ip:${ip}`).digest("hex");
}

export async function isRateLimited(ipHash: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();
  const { count, error } = await db()
    .from("login_attempts")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("attempted_at", since);
  if (error) throw new Error(`rate limit: ${error.message}`);
  return (count ?? 0) >= MAX_ATTEMPTS;
}

export async function recordFailedAttempt(ipHash: string): Promise<void> {
  const { error } = await db().from("login_attempts").insert({ ip_hash: ipHash });
  if (error) throw new Error(`rate limit: ${error.message}`);
}

export async function clearAttempts(ipHash: string): Promise<void> {
  await db().from("login_attempts").delete().eq("ip_hash", ipHash);
}
