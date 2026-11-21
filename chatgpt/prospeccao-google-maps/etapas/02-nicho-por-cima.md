---
id: etapas.02-nicho-por-cima
nome: Etapa 2 — Nicho Por Cima
tipo: ferramenta
camada: 7-prática
status: ativo

essencia: >
  Olhe as categorias do Maps (não as fichas uma a uma), marque as claramente de fora
  e os nomes claramente de fora, e tire só isso; categoria genérica fica para a bio decidir.

em-uma-palavra: Nicho

certeza: consensual
maturidade: consolidado
origem: empírica
---
# Etapa 2 — Nicho Por Cima

> O Maps devolve autoescola, pet shop, academia e loja junto com o nicho. Esta etapa tira o que a categoria e o nome já mostram que não serve, olhando por cima. O filtro fino é a bio, na etapa 5.

---

## Como fazer

1. `node scripts/filtrar-maps.js --dir <rodada> --categorias` lista **todas** as categorias com a contagem, o destino de hoje e dois exemplos.
2. **Você classifica cada categoria**, de uma vez, na tabela:
   - **claramente de fora** (outro ramo, outro público): vai para `config.nicho.categoriasFora` (regex);
   - **do nicho**: vai para `config.nicho.categoriasDentro`;
   - **genérica** ("Escola", "Instituição educacional", "Centro educacional"): não entra em nenhuma das duas; o lead fica e a bio decide.
3. **Nomes claramente de fora** (rede pública, outro ramo dentro de uma categoria genérica: "municipal", "EMEI", "kumon", "autoescola", "pet", "cursinho"): `config.nicho.nomesFora`. Fichas que são o próprio bairro (sem categoria, nome igual ao bairro) saem sozinhas.
4. `node scripts/filtrar-maps.js --dir <rodada> --simular`: leia os exemplos do que sai e do que fica. Se um exemplo do que sai é do nicho, a regex está larga: corrija. Se um exemplo do que fica é lixo óbvio, falta uma categoria ou um nome de fora: acrescente.
5. `node scripts/filtrar-maps.js --dir <rodada>` aplica. Quem sai vai para `removidos.csv` com o motivo.
6. `node scripts/auditar.js --dir <rodada> --etapa nicho`. Gere a lista e **abra no Chrome** do operador pela primeira vez (`lista-montar.js --etapa "nicho por cima" --abrir`). Siga para a etapa 3.

## Regras de decisão

- **O nicho é o que o operador atende, não só a palavra exata.** Escolas infantis incluem berçário, creche, maternal, escola bilíngue, academia de bebê e espaço de desenvolvimento infantil ("coisa pra criança"); creche de cachorro não é.
- **Exagero é pior que sobra.** Exigir palavra do nicho no nome derruba empresa boa. Use a categoria primeiro e o nome só para o que é claramente de fora.
- **Categoria de outro ramo que aparece por proximidade** (ginásio, quadra, clube, buffet, loja de brinquedo) é de fora: o primeiro cartão que o operador abre não pode ser desses.
- Não tire por site, avaliações ou porte: isso não é critério de nicho.
- Se o config do nicho mudar depois, rode o filtro de novo: ele só olha quem está ativo.

## Rede Sináptica

### Estruturais
- **Pai:** [Contexto de Execução e Axiomas](../contexto-de-execucao.md) — Axiomas 2 e 3
- **Irmãos:** as outras onze etapas, listadas em [Rodada Autônoma](../como-conduzir/rodada-autonoma.md)

### Semânticas
- `é-caso-especial-de` **moderada** — [Rodada Autônoma](../como-conduzir/rodada-autonoma.md): uma aplicação do ritmo
- `pressupõe` **forte** — [Etapa 1 — Captar](01-captar.md): as fichas captadas são a entrada
- `é-pré-requisito-de` **forte** — [Etapa 3 — Site Por Cima](03-site-por-cima.md): o site só é conferido em quem é do nicho

### Funcionais
- `habilita` **forte** — [Etapa 3 — Site Por Cima](03-site-por-cima.md): menos fichas para abrir
