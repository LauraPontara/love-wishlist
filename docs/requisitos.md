# Requisitos

## 1. Contexto e dores

Hoje o casal manda links de produtos num grupo do WhatsApp. O link já carrega a variação escolhida no site (cor, tamanho, modelo), o que evita erro na compra. Problemas:

| # | Dor | Consequência |
|---|---|---|
| D1 | O preview do WhatsApp nem sempre mostra preço nem variação | Precisa abrir link por link |
| D2 | Não dá para filtrar por orçamento | Com R$ 100 na mão, abre todos os links pra ver o que cabe |
| D3 | "Já tenho" é marcado com emoji | Some no histórico da conversa e é fácil não ver |
| D4 | Não existe "eu vou dar esse" | Risco de o dono comprar o item antes, ou de estragar a surpresa |
| D5 | Itens recorrentes (sabonete, chocolate) se misturam com itens únicos | Não fica claro o que pode ser dado de novo |
| D6 | Links se perdem no meio de outras mensagens | A lista nunca está completa num só lugar |

## 2. Personas

Dois usuários fixos, o casal. Cada um é **dono** da própria lista e **presenteador** na lista do outro. Os dois usam **Android**.

## 3. Conceitos do domínio

- **Item**: algo que o dono quer ganhar. Sempre tem o link original.
- **Tipo do item**
  - `unico`: uma vez adquirido, não faz sentido ganhar de novo (roupa, fone, acessório).
  - `sempre`: "sempre bem-vindo", pode ser dado repetidas vezes (sabonete, shampoo, chocolate, bala).
- **Status** (só para `unico`): `desejado` → `adquirido`.
- **Reserva**: o presenteador marca que vai dar o item. **Invisível para o dono.**
- **Presente registrado** (para `sempre`): histórico "ganhou em DD/MM", para não repetir na mesma semana.
- **Categoria**: Beleza, Cuidados pessoais, Comida & doces, Roupas, Acessórios, Tecnologia, Casa, Livros & papelaria, Experiências, Outros.
- **Variação**: atributos escolhidos no site (`Cor: Laranja`, `Tamanho: M`, `Capacidade: 256 GB`).

## 4. Requisitos funcionais

### Acesso
- **RF01**: Entrar digitando o próprio telefone. Só os dois números autorizados passam. Os demais recebem uma mensagem genérica.
- **RF02**: Sessão persistente (90 dias) para não precisar logar sempre.
- **RF03**: Sair da conta.

### Cadastro
- **RF04**: Cadastrar item colando um link. O sistema extrai nome, imagem, preço, moeda, loja, categoria e variação.
- **RF05**: Receber links pelo **compartilhamento nativo do Android** (Web Share Target), inclusive textos do WhatsApp com URL no meio.
- **RF06**: Mostrar uma prévia antes de salvar, com todos os campos editáveis. O dono escolhe o tipo (`unico`/`sempre`).
- **RF07**: Se a extração falhar, o item é salvo mesmo assim, só com o link, e o usuário completa à mão.
- **RF08**: Campos opcionais: observação ("tamanho 38, cor da foto 2") e prioridade (😍 muito / 🙂 normal).
- **RF09**: Avisar se o mesmo link já está na lista.

### Gestão (dono)
- **RF10**: Editar qualquer campo do item.
- **RF11**: Excluir item (com confirmação e "desfazer" por alguns segundos).
- **RF12**: Marcar item `unico` como **adquirido** ("já tenho"). Ele sai da lista principal e vai para "Já tenho".
- **RF13**: Reverter um adquirido para desejado.
- **RF14**: Atualizar preço sob demanda (refaz a extração).

### Presentear (presenteador)
- **RF15**: Ver a lista do outro com filtros de **orçamento** (faixa de preço), **categoria** e **tipo**, e ordenação por preço, prioridade ou data.
- **RF16**: Abrir o link original exatamente como cadastrado.
- **RF17**: **Reservar** item em segredo e desfazer a reserva. Reservados ficam marcados para o presenteador.
- **RF18**: Para itens `sempre`: registrar "dei hoje". O dono vê "ganhou em DD/MM" só depois que o presenteador confirmar que entregou.
- **RF19**: Para itens `unico` reservados: "entreguei" → o item vira `adquirido` automaticamente.

## 5. Regras de negócio

- **RN01**: O dono **nunca** vê reservas na própria lista. A regra é aplicada no servidor e nunca vai ao navegador do dono.
- **RN02**: Se o dono marcar como adquirido um item que o outro reservou, o presenteador vê um aviso: "ele(a) já comprou, escolha outro".
- **RN03**: Itens `sempre` nunca vão para "Já tenho".
- **RN04**: Só o dono edita ou exclui os próprios itens.
- **RN05**: O link original é imutável depois de salvo. Para trocar de link, cadastre outro item.
- **RN06**: Preço extraído guarda a data da coleta ("preço de 14/nov").

## 6. Requisitos não funcionais

| # | Requisito |
|---|---|
| RNF01 | **Custo zero**: só planos gratuitos. Qualquer API paga tem teto rígido no código. |
| RNF02 | **Disponibilidade**: o banco não pode pausar por inatividade (keep-alive diário). |
| RNF03 | **Privacidade**: telefones nunca no repositório. O banco só é acessado pelo servidor (RLS fecha tudo para o cliente). |
| RNF04 | **Mobile first**: uso principal no celular, instalável como PWA. |
| RNF05 | **Rápido**: a lista abre em < 1,5 s no 4G. A extração leva < 10 s, com feedback animado enquanto roda. |
| RNF06 | **Acessível**: contraste AA, alvos de toque ≥ 44 px, respeita `prefers-reduced-motion`. |
| RNF07 | **Design**: estética *playful vibrante*, autoral e sem cara de template genérico. |

## 7. Fora de escopo (por enquanto)

- Mais de dois usuários, listas compartilhadas com família ou amigos.
- Notificações push.
- Acompanhamento automático de queda de preço (fica no [roadmap](roadmap.md)).
- Compra dentro do app.
