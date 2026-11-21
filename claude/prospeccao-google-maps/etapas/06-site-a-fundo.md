---
id: etapas.06-site-a-fundo
nome: Etapa 6 — Site a Fundo
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  Com a bio lida, abra todo link que o lead tem (ficha, bio, Linktree, encurtadores,
  domínios escritos na bio e sites que apareceram na busca já salva): site que
  funciona e é da empresa sai; o resto vai para o grupo certo.

em-uma-palavra: Fundo

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Etapa 6 — Site a Fundo

> A etapa 3 olhou só o link da ficha. Aqui, com a bio lida e com a busca do Instagram já salva, você acha o site que estava escondido: num link da bio, dentro de um Linktree, atrás de um encurtador, escrito no texto da bio ou num resultado do Google. Tudo isso sem pagar nada de novo.

---

## Como fazer

1. `node scripts/site-checar.js --dir <rodada> --fase fundo` (com mais de 100 leads: 4 processos `--lote i/4` e depois `--fase fundo --juntar-lotes`).
2. O script junta, para cada lead, todos os endereços: ficha do Maps, links da bio, os sites dentro de Linktree e parecidos (expandidos; telefone e e-mail desses hubs são ignorados como site), o destino dos encurtadores, os domínios escritos na bio e os sites que apareceram nos resultados da busca do Instagram (salvos na etapa 4). Abre cada um e classifica como na [etapa 3](03-site-por-cima.md). O resultado mais forte vale: funcionando > dúvida > domínio que não funciona > página de links.
3. **Identidade.** Link que a própria empresa publicou (ficha, bio) prova ser dela com o telefone na página, o nome no domínio ou o nome no título. Site que veio do Google prova só com o telefone na página, ou com o nome no domínio e a cidade na página; sem prova, é ignorado (não é do lead).
4. Quem tem site funcionando e da empresa **sai**, com o endereço e a prova no `removidos.csv`. Domínio que não funciona e site em dúvida seguem, nos grupos deles, com o link no cartão.
5. Os WhatsApps que aparecem nos sites e Linktrees abertos ficam em `whats_achados` para a etapa 9.
6. `node scripts/auditar.js --dir <rodada> --etapa site --fundo` (confere também que todo lead passou pela conferência a fundo), lista, uma linha para o operador (quantos saíram por site achado a fundo e onde ele estava). Siga para a etapa 7.

## Regras

- **Quando a oferta não é site** (`config.tirarQuemTemSite: false`), ninguém sai: quem tem site funcionando fica no grupo "Tem site", com o link no cartão.
- Domínio que não funciona na ficha continua valendo mesmo que a bio só tenha um Linktree: o lead fica no grupo de domínio que não funciona.
- Diretório, guia, mapa, rede social, evento, formulário, agenda online, cardápio, Spotify e `ip-api` não são site; a busca do Google nem é.
- Se o operador olhar um site e disser que é muito ruim e o lead fica: `node scripts/ajustar.js --dir <rodada> --chave <l-xxxx> --site-ruim "o motivo dele"`. O lead volta, nenhuma etapa testa o site de novo e o cartão diz "site muito ruim (você mandou manter)".
- `--google` (busca nova, 1 crédito por lead) quase nunca é preciso: a busca da etapa 4 já trouxe o Google. Use só se o operador pedir.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axiomas 5 e 6
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): uma aplicação do ritmo
- `pressupõe` **forte** — [Etapa 5 — Bio](05-bio.md): usa os links que a bio trouxe
- `é-pré-requisito-de` **forte** — [Etapa 7 — CNPJ](07-cnpj.md): a Receita é varrida só para quem segue sem site

### Funcionais
- `habilita` **moderada** — [Etapa 7 — CNPJ](07-cnpj.md): a lista que segue é a dos sem site
