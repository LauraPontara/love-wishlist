import type { CSSProperties, ReactNode } from "react";

/**
 * Esqueletos de carregamento: cada tela tem o seu, com a mesma forma da tela pronta
 * (assim nada "pula" quando os dados chegam).
 */

const Bone = ({ className = "", style }: { className?: string; style?: CSSProperties }) => <div className={`skeleton ${className}`} style={style} />;
const Card = ({ className = "", children, style }: { className?: string; children: ReactNode; style?: CSSProperties }) => (
  <div className={`rounded-[20px] border-2 ${className}`} style={{ background: "var(--surface)", borderColor: "var(--line)", ...style }}>{children}</div>
);
const Loading = ({ children, className = "" }: { children: ReactNode; className?: string }) => (
  <div role="status" aria-label="Carregando" className={className}>{children}</div>
);
const delay = (i: number): CSSProperties => ({ animationDelay: `${i * 90}ms` });

/** Uma etiqueta fantasma (mesmo formato dos itens da lista). */
function TagBone({ i }: { i: number }) {
  return (
    <div className="tag" style={delay(i)}>
      <Bone className="w-[58px] h-[58px] rounded-xl" />
      <div className="flex flex-col gap-2 min-w-0">
        <Bone className="h-4 rounded-md" style={{ width: `${70 - (i % 3) * 12}%` }} />
        <Bone className="h-3 rounded-md w-2/5" />
      </div>
      <Bone className="h-5 w-16 rounded-md" />
    </div>
  );
}

/** Minha lista e lista do outro: abas (só na minha), busca, filtros e etiquetas. */
export function ListSkeleton({ count = 6, tabs = true }: { count?: number; tabs?: boolean }) {
  return (
    <Loading className="flex flex-col gap-4">
      {tabs && <Bone className="h-[44px] rounded-full max-w-[520px]" />}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-[1fr_170px_190px]">
        <Bone className="h-[52px] rounded-2xl col-span-2 md:col-span-1" />
        <Bone className="h-[52px] rounded-2xl" />
        <Bone className="h-[52px] rounded-2xl" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {[130, 70, 64, 140, 110].map((w, i) => <Bone key={i} className="h-[34px] rounded-full shrink-0" style={{ width: w }} />)}
      </div>
      <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: count }, (_, i) => <li key={i}><TagBone i={i} /></li>)}
      </ul>
    </Loading>
  );
}

/** Presentes: botão de montar, título e caixas de presente com fita e etapas. */
export function GiftsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <Loading className="flex flex-col gap-6">
      <Bone className="h-[54px] rounded-2xl" />
      <div className="flex flex-col gap-3">
        <Bone className="h-6 w-40 rounded-md" />
        <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: count }, (_, i) => (
            <li key={i}>
              <Card className="gift-box is-loading p-4 sm:p-5 flex flex-col gap-3" style={delay(i)}>
                <div className="flex flex-col gap-1.5 pr-20">
                  <Bone className="h-5 rounded-md" style={{ width: `${75 - i * 10}%` }} />
                  <Bone className="h-3.5 w-1/2 rounded-md" />
                </div>
                <StepsBone compact />
                <div className="flex items-center justify-between">
                  <Bone className="h-3.5 w-12 rounded-md" />
                  <Bone className="h-5 w-28 rounded-md" />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </Loading>
  );
}

function StepsBone({ compact = false }: { compact?: boolean }) {
  const pill = compact ? "h-[26px] w-[74px]" : "h-[34px] w-[92px]";
  return (
    <div className="flex items-center gap-1.5">
      <Bone className={`${pill} rounded-full`} /><span className="h-0.5 flex-1 rounded" style={{ background: "var(--line)" }} />
      <Bone className={`${pill} rounded-full`} /><span className="h-0.5 flex-1 rounded" style={{ background: "var(--line)" }} />
      <Bone className={`${pill} rounded-full`} />
    </div>
  );
}

/** Montar presente: nome, orçamento, etapas e itens; no desktop, a lista do outro ao lado. */
export function BuilderSkeleton() {
  return (
    <Loading className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] items-start">
      <div className="flex flex-col gap-5 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <Bone className="h-9 w-2/3 max-w-[340px] rounded-lg" />
          <Bone className="w-11 h-11 rounded-xl" />
        </div>
        <Bone className="h-3.5 w-48 rounded-md -mt-2" />
        <Card className="!rounded-[18px] p-4 flex flex-col gap-3">
          <div className="flex items-end justify-between">
            <Bone className="h-3.5 w-14 rounded-md" />
            <Bone className="h-7 w-28 rounded-md" />
          </div>
          <Bone className="h-4 rounded" />
          <Bone className="h-3.5 w-36 rounded-md" />
        </Card>
        <StepsBone />
        <ul className="flex flex-col gap-3">
          {[0, 1].map((i) => <li key={i}><TagBone i={i} /></li>)}
        </ul>
        <Bone className="h-[52px] rounded-2xl lg:hidden" />
      </div>
      <Card className="hidden lg:flex flex-col gap-3 p-4">
        <Bone className="h-6 w-44 rounded-md" />
        <div className="grid grid-cols-[1fr_auto] gap-2"><Bone className="h-[52px] rounded-2xl" /><Bone className="h-[52px] w-[130px] rounded-2xl" /></div>
        <div className="flex gap-2">{[110, 60, 66].map((w, i) => <Bone key={i} className="h-[34px] rounded-full" style={{ width: w }} />)}</div>
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 5 }, (_, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl p-2" style={{ background: "var(--bg)", ...delay(i) }}>
              <Bone className="w-12 h-12 rounded-lg" />
              <div className="flex-1 flex flex-col gap-1.5"><Bone className="h-3.5 rounded-md" style={{ width: `${80 - (i % 3) * 15}%` }} /><Bone className="h-3 w-1/3 rounded-md" /></div>
              <Bone className="h-4 w-14 rounded-md" />
              <Bone className="w-11 h-11 rounded-full" />
            </li>
          ))}
        </ul>
      </Card>
    </Loading>
  );
}

/** Nossas datas: cartão da próxima data e a lista com o "calendarinho" de cada uma. */
export function DatesSkeleton({ count = 5 }: { count?: number }) {
  return (
    <Loading className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] items-start">
      <Card className="!rounded-[24px] p-6 sm:p-8 grid grid-cols-[1fr_auto] items-center gap-4">
        <div className="flex flex-col gap-2">
          <Bone className="h-3.5 w-24 rounded-md" />
          <Bone className="h-9 w-40 rounded-lg" />
          <Bone className="h-3.5 w-20 rounded-md" />
          <Bone className="h-4 w-48 rounded-md mt-2" />
          <Bone className="h-9 w-32 rounded-full mt-2" />
        </div>
        <div className="flex flex-col items-center gap-2"><Bone className="h-14 w-16 rounded-xl" /><Bone className="h-3.5 w-9 rounded-md" /></div>
      </Card>
      <div className="flex flex-col gap-2">
        <ul className="grid gap-2">
          {Array.from({ length: count }, (_, i) => (
            <li key={i} className="grid grid-cols-[56px_1fr_auto] items-center gap-3 rounded-2xl p-3 border-2" style={{ background: "var(--surface)", borderColor: "var(--line)", ...delay(i) }}>
              <Bone className="w-14 h-14 rounded-xl" />
              <div className="flex flex-col gap-2 min-w-0"><Bone className="h-4 rounded-md" style={{ width: `${60 - (i % 3) * 10}%` }} /><Bone className="h-3 w-4/5 rounded-md" /></div>
              <Bone className="w-11 h-11 rounded-xl" />
            </li>
          ))}
        </ul>
        <Bone className="h-[52px] rounded-2xl w-full sm:w-[170px] sm:self-end" />
      </div>
    </Loading>
  );
}

/** Editar item / Adicionar: campos do formulário e, no desktop, a prévia da etiqueta. */
export function FormSkeleton({ tabs = false }: { tabs?: boolean }) {
  const field = (w: string, key: number) => (
    <div key={key} className="flex flex-col gap-1.5"><Bone className="h-3.5 rounded-md" style={{ width: w }} /><Bone className="h-[52px] rounded-2xl" /></div>
  );
  return (
    <Loading className="flex flex-col gap-5">
      {tabs && <Bone className="h-[44px] rounded-full max-w-[420px]" />}
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] items-start">
        <div className="flex flex-col gap-4">
          {field("120px", 0)}
          {field("60px", 1)}
          <div className="grid gap-4 sm:grid-cols-2">{field("50px", 2)}{field("44px", 3)}</div>
          <div className="grid gap-4 sm:grid-cols-2">{field("70px", 4)}{field("40px", 5)}</div>
          {field("64px", 6)}
          <Bone className="h-[52px] w-full sm:w-[200px] rounded-2xl mt-2" />
        </div>
        <div className="hidden lg:flex flex-col gap-3">
          <Bone className="h-4 w-32 rounded-md" />
          <TagBone i={0} />
        </div>
      </div>
    </Loading>
  );
}

/** Ajustes: cartões de Aparência, Avisos e Conta. */
export function SettingsSkeleton() {
  const toggle = (i: number) => (
    <div key={i} className="flex items-center justify-between gap-4 min-h-[48px]">
      <div className="flex flex-col gap-1.5 flex-1"><Bone className="h-4 w-1/2 rounded-md" /><Bone className="h-3 w-2/3 rounded-md" /></div>
      <Bone className="w-[52px] h-[30px] rounded-full" />
    </div>
  );
  return (
    <Loading className="grid gap-5 lg:grid-cols-2 items-start max-w-[1000px]">
      <Card className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5"><Bone className="h-6 w-32 rounded-md" /><Bone className="h-3.5 w-40 rounded-md" /></div>
        <Bone className="h-[52px] rounded-2xl" />
        {toggle(0)}
      </Card>
      <Card className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5"><Bone className="h-6 w-24 rounded-md" /><Bone className="h-3.5 w-3/4 rounded-md" /></div>
        <Bone className="h-[52px] w-full sm:w-[240px] rounded-2xl" />
        {toggle(1)}{toggle(2)}
      </Card>
      <Card className="p-5 flex flex-col gap-4">
        <Bone className="h-6 w-20 rounded-md" />
        <Bone className="h-[52px] w-full sm:w-[140px] rounded-2xl" />
      </Card>
    </Loading>
  );
}
