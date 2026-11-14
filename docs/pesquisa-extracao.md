# Pesquisa: extração de dados sem IA

> Executada em 14/11/2026, de uma conexão residencial, com 1–2 produtos públicos por loja.
> Os scripts ficaram fora do repositório. Este documento registra os resultados e as decisões que saíram deles.

## 1. Estratégias testadas

| Estratégia | O que é |
|---|---|
| **Direto (desktop)** | `fetch` do servidor com User-Agent de Chrome desktop |
| **Direto (celular)** | Mesmo, com UA de Chrome Android |
| **Direto (bot de preview)** | UA `facebookexternalhit`. Muitas lojas servem as metatags OpenGraph para robôs de preview de link |
| **Microlink** (free) | API de metadados. Na prática o free tier dá **rajada de ~2 chamadas** e depois responde 429 |
| **Jina Reader** (free, sem chave) | Converte a página em texto. 20 req/min |

Em cada resposta, o parser tenta: JSON-LD `Product` → seletores específicos da loja → OpenGraph.

## 2. Resultado por loja

Legenda: **N** nome · **P** preço · **I** imagem · 🚫 bloqueado (403/captcha)

| Loja | Direto desktop | Direto celular | Bot de preview | Jina | Conclusão |
|---|---|---|---|---|---|
| **Kabum** | N P I | N P I | N P I | N P | ✅ Genérico (JSON-LD) resolve |
| **Americanas** | N P I | N P I | N P I | N P | ✅ Genérico resolve |
| **Época Cosméticos** | N P I | N P I | N P I | N P | ✅ Genérico resolve |
| **Boticário** | N P I | N P I | 🚫 | N P | ✅ Genérico resolve (não usar UA de bot) |
| **Natura** | N P I | N P I | 🚫 | N P | ✅ Genérico resolve |
| **Sephora** | N P I | N P I | 🚫 | N P | ✅ Genérico resolve |
| **Amazon** | N P | P | N P | N P | 🟡 **Leitor próprio**: imagem em `data-old-hires`/`hiRes`, preço em `.a-price-whole`, cor em `inline-twister…color_name` |
| **Mercado Livre** | 🚫 (verificação) | 🚫 | N I | N | 🟠 Bloqueia navegador comum. Jina traz o **nome**. Preço e foto só pela API oficial, que exige token (403 sem auth) |
| **AliExpress** | — (página JS) | I | — | N | 🟠 Só nome (via Jina). Preço vem do script da página e exige leitor próprio |
| **Shein** | 🚫 (página de risco) | 🚫 | — | — | 🔴 Preenchimento manual |
| **Magalu** | 🚫 403 | 🚫 | 🚫 | 🚫 | 🔴 Preenchimento manual |
| **Beleza na Web** | 🚫 403 (Akamai) | 🚫 | 🚫 | 🚫 | 🔴 Preenchimento manual |
| **Shopee** | sem dados (página JS) | N I | 🚫 | — | 🟠 UA de celular traz **nome + foto** via OpenGraph. Preço carregado por JS. A variação (`display_model_id`) fica só na URL |

### Variação (cor/tamanho/volume)

| Loja | Como aparece |
|---|---|
| Amazon | Cada cor tem um ASIN próprio na URL. A cor fica no título ("… - Preto") e no seletor `color_name` |
| Kabum | Cada cor é um produto (código) diferente, e a cor fica no nome |
| Boticário | `?idsku=` na URL identifica o SKU |
| Natura | Código `NATBRA-…` por variação |
| Sephora | Código no fim da URL (`-17998`) por volume. O volume não aparece de forma estruturada |

**Conclusão:** a variação quase sempre está **no nome** ou **no código da URL**. Extrair como campos separados (`Cor: Preto`) só vale com leitor próprio (Amazon). Nas outras lojas, o nome já carrega a variação, e a tela de revisão permite completar.

## 3. Decisões

1. **Respeitar bloqueios.** O pipeline se apresenta como um navegador comum (Chrome desktop ou Android) e **não** se disfarça de robô de preview (Facebook, WhatsApp) nem tenta contornar proteções antirrobô. Se a loja bloquear, o item vira `bloqueado` e é preenchido na revisão. Um teste com UA do WhatsApp foi barrado justamente por isso e não entrou no pipeline.
2. **Pipeline por loja, com detector de domínio:**
   - **Genérico (JSON-LD → OpenGraph)**, primeiro com UA desktop e depois com UA de celular: Kabum, Americanas, Época, Boticário, Natura, Sephora, Shopee (nome + foto) e qualquer loja VTEX/Shopify desconhecida.
   - **Leitor Amazon** (seletores).
   - **Jina como último recurso**, só para trazer o **nome** (Mercado Livre, AliExpress).
   - **Shein, Magalu, Beleza na Web**: uma tentativa com timeout curto. Se der 403, vira `bloqueado` com o aviso "esse site não deixa a gente ler".
3. **Microlink fora do pipeline**: a rajada do free tier é baixa demais para lotes. O Jina cobre o mesmo papel.

## 4. Pontos em aberto

- **Mercado Livre com preço**: criar um app gratuito no portal de desenvolvedores do ML e usar um token de aplicação na API `/items`. Precisa verificar se o token de aplicação (sem login de usuário) basta. Fica para a Fase 3.
- **Shopee com preço**: a Shopee tem programa oficial de afiliados/API de parceiros. Avaliar se dá para usar de graça. Até lá, o preço é manual.
- **IP de datacenter**: este teste rodou de IP residencial. A Vercel roda em IPs de nuvem, que algumas lojas (Amazon principalmente) tratam com mais rigor. **Validar o pipeline a partir da Vercel** logo no deploy da Fase 1 e ajustar a tabela acima.
- **Links reais do casal**: rodar o teste de novo com os links que já circularam no WhatsApp, especialmente os de lojas não listadas aqui.
