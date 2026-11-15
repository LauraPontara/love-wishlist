import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireProfileId } from "@/lib/auth/current-user";
import { db } from "@/lib/db/server";

const body = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(300), auth: z.string().min(10).max(300) }),
});

// Guarda a assinatura de push deste aparelho para o perfil logado.
export async function POST(request: NextRequest) {
  let profileId: string;
  try { profileId = await requireProfileId(); } catch { return NextResponse.json({ error: "Sessão expirada." }, { status: 401 }); }
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  const { endpoint, keys } = parsed.data;
  const { error } = await db().from("push_subscriptions")
    .upsert({ profile_id: profileId, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: "endpoint" });
  if (error) return NextResponse.json({ error: "Não deu para ativar os avisos." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  let profileId: string;
  try { profileId = await requireProfileId(); } catch { return NextResponse.json({ error: "Sessão expirada." }, { status: 401 }); }
  const endpoint = z.string().url().safeParse((await request.json().catch(() => ({})))?.endpoint);
  if (!endpoint.success) return NextResponse.json({ error: "Assinatura inválida." }, { status: 400 });
  await db().from("push_subscriptions").delete().eq("endpoint", endpoint.data).eq("profile_id", profileId);
  return NextResponse.json({ ok: true });
}
