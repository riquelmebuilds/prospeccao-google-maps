---
id: etapas.11-investida-whatsapp
nome: Etapa 11 — Investida nos Sem WhatsApp
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  Quando sobram muitos sem WhatsApp, uma passada de Google e Facebook pelo Serper,
  com agentes conferindo de quem é cada número; uma vez só, e o que sobra fica no
  grupo sem WhatsApp.

em-uma-palavra: Investida

certeza: consensual
maturidade: seminal
origem: empírica
---
# Etapa 11 — Investida nos Sem WhatsApp

> Parte dos leads sem WhatsApp tem o número num lugar que a bio não mostra: o botão do Facebook, o cadastro de escolas da prefeitura, um diretório. Uma passada a mais recupera perto de um em quatro. Os resultados do Google vêm cheios de número de outra empresa, por isso os agentes conferem cada um.

---

## Quando rodar

Conte os leads sem nenhum WhatsApp que valha (`whats-investida.js --simular` conta: número só do cadastro de um CNPJ a conferir não vale). Rode se forem **10 ou mais, ou 20% ou mais** dos leads ([Investida Extra](../como-conduzir/investida-extra.md)). Abaixo disso, pule para a etapa 12 e anote no `rodada.md`.

## Como fazer

1. `node scripts/whats-investida.js --dir <rodada>` (3 créditos por lead: `"<nome> <cidade> whatsapp"`, `"<nome> <rua> telefone contato"` e `"<nome> <cidade> site:facebook.com"`). Grava as respostas inteiras em `bruto/whats-investida/` e monta os lotes `bruto/whats-lotes/investida-NN.json` (7 leads cada), com os dados do lead, os números e as páginas de redes que apareceram.
2. Dispare um agente por lote, até 5 em paralelo, em segundo plano, com o prompt de [Agente de Busca do WhatsApp](../referencia/agente-whatsapp.md) (modo investida). Cada um grava `bruto/whats-lotes/investida-resultado-NN.json`.
3. `node scripts/whats-aplicar.js --dir <rodada>` e `node scripts/whats-testar.js --dir <rodada>`. O `whats-aplicar.js` também transforma em aviso no cartão o campo `lead_errado` que o agente preencher (Instagram de outra empresa, não é do nicho, de outro estado): ninguém sai por isso; o operador decide na lista final.
4. Anote no `rodada.md` quantos números a investida achou e quantos créditos gastou.
5. Auditor (`--etapa whats`), lista, uma linha para o operador. Siga para a etapa 12.

## Regras

- **Uma passada só.** Uma segunda passada por Facebook e LinkedIn, numa rodada de escolas, achou 0 em 21: não repita.
- Número achado só em diretório ou só pelo cadastro do CNPJ entra com o rótulo da fonte; o operador vê de onde veio.
- O que sobra sem WhatsApp fica no grupo "sem WhatsApp": o contato é pelo Instagram, e o operador decide se mantém.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axioma 7
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): uma aplicação do ritmo
- `pressupõe` **forte** — [Etapa 10 — WhatsApp do Dono](10-whatsapp-dono.md): só entra quem segue sem nenhum número
- `é-pré-requisito-de` **moderada** — [Etapa 12 — Lista Final](12-lista-final.md): fecha os números antes da entrega

### Funcionais
- `habilita` **moderada** — [Etapa 12 — Lista Final](12-lista-final.md): a lista sai com todo número que dava para achar
