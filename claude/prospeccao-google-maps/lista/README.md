# Lista de leads (Estilo MazyOS)

Modelo único de página de lista. Toda lista de leads sai daqui, pra o visual ficar sempre igual.

**Visual:** fundo claro com os pontinhos azuis animados do formulário de briefing, logo R do Riquelme no topo, Inter simples no texto. A fonte pixel (Silkscreen) só aparece em detalhes pequenos (número do lead, selos, contadores). Cartão com gancho (laranja) e o que oferecer (azul) em destaque, botões em pílula, fotos dos últimos posts, "Liguei / Visita marcada / Anotação", filtros e busca. Botão de lua troca pro escuro. Aberto sempre no claro.

## Como usar

```
node lista/gerar.js <pasta-da-lista>   (lista-montar.js já chama sozinho)
```

Lê `<pasta>/dados.json` e escreve `<pasta>/lista.html` (arquivo único: CSS, JS, logo e fonte já vão dentro). As fotos ficam em `<pasta>/fotos/`.

## Formato do dados.json

```json
{
  "chave": "botucatu-1",              // nome único da lista (guarda o "liguei" no navegador)
  "titulo": "Botucatu: 10 leads pra visita",
  "eyebrow": "Rodada de prospecção",  // selo acima do título
  "etiqueta": "LISTA DE VISITAS",     // texto pequeno no topo, ao lado do botão de tema
  "subtitulo": "texto curto (aceita HTML)",
  "fundo": true,                      // false desliga a animação (PC fraco)
  "blocos": [{ "titulo": "Roteiro da ligação", "html": "<h3>…</h3><p>…</p>" }],   // recolhíveis, opcional
  "leads": [{
    "chave": "id-unico-do-lead",
    "nome": "…", "bairro": "Centro", "nicho": "…",
    "chips": [{ "html": "<b>7,6 mil</b> seguidores" }, { "html": "Anúncio ativo · <a href=\"…\">ver</a>", "anuncio": true }],
    "botoes": [{ "tipo": "ig|wa|tel", "titulo": "Ver Instagram @x", "sub": "opcional", "href": "…" }],
    "bio": "texto da bio",
    "fotos": [{ "src": "fotos/x-1.jpg", "href": "link do post", "data": "23/out" }],
    "campos": [{ "rotulo": "Gancho|Oferecer|Dono|…", "html": "…", "tipo": "|fonte|obs" }]
  }],
  "notas": ["<b>Como escolhi:</b> …"]  // rodapé, opcional
}
```

`Gancho` e `Oferecer` viram os dois destaques do cartão; os outros campos entram na lista de apoio (Dono, Quem atende, Endereço, Google, CNPJ…). `tipo: "fonte"` deixa a linha cinza e pequena; `"obs"` põe fundo de aviso.

**Também usado pela prospecção:** o `montar.js` da skill `/prospecta-bairro` lê `estilo.css`, `fundo.js`, `logo-r.png` e a fonte daqui pra gerar `prospeccao-<slug>.html` (abas A/B/C, mensagem pronta, "→ Lista A"). Mexer no visual aqui muda as duas coisas.

## Arquivos

- `gerar.js` monta a página. `estilo.css` e `app.js` são o visual e o comportamento.
- `fundo.js` é o fundo animado (cópia do `projetos/formulario-briefing/assets/hero-fundo.js`).
- `logo-r.png` (logo R) e `silkscreen-latin.woff2` (fonte pixel) vão embutidos na página.
