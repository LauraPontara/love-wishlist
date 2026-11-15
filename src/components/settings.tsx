"use client";

import { useEffect, useState, useTransition } from "react";
import { setNotify } from "@/app/actions/settings";
import { BUNNIES_EVENT, BUNNIES_KEY } from "./bunnies";
import { LogoutButton } from "./logout-button";
import { TourScreen } from "./tour/tour";

const THEME_KEY = "nw:theme";
type Theme = "auto" | "light" | "dark";

function applyTheme(t: Theme) {
  if (t === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
}

function urlBase64ToUint8Array(base64: string) {
  const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
}

export function Settings({ notifyNewItems, notifyOccasions, vapidKey, partnerName }: {
  notifyNewItems: boolean; notifyOccasions: boolean; vapidKey: string; partnerName: string;
}) {
  const [theme, setTheme] = useState<Theme>("auto");
  const [bunnies, setBunnies] = useState(true);
  const [push, setPush] = useState<"unknown" | "unsupported" | "off" | "on" | "denied">("unknown");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    (async () => {
      let t: Theme = "auto", b = true;
      try { t = (localStorage.getItem(THEME_KEY) as Theme) || "auto"; b = localStorage.getItem(BUNNIES_KEY) !== "off"; } catch {}
      let p: typeof push = "off";
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidKey) p = "unsupported";
      else if (Notification.permission === "denied") p = "denied";
      else {
        const reg = await navigator.serviceWorker.getRegistration();
        p = (await reg?.pushManager.getSubscription()) ? "on" : "off";
      }
      setTheme(t); setBunnies(b); setPush(p);
    })();
  }, [vapidKey]);

  const chooseTheme = (t: Theme) => { setTheme(t); applyTheme(t); try { localStorage.setItem(THEME_KEY, t); } catch {} };
  const toggleBunnies = () => {
    const next = !bunnies; setBunnies(next);
    try { localStorage.setItem(BUNNIES_KEY, next ? "on" : "off"); } catch {}
    window.dispatchEvent(new CustomEvent(BUNNIES_EVENT, { detail: "toggle" }));
  };

  async function enablePush() {
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setPush(permission === "denied" ? "denied" : "off"); return; }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription())
        ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) }));
      const res = await fetch("/api/push/subscribe", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
      if (!res.ok) throw new Error();
      setPush("on"); setMessage("Avisos ativados neste aparelho.");
    } catch {
      setMessage("Não deu para ativar os avisos. Tente de novo.");
    }
  }

  async function disablePush() {
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) });
        await sub.unsubscribe();
      }
      setPush("off"); setMessage("Avisos desligados neste aparelho.");
    } catch { setMessage("Não deu para desligar agora."); }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2 items-start max-w-[1000px]">
      <TourScreen id="settings" />
      <Card tour="appearance" title="Aparência" hint="Vale para este aparelho.">
        <div role="radiogroup" aria-label="Tema" className="grid grid-cols-3 p-1 rounded-2xl" style={{ background: "var(--surface-sunk)" }}>
          {([["auto", "Automático"], ["light", "Claro"], ["dark", "Escuro"]] as const).map(([v, label]) => (
            <button key={v} role="radio" aria-checked={theme === v} onClick={() => chooseTheme(v)} className="rounded-xl py-3 text-sm font-bold"
              style={theme === v ? { background: "var(--surface)", color: "var(--ink)", boxShadow: "0 1px 4px rgba(28,26,74,.12)" } : { color: "var(--ink-2)" }}>
              {label}
            </button>
          ))}
        </div>
        <Toggle label="Coelhinhos passeando" hint="Os dois coelhos andam e pulam pelo app." on={bunnies} onChange={toggleBunnies} />
      </Card>

      <Card tour="notify" title="Avisos" hint="Chegam como notificação no celular, com o app instalado.">
        {push === "unsupported" && <Note>Este navegador não aceita avisos. No Android, instale o app pela tela inicial do Chrome.</Note>}
        {push === "denied" && <Note>As notificações estão bloqueadas para este site. Libere nas configurações do navegador e volte aqui.</Note>}
        {(push === "off" || push === "unknown") && <button className="btn btn-primary w-full sm:w-auto sm:self-start" onClick={enablePush} disabled={push === "unknown"}>Ativar avisos neste aparelho</button>}
        {push === "on" && <button className="btn btn-ghost w-full sm:w-auto sm:self-start" onClick={disablePush}>Desligar avisos neste aparelho</button>}
        {message && <p role="status" className="text-sm font-semibold" style={{ color: "var(--ink-2)" }}>{message}</p>}
        <Toggle label={`Item novo na lista ${partnerName.endsWith("a") ? "da" : "do"} ${partnerName}`} on={notifyNewItems} disabled={pending}
          onChange={() => start(async () => { await setNotify("new_items", !notifyNewItems); })} />
        <Toggle label="Lembrete 7 dias antes das datas" on={notifyOccasions} disabled={pending}
          onChange={() => start(async () => { await setNotify("occasions", !notifyOccasions); })} />
      </Card>

      <Card tour="account" title="Conta"><LogoutButton /></Card>
    </div>
  );
}

function Card({ title, hint, tour, children }: { title: string; hint?: string; tour?: string; children: React.ReactNode }) {
  return (
    <section data-tour={tour} className="rounded-[20px] border-2 p-5 flex flex-col gap-4" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
      <div>
        <h2 className="text-xl font-extrabold" style={{ fontVariationSettings: "'wdth' 85" }}>{title}</h2>
        {hint && <p className="text-sm mt-0.5" style={{ color: "var(--ink-2)" }}>{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl px-3 py-2 text-sm font-semibold" style={{ background: "var(--warn-bg)", color: "var(--warn-ink)" }}>{children}</p>;
}

function Toggle({ label, hint, on, onChange, disabled }: { label: string; hint?: string; on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={onChange} disabled={disabled}
      className="flex items-center justify-between gap-4 text-left min-h-[48px] disabled:opacity-60">
      <span><span className="font-bold block">{label}</span>{hint && <span className="text-sm" style={{ color: "var(--ink-2)" }}>{hint}</span>}</span>
      <span className="relative w-[52px] h-[30px] rounded-full shrink-0 transition-colors" style={{ background: on ? "var(--primary)" : "var(--line)" }}>
        <span className="absolute top-[3px] w-6 h-6 rounded-full bg-white transition-[left] duration-200" style={{ left: on ? 25 : 3 }} />
      </span>
    </button>
  );
}
