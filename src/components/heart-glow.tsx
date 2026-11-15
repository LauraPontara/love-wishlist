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

/**
 * Desktop (estilo Lovable): o topo de um coração gigante de luz. Dois lóbulos sobem pelas laterais
 * (borda azul, miolo rosa) e se encontram embaixo no centro, deixando um "V" escuro no meio. Pulsa.
 * Geometria em 1440x800: lóbulos com raio 474 centrados em x=250/1190, y=624 → encostam em x=720, y≈560.
 */
export function HeartAura({ className = "" }: { className?: string }) {
  return (
    <div className={`heart-aura ${className}`} aria-hidden="true">
      <svg className="heart-aura-shape" viewBox="0 0 1440 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="lobe" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#FF5CAE" />
            <stop offset=".55" stopColor="#F98BE6" />
            <stop offset=".76" stopColor="#C58BFF" />
            <stop offset=".88" stopColor="#4F7DFF" />
            <stop offset=".96" stopColor="#3F6BFF" stopOpacity=".55" />
            <stop offset="1" stopColor="#3F6BFF" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FF5CAE" stopOpacity="0" />
            <stop offset=".5" stopColor="#FF4F9A" stopOpacity=".85" />
            <stop offset="1" stopColor="#FF2D5A" />
          </linearGradient>
          <radialGradient id="tip" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#E99BFF" stopOpacity=".9" />
            <stop offset=".55" stopColor="#6F86FF" stopOpacity=".7" />
            <stop offset="1" stopColor="#3F6BFF" stopOpacity="0" />
          </radialGradient>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="34" /></filter>
        </defs>
        <g filter="url(#soft)">
          <ellipse cx="720" cy="690" rx="260" ry="170" fill="url(#tip)" />
          <circle cx="170" cy="720" r="580" fill="url(#lobe)" />
          <circle cx="1270" cy="720" r="580" fill="url(#lobe)" />
          <rect x="-100" y="640" width="1640" height="260" fill="url(#floor)" />
        </g>
      </svg>
      <div className="heart-aura-veil" />
    </div>
  );
}
