---
id: etapas.12-lista-final
nome: Etapa 12 — Lista Final
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  Aplique as últimas exclusões do operador, junte as fichas da mesma empresa, rode
  o auditor inteiro, gere a última versão da lista viva, abra no Chrome e entregue
  o funil em poucas linhas; o filtro final é dele.

em-uma-palavra: Entrega

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Etapa 12 — Lista Final

> A entrega é a última versão da lista viva: a mesma página, com as cidades juntas e as abas pelo tipo de site e pelo WhatsApp. O operador recebe a lista e o funil, filtra com o olho dele e começa a chamar.

---

## Como fazer

1. `node scripts/marcacoes-chrome.js --dir <rodada> --aplicar` (as últimas exclusões dele).
2. `node scripts/final-juntar.js --dir <rodada> --aplicar`: junta as fichas com o mesmo CNPJ confirmado, ou com o mesmo Instagram e o mesmo telefone ou endereço (a outra ficha vai para o cartão); marca o WhatsApp dividido entre empresas; imprime o funil e grava o `rodada.md` (funil por etapa, abas, créditos por etapa e a seção "Decisões e travas", onde ficam as suas anotações da rodada).
3. `node scripts/lista-montar.js --dir <rodada> --etapa "lista final"` (sem abrir ainda).
4. `node scripts/auditar.js --dir <rodada>` (todas as etapas, inclusive a lista): tem que sair limpo. Se acusar algo, corrija, regere a lista e audite de novo.
5. `node scripts/lista-montar.js --dir <rodada> --etapa "lista final" --abrir`: a página abre no Chrome do operador.
6. Entregue ao operador, curto (os números saem do `final-juntar.js`):

```
Lista pronta: <N> leads (aberta no Chrome).
- Sem site · com WhatsApp: <n> · Sem site · sem WhatsApp: <n>
- Domínio que não funciona · com WhatsApp: <n> · sem WhatsApp: <n>
- Site em dúvida: <n> (se houver)
Com WhatsApp do dono: <n> · CNPJ confirmado: <n> · com aviso de conferir o Instagram: <n>
Funil: <captadas> fichas captadas; saíram: nicho <n>, site por cima <n>, Instagram <n>, bio <n>, site a fundo <n>, pública <n>, você apagou <n>; na lista: <final>
Créditos do Serper: <total> · saldo: <saldo estimado>
Saíram por site funcionando: <n> (estão no removidos.csv com o endereço; se algum site for muito ruim, eu devolvo)
```

## Regras

- O total que você diz é o total de cartões da página: confira um contra o outro antes de falar.
- Nenhum lead some sem registro; os removidos estão em `removidos.csv`, com o motivo e a etapa.
- A skill termina aqui. Mensagem, ligação e proposta são do operador.
- Se o operador pedir mais bairros ou outra cidade, comece uma rodada nova na etapa 1, com esta em `rodadasAnteriores`.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axiomas 4 e 10
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): a última aplicação do ritmo
- `pressupõe` **moderada** — [Etapa 11 — Investida nos Sem WhatsApp](11-investida-whatsapp.md): a lista sai com os números fechados

### Funcionais
- `valida` **forte** — [Contexto de Execução e Axiomas](../contexto-de-execucao.md): a lista final é a função objetivo cumprida
