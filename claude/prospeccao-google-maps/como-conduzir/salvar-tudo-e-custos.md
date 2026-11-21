---
id: como-conduzir.salvar-tudo-e-custos
nome: Salvar Tudo e Controlar o Custo
tipo: heurística
camada: 4-operacional
status: ativo

essencia: >
  Toda resposta de consulta paga ou lenta vai inteira para bruto/ antes de qualquer
  uso, as etapas seguintes reaproveitam o que já foi pago, e o saldo do Serper é
  conferido de verdade no começo e quando a chave muda.

em-uma-palavra: Economia

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Salvar Tudo e Controlar o Custo

> Uma consulta paga só se paga uma vez. Guarde a resposta inteira, reaproveite nas etapas seguintes, registre cada gasto e saiba o saldo real.

---

## O que afirma

Cada etapa que consulta uma fonte externa grava a resposta completa em `bruto/` antes de extrair o que precisa. Os scripts já fazem isso; se você consultar algo à mão, faça o mesmo. E cada etapa procura primeiro no que já está salvo.

## Por que é verdade

A parte útil de uma resposta muda com a etapa. A busca do Instagram devolve o perfil, o começo da bio (que serve para o nicho) e outros resultados (que revelam o site, na etapa 6). A leitura da bio traz os links (site, Linktree, WhatsApp). Quem guardou só o @ paga de novo; quem guardou tudo não paga.

## O que reaproveitar

| Dado salvo | Etapa que gera | Etapas que reaproveitam |
|---|---|---|
| Resposta da busca do Instagram (`bruto/instagram/`) | 4 | 5 (trecho da bio), 6 (sites nos outros resultados) |
| Bio e links lidos no Chrome (`lead.bio`, `bruto/bio/`) | 5 | 6 (sites), 9 (WhatsApp) |
| Páginas de site e Linktree abertas (`bruto/sites/`) | 3 e 6 | 9 (WhatsApp que apareceu no site ou no Linktree) |
| Cadastro da Receita (`lead.cnpj`, `bruto/cnpj/`) | 7 | 8 (razão social), 10 (celular do dono) |
| Respostas do Google da investida (`bruto/whats-investida/`) | 11 | agentes da etapa 11 |

## Custos

| Consulta | Custo no Serper |
|---|---|
| Busca no Google (`google.serper.dev/search`) | 1 crédito |
| Lugares (`/places`, só para a coordenada de um bairro que o mapa grátis não conhece) | 1 crédito |
| Scrape de página (`scrape.serper.dev`, reserva da etapa 5) | 10 créditos por perfil |
| Saldo (`/account`) | nenhum |
| MazyOS Scraper, Chrome, Evolution, Receita | nenhum |

Uma rodada típica gasta 1 crédito por lead na etapa 4, de 0 a 1 por lead na etapa 8 (só escolas, só os sem resposta) e 3 por lead sem WhatsApp na etapa 11.

## Saldo e troca de chave

- **No começo da rodada** e **depois de cada troca de chave**: `node scripts/serper-saldo.js --dir <rodada>`. Ele consulta o saldo real (sem gastar) e grava em `config.serper.saldoInicial`; daí em diante o saldo é estimado pelos gastos do `creditos.log`.
- **Antes de gastar**, os scripts conferem o saldo; **durante**, se o Serper recusar uma busca por falta de crédito, eles param do mesmo jeito. Nos dois casos saem com código 3 e a mensagem de troca de chave, com tudo o que já foi pago salvo. Abra então `https://serper.dev/api-keys` no Chrome do operador e o arquivo da chave (`config.serper.envFile`) no Bloco de Notas; quando ele disser que pôs crédito ou trocou a chave, rode `serper-saldo.js` e a etapa de novo: ela retoma de onde parou.
- **Nunca** imprima a chave, nem em log, nem em mensagem.

## Estrutura da rodada

```
<rodada>/
  config.json        nicho, bairros, termos, caminhos (detalhes em Ferramentas e Dados)
  leads.json         a lista viva: um registro por lead
  removidos.csv      tudo que saiu, com o motivo e a etapa
  bruto/             respostas inteiras das consultas
  lista/             a página da lista viva
  creditos.log       cada gasto e cada saldo consultado
  rodada.md          funil, créditos, decisões e travas
```

**Retomada:** todo script pula o que já está salvo. Se uma etapa cair no meio, rode de novo e ela continua.

## O que muda

| Contexto | Sem guardar | Guardando |
|---|---|---|
| A bio de 300 leads | Paga a busca de novo para ler o trecho | O trecho já está no arquivo da etapa 4 |
| O site escondido nos resultados do Google | Nova busca de 1 crédito por lead | A etapa 6 lê os resultados já salvos |

## Tensões e limites

`bruto/` cresce. Ele fica na pasta da rodada, sem commit: é o seguro contra pagar duas vezes, não parte da entrega.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axioma 5
- **Irmãos:** [Rodada Autônoma](rodada-autonoma.md), [Peneira em Camadas](peneira-em-camadas.md), [Lista Viva](lista-viva.md), [Investida Extra](investida-extra.md), [Agentes e Velocidade](agentes-e-velocidade.md), [Verificar Antes de Afirmar](verificar-antes-de-afirmar.md)

### Semânticas
- `é-caso-especial-de` **forte** — [Contexto de Execução e Axiomas](../contexto-de-execucao.md): o Axioma 5 desenvolvido como regra de arquivo e de crédito
- `complementa` **moderada** — [Investida Extra](investida-extra.md): cada investida tem custo em créditos
- `complementa` **moderada** — [Verificar Antes de Afirmar](verificar-antes-de-afirmar.md): o que se testa fica salvo para provar depois
- `complementa` **forte** — [Ferramentas e Dados](../referencia/ferramentas-e-dados.md): onde cada dado fica e qual script o grava

### Funcionais
- `habilita` **forte** — [Etapa 6 — Site a Fundo](../etapas/06-site-a-fundo.md): a etapa usa a bio e o Google já salvos
