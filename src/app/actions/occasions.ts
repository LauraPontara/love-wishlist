"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireProfileId } from "@/lib/auth/current-user";
import { db } from "@/lib/db/server";

type Result = { ok: true } | { ok: false; error: string };

const schema = z.object({
  name: z.string().trim().min(1, "Dê um nome à data.").max(60),
  kind: z.enum(["aniversario", "namoro", "natal", "dia_namorados", "outra"]),
  month: z.number().int().min(1).max(12),
  day: z.number().int().min(1).max(31),
  honoreeId: z.string().nullable(),
}).refine((o) => o.kind !== "aniversario" || o.honoreeId, { message: "Escolha de quem é o aniversário.", path: ["honoreeId"] })
  .refine((o) => new Date(Date.UTC(2024, o.month - 1, o.day)).getUTCDate() === o.day, { message: "Esse dia não existe nesse mês.", path: ["day"] });

export async function saveOccasion(id: string | null, input: z.input<typeof schema>): Promise<Result> {
  await requireProfileId();
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0].message };
  const row = { name: parsed.data.name, kind: parsed.data.kind, month: parsed.data.month, day: parsed.data.day, honoree_id: parsed.data.honoreeId };
  const { error } = id ? await db().from("occasions").update(row).eq("id", id) : await db().from("occasions").insert(row);
  if (error) return { ok: false, error: "Não deu para salvar a data." };
  refresh();
  return { ok: true };
}

export async function deleteOccasion(id: string): Promise<Result> {
  await requireProfileId();
  const { error } = await db().from("occasions").delete().eq("id", id);
  if (error) return { ok: false, error: "Não deu para excluir a data." };
  refresh();
  return { ok: true };
}
