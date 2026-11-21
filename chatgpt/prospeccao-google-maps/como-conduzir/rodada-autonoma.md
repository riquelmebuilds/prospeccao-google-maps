---
id: como-conduzir.rodada-autonoma
nome: Rodada Autônoma
tipo: padrão
camada: 4-operacional
status: ativo

essencia: >
  Pergunte tudo no começo, numa mensagem só; depois rode as doze etapas em ordem,
  lendo as exclusões do operador antes de cada uma, regerando a lista e auditando
  no fim de cada uma, e só pare quando uma ação humana for indispensável.

em-uma-palavra: Fluxo

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Rodada Autônoma

> O operador chama a skill, responde às perguntas do começo e recebe a lista pronta. Entre uma etapa e outra você não pergunta nada: informa em uma linha e segue. A organização vem das etapas, não das perguntas.

---

## O que afirma

A rodada é uma sequência fixa de doze etapas, cada uma com regra escrita para toda decisão que aparece. Com as regras na mão, perguntar "posso seguir?" só custa atenção do operador. Você segue.

## Por que é verdade

O que travava a prospecção não era a falta de licença: era fazer tudo de uma vez, olhando fundo cedo demais. Com o trabalho dividido em camadas ([Peneira em Camadas](peneira-em-camadas.md)), cada etapa pede um julgamento pequeno e claro, e o operador ganha uma lista grande e limpa sem precisar acompanhar cada passo.

## O começo: uma mensagem com todas as perguntas

Pergunte, numa mensagem curta, o que ainda não veio no pedido:

1. **O nicho**, em uma frase, e as fronteiras dele quando houver ("só particular?", "franquia entra?").
2. **As cidades e os bairros** de cada cidade.
3. **Os termos de busca**: proponha de seis a oito, variando o ângulo (tipo de serviço, proposta pedagógica, nome que o dono dá) e não a redação do mesmo termo, e deixe o operador ajustar. Se ele mandar mais que isso, avise que termo repetido só gasta tempo.
4. **O que ele vai oferecer**: site é o padrão (quem tem site funcionando sai). Se for outra coisa (um sistema de agendamento, por exemplo), ter site não tira ninguém.
5. **Critério de porte**, se houver ("3 ou mais barbeiros", "mais de 100 avaliações"): vira informação e aviso no cartão; só sai quem mostra claramente que não atende.
6. **Rodadas anteriores** a excluir, se ele já prospectou ali (liste as pastas de `comercial/listas/` que parecem do mesmo nicho ou cidade e pergunte quais).

Com as respostas, sem perguntar mais nada:

1. **Pasta:** `comercial/listas/<nicho-em-poucas-palavras>-<n>/`, em minúsculas e com hífen; `n` é o próximo número livre para esse nicho.
2. **Config:** monte o `config.json` como descrito em "Montar o config", abaixo.
3. **Registro:** crie o `rodada.md` com o título `# Rodada <pasta>` e a seção `## Decisões e travas` (é nela que você anota, durante a rodada, cada decisão tomada sem o operador).
4. **Saldo:** `node scripts/serper-saldo.js --dir <rodada>`.
5. **Aviso de largada**, em três linhas: as etapas, o tempo estimado (de 15 a 30 minutos por bairro na captação, com raio de 3 km e profundidade 12, mais 30 a 60 minutos para o resto) e o custo (1 crédito por lead que chegar ao Instagram; o número exato sai na etapa 4).
6. **Comece.** As respostas são a licença para a rodada inteira.

## Montar o config

Parta de [config.exemplo.json](../config.exemplo.json) (o exemplo é de escolas) e do `config.json` da rodada mais recente em `comercial/listas/`:

| Chave | De onde vem |
|---|---|
| `scraper`, `serper`, `evolution`, `receita`, `chrome`, `listas.gerador` | copie da rodada mais recente: são caminhos da máquina, iguais em toda rodada |
| `nicho.nome`, `nicho.termos`, `bairros` | das respostas do operador; bairro só com `nome` e `cidade` (sem `raioM`: o padrão de 3 km e profundidade 12 pega mais lead; nunca copie o raio de outra rodada) |
| `rodadasAnteriores` | as pastas que o operador apontou: toda ficha que essas rodadas **captaram** fica de fora (não só as entregues); se ele quiser excluir só a lista entregue, aponte o arquivo dela (`.../lista/dados.json`) em vez da pasta |
| `nicho.palavrasComuns` | as palavras do nicho que aparecem no nome de quase toda empresa ("escola", "infantil"; "barbearia", "barber"): elas não servem para casar o nome com o @ ou com o domínio |
| `nicho.sinais.dentro` e `nicho.sinais.fora` | palavras que, na bio, indicam o nicho e o que não é (pistas para a sua leitura) |
| `nicho.rotulos` | o `o_que_e` padrão por regex; o último, com padrão `.`, é o nome do nicho ("Barbearia") |
| `nicho.categoriasFora`, `categoriasDentro`, `nomesFora` | escolas: mantenha as do exemplo (já testadas) e complete na etapa 2; outro nicho: deixe vazias, a etapa 2 preenche |
| `listas.titulo` | o nicho, curto ("Barbearias em Goiânia"): é o título da página |
| `nicho.publicaOuParticular` | `true` só quando o nicho é escola; em qualquer outro, `false` |
| `nicho.cnaeRx` | o CNAE do nicho: educação `^85`, cabeleireiro e barbearia `^9602`, odontologia `^8630`, oficina `^4520`, revenda de veículos `^451`, marmoraria `^2391`, advocacia `^6911`, contabilidade `^6920`; se não souber, deixe vazio |
| `tirarQuemTemSite` | `true` quando a oferta é site; `false` quando não é |
| `nicho.criterioPorte` | o critério de porte do operador, em texto, ou vazio |

## De onde rodar

Rode os scripts a partir da pasta da skill (`a pasta da skill (onde está este SKILL.md)`), sempre com `--dir <caminho absoluto da rodada>`. Os documentos escrevem `node scripts/<script>.js` por isso. Só um script que grava o `leads.json` roda de cada vez: os que vão para segundo plano (`buscar-maps.js`, `bio-chrome.js`, `cnpj-receita.js`) terminam antes do próximo começar (os lotes de `site-checar.js` gravam em arquivos próprios e podem rodar juntos).

## O ritmo de cada etapa

```
1. node scripts/marcacoes-chrome.js --dir <rodada> --aplicar     (a partir da etapa 3; "Não achei marcações" = nada a aplicar)
2. a etapa (comandos e regras no documento dela)
3. node scripts/auditar.js --dir <rodada> --etapa <a da vez>      (precisa sair limpo; corrija e rode de novo)
                                                                  1 captar · 2 nicho · 3 site · 4 instagram · 5 bio · 6 site --fundo
                                                                  7 cnpj · 8 particular · 9, 10 e 11 whats · 12 sem --etapa (todas)
4. node scripts/lista-montar.js --dir <rodada> --etapa "<nome>"   (--abrir na primeira vez, depois da etapa 2, e na etapa 12)
5. uma linha para o operador: "Etapa N feita: X → Y (o que saiu e por quê). Seguindo para a etapa N+1."
```

A lista regerada com a mesma chave mantém o que ele apagou; ele só aperta F5 ([Lista Viva](lista-viva.md)).

## As doze etapas

| # | Etapa | O que tira | Documento |
|---|---|---|---|
| 1 | Captar | nada | [01](../etapas/01-captar.md) |
| 2 | Nicho por cima | o claramente fora do nicho pela categoria e pelo nome | [02](../etapas/02-nicho-por-cima.md) |
| 3 | Site por cima | quem tem site funcionando no link da ficha do Maps | [03](../etapas/03-site-por-cima.md) |
| 4 | Instagram | quem não tem Instagram, depois da investida quando ela compensa | [04](../etapas/04-instagram.md) |
| 5 | Bio | o claramente fora do nicho pela bio | [05](../etapas/05-bio.md) |
| 6 | Site a fundo | quem tem site funcionando nos links da bio, no Linktree ou no Google | [06](../etapas/06-site-a-fundo.md) |
| 7 | CNPJ | nada | [07](../etapas/07-cnpj.md) |
| 8 | Particular ou pública (só escolas) | escola pública ou entidade | [08](../etapas/08-particular-ou-publica.md) |
| 9 | WhatsApp da empresa | nada | [09](../etapas/09-whatsapp-empresa.md) |
| 10 | WhatsApp do dono | nada | [10](../etapas/10-whatsapp-dono.md) |
| 11 | Investida nos sem WhatsApp | nada | [11](../etapas/11-investida-whatsapp.md) |
| 12 | Lista final | fichas repetidas da mesma empresa (juntadas no cartão) | [12](../etapas/12-lista-final.md) |

## Quando parar (e só aí)

| Situação | O que fazer |
|---|---|
| Créditos do Serper acabaram (o script sai com código 3) | Abra no Chrome do operador `https://serper.dev/api-keys` e, no Bloco de Notas, o arquivo da chave (`config.serper.envFile`). Peça a chave nova. Quando ele disser "pronto": `serper-saldo.js` e rode a etapa de novo (ela continua de onde parou) |
| Evolution sem conexão (o script abre o QR) | Peça ao operador para ler o QR no celular (WhatsApp → Aparelhos conectados) e avisar |
| O `bio-chrome.js` parou por bloqueio (3 perfis bloqueados seguidos) | Peça ao operador para entrar numa conta do Instagram na janela que `bio-chrome.js --login` abre e fechar a janela depois; rode a leitura de novo |
| O scraper não sobe, a base da Receita não está no lugar, o Docker não liga | Diga o que falta em uma linha e espere |

Qualquer outra situação tem regra no documento da etapa: aplique e anote no `rodada.md` (seção "Decisões e travas").

## Retomar uma rodada

Quando a sessão cai no meio, ou o operador diz "continua a rodada X": leia `lista/dados.json` (o campo `etapa` diz a última etapa concluída) e a seção "Decisões e travas" do `rodada.md`, rode `marcacoes-chrome.js --aplicar` e siga da etapa seguinte. Se a etapa em andamento não chegou ao fim, rode-a de novo: os scripts pulam o que já foi feito e não pagam duas vezes.

## Uma etapa avulsa

Se o operador pedir só uma etapa para leads que não estão numa rodada ("acha o WhatsApp destes"), crie uma rodada pequena: a pasta, o `config.json` montado como acima e o `leads.json` com os leads dele (nome, cidade, bairro, endereço, telefone, link do Maps quando tiver). Rode só a etapa pedida, com as mesmas regras, e mostre a lista.

## Como falar com o operador durante a rodada

- Uma ou duas linhas por etapa, com números ("Etapa 3 feita: 441 → 160; 281 tinham site funcionando no Maps."). Nada de tabelas no meio do caminho.
- Se ele perguntar algo no meio, responda curto e siga.
- Se ele pedir uma etapa avulsa ("acha o WhatsApp destes"), rode só ela, com as mesmas regras.
- Mostre a tabela de etapas só quando ele pedir ([Lembrete de Etapas](../referencia/lembrete-de-etapas.md)).

## O que muda

| Contexto | Sem esta conduta | Com ela |
|---|---|---|
| Etapa 3 terminou | "Posso seguir para o Instagram?" e espera | "Etapa 3 feita: 441 → 160. Seguindo para o Instagram." |
| O operador apagou 30 cartões enquanto você rodava | Os 30 voltam na etapa seguinte | As exclusões são lidas antes da etapa e nunca voltam |
| Os créditos acabam no meio da etapa 4 | A etapa falha e você improvisa | Para, abre a página da chave, espera o "pronto" e retoma |

## Tensões e limites

Autonomia não é pressa: cada etapa ainda passa pelo auditor, e o que ele acha você corrige antes de seguir. Se uma regra de etapa não cobrir um caso, escolha o caminho que tira menos lead (a dúvida vira aviso no cartão) e anote no `rodada.md`.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axioma 1
- **Irmãos:** [Peneira em Camadas](peneira-em-camadas.md), [Lista Viva](lista-viva.md), [Investida Extra](investida-extra.md), [Agentes e Velocidade](agentes-e-velocidade.md), [Salvar Tudo e Controlar o Custo](salvar-tudo-e-custos.md), [Verificar Antes de Afirmar](verificar-antes-de-afirmar.md)

### Semânticas
- `é-caso-especial-de` **forte** — [Contexto de Execução e Axiomas](../contexto-de-execucao.md): a conduta da rodada inteira deriva do Axioma 1
- `complementa` **forte** — [Lista Viva](lista-viva.md): o fim de cada etapa regera a mesma lista
- `complementa` **forte** — [Peneira em Camadas](peneira-em-camadas.md): a ordem das etapas é a ordem das camadas
- `complementa` **moderada** — [Lembrete de Etapas](../referencia/lembrete-de-etapas.md): a tabela curta para quando o operador pergunta
- `é-generalização-de` **moderada** — [Etapa 1](../etapas/01-captar.md), [Etapa 2](../etapas/02-nicho-por-cima.md), [Etapa 3](../etapas/03-site-por-cima.md), [Etapa 4](../etapas/04-instagram.md), [Etapa 5](../etapas/05-bio.md), [Etapa 6](../etapas/06-site-a-fundo.md), [Etapa 7](../etapas/07-cnpj.md), [Etapa 8](../etapas/08-particular-ou-publica.md), [Etapa 9](../etapas/09-whatsapp-empresa.md), [Etapa 10](../etapas/10-whatsapp-dono.md), [Etapa 11](../etapas/11-investida-whatsapp.md), [Etapa 12](../etapas/12-lista-final.md): cada etapa é uma aplicação do ritmo

### Funcionais
- `habilita` **forte** — [Etapa 1 — Captar](../etapas/01-captar.md): as perguntas do começo dão o config da rodada
