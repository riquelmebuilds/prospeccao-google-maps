---
id: etapas.05-bio
nome: Etapa 5 — Bio
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  Você lê a bio de cada perfil no Chrome headless, com os links, e decide lead a lead:
  o que a empresa é, se está claramente fora do nicho e se o perfil parece de outra
  empresa; só o claramente de fora sai.

em-uma-palavra: Bio

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Etapa 5 — Bio

> A bio mostra o que o Maps esconde: creche de cachorro com nome de escola, perfil de outra cidade, o link do site, o WhatsApp. Ler a bio é seu trabalho, e é por isso que ela é uma etapa: você lê, julga e anota, e os links que saem daqui alimentam o site a fundo e o WhatsApp.

---

## Como fazer

1. **Ler.** `node scripts/bio-chrome.js --dir <rodada>`, em segundo plano: abre cada perfil no Chrome sem janela, lê nome, seguidores, texto da bio e os links, e grava em `lead.bio` e em `bruto/bio/`. Sem crédito, uns 5 a 10 segundos por perfil, retomável. Para quem o Chrome não conseguir ler, o trecho do Google (etapa 4) serve de bio.
2. **Bloqueio.** O script para sozinho depois de 3 perfis bloqueados seguidos. Peça então ao operador para entrar numa conta do Instagram na janela que `bio-chrome.js --dir <rodada> --login` abre e fechar a janela depois; rode a leitura de novo (ela retoma). Bloqueios soltos, sem parar o script, não pedem nada: esses leads ficam com o trecho do Google. Os que ficarem sem bio **e** sem trecho (em geral, o @ que veio da ficha do Maps) vão para `bio-scrape.js --dir <rodada> --bloqueados`, que lê só esses pelo Serper (10 créditos por perfil; veja o custo antes com `--simular`).
3. **Montar a leitura.** `node scripts/bio-decidir.js --dir <rodada> --listar` escreve `bruto/bio-para-ler.md`: uma linha por lead com nome, categoria, cidade, bio, links, nome do perfil, a pista dos sinais do nicho e os avisos da etapa 4.
4. **Decidir.** Leia o arquivo e escreva `bruto/bio-decisoes.json`, um item por lead:
   - `nicho`: **`fora`** só quando a bio mostra claramente outro ramo ou outro público (creche de cachorro, loja de roupa infantil, perfil pessoal, escola pública numa rodada de particulares); **`duvida`** quando a bio não deixa claro; **`dentro`** no resto;
   - `motivo`: o que a bio mostra, quando `fora` ou `duvida`;
   - `o_que_e`: uma frase concreta do que a empresa é e oferece ("Berçário e educação infantil, 4 meses a 5 anos", "Academia de desenvolvimento para bebês");
   - `suspeito`: o motivo, se o perfil parece de outra empresa ou de outra cidade (bio cita outro estado, perfil de pessoa, de prefeitura ou de entidade); **`"ok"`** se a bio confirma um perfil que tinha aviso da etapa 4 (o aviso sai); senão vazio. Se a bio mostra que o @ é de outra empresa e a busca salva (`bruto/instagram/<chave>.json`) tem o @ certo, troque com `node scripts/ajustar.js --dir <rodada> --chave <l-xxxx> --instagram <@certo>` e rode `bio-chrome.js` de novo; sem o @ certo, deixe o aviso;
   - `porte` (só quando há `config.nicho.criterioPorte`): o que a bio e os links mostram sobre o critério ("4 barbeiros na agenda", "não deu pra contar"). Quando o critério só aparece numa página (agenda online, site), abra o link da bio no Chrome headless e conte; com mais de 30 leads assim, use agentes em lotes de 10, com a mesma regra. Quem mostra **claramente** que não atende ganha `nicho: fora` com esse motivo; quem não mostra fica, com o aviso.
   - Quando a oferta do operador é algo que o lead pode já ter (um sistema de agendamento, por exemplo), escreva no `o_que_e` o que ele já usa ("agenda pelo AppBarber"): é informação, não motivo para tirar.
   Com mais de 150 leads, divida a leitura em blocos de 50; o arquivo de decisões pode ser aplicado em partes.
5. **Aplicar.** `node scripts/bio-decidir.js --dir <rodada> --aplicar bruto/bio-decisoes.json` (caminho relativo à pasta da rodada). `fora` sai com o motivo; `duvida`, `suspeito` e `porte` viram aviso no cartão.
6. Auditor (`--etapa bio`), lista, uma linha para o operador. Siga para a etapa 6.

## Regras de decisão

- **Só sai o claramente de fora.** Na dúvida, `duvida`: o operador apaga num segundo.
- **O nicho é o que o operador atende:** em escolas infantis, academia de bebê, espaço de desenvolvimento infantil e escola bilíngue entram; creche de cachorro e hotel de pet não.
- **Perfil suspeito não sai:** o aviso basta. Sai só se a bio provar que o perfil é de outra coisa e o lead, por isso, fica sem Instagram dele.
- Anote no `o_que_e` o que a bio mostra e o Maps esconde: faixa de idade, unidades, franquia, método.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axiomas 2 e 3
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): uma aplicação do ritmo
- `pressupõe` **forte** — [Etapa 4 — Instagram](04-instagram.md): lê o perfil que a etapa 4 achou
- `é-pré-requisito-de` **forte** — [Etapa 6 — Site a Fundo](06-site-a-fundo.md): os links da bio são a matéria do site a fundo

### Funcionais
- `habilita` **forte** — [Etapa 6 — Site a Fundo](06-site-a-fundo.md): sem os links, o site escondido não aparece
