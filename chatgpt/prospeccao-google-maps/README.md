# Prospecção Google Maps (versão ChatGPT / Codex)

Esta é a mesma skill da versão do Claude, com um `AGENTS.md` a mais que adapta as instruções ao **Codex**, o agente da OpenAI que vem junto com o ChatGPT Plus.

## Antes de tudo: onde ela roda

- **ChatGPT no navegador ou no app (chatgpt.com): não roda.** Ele vive nos servidores da OpenAI e não alcança o seu computador. Não chega ao MazyOS Scraper (`localhost:8090`), ao seu Chrome, à Evolution nem aos arquivos da Receita. Lá ele só consegue ler a skill e explicar.
- **Codex no seu computador: roda.** É a extensão do Codex no VS Code ou o Codex no terminal. Ele executa comandos na sua máquina, sobe o scraper, roda os scripts e abre a lista, igual ao Claude Code.

## Instalar pelo Codex (o jeito fácil)

Abra o Codex na pasta do seu projeto e cole:

```
Instala a skill deste link no projeto, seguindo o README dela:
https://github.com/riquelmebuilds/prospeccao-google-maps/tree/main/chatgpt/prospeccao-google-maps
```

No Codex, deixe o modo de acesso em **Acesso total (Full access)**. A skill precisa de internet (Serper, sites, Instagram) e precisa abrir programas fora da pasta (o scraper, o Chrome sem janela, o Docker). No modo restrito, a rede fica bloqueada e as etapas falham.

## Instruções de instalação (para o Codex seguir)

1. Baixe esta pasta inteira: `git clone https://github.com/riquelmebuilds/prospeccao-google-maps` numa pasta temporária. Copie `chatgpt/prospeccao-google-maps/` para `.agents/skills/prospeccao-google-maps/` dentro do projeto do usuário.
2. No `AGENTS.md` da raiz do projeto, acrescente o bloco abaixo. Se o arquivo não existir, crie-o só com esse bloco.

   ```
   ## Prospecção Google Maps
   Quando o usuário pedir uma prospecção de leads no Google Maps (ou "/prospeccao-google-maps", "/prospecta", "prospectar <nicho> em <cidade>"), ou uma etapa dela, leia e siga .agents/skills/prospeccao-google-maps/AGENTS.md e depois o SKILL.md da mesma pasta.
   ```

3. Confira o que o computador já tem e diga ao usuário o que falta: `node --version` (18 ou mais), o Chrome, o MazyOS Scraper, uma chave do Serper, o Docker com a Evolution API e a pasta com os zips da Receita. O que falta está na seção abaixo.
4. Não rode nenhuma etapa na instalação. Só diga que está pronto e o que ainda falta instalar.

## O que precisa estar no computador

1. **MazyOS Scraper** (<https://github.com/mazzeoia/mazyos-scraper>), na porta 8090.
2. **Node.js 18+** e **Google Chrome**; `curl` e `unzip` no sistema.
3. Conta no **Serper** (<https://serper.dev>), com a chave em `SERPER_API_KEY`, numa variável de ambiente ou num arquivo `.env`.
4. **Evolution API** em Docker, com uma instância conectada por QR. Ela só consulta se o número tem WhatsApp; não envia nada.
5. Os zips públicos da **Receita** (`Estabelecimentos0-9`, `Empresas0-9`, `Socios0-9`, `Municipios`) numa pasta, apontada em `receita.dir` no config.

A página da lista é montada por `lista/gerar.js`, que já vem dentro da skill.

## Como usar depois de instalado

No Codex, peça, por exemplo: *"roda a prospecção Google Maps: escolas infantis particulares em Campinas, bairros Cambuí e Taquaral"*. Ele faz as perguntas que faltarem e roda as 12 etapas seguidas. No fim, abre a lista no Chrome para você fazer o filtro final.

Cada rodada fica em `comercial/listas/<nicho>-<n>/`, com o `config.json`, o `leads.json`, o `removidos.csv`, o `rodada.md`, as respostas salvas em `bruto/` e a página em `lista/lista.html`.
