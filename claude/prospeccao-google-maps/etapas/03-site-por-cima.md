---
id: etapas.03-site-por-cima
nome: Etapa 3 — Site Por Cima
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  Abra só o link de site que a ficha do Maps traz; quem tem site funcionando e da
  empresa sai antes do Instagram, domínio que não funciona fica num grupo próprio,
  o resto segue.

em-uma-palavra: Site

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Etapa 3 — Site Por Cima

> Esta etapa vem antes do Instagram de propósito: o nicho de escolas, por exemplo, quase sempre põe o site na ficha, e tirar essas fichas aqui faz o resto da rodada rodar em bem menos leads. Ela olha só o link da ficha; o site escondido na bio ou no Linktree é achado na etapa 6.

---

## Como fazer

1. `node scripts/site-checar.js --dir <rodada> --fase rapida`. Com mais de 100 leads, rode 4 processos em segundo plano (`--lote 1/4` a `--lote 4/4`) e, quando todos terminarem, `--fase rapida --juntar-lotes`, que aplica e tira os de site funcionando.
2. Para cada link da ficha, o script testa o DNS, abre a página (com e sem `www`, https e http, com Chrome headless quando a página é feita em JavaScript) e classifica:

| Classe | Critério | Destino |
|---|---|---|
| `real` | abre, tem conteúdo **e** prova ser da empresa (telefone da empresa na página, nome dela no domínio ou no título) | **sai** (`removidos.csv`, com o endereço e a prova) |
| `duvida` | abre, mas sem prova de ser da empresa; página de construtor (Canva, Wix gratuito); bloqueio de robô | fica, grupo "site em dúvida" (a etapa 6 olha de novo) |
| `morto` | sem DNS, timeout ou erro na página inicial; domínio estacionado, à venda ou "em construção" | fica, grupo "domínio que não funciona" |
| `hub` | página de links, rede social, WhatsApp, diretório, evento, formulário | fica, sem site |
| `sem` | a ficha não tem link | fica, sem site |

3. Os números de WhatsApp que aparecem nas páginas abertas ficam guardados no lead (`whats_achados`) para a etapa 9.
4. Auditor (`--etapa site`), lista, uma linha para o operador. Siga para a etapa 4.

## Regras

- **Quando a oferta não é site** (`config.tirarQuemTemSite: false`), a etapa roda igual e ninguém sai: quem tem site funcionando fica no grupo "Tem site", com o link e o resultado no cartão.
- Domínio que redireciona para um Linktree **não é site**. Página de agenda online (AppBarber, Booksy, Trinks, Avec), de cardápio ou de delivery também não: é ferramenta, não site da empresa.
- Certificado vencido com o site no ar é `real` (se tiver prova); 403 ou Cloudflare é `duvida`, nunca `morto`.
- Nesta etapa não se gasta crédito: o Google só entra na etapa 6, com a busca já salva da etapa 4.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axiomas 2 e 6
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): uma aplicação do ritmo
- `pressupõe` **forte** — [Etapa 2 — Nicho Por Cima](02-nicho-por-cima.md): só confere o site de quem é do nicho
- `é-pré-requisito-de` **forte** — [Etapa 4 — Instagram](04-instagram.md): a busca paga roda só em quem não tem site na ficha

### Funcionais
- `habilita` **forte** — [Etapa 4 — Instagram](04-instagram.md): menos leads, menos créditos
