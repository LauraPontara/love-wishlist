# Roadmap

## Fase 0: Design ✍️ *(em andamento)*
- [x] Levantamento de requisitos
- [x] Arquitetura e modelo de dados
- [x] Repositório e documentação
- [ ] Paletas *playful vibrante* (2–3 propostas) → escolha
- [ ] Design system: tokens, tipografia, componentes, princípios de motion
- [ ] Protótipo das telas: login, minha lista, lista do outro, cadastro/prévia, item, "já tenho"

## Fase 1: Fundação
- [ ] Projeto Supabase (conta pessoal) + migrations
- [ ] Next.js + Tailwind + Motion, deploy na Vercel
- [ ] Auth por telefone (HMAC, JWT, rate limit, middleware)
- [ ] `/api/health` + Vercel Cron + workflow de backup

## Fase 2: Lista
- [ ] CRUD de itens (cadastro manual)
- [ ] Minha lista / lista do outro, filtros de orçamento, categoria e tipo
- [ ] Adquirido / "já tenho"
- [ ] Reserva secreta, "dei hoje", "entreguei"

## Fase 3: Extração mágica
- [ ] Parser JSON-LD / OpenGraph / URL
- [ ] Gemini com saída estruturada + teto diário + cache
- [ ] Fallbacks Jina Reader e Apify
- [ ] Testes com links reais das lojas que vocês mais usam

## Fase 4: App no celular
- [ ] PWA instalável + Share Target
- [ ] Polimento de motion, estados vazios, onboarding

## Depois (ideias)
- Alerta de queda de preço (cron semanal reextraindo preços)
- Datas especiais (aniversário, namoro) com lembrete
- Importar links antigos do export do grupo do WhatsApp
