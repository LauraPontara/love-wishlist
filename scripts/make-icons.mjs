// Gera os ícones do app: coração rosa com brilho desfocado sobre fundo preto.
// Uso: node scripts/make-icons.mjs
import { mkdirSync } from "node:fs";
import sharp from "sharp";

const HEART = "M100 182C42 136 8 100 8 64 8 34 31 12 58 12c19 0 34 10 42 26 8-16 23-26 42-26 27 0 50 22 50 52 0 36-34 72-92 118z";

// scale: fração do quadro ocupada pelo coração (menor no "maskable", que é recortado em círculo)
const svg = (scale) => {
  const s = 512 * scale / 200, tx = (512 - 200 * s) / 2, ty = (512 - 190 * s) / 2 + 6;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="g" cx="50%" cy="42%" r="65%">
      <stop offset="0" stop-color="#FFB3D1"/><stop offset=".45" stop-color="#FF5EA0"/><stop offset="1" stop-color="#D61F69"/>
    </radialGradient>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${34 * scale / 0.56}"/></filter>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${5 * scale / 0.56}"/></filter>
  </defs>
  <rect width="512" height="512" fill="#07060F"/>
  <g transform="translate(${tx} ${ty}) scale(${s})">
    <path d="${HEART}" fill="#FF3D8B" opacity=".75" filter="url(#glow)" transform="translate(100 95) scale(1.18) translate(-100 -95)"/>
    <path d="${HEART}" fill="url(#g)" filter="url(#soft)"/>
  </g>
</svg>`;
};

mkdirSync("public/icons", { recursive: true });
const make = (scale, size, out) => sharp(Buffer.from(svg(scale))).resize(size, size).png().toFile(out);
await Promise.all([
  make(0.56, 512, "public/icons/icon-512.png"),
  make(0.56, 192, "public/icons/icon-192.png"),
  make(0.42, 512, "public/icons/maskable-512.png"),
  make(0.56, 180, "src/app/apple-icon.png"),
  make(0.62, 96, "src/app/icon.png"),
]);
console.log("ícones gerados");
