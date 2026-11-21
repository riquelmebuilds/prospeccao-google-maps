# Prospecção Google Maps

Uma skill que faz uma prospecção de leads inteira. Você diz o nicho, a cidade e os bairros. O agente de IA capta tudo no Google Maps com o [MazyOS Scraper](https://github.com/mazzeoia/mazyos-scraper) e filtra aos poucos, em 12 etapas seguidas. No fim, entrega uma lista de leads que:

- são do nicho;
- não têm site funcionando;
- têm Instagram;
- têm WhatsApp testado, o da empresa e, quando acha, o do dono;
- têm CNPJ e o nome do dono.

## Duas versões, a mesma skill

| Pasta | Para quem | Como instala |
|---|---|---|
| [`claude/prospeccao-google-maps`](claude/prospeccao-google-maps) | Claude Code | Copie a pasta para `.claude/skills/` do projeto e chame `/prospeccao-google-maps` |
| [`chatgpt/prospeccao-google-maps`](chatgpt/prospeccao-google-maps) | ChatGPT, pelo **Codex** | Siga o [README da pasta](chatgpt/prospeccao-google-maps/README.md) |

As duas versões têm as mesmas etapas, os mesmos scripts e a mesma lista. A versão do ChatGPT tem a mais um `AGENTS.md`, que adapta as instruções ao Codex.

## O que precisa estar no computador

O agente roda tudo na sua máquina, porque o scraper, o Chrome, a Evolution e a base da Receita ficam nela.

- Node.js 18 ou mais novo e o Google Chrome
- [MazyOS Scraper](https://github.com/mazzeoia/mazyos-scraper), na porta 8090
- Uma chave do [Serper](https://serper.dev) (busca no Google)
- A [Evolution API](https://github.com/EvolutionAPI/evolution-api) em Docker, com um WhatsApp conectado. Ela só confere se o número tem WhatsApp e não manda nada
- Os arquivos públicos de CNPJ da Receita Federal (`Estabelecimentos`, `Empresas`, `Socios` e `Municipios`)
