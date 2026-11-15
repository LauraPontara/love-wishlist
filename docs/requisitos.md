# Requisitos

> Status: **fechado em 14/11/2026** depois de quatro rodadas de levantamento. Qualquer mudança entra como nova versão deste documento.

## 1. Contexto e dores

Hoje o casal manda links de produtos num grupo do WhatsApp. O link já carrega a variação escolhida no site (cor, tamanho, modelo), e isso evita comprar errado. Os problemas:

| # | Dor | Consequência |
|---|---|---|
| D1 | O preview do WhatsApp nem sempre mostra preço nem variação | É preciso abrir link por link |
| D2 | Não dá para filtrar por orçamento | Com R$ 100 na mão, abre todos os links para ver o que cabe |
| D3 | "Já tenho" é marcado com emoji | Some no histórico da conversa |
| D4 | Não existe "eu já comprei esse" | O dono pode comprar o item antes, ou a surpresa estraga |
| D5 | Itens recorrentes (sabonete, chocolate) se misturam com itens únicos | Não fica claro o que pode ser dado de novo |
| D6 | Links se perdem entre outras mensagens | A lista nunca está completa num lugar só |
| D7 | Montar um presente com vários itens é feito de cabeça | Difícil somar preços e lembrar o que já foi dado |

## 2. Usuários

Dois usuários fixos, o casal. Os dois usam **Android**. Cada um é:

- **dono** da própria lista;
- **presenteador** na lista do outro.

## 3. Glossário

| Termo | Significado |
|---|---|
| **Item** | Algo que o dono quer ganhar. Sempre tem um link. |
| **Item único** | Uma vez adquirido, não faz sentido ganhar de novo (roupa, fone, acessório). |
| **Item sempre bem-vindo** | Pode ser dado várias vezes (sabonete, shampoo, chocolate, bala). Nunca sai da lista. |
| **Já tenho** | O dono adquiriu o item único por conta própria. |
| **Recebido** | O dono ganhou o item único num combo marcado como Dado. |
| **Combo** | O presente montado pelo presenteador: um ou mais itens da lista do outro, mais itens extras. |
| **Item extra** | Algo no combo que não está na wishlist (flores, cartão). Só existe no combo. |
| **Ocasião** | Data do calendário do casal que se repete todo ano (aniversários, namoro, Natal, Dia dos Namorados). |
| **Variação** | Atributos escolhidos no site: `Cor: Laranja`, `Tamanho: M`. |

## 4. Requisitos funcionais

### 4.1 Acesso
- **RF01**: Entrar digitando o próprio telefone. Só os dois números autorizados passam. Os demais recebem uma mensagem genérica.
- **RF02**: O telefone identifica o perfil automaticamente (não existe "escolha quem é você").
- **RF03**: A sessão fica salva no celular (90 dias). Existe a opção de sair.

### 4.2 Cadastro de itens
- **RF04**: Cadastrar colando **um ou vários links** de uma vez (um por linha, ou separados por espaço).
- **RF05**: Receber links pelo **compartilhar nativo do Android**, inclusive textos do WhatsApp com a URL no meio.
- **RF06**: Para cada link, o sistema extrai automaticamente (sem IA): nome, foto, preço, loja e variação. A categoria é **sugerida** por palavras-chave.
- **RF07**: Depois da extração, abre a **tela de revisão em lista de cartões editáveis**, um cartão por link, com o botão **"Salvar todos"**. Cada cartão pode ser editado ou descartado.
- **RF08**: No cartão, o dono escolhe o **tipo** (único / sempre bem-vindo). Os demais campos vêm preenchidos e são editáveis.
- **RF09**: **Link com problema nunca trava o cadastro.** O cartão aparece com os campos que faltaram em branco e um aviso diferente para cada causa:

  | Causa | Exemplos | Aviso |
  |---|---|---|
  | Link quebrado | URL mal formada, domínio inexistente, página não encontrada (404) | "Não conseguimos acessar esse link. Verifique se ele está correto ou traga o link de outra loja." |
  | Site bloqueia leitura automática | 403, captcha, página de bloqueio | "Esse site não deixa a gente ler os dados automaticamente. O link está salvo, é só preencher nome e preço." |
  | Leitura parcial | Achou nome e foto, mas não o preço | Os campos encontrados vêm preenchidos e os que faltam ficam destacados |

- **RF10**: O mesmo link **pode** ser cadastrado mais de uma vez (há lojas em que o link não indica a opção escolhida, como paletas de sombra). Na revisão, o botão **Duplicar** cria outra opção do mesmo link para trocar só a foto e a descrição.
- **RF11**: Campos do item:

  | Campo | Obrigatório |
  |---|---|
  | link | sim |
  | nome | sim |
  | tipo | sim |
  | categoria | sim |
  | foto | não |
  | preço (com a data da coleta) | não |
  | loja | não |
  | variação | não |
  | observação | não |

  **Não existe prioridade.** Cada item tem **um link só**. O link é só uma referência: quem vai presentear pode comprar em outra loja.

### 4.3 Gestão da própria lista
- **RF12**: Editar qualquer campo, **inclusive o link**. O link nunca pode ficar em branco. Ao trocar o link aparece **"Buscar dados de novo"**, que reextrai os dados e mostra para revisar antes de salvar.
- **RF13**: Excluir item, com confirmação e opção de **desfazer** por alguns segundos.
- **RF14**: Marcar item único como **Já tenho**. Ele sai da lista e vai para a aba "Já tenho". É possível desfazer.
- **RF15**: Se o item que o dono vai marcar como "Já tenho" estiver num combo **Comprado** do outro, aparece um **aviso vago**: "Tem certeza? Talvez seja melhor esperar um pouco 👀". O aviso não revela nada além disso. O dono pode confirmar mesmo assim.
- **RF16**: Aba **Recebidos**: itens únicos que chegaram por combo Dado, com "presente de {nome} em DD/MM".
- **RF17**: Item **sempre bem-vindo** mostra "Ganhou 3x · última em 14/nov", contando só os combos já Dados.
- **RF18**: Botão "Atualizar preço" em cada item.

### 4.4 Lista do outro
- **RF19**: Ver a lista do outro (só itens disponíveis: únicos ainda desejados e todos os sempre bem-vindos).
- **RF20**: Abrir o link original.
- **RF21**: Itens que estão num combo Comprado do próprio presenteador aparecem marcados como "já comprei".

### 4.5 Busca e filtros (em todas as listas e no Montar presente)
- **RF22**: **Busca por texto** no nome, na loja, na variação e na observação. Ignora acentos e maiúsculas e mostra resultados enquanto você digita.
- **RF23**: Filtros por **faixa de preço/orçamento**, **categoria** e **tipo**, que combinam com a busca.
- **RF24**: Ordenação por preço (crescente ou decrescente), por data de cadastro e por nome.

### 4.6 Montar presente (combos)
- **RF25**: Na tela **Montar presente**, o presenteador informa o **orçamento** e vê os itens do outro com busca e filtros (RF22–RF24). A barra de orçamento mostra quanto falta ou quanto passou.
- **RF26**: Ao abrir a tela, os preços dos itens são **atualizados em segundo plano**. A tela abre na hora com o último preço conhecido e anima os valores que mudarem.
- **RF27**: O combo tem **nome**, **ocasião** (escolhida no calendário do casal ou "sem ocasião") e **data**.
- **RF28**: Itens **sempre bem-vindos** aceitam **quantidade** (ex.: 3x sabonete). Itens únicos têm quantidade 1.
- **RF29**: **Itens extras**: nome, preço e link opcional. Somam no orçamento e não aparecem na lista do outro.
- **RF30**: Etapas do combo:

  ```
  Montado ──▶ Comprado ──▶ Dado
     ▲           │
     └───────────┘ (voltar)
  ```

  - **Montado**: rascunho. Não reserva nada.
  - **Comprado**: os itens únicos do combo ficam **reservados em segredo**. Não podem entrar em outro combo Comprado e disparam o aviso vago do RF15 para o dono. Cada item ganha o campo opcional **"paguei R$ …"**, que substitui o preço na soma.
  - **Dado**: definitivo, com confirmação. Os itens únicos vão para **Recebidos** do outro, e os sempre bem-vindos atualizam o contador.
  - É possível ir direto de Montado para Dado (comprou e deu no mesmo dia).
- **RF31**: **Dar este**: botão em cada item da lista do outro que cria na hora um combo de 1 item. Não existe outro fluxo de presente fora dos combos.
- **RF32**: **Meus combos**: lista dos combos de quem montou, agrupados por etapa e ordenados pela data da ocasião, com contagem regressiva ("faltam 12 dias").
- **RF33**: Se o dono marcar como "Já tenho" um item de um combo Comprado, quem montou o combo vê o alerta: "{nome} já comprou esse item. Que tal trocar?".
- **RF34**: Se o dono excluir um item que está num combo, o combo mantém o nome e o preço daquele item, com o selo "removido da lista".

### 4.7 Calendário do casal
- **RF35**: Cadastro de datas que se repetem todo ano: aniversário de cada um, aniversário de namoro, Natal, Dia dos Namorados e outras. Cada data pode ser "de" uma pessoa (aniversário) ou do casal.
- **RF36**: Natal (25/12) e Dia dos Namorados (12/06) já vêm cadastrados.

### 4.8 Avisos no celular (Web Push, gratuito)
- **RF37**: **Item novo na lista do outro**: um aviso por cadastro. Um lote de 5 links gera um aviso só: "{nome} adicionou 5 itens".
- **RF38**: **Lembrete de ocasião**: 7 dias antes de cada data. Se o usuário tiver um combo para a ocasião ainda Montado, o aviso diz isso. Se não tiver combo, sugere montar um.
- **RF39**: Cada um ativa ou desativa os avisos nas configurações.

### 4.9 Coelhinhos no site
Dois coelhos em **pixel art** passeiam pelo site o tempo todo: o **chocolate** (Laura) e o **caramelo** (Vítor), com as mesmas pelagens dos avatares.

- **RF40**: Os dois aparecem sempre juntos, para os dois usuários.
- **RF41**: **Passeiam sozinhos**: andam, pulam e param pela tela. No computador, de vez em quando vão até perto do cursor, mas não o seguem.
- **RF42**: **Pulam e sentam** em cima de campos de texto, botões e cartões de item, **na borda de cima**, sem cobrir o conteúdo.
- **RF43**: **Idle fofo**: coçar a orelha, mexer o nariz, se lavar e cochilar quando ninguém mexe no site por um tempo.
- **RF44**: **Interagem entre si**: se encontram, encostam o focinho, pulam juntos e às vezes um persegue o outro.
- **RF45**: **Carinho**: clicar ou tocar num coelho deixa ele feliz e solta um coraçãozinho.
- **RF46**: **Reagem ao app**:
  - pulinhos de alegria quando itens novos são salvos;
  - festa dos dois, com corações, quando um combo é marcado como Dado. Só quem marcou vê, e a surpresa continua só dele;
  - curiosidade: correm até o campo onde a pessoa está digitando e ficam olhando.
- **RF47**: **No celular**, ficam mais calmos: sentados ou dando pulinhos perto da borda de baixo, reagindo ao toque, sem passear por cima do conteúdo.
- **RF48**: **Ajustes** tem um liga/desliga dos coelhos, salvo por pessoa.

### 4.10 Tema
- **RF49**: O site tem **tema claro e tema escuro**, os dois derivados da paleta Papel de presente. Em Ajustes: **Automático** (segue o celular, padrão), **Claro** ou **Escuro**, salvo por pessoa.

## 5. Regras de negócio

- **RN01**: O dono **nunca vê** combos do outro nem reservas. A única pista é o aviso vago do RF15. A regra é aplicada no servidor.
- **RN02**: Os combos são visíveis **só para quem montou**.
- **RN03**: Itens sempre bem-vindos nunca saem da lista (nunca são "Já tenho" nem "Recebido").
- **RN04**: Um item único só pode estar em **um** combo Comprado por vez.
- **RN05**: Só o dono edita ou exclui os próprios itens. O link pode mudar, mas nunca fica vazio.
- **RN06**: O preço guarda a data da coleta. A soma do combo usa, por item: "paguei", senão preço × quantidade. Item sem preço conta como R$ 0 e fica sinalizado.
- **RN07**: Os itens de um combo só podem ser adicionados ou removidos enquanto ele está Montado. Um combo Dado não muda mais.
- **RN08**: Itens de um combo precisam ser da lista do destinatário do combo.

## 6. Requisitos não funcionais

| # | Requisito |
|---|---|
| RNF01 | **Custo zero**: só planos gratuitos. Sem IA. |
| RNF02 | **Disponibilidade**: o banco não pode pausar por inatividade (keep-alive diário). |
| RNF03 | **Privacidade**: os telefones nunca vão para o repositório nem para o banco em texto puro. O banco só é acessado pelo servidor. |
| RNF04 | **Mobile first**, instalável como PWA no Android. |
| RNF05 | **Rápido**: a lista abre em < 1,5 s no 4G. A busca responde enquanto você digita. Um lote de 5 links é extraído em < 20 s, com feedback animado por cartão. |
| RNF06 | **Acessível**: contraste AA, alvos de toque ≥ 44 px, respeita `prefers-reduced-motion`. |
| RNF07 | **Design**: estética *playful vibrante*, autoral e sem cara de template genérico. |
| RNF08 | **Região**: banco e funções em São Paulo. |
| RNF09 | **Coelhos nunca atrapalham**: não bloqueiam cliques nem toques nos elementos onde estão (só o corpo do coelho é clicável), não cobrem texto e pausam quando a aba está em segundo plano. Com `prefers-reduced-motion`, ficam sentados e só piscam. |
| RNF10 | **Coelhos leves**: um canvas só, sprite sheet pequeno (< 30 KB) e ~60 fps sem pesar a bateria do celular. |

## 7. Fora do escopo

- IA para extração ou categorização.
- Prioridade nos itens.
- Mais de um link por item.
- "Minhas medidas" (tamanhos, alergias) no perfil.
- Checagem periódica automática de links quebrados.
- Alerta de queda de preço.
- Mais de dois usuários.
