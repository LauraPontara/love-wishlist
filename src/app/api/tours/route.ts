import { NextResponse } from "next/server";
import { requireProfileId } from "@/lib/auth/current-user";
import { db } from "@/lib/db/server";

const headers = { "cache-control": "private, no-store" };

/** Telas cujo tutorial esta pessoa já viu. */
export async function GET() {
  const id = await requireProfileId().catch(() => null);
  if (!id) return NextResponse.json({ error: "sem sessão" }, { status: 401, headers });
  const { data, error } = await db().from("profiles").select("tours_seen").eq("id", id).single();
  if (error) return NextResponse.json({ error: "indisponível" }, { status: 503, headers });
  return NextResponse.json({ seen: (data?.tours_seen as string[] | null) ?? [] }, { headers });
}

/** Marca telas como vistas (junta com o que já tinha). */
export async function POST(request: Request) {
  const id = await requireProfileId().catch(() => null);
  if (!id) return NextResponse.json({ error: "sem sessão" }, { status: 401, headers });
  const body = (await request.json().catch(() => ({}))) as { seen?: unknown };
  const add = Array.isArray(body.seen) ? body.seen.filter((s): s is string => typeof s === "string" && /^[a-z-]{1,40}$/.test(s)).slice(0, 40) : [];
  if (!add.length) return NextResponse.json({ ok: true }, { headers });
  const { data } = await db().from("profiles").select("tours_seen").eq("id", id).single();
  const merged = [...new Set([...((data?.tours_seen as string[] | null) ?? []), ...add])];
  const { error } = await db().from("profiles").update({ tours_seen: merged }).eq("id", id);
  if (error) return NextResponse.json({ error: "indisponível" }, { status: 503, headers });
  return NextResponse.json({ ok: true, seen: merged }, { headers });
}
