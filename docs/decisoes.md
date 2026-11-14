# Decisões de arquitetura (ADRs)

Formato curto: contexto → decisão → consequências. Decisões substituídas continuam aqui, marcadas, para registrar o porquê da mudança.

---

## ADR-001: Vercel + Supabase, ambos no plano gratuito, em São Paulo
**Status:** aceita

**Contexto.** Custo zero é requisito. O app é pequeno (2 usuários, centenas de itens).

**Decisão.**
- Next.js na Vercel Hobby, com funções em `gru1`.
- Postgres no Supabase Free em `sa-east-1`.

**Consequências.**
- O Supabase pausa após 7 dias sem uso, por isso existe o keep-alive (ADR-005).
- O primeiro projeto foi criado por engano em East US. Como o banco estava vazio, ele foi apagado e recriado em São Paulo.

---

## ADR-002: O navegador nunca acessa o banco diretamente
**Status:** aceita

**Contexto.** Combos e reservas são secretos (RN01, RN02). Com o Supabase acessado direto do navegador, essa garantia dependeria do Supabase Auth com policies de RLS, e o projeto não usa o Supabase Auth.

**Decisão.**
- Todo acesso passa pela API com `service_role`.
- RLS ligado sem policies.
- Nenhum grant para `anon` e `authenticated`.
- Opção "Automatically expose new tables" desligada no projeto.

**Consequências.**
- Sem realtime do Supabase no front, o que não faz falta.
- As regras de visibilidade ficam em `lib/domain`.

---

## ADR-003: Login por telefone com HMAC + pepper em variável de ambiente
**Status:** aceita

**Decisão.**
- O servidor compara `HMAC-SHA256(pepper, telefone_E164)` com hashes guardados em variável de ambiente.
- A sessão é um JWT em cookie httpOnly.
- O login tem rate limit por IP.

**Consequências.** É uma segurança de conveniência: quem conhece o número entra. É aceitável para o risco do dado.

---

## ADR-004: Extração em camadas, com IA
**Status:** ❌ substituída pela ADR-008

---

## ADR-005: Keep-alive com Vercel Cron, GitHub Actions como reserva
**Status:** aceita

**Decisão.** Um cron diário em `/api/cron/daily` também faz o keep-alive, os lembretes e a limpeza. Um workflow do GitHub Actions faz um ping de reserva.

---

## ADR-006: Gemini como provedor de IA
**Status:** ❌ substituída pela ADR-008

**Registro da pesquisa (nov/2026):**
- A assinatura Google AI Pro dá US$ 10/mês em créditos Cloud utilizáveis na Gemini API.
- Usar esses créditos exige ativar o billing com pré-pagamento mínimo de US$ 5.
- A API também tem um free tier para os modelos Flash e Flash-Lite.

---

## ADR-007: Android Share Target como canal principal de cadastro
**Status:** aceita

**Decisão.** O PWA declara `share_target`, e o fluxo vira "achei o produto → compartilhar → app". Colar um ou vários links continua funcionando.

---

## ADR-008: Extração sem IA, com tela de revisão obrigatória
**Status:** aceita (substitui a ADR-004 e a ADR-006)

**Contexto.**
- A usuária vai revisar cada item antes de salvar, então a IA só serviria para adivinhar a categoria e a variação.
- Os testes com lojas reais mostraram que o gargalo é o **bloqueio antirrobô**, não a interpretação: Kabum funciona, Amazon precisa de um leitor próprio, e Beleza na Web e Adidas bloqueiam até os serviços grátis.

**Decisão.**
- Ordem de tentativa: fetch próprio + dados estruturados → leitores por loja → Microlink/Jina (nome e foto).
- A categoria é sugerida por palavras-chave.
- A tela de revisão em lote é sempre exibida.
- Links com problema são classificados em `link_quebrado` × `bloqueado` × `parcial`, cada um com aviso próprio.

**Consequências.**
- Zero custo e zero chave de API de IA.
- Em lojas protegidas, o preço é preenchido à mão.
- Os leitores por loja são criados com base em testes com links reais.

---

## ADR-009: Presentes sempre passam por combos; reserva é derivada
**Status:** aceita

**Contexto.** Os requisitos pedem reserva secreta, presente de vários itens, itens extras, quantidade, "paguei" e histórico "ganhou 3x".

**Decisão.**
- Não existe tabela de reservas nem de presentes avulsos.
- Todo presente é um combo (um item só = combo de 1, botão "Dar este").
- "Reservado" significa estar num combo `comprado`.
- O histórico vem dos combos `dado`.
- As transições de etapa são funções SQL atômicas.
- As invariantes ficam em triggers.

**Consequências.**
- Uma fonte de verdade só, sem estados divergentes.
- `combo_items` guarda um snapshot do nome e do preço, para o combo sobreviver à exclusão do item.

---

## ADR-010: Busca e filtros no navegador
**Status:** aceita

**Contexto.** As listas são pequenas e a busca precisa responder enquanto se digita.

**Decisão.** A API devolve a lista completa, e a filtragem acontece no cliente, com normalização de acentos.

**Consequências.** Sem índices de texto no banco. Se algum dia a lista passar de milhares de itens, migrar para `pg_trgm` + `unaccent`.

---

## ADR-011: Avisos via Web Push com VAPID
**Status:** aceita

**Decisão.**
- A biblioteca `web-push` envia os avisos pelo servidor.
- As assinaturas ficam em `push_subscriptions`.
- Os lembretes saem do cron diário, com deduplicação em `notification_log`.

**Consequências.** Grátis e sem serviço terceiro. No Android, funciona com o PWA instalado.
