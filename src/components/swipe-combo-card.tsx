"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteCombo } from "@/app/actions/combos";
import type { Combo } from "@/lib/combos/domain";
import { ComboCard } from "./combo-card";
import { useConfirm } from "./confirm";
import { PencilIcon, TrashIcon } from "./icons";
import { Swipe, type SwipeAction } from "./swipe";

/** Card de Meus combos que desliza para revelar "Editar" (só montados) e "Excluir" (não dados). */
export function SwipeComboCard({ combo }: { combo: Combo }) {
  const router = useRouter();
  const ask = useConfirm();
  const [pending, start] = useTransition();

  const actions: SwipeAction[] = [];
  if (combo.status === "montado") {
    actions.push({ label: "Editar", icon: <PencilIcon />, style: { background: "var(--secondary)", color: "var(--on-secondary)" },
      onClick: () => router.push(`/combos/${combo.id}?montar=${Date.now()}`) });
  }
  if (combo.status !== "dado") {
    actions.push({ label: "Excluir", icon: <TrashIcon />, style: { background: "#C81E4A", color: "#fff" }, disabled: pending,
      onClick: async () => {
        const ok = await ask({
          title: "Excluir este presente?",
          body: <>“{combo.name}” some dos seus presentes. Os itens continuam na lista.</>,
          confirmLabel: "Excluir presente", tone: "danger",
        });
        if (ok) start(async () => { await deleteCombo(combo.id); router.refresh(); });
      } });
  }
  if (!actions.length) return <ComboCard combo={combo} />;

  return (
    <div style={{ opacity: pending ? 0.5 : 1, transition: "opacity .2s" }}>
      <Swipe actions={actions} label={`Ações de ${combo.name}`}>
        <ComboCard combo={combo} />
      </Swipe>
    </div>
  );
}
