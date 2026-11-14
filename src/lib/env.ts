import "server-only";
import { z } from "zod";

// Variáveis lidas só no servidor. Nunca exponha nenhuma delas com NEXT_PUBLIC_.
const schema = z.object({
  SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  PHONE_PEPPER: z.string().min(32, "PHONE_PEPPER precisa ter pelo menos 32 caracteres"),
  ALLOWED_PHONE_HASHES: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET precisa ter pelo menos 32 caracteres"),
  CRON_SECRET: z.string().min(16),
});

export type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const missing = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`Variáveis de ambiente inválidas ou ausentes: ${missing}`);
  }
  cached = parsed.data;
  return cached;
}
