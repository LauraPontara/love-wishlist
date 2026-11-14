import { connection } from "next/server";
import { db } from "@/lib/db/server";

// Usado pelo monitor externo e pelo workflow de reserva do keep-alive.
export async function GET() {
  await connection(); // sempre em tempo de requisição
  const started = performance.now();
  const { error } = await db().from("profiles").select("id").limit(1);
  const latency_ms = Math.round(performance.now() - started);
  if (error) return Response.json({ db: "erro", latency_ms }, { status: 503 });
  return Response.json({ db: "ok", latency_ms });
}
