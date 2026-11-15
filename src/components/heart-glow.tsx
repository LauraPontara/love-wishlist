/**
 * Campo de luz da paleta com a silhueta de um coração no meio (estilo "glow"):
 * a luz contorna a silhueta, que pulsa no ritmo do batimento.
 */
export function HeartGlow({ className = "" }: { className?: string }) {
  return (
    <div className={`heart-glow ${className}`} aria-hidden="true">
      <div className="heart-glow-light" />
      <svg className="heart-glow-shape" viewBox="0 0 200 190" preserveAspectRatio="xMidYMid meet">
        <path d="M100 182C42 136 8 100 8 64 8 34 31 12 58 12c19 0 34 10 42 26 8-16 23-26 42-26 27 0 50 22 50 52 0 36-34 72-92 118z" />
      </svg>
      <div className="heart-glow-veil" />
    </div>
  );
}

// ---------- desktop: corações de luz aninhados ----------
// Cada coração = 2 círculos (lóbulos) + 1 quadrado girado 45°, todos com borda que some numa curva suave
// (cosseno), sem blur. Vários corações um dentro do outro formam o degradê; a tela mostra só o topo.

/** Opacidade caindo de 1 a 0 numa curva suave (cosseno), de "from" até 1. */
function fade(from: number, steps = 12) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    return { offset: from + (1 - from) * t, opacity: (1 + Math.cos(Math.PI * t)) / 2 };
  });
}
/** Some nas duas pontas (0 → 1 → 0), para o quadrado ter borda macia dos dois lados. */
function edges(edge = 0.214, steps = 12) {
  const up = Array.from({ length: steps + 1 }, (_, i) => ({ offset: (edge * i) / steps, opacity: (1 - Math.cos((Math.PI * i) / steps)) / 2 }));
  const down = up.map((s) => ({ offset: 1 - s.offset, opacity: s.opacity })).reverse();
  return [...up, ...down];
}

type SoftHeart = { id: string; color: string; y: number; sx: number; lobe: { dx: number; dy: number; r: number; solid: number }; square: { half: number; ty: number; sy: number } };

function SoftHeartShape({ id, color, y, sx, lobe, square }: SoftHeart) {
  const h = square.half;
  return (
    <g transform={`translate(600 ${y}) scale(${sx} 1)`}>
      <radialGradient id={`${id}-lobe`}>
        {fade(lobe.solid).map((s, i) => <stop key={i} offset={s.offset} stopColor={color} stopOpacity={s.opacity} />)}
      </radialGradient>
      <linearGradient id={`${id}-x`}>
        {edges().map((s, i) => <stop key={i} offset={s.offset} stopColor={color} stopOpacity={s.opacity} />)}
      </linearGradient>
      <linearGradient id={`${id}-y`} x2="0" y2="1">
        {edges().map((s, i) => <stop key={i} offset={s.offset} stopColor="#fff" stopOpacity={s.opacity} />)}
      </linearGradient>
      <mask id={`${id}-mask`} maskUnits="userSpaceOnUse" x={-h} y={-h} width={2 * h} height={2 * h} style={{ maskType: "alpha" }}>
        <rect x={-h} y={-h} width={2 * h} height={2 * h} fill={`url(#${id}-y)`} />
      </mask>
      <circle cx={-lobe.dx} cy={lobe.dy} r={lobe.r} fill={`url(#${id}-lobe)`} />
      <circle cx={lobe.dx} cy={lobe.dy} r={lobe.r} fill={`url(#${id}-lobe)`} />
      <g transform={`translate(0 ${square.ty}) scale(1 ${square.sy}) rotate(45)`}>
        <rect x={-h} y={-h} width={2 * h} height={2 * h} fill={`url(#${id}-x)`} mask={`url(#${id}-mask)`} />
      </g>
    </g>
  );
}

// de fora para dentro: azul-cobalto, rosa claro, magenta e um miolo quente (fita)
const HEARTS: SoftHeart[] = [
  { id: "ha-1", color: "#4A7BFF", y: 834.7, sx: 1.014, lobe: { dx: 229, dy: -226.9, r: 329, solid: 0.592 }, square: { half: 313.1, ty: 43.8, sy: 0.852 } },
  { id: "ha-2", color: "#FF8ADF", y: 790.8, sx: 1.02, lobe: { dx: 195.4, dy: -166.1, r: 245.2, solid: 0.701 }, square: { half: 270.4, ty: 7.1, sy: 0.962 } },
  { id: "ha-3", color: "#F0287A", y: 821.2, sx: 1.038, lobe: { dx: 151.4, dy: -148, r: 229.2, solid: 0.491 }, square: { half: 219.6, ty: 43.9, sy: 0.73 } },
  { id: "ha-4", color: "#FF8A3D", y: 799.6, sx: 1.085, lobe: { dx: 107.1, dy: -102.4, r: 181.7, solid: 0.358 }, square: { half: 182.1, ty: 24.9, sy: 0.746 } },
];

/** Desktop: o topo de um coração de luz enorme atrás do login; o "V" escuro entre os lóbulos fica no meio. */
export function HeartAura({ className = "" }: { className?: string }) {
  return (
    <div className={`heart-aura ${className}`} aria-hidden="true">
      <div className="heart-aura-stage">
        <svg viewBox="0 0 1200 1210" className="heart-aura-svg">
          {HEARTS.map((h) => <SoftHeartShape key={h.id} {...h} />)}
        </svg>
      </div>
    </div>
  );
}
