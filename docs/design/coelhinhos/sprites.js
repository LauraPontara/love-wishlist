// Sprites dos coelhinhos em pixel art 32x32, de perfil (olhando para a direita).
// Cada pose é desenhada com formas simples num canvas 32x32 e depois "pixelizada":
// cores travadas na paleta da pelagem + contorno de 1px. Assim as duas pelagens
// usam o mesmo desenho (ADR-012) e cada pose é só um conjunto de parâmetros.

// O desenho usa coordenadas de 32x32, mas o canvas tem 40x40: a margem evita que
// orelhas e focinho sejam cortados nas poses de pulo.
export const SIZE = 40;
const ORIGIN = { x: 4, y: 7 };
export const FEET_Y = 30.5 + ORIGIN.y;   // linha onde ficam as patas (para pousar nas plataformas)

const PALETTES = {
  chocolate: { fur: '#6B3E26', shade: '#4E2B18', light: '#F2DCC6', inner: '#F6A3B8', eye: '#140803', shine: '#FFFFFF', nose: '#F46F93', blush: '#FF8FAB', line: '#26130A' },
  caramelo:  { fur: '#E0893A', shade: '#B8662A', light: '#FFE6C4', inner: '#F6A3B8', eye: '#24130A', shine: '#FFFFFF', nose: '#F46F93', blush: '#FF8FAB', line: '#4F260C' },
};

// pose: parâmetros do desenho
const POSES = {
  sit:    {},
  blink:  { eyes: 'closed' },
  nose:   { noseUp: true },
  happy:  { eyes: 'happy', ears: -8, blush: 2 },
  look:   { head: [0, -1.5], eyes: 'up', ears: -4 },
  groom:  { eyes: 'closed', paw: 'face', head: [-0.5, 1], ears: 6 },
  groom2: { eyes: 'closed', paw: 'ear', head: [-0.5, 0.5], ears: 10 },
  crouch: { body: [0, 2.5, 1.18, 0.82], head: [1, 3], ears: 34, paw: 'down' },
  air:    { body: [1, -1, 1.28, 0.78], head: [3, -0.5], ears: 52, legs: 'back', paw: 'forward' },
  sleep:  { lying: true, eyes: 'closed' },
};
export const FRAME_NAMES = Object.keys(POSES);

function ellipse(ctx, cx, cy, rx, ry, color, rot = 0) {
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(rx, .1), Math.max(ry, .1), rot, 0, Math.PI * 2); ctx.fill();
}
const rad = (deg) => (deg * Math.PI) / 180;

function drawEar(ctx, x, y, len, angle, pal, flop = false) {
  // orelha: elipse comprida girada a partir da base (x, y)
  const a = rad(angle);
  const cx = x + Math.sin(a) * len * 0.5, cy = y - Math.cos(a) * len * 0.5;
  ellipse(ctx, cx, cy, 3, len * 0.56, pal.fur, a);
  ellipse(ctx, cx + Math.cos(a) * 0.5, cy + Math.sin(a) * 0.5 + (flop ? 0.3 : 0), 0.9, len * 0.36, pal.inner, a);
}

// Orelha do Vítor: metade de baixo em pé, ponta dobrada caindo para a frente
function drawFoldedEar(ctx, x, y, angle, pal) {
  drawEar(ctx, x, y, 10, angle, pal);
  const a = rad(angle);
  const fx = x + Math.sin(a) * 9.2, fy = y - Math.cos(a) * 9.2; // ponto da dobra
  const a2 = a + rad(132);                                       // ponta caindo para a frente
  ellipse(ctx, fx + Math.sin(a2) * 3, fy - Math.cos(a2) * 3, 2.5, 4.2, pal.shade, a2); // lado de fora, na sombra
  ellipse(ctx, fx, fy, 2.9, 1.6, pal.fur, a);                    // dobra arredondada
}

function paint(ctx, fur, p) {
  const pal = PALETTES[fur];
  const caramelo = fur === 'caramelo';

  if (p.lying) {
    // deitado dormindo: corpo baixo, cabeça apoiada, orelhas para trás
    ellipse(ctx, 4.5, 24.5, 3, 3, pal.light);                 // rabinho
    ellipse(ctx, 14, 25, 11, 5.5, pal.fur);                   // corpo
    ellipse(ctx, 11, 27.6, 8, 2.2, pal.shade);                // sombra da barriga
    ellipse(ctx, 23.5, 24.5, 6, 4.8, pal.fur);                // cabeça
    ellipse(ctx, 27.4, 26, 2.4, 1.9, pal.light);              // focinho
    drawEar(ctx, 20, 21.5, 12, -78, pal);                     // orelhas deitadas sobre as costas
    drawEar(ctx, 21, 22.5, 11, -84, pal);
    ctx.fillStyle = pal.eye; ctx.fillRect(23, 24, 3, 1);      // olho fechado
    ctx.fillStyle = pal.nose; ctx.fillRect(29, 25, 1, 1);
    ctx.fillStyle = pal.blush; ctx.fillRect(25, 26, 2, 1);
    ellipse(ctx, 25, 29, 2.4, 1.2, pal.light);                // patinha
    return;
  }

  const [bx, by, bsx, bsy] = p.body || [0, 0, 1, 1];
  const [hx, hy] = p.head || [0, 0];
  const earTilt = p.ears || 0;

  // pernas traseiras
  if (p.legs === 'back') {
    ellipse(ctx, 4 + bx, 26 + by, 5.5, 2.2, pal.fur, rad(-18));
    ellipse(ctx, 1.8 + bx, 27.4 + by, 2.6, 1.3, pal.light, rad(-18));
  } else {
    ellipse(ctx, 13 + bx, 29.2 + by * 0.4, 6, 1.9, pal.light);   // pé traseiro
  }

  ellipse(ctx, 4.6 + bx, 21.5 + by, 3.1, 3.1, pal.light);         // rabinho
  ellipse(ctx, 13.5 + bx, 21.5 + by, 9 * bsx, 7.6 * bsy, pal.fur); // corpo
  ellipse(ctx, 10.5 + bx, 24 + by, 6.2 * bsx, 5 * bsy, pal.shade); // coxa
  ellipse(ctx, 18.5 + bx, 23 + by, 3.6 * bsx, 4.6 * bsy, pal.light); // peito

  // orelhas (de trás e da frente)
  const ex = 19.5 + hx, ey = 10.5 + hy;
  drawEar(ctx, ex - 1.2, ey + 0.5, 13, -14 + earTilt, pal);
  if (caramelo) drawFoldedEar(ctx, ex + 0.8, ey + 0.6, -2 + earTilt, pal); // orelha em pé com a ponta dobrada para a frente
  else drawEar(ctx, ex + 0.8, ey + 0.6, 13, -2 + earTilt, pal);

  // cabeça
  ellipse(ctx, 22 + hx, 14.5 + hy, 6.6, 5.9, pal.fur);
  ellipse(ctx, 26.6 + hx, 16.6 + hy, 2.8, 2.2, pal.light);        // focinho
  if (caramelo) ellipse(ctx, 22.2 + hx, 10.6 + hy, 1.3, 2.1, pal.light); // manchinha na testa
  else { ctx.fillStyle = pal.shade; ctx.fillRect(20 + hx, 8 + hy, 2, 1); ctx.fillRect(21 + hx, 7 + hy, 1, 1); } // topete

  // olho
  const eyX = Math.round(23 + hx), eyY = Math.round(12.6 + hy);
  ctx.fillStyle = pal.eye;
  if (p.eyes === 'closed') ctx.fillRect(eyX - 1, eyY + 1, 3, 1);
  else if (p.eyes === 'happy') { ctx.fillRect(eyX - 1, eyY + 1, 1, 1); ctx.fillRect(eyX, eyY, 1, 1); ctx.fillRect(eyX + 1, eyY + 1, 1, 1); }
  else {
    ctx.fillRect(eyX - 1, eyY, 3, 3);
    ctx.fillStyle = pal.shine; ctx.fillRect(eyX + (p.eyes === 'up' ? 0 : 0), eyY + (p.eyes === 'up' ? 0 : 0), 1, 1);
  }
  // bochecha e nariz
  ctx.fillStyle = pal.blush; ctx.fillRect(Math.round(23.6 + hx), Math.round(16 + hy), p.blush || 1, 1);
  ctx.fillStyle = pal.nose; ctx.fillRect(Math.round(29 + hx), Math.round((p.noseUp ? 15 : 15.6) + hy), 1, 1);

  // patinhas da frente
  if (p.paw === 'face') ellipse(ctx, 26 + hx, 13.8 + hy, 1.7, 1.6, pal.light);
  else if (p.paw === 'ear') ellipse(ctx, 22.5 + hx, 9.5 + hy, 1.6, 1.7, pal.light);
  else if (p.paw === 'forward') ellipse(ctx, 25 + bx, 26 + by, 2.6, 1.3, pal.light, rad(30));
  else ellipse(ctx, 21.5 + bx, 28.4 + by * 0.6, 1.9, 1.5, pal.light);
}

function hexToRgb(h) { return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); }

// pixeliza: alfa binário, cor travada na paleta, contorno de 1px
function pixelize(ctx, fur) {
  const pal = PALETTES[fur];
  const colors = Object.entries(pal).filter(([k]) => k !== 'line').map(([, v]) => hexToRgb(v));
  const line = hexToRgb(pal.line);
  const img = ctx.getImageData(0, 0, SIZE, SIZE);
  const d = img.data;
  const solid = new Uint8Array(SIZE * SIZE);
  for (let i = 0; i < SIZE * SIZE; i++) {
    const a = d[i * 4 + 3];
    if (a < 110) { d[i * 4 + 3] = 0; continue; }
    // desfaz a mistura com o transparente antes de comparar
    const k = 255 / a;
    const px = [d[i * 4] * k, d[i * 4 + 1] * k, d[i * 4 + 2] * k];
    let best = colors[0], bd = Infinity;
    for (const c of colors) { const dist = (c[0] - px[0]) ** 2 + (c[1] - px[1]) ** 2 + (c[2] - px[2]) ** 2; if (dist < bd) { bd = dist; best = c; } }
    d[i * 4] = best[0]; d[i * 4 + 1] = best[1]; d[i * 4 + 2] = best[2]; d[i * 4 + 3] = 255;
    solid[i] = 1;
  }
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    const i = y * SIZE + x;
    if (solid[i]) continue;
    const near = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
      const nx = x + dx, ny = y + dy;
      return nx >= 0 && ny >= 0 && nx < SIZE && ny < SIZE && solid[ny * SIZE + nx];
    });
    if (near) { d[i * 4] = line[0]; d[i * 4 + 1] = line[1]; d[i * 4 + 2] = line[2]; d[i * 4 + 3] = 255; }
  }
  ctx.putImageData(img, 0, 0);
}

export function buildSprites(doc = document) {
  const out = {};
  for (const fur of Object.keys(PALETTES)) {
    out[fur] = {};
    for (const name of FRAME_NAMES) {
      const cv = doc.createElement('canvas');
      cv.width = SIZE; cv.height = SIZE;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.translate(ORIGIN.x, ORIGIN.y);
      paint(ctx, fur, POSES[name]);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      pixelize(ctx, fur);
      out[fur][name] = cv;
    }
  }
  return out;
}

// Coraçãozinho e "z" em pixel art para as partículas
export const HEART = ['.oo.oo.', 'ohhohho', 'ohhhhho', '.ohhho.', '..oho..', '...o...'];
export const ZZZ = ['zzzzz', '...z.', '..z..', '.z...', 'zzzzz'];
