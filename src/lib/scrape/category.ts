import { fold, type Category } from "@/lib/items/domain";

// Sugestão de categoria por palavras-chave (sem IA). A pessoa confirma na revisão.
const RULES: Array<[Category, RegExp]> = [
  ["Tecnologia", /\b(fone|headphone|earbud|bluetooth|celular|smartphone|iphone|galaxy|notebook|tablet|ipad|kindle|carregador|cabo usb|mouse|teclado|monitor|smartwatch|relogio inteligente|caixa de som|jbl|xiaomi|camera|console|playstation|xbox|nintendo|ssd|pendrive|power ?bank)\b/],
  ["Beleza", /\b(batom|base liquida|maquiagem|paleta|sombra|rimel|mascara de cilios|blush|perfume|eau de (parfum|toilette)|colonia|esmalte|delineador|corretivo|primer|iluminador|gloss|skincare|serum)\b/],
  ["Cuidados pessoais", /\b(sabonete|shampoo|condicionador|hidratante|creme|locao|desodorante|protetor solar|oleo corporal|mascara capilar|escova de dente|creme dental|body splash|esfoliante|nativa spa|ekos)\b/],
  ["Comida & doces", /\b(chocolate|bala|bombom|doce|biscoito|bolacha|cafe|cha|vinho|cerveja|castanha|trufa|pacoca|brigadeiro|lacta|nestle|garoto|kopenhagen|cacau show|haribo|fini)\b/],
  ["Roupas", /\b(vestido|camisa|camiseta|blusa|calca|saia|short|bermuda|jaqueta|casaco|moletom|cardigan|pijama|meia|lingerie|biquini|maio|tenis|sapato|sandalia|bota|chinelo)\b/],
  ["Acessórios", /\b(bone|chapeu|bolsa|mochila|carteira|oculos|relogio|colar|brinco|anel|pulseira|cinto|lenco|presilha|piranha|necessaire)\b/],
  ["Casa", /\b(caneca|copo|xicara|almofada|manta|cobertor|vela|aromatizador|difusor|luminaria|abajur|planta|vaso|quadro|tapete|toalha|jogo de cama|panela|airfryer|cafeteira|liquidificador)\b/],
  ["Livros & papelaria", /\b(livro|box|hq|manga|caderno|agenda|planner|caneta|marca texto|lapis|estojo|adesivo|sketchbook)\b/],
  ["Experiências", /\b(ingresso|show|curso|viagem|hotel|pousada|spa|massagem|vale presente|gift card|assinatura)\b/],
];

export function suggestCategory(...texts: Array<string | undefined>): Category {
  const hay = fold(texts.filter(Boolean).join(" "));
  for (const [category, re] of RULES) if (re.test(hay)) return category;
  return "Outros";
}

/** Comida e cuidados pessoais tendem a ser "sempre bem-vindo". */
export function suggestKind(category: Category): "unico" | "sempre" {
  return category === "Comida & doces" || category === "Cuidados pessoais" ? "sempre" : "unico";
}
