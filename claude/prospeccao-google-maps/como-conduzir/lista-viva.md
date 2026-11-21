---
id: como-conduzir.lista-viva
nome: Lista Viva
tipo: padrão
camada: 4-operacional
status: ativo

essencia: >
  A rodada tem uma página só, com chave fixa, regerada no fim de cada etapa; antes
  de cada etapa você aplica o que o operador apagou nela, e nada apagado volta.
  Cidades juntas, abas pelo tipo de site e pelo WhatsApp.

em-uma-palavra: Página

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Lista Viva

> O operador acompanha a rodada por uma página só. Ele apaga o que não quer, e isso vale para sempre. Você regera a mesma página a cada etapa, e ela nunca devolve o que ele tirou.

---

## O que afirma

A lista da rodada é `lista/lista.html`, gerada por `scripts/lista-montar.js` a partir do `leads.json`, com a chave `rodada-<pasta>` do começo ao fim. O que o operador apaga fica guardado no Chrome dele por essa chave; `scripts/marcacoes-chrome.js` lê essa mesma chave e passa as exclusões para o `leads.json`.

## Por que é verdade

As marcações do operador vivem no armazenamento do navegador, presas à chave da página. Uma página nova com outra chave começa limpa e mostra de novo tudo o que ele apagou; e um `leads.json` que não recebeu as exclusões devolve esses leads nas etapas seguintes, que gastam crédito e tempo com eles. Com uma chave só e a leitura antes de cada etapa, o que ele apagou some de vez.

## O que fazer

**Antes de cada etapa (a partir da 3):** `node scripts/marcacoes-chrome.js --dir <rodada> --aplicar`. Os apagados saem com o motivo "apagado pelo operador na lista". "Não achei marcações" quer dizer que ele não mexeu: siga.

**No fim de cada etapa:** `node scripts/lista-montar.js --dir <rodada> --etapa "<nome>"`. Na primeira vez (fim da etapa 2) e na lista final, acrescente `--abrir`: a página abre no Chrome do operador. Nas outras vezes, ele aperta F5 na aba aberta.

**Nunca:** gerar outra página com outra chave para a mesma rodada; mostrar lead removido; separar por cidade.

**Página avulsa:** se precisar mostrar um recorte (por exemplo, só os removidos por site), gere numa pasta à parte e avise que é só para olhar; as exclusões que valem são as da lista viva.

## Como a página se organiza

- **Cidades sempre juntas.** A cidade aparece no cartão, nunca como aba.
- **Abas pelo tipo de site** (sem site · domínio que não funciona · site em dúvida, e "tem site" só quando a oferta não é site) e, depois do teste de WhatsApp, **por com ou sem WhatsApp**. Só aparece aba que tem lead.
- **Mais avaliações primeiro.**
- **O subtítulo** diz quantos leads, quando a página foi gerada e depois de qual etapa: o número é sempre o dos leads ativos, já sem os apagados.

## O cartão

| Parte | O que mostra |
|---|---|
| Topo | nome, cidade e bairro real da ficha (e o bairro buscado, quando difere), **o que a empresa é** (uma frase), nota e avaliações, tipo de site |
| Botões | **WhatsApp da empresa**, **WhatsApp do dono (nome, provável)**, outros WhatsApps rotulados (cadastro do CNPJ a conferir), Instagram, Google Maps, **o link de todo site achado** (ficha, bio, Linktree, Google) com o resultado do teste |
| Avisos | confira o Instagram (e por quê), nicho em dúvida, porte (quando há critério), particular ou pública sem resposta, CNPJ a conferir, número dividido com outra empresa |
| Campos | teste do site, bio, CNPJ e situação, dono e sócios, porte, números sem WhatsApp, outra ficha da mesma empresa, telefone da ficha, endereço, anotação do operador |

Só número que a Evolution confirmou vira botão de WhatsApp. O botão abre `https://wa.me/55<dígitos>`.

## O que muda

| Contexto | Sem a lista viva | Com ela |
|---|---|---|
| Ele apagou 23 escolas na lista de nicho | Elas voltam na lista de WhatsApp e ele conta errado | Saem do `leads.json` antes da etapa seguinte e não voltam |
| Ele pede para ver por cidade | Duas abas, uma por cidade | Uma lista; a cidade está no cartão |
| A página foi regerada | "Por que aparece 124 se eu tenho 85?" | O subtítulo conta só os ativos |

## Tensões e limites

As marcações ficam no Chrome do operador: se ele limpar os dados do navegador, as que ainda não foram aplicadas se perdem. Por isso a leitura acontece antes de cada etapa, e não só no fim. O Chrome também grava com um pequeno atraso: o que ele apagou nos últimos segundos pode não aparecer numa leitura, e aparece na seguinte; a etapa 12 lê de novo antes de entregar, e nada apagado chega à lista final.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axiomas 4 e 10
- **Irmãos:** [Rodada Autônoma](rodada-autonoma.md), [Peneira em Camadas](peneira-em-camadas.md), [Investida Extra](investida-extra.md), [Agentes e Velocidade](agentes-e-velocidade.md), [Salvar Tudo e Controlar o Custo](salvar-tudo-e-custos.md), [Verificar Antes de Afirmar](verificar-antes-de-afirmar.md)

### Semânticas
- `é-caso-especial-de` **forte** — [Contexto de Execução e Axiomas](../contexto-de-execucao.md): os Axiomas 4 e 10 desenvolvidos como uma página por rodada
- `complementa` **forte** — [Rodada Autônoma](rodada-autonoma.md): o fim de cada etapa regera esta página
- `complementa` **moderada** — [Verificar Antes de Afirmar](verificar-antes-de-afirmar.md): o cartão mostra o resultado de cada teste

### Funcionais
- `contextualiza` **forte** — [Etapa 12 — Lista Final](../etapas/12-lista-final.md): a lista final é a mesma página, na última versão
