import "server-only";
import * as webpush from "web-push";
import { db } from "@/lib/db/server";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false; // sem chaves, os avisos ficam desligados (o resto do app segue normal)
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "https://nossa-wishlist.vercel.app", pub, priv);
  configured = true;
  return true;
}

/** Envia para todos os aparelhos de um perfil. Nunca lança: aviso é "melhor esforço". */
export async function sendToProfile(profileId: string, payload: PushPayload): Promise<number> {
  try {
    if (!configure()) return 0;
    const { data: subs } = await db().from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("profile_id", profileId);
    let sent = 0;
    await Promise.all((subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 86400 });
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        // assinatura vencida ou removida no aparelho
        if (status === 404 || status === 410) await db().from("push_subscriptions").delete().eq("id", s.id);
      }
    }));
    return sent;
  } catch {
    return 0;
  }
}
