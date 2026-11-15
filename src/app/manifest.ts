import type { MetadataRoute } from "next";

// PWA instalável + alvo de compartilhamento do Android (ADR-007, RF05).
// Depois de mudar este arquivo é preciso reinstalar o app (ou esperar o Chrome atualizar o WebAPK).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nossa Wishlist",
    short_name: "Wishlist",
    description: "A lista de desejos da Laura e do Vítor.",
    lang: "pt-BR",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0B0A1F",
    theme_color: "#0B0A1F",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    share_target: {
      action: "/share",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
