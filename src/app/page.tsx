import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { LogoutButton } from "./logout-button";

// Fase 1: página inicial protegida. As listas chegam na Fase 2.
export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <Suspense fallback={<HeaderSkeleton />}>
        <Header />
      </Suspense>
      <section className="relative -mt-[30px] flex-1 rounded-t-[28px] px-4 pt-6 pb-16" style={{ background: "var(--bg)" }}>
        <div className="mx-auto max-w-[720px] flex flex-col gap-4">
          <div className="rounded-[20px] p-5 border-2" style={{ background: "var(--surface)", borderColor: "var(--line)" }}>
            <h2 className="text-xl font-extrabold mb-1" style={{ fontVariationSettings: "'wdth' 85" }}>Sua lista está chegando</h2>
            <p style={{ color: "var(--ink-2)" }} className="leading-relaxed">
              O login já funciona. Na próxima fase entram as listas, o cadastro por link e os combos de presente.
            </p>
          </div>
          <LogoutButton />
        </div>
      </section>
    </main>
  );
}

async function Header() {
  const user = await getCurrentUser();
  return (
    <header className="aurora px-5 pt-6 pb-14">
      <div className="mx-auto max-w-[720px] flex items-center gap-3">
        {user.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/avatars/${user.avatar}.svg`} alt="" className="w-[54px] h-[54px]" />
        )}
        <div>
          <h1 className="display text-[2rem]">Oi, {user.displayName}</h1>
          {user.partner && <p className="opacity-85 text-sm">Você e {user.partner.displayName}</p>}
        </div>
      </div>
    </header>
  );
}

function HeaderSkeleton() {
  return <header className="aurora px-5 pt-6 pb-14"><div className="mx-auto max-w-[720px] h-[54px]" /></header>;
}
