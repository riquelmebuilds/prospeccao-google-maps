---
id: etapas.04-instagram
nome: Etapa 4 — Instagram
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  Uma busca no Serper por lead, todos de uma vez, guardando a resposta inteira;
  o perfil escolhido entra sem exigir prova e ganha aviso quando algo não bate;
  quem fica sem Instagram sai, depois da investida pelo telefone quando ela compensa.

em-uma-palavra: Instagram

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Etapa 4 — Instagram

> O operador aborda pelo Instagram e começa a conversa pelo que viu no perfil: sem Instagram não há lead. Esta etapa acha o perfil de cada um pelo Serper, de uma vez só, e não trava em prova: o que não bate vira aviso, e a bio (etapa 5) confirma ou derruba.

---

## Como fazer

1. `node scripts/instagram-serper.js --dir <rodada>` (dá para ver o custo antes com `--simular`: 1 crédito por lead). O @ que já está na ficha do Maps vale sem busca. Para os outros, busca `"<nome> <cidade> instagram"` e grava a resposta **inteira** em `bruto/instagram/<chave>.json`: o trecho do resultado costuma ser o começo da bio, e os outros resultados revelam o site na etapa 6.
2. **Escolha do perfil:** o primeiro perfil cujo @ ou título traz uma palavra distintiva do nome (palavras genéricas do nicho e o nome das cidades não contam); se nenhum traz, o primeiro perfil da busca.
3. **Avisos** (`instagram.suspeito`, aparece no cartão): o perfil não tem palavra do nome; o perfil diz outra cidade; o mesmo @ apareceu para duas empresas com telefone e endereço diferentes. Com o mesmo @ **e** o mesmo telefone ou endereço, as fichas são a mesma empresa: o script junta e guarda a outra ficha no cartão.
4. **Sem Instagram:** conte. Se forem 10 ou mais, ou 15% ou mais dos leads, faça a investida pelo telefone: `instagram-serper.js --dir <rodada> --por-telefone` (1 crédito por lead com telefone; aceita o perfil só se o @ ou o título trouxer palavra do nome, ou se o telefone aparecer no trecho). Abaixo disso, pule ([Investida Extra](../como-conduzir/investida-extra.md)).
5. Se a investida rodou, rode `instagram-serper.js --dir <rodada>` de novo, sem flag: ele não busca nada novo e junta ou marca os @ repetidos que a investida trouxe.
6. **Sempre**, com ou sem investida: `instagram-serper.js --dir <rodada> --tirar-sem-instagram`. Quem segue sem perfil sai, com registro.
7. Auditor (`--etapa instagram`), lista, uma linha para o operador (com quantos avisos). Siga para a etapa 5.

## Regras

- Não peça prova de identidade aqui. O aviso faz o trabalho, e a etapa 5 lê a bio de cada um.
- Os créditos podem acabar no meio: o script para com código 3, você abre a página da chave para o operador e retoma depois ([Rodada Autônoma](../como-conduzir/rodada-autonoma.md)).
- Lead sem site costuma ter menos Instagram (escola pequena, creche): é esperado que uma parte saia aqui.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axiomas 3 e 5
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): uma aplicação do ritmo
- `pressupõe` **forte** — [Etapa 3 — Site Por Cima](03-site-por-cima.md): só busca quem não tem site na ficha
- `é-pré-requisito-de` **forte** — [Etapa 5 — Bio](05-bio.md): o perfil achado é o que a bio lê

### Funcionais
- `habilita` **forte** — [Etapa 5 — Bio](05-bio.md): sem @, não há bio
