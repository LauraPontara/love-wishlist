# Design system: Papel de presente

> Direção aprovada em 14/11/2026. Tokens em [`tokens.css`](tokens.css); telas em [`telas.html`](telas.html); direção visual em [`direcao-visual.html`](direcao-visual.html).

## 1. Ideia

O app é **um presente embrulhado**. Tudo vem desse universo, sem enfeite gratuito:

| Elemento | Metáfora | Onde |
|---|---|---|
| Cabeçalho | **Papel de embrulho** estampado (corações e laços, 14% de opacidade) cortado por uma **fita** amarela | Topo de todas as telas |
| Item da lista | **Etiqueta de presente**: ponta cortada, furinho, preço como numa tag | Listas, combos, busca |
| Orçamento | **Fita listrada** que enche até o laço | Montar presente, combos |
| Combo | **Caixa** com fita cruzada no canto | Meus combos |
| Afeto | **Coração que pulsa** (tum-tum… pausa) | Login, próxima data, botão de presente |
| Personagens | Coelho **chocolate** (Laura) e **caramelo** (Vítor) | Avatares e coelhinhos no site |

**Regra de ouro:** um elemento marcante por tela. O resto fica quieto.

## 2. Cor

Dois temas da mesma paleta (RF49): **Automático** (padrão), **Claro** e **Escuro**.

| Papel | Claro | Escuro | Uso |
|---|---|---|---|
| `--bg` | `#FFF0F6` rosa papel | `#14123A` noite | Fundo |
| `--surface` | `#FFFFFF` | `#221F55` | Campos, etiquetas, painéis |
| `--ink` / `--ink-2` | `#1C1A4A` / `#5C5A86` | `#FFF0F6` / `#B9B4E6` | Texto / texto secundário |
| `--primary` | `#D61F69` magenta | `#FF6AA3` magenta aceso | Ação principal (1 por tela) |
| `--secondary` | `#3053E3` cobalto | `#8EA2FF` | Seleção (chips, abas) |
| `--ribbon` | `#FFC22E` fita | `#FFC22E` | Adicionar, destaque de data, fita |
| `--wrap` | `#D61F69` | `#8E1450` vinho | Papel de embrulho |

**Contraste verificado** (mínimo AA 4,5:1):

| Combinação | Claro | Escuro |
|---|---|---|
| Texto / fundo | 14,7 | 16,2 |
| Texto secundário / fundo | 5,8 | 9,1 |
| Botão principal | 4,9 (branco / magenta) | 6,7 (noite / rosa) |
| Chip selecionado | 6,0 (branco / cobalto) | 7,4 (noite / cobalto claro) |
| Fita | 10,0 | 11,0 |

**Avisos da extração** (RF09) têm cor própria: `--warn-*` para **bloqueado/parcial** (amarelo) e `--error-*` para **link quebrado** (rosa-erro).

## 3. Tipografia

Uma família só, **Bricolage Grotesque**, explorando os eixos de largura e tamanho óptico:

| Estilo | Tamanho | Peso | Eixos | Uso |
|---|---|---|---|---|
| Login | 42px | 800 | `wdth 78, opsz 96` | "Oi, coelho." |
| Título de tela | 32px | 800 | `wdth 78` | "Lista do Vítor" |
| Seção | 20px | 800 | `wdth 85` | "Comprado", "Próximas datas" |
| Corpo | 16px | 400/600 | padrão | Texto, campos |
| Metadado | 14px | 400 | padrão | Loja, datas |
| Badge | 12px | 700 | padrão | "Sempre bem-vindo" |
| Preço | 17px | 800 | `wdth 80` | Sempre alinhado à direita |

- Sentence case sempre. Sem caixa-alta em rótulos.
- Preço sempre como `R$ 189,90` (com espaço e vírgula).
- Títulos com `letter-spacing: -0.02em`. Corpo sem ajuste.

## 4. Espaço, raios e camadas

- **Grade de 4px.** Margem lateral das telas: 16px.
- **Raios com papel**: chip 999px · campo 16px · botão 18px · painel 28px · etiqueta 0/16px (ponta cortada).
- **Camadas**: papel de embrulho → painel arredondado que "sobe" 30px sobre ele → conteúdo. Sombra só em botões (borda inferior sólida, efeito de tecla) e no frame da tela.

## 5. Componentes

| Componente | Anatomia | Estados |
|---|---|---|
| **Cabeçalho embrulho** | Papel estampado + fita vertical + avatar + título + subtítulo | Claro/escuro |
| **Etiqueta (item)** | Furinho · miniatura 58px · nome · loja ou badge · preço | Padrão, sempre bem-vindo (creme), comprado (azulado, 60%), recebido |
| **Fita de orçamento** | Valor somado / limite · fita listrada · laço no fim | Cabe (magenta), passou (listras cobalto + "passou R$ X") |
| **Botão principal** | Magenta, borda inferior escura (tecla) | Pressionado: desce 3px e a borda some |
| **Botão fita** | Amarelo, texto noite | Para "Adicionar" |
| **Chip** | Pílula, borda `--line` | Selecionado: cobalto |
| **Abas** | Segmentado em pílula | Ativa: superfície + sombra curta |
| **Campo** | Superfície, borda 2px `--line` | Foco: contorno amarelo-fita 3px |
| **Cartão de revisão** | Etiqueta grande editável + aviso no topo | ok, parcial, bloqueado, link quebrado |
| **Caixa de combo** | Painel com fita cruzada no canto + etapas | Montado, Comprado, Dado |
| **Etapas** | Montado → Comprado → Dado, em pílulas ligadas | Atual em magenta |
| **Barra de navegação** | 4 destinos: Minha lista · Vítor · Combos · Datas | Ativo: ícone preenchido + rótulo |

## 6. Movimento

| Momento | Movimento | Duração |
|---|---|---|
| **Batimento** | Escala 1 → 1,12 → 1 → 1,07 → 1, depois pausa | Ciclo de 1,4s |
| Toque em botão | Desce 3px, borda some | 120ms |
| Item salvo | Etiqueta entra balançando, como pendurada no cordão | 420ms, spring |
| Fita de orçamento | Enche com leve elástico ao adicionar item | 420ms, spring |
| Troca de aba | Indicador desliza | 220ms |
| Combo dado | Coração cresce e explode em corações pequenos + coelhinhos fazem festa (RF46) | 1,2s, uma vez |

Regras:
1. **Só um batimento por tela**, no elemento mais afetivo: login (aura), lista do outro (botão de presente), calendário (próxima data).
2. Movimento contínuo só no batimento. Todo o resto responde a uma ação.
3. `prefers-reduced-motion`: sem batimento, sem balanço. Transições viram fade de 120ms.

## 7. Texto da interface

- Verbos claros e no infinitivo nos botões: "Adicionar", "Montar presente", "Salvar 4 itens", "Marcar como dado".
- O nome da ação se mantém no fluxo: botão "Marcar como dado" → aviso "Combo marcado como dado".
- Erros explicam o que houve e o que fazer: "Não conseguimos acessar esse link. Verifique se ele está correto ou traga o link de outra loja."
- Telas vazias convidam a agir: "Sua lista está vazia. Cole o link de algo que você quer ganhar."
