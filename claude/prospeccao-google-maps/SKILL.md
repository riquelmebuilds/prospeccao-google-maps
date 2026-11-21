---
name: prospeccao-google-maps
description: Roda uma prospecção de leads inteira, em doze etapas seguidas e sem pedir licença entre elas - capta no Google Maps com o MazyOS Scraper e filtra aos poucos (nicho por cima, site por cima, Instagram pelo Serper, bio lida no Chrome, site a fundo pelos links da bio, CNPJ e dono na Receita, particular ou pública em escolas, WhatsApp da empresa e do dono testados na Evolution, investida com agentes nos sem WhatsApp) até entregar uma lista grande de leads qualificados no design MazyOS, com as cidades juntas, para o operador fazer o filtro final. Use sempre que o usuário pedir /prospeccao-google-maps, /prospecta, prospecção no Google Maps, prospectar ou captar leads de um nicho numa cidade ou bairro, ou uma etapa disso numa rodada (achar Instagram, site, WhatsApp, CNPJ ou dono de uma lista de leads), ou retomar uma rodada em comercial/listas/. Não serve para escrever mensagem de abordagem, proposta, preço ou site (use a skill prospeccao ou as de proposta).
metadata:
  versao: "1.0"
  idioma: pt-BR
  requer: MazyOS Scraper, Node.js 18+, Chrome, chave do Serper, Evolution API (Docker), base de CNPJ da Receita
---

# Prospecção Google Maps

Você conduz uma rodada de prospecção do começo ao fim. O operador diz o nicho e os bairros; você pega tudo o que o MazyOS Scraper captou e filtra aos poucos, etapa por etapa, sem pedir licença entre elas, até sobrar uma lista grande de leads que cabem na prospecção fria dele: do nicho, sem site funcionando, com Instagram, com WhatsApp testado, com CNPJ e o nome do dono quando existem. O corte final é dele.

## Leia primeiro

[Contexto de Execução e Axiomas](contexto-de-execucao.md) — quem você é, quem é o operador, o que a lista otimiza e os dez axiomas. Depois, [Rodada Autônoma](como-conduzir/rodada-autonoma.md) (o fluxo) e [Peneira em Camadas](como-conduzir/peneira-em-camadas.md) (a profundidade de cada etapa). Antes de cada etapa, passe os olhos em [Armadilhas Já Encontradas](referencia/armadilhas.md).

## Ao ser acionada

Pergunte numa mensagem só o que ainda não veio no pedido: **o nicho** (e as fronteiras dele), **as cidades e os bairros**, **os termos de busca** (proponha de seis a oito, bem diferentes entre si), **o que ele vai oferecer** (site é o padrão), **critério de porte** (se houver) e **rodadas anteriores** a excluir. Com as respostas, crie a pasta, monte o config pela tabela de [Rodada Autônoma](como-conduzir/rodada-autonoma.md), consulte o saldo do Serper, diga em três linhas o que vai acontecer e **comece**. Daí em diante, só pare quando uma ação humana for indispensável (QR do WhatsApp, chave nova do Serper, login no Instagram).

## O núcleo

**Os axiomas, em uma linha cada:**
1. A rodada roda inteira, em ordem, sem pedir licença.
2. Filtro leve primeiro, detalhado depois; cada etapa no que sobrou.
3. Tira só o que está na cara; a dúvida vira grupo ou aviso.
4. O que o operador apaga nunca volta.
5. Dado pago ou lento é salvo inteiro e reaproveitado.
6. Nada é afirmado sem teste direto; site só "funciona" com prova de ser da empresa.
7. Investida extra só quando compensa, e uma vez só.
8. Você nunca contata o lead.
9. Auditor no fim de cada etapa; agentes onde cada lead exige abrir páginas.
10. Uma lista só, cidades juntas, cartão completo.

**O ritmo de cada etapa:** ler as exclusões do operador → rodar a etapa → auditor → regerar a lista viva → uma linha para o operador → próxima etapa.

**As doze etapas:** captar · nicho por cima · site por cima · Instagram · bio · site a fundo · CNPJ · particular ou pública (só escolas) · WhatsApp da empresa · WhatsApp do dono · investida nos sem WhatsApp · lista final.

## Mapa dos documentos

**Raiz**
- [Contexto de Execução e Axiomas](contexto-de-execucao.md) — executor, operador, função objetivo e axiomas. Leia sempre primeiro.

**Como conduzir**
- [Rodada Autônoma](como-conduzir/rodada-autonoma.md) — as perguntas do começo, o ritmo de cada etapa, quando parar e como falar com o operador.
- [Peneira em Camadas](como-conduzir/peneira-em-camadas.md) — a pergunta e a profundidade de cada etapa; o que sai e o que vira grupo.
- [Lista Viva](como-conduzir/lista-viva.md) — uma página por rodada, as exclusões que nunca voltam, as abas e o cartão.
- [Investida Extra](como-conduzir/investida-extra.md) — quando vale uma passada a mais por Instagram ou WhatsApp.
- [Agentes e Velocidade](como-conduzir/agentes-e-velocidade.md) — o que é script, o que é leitura sua e o que é dos agentes.
- [Salvar Tudo e Controlar o Custo](como-conduzir/salvar-tudo-e-custos.md) — o que salvar e reaproveitar, os custos, o saldo e a troca de chave.
- [Verificar Antes de Afirmar](como-conduzir/verificar-antes-de-afirmar.md) — os testes e os falsos positivos.

**Etapas**
- [1 — Captar](etapas/01-captar.md) — scraper em todos os bairros, coordenadas automáticas, rodadas anteriores.
- [2 — Nicho por cima](etapas/02-nicho-por-cima.md) — classificar as categorias; só o claramente de fora sai.
- [3 — Site por cima](etapas/03-site-por-cima.md) — só o link da ficha; site da empresa sai, domínio morto vira grupo.
- [4 — Instagram](etapas/04-instagram.md) — Serper para todos; aviso no que não bate; investida pelo telefone.
- [5 — Bio](etapas/05-bio.md) — você lê no Chrome, com os links; o que a empresa é; só o claramente de fora sai.
- [6 — Site a fundo](etapas/06-site-a-fundo.md) — ficha, bio, Linktree e Google salvo; identidade obrigatória.
- [7 — CNPJ](etapas/07-cnpj.md) — Receita: nível, dono, sócios, telefones, porte.
- [8 — Particular ou pública](etapas/08-particular-ou-publica.md) — só escolas; três fontes.
- [9 — WhatsApp da empresa](etapas/09-whatsapp-empresa.md) — juntar, testar, agentes nos sem número.
- [10 — WhatsApp do dono](etapas/10-whatsapp-dono.md) — celular do cadastro; dois botões.
- [11 — Investida nos sem WhatsApp](etapas/11-investida-whatsapp.md) — Google e Facebook com agentes, acima do gatilho.
- [12 — Lista final](etapas/12-lista-final.md) — juntar, auditar, abrir e entregar o funil.

**Referência**
- [Armadilhas Já Encontradas](referencia/armadilhas.md) — os erros reais e a regra de cada um.
- [Ferramentas e Dados](referencia/ferramentas-e-dados.md) — ferramentas, config, registro do lead e scripts.
- [Agente de Busca do WhatsApp](referencia/agente-whatsapp.md) — os prompts dos agentes (busca e investida).
- [Lembrete de Etapas](referencia/lembrete-de-etapas.md) — mostre só quando o operador pedir.

Os scripts ficam em `scripts/` (Node.js, sem dependências; `--help` mostra a ajuda), o modelo de configuração em [config.exemplo.json](config.exemplo.json) e o design da lista em `lista/` (já vem dentro da skill). O [README](README.md) descreve a instalação.

## Quando o trabalho está pronto

- A lista viva final está aberta no Chrome do operador, com as cidades juntas e as abas pelo tipo de site e pelo WhatsApp, e o total que você disse é o total de cartões.
- Nenhum lead que o operador apagou aparece; todo lead removido está em `removidos.csv` com o motivo.
- Cada site testado está no cartão com o resultado; cada WhatsApp em botão foi confirmado na Evolution; o do dono está rotulado.
- `auditar.js` sai limpo em todas as etapas.
- O `rodada.md` guarda o funil, os créditos por etapa e as decisões e travas da rodada.
