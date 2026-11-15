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
 * Desktop: um coração de luz gigante subindo de baixo da tela; só a parte de cima
 * (os dois lóbulos e a fenda do meio) aparece, desfocada, pulsando.
 */
export function HeartAura({ className = "" }: { className?: string }) {
  return (
    <div className={`heart-aura ${className}`} aria-hidden="true">
      <svg className="heart-aura-shape" viewBox="0 0 200 190" preserveAspectRatio="xMidYMin meet">
        <defs>
          <linearGradient id="aura-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset=".04" stopColor="#3D6BFF" />
            <stop offset=".12" stopColor="#7B5CFF" />
            <stop offset=".2" stopColor="#D946C8" />
            <stop offset=".28" stopColor="#FF4F9A" />
            <stop offset=".45" stopColor="#FF2E7E" />
            <stop offset="1" stopColor="#FF2E6E" />
          </linearGradient>
          <radialGradient id="aura-core" cx="50%" cy="36%" r="22%">
            <stop offset="0" stopColor="#FFD6EA" stopOpacity=".9" />
            <stop offset=".5" stopColor="#FF7AB8" stopOpacity=".45" />
            <stop offset="1" stopColor="#FF7AB8" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path fill="url(#aura-fill)" d="M100 182C42 136 8 100 8 64 8 34 31 12 58 12c19 0 34 10 42 26 8-16 23-26 42-26 27 0 50 22 50 52 0 36-34 72-92 118z" />
        <path fill="url(#aura-core)" d="M100 182C42 136 8 100 8 64 8 34 31 12 58 12c19 0 34 10 42 26 8-16 23-26 42-26 27 0 50 22 50 52 0 36-34 72-92 118z" />
      </svg>
      <div className="heart-aura-veil" />
    </div>
  );
}
