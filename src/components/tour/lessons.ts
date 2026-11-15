/**
 * Roteiros do tutorial. Cada tela registra um "screen" (TourScreen) e o botão de ajuda
 * mostra as lições dela. Cada lição tem um roteiro para toque (celular/tablet) e outro para mouse.
 */
export type Gesture = "swipe" | "tap" | "hold";

export type Step = {
  /** seletor CSS do elemento destacado (o primeiro visível); sem alvo, a frase fica no meio da tela */
  target?: string;
  /** frase escrita à mão */
  text: string;
  /** gesto que a mãozinha faz sobre o alvo */
  gesture?: Gesture;
  /** o cartão de verdade desliza junto com a mãozinha */
  demo?: "swipe";
  /** depois da demonstração, a frase vira esta e o passo espera a pessoa fazer */
  doText?: string;
  /** sinal (tourSignal) que conclui o passo sozinho */
  wait?: string;
  /** um toque/clique no alvo conclui o passo */
  waitClick?: boolean;
  /** abre o primeiro cartão deslizante dentro deste seletor (se a pessoa pulou o gesto) */
  open?: string;
};

export type Lesson = { id: string; title: string; screen: string; touch: Step[]; mouse: Step[] };

const CARD = '[data-tour="item-card"]';
const OPEN_ACTIONS = (card: string) => `${card} .swipe.is-open .swipe-actions`;
const OWNED = '[data-tour="owned"]';
const COMBO = '[data-tour="combo-card"]';

export const LESSONS: Lesson[] = [
  {
    id: "mine-swipe", title: "Editar ou excluir itens", screen: "mine",
    touch: [
      { target: CARD, gesture: "swipe", demo: "swipe", text: "Deslize o item para a esquerda…", doText: "Agora você: deslize um item!", wait: "swipe-open" },
      { target: OPEN_ACTIONS(CARD), open: CARD, text: "Editar muda o item. Excluir tira da lista, e dá pra desfazer logo depois." },
      { target: CARD, gesture: "tap", text: "Um toque no item abre o site da loja." },
      { target: OWNED, text: "Comprou por conta própria? Toque em “Já tenho”." },
    ],
    mouse: [
      { target: CARD, gesture: "tap", text: "Clique no item para ver os detalhes. Lá dentro dá pra editar ou excluir." },
      { target: `${CARD} .tag-photo-link`, gesture: "tap", text: "Clique na foto para abrir a loja." },
      { target: OWNED, text: "Comprou por conta própria? Clique em “Já tenho”." },
    ],
  },
  {
    id: "mine-group", title: "Agrupar itens parecidos", screen: "mine",
    touch: [
      { target: CARD, gesture: "hold", text: "Segure o dedo num item para começar a selecionar.", doText: "Agora você: segure um item!", wait: "grouping-on" },
      { target: ".tag-select:not(:disabled):not(.is-on)", gesture: "tap", text: "Toque nas outras opções parecidas.", wait: "two-selected" },
      { target: '[data-tour="group-btn"]', gesture: "tap", text: "Toque em Agrupar e dê um nome ao grupo.", wait: "naming" },
      { target: '[data-tour="group-dialog"]', text: "Agora é só dar um nome, como “Mouse”, e criar o grupo." },
    ],
    mouse: [
      { target: '[data-tour="select-btn"]', gesture: "tap", text: "Clique em Selecionar itens.", wait: "grouping-on" },
      { target: ".tag-select:not(:disabled):not(.is-on)", gesture: "tap", text: "Escolha as opções parecidas (duas ou mais).", wait: "two-selected" },
      { target: '[data-tour="group-btn"]', gesture: "tap", text: "Clique em Agrupar e dê um nome ao grupo.", wait: "naming" },
      { target: '[data-tour="group-dialog"]', text: "Agora é só dar um nome, como “Mouse”, e criar o grupo." },
    ],
  },
  {
    id: "combos-swipe", title: "Editar ou excluir presentes", screen: "combos",
    touch: [
      { target: COMBO, gesture: "swipe", demo: "swipe", text: "Deslize o presente para a esquerda…", doText: "Agora você: deslize um presente!", wait: "swipe-open" },
      { target: OPEN_ACTIONS(COMBO), open: COMBO, text: "Editar volta a montar o presente. Excluir apaga só o presente: os itens continuam na lista." },
      { target: COMBO, gesture: "tap", text: "Um toque abre o presente inteiro." },
    ],
    mouse: [
      { target: COMBO, gesture: "tap", text: "Clique no presente para abrir. Lá dentro tem Editar itens e Excluir presente." },
    ],
  },
  {
    id: "build", title: "Montar o presente", screen: "build",
    touch: [
      { target: '[data-tour="budget"]', text: "Aqui você acompanha o total do presente e quanto ainda cabe no orçamento." },
      { target: '[data-tour="add-from-list"]', gesture: "tap", text: "Toque aqui para escolher itens da lista.", waitClick: true },
      { target: '[data-tour="gift-summary"]', text: "O resumo fica aqui em cima. Toque nele para ver e mexer nos itens." },
      { target: '[data-tour="add-item"]', gesture: "tap", text: "Toque no + para pôr no presente.", wait: "item-added" },
      { target: '[data-tour="list-done"]', text: "Terminou? Toque em Pronto. Tudo já fica salvo." },
    ],
    mouse: [
      { target: '[data-tour="budget"]', text: "Aqui você acompanha o total do presente e quanto ainda cabe no orçamento." },
      { target: '[data-tour="add-item"]', gesture: "tap", text: "Clique no + para pôr no presente.", wait: "item-added" },
      { target: '[data-tour="lines"]', text: "Os itens do presente aparecem aqui. Dá pra mudar a quantidade ou tirar." },
      { target: '[data-tour="finish"]', text: "Terminou? Clique em Concluir presente. Tudo já fica salvo." },
    ],
  },
];

export const lessonsFor = (screen: string) => LESSONS.filter((l) => l.screen === screen);
