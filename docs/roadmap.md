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

## Fase 1: Fundação 🔨 *(em andamento)*
- [x] Next.js 16 + Tailwind 4 com os tokens, a fonte e a Aurora
- [x] Auth por telefone (HMAC + pepper, JWT em cookie, rate limit, proxy) com 16 testes
- [x] Tela de login (coração pulsante) e página inicial protegida
- [x] `/api/health` e `/api/cron/daily` (keep-alive + limpeza), `vercel.json` em `gru1`
- [x] Telefones cadastrados (`npm run phone:hash`, na máquina da Laura; só os hashes)
- [x] Deploy na Vercel: https://nossa-wishlist.vercel.app (gru1)
- [x] Workflow de reserva do keep-alive (GitHub Actions)
- [ ] Ligar o GitHub à Vercel (deploy automático a cada push)

## Fase 2: Listas
- [ ] Cadastro manual, edição (com link editável) e exclusão com desfazer
- [ ] Minha lista, Já tenho, Recebidos, lista do outro
- [ ] Busca por texto + filtros + ordenação

## Fase 3: Extração
- [ ] Colar vários links → extração em paralelo → revisão em cartões → Salvar todos
- [ ] Classificação de erro (link quebrado × bloqueado × parcial)
- [ ] Leitor genérico (JSON-LD/OG, UA desktop → celular) + leitores Amazon e Mercado Livre + fallback Jina
- [ ] Validar o pipeline rodando de dentro da Vercel (IP de datacenter)
- [ ] Investigar token de aplicação da API do Mercado Livre para trazer o preço
- [ ] Atualizar preço

## Fase 4: Presentes
- [ ] Montar presente: orçamento, extras, quantidade, preços atualizados
- [ ] Meus combos e etapas Montado → Comprado → Dado
- [ ] "Dar este", aviso vago, alerta "já comprou", contador de sempre bem-vindo
- [ ] Calendário do casal

## Fase 5: App no celular
- [ ] PWA instalável + Share Target
- [ ] Web Push: item novo + lembrete de ocasião
- [ ] Polimento de motion, estados vazios, onboarding

## Depois (ideias)
- Checagem semanal de links quebrados
- Alerta de queda de preço
- Importar links antigos do export do grupo do WhatsApp
