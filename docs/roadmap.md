# Roadmap

## Fase 0: Descoberta e design ✅
- [x] Levantamento de requisitos (fechado em 14/11/2026)
- [x] Arquitetura, modelo de dados e ADRs
- [x] Repositório, projeto Supabase em São Paulo e schema
- [x] **Teste de extração** com produtos públicos de 13 lojas ([resultado](pesquisa-extracao.md))
- [x] Shopee testada com link real (nome + foto)
- [ ] Repetir o teste com mais links reais do casal
- [x] Paletas *playful vibrante*: 3 propostas em [`design/paletas.html`](design/paletas.html)
- [x] Paleta escolhida: **Papel de presente** (magenta, cobalto, amarelo-fita, azul-noite)
- [x] Direção visual aprovada ([`design/direcao-visual.html`](design/direcao-visual.html)): etiquetas de presente, cabeçalho Aurora (escolhido em [`design/fundos.html`](design/fundos.html)), fita de orçamento e coração pulsante, nos temas claro e escuro (RF49)
- [x] Requisitos dos coelhinhos no site (RF40–RF48)
- [x] Coelhinhos em pixel art 32px + protótipo do comportamento ([`design/coelhinhos/`](design/coelhinhos/index.html))
- [x] Coelhinhos aprovados
- [x] Design system: [`design/design-system.md`](design/design-system.md) + [`design/tokens.css`](design/tokens.css)
- [x] Protótipo das telas: [`design/telas.html`](design/telas.html) (claro e escuro)
- [x] Telas aprovadas (com cabeçalho Aurora)

## Fase 1: Fundação ✅
- [x] Next.js 16 + Tailwind 4 com os tokens, a fonte e a Aurora
- [x] Auth por telefone (HMAC + pepper, JWT em cookie, rate limit, proxy) com 16 testes
- [x] Tela de login (coração pulsante) e página inicial protegida
- [x] `/api/health` e `/api/cron/daily` (keep-alive + limpeza), `vercel.json` em `gru1`
- [x] Telefones cadastrados (`npm run phone:hash`, na máquina da Laura; só os hashes)
- [x] Deploy na Vercel: https://nossa-wishlist.vercel.app (gru1)
- [x] Workflow de reserva do keep-alive (GitHub Actions)
- [ ] Ligar o GitHub à Vercel (deploy automático a cada push)

## Fase 2: Listas ✅
- [x] Cadastro manual com prévia da etiqueta, edição (link editável, nunca vazio) e exclusão com desfazer
- [x] Minha lista (abas Desejos, Já tenho, Recebidos), "Já tenho" com desfazer, lista do outro (só disponíveis)
- [x] Busca por texto sem acento + orçamento máximo + tipo + categoria + ordenação
- [x] Responsivo: barra inferior no celular/tablet, lateral no desktop, grade de 1 a 3 colunas

## Fase 3: Extração ✅
- [x] Colar vários links (inclusive mensagem do WhatsApp) → extração em paralelo → revisão em cartões → Salvar todos
- [x] Classificação de erro (link quebrado × bloqueado × parcial × ok)
- [x] Leitor genérico (JSON-LD/OG, UA desktop → celular) + leitor Amazon + Mercado Livre + fallback Jina
- [x] Validado rodando de dentro da Vercel (ver [pesquisa](pesquisa-extracao.md#4-validação-a-partir-da-vercel-14112026-depois-do-deploy))
- [x] Atualizar preço e dados / buscar dados do novo link na edição
- [ ] Investigar token de aplicação da API do Mercado Livre para trazer o preço (da nuvem o ML bloqueia tudo)

## Fase 4: Presentes ✅
- [x] Montar presente: orçamento, extras, quantidade, preços atualizados ao abrir
- [x] Meus combos e etapas Montado → Comprado → Dado, com "paguei"
- [x] "Dar este", selo "Você já comprou", aviso vago, alerta "já comprou", Recebidos e contador de sempre bem-vindo
- [x] Calendário do casal (próxima data, adicionar, editar, excluir)

## Fase 5: App no celular ✅
- [x] PWA instalável + Share Target (`/share`) + ícone de coração
- [x] Esqueletos de carregamento, botões de ícone e ações largas no celular
- [x] Link repetido permitido (migration `20261115010000`) e botão Duplicar na revisão
- [x] Web Push: aviso de item novo e lembrete 7 dias antes das datas (cron diário)
- [x] Ajustes: tema Automático/Claro/Escuro, liga/desliga dos coelhos e dos avisos, sair
- [x] Coelhinhos passeando no app (calmos no celular; reagem a itens salvos e combo dado)
- [ ] Testar em aparelho real: compartilhar para o app e receber um aviso

## Depois (ideias)
- Checagem semanal de links quebrados
- Alerta de queda de preço
- Importar links antigos do export do grupo do WhatsApp
