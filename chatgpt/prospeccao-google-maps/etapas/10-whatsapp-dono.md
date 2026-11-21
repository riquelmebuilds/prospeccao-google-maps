---
id: etapas.10-whatsapp-dono
nome: Etapa 10 — WhatsApp do Dono
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  Teste os telefones do cadastro do CNPJ; o celular com WhatsApp de um CNPJ
  confirmado com dono vira o segundo botão, "WhatsApp do dono (provável)"; os
  outros ficam rotulados, nunca apagados.

em-uma-palavra: Dono

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Etapa 10 — WhatsApp do Dono

> O operador quer dois números: o da empresa e o do dono. Se o primeiro não responde, ele chama o segundo. O do dono costuma ser o celular que está no cadastro do CNPJ.

---

## Como fazer

1. `node scripts/whats-achar.js --dir <rodada> --cnpj`: junta aos números do lead os telefones do cadastro do CNPJ (fonte "telefone do CNPJ").
2. `node scripts/whats-testar.js --dir <rodada>`: testa só os números novos.
3. `node scripts/whats-dono.js --dir <rodada>`:
   - **WhatsApp do dono:** celular do cadastro de um CNPJ **confirmado**, com dono, que a Evolution confirmou e que não é de contador. Sempre "provável" (no MEI, costuma ser do próprio dono; nos outros, pode ser do contador).
   - **Número só do cadastro de um CNPJ a conferir:** fica, com o rótulo "WhatsApp do cadastro do CNPJ (a conferir)": pode ser de outra empresa no mesmo endereço.
   - **Perfil comercial de contabilidade:** marcado como contador, nunca vira botão.
4. Auditor (`--etapa whats`), lista, uma linha para o operador (quantos ficaram com dois WhatsApps). Siga para a etapa 11.

## Regras

- Sem WhatsApp do dono não é problema: o da empresa continua valendo.
- Nunca apague um número que a Evolution confirmou: rotule. Um número apagado é um contato a menos para o operador.
- O mesmo número como da empresa e do dono vira um botão só, "WhatsApp da empresa (também do dono)".

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axioma 10
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): uma aplicação do ritmo
- `pressupõe` **forte** — [Etapa 7 — CNPJ](07-cnpj.md): o celular do cadastro vem da Receita
- `pressupõe` **forte** — [Etapa 9 — WhatsApp da Empresa](09-whatsapp-empresa.md): o do dono é o segundo número
- `é-pré-requisito-de` **forte** — [Etapa 11 — Investida nos Sem WhatsApp](11-investida-whatsapp.md): só vai para a investida quem segue sem nenhum

### Funcionais
- `habilita` **moderada** — [Etapa 11 — Investida nos Sem WhatsApp](11-investida-whatsapp.md): define quem ainda está sem número
