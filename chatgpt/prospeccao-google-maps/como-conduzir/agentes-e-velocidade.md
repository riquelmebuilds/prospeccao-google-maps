---
id: como-conduzir.agentes-e-velocidade
nome: Agentes e Velocidade
tipo: padrão
camada: 4-operacional
status: ativo

essencia: >
  Script para o mecânico, você para o julgamento que cabe numa leitura, agentes de
  IA em paralelo para o que exige abrir páginas e decidir lead a lead; só você
  altera o leads.json.

em-uma-palavra: Velocidade

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Agentes e Velocidade

> Cada etapa tem uma natureza: mecânica (um script resolve), de leitura (você decide lendo uma tabela) ou de investigação (cada lead pede abrir páginas e decidir). A investigação vai para agentes de IA em paralelo, um lote por agente.

---

## Mapa: quem faz o quê

| Etapa | Natureza | Tempo típico | Quem |
|---|---|---|---|
| 1 Captar | mecânica | 5 a 10 min por bairro | `buscar-maps.js` (todos os bairros seguidos) |
| 2 Nicho por cima | leitura | minutos | você classifica as categorias; `filtrar-maps.js` aplica |
| 3 Site por cima | mecânica | 3 a 30 min | `site-checar.js --fase rapida`, em 4 processos (`--lote i/4`) quando passa de 100 leads |
| 4 Instagram | mecânica | minutos | `instagram-serper.js`, todos de uma vez (1 crédito por lead) |
| 5 Bio | mecânica + leitura | 5 a 10 s por perfil + sua leitura | `bio-chrome.js` lê; você decide em `bio-decidir.js` |
| 6 Site a fundo | mecânica | 5 a 20 min | `site-checar.js --fase fundo`, em lotes quando passa de 100 |
| 7 CNPJ | mecânica, lenta | ~10 min | `cnpj-receita.js` em segundo plano |
| 8 Particular ou pública | mecânica | minutos | `publica-particular.js` |
| 9 WhatsApp da empresa | mecânica + investigação | 10 a 30 min | script; **agentes** nos que ficaram sem número |
| 10 WhatsApp do dono | mecânica | minutos | scripts |
| 11 Investida | investigação | 5 a 10 min por lote | **agentes**, com as respostas do Google já salvas |
| 12 Lista final | mecânica | segundos | scripts |

**Regra de bolso:** se cada lead exige abrir páginas e decidir, e são mais de 10 leads, divida em lotes e use agentes. Se a decisão cabe numa tabela que você lê (categorias, bios), decida você.

## Como usar agentes sem errar

1. **Lotes de 7 a 10 leads**, até 5 agentes por vez, disparados na mesma mensagem, em segundo plano.
2. **Cada agente escreve um arquivo de resultado** em formato fixo (`bruto/whats-lotes/...resultado-NN.json`); só você altera o `leads.json`, por script (`whats-aplicar.js`).
3. **Prompt completo e autossuficiente** ([Agente de busca do WhatsApp](../referencia/agente-whatsapp.md)): o agente não tem a sua conversa.
4. **Entregue o Google já buscado.** Agentes não conseguem buscar bem (DuckDuckGo pede captcha, Bing devolve lixo); dê a eles o arquivo das respostas do Serper e peça que abram e confiram.
5. **Sem janela na tela do operador:** Chrome headless ou `curl`, nunca navegador visível, nunca Playwright.
6. **Agente nunca contata o lead**, nunca segue nem envia mensagem, nunca usa identidade falsa (user-agent de robô) para passar por login, nunca imprime chaves.
7. **Recontar pelo arquivo:** o relato do agente pode errar a conta; o script aplica o que está no arquivo.
8. **Conferir por amostra:** abra 3 resultados de agentes diferentes e veja se o número está na página citada. Erro achado = reveja o lote daquele agente.

## Enquanto os agentes trabalham

Diga ao operador, em uma linha, quantos agentes estão rodando e em quê. Quando cada um terminar, não repita o relato dele: espere todos, aplique, teste e informe o resultado da etapa de uma vez.

## O que muda

| Contexto | Sem este padrão | Com ele |
|---|---|---|
| 42 leads sem WhatsApp | Você abre Linktree, site e Facebook um por um | 5 agentes, lotes de 8 a 10, resultado aplicado por script |
| 150 bios para decidir o nicho | Agentes lendo bio por bio | Você lê a tabela de `bio-decidir.js --listar` e decide |

## Tensões e limites

Agentes custam processamento e atenção para conferir. Não use agente para o que um script resolve, nem para a leitura que cabe numa tabela.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axioma 9
- **Irmãos:** [Rodada Autônoma](rodada-autonoma.md), [Peneira em Camadas](peneira-em-camadas.md), [Lista Viva](lista-viva.md), [Investida Extra](investida-extra.md), [Salvar Tudo e Controlar o Custo](salvar-tudo-e-custos.md), [Verificar Antes de Afirmar](verificar-antes-de-afirmar.md)

### Semânticas
- `é-caso-especial-de` **forte** — [Contexto de Execução e Axiomas](../contexto-de-execucao.md): o Axioma 9 desenvolvido como divisão do trabalho
- `complementa` **moderada** — [Investida Extra](investida-extra.md): a investida de WhatsApp é trabalho de agentes
- `complementa` **forte** — [Agente de Busca do WhatsApp](../referencia/agente-whatsapp.md): o prompt que os agentes recebem

### Funcionais
- `amplifica` **forte** — [Etapa 9 — WhatsApp da Empresa](../etapas/09-whatsapp-empresa.md): os agentes alcançam o número que o script não alcança
