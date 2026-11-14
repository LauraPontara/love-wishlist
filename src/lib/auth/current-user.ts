import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/server";
import { env } from "@/lib/env";
import { SESSION_COOKIE, verifySessionToken } from "./session";

export type CurrentUser = {
  id: string;
  displayName: string;
  avatar: string | null;
  partner: { id: string; displayName: string; avatar: string | null } | null;
};

/** Para Server Actions: devolve o perfil da sessão ou lança erro (sem redirecionar). */
export async function requireProfileId(): Promise<string> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const profileId = await verifySessionToken(token, env().SESSION_SECRET);
  if (!profileId) throw new Error("Sessão expirada. Entre de novo.");
  return profileId;
}

/** Data Access Layer: lê a sessão e devolve só o que a interface precisa. */
export async function getCurrentUser(): Promise<CurrentUser> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const profileId = await verifySessionToken(token, env().SESSION_SECRET);
  if (!profileId) redirect("/login");

  const { data, error } = await db().from("profiles").select("id, display_name, avatar");
  if (error) throw new Error(`perfis: ${error.message}`);

  const me = data.find((p) => p.id === profileId);
  if (!me) redirect("/login");
  const other = data.find((p) => p.id !== profileId);

  return {
    id: me.id,
    displayName: me.display_name,
    avatar: me.avatar,
    partner: other ? { id: other.id, displayName: other.display_name, avatar: other.avatar } : null,
  };
}
