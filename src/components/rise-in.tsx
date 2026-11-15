"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

const BOUNCE = [0.34, 1.4, 0.64, 1] as const;

/** Card que sobe de baixo, em fila com os vizinhos (i = posição na lista). */
export function RiseIn({ i, children }: { i: number; children: ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 22, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(i, 10) * 0.05, duration: 0.34, ease: BOUNCE }}>
      {children}
    </motion.div>
  );
}
