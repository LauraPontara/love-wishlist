"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/** Máscara simples: (31) 9 0000-0000 */
function mask(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 3) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 3)} ${d.slice(3, 7)}-${d.slice(7)}`;
}

export function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error ?? "Não deu para entrar agora. Tente de novo.");
    } catch {
      setError("Sem conexão. Confira a internet e tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <label htmlFor="phone" className="sr-only">Telefone com DDD</label>
      <input
        id="phone"
        className="field tracking-wide"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="(31) 9 0000-0000"
        value={phone}
        onChange={(e) => setPhone(mask(e.target.value))}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "login-error" : undefined}
        required
      />
      {error && (
        <p id="login-error" role="alert" className="rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: "var(--error-bg)", color: "var(--error-ink)" }}>
          {error}
        </p>
      )}
      <button type="submit" className="btn btn-primary w-full mt-1" disabled={loading || phone.replace(/\D/g, "").length < 10}>
        {loading ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
