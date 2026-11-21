---
id: como-conduzir.peneira-em-camadas
nome: Peneira em Camadas
tipo: modelo-mental
camada: 4-operacional
status: ativo

essencia: >
  Cada etapa tem uma profundidade certa: as primeiras olham por cima e tiram só o
  óbvio, as do meio olham com mais detalhe só no que sobrou, e o que gera dúvida
  vira grupo ou aviso em vez de sumir.

em-uma-palavra: Camadas

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Peneira em Camadas

> A lista sai grande e boa quando cada etapa olha na profundidade certa. Olhar fundo cedo, em mil fichas, sobrecarrega o julgamento; olhar raso tarde deixa lixo. A peneira tem furos largos em cima e finos embaixo.

---

## O que afirma

Toda etapa responde a uma pergunta só, com o menor esforço que a resposta exige. A pergunta da etapa 2 é "isto é claramente de fora?", não "isto é do nicho?". A da etapa 3 é "o link da ficha abre um site da empresa?", não "esta empresa tem site em algum lugar?". As perguntas finas (a bio, os links da bio, o Google, o CNPJ) vêm quando sobra pouco lead e o custo de olhar cada um é pequeno.

## Por que é verdade

O julgamento tem um custo por lead. Com mil fichas e uma pergunta fina, você abrevia, generaliza e erra nas duas direções: tira escola boa porque o nome não tem "infantil" e deixa academia porque a categoria é "Escola". Com uma pergunta larga, a decisão é rápida e quase sem erro; com uma pergunta fina em cem leads, há atenção para cada um.

## A profundidade de cada etapa

| Etapa | Pergunta | Olha | Não olha ainda |
|---|---|---|---|
| 2 Nicho por cima | É claramente de fora? | categoria e nome da ficha | bio, site |
| 3 Site por cima | O link da ficha abre o site da empresa? | só o link da ficha do Maps | bio, Linktree, Google |
| 4 Instagram | Qual é o perfil? | uma busca por lead, todos de uma vez | prova de identidade |
| 5 Bio | A bio mostra que é de fora? O perfil parece de outra empresa? | a bio inteira, os links, o nome do perfil | site, CNPJ |
| 6 Site a fundo | Existe um site da empresa em algum link? | ficha, bio, Linktree, encurtadores, domínios na bio, Google já salvo | — |
| 7 a 11 | CNPJ, WhatsApp, dono | Receita, Evolution, agentes | — |

## Tirar ou guardar: a regra única

**Tira** (registra em `removidos.csv`) o que a pergunta da etapa responde com clareza:
- categoria ou nome claramente de fora (etapa 2); bio claramente de fora (etapa 5);
- site que abre **e** prova ser da empresa (etapas 3 e 6);
- sem Instagram depois da busca e da investida (etapa 4);
- escola pública ou entidade, quando o nicho é escola particular (etapa 8);
- ficha repetida da mesma empresa (etapas 4 e 12, juntada no cartão).

**Guarda num grupo ou com aviso** tudo que gera dúvida:
- domínio que não funciona → grupo próprio (conta como sem site, é lead);
- site que abre mas sem prova de ser da empresa → grupo "site em dúvida";
- Instagram com @ sem palavra do nome, de outra cidade ou repetido → aviso "confira o Instagram";
- bio que não deixa claro o nicho → aviso "nicho em dúvida";
- particular ou pública sem resposta → aviso;
- sem WhatsApp → grupo próprio (contato pelo Instagram).

Na dúvida entre tirar e guardar, guarde: o operador apaga um cartão em um segundo, mas não recupera o que você tirou.

## Como aparece

Você sente vontade de resolver tudo na primeira passada: abrir a bio já na etapa 2, ou exigir prova de cada Instagram antes de seguir. Esse é o sinal de que a pergunta da etapa ficou fina demais para o tamanho da lista.

## O que muda

| Contexto | Peneira fina cedo | Peneira em camadas |
|---|---|---|
| Mil fichas do Maps, nicho de escolas | Exige palavra de infância no nome e derruba escola boa | Tira autoescola, pet e academia pela categoria; o resto segue |
| Instagram de cada lead | Exige duas provas e corta mais da metade | Pega o perfil da busca, marca suspeito o que não bate e deixa a bio decidir |
| Site escondido no Linktree | Não é visto (a etapa 3 só olhou o Maps) | É achado na etapa 6, que lê os links da bio |

## Tensões e limites

"Por cima" não é "de qualquer jeito": a categoria que entra na lista de fora tem que ser claramente de fora (um ginásio que aparece numa busca de escolas é; "Instituição educacional" não é). Se o operador abre os primeiros cartões e vê lixo óbvio, a camada de cima está larga demais: aperte a regra dela e rode a etapa de novo.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axiomas 2 e 3
- **Irmãos:** [Rodada Autônoma](rodada-autonoma.md), [Lista Viva](lista-viva.md), [Investida Extra](investida-extra.md), [Agentes e Velocidade](agentes-e-velocidade.md), [Salvar Tudo e Controlar o Custo](salvar-tudo-e-custos.md), [Verificar Antes de Afirmar](verificar-antes-de-afirmar.md)

### Semânticas
- `é-caso-especial-de` **forte** — [Contexto de Execução e Axiomas](../contexto-de-execucao.md): os Axiomas 2 e 3 desenvolvidos como profundidade por etapa
- `complementa` **forte** — [Rodada Autônoma](rodada-autonoma.md): a ordem das etapas é a ordem das camadas
- `complementa` **moderada** — [Investida Extra](investida-extra.md): a investida é a camada fina aplicada só ao que sobrou sem dado

### Funcionais
- `restringe` **forte** — [Etapa 2 — Nicho Por Cima](../etapas/02-nicho-por-cima.md): só sai o claramente de fora
- `restringe` **forte** — [Etapa 3 — Site Por Cima](../etapas/03-site-por-cima.md): só o link da ficha do Maps
