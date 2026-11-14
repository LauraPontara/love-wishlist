# Roadmap

## Fase 0: Descoberta e design ✍️ *(em andamento)*
- [x] Levantamento de requisitos (fechado em 14/11/2026)
- [x] Arquitetura, modelo de dados e ADRs
- [x] Repositório, projeto Supabase em São Paulo e schema
- [x] **Teste de extração** com produtos públicos de 13 lojas ([resultado](pesquisa-extracao.md))
- [ ] Repetir o teste com links reais do casal (incluindo Shopee)
- [ ] Paletas *playful vibrante* (2–3 propostas) → escolha
- [ ] Design system: tokens, tipografia, componentes, princípios de motion
- [ ] Protótipo das telas: login, minha lista, lista do outro, adicionar + revisão em lote, montar presente, meus combos, calendário

## Fase 1: Fundação
- [ ] Next.js + Tailwind + Motion, deploy na Vercel (`gru1`)
- [ ] Auth por telefone (HMAC, JWT, rate limit, middleware)
- [ ] `/api/cron/daily` (keep-alive) + workflow de reserva

## Fase 2: Listas
- [ ] Cadastro manual, edição (com link editável) e exclusão com desfazer
- [ ] Minha lista, Já tenho, Recebidos, lista do outro
- [ ] Busca por texto + filtros + ordenação

## Fase 3: Extração
- [ ] Colar vários links → extração em paralelo → revisão em cartões → Salvar todos
- [ ] Classificação de erro (link quebrado × bloqueado × parcial)
- [ ] Leitor genérico (JSON-LD/OG) + leitores Amazon e Mercado Livre + fallback Jina
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
