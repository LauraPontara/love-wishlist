import type { Metadata } from "next";
import { HeartAura, HeartGlow } from "@/components/heart-glow";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Nossa Wishlist" };

// Celular/tablet: campo de luz com a silhueta do coração em cima, sumindo suave, e o formulário embaixo.
// Desktop (lg): coração de luz gigante na tela toda (só os lóbulos de cima aparecem) e o login no meio.
export default function LoginPage() {
  return (
    <main className="relative flex-1 min-h-dvh flex flex-col lg:grid lg:place-items-center" style={{ background: "var(--bg)" }}>
      <HeartAura className="hidden lg:block" />

      <section className="relative flex flex-col min-h-[50dvh] lg:hidden">
        <HeartGlow className="absolute inset-0 login-glow" />
      </section>
      <p className="absolute z-10 top-0 left-0 px-6 pt-7 sm:px-10 lg:px-12 lg:pt-10 font-extrabold text-[1.05rem] sm:text-lg" style={{ fontVariationSettings: "'wdth' 85" }}>
        Nossa Wishlist
      </p>

      <section className="relative z-10 flex flex-col justify-center px-6 pb-10 -mt-6 sm:px-10 lg:mt-0 lg:p-0 lg:-translate-y-[9vh]">
        <div className="w-full max-w-[440px] sm:max-w-[520px] mx-auto lg:max-w-[600px] lg:text-center">
          <h1 className="display text-[2.6rem] sm:text-[3.4rem] lg:text-[3.4rem] mb-3">
            Oi,<br className="lg:hidden" /> quem chegou?
          </h1>
          <p className="mb-6 leading-relaxed sm:text-lg text-balance" style={{ color: "var(--ink-2)" }}>
            Digite o seu telefone para abrir a lista de vocês dois.
          </p>
          <div className="login-card lg:text-left lg:rounded-[28px] lg:p-5">
            <LoginForm />
          </div>
        </div>
      </section>
    </main>
  );
}
