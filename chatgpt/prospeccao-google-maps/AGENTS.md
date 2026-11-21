# Prospecção Google Maps — instruções para o Codex

Esta pasta é uma skill escrita no formato Agent Skills. O ponto de partida é o [SKILL.md](SKILL.md): leia-o inteiro e siga a ordem de leitura que ele indica, começando pelo [Contexto de Execução e Axiomas](contexto-de-execucao.md). Tudo o que está nos documentos vale para você.

Os documentos foram escritos para um agente com outras ferramentas. Para o seu ambiente, a tradução vem abaixo. Onde este arquivo e um documento da skill parecerem discordar, vale a regra do documento, executada do jeito descrito aqui.

## Onde rodar os comandos

- Rode os scripts **a partir desta pasta** (a que tem este `AGENTS.md`): `node scripts/<script>.js --dir <caminho absoluto da rodada>`.
- As rodadas ficam no projeto do usuário, em `comercial/listas/<nicho>-<n>/`. Use sempre o caminho absoluto em `--dir`.
- A skill precisa de internet e de abrir programas fora da pasta. Se um comando falhar por falta de rede ou por permissão, peça ao usuário para trocar o Codex para **Acesso total (Full access)** e repita o comando.

## "Em segundo plano"

Os documentos mandam rodar alguns scripts "em segundo plano": `buscar-maps.js` (pode levar horas), `bio-chrome.js`, `cnpj-receita.js` (uns 10 minutos) e os lotes de `site-checar.js`. Esses comandos passam do tempo máximo de um comando seu. Lance-os desacoplados, com a saída num arquivo de log, e acompanhe pelo log.

No Windows (PowerShell):

```
Start-Process -WindowStyle Hidden -FilePath node -ArgumentList 'scripts/buscar-maps.js','--dir','<rodada>' -RedirectStandardOutput '<rodada>/bruto/log-buscar-maps.txt' -RedirectStandardError '<rodada>/bruto/log-buscar-maps-erro.txt'
```

No macOS ou Linux:

```
nohup node scripts/buscar-maps.js --dir <rodada> > <rodada>/bruto/log-buscar-maps.txt 2>&1 &
```

Depois, leia o fim do log de tempos em tempos, com pausas de 1 a 2 minutos, até aparecer a linha final do script (`FIM`, `Próximo:` ou `ERRO`).

Regras:

- Nunca lance dois scripts que gravam o `leads.json` ao mesmo tempo.
- Os lotes de `site-checar.js` (`--lote i/n`) podem rodar juntos.

## "Agentes"

Os documentos mandam disparar agentes de IA em lotes: etapa 9 (WhatsApp da empresa) e etapa 11 (investida), com os prompts de [referencia/agente-whatsapp.md](referencia/agente-whatsapp.md).

- **Se o seu ambiente permite abrir subagentes ou tarefas paralelas,** use-os, um por lote, com o prompt do documento.
- **Se não permite,** faça você mesmo cada lote, um depois do outro. Use o mesmo prompt como roteiro e grave o mesmo arquivo de resultado (`bruto/whats-lotes/*resultado-NN.json`) no mesmo formato. Depois rode `whats-aplicar.js`, como o documento manda.

O resultado tem de ser idêntico nos dois casos, porque só os scripts editam o `leads.json`.

## Abrir páginas

- Use `curl` ou o Chrome **sem janela** (headless), com uma pasta de perfil própria, como os documentos mostram.
- Nunca abra uma janela de navegador na tela do usuário, nem use Playwright ou uma ferramenta de navegador visível.
- A única janela que se abre é a lista final, no Chrome do usuário, pelo `lista-montar.js --abrir`.

## Ler a bio (etapa 5)

`bio-decidir.js --listar` gera `bruto/bio-para-ler.md`. Leia você mesmo esse arquivo inteiro e escreva as decisões no formato que [etapas/05-bio.md](etapas/05-bio.md) descreve. Depois aplique com `bio-decidir.js --aplicar`.

Essa leitura é trabalho seu, não de script. Não pule e não classifique por palavra-chave.

## Falar com o usuário

- Responda sempre em português do Brasil, curto e direto.
- Entre as etapas, dê uma linha por etapa e não peça licença para seguir (Axioma 1).
- Só pare quando precisar de uma ação dele: o QR do WhatsApp, uma chave nova do Serper ou o login no Instagram.
- Nunca mostre chaves (Serper, Evolution) na conversa.
