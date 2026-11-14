import type { Metadata } from "next";
import { Heart } from "@/components/heart";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar · Nossa Wishlist" };

export default function LoginPage() {
  return (
    <main className="flex-1 flex justify-center">
      <div className="w-full max-w-[440px] flex flex-col px-6 pt-7 pb-8 min-h-dvh">
        <p className="font-extrabold text-[1.05rem]" style={{ fontVariationSettings: "'wdth' 85" }}>Nossa Wishlist</p>

        <div className="relative flex-1 grid place-items-center min-h-[300px]">
          <Heart className="beat absolute w-[380px] h-[360px] opacity-40" blur={46} />
          <Heart className="beat absolute w-[300px] h-[285px]" blur={6} />
          <div className="beat relative w-[190px] h-[150px]" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatars/coelho-chocolate.svg" alt="" className="absolute left-0 top-[18px] w-[112px] h-[112px] -rotate-[8deg] drop-shadow-[0_10px_18px_rgba(20,10,40,.35)]" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatars/coelho-caramelo.svg" alt="" className="absolute right-0 top-[18px] w-[112px] h-[112px] rotate-[8deg] drop-shadow-[0_10px_18px_rgba(20,10,40,.35)]" />
          </div>
        </div>

        <h1 className="display text-[2.6rem] mb-2">Oi, coelho.<br />Quem chegou?</h1>
        <p className="mb-5 leading-relaxed" style={{ color: "var(--ink-2)" }}>Digite o seu telefone para abrir a lista de vocês dois.</p>
        <LoginForm />
      </div>
    </main>
  );
}
