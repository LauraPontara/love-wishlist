import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { matchProfile } from "@/lib/auth/phone";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth/session";
import { clearAttempts, hashIp, isRateLimited, recordFailedAttempt } from "@/lib/auth/rate-limit";

const body = z.object({ phone: z.string().min(8).max(30) });

export async function POST(request: NextRequest) {
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Digite o seu telefone com DDD." }, { status: 400 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const ipHash = hashIp(ip);

  if (await isRateLimited(ipHash)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Espere 15 minutos e tente de novo." },
      { status: 429 },
    );
  }

  const { PHONE_PEPPER, ALLOWED_PHONE_HASHES, SESSION_SECRET } = env();
  const profileId = matchProfile(parsed.data.phone, PHONE_PEPPER, ALLOWED_PHONE_HASHES);

  if (!profileId) {
    await recordFailedAttempt(ipHash);
    // mensagem genérica: não revela se o número existe ou não
    return NextResponse.json({ error: "Número não reconhecido." }, { status: 401 });
  }

  await clearAttempts(ipHash);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, await createSessionToken(profileId, SESSION_SECRET), sessionCookieOptions);
  return response;
}
