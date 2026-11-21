---
id: etapas.01-captar
nome: Etapa 1 — Captar
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  O MazyOS Scraper traz tudo o que o Google Maps entregar para os termos do nicho
  em todos os bairros, um depois do outro, sem filtro; as fichas viram o leads.json.

em-uma-palavra: Captar

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Etapa 1 — Captar

> A captação traz tudo, sem filtro. O Maps ordena por relevância e não filtra por categoria: a lista bruta vem com muito lixo, e isso é esperado. Limpar é das etapas seguintes.

---

## Como fazer

1. **Pasta e config.** Crie `comercial/listas/<nicho>-<n>/` e o `config.json` a partir de [config.exemplo.json](../config.exemplo.json): nicho, termos, bairros (nome e cidade; a coordenada pode ficar vazia), rodadas anteriores a excluir, caminhos do scraper, do Serper, da Evolution e da Receita. Depois: `node scripts/serper-saldo.js --dir <rodada>`.
2. **Busca.** `node scripts/buscar-maps.js --dir <rodada>`, em segundo plano. Ele confere se o scraper responde em `http://localhost:8090/api/v1/jobs` e o sobe escondido se precisar; acha a coordenada de cada bairro sem coordenada (mapa grátis; se nenhum conhecer o bairro, o Google pelo Serper, 1 crédito) e grava no config; roda **todos os bairros seguidos**, um trabalho por bairro; usa o parcial se o trabalho travar por 6 minutos ou passar de 30; grava cada CSV em `bruto/maps/`.
3. **Junta.** `node scripts/juntar-leads.js --dir <rodada>`: junta os CSVs, tira fichas repetidas entre bairros vizinhos e cria o `leads.json`. Com `config.rodadasAnteriores`, a ficha que já estava numa rodada anterior sai com registro: o script reconhece a ficha pelo identificador do Google no link do Maps, procurado em qualquer arquivo da pasta antiga (`leads.json`, `dados.json`, csv, html), e diz quantas fichas conhece de cada rodada antiga. Se disser "não achei nenhuma ficha" numa rodada antiga, anote no `rodada.md` e siga. Telefone igual vira só aviso ("mesmo grupo?"), porque empresas diferentes do mesmo grupo dividem número.
4. `node scripts/auditar.js --dir <rodada> --etapa captar`. Informe em uma linha: fichas brutas, únicas, tiradas por rodada anterior, quantas já têm site na ficha. Siga para a etapa 2.

## Regras

- **Esta é a etapa de pegar muito lead.** Raio de 3 km por bairro e profundidade 12 (o quanto o scraper rola a lista do Maps em cada termo) são o padrão: não copie raio menor de outra rodada. Raio de 1,5 km e profundidade 6 trouxeram só uns 100 a 200 leads por bairro. Para mudar: `raioM` em cada bairro, ou `scraper.raioM` e `scraper.profundidade` para todos.
- Não filtre nada aqui, nem por site.
- Uma rodada grande por dia: volume alto faz o Google bloquear o scraper.
- O processo do scraper morre se o terminal que o abriu fechar: o script o sobe desacoplado; confira `/api/v1/jobs` se a busca parar.
- Nunca apague no painel do scraper um trabalho que não foi criado nesta rodada, e nunca rode duas captações ao mesmo tempo (o script reinicia o scraper quando um trabalho trava).
- **Termos: comece com 6 a 8, bem diferentes entre si; se o operador deu mais, rode o resto numa segunda passada.** A maioria das fichas se repete entre termos, mas cada termo pega algo que os outros não pegam ("escola bilíngue infantil" achou 7 sozinho). Numa rodada de educação infantil em SJC, 8 termos acharam 307 escolas únicas e os 12 termos restantes do pedido (variações como "educação infantil particular" e "escola de educação infantil") acharam mais 88 (+29%). Termo parecido ainda rende; o custo é só tempo (uns 17 minutos por passada em 9 bairros).
- **Segunda passada:** guarde os CSVs da primeira em outra pasta (`bruto/maps-passada-a/`) e esvazie `bruto/maps/` (o script pula bairro que já tem CSV), troque `nicho.termos` pelos termos restantes e rode `buscar-maps.js` de novo. `juntar-leads.js` soma só as fichas novas ao `leads.json`.
- **Tempo por bairro:** teto de 30 min e 6 min sem crescer (o raio e a profundidade maiores deixam cada bairro mais lento; o teto antigo de 12 min cortava ficha). Para mudar: `scraper.tetoMin` e `scraper.paradoMin`.
- O Maps devolve também o entorno do bairro buscado; a ficha guarda o bairro real (`bairro_ficha`), que o cartão mostra. Não tire por isso.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axioma 2
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): a primeira aplicação do ritmo
- `é-pré-requisito-de` **forte** — [Etapa 2 — Nicho Por Cima](02-nicho-por-cima.md): o leads.json bruto é a entrada do filtro

### Funcionais
- `habilita` **forte** — [Etapa 2 — Nicho Por Cima](02-nicho-por-cima.md): sem fichas, não há o que filtrar
