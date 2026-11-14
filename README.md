<div align="center">

# 💝 Love Wishlist

**A wishlist de presentes de um casal: cola o link, o resto se preenche sozinho.**

Chega de garimpar links no grupo do WhatsApp e abrir um por um pra ver preço.
Cada um cadastra o que quer ganhar, e o outro monta o presente dentro do orçamento, em segredo.

`Next.js` · `Supabase` · `Vercel` · `PWA` · custo **R$ 0** · sem IA

</div>

---

## ✨ O que ele faz

| | |
|---|---|
| 🔗 **Cola o link, pronto** | Cola um ou vários links (ou compartilha direto do app da loja). Nome, foto, preço, loja e variação escolhida (cor, tamanho) são extraídos automaticamente e aparecem numa tela de revisão para conferir e salvar. |
| 🧯 **Link com problema não trava** | Link quebrado ou site que bloqueia leitura? O item vai para a revisão do mesmo jeito, com um aviso explicando o que houve. |
| ♾️ **Dois tipos de desejo** | **Único** (vestido, fone): sai da lista quando você ganha ou compra. **Sempre bem-vindo** (o sabonete favorito, aquele chocolate): nunca sai, e mostra "ganhou 3x". |
| 🎁 **Montar presente** | Digita o orçamento, busca, filtra e monta um combo com itens da lista do outro e extras (flores, cartão). Etapas **Montado → Comprado → Dado**. |
| 🤫 **Surpresa garantida** | Os combos só existem para quem montou. Itens comprados ficam reservados em segredo. Se o outro tentar comprar sozinho, recebe só um "talvez seja melhor esperar 👀". |
| 📅 **Calendário do casal** | Aniversários, namoro, Natal, Dia dos Namorados, com lembrete 7 dias antes. |
| 🔎 **Busca instantânea** | Por nome, loja, variação e observação, combinada com orçamento e categoria. |
| 📱 **App no celular** | PWA instalável no Android, com avisos de item novo e de datas chegando. |
| 🔒 **Só o casal entra** | Login pelo telefone. Os números **nunca** ficam no código. |

## 🧭 Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/requisitos.md`](docs/requisitos.md) | Dores, glossário, 39 requisitos funcionais, regras de negócio, não funcionais |
| [`docs/arquitetura.md`](docs/arquitetura.md) | Stack, modelo de dados, extração, auth, push, cron |
| [`docs/decisoes.md`](docs/decisoes.md) | Decisões de arquitetura (ADRs) e por que cada uma foi tomada |
| [`docs/pesquisa-extracao.md`](docs/pesquisa-extracao.md) | Teste de extração em 13 lojas: o que funciona sem IA e o que não |
| [`docs/roadmap.md`](docs/roadmap.md) | Fases de entrega |

## 🏗️ Stack em uma olhada

```
 Android (PWA) ──share──▶  Next.js · Vercel (São Paulo)  ──▶  Supabase Postgres (São Paulo)
                              │  /api/auth      telefone → sessão
                              │  /api/items     lista, já tenho, recebidos
                              │  /api/combos    montar presente
                              │  /api/scrape    link → produto (sem IA)
                              │      ├─ fetch próprio + JSON-LD / OpenGraph
                              │      ├─ leitores por loja (Amazon, Mercado Livre…)
                              │      └─ Jina Reader (fallback grátis, só o nome)
                              │
                              └─ cron diário: keep-alive · lembretes · limpeza ──▶ Web Push
```

## 🚀 Rodando localmente

> Projeto em fase de design. Os passos abaixo valem a partir da Fase 1 do [roadmap](docs/roadmap.md).

```bash
cp .env.example .env.local     # preencha as variáveis
npm install
npm run dev                    # http://localhost:3000
```

### Banco (Supabase CLI v3)

```bash
supabase login
supabase link --project-ref <ref-do-projeto>
supabase db push --remote      # aplica supabase/migrations
```

### Variáveis de ambiente

Ficam **só** no `.env.local` (git-ignored) e na Vercel.

| Variável | Para quê |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Acesso ao banco, **apenas no servidor** |
| `PHONE_PEPPER` | Segredo usado no HMAC dos telefones |
| `ALLOWED_PHONE_HASHES` | `perfil:hash,perfil:hash` |
| `SESSION_SECRET` | Assina o cookie de sessão |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Web Push |
| `CRON_SECRET` | Protege o cron diário |

Gerar o hash de um telefone (roda local, nada sai da sua máquina):

```bash
npm run phone:hash -- "+55 31 9XXXX-XXXX"
```

## 💰 Custo

| Serviço | Plano | Custo |
|---|---|---|
| Vercel | Hobby | R$ 0 |
| Supabase | Free (500 MB), São Paulo | R$ 0 · keep-alive diário evita a pausa |
| Jina Reader | Free, sem chave | R$ 0 · só como fallback |
| Web Push | — | R$ 0 |

---

<div align="center">
<sub>Feito com carinho, para nunca mais errar a cor do presente. 🧡</sub>
</div>
