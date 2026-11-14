# Decisões de arquitetura (ADRs)

Formato curto: contexto → decisão → consequências.

---

## ADR-001: Vercel + Supabase, ambos no plano gratuito
**Status:** aceita

**Contexto.** Custo zero é requisito. O app é pequeno (2 usuários, centenas de itens).

**Decisão.** Next.js na Vercel Hobby. Postgres no Supabase Free.

**Consequências.** O Supabase pausa após 7 dias sem uso, o que exige keep-alive (ADR-005). A Vercel Hobby é para uso pessoal e não comercial, que é o caso aqui.

---

## ADR-002: Navegador nunca acessa o banco diretamente
**Status:** aceita

**Contexto.** A reserva secreta (RN01) não pode vazar para o dono. Com o Supabase direto do client, a regra dependeria de RLS com auth do Supabase, que não estamos usando.

**Decisão.** Todo acesso passa pelas rotas da API com `service_role` no servidor. RLS habilitado sem policies (nega tudo para chaves públicas).

**Consequências.** Sem realtime nativo do Supabase no front, o que não faz falta para o caso de uso. As regras de visibilidade ficam centralizadas em `lib/domain`.

---

## ADR-003: Login por telefone com HMAC + pepper em variável de ambiente
**Status:** aceita

**Contexto.** A usuária pediu algo simples: digitou um dos dois telefones, entra. Os números não podem estar no código.

**Decisão.** Comparar `HMAC-SHA256(pepper, telefone_E164)` com hashes guardados em env. Sessão por JWT em cookie httpOnly. Rate limit por IP.

**Consequências.** Segurança de conveniência: quem conhece o número entra. Aceitável para o risco do dado. Dá para evoluir para PIN ou OTP sem mudar o modelo de dados.

---

## ADR-004: Extração em camadas, com IA só para interpretar
**Status:** aceita

**Contexto.** Mandar a página inteira para um LLM é caro e lento. A maioria dos e-commerces já publica dados estruturados (JSON-LD/OpenGraph).

**Decisão.** 1) Parser determinístico grátis → 2) Jina Reader / Apify como fallback → 3) Gemini apenas com contexto enxuto, para categoria, variação e nome limpo.

**Consequências.** Poucas chamadas de IA e baratas. Sites com antibot podem falhar, e aí vale o cadastro manual (RF07).

---

## ADR-005: Keep-alive com Vercel Cron, GitHub Actions como reserva
**Status:** aceita

**Decisão.** Ping diário em `/api/health`, que faz um `select` no banco. Dois agendadores independentes.

**Consequências.** O banco nunca fica 7 dias parado. O custo é desprezível nos dois serviços.

---

## ADR-006: Gemini como provedor de IA
**Status:** aceita, com ressalvas

**Contexto.** A API do Claude não tem plano gratuito. A usuária tem assinatura **Google AI Pro**.

**O que foi verificado (nov/2026):**
- A assinatura do Gemini app **não dá uma API key ilimitada**. Desde jan/2026, Google AI Pro inclui **US$ 10/mês em créditos Google Cloud**, utilizáveis na Gemini API. Cada crédito vale 12 meses e só o titular do plano pode usar.
- Para usar esses créditos é preciso ativar o billing no AI Studio, e **exige um pré-pagamento mínimo de US$ 5**. Isso conflita com o custo zero.
- A Gemini API tem **free tier** para os modelos Flash e Flash-Lite, sem cartão. Os limites por minuto/dia são modestos, mas sobram para o volume de um casal.

**Decisão.** Começar no **free tier** (`GEMINI_API_KEY` de um projeto sem billing), com teto diário no código. Os créditos do AI Pro ficam como upgrade opcional, caso o free tier fique apertado.

**Consequências.** No free tier, o Google pode usar os prompts para melhorar os produtos dele. Aqui os prompts são só dados públicos de produto, então não há problema. Sem billing, não existe risco de cobrança surpresa.

---

## ADR-007: Android Share Target como canal principal de cadastro
**Status:** aceita

**Contexto.** Os dois usam Android. O hábito atual é "achei o produto → compartilhar → WhatsApp".

**Decisão.** O PWA declara `share_target`. O fluxo vira "achei o produto → compartilhar → Love Wishlist".

**Consequências.** Exige o PWA instalado na tela inicial. Colar o link continua funcionando como alternativa.
