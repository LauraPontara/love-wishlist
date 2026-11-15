/** Lacinho amarelo no cruzamento das fitas da caixa de presente (.gift-box). */
export function GiftBow() {
  return (
    <svg className="gift-bow" viewBox="0 0 34 24" width="38" height="27" aria-hidden="true"
      style={{ position: "absolute", top: 9, right: 20, pointerEvents: "none", zIndex: 1, filter: "drop-shadow(0 1px 1px rgba(28,26,74,.25))" }}>
      <g fill="var(--ribbon)" stroke="var(--ribbon-edge)" strokeWidth="1.3" strokeLinejoin="round">
        <path d="M15.2 13.4 11 22.6l3.2-.8L16.6 14z" />
        <path d="M18.8 13.4 23 22.6l-3.2-.8L17.4 14z" />
        <path d="M17 12C11.2 2.6 1.6 2.4 2.6 9.8 3.4 16 11 15.4 17 12z" />
        <path d="M17 12c5.8-9.4 15.4-9.6 14.4-2.2C30.6 16 23 15.4 17 12z" />
      </g>
      <g fill="var(--ribbon-edge)" opacity=".35">
        <path d="M16 11.6C12 6.4 6.6 5.8 6.4 9.2c-.1 2.4 4.4 3.2 9.6 2.4z" />
        <path d="M18 11.6c4-5.2 9.4-5.8 9.6-2.4.1 2.4-4.4 3.2-9.6 2.4z" />
      </g>
      <rect x="13.6" y="8.6" width="6.8" height="6.8" rx="2.2" fill="var(--ribbon)" stroke="var(--ribbon-edge)" strokeWidth="1.3" />
    </svg>
  );
}
