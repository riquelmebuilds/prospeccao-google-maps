---
id: etapas.08-particular-ou-publica
nome: Etapa 8 — Particular ou Pública
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  Só quando o nicho é escola: separe particular de pública ou entidade com três
  fontes (sinais do nome e da bio, razão social do CNPJ, Google); pública sai,
  particular segue, sem resposta segue com aviso.

em-uma-palavra: Particular

certeza: consensual
maturidade: seminal
origem: empírica
---
# Etapa 8 — Particular ou Pública

> Escola pública, creche municipal e entidade conveniada não compram site. Esta etapa existe só quando o nicho é escola (`config.nicho.publicaOuParticular: true`); nos outros nichos, pule direto para a etapa 9.

---

## Como fazer

1. `node scripts/publica-particular.js --dir <rodada>` (o custo aparece com `--simular`). Para cada lead, junta as fontes:
   - **Sinais** no nome, na categoria e na bio: "CEI", "EMEI", "municipal", "prefeitura", "conveniada", "gratuita" dizem pública; "particular", "mensalidade", "bilíngue", "Montessori", "franquia" dizem particular (regex em `config.nicho.publica`, com padrão para escolas).
   - **Razão social do CNPJ** (confirmado, ou a conferir com endereço e nome ou telefone batendo): LTDA, EPP, ME, EIRELI, nome de pessoa (empresário individual) dizem particular; associação, fundação, caixa escolar, paróquia, prefeitura, instituto dizem entidade.
   - **Google** (só para quem ficou sem resposta nas duas primeiras; 1 crédito por lead; resposta inteira em `bruto/particular/`): os resultados que citam a escola falam em mensalidade e matrícula (particular) ou em prefeitura e rede pública (pública).
2. **Decisão:** só particular → particular; só pública → **sai** com as fontes no motivo; as duas ou nenhuma → **não sei**, fica com o aviso "Particular ou pública? Não deu pra dizer".
3. Auditor (`--etapa particular`), lista, uma linha para o operador. Siga para a etapa 9.

## Regras

- "CEI" no nome pesa como pública, mas o CNPJ de empresa (LTDA, nome de pessoa) vence a dúvida: o resultado é "não sei", não "pública".
- Rede particular de franquia (academia de bebê, escola bilíngue) é particular.
- Nunca tire por "não sei": o operador decide olhando o cartão.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axioma 3
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): uma aplicação do ritmo
- `pressupõe` **forte** — [Etapa 7 — CNPJ](07-cnpj.md): a razão social é uma das fontes
- `é-pré-requisito-de` **moderada** — [Etapa 9 — WhatsApp da Empresa](09-whatsapp-empresa.md): o WhatsApp é procurado só em quem segue

### Funcionais
- `habilita` **moderada** — [Etapa 9 — WhatsApp da Empresa](09-whatsapp-empresa.md): menos leads para os agentes
