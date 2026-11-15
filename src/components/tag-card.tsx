import type { ReactNode } from "react";
import { CATEGORY_EMOJI, formatPrice, type Item } from "@/lib/items/domain";
import { ExternalIcon } from "./icons";

/** Item como etiqueta de presente (design-system §5). */
export function TagCard({ item, href, external, badge, action, dim, storeLink }: {
  item: Item; href?: string; external?: boolean; badge?: ReactNode; action?: ReactNode; dim?: boolean;
  /** mostra um botão para abrir o produto na loja (quando o cartão leva para outro lugar) */
  storeLink?: boolean;
}) {
  const className = `tag ${item.kind === "sempre" ? "sempre" : ""} ${dim ? "dim" : ""}`;
  const variant = Object.values(item.variant).join(", ");
  const body = (
    <>
      <div className="w-[58px] h-[58px] rounded-xl overflow-hidden grid place-items-center text-[28px] shrink-0" style={{ background: "var(--bg)", opacity: dim ? 0.6 : 1 }}>
        {item.imageUrl
          ? <img src={item.imageUrl} alt="" className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
          : <span aria-hidden="true">{CATEGORY_EMOJI[item.category]}</span>}
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-[.98rem] leading-tight line-clamp-2" style={{ opacity: dim ? 0.7 : 1 }}>{item.title}</h3>
        <p className="text-[.8rem] mt-0.5 truncate" style={{ color: "var(--ink-2)" }}>
          {[item.store, variant].filter(Boolean).join(", ") || item.category}
        </p>
        {badge && <div className="mt-1">{badge}</div>}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className="font-extrabold text-[1.05rem] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 80", color: item.priceCents === null ? "var(--ink-2)" : undefined }}>
          {formatPrice(item.priceCents)}
        </span>
        {(action || (storeLink && item.url)) && (
          <div className="flex items-center gap-1.5">
            {storeLink && item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="icon-btn relative z-10 !w-[42px] !h-[42px]"
                aria-label={`Abrir ${item.title} na loja`} title="Abrir na loja"><ExternalIcon /></a>
            )}
            {action}
          </div>
        )}
      </div>
    </>
  );

  // O link cobre o cartão inteiro; botões de ação ficam por cima (z-10), sem aninhar botão dentro de link.
  return (
    <div className={`${className} ${href ? "linked" : ""}`}>
      {href && (
        <a href={href} className="absolute inset-0 z-[1] tag-link" aria-label={external ? `${item.title} (abre na loja)` : `Editar ${item.title}`}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} />
      )}
      {body}
    </div>
  );
}
