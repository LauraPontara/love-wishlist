/**
 * Laço amarelo no cruzamento das fitas da caixa de presente (.gift-box).
 * O nó fica exatamente sobre o cruzamento (fitas: vertical em right 34–44px, horizontal em top 18–28px).
 */
export function GiftBow() {
  return (
    <svg className="gift-bow" viewBox="0 0 48 40" width="48" height="40" aria-hidden="true"
      style={{ position: "absolute", top: 9, right: 15, pointerEvents: "none", zIndex: 1, overflow: "visible", filter: "drop-shadow(0 1.5px 1px rgba(28,26,74,.28))" }}>
      <g fill="var(--ribbon)" stroke="var(--ribbon-edge)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round">
        {/* rabinhos compridos, com ponta em V */}
        <path d="M22.2 15.5 13.4 36.6l4-1.7 1.9 4L25.4 16.6z" />
        <path d="M25.8 15.5l8.8 21.1-4-1.7-1.9 4L22.6 16.6z" />
        {/* voltas do laço */}
        <path d="M24 14C19.6 5.2 6.8.6 4.4 6.6c-2.3 5.8 4.3 12.6 19.6 7.4z" />
        <path d="M24 14c4.4-8.8 17.2-13.4 19.6-7.4 2.3 5.8-4.3 12.6-19.6 7.4z" />
      </g>
      {/* dobrinhas por dentro das voltas */}
      <g fill="none" stroke="var(--ribbon-edge)" strokeWidth="1.2" strokeLinecap="round" opacity=".55">
        <path d="M22.4 13.2C17.6 8.4 11 6.4 9 8.4" />
        <path d="M25.6 13.2c4.8-4.8 11.4-6.8 13.4-4.8" />
      </g>
      {/* nó */}
      <rect x="20.2" y="9.8" width="7.6" height="8.4" rx="3.2" fill="var(--ribbon)" stroke="var(--ribbon-edge)" strokeWidth="1.4" />
      <path d="M22.4 12.4c1.1-.6 2.1-.6 3.2 0" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}
