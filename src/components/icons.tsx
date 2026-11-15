import type { ButtonHTMLAttributes, ReactNode } from "react";

const svg = (children: ReactNode) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

export const PencilIcon = () => svg(<><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>);
export const TrashIcon = () => svg(<><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /></>);
export const CopyIcon = () => svg(<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></>);
export const GearIcon = () => svg(<><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>);
export const ExternalIcon = () => svg(<><path d="M14 4h6v6" /><path d="M20 4 11 13" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>);
export const CheckIcon = () => svg(<path d="M5 12.5 10 17 19 7" />);
export const PlusIcon = () => svg(<path d="M12 5v14M5 12h14" />);
export const MinusIcon = () => svg(<path d="M5 12h14" />);
export const SelectIcon = () => svg(<><rect x="3.5" y="3.5" width="17" height="17" rx="4" /><path d="M8 12.2 10.8 15 16 9" /></>);
/** Estrela do preferido: cheia (amarela) ou só o contorno. */
export const StarIcon = ({ filled = false, size = 20 }: { filled?: boolean; size?: number }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill={filled ? "#FFC22E" : "none"}
    stroke={filled ? "#D99A00" : "currentColor"} strokeWidth="2" strokeLinejoin="round">
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
  </svg>
);
export const HelpIcon = () => svg(<><circle cx="12" cy="12" r="9.5" /><path d="M9.4 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.3-2.6 3.9" /><path d="M12 17.4h.01" strokeWidth="2.6" /></>);
export const CloseIcon = () => svg(<path d="M18 6 6 18M6 6l12 12" />);

/** Botão só com ícone: alvo de toque de 44px e nome acessível obrigatório. */
export function IconButton({ label, tone, children, className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; tone?: "danger" }) {
  return (
    <button type="button" aria-label={label} title={label} {...rest}
      className={`icon-btn ${className}`} style={tone === "danger" ? { color: "var(--error-ink)" } : undefined}>
      {children}
    </button>
  );
}
