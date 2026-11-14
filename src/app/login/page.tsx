import type { Metadata } from "next";
import { Heart } from "@/components/heart";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Nossa Wishlist" };

// Responsivo: celular = uma coluna; tablet = coluna mais larga;
// desktop (lg) = coração ocupando a metade esquerda e formulário à direita.
export default function LoginPage() {
  return (
    <main className="flex-1 min-h-dvh grid lg:grid-cols-2">
      <section className="relative flex flex-col px-6 pt-7 sm:px-10 lg:px-14 lg:py-12 overflow-hidden">
        <p className="relative z-10 font-extrabold text-[1.05rem] sm:text-lg" style={{ fontVariationSettings: "'wdth' 85" }}>
          Nossa Wishlist
        </p>
        <div className="relative flex-1 grid place-items-center min-h-[280px] sm:min-h-[380px]">
          <Heart className="beat absolute w-[380px] h-[360px] sm:w-[520px] sm:h-[494px] lg:w-[min(46vw,720px)] lg:h-[min(44vw,684px)] opacity-40" blur={46} />
          <Heart className="beat absolute w-[300px] h-[285px] sm:w-[400px] sm:h-[380px] lg:w-[min(36vw,560px)] lg:h-[min(34vw,532px)]" blur={6} />
        </div>
      </section>

      <section className="flex flex-col justify-center px-6 pb-10 sm:px-10 lg:px-16 lg:py-12">
        <div className="w-full max-w-[440px] sm:max-w-[520px] mx-auto lg:mx-0">
          <h1 className="display text-[2.6rem] sm:text-[3.4rem] lg:text-[4.2rem] mb-3">
            Oi,<br />quem chegou?
          </h1>
          <p className="mb-6 leading-relaxed sm:text-lg" style={{ color: "var(--ink-2)" }}>
            Digite o seu telefone para abrir a lista de vocês dois.
          </p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
