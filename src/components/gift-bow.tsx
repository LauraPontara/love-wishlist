/**
 * Laço gordinho no cruzamento das fitas da caixa de presente (.gift-box):
 * voltas largas e cheias, nó quadradinho e rabinhos largos abertos para baixo, com corte em V.
 * O nó fica sobre o cruzamento (fitas: vertical em right 34–44px, horizontal em top 18–28px).
 */
export function GiftBow() {
  return (
    <svg className="gift-bow" viewBox="0 0 60 48" width="56" height="45" aria-hidden="true"
      style={{ position: "absolute", top: 8, right: 11, pointerEvents: "none", zIndex: 1, overflow: "visible", filter: "drop-shadow(0 1.5px 1.2px rgba(28,26,74,.3))" }}>
      <defs>
        <linearGradient id="bow-loop" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFD866" />
          <stop offset=".55" stopColor="var(--ribbon)" />
          <stop offset="1" stopColor="#F2AE12" />
        </linearGradient>
        <linearGradient id="bow-tail" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2AE12" />
          <stop offset=".45" stopColor="var(--ribbon)" />
          <stop offset="1" stopColor="#E8A10C" />
        </linearGradient>
      </defs>
      <g stroke="var(--ribbon-edge)" strokeWidth="1.3" strokeLinejoin="round">
        {/* rabinhos largos, abertos, com ponta em V */}
        <path fill="url(#bow-tail)" d="M27.5 19.5C22.8 25 17.4 32 13.6 41.6l5.6-2.6 2.4 6.4C24.6 37 27.6 29 31 21.4z" />
        <path fill="url(#bow-tail)" d="M32.5 19.5C37.2 25 42.6 32 46.4 41.6l-5.6-2.6-2.4 6.4C35.4 37 32.4 29 29 21.4z" />
        {/* voltas gordinhas */}
        <path fill="url(#bow-loop)" d="M27.4 13.2C22.4 6 12.6 3.2 7.2 4.8 2.4 6.3 1.6 13 3.2 19c1.6 5.8 11 6.4 24.2.6z" />
        <path fill="url(#bow-loop)" d="M32.6 13.2C37.6 6 47.4 3.2 52.8 4.8c4.8 1.5 5.6 8.2 4 14.2-1.6 5.8-11 6.4-24.2.6z" />
      </g>
      {/* dobra para dentro do nó (sombra) e brilho no alto das voltas */}
      <g fill="none" strokeLinecap="round">
        <path d="M27 15.6C20.4 12.6 12 12 7.6 14.2" stroke="var(--ribbon-edge)" strokeWidth="1.4" opacity=".5" />
        <path d="M33 15.6c6.6-3 15-3.6 19.4-1.4" stroke="var(--ribbon-edge)" strokeWidth="1.4" opacity=".5" />
        <path d="M9.6 7.6c4.6-1 10 .4 14.2 3.6" stroke="#fff" strokeWidth="1.5" opacity=".55" />
        <path d="M50.4 7.6c-4.6-1-10 .4-14.2 3.6" stroke="#fff" strokeWidth="1.5" opacity=".55" />
        <path d="M24.4 23.4c-2.8 4.4-5.6 9.4-7.8 14.4" stroke="#fff" strokeWidth="1.2" opacity=".35" />
        <path d="M35.6 23.4c2.8 4.4 5.6 9.4 7.8 14.4" stroke="#fff" strokeWidth="1.2" opacity=".35" />
      </g>
      {/* nó quadradinho */}
      <rect x="25.6" y="11.2" width="8.8" height="9.6" rx="2.6" fill="url(#bow-loop)" stroke="var(--ribbon-edge)" strokeWidth="1.3" />
      <path d="M27.8 13.6h4.4" stroke="#fff" strokeOpacity=".5" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
