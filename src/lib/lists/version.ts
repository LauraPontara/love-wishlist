import "server-only";
import { cookies } from "next/headers";

/** Cookie lido pelo app: quando muda, o cache das listas no aparelho sabe que precisa se atualizar. */
export const LISTS_VERSION_COOKIE = "nw-v";

/** Chamar em toda ação que mexe em itens ou presentes. */
export async function bumpLists() {
  (await cookies()).set(LISTS_VERSION_COOKIE, String(Date.now()), { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
}
