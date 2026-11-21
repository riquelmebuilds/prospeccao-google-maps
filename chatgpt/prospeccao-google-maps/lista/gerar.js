/* Gera a página de lista de leads no Estilo MazyOS (fundo animado, logo R, Inter simples).
   Uso:  node ferramentas/lista/gerar.js <pasta-da-lista>
   Lê <pasta>/dados.json e escreve <pasta>/lista.html (arquivo único: CSS, JS, logo e fonte vão embutidos;
   só as fotos ficam em <pasta>/fotos/). O formato do dados.json está em README.md. */
'use strict';
const fs = require('fs');
const path = require('path');

const AQUI = __dirname;
const pasta = path.resolve(process.argv[2] || '.');
const dadosPath = path.join(pasta, 'dados.json');
if (!fs.existsSync(dadosPath)) { console.error('Não achei ' + dadosPath); process.exit(1); }
const D = JSON.parse(fs.readFileSync(dadosPath, 'utf8'));

const esc = (t) => String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const semTags = (t) => String(t || '').replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&');
const b64 = (arq, tipo) => 'data:' + tipo + ';base64,' + fs.readFileSync(path.join(AQUI, arq)).toString('base64');
const ler = (arq) => fs.readFileSync(path.join(AQUI, arq), 'utf8');

const css = ler('estilo.css').replace(/__LOGO__/g, b64('logo-r.png', 'image/png')).replace(/__PIXEL__/g, b64('silkscreen-latin.woff2', 'font/woff2'));
const comFundo = D.fundo !== false;
const SECOES = D.secoes || [];
const COMPACTO = D.compacto !== false; // cartão enxuto: nome + botões; o resto fica em "Mais informações"

function botao(b) {
  const cls = b.tipo === 'ig' || b.tipo === 'wa' ? ' class="' + b.tipo + '"' : '';
  const alvo = /^https?:/.test(b.href) ? ' target="_blank" rel="noopener"' : '';
  return '<a' + cls + ' href="' + esc(b.href) + '"' + alvo + '>' + esc(b.titulo) + (b.sub ? '<small>' + esc(b.sub) + '</small>' : '') + '</a>';
}

function lead(l, i) {
  const campos = l.campos || [];
  const gancho = campos.find((c) => /^gancho$/i.test(c.rotulo));
  const oferta = campos.find((c) => /^oferecer$/i.test(c.rotulo));
  const resto = campos.filter((c) => c !== gancho && c !== oferta);
  const q = [l.nome, l.bairro, l.nicho, ...campos.map((c) => semTags(c.html))].join(' ').toLowerCase().replace(/"/g, '');
  const n = String(i + 1).padStart(2, '0');
  const h = [];
  h.push('<article class="item" data-k="' + esc(l.chave || 'lead-' + n) + '" data-s="' + esc(l.secao || '') + '" data-q="' + esc(q) + '">');
  h.push('  <div class="cab"><div class="num">' + n + '</div><div><div class="nome">' + esc(l.nome) + (l.bairro ? '<span class="bairro">' + esc(l.bairro) + '</span>' : '') + '</div>' + (l.nicho ? '<div class="nicho">' + esc(l.nicho) + '</div>' : '') + '</div><div class="status"></div></div>');
  if ((l.botoes || []).length) h.push('  <div class="botoes">' + l.botoes.map(botao).join('') + '</div>');
  const chips = l.chips || [];
  const imp = (c) => !COMPACTO || /WhatsApp|CNPJ|particular|avalia/i.test(semTags(c.html));
  const dl = (cs) => '  <dl class="dl">' + cs.map((c) => '<dt>' + esc(c.rotulo) + '</dt><dd' + (c.tipo === 'fonte' || c.tipo === 'obs' ? ' class="' + c.tipo + '"' : '') + '>' + c.html + '</dd>').join('') + '</dl>';
  const chip = (c) => '<span' + (c.anuncio ? ' class="ad"' : '') + '>' + c.html + '</span>';
  const impC = (c) => !COMPACTO || /^(Responsável|Dono|Sócio|Quem atende|Endereço)/i.test(c.rotulo);
  if (chips.filter(imp).length) h.push('  <div class="chips">' + chips.filter(imp).map(chip).join('') + '</div>');
  if (COMPACTO && resto.filter(impC).length) h.push(dl(resto.filter(impC)));
  if (COMPACTO) h.push('  <details class="mais"><summary>Mais informações</summary>');
  if (COMPACTO && chips.filter((c) => !imp(c)).length) h.push('  <div class="chips">' + chips.filter((c) => !imp(c)).map(chip).join('') + '</div>');
  if (l.bio) h.push('  <p class="bio">' + l.bio + '</p>');
  if ((l.fotos || []).length) h.push('  <div class="fotos">' + l.fotos.map((f) => '<a href="' + esc(f.href) + '" target="_blank" rel="noopener" title="Post de ' + esc(f.data) + '"><img src="' + esc(f.src) + '" alt="" loading="lazy"><span>' + esc(f.data) + '</span></a>').join('') + '</div>');
  if (gancho || oferta) {
    h.push('  <div class="duo">' + (gancho ? '<div class="dest dest--gancho"><small>Gancho</small>' + gancho.html + '</div>' : '') + (oferta ? '<div class="dest dest--oferta"><small>Oferecer</small>' + oferta.html + '</div>' : '') + '</div>');
  }
  if (resto.filter((c) => !impC(c)).length) h.push(dl(resto.filter((c) => !impC(c))));
  if (COMPACTO) h.push('  </details>');
  h.push('  <div class="reg"><label><input type="checkbox" data-c="lig"> Liguei</label><label><input type="checkbox" data-c="vis"> Visita marcada</label><input class="nt" placeholder="Anotação (dia da visita, com quem falou...)">' + (SECOES.length ? '<span class="acoes"><button type="button" class="acao mover" hidden></button><button type="button" class="acao del">Deletar</button></span>' : '') + '</div>');
  h.push('</article>');
  return h.join('\n');
}

const blocos = (D.blocos || []).map((b) => '<details><summary>' + esc(b.titulo) + '</summary><div class="box">' + b.html + '</div></details>').join('\n');
const notas = (D.notas || []).length ? '<div class="notas">' + D.notas.map((n) => '<p>' + n + '</p>').join('') + '</div>' : '';

const html = `<!doctype html>
<html lang="pt-BR" data-tema="claro">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(D.titulo || 'Lista de leads')}</title>
<meta name="robots" content="noindex">
<script>(function(){var t='claro';try{t=localStorage.getItem('lista-tema')||'claro'}catch(e){}if(location.hash==='#escuro')t='escuro';document.documentElement.setAttribute('data-tema',t==='escuro'?'escuro':'claro')})()</script>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>
${comFundo ? '<div class="fundo" aria-hidden="true"><canvas class="hero__fundo"></canvas></div>' : ''}
<header class="topo">
  <span class="logo" role="img" aria-label="Riquelme Gabriel"></span>
  <div class="topo__dir">
    <span class="eb">${esc(D.etiqueta || 'Lista de leads')}</span>
    <button type="button" class="tema" id="tema" aria-label="Mudar para o modo escuro" title="Modo claro / escuro">
      <svg class="sol" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
      <svg class="lua" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
    </button>
  </div>
</header>
<div class="barra" aria-hidden="true"><i id="fill"></i></div>
<main>
  <div class="abertura">
    <span class="selo"><i class="selo__ponto"></i>${esc(D.eyebrow || 'Rodada de prospecção')}</span>
    <h1>${esc(D.titulo || 'Lista de leads')}</h1>
    ${D.subtitulo ? '<p class="sub">' + D.subtitulo + '</p>' : ''}
  </div>
  ${blocos}
  <div class="cont"><span><b id="c-total">0</b> leads</span><span><b id="c-lig">0</b> ligados</span><span><b id="c-vis">0</b> visitas marcadas</span></div>
  <input class="busca" id="q" placeholder="Buscar por nome, nicho, bairro ou dono..." autocomplete="off">
  ${SECOES.length ? '<div class="abas" id="abas"></div><div class="abasub" id="abasub"></div>' : ''}
  <div class="filtros"><button type="button" class="on" data-f="todos">Todos</button><button type="button" data-f="falta">Falta ligar</button><button type="button" data-f="lig">Ligados</button><button type="button" data-f="vis">Visita marcada</button></div>
  <div id="lista">
${(D.leads || []).map(lead).join('\n')}
  </div>
  <p class="vazio" id="vazio" hidden>Nenhum lead nesse filtro.</p>
  ${notas}
  <div class="assina"><span>Riquelme Gabriel</span><span>Fim</span></div>
</main>
<script>window.LISTA_CHAVE=${JSON.stringify(D.chave || path.basename(pasta))};window.SECOES=${JSON.stringify(SECOES)};</script>
${comFundo ? '<script>\n' + ler('fundo.js') + '\n</script>' : ''}
<script>
${ler('app.js')}
</script>
</body>
</html>
`;

const saida = path.join(pasta, 'lista.html');
fs.writeFileSync(saida, html);
console.log('OK ' + saida + ' (' + Math.round(html.length / 1024) + ' KB, ' + (D.leads || []).length + ' leads)');
