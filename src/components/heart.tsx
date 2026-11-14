/** Coração em gradiente da paleta, usado no batimento (design-system §6). */
export function Heart({ className, blur = 0 }: { className?: string; blur?: number }) {
  const id = `hf-${blur}`;
  return (
    <svg viewBox="0 0 200 190" aria-hidden="true" className={className} style={blur ? { filter: `blur(${blur}px)` } : undefined}>
      <defs>
        <radialGradient id={id} cx="50%" cy="45%" r="65%">
          <stop offset="0" stopColor="#FFC22E" />
          <stop offset=".28" stopColor="#FF5EA0" />
          <stop offset=".62" stopColor="#D61F69" />
          <stop offset="1" stopColor="#3053E3" />
        </radialGradient>
      </defs>
      <path fill={`url(#${id})`} d="M100 182C42 136 8 100 8 64 8 34 31 12 58 12c19 0 34 10 42 26 8-16 23-26 42-26 27 0 50 22 50 52 0 36-34 72-92 118z" />
    </svg>
  );
}
