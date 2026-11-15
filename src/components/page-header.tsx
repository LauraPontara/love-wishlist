import Link from "next/link";
import type { ReactNode } from "react";
import { GearIcon } from "./icons";
import { HelpButton } from "./tour/tour";

/** Cabeçalho Aurora + folha que "sobe" sobre ele (design-system §4). */
export function PageHeader({ title, subtitle, avatar, back, action }: {
  title: string; subtitle?: ReactNode; avatar?: string | null; back?: { href: string; label: string }; action?: ReactNode;
}) {
  return (
    <header className="aurora px-5 sm:px-8 lg:px-12 pt-6 sm:pt-9 pb-14 sm:pb-16">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-center justify-between min-h-[28px] mb-2 lg:mb-0 lg:min-h-0">
          {back ? (
            <Link href={back.href} className="inline-flex items-center gap-1 font-bold text-sm py-2 opacity-95 hover:opacity-100">
              <span aria-hidden="true">‹</span> {back.label}
            </Link>
          ) : <span />}
          <div className="flex items-center gap-1 -mr-2">
          <HelpButton />
          {/* no celular não há barra lateral: os Ajustes ficam aqui */}
          <Link href="/ajustes" aria-label="Ajustes" className="lg:hidden w-11 h-11 -mt-1 grid place-items-center rounded-full opacity-90"><GearIcon /></Link>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          {avatar && <img src={`/avatars/${avatar}.svg`} alt="" className="w-[52px] h-[52px] sm:w-[64px] sm:h-[64px] shrink-0" />}
          <div className="min-w-0 flex-1">
            <h1 className="display text-[2rem] sm:text-[2.6rem] lg:text-[3rem]">{title}</h1>
            {subtitle && <p className="opacity-85 text-sm sm:text-base mt-1">{subtitle}</p>}
          </div>
          {action && <div className="hidden sm:block shrink-0">{action}</div>}
        </div>
      </div>
    </header>
  );
}

export function Sheet({ children }: { children: ReactNode }) {
  return (
    <section className="relative -mt-[30px] flex-1 rounded-t-[28px] px-4 sm:px-8 lg:px-12 pt-5 sm:pt-7 pb-10" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-[1200px]">{children}</div>
    </section>
  );
}
