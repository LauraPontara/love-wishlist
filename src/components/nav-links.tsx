"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { GearIcon, PlusIcon } from "./icons";

type Person = { id: string; displayName: string; avatar: string | null };
type NavItem = { href: string; label: string; short: string; icon: ReactNode; active: boolean };

const GiftIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="9" width="18" height="12" rx="2" /><path d="M2 9h20M12 9v12M12 9c-2-4-7-5-7-2s5 2 7 2zm0 0c2-4 7-5 7-2s-5 2-7 2z" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="5" width="18" height="16" rx="3" /><path d="M3 10h18M8 3v4M16 3v4" />
    <path d="M12 18c-2-1.5-3.5-2.6-3.5-4a1.7 1.7 0 0 1 3.5-.6 1.7 1.7 0 0 1 3.5.6c0 1.4-1.5 2.5-3.5 4z" fill="currentColor" stroke="none" />
  </svg>
);
const Avatar = ({ name }: { name: string | null }) => (name ? <img src={`/avatars/${name}.svg`} alt="" className="w-full h-full" /> : null);

// Celular/tablet: barra fixa embaixo (5 destinos). Desktop (lg): barra lateral.
export function NavLinks({ me, partner }: { me: Person; partner: Person | null }) {
  const path = usePathname();
  const article = partner?.displayName.endsWith("a") ? "da" : "do";
  const links: NavItem[] = [
    { href: "/", label: "Minha lista", short: "Minha lista", icon: <Avatar name={me.avatar} />, active: path === "/" || path.startsWith("/item") },
    ...(partner ? [{ href: `/lista/${partner.id}`, label: `Lista ${article} ${partner.displayName}`, short: partner.displayName, icon: <Avatar name={partner.avatar} />, active: path.startsWith("/lista") }] : []),
    { href: "/combos", label: "Presentes", short: "Presentes", icon: <GiftIcon />, active: path.startsWith("/combos") },
    { href: "/datas", label: "Nossas datas", short: "Datas", icon: <CalendarIcon />, active: path.startsWith("/datas") },
  ];

  return (
    <>
      <aside className="hidden lg:flex flex-col gap-1.5 w-[250px] shrink-0 sticky top-0 h-dvh px-4 py-6 border-r-2" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
        <p className="px-3 mb-4 font-extrabold text-lg" style={{ fontVariationSettings: "'wdth' 85" }}>Nossa Wishlist</p>
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={l.active ? "page" : undefined}
            className="flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold transition-colors"
            style={l.active ? { background: "var(--bg)", color: "var(--primary)" } : { color: "var(--ink-2)" }}>
            <span className="w-9 h-9 grid place-items-center [&>svg]:w-6 [&>svg]:h-6">{l.icon}</span>
            {l.label}
          </Link>
        ))}
        <Link href="/item/novo" className="btn btn-ribbon mt-4">Adicionar item</Link>
        <Link href="/ajustes" aria-current={path.startsWith("/ajustes") ? "page" : undefined}
          className="mt-auto flex items-center gap-3 rounded-2xl px-3 py-2.5 font-bold"
          style={path.startsWith("/ajustes") ? { background: "var(--bg)", color: "var(--primary)" } : { color: "var(--ink-2)" }}>
          <span className="w-9 h-9 grid place-items-center"><GearIcon /></span>Ajustes
        </Link>
      </aside>

      <nav className="lg:hidden fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t-2 px-1 pt-2 pb-[max(10px,env(safe-area-inset-bottom))]"
        style={{ background: "var(--surface)", borderColor: "var(--line)" }} aria-label="Navegação principal">
        {links.map((l) => (
          <Link key={l.href} href={l.href} aria-current={l.active ? "page" : undefined}
            className="flex flex-col items-center gap-1 text-[.7rem] font-bold min-w-0"
            style={{ color: l.active ? "var(--primary)" : "var(--ink-2)" }}>
            <span className="w-7 h-7 grid place-items-center [&>svg]:w-6 [&>svg]:h-6">{l.icon}</span>
            <span className="truncate max-w-full">{l.short}</span>
          </Link>
        ))}
        <Link href="/item/novo" className="flex flex-col items-center gap-1 text-[.7rem] font-bold" style={{ color: "var(--ink-2)" }}>
          <span className="w-7 h-7 rounded-full grid place-items-center" style={{ background: "var(--ribbon)", color: "var(--on-ribbon)" }} aria-hidden="true"><PlusIcon /></span>
          Adicionar
        </Link>
      </nav>
    </>
  );
}
