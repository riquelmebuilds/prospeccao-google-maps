---
id: referencia.agente-whatsapp
nome: Agente de Busca do WhatsApp
tipo: ferramenta
camada: 8-referência
status: ativo

essencia: >
  Os dois prompts dos agentes que procuram o WhatsApp da empresa: o da busca (etapa 9,
  links e páginas da empresa) e o da investida (etapa 11, conferindo as respostas do
  Google já salvas); nenhum inventa número.

em-uma-palavra: Prompt

certeza: consensual
maturidade: seminal
origem: empírica
---
# Agente de Busca do WhatsApp

> Dispare um agente por lote, até 5 em paralelo, todos na mesma mensagem, em segundo plano. Troque `<rodada>`, `<nicho>` e `NN`. O agente não tem a sua conversa: o prompt tem que bastar.

---

## Modo busca (etapa 9)

Entrada: `<rodada>/bruto/whats-lotes/lote-NN.json`. Saída: `<rodada>/bruto/whats-lotes/resultado-NN.json`.

```
Você procura o WhatsApp da EMPRESA (<nicho>) de cada lead do lote. Você só lê e anota: não manda mensagem, não liga, não segue, não edita nada além do arquivo de resultado.

Entrada: <rodada>/bruto/whats-lotes/lote-NN.json (nome, endereço, telefones da ficha, Instagram, links da bio, site, ficha do Maps, números já testados sem WhatsApp).
Saída: <rodada>/bruto/whats-lotes/resultado-NN.json, um item por lead do lote, mesmo sem número.

O WhatsApp da empresa é o número que ela deixa à vista para clientes. Procure, nesta ordem, e pare quando achar um número com fonte clara:
 1. Links da bio: abra cada um (Linktree, beacons, bio.site, encurtadores) e procure wa.me, api.whatsapp.com, "WhatsApp", "Fale conosco".
 2. Site da empresa: topo, rodapé, contato, botão flutuante.
 3. Facebook da empresa, se abrir sem login: botão de WhatsApp, "Sobre", posts fixados.
 4. Páginas a que os links da empresa levam (cadastros, diretórios, agenda online), quando citam a empresa pelo nome e pela rua.

Como abrir páginas: sem janela na tela do operador. Chrome headless:
  "C:/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --disable-gpu --user-data-dir=<pasta temporária ABSOLUTA> --virtual-time-budget=8000 --dump-dom <url>
ou curl com user-agent de navegador comum. Nunca Playwright. Nunca user-agent de robô para passar por login. Não use buscadores (DuckDuckGo e Bing devolvem captcha ou lixo).

Honestidade: só anote número que VIU numa página que cita esta empresa; nunca invente nem complete dígitos; anote a URL e o trecho. Diretório que cita esta empresa pelo nome e pela rua vale (com a fonte); número do próprio diretório, de imobiliária, de contador ou de outra empresa de nome parecido: de_outra_empresa true (ou contador true). Página que pede login ou não abre: diga no resumo. Não use telefones de CNPJ.

Formato (JSON, lista):
[{ "chave": "l-0001",
   "numeros": [{ "numero": "19991234567", "fonte": "botão wa.me dentro do linktr.ee/empresa", "trecho": "o que a página diz", "de_outra_empresa": false, "contador": false }],
   "fixos": [{ "numero": "1932345678", "fonte": "URL" }],
   "onde_olhei": ["linktree", "site", "facebook"],
   "lead_errado": "preencha só se o lead parece errado: Instagram de outra empresa, de outra cidade, não é do nicho; senão vazio",
   "resumo": "uma linha" }]

Ao terminar, responda só: quantos leads, quantos com número achado, quantos sem, e problemas.
```

## Modo investida (etapa 11)

Entrada: `<rodada>/bruto/whats-lotes/investida-NN.json`. Saída: `<rodada>/bruto/whats-lotes/investida-resultado-NN.json`.

```
Você procura o WhatsApp da EMPRESA (<nicho>) de 7 leads que ainda não têm nenhum. Você só lê e anota: não manda mensagem, não segue, não edita nada além do arquivo de resultado.

Entrada: <rodada>/bruto/whats-lotes/investida-NN.json. Cada lead traz: dados da ficha, Instagram, bio, links da bio, CNPJ (dono e telefones), números já testados sem WhatsApp, numeros_do_google (números que apareceram nas buscas, MUITO RUIDOSOS: misturam diretórios e outras empresas), paginas_de_redes (Facebook, LinkedIn, Instagram que apareceram) e arquivo_bruto_google (as respostas inteiras das buscas).
Saída: <rodada>/bruto/whats-lotes/investida-resultado-NN.json, um item por lead.

Meta: o celular que a empresa usa como WhatsApp (ou o do responsável), com uma FONTE que ligue o número a esta empresa (nome e cidade ou rua na mesma página).
Onde olhar: (1) o arquivo bruto do Google: abra as páginas que citam a empresa; (2) as páginas de redes da lista que forem desta empresa (confirme nome e cidade ou rua); (3) Instagram, site e Linktree da empresa; (4) cadastros públicos e diretórios que citam a empresa pelo nome e pela rua. Não pare no primeiro bloqueio: tente a próxima fonte.

Como abrir páginas: Chrome headless (comando acima) ou curl; nunca Playwright; nunca user-agent de robô; não use buscadores.

Honestidade: só anote número que VIU numa página que cita esta empresa; nunca invente nem complete dígitos; anote a URL e o trecho; marque a confiança (alta, media, baixa). Diretório que cita esta empresa pelo nome e pela rua vale (com a fonte); número de outra empresa de nome parecido ou do próprio diretório: de_outra_empresa true. Número que já está em numeros_ja_testados_sem_whatsapp não é novo: diga no resumo.

Formato (JSON, lista):
[{ "chave": "l-0001",
   "numeros": [{ "numero": "19991234567", "tipo": "celular", "fonte": "URL", "trecho": "o que a página diz", "confianca": "alta", "de_outra_empresa": false }],
   "fixos": [{ "numero": "1932345678", "fonte": "URL" }],
   "onde_olhei": ["..."],
   "lead_errado": "preencha só se o lead parece errado: Instagram de outra empresa, de outra cidade, não é do nicho, entidade pública; senão vazio",
   "resumo": "uma linha" }]

Ao terminar, responda só: quantos leads, quantos com celular achado, quantos sem, e problemas.
```

## Como o resultado é usado

`whats-aplicar.js` lê todos os `resultado-NN.json` e `investida-resultado-NN.json`, põe os números (celulares e fixos) com a fonte "agente: …" e a confiança, e ignora número sem fonte, de outra empresa ou de contador. O campo `lead_errado` vira aviso no cartão; quem decide é o operador. `whats-testar.js` testa os novos: só a Evolution confirma que o número tem WhatsApp.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md)
- **Irmãos:** [Armadilhas Já Encontradas](armadilhas.md), [Ferramentas e Dados](ferramentas-e-dados.md), [Lembrete de Etapas](lembrete-de-etapas.md)

### Semânticas
- `complementa` **forte** — [Agentes e Velocidade](../como-conduzir/agentes-e-velocidade.md): as regras gerais de uso dos agentes
- `complementa` **moderada** — [Ferramentas e Dados](ferramentas-e-dados.md): os arquivos que os agentes leem e escrevem

### Funcionais
- `habilita` **forte** — [Etapa 9 — WhatsApp da Empresa](../etapas/09-whatsapp-empresa.md): o prompt do modo busca
- `habilita` **forte** — [Etapa 11 — Investida nos Sem WhatsApp](../etapas/11-investida-whatsapp.md): o prompt do modo investida
