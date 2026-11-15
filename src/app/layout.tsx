import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Caveat } from "next/font/google";
import "./globals.css";
import { PressFx } from "@/components/press-fx";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["wdth", "opsz"],
});

// letra de mão do tutorial
const caveat = Caveat({ variable: "--font-hand", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Nossa Wishlist",
  description: "A lista de desejos da Laura e do Vítor.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: [ // barra do sistema

    { media: "(prefers-color-scheme: light)", color: "#D61F69" },
    { media: "(prefers-color-scheme: dark)", color: "#14123A" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${bricolage.variable} ${caveat.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem("nw:theme");if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}` }} />
      </head>
      <body className="min-h-full flex flex-col">{children}<PressFx /></body>
    </html>
  );
}
