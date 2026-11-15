"use client";

import type { CSSProperties } from "react";
import { maskMoney } from "@/lib/items/domain";

/**
 * Campo de dinheiro do app: "R$" fixo à esquerda e máscara enquanto digita
 * (ponto de milhar automático, uma vírgula, até 2 centavos). Devolve o texto já formatado.
 */
export function MoneyInput({ value, onChange, name, className = "field", placeholder = "0,00", label, style, onBlur }: {
  value: string; onChange: (value: string) => void; name?: string; className?: string; placeholder?: string;
  label: string; style?: CSSProperties; onBlur?: () => void;
}) {
  return (
    <span className="relative block">
      <span aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold pointer-events-none text-[.95em]" style={{ color: "var(--ink-2)" }}>R$</span>
      <input name={name} className={`${className} !pl-11`} inputMode="decimal" autoComplete="off" placeholder={placeholder}
        aria-label={label} style={style} value={value}
        onChange={(e) => onChange(maskMoney(e.target.value))}
        onBlur={() => {
          // "60,5" vira "60,50" ao sair do campo
          if (/,\d$/.test(value)) onChange(value + "0");
          else if (value.endsWith(",")) onChange(value.slice(0, -1));
          onBlur?.();
        }} />
    </span>
  );
}
