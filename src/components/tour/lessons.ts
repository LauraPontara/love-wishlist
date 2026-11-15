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
  /** frase de comemoração quando a pessoa faz o gesto (no último passo, o tutorial fecha sozinho depois dela) */
  doneText?: string;
  /** se o alvo não estiver na tela, o passo é pulado */
  optional?: boolean;
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
    id: "mine-filters", title: "Abas, busca e filtros", screen: "mine",
    touch: [
      { target: '[data-tour="tabs"]', text: "Desejos é o que você quer ganhar, Já tenho é o que você comprou e Recebidos é o que ganhou." },
      { target: '[data-tour="filters"]', text: "Busque pelo nome, loja ou cor. Em “Até R$” você vê só o que cabe no bolso, e ao lado escolhe a ordem." },
      { target: '[data-tour="chips"]', text: "Filtre por tipo ou categoria. “Sempre bem-vindos” são coisas que podem ser dadas mais de uma vez; “Únicos”, só uma." },
    ],
    mouse: [
      { target: '[data-tour="tabs"]', text: "Desejos é o que você quer ganhar, Já tenho é o que você comprou e Recebidos é o que ganhou." },
      { target: '[data-tour="filters"]', text: "Busque pelo nome, loja ou cor. Em “Até R$” você vê só o que cabe no bolso, e ao lado escolhe a ordem." },
      { target: '[data-tour="chips"]', text: "Filtre por tipo ou categoria. “Sempre bem-vindos” são coisas que podem ser dadas mais de uma vez; “Únicos”, só uma." },
    ],
  },
  {
    id: "mine-swipe", title: "Editar ou excluir itens", screen: "mine",
    touch: [
      { target: CARD, gesture: "swipe", demo: "swipe", text: "Deslize o item para a esquerda…", doText: "Agora você: deslize um item!", wait: "swipe-open" },
      { target: OPEN_ACTIONS(CARD), open: CARD, text: "Editar muda o item. Excluir tira da lista, e dá pra desfazer logo depois." },
      { target: CARD, gesture: "tap", text: "Um toque no item abre o site da loja." },
      { target: OWNED, text: "Comprou por conta própria? Toque em “Já tenho”." },
    ],
    mouse: [
      { target: CARD, gesture: "tap", text: "Um clique no item abre os detalhes. Lá dentro dá pra editar ou excluir." },
      { target: `${CARD} .tag-photo-link`, gesture: "tap", text: "Um clique na foto abre o site da loja." },
      { target: OWNED, text: "Comprou por conta própria? Clique em “Já tenho”." },
    ],
  },
  {
    id: "mine-group", title: "Agrupar itens parecidos", screen: "mine",
    touch: [
      { target: CARD, gesture: "hold", text: "Segure o dedo num item para começar a selecionar.", doText: "Agora você: segure um item!", wait: "grouping-on" },
      { target: ".tag-select:not(:disabled):not(.is-on)", gesture: "tap", text: "Toque nas outras opções parecidas.", wait: "two-selected" },
      { target: '[data-tour="group-btn"]', gesture: "tap", text: "Toque em Agrupar e dê um nome ao grupo.", wait: "naming" },
      { target: '[data-tour="group-dialog"]', text: "Agora é só dar um nome e criar o grupo.", wait: "group-created", doneText: "Grupo criado! Você já sabe agrupar 🎉" },
    ],
    mouse: [
      { target: '[data-tour="select-btn"]', gesture: "tap", text: "Clique em Selecionar itens.", wait: "grouping-on" },
      { target: ".tag-select:not(:disabled):not(.is-on)", gesture: "tap", text: "Escolha as opções parecidas (duas ou mais).", wait: "two-selected" },
      { target: '[data-tour="group-btn"]', gesture: "tap", text: "Clique em Agrupar e dê um nome ao grupo.", wait: "naming" },
      { target: '[data-tour="group-dialog"]', text: "Agora é só dar um nome e criar o grupo.", wait: "group-created", doneText: "Grupo criado! Você já sabe agrupar 🎉" },
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
      { target: COMBO, gesture: "tap", text: "Um clique no presente abre ele inteiro. Lá dentro tem Editar itens e Excluir presente." },
    ],
  },
  {
    id: "build", title: "Montar o presente", screen: "build",
    touch: [
      { target: '[data-tour="budget"]', text: "Aqui você acompanha o total do presente e quanto ainda cabe no orçamento." },
      { target: '[data-tour="add-from-list"]', gesture: "tap", text: "Toque aqui para escolher itens da lista.", waitClick: true },
      { target: '[data-tour="gift-summary"]', text: "O resumo fica aqui em cima. Toque nele para ver e mexer nos itens." },
      { target: '[data-tour="add-item"]', gesture: "tap", text: "Toque no + para pôr no presente.", wait: "item-added" },
      { target: '[data-tour="list-done"]', text: "Terminou? Toque em Pronto. Tudo já fica salvo.", waitClick: true, doneText: "Prontinho! Presente montado 🎉" },
    ],
    mouse: [
      { target: '[data-tour="budget"]', text: "Aqui você acompanha o total do presente e quanto ainda cabe no orçamento." },
      { target: '[data-tour="add-item"]', gesture: "tap", text: "Clique no + para pôr no presente.", wait: "item-added" },
      { target: '[data-tour="lines"]', text: "Os itens do presente aparecem aqui. Dá pra mudar a quantidade ou tirar." },
      { target: '[data-tour="finish"]', text: "Terminou? Clique em Concluir presente. Tudo já fica salvo." },
    ],
  },
  {
    id: "dates", title: "Como usar as datas", screen: "dates",
    touch: [
      { target: '[data-tour="next-date"]', text: "Aqui fica a próxima data: quantos dias faltam e como está o presente. Vocês recebem um lembrete 7 dias antes." },
      { target: '[data-tour="edit-date"]', gesture: "tap", text: "Toque no lápis para mudar o nome, o dia ou de quem é a data." },
      { target: '[data-tour="add-date"]', gesture: "tap", text: "Aqui você cria uma data nova, como um aniversário ou uma viagem." },
    ],
    mouse: [
      { target: '[data-tour="next-date"]', text: "Aqui fica a próxima data: quantos dias faltam e como está o presente. Vocês recebem um lembrete 7 dias antes." },
      { target: '[data-tour="edit-date"]', gesture: "tap", text: "Clique no lápis para mudar o nome, o dia ou de quem é a data." },
      { target: '[data-tour="add-date"]', gesture: "tap", text: "No + você cria uma data nova, como um aniversário ou uma viagem." },
    ],
  },
  {
    id: "partner", title: "Como usar esta lista", screen: "partner",
    touch: [
      { target: '[data-tour="give"]', gesture: "tap", text: "“Dar este” cria um presente com o item e abre para você montar. Só você vê." },
      { target: '[data-tour="partner-card"]', gesture: "tap", text: "Um toque no item abre o site da loja." },
      { target: '[data-tour="group-card"]', optional: true, text: "“Quero um desses”: são opções parecidas, basta dar uma. A estrela marca a preferida." },
      { target: '[data-tour="filters"]', text: "Busque pelo nome, loja ou cor. Em “Até R$” você vê só o que cabe no bolso, e ao lado escolhe a ordem." },
      { target: '[data-tour="chips"]', text: "Filtre por tipo ou categoria. “Sempre bem-vindos” são coisas que podem ser dadas mais de uma vez; “Únicos”, só uma." },
    ],
    mouse: [
      { target: '[data-tour="give"]', gesture: "tap", text: "“Dar este” cria um presente com o item e abre para você montar. Só você vê." },
      { target: '[data-tour="partner-card"]', gesture: "tap", text: "Um clique no item abre o site da loja." },
      { target: '[data-tour="group-card"]', optional: true, text: "“Quero um desses”: são opções parecidas, basta dar uma. A estrela marca a preferida." },
      { target: '[data-tour="filters"]', text: "Busque pelo nome, loja ou cor. Em “Até R$” você vê só o que cabe no bolso, e ao lado escolhe a ordem." },
      { target: '[data-tour="chips"]', text: "Filtre por tipo ou categoria. “Sempre bem-vindos” são coisas que podem ser dadas mais de uma vez; “Únicos”, só uma." },
    ],
  },
  {
    id: "settings", title: "O que dá para ajustar", screen: "settings",
    touch: [
      { target: '[data-tour="appearance"]', text: "Escolha o tema claro, escuro ou automático, e ligue ou desligue os coelhinhos passeando." },
      { target: '[data-tour="notify"]', text: "Ative os avisos neste aparelho e escolha o que quer receber: itens novos e lembrete das datas." },
      { target: '[data-tour="account"]', text: "Aqui você sai da conta neste aparelho." },
    ],
    mouse: [
      { target: '[data-tour="appearance"]', text: "Escolha o tema claro, escuro ou automático, e ligue ou desligue os coelhinhos passeando." },
      { target: '[data-tour="notify"]', text: "Ative os avisos neste aparelho e escolha o que quer receber: itens novos e lembrete das datas." },
      { target: '[data-tour="account"]', text: "Aqui você sai da conta neste aparelho." },
    ],
  },
];

export const lessonsFor = (screen: string) => LESSONS.filter((l) => l.screen === screen);
