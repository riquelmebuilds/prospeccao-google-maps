---
id: etapas.07-cnpj
nome: Etapa 7 — CNPJ
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  Uma passada pela base da Receita acha o CNPJ de cada lead pelo endereço e pelo
  telefone e guarda tudo: situação, nível de confiança, nome do dono, sócios,
  telefones do cadastro (o possível WhatsApp do dono), capital e abertura.

em-uma-palavra: CNPJ

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Etapa 7 — CNPJ

> O CNPJ dá ao operador o **nome do dono**, que ele usa na abordagem, e o **celular do cadastro**, que costuma ser o WhatsApp do dono (etapa 10). Dá também sinais de porte. O endereço é a prova mais forte; o nome da empresa, sozinho, engana.

---

## Como fazer

1. `node scripts/cnpj-receita.js --dir <rodada>`, em segundo plano (uns 10 minutos, sem crédito; uma varredura por vez). Numa passada pelos zips da Receita (`config.receita.dir`), ele casa cada lead por **CEP + número** do endereço, por **telefone** (últimos 8 dígitos) e por **nome**, e grava os candidatos inteiros em `bruto/cnpj/`.
2. `node scripts/cnpj-refinar.js --dir <rodada>`: dá o nível de cada CNPJ e tira o dono.
   - **Confirmado:** ativo e com duas provas, ou uma prova mais o nome batendo com a razão social ou com o nome fantasia.
   - **A conferir:** o resto (baixado ou inapto, uma prova sem nome batendo). O cartão diz "CNPJ a conferir" e o motivo.
   - **Dono:** o sócio-administrador; no MEI e na firma individual, o nome na razão social.
3. Para os sem candidato, não gaste crédito: o lead segue sem CNPJ ("não encontrei CNPJ no endereço da ficha"). `--google` (1 crédito por lead, o CNPJ sugerido só vale se o endereço bater na Receita) só se o operador pedir.
4. Auditor (`--etapa cnpj`), lista, uma linha para o operador (confirmados, a conferir, sem CNPJ, situação irregular). Siga para a etapa 8 (ou 9, se o nicho não é escola).

## Regras

- Guarde tudo que o cadastro traz: número, razão, nome fantasia, situação, provas, dono, sócios, telefones, e-mail, capital social, porte, data de abertura.
- Dono **nunca** vem de busca livre no Google (já veio até obituário). Sem CNPJ, o cartão diz que não achou.
- CNPJ baixado ou inapto no endereço pode ser de uma empresa anterior: fica "a conferir", com aviso. Não tire o lead por isso.
- A mesma sócia em várias unidades indica grupo: anote, não tire.
- O extrato local de uma cidade pode faltar empresas ativas: varra os zips completos.
- O CNAE do nicho (`config.nicho.cnaeRx`) põe na frente, entre os candidatos do mesmo endereço, o CNPJ do ramo certo (num prédio comercial há várias empresas no mesmo número).
- Endereço sem número ("Qd. 10 Lt. 5", "s/n", comum em Goiânia e Brasília) não casa por CEP + número: o lead depende do telefone. Ficar sem CNPJ, nesses casos, é esperado.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axiomas 5 e 6
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): uma aplicação do ritmo
- `pressupõe` **forte** — [Etapa 6 — Site a Fundo](06-site-a-fundo.md): varre só quem segue sem site
- `é-pré-requisito-de` **forte** — [Etapa 8 — Particular ou Pública](08-particular-ou-publica.md): a razão social é uma das três fontes
- `é-pré-requisito-de` **forte** — [Etapa 10 — WhatsApp do Dono](10-whatsapp-dono.md): o celular do cadastro é o candidato

### Funcionais
- `habilita` **forte** — [Etapa 10 — WhatsApp do Dono](10-whatsapp-dono.md): sem cadastro, não há celular do dono
