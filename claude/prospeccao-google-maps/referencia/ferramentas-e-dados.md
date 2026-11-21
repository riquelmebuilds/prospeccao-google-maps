---
id: referencia.ferramentas-e-dados
nome: Ferramentas e Dados
tipo: ferramenta
camada: 8-referência
status: ativo

essencia: >
  As ferramentas, o config.json, o registro de um lead no leads.json e o que cada
  script faz; todo script aceita --dir <rodada>, pula o que já está feito e mostra
  a ajuda com --help.

em-uma-palavra: Ferramentas

certeza: estabelecido
maturidade: consolidado
origem: empírica
---
# Ferramentas e Dados

> Os scripts leem e gravam um único registro por lead, o `leads.json`, e deixam as respostas inteiras das consultas em `bruto/`. Rode-os a partir da pasta da skill, como `node scripts/<script>.js --dir <caminho absoluto da rodada>`; todo script para se não achar o `config.json` na pasta da rodada, pula o que já está feito e mostra só a ajuda com `--help`. Nunca edite o `leads.json` à mão: para ajustes pontuais existe `ajustar.js`.

---

## As ferramentas

| Ferramenta | Para quê | Custo | Notas |
|---|---|---|---|
| **MazyOS Scraper** | Captar fichas do Google Maps | nenhum | Porta 8090 (a 8080 é da Evolution). O script sobe o programa escondido |
| **Serper** | Busca no Google | 1 crédito | Chave em `SERPER_API_KEY` (arquivo `.env` de `config.serper.envFile`); saldo real em `/account`, sem custo |
| **Chrome headless** | Ler bios e abrir sites feitos em JavaScript, sem janela | nenhum | Caminho absoluto em `--user-data-dir` |
| **Evolution API** | Saber se um número tem WhatsApp e ler o perfil comercial | nenhum | Docker; instância conectada por QR; só consulta |
| **Base da Receita** | CNPJ, situação, sócios, telefones, capital | nenhum | Zips `Estabelecimentos`, `Empresas`, `Socios` (0 a 9) e `Municipios` em `config.receita.dir` |
| **Lista MazyOS** | A página da lista | nenhum | `lista/gerar.js` (dentro da skill), chamado por `lista-montar.js` |

## O config.json

Copie de [config.exemplo.json](../config.exemplo.json). As chaves que mudam por rodada:

| Chave | O que é |
|---|---|
| `nicho.nome`, `nicho.termos` | o nicho em uma frase e os termos de busca |
| `nicho.categoriasFora`, `nicho.categoriasDentro`, `nicho.nomesFora` | regex da etapa 2 |
| `nicho.palavrasComuns` | palavras do nicho que não distinguem uma empresa (não contam para casar nome com @ ou domínio) |
| `nicho.sinais.dentro`, `nicho.sinais.fora` | pistas para a leitura da bio |
| `nicho.rotulos` | `o_que_e` padrão por regex, para quem a bio não deixou claro |
| `nicho.publicaOuParticular`, `nicho.publica` | liga a etapa 8 (só escolas) e ajusta os sinais |
| `nicho.cnaeRx` | regex do CNAE do nicho (tabela em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)); vazio, nenhum CNAE conta |
| `nicho.criterioPorte` | o critério de porte do operador, em texto (vira o campo `porte` da leitura da bio) |
| `tirarQuemTemSite` | `true` quando a oferta é site; `false` quando não é (o site vira só informação) |
| `bairros` | `{ nome, cidade }` (e `raioM` só para mudar o de um bairro); `centro` e `slug` o script preenche |
| `scraper.raioM`, `scraper.profundidade` | raio (padrão 3000 m) e profundidade (padrão 12) da captação: quanto maiores, mais leads |
| `scraper.tetoMin`, `scraper.paradoMin` | tempo máximo por bairro (padrão 30 min) e minutos sem crescer para usar o parcial (padrão 6) |
| `rodadasAnteriores` | pastas de rodadas cujas fichas não entram de novo (qualquer formato) |
| `listas.titulo`, `listas.gerador` | título da página; caminho de outro gerador de lista (vazio usa o `lista/gerar.js` da skill) |
| `scraper`, `serper`, `evolution`, `receita`, `chrome` | caminhos e chaves (iguais de uma rodada para outra) |

## O registro de um lead

```json
{
  "chave": "l-0001", "nome": "", "cidade": "", "bairro": "", "categoria": "",
  "endereco": "", "telefone": "", "site_maps": "", "maps": "", "nota": 0, "avaliacoes": 0, "aviso": "",
  "instagram": { "handle": "", "url": "", "titulo": "", "trecho": "", "fonte": "ficha do Maps | busca por nome | busca por telefone", "suspeito": "" },
  "bio": { "texto": "", "links": [], "seguidores": "", "nome_perfil": "", "bloqueado": false, "lido_em": "" },
  "nicho_bio": "dentro | duvida", "nicho_motivo": "", "o_que_e": "uma frase: o que a empresa é e oferece", "porte_aviso": "",
  "site": { "tipo": "sem | hub | morto | duvida | ruim", "url": "", "resultado": "", "candidatos": [], "fase": "rapida | fundo" },
  "whats_achados": [ { "numero": "", "fonte": "" } ],
  "cnpj": { "numero": "", "razao": "", "situacao": "", "confianca": "", "nivel": "confirmado | a_conferir", "provas": [], "dono": { "nome": "", "qualificacao": "" }, "responsavel": "", "socios": [], "telefones": [], "capital_social": "", "inicio_atividade": "" },
  "particular": { "decisao": "particular | nao_sei", "fontes": [] },
  "whats": [ { "numero": "", "fonte": "", "celular": true, "existe": true, "perfil": {}, "so_cnpj": "confirmado | a_conferir", "contador": false } ],
  "whatsapp_dono": { "numero": "", "nome": "", "prova": "" },
  "outras_fichas": [], "nota_operador": "",
  "estado": "ativo | removido", "motivo": "", "etapa_remocao": ""
}
```

Cada etapa preenche o seu bloco e não mexe nos outros.

## Os scripts

| Etapa | Script | Função |
|---|---|---|
| começo | `serper-saldo.js` | Saldo real do Serper (sem custo) |
| 1 | `buscar-maps.js`, `juntar-leads.js` | Captar (coordenadas automáticas) e consolidar; tirar rodadas anteriores |
| 2 | `filtrar-maps.js` | `--categorias` lista; `--simular` mostra; sem flag aplica |
| 3 e 6 | `site-checar.js` | `--fase rapida` (só ficha) e `--fase fundo` (ficha, bio, hubs, Google salvo); `--lote i/n` e `--juntar-lotes` |
| 4 | `instagram-serper.js` | Busca por nome; `--por-telefone` (investida); `--tirar-sem-instagram` |
| 5 | `bio-chrome.js`, `bio-decidir.js`, `bio-scrape.js` | Ler a bio; `--listar` e `--aplicar` as suas decisões; reserva paga |
| 7 | `cnpj-receita.js`, `cnpj-refinar.js` | Receita; nível e dono |
| 8 | `publica-particular.js` | Particular ou pública (só escolas) |
| 9 | `whats-achar.js`, `whats-testar.js`, `whats-lotes.js`, `whats-aplicar.js` | Juntar, testar (liga a Evolution sozinho), lotes e resultados dos agentes |
| 10 | `whats-achar.js --cnpj`, `whats-dono.js` | Telefones do cadastro; WhatsApp do dono |
| 11 | `whats-investida.js` | Google e Facebook dos sem WhatsApp; lotes para os agentes |
| 12 | `final-juntar.js` | Juntar fichas, funil, `rodada.md` |
| todas | `marcacoes-chrome.js`, `lista-montar.js`, `auditar.js` | Exclusões do operador; a lista viva; a auditoria (`--etapa captar`, `nicho`, `site` [`--fundo`], `instagram`, `bio`, `cnpj`, `particular`, `whats`, `lista`) |
| quando preciso | `ajustar.js` | Site ruim que o operador quer manter (`--site-ruim`), aviso (`--aviso`), trocar um @ errado (`--instagram`), devolver lead tirado por engano (`--devolver`) |

Opções raras, fora do fluxo normal: `site-checar.js --sem-remover` (testa sem tirar ninguém) e `--google` (busca nova de site, 1 crédito por lead); `whats-achar.js --google` e `--so-sem-whatsapp` (a etapa 11 faz melhor); `marcacoes-chrome.js --chave` (lê uma página antiga de outra chave) e `--perfil` (força um perfil do Chrome); `config.nicho.removerSemSinal` (tira também a categoria sem sinal do nicho) e `config.nicho.fichaDeBairro` (nomes de fichas que são o próprio bairro).
| — | `lib.js` | Funções comuns |

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md)
- **Irmãos:** [Armadilhas Já Encontradas](armadilhas.md), [Lembrete de Etapas](lembrete-de-etapas.md), [Agente de Busca do WhatsApp](agente-whatsapp.md)

### Semânticas
- `complementa` **forte** — [Salvar Tudo e Controlar o Custo](../como-conduzir/salvar-tudo-e-custos.md): onde cada dado fica e qual script o grava
- `complementa` **moderada** — [Agente de Busca do WhatsApp](agente-whatsapp.md): os arquivos que os agentes leem e escrevem

### Funcionais
- `habilita` **forte** — [Etapa 1 — Captar](../etapas/01-captar.md): o config e os scripts da captação
