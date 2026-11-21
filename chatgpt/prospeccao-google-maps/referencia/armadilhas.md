---
id: referencia.armadilhas
nome: Armadilhas Já Encontradas
tipo: heurística
camada: 8-referência
status: ativo

essencia: >
  Os erros reais que custaram retrabalho, créditos ou a confiança do operador, cada
  um com a regra que o evita e a etapa onde ele costuma voltar.

em-uma-palavra: Armadilhas

certeza: estabelecido
maturidade: consolidado
origem: empírica
---
# Armadilhas Já Encontradas

> Cada linha aconteceu numa rodada real. Antes de cada etapa, passe os olhos nas linhas dela.

---

## Conduta

| Armadilha | Regra | Etapa |
|---|---|---|
| Fazer tudo de uma vez, olhando fundo cedo demais, e errar nas duas direções | Peneira em camadas: cada etapa só com a sua pergunta | todas |
| Exigir prova de identidade de cada Instagram antes de seguir (a lista caiu para 16) | O perfil entra; o que não bate vira aviso | 4 |
| Perguntar "posso seguir?" a cada etapa | Rodada autônoma: só para por ação humana indispensável | todas |
| Fazer o que o operador não pediu no meio de uma conversa (abrir lista, regerar, rodar teste) | Quando ele pergunta, responda; quando pede uma etapa, rode só ela | todas |
| Respostas longas e tabelas no meio do caminho | Uma ou duas linhas por etapa; o funil completo só na entrega | todas |
| Dizer um número de cabeça ("uns 1.600") | Todo número sai do arquivo, na hora | todas |
| Comparar pontos diferentes do funil (311 antes de tirar os com site contra 63 depois) | Compare sempre a mesma etapa nas duas rodadas | todas |

## Lista

| Armadilha | Regra | Etapa |
|---|---|---|
| Uma página por etapa, cada uma com chave nova: o que o operador apagou voltava nas seguintes (23 leads voltaram) | Uma página por rodada, chave `rodada-<pasta>`; exclusões lidas antes de cada etapa | todas |
| O leitor de marcações confundia "lista:x" com "lista:x-v2" | Chave exata (`marcacoes-chrome.js` já compara assim) | todas |
| Subtítulo com o total do arquivo (124) e a tela com 85 | O subtítulo conta só os ativos, já sem os apagados | todas |
| Separar por cidade quando o operador quer tudo junto | Cidades juntas; a cidade fica no cartão | todas |
| Domínio que não funciona misturado com sem site | Abas pelo tipo de site e pelo WhatsApp | 3, 6, 12 |
| Cartão sem o link do site para conferir | Todo site achado vira botão, com o resultado do teste | 3, 6 |
| Tabela improvisada em vez do design dele | Toda lista sai de `lista/gerar.js` via `lista-montar.js` | todas |

## Nicho

| Armadilha | Regra | Etapa |
|---|---|---|
| Ginásio e academia passaram no filtro por cima (o primeiro cartão que ele abriu) | Classifique todas as categorias; outro ramo que aparece por proximidade é de fora | 2 |
| Filtro de nome exigindo "infantil" derrubou escola boa | Categoria primeiro; nome só para o claramente de fora | 2 |
| Creche de cachorro (pet) com nome de escola | A bio decide; pet é de fora | 5 |
| Academia de bebê tratada como fora do nicho | O nicho é o que ele atende ("coisa pra criança" entra) | 2, 5 |
| "Brechó infantil" passou porque tinha "infantil" | Categoria de loja é de fora | 2 |

## Site

| Armadilha | Regra | Etapa |
|---|---|---|
| Link da bio para a busca do Google, `ip-api`, Sympla e Canva contados como site | Lista de não-sites no script; site só com prova de ser da empresa | 3, 6 |
| Telefone e e-mail de dentro de um Linktree testados como domínio ("http://tel:…") | Hubs: só links de site viram candidato (`site-checar.js` já ignora telefone e e-mail) | 6 |
| Diretório, guia ou mapa contado como site (tirou 17 leads sem motivo) | Diretório não é site; site do Google só com telefone na página ou nome no domínio mais cidade | 6 |
| 403, timeout e Cloudflare contados como domínio morto | Reabrir no Chrome; sem resposta = dúvida | 3, 6 |
| Site da mantenedora (outra entidade) contado como site da escola | Sem o nome ou o telefone da escola na página: dúvida | 3, 6 |
| Só a ficha do Maps conferida: o operador achou domínios mortos na bio | Etapa 6 abre todos os links da bio | 6 |
| O hub da bio apagava o domínio morto da ficha | O resultado mais forte vale; domínio morto da ficha continua | 6 |
| Site muito ruim que o operador quer manter | `ajustar.js --site-ruim`; o lead volta e não é testado de novo | 6 |
| Página de agenda online (AppBarber, Booksy) contada como site e tirando a barbearia | Agenda, cardápio e delivery não são site | 3, 6 |
| Chrome headless sem perfil próprio: pode abrir uma aba na janela do operador | Todo Chrome dos scripts usa uma pasta de perfil própria | 3, 5, 6 |

## Instagram e bio

| Armadilha | Regra | Etapa |
|---|---|---|
| Descartar o trecho da busca que era a bio (311 créditos refeitos) | Salve a resposta inteira de toda consulta paga | 4 |
| O mesmo @ para várias fichas de nome genérico, juntadas como uma empresa | Junta só com o mesmo telefone ou endereço; senão, aviso nos dois | 4, 12 |
| Perfil de outra cidade, de prefeitura ou de entidade | Aviso "confira o Instagram"; a bio confirma | 4, 5 |
| Bio de 8 leads vazia porque o @ veio da ficha (sem busca) | A etapa 5 lê no Chrome todos os perfis, não só os da busca | 5 |
| ChatGPT, força bruta de @ e busca na web do agente para achar Instagram: zero acertos | O caminho que rende é o telefone da ficha no Serper | 4 |

## WhatsApp e CNPJ

| Armadilha | Regra | Etapa |
|---|---|---|
| Rodar o WhatsApp do dono sem `--cnpj`: nenhum celular do cadastro testado | `whats-achar.js --cnpj` antes do teste | 10 |
| Números com WhatsApp apagados por virem só de um CNPJ a conferir | Nunca apague número confirmado; rotule "a conferir" | 10 |
| Agentes buscando no DuckDuckGo e no Bing: captcha e lixo | Entregue aos agentes as respostas do Serper já salvas | 9, 11 |
| WhatsApp de diretório, imobiliária ou outra escola pego no Google | Agente só aceita número que viu numa página que cita a escola | 11 |
| Segunda investida por Facebook e LinkedIn: 0 em 21 | Uma investida só | 11 |
| Botão de WhatsApp em fixo | Só número confirmado na Evolution vira botão | 9 |
| Celular de 8 dígitos tratado como fixo | DDD + 9 dígitos antes do teste | 9, 10 |
| Evolution fora do ar (Docker desligado) | `whats-testar.js` liga o Docker e sobe os contêineres | 9 |
| CNPJ de homônimo sugerido pelo Google | Só vale com o endereço batendo na Receita | 7 |
| Dono tirado de busca livre do Google (veio obituário) | Dono só do quadro societário ou da razão social | 7 |
| Mesmo telefone em escolas diferentes do mesmo dono | Aviso de grupo; não tire | 9, 12 |

## Ferramentas

| Armadilha | Regra | Etapa |
|---|---|---|
| `--help` executou a etapa inteira | Todo script mostra só o cabeçalho com `--help` (`lib.js` cuida disso) | todas |
| Script rodado sem `--dir` criou um `leads.json` vazio na pasta dos scripts | Sem `config.json` na pasta, o script para | todas |
| Regex editada por heredoc ou `node -e` no Bash perde a barra invertida | Edite regex só com a ferramenta de edição; teste com `node --check` | todas |
| Processo em segundo plano lançado dentro de um subshell morreu no meio | Lance o script diretamente em segundo plano | 1, 7 |
| Janela de navegador aberta na tela do operador | Chrome headless ou `curl`; nunca Playwright | todas |
| Coordenada de bairro que o mapa grátis não conhece | O script tenta o Google pelo Serper (places, 1 crédito) | 1 |
| Saldo do Serper estimado pelo log de outra rodada | `serper-saldo.js` consulta o saldo real | todas |
| Config de escolas copiado para outro nicho: cartões "Escola infantil", etapa 8 rodando, palavra do nicho valendo como nome | Monte o config pela tabela da Rodada Autônoma | começo |
| Rodada antiga sem `leads.json` não excluída | `juntar-leads.js` procura as fichas em qualquer arquivo e avisa quando não acha | 1 |
| Editar o `leads.json` à mão | `ajustar.js` para ajustes pontuais | todas |

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md)
- **Irmãos:** [Ferramentas e Dados](ferramentas-e-dados.md), [Lembrete de Etapas](lembrete-de-etapas.md), [Agente de Busca do WhatsApp](agente-whatsapp.md)

### Semânticas
- `complementa` **forte** — [Verificar Antes de Afirmar](../como-conduzir/verificar-antes-de-afirmar.md): os falsos positivos que já enganaram a skill
- `complementa` **moderada** — [Lembrete de Etapas](lembrete-de-etapas.md): o que costuma ser esquecido, em forma curta

### Funcionais
- `restringe` **forte** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): cada armadilha é uma regra que a rodada não quebra
