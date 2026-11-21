---
id: como-conduzir.verificar-antes-de-afirmar
nome: Verificar Antes de Afirmar
tipo: heurística
camada: 4-operacional
status: ativo

essencia: >
  Cada afirmação sobre um lead (o site funciona e é dele, o número tem WhatsApp,
  o CNPJ é dele) nasce de um teste na fonte e aparece com o resultado no cartão;
  o que não dá para provar vira aviso, não afirmação.

em-uma-palavra: Prova

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Verificar Antes de Afirmar

> O operador abre os links e chama os números. Tudo o que você afirma tem que ter sido testado do jeito que ele vai usar, e o resultado vai escrito no cartão.

---

## O que afirma

A skill faz quatro afirmações que tiram ou rotulam um lead, e cada uma tem o seu teste.

| Afirmação | Teste direto | Falso positivo conhecido |
|---|---|---|
| **Tem site funcionando** | O endereço abre, tem conteúdo **e** prova ser da empresa: o telefone da empresa aparece na página, ou o nome dela está no domínio ou no título | Linktree, beacons, bio.site, link de WhatsApp, Instagram, Facebook, busca do Google, página de evento (Sympla), formulário, agenda online (AppBarber, Booksy, Trinks), cardápio, Spotify, `ip-api` e diretórios **não são site**. Página da entidade mantenedora, sem o nome da empresa, é dúvida |
| **O site não funciona** | O domínio não resolve (sem DNS), dá timeout ou erro na página inicial, com e sem `www` | Certificado vencido com o site no ar é site funcionando; bloqueio de robô (403, Cloudflare) é dúvida, não domínio morto |
| **Tem WhatsApp** | Consulta do número na Evolution | Fixo quase nunca tem; celular do cadastro do CNPJ pode ser do contador ou de outra empresa no mesmo endereço |
| **O CNPJ é dela** | CEP e número do endereço batem na Receita, ou o telefone | Homônimo de outra cidade; CNPJ baixado ou inapto de uma empresa anterior no mesmo endereço |

O Instagram não precisa de prova para entrar: ele precisa de **aviso** quando algo não bate (o @ não tem palavra do nome, o perfil diz outra cidade, o mesmo @ aparece para duas empresas diferentes, a bio é de outra empresa). O aviso aparece no cartão e o operador decide.

## Como aparece

Você escreve "tem site" porque o campo `website` do Maps está preenchido; "o link abre" sem abrir; "tem WhatsApp" porque o número é celular; "é ela" porque o nome parece. Esses são os sinais.

## O que fazer

**Teste do jeito que o operador usa.** Clique equivale a abrir a URL; chamar equivale a consultar o número.

**Escreva o resultado no cartão.** "abre e tem conteúdo · identidade: telefone da empresa no site", "o domínio não existe (sem DNS)", "testado: tem WhatsApp", "CNPJ baixado". Sem o resultado, o operador não sabe se confia.

**Na dúvida, não afirme.** Página que abre sem prova de ser da empresa vai para "site em dúvida", com o link no cartão. Número só do cadastro de um CNPJ a conferir vira botão "a conferir".

**Repetidos em toda etapa.** O mesmo Instagram com o mesmo telefone ou endereço é a mesma empresa (junte as fichas); o mesmo Instagram em empresas com telefone e endereço diferentes é aviso nos dois. O mesmo WhatsApp em escolas diferentes costuma ser o mesmo dono ou uma central: avise, não tire.

## O que muda

| Contexto | Sem teste | Com teste |
|---|---|---|
| Link da bio para a busca do Google | "Site funcionando" e o lead sai | Não é site; o lead fica |
| Site da mantenedora sem o nome da escola | "Site funcionando" | Site em dúvida, com o link no cartão |
| Celular do cadastro | Botão de WhatsApp | Só vira botão se a Evolution confirmar; rotulado "do dono (provável)" ou "a conferir" |

## Tensões e limites

Testar tudo custa tempo, e o custo vale: o operador perde mais com um link morto na hora da abordagem. Consultas pagas seguem [Salvar Tudo e Controlar o Custo](salvar-tudo-e-custos.md).

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axioma 6
- **Irmãos:** [Rodada Autônoma](rodada-autonoma.md), [Peneira em Camadas](peneira-em-camadas.md), [Lista Viva](lista-viva.md), [Investida Extra](investida-extra.md), [Agentes e Velocidade](agentes-e-velocidade.md), [Salvar Tudo e Controlar o Custo](salvar-tudo-e-custos.md)

### Semânticas
- `é-caso-especial-de` **forte** — [Contexto de Execução e Axiomas](../contexto-de-execucao.md): o Axioma 6 desenvolvido como testes diretos
- `complementa` **moderada** — [Lista Viva](lista-viva.md): o cartão mostra o resultado de cada teste
- `complementa` **moderada** — [Salvar Tudo e Controlar o Custo](salvar-tudo-e-custos.md): o que se testa fica salvo para provar depois
- `complementa` **forte** — [Armadilhas Já Encontradas](../referencia/armadilhas.md): os falsos positivos que já enganaram a skill

### Funcionais
- `valida` **forte** — [Etapa 6 — Site a Fundo](../etapas/06-site-a-fundo.md): só sai quem tem site com prova de ser da empresa
