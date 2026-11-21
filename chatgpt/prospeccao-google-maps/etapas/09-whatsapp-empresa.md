---
id: etapas.09-whatsapp-empresa
nome: Etapa 9 — WhatsApp da Empresa
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  Junte todo número que a empresa deixa à vista (ficha do Maps, bio, links da bio,
  Linktree, site), teste todos na Evolution e mande agentes atrás dos que ficaram
  sem nenhum; só número confirmado vira botão.

em-uma-palavra: WhatsApp

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Etapa 9 — WhatsApp da Empresa

> O operador chama primeiro o WhatsApp da empresa, o número que ela deixa à vista para os clientes. Esta etapa junta esses números, testa cada um e procura com agentes o que não está à vista. O do dono vem na etapa 10.

---

## Como fazer

1. **Juntar.** `node scripts/whats-achar.js --dir <rodada>` reúne, com a fonte de cada um: o texto da bio ("Whats: (19) 9…"), links `wa.me` e `api.whatsapp.com`, encurtadores resolvidos, Linktree e parecidos, o telefone da ficha do Maps, outras fichas e os números já achados nos sites (etapas 3 e 6). Os telefones do CNPJ ficam para a etapa 10.
2. **Testar.** `node scripts/whats-testar.js --dir <rodada>` consulta todos os números na Evolution e grava se tem WhatsApp e o perfil comercial. Se a Evolution estiver fora do ar, o script liga o Docker Desktop e sobe os contêineres sozinho; se a instância estiver desconectada, ele abre o QR, e você pede ao operador para ler no celular.
3. **Agentes nos sem número.** `node scripts/whats-lotes.js --dir <rodada>` divide em lotes de 10 os leads sem nenhum WhatsApp confirmado. Dispare um agente por lote, até 5 em paralelo, em segundo plano, com o prompt de [Agente de Busca do WhatsApp](../referencia/agente-whatsapp.md) (modo busca). Cada um grava `bruto/whats-lotes/resultado-NN.json`.
4. `node scripts/whats-aplicar.js --dir <rodada>` põe os números achados nos leads (ignora número sem fonte, de outra empresa ou de contador); `whats-testar.js` de novo testa só os novos.
5. Abra 3 números achados por agentes diferentes e confira que estão na página citada.
6. Auditor (`--etapa whats`), lista (a partir desta etapa, com abas com e sem WhatsApp), uma linha para o operador. Siga para a etapa 10.

## Regras

- **Todos os números entram no teste**, não só o primeiro: o fixo da bio às vezes tem WhatsApp, o celular da ficha às vezes não.
- Só vira botão o número que a Evolution confirma. Fixo sem WhatsApp aparece em "números sem WhatsApp".
- Celular com 8 dígitos (comum em cadastro antigo) recebe o 9 antes do teste. O link é `https://wa.me/55<dígitos>`.
- A Evolution diz se o número **tem** WhatsApp, não **de quem é**: a identidade vem da fonte. Perfil comercial de outra atividade (contabilidade, outra escola) indica número de terceiro.
- O mesmo número em empresas diferentes costuma ser o mesmo dono ou uma central: marque, não tire.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axiomas 6 e 9
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): uma aplicação do ritmo
- `pressupõe` **moderada** — [Etapa 8 — Particular ou Pública](08-particular-ou-publica.md): procura o número de quem segue na rodada
- `é-pré-requisito-de` **forte** — [Etapa 10 — WhatsApp do Dono](10-whatsapp-dono.md): o dono é o segundo número, depois do da empresa

### Funcionais
- `habilita` **forte** — [Etapa 10 — WhatsApp do Dono](10-whatsapp-dono.md): os números da empresa já testados não se confundem com o do dono
