# Prospecção Google Maps (versão Claude Code)

Uma skill de prospecção para o Claude Code. Você diz o nicho e os bairros. O agente capta tudo no Google Maps com o **MazyOS Scraper** e filtra aos poucos, em doze etapas seguidas, até entregar uma lista grande de leads qualificados para prospecção fria:

- do nicho;
- sem site funcionando;
- com Instagram;
- com WhatsApp testado;
- com CNPJ e o nome do dono.

O filtro final é seu.

A regra central é **filtro leve primeiro, detalhado depois.** Cada etapa responde a uma pergunta só, no que sobrou da anterior, e tira só o que está na cara. O que gera dúvida vira grupo ou aviso no cartão.

O agente roda as doze etapas sem pedir licença entre elas. Ele só para quando precisa de você: QR do WhatsApp, chave nova do Serper ou login no Instagram.

## As etapas

| # | Etapa | Tira o quê |
|---|---|---|
| 1 | Captar (todos os bairros) | nada |
| 2 | Nicho por cima (categorias e nomes) | o claramente de fora |
| 3 | Site por cima (só o link da ficha) | site funcionando e da empresa |
| 4 | Instagram (Serper) | sem Instagram |
| 5 | Bio (lida no Chrome, com os links) | o claramente de fora pela bio |
| 6 | Site a fundo (bio, Linktree, Google já salvo) | site funcionando e da empresa |
| 7 | CNPJ (Receita: dono, telefones, porte) | nada |
| 8 | Particular ou pública (só escolas) | pública ou entidade |
| 9 | WhatsApp da empresa (script + agentes) | nada |
| 10 | WhatsApp do dono (celular do cadastro) | nada |
| 11 | Investida nos sem WhatsApp (quando compensa) | nada |
| 12 | Lista final | fichas repetidas |

## A lista

Cada rodada tem uma página só, regerada a cada etapa. O que você apaga nela nunca volta.

As cidades ficam juntas. As abas separam por site (sem site, domínio que não funciona, site em dúvida) e depois por WhatsApp (com e sem).

Cada cartão traz:

- o que a empresa é;
- o WhatsApp da empresa e o do dono;
- o Instagram;
- o link de todo site achado, com o resultado do teste;
- o CNPJ e o dono;
- os avisos.

## Como instalar

1. Copie a pasta `prospeccao-google-maps/` para `.claude/skills/` do seu projeto (ou para `~/.claude/skills/`).
2. Instale o **MazyOS Scraper** (<https://github.com/mazzeoia/mazyos-scraper>) e rode-o na porta 8090.
3. Instale o **Node.js 18+** e o **Google Chrome**, e confira se o sistema tem `curl` e `unzip`.
4. Crie uma conta no **Serper** (<https://serper.dev>) e ponha a chave em `SERPER_API_KEY`, numa variável de ambiente ou num arquivo `.env`.
5. Suba a **Evolution API** em Docker, com uma instância conectada por QR. Ela só consulta se o número tem WhatsApp; não envia nada.
6. Baixe os zips públicos da **Receita** (`Estabelecimentos0-9`, `Empresas0-9`, `Socios0-9`, `Municipios`) numa pasta e aponte essa pasta em `receita.dir`.

A página da lista é montada por `lista/gerar.js`, que já vem dentro da skill.

## Como usar

Chame `/prospeccao-google-maps` e responda: o nicho, as cidades e os bairros, os termos de busca e as rodadas anteriores a excluir. Cada rodada fica numa pasta própria (`comercial/listas/<nicho>-<n>/`):

```
config.json   leads.json   removidos.csv   creditos.log   rodada.md
bruto/        respostas inteiras de cada consulta (nada é pago duas vezes)
lista/        a página lista.html
```

O modelo de configuração é o [config.exemplo.json](config.exemplo.json).

## O que custa

| Consulta | Custo |
|---|---|
| MazyOS Scraper, Chrome, Evolution, Receita, saldo do Serper | nenhum |
| Busca no Google pelo Serper | 1 crédito por busca (veja abaixo) |
| Coordenada de bairro pelo Google (Serper places) | 1 crédito, só quando o mapa grátis não conhece o bairro |
| Scrape de página pelo Serper | 10 créditos por perfil, só se o Chrome não conseguir ler as bios |

Onde as buscas no Google gastam crédito:

- etapa 4: 1 por lead, mais 1 por lead sem Instagram na investida pelo telefone;
- etapa 8: só nas escolas que ficaram sem resposta;
- etapa 11: 3 por lead sem WhatsApp.

Quando os créditos acabam, o agente abre a página de chaves do Serper para você trocar a chave e continua de onde parou.
