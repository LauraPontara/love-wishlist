"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./logout-button";

type Person = { id: string; displayName: string; avatar: string | null };

// Celular/tablet: barra fixa embaixo. Desktop (lg): barra lateral.
export function NavLinks({ me, partner }: { me: Person; partner: Person | null }) {
  const path = usePathname();
  const links = [
    { href: "/", label: "Minha lista", avatar: me.avatar, active: path === "/" || path.startsWith("/item") },
    ...(partner ? [{ href: `/lista/${partner.id}`, label: `Lista ${partner.displayName.endsWith("a") ? "da" : "do"} ${partner.displayName}`, short: partner.displayName, avatar: partner.avatar, active: path.startsWith("/lista") }] : []),
  ];

  return (
    <>
      {/* desktop */}
      <aside className="hidden lg:flex flex-col gap-2 w-[250px] shrink-0 sticky top-0 h-dvh px-4 py-6 border-r-2" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <p className="px-3 mb-4 font-extrabold text-lg" style={{ fontVariationSettings: "'wdth' 85" }}>Nossa Wishlist</p>
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={l.active ? "page" : undefined}
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold transition-colors"
            style={l.active ? { background: "var(--bg)", color: "var(--primary)" } : { color: "var(--ink-2)" }}>
            {l.avatar && <img src={`/avatars/${l.avatar}.svg`} alt="" className="w-9 h-9" />}
            {l.label}
          </Link>
        ))}
        <Link href="/item/novo" className="btn btn-ribbon mt-4">Adicionar item</Link>
        <div className="mt-auto"><LogoutButton /></div>
      </aside>

      {/* celular e tablet */}
      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t-2 px-2 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }} aria-label="Navegação principal">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={l.active ? "page" : undefined}
            className="flex flex-col items-center gap-1 text-[.75rem] font-bold"
            style={{ color: l.active ? "var(--primary)" : "var(--ink-2)" }}>
            {l.avatar && <img src={`/avatars/${l.avatar}.svg`} alt="" className="w-7 h-7" />}
            {"short" in l && l.short ? l.short : l.label}
          </Link>
        ))}
        <Link href="/item/novo" className="flex flex-col items-center gap-1 text-[.75rem] font-bold" style={{ color: "var(--ink-2)" }}>
          <span className="w-7 h-7 rounded-full grid place-items-center text-lg font-black" style={{ background: "var(--ribbon)", color: "var(--on-ribbon)" }} aria-hidden="true">+</span>
          Adicionar
        </Link>
      </nav>
    </>
  );
}
