<div align="center">

# 💝 Love Wishlist

**A wishlist de presentes de um casal: cola o link, o resto se preenche sozinho.**

Chega de garimpar links no grupo do WhatsApp e abrir um por um pra ver preço.
Aqui cada um cadastra o que quer ganhar, o outro filtra pelo orçamento e reserva em segredo.

`Next.js` · `Supabase` · `Vercel` · `Gemini` · `PWA` · custo **R$ 0**

</div>

---

## ✨ O que ele faz

| | |
|---|---|
| 🔗 **Cadastro por link** | Cola (ou compartilha direto do app da loja) a URL do produto. Nome, foto, preço, loja, categoria e a **variação escolhida** (cor, tamanho, modelo) são extraídos automaticamente. |
| 🎯 **Link exato preservado** | A URL original fica salva exatamente como foi colada, com a variação já selecionada. Sem "era o boné laranja, não o azul". |
| 💸 **Filtro por orçamento** | "Até R$ 100" → só aparece o que cabe no bolso, sem abrir nenhum site. |
| 🎁 **Reserva secreta** | Quem vai presentear marca "vou dar esse". O dono da lista **não vê**, a surpresa fica intacta e ninguém compra em dobro. |
| ♾️ **Dois tipos de desejo** | **Único** (vestido, fone): sai da lista quando adquirido. **Sempre bem-vindo** (o sabonete favorito, aquele chocolate): nunca sai, pode ganhar de novo. |
| ✅ **Já tenho** | O substituto do emoji no WhatsApp: marca como adquirido e o item vai para o histórico. |
| 📱 **App no celular** | PWA instalável no Android, com "Compartilhar → Love Wishlist" direto do navegador ou do app da loja. |
| 🔒 **Acesso só do casal** | Login pelo número de telefone. Os números **nunca** ficam no código. |

## 🧭 Documentação

| Documento | Conteúdo |
|---|---|
| [`docs/requisitos.md`](docs/requisitos.md) | Dores, personas, requisitos funcionais e não funcionais, regras de negócio |
| [`docs/arquitetura.md`](docs/arquitetura.md) | Stack, diagrama, modelo de dados, pipeline de scraping, auth, keep-alive |
| [`docs/decisoes.md`](docs/decisoes.md) | Registro das decisões de arquitetura (ADRs) e por que cada uma foi tomada |
| [`docs/roadmap.md`](docs/roadmap.md) | Fases de entrega e o que fica para depois |

## 🏗️ Stack em uma olhada

```
 Android (PWA) ──share──▶  Next.js na Vercel  ──▶  Supabase Postgres
                              │   ├─ /api/auth      (telefone → sessão)
                              │   ├─ /api/items     (CRUD + reservas)
                              │   └─ /api/scrape    (link → produto)
                              │            │
                              │            ├─ 1. HTML + JSON-LD / OpenGraph   (grátis)
                              │            ├─ 2. Jina Reader / Apify          (fallback grátis)
                              │            └─ 3. Gemini Flash                 (interpreta e categoriza)
                              │
                              └─ Vercel Cron diário ──▶ mantém o Supabase acordado
```

## 🚀 Rodando localmente

> O projeto ainda está na fase de design. Os passos abaixo valem a partir da Fase 1 do [roadmap](docs/roadmap.md).

```bash
cp .env.example .env.local     # preencha as variáveis (veja abaixo)
npm install
npm run dev                    # http://localhost:3000
```

### Variáveis de ambiente

Todas ficam **só** no `.env.local` (git-ignored) e nas Environment Variables da Vercel. Nunca no código.

| Variável | Para quê |
|---|---|
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Acesso ao banco, **apenas no servidor** |
| `PHONE_PEPPER` | Segredo usado no HMAC dos telefones |
| `ALLOWED_PHONE_HASHES` | `perfil:hash,perfil:hash`: os dois telefones, já em hash |
| `SESSION_SECRET` | Assina o cookie de sessão |
| `GEMINI_API_KEY` | Interpretação dos produtos |
| `CRON_SECRET` | Protege o endpoint do keep-alive |

Gerar o hash de um telefone (script local, nada sai da sua máquina):

```bash
npm run phone:hash -- "+55 31 9XXXX-XXXX"
```

## 💰 Custo

| Serviço | Plano | Custo |
|---|---|---|
| Vercel | Hobby | R$ 0 |
| Supabase | Free (500 MB) | R$ 0, com keep-alive diário para não pausar |
| Gemini API | Free tier (Flash / Flash-Lite) | R$ 0, com teto diário de chamadas no código |
| Jina Reader / Apify | Free | R$ 0, só como fallback |

---

<div align="center">
<sub>Feito com carinho, para nunca mais errar a cor do presente. 🧡</sub>
</div>
