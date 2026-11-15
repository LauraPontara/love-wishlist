import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  axes: ["wdth", "opsz"],
});

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
    <html lang="pt-BR" className={`${bricolage.variable} h-full`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
