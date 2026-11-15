/** Esqueleto de carregamento: etiquetas "fantasma" no lugar do texto "Carregando…". */
export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-label="Carregando" className="flex flex-col gap-4">
      <div className="skeleton h-[52px] rounded-2xl max-w-[520px]" />
      <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <li key={i} className="tag" style={{ animationDelay: `${i * 90}ms` }}>
            <div className="skeleton w-[58px] h-[58px] rounded-xl" />
            <div className="flex flex-col gap-2 min-w-0">
              <div className="skeleton h-4 rounded-md" style={{ width: `${70 - (i % 3) * 12}%` }} />
              <div className="skeleton h-3 rounded-md w-2/5" />
            </div>
            <div className="skeleton h-5 w-16 rounded-md" />
          </li>
        ))}
      </ul>
    </div>
  );
}
