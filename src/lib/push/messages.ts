// Textos dos avisos (sem dependência de servidor, testáveis).
import type { PushPayload } from "./send";

/** RF37: um aviso por cadastro, mesmo que venham vários itens. */
export function newItemsMessage(ownerName: string, ownerId: string, count: number): PushPayload {
  const article = ownerName.endsWith("a") ? "dela" : "dele";
  return {
    title: count === 1 ? `${ownerName} adicionou 1 item` : `${ownerName} adicionou ${count} itens`,
    body: `Veja o que entrou na lista ${article}.`,
    url: `/lista/${ownerId}`,
    tag: "itens-novos",
  };
}

/** RF38: lembrete 7 dias antes; o texto depende do presente de quem recebe o aviso. */
export function occasionMessage(occasionName: string, days: number, comboStatus: "montado" | "comprado" | "dado" | null, isOwnBirthday: boolean): PushPayload {
  const when = days === 0 ? "É hoje" : days === 1 ? "É amanhã" : `Faltam ${days} dias`;
  let body: string;
  if (isOwnBirthday) body = "Que tal conferir se a sua lista está em dia?";
  else if (comboStatus === "comprado") body = "O presente já está comprado. Só falta entregar.";
  else if (comboStatus === "dado") body = "O presente já foi dado.";
  else if (comboStatus === "montado") body = "O presente está montado, mas ainda não foi comprado.";
  else body = "Você ainda não montou um presente. Dê uma olhada na lista.";
  return { title: `${when}: ${occasionName}`, body, url: isOwnBirthday ? "/" : "/combos", tag: `data-${occasionName}` };
}
