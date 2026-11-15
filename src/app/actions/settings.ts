"use server";

import { refresh } from "next/cache";
import { requireProfileId } from "@/lib/auth/current-user";
import { db } from "@/lib/db/server";

/** RF39: liga ou desliga cada tipo de aviso para o perfil logado. */
export async function setNotify(kind: "new_items" | "occasions", on: boolean): Promise<{ ok: boolean }> {
  const profileId = await requireProfileId();
  const column = kind === "new_items" ? "notify_new_items" : "notify_occasions";
  const { error } = await db().from("profiles").update({ [column]: on }).eq("id", profileId);
  if (error) return { ok: false };
  refresh();
  return { ok: true };
}
