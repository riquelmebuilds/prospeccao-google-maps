---
id: como-conduzir.investida-extra
nome: Investida Extra
tipo: heurística
camada: 4-operacional
status: ativo

essencia: >
  Quando sobram muitos leads sem Instagram ou sem WhatsApp, faça uma passada a mais,
  pelo caminho que costuma render, uma vez só; pese o custo contra o que ela
  costuma devolver e não insista no que já deu zero.

em-uma-palavra: Investida

certeza: consensual
maturidade: seminal
origem: empírica
---
# Investida Extra

> Algumas etapas deixam leads sem um dado que existe em outro lugar: o Instagram que a busca pelo nome não achou, o WhatsApp que só está no Facebook. Uma passada a mais costuma recuperar parte deles. Às vezes não compensa; você precisa saber quando.

---

## O que afirma

Há duas investidas previstas na rodada, cada uma com gatilho, caminho e teto:

| Investida | Gatilho | Caminho | Custo | Rende, em média |
|---|---|---|---|---|
| **Instagram** (etapa 4) | sem Instagram depois da busca por nome: 10 ou mais leads, ou 15% ou mais dos leads | busca do telefone da ficha (`instagram-serper.js --por-telefone`) | 1 crédito por lead | perto de 1 em 4 dos que têm telefone na ficha |
| **WhatsApp** (etapa 11) | sem nenhum WhatsApp depois das etapas 9 e 10: 10 ou mais leads, ou 20% ou mais dos leads | Google e Facebook pelo Serper (`whats-investida.js`) e agentes que conferem cada número | 3 créditos por lead, mais os agentes | perto de 1 em 4 |

Abaixo do gatilho, pule a investida e anote no `rodada.md` ("8 sem WhatsApp, abaixo do gatilho: sem investida").

## Por que é verdade

O dado que falta está, quase sempre, em um de poucos lugares: o telefone da ficha leva ao perfil que o nome não acha; o Facebook e os cadastros públicos (como o de escolas da prefeitura) trazem o WhatsApp que a bio não mostra. Esses caminhos rendem uma fração dos leads; os seguintes rendem quase nada. Numa rodada de escolas, a passada de Google e Facebook com agentes achou 7 WhatsApps em 28 leads; uma segunda passada, só por Facebook e LinkedIn, achou 0 em 21.

## O que fazer

1. **Conte** quantos leads estão sem o dado e compare com o gatilho.
2. **Faça uma passada**, pelo caminho da tabela. Os agentes recebem as respostas do Google já salvas: eles não precisam buscar, só abrir e conferir (DuckDuckGo e Bing bloqueiam ou devolvem lixo para agentes).
3. **Teste** o que voltar (Evolution para WhatsApp; nome ou telefone para Instagram).
4. **Pare.** Não faça segunda passada por outro caminho. Os que ficaram sem o dado seguem a regra da etapa: sem Instagram saem; sem WhatsApp ficam no grupo próprio.

## O que muda

| Contexto | Sem esta heurística | Com ela |
|---|---|---|
| 6 de 120 leads sem Instagram | Investida de 6 créditos e agentes | Abaixo do gatilho: saem com registro |
| 28 de 74 sem WhatsApp | Três passadas por caminhos diferentes | Uma passada de Google e Facebook com agentes; o resto fica no grupo sem WhatsApp |

## Tensões e limites

O gatilho tem duas exceções, e só elas. Abaixo do gatilho, rode mesmo assim se metade ou mais dos leads sem o dado está entre os 20% com mais avaliações da rodada. Acima do gatilho, pule se todos os leads sem o dado têm menos de 5 avaliações no Maps. Anote no `rodada.md` qual regra valeu.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axioma 7
- **Irmãos:** [Rodada Autônoma](rodada-autonoma.md), [Peneira em Camadas](peneira-em-camadas.md), [Lista Viva](lista-viva.md), [Agentes e Velocidade](agentes-e-velocidade.md), [Salvar Tudo e Controlar o Custo](salvar-tudo-e-custos.md), [Verificar Antes de Afirmar](verificar-antes-de-afirmar.md)

### Semânticas
- `é-caso-especial-de` **forte** — [Contexto de Execução e Axiomas](../contexto-de-execucao.md): o Axioma 7 desenvolvido como gatilhos e caminhos
- `complementa` **moderada** — [Peneira em Camadas](peneira-em-camadas.md): a investida é a camada fina aplicada só ao que sobrou sem dado
- `complementa` **moderada** — [Agentes e Velocidade](agentes-e-velocidade.md): a investida de WhatsApp é trabalho de agentes
- `complementa` **moderada** — [Salvar Tudo e Controlar o Custo](salvar-tudo-e-custos.md): cada investida tem custo em créditos

### Funcionais
- `habilita` **forte** — [Etapa 11 — Investida nos Sem WhatsApp](../etapas/11-investida-whatsapp.md): gatilho, caminho e teto da etapa
- `restringe` **moderada** — [Etapa 4 — Instagram](../etapas/04-instagram.md): a investida pelo telefone só roda acima do gatilho
