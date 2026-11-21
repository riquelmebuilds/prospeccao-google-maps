/* Comportamento da lista: marcar liguei/visita, anotação, contadores, filtros e busca.
   Se o dados.json tiver "secoes" (Lista A/B/C): abas, "mover para a lista X", deletar cartão e apagar a lista inteira.
   Tudo fica salvo no navegador (localStorage), separado por lista (window.LISTA_CHAVE). */
(() => {
  'use strict';
  const LS = (() => { try { return window.localStorage; } catch (e) { return null; } })();
  const KEY = 'lista:' + (window.LISTA_CHAVE || 'sem-nome');
  let st = {};
  try { st = JSON.parse((LS && LS.getItem(KEY)) || '{}'); } catch (e) { st = {}; }
  const salva = () => { try { LS && LS.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  const itens = [...document.querySelectorAll('.item')];
  const $ = (id) => document.getElementById(id);
  const SEC = window.SECOES || [];
  const temSec = SEC.length > 0;
  let filtro = 'todos';
  let aba = temSec ? SEC[0].id : '';

  const reg = (k) => (st[k] = st[k] || {});
  const secDe = (it) => (st[it.dataset.k] && st[it.dataset.k].s) || it.dataset.s || '';
  const apagado = (it) => !!(st[it.dataset.k] && st[it.dataset.k].d);
  const vivos = () => itens.filter((i) => !apagado(i));
  const defSec = (id) => SEC.find((s) => s.id === id) || {};

  function estado(it) { return { lig: it.querySelector('[data-c=lig]').checked, vis: it.querySelector('[data-c=vis]').checked }; }

  function aplicarFiltro() {
    const q = $('q').value.toLowerCase().trim();
    let visiveis = 0;
    itens.forEach((it) => {
      const e = estado(it);
      const okFiltro = filtro === 'todos' || (filtro === 'falta' && !e.lig && !e.vis) || (filtro === 'lig' && e.lig) || (filtro === 'vis' && e.vis);
      const okBusca = !q || it.dataset.q.includes(q);
      const okAba = !temSec || secDe(it) === aba;
      const mostra = !apagado(it) && okFiltro && okBusca && okAba;
      it.classList.toggle('some', !mostra);
      if (mostra) visiveis++;
    });
    $('vazio').hidden = visiveis > 0;
  }

  function contar() {
    const v = temSec ? vivos().filter((i) => secDe(i) === aba) : vivos();
    const lig = v.filter((i) => estado(i).lig).length;
    const vis = v.filter((i) => estado(i).vis).length;
    $('c-total').textContent = v.length;
    $('c-lig').textContent = lig;
    $('c-vis').textContent = vis;
    $('fill').style.width = v.length ? Math.round((lig / v.length) * 100) + '%' : '0';
  }

  function botoesDoCartao(it) {
    const mv = it.querySelector('.acao.mover');
    if (!mv) return;
    const alvo = defSec(secDe(it)).moverPara;
    mv.hidden = !alvo;
    if (alvo) mv.textContent = 'Mover para a lista ' + alvo;
  }

  function desenharAbas() {
    if (!temSec) return;
    const cont = {};
    vivos().forEach((i) => { const s = secDe(i); cont[s] = (cont[s] || 0) + 1; });
    const abertas = SEC.filter((s) => cont[s.id] > 0);
    if (!abertas.length) { $('abas').innerHTML = ''; $('abasub').innerHTML = ''; return; }
    if (!abertas.some((s) => s.id === aba)) aba = abertas[0].id;
    $('abas').innerHTML = abertas.map((s) => '<button type="button" data-a="' + s.id + '"' + (s.id === aba ? ' class="on"' : '') + '>' + (s.rotulo || 'Lista ' + s.id) + '<b>' + cont[s.id] + '</b></button>').join('');
    const d = defSec(aba);
    $('abasub').innerHTML = '<p>' + (d.sub || '') + '</p><button type="button" class="acao apagar" id="apagar-aba">Apagar a ' + (d.rotulo || 'Lista ' + aba) + ' inteira</button>';
    $('abas').querySelectorAll('button').forEach((b) => { b.onclick = () => { aba = b.dataset.a; tudo(); }; });
    $('apagar-aba').onclick = () => {
      const n = cont[aba];
      if (!confirm('Apagar a ' + (d.rotulo || 'Lista ' + aba) + ' inteira (' + n + ' escolas)? A lista some da página.')) return;
      itens.filter((i) => secDe(i) === aba && !apagado(i)).forEach((i) => { reg(i.dataset.k).d = 1; });
      salva(); tudo();
    };
  }

  function tudo() { itens.forEach(botoesDoCartao); desenharAbas(); contar(); aplicarFiltro(); }

  itens.forEach((it) => {
    const k = it.dataset.k, s = st[k] || {};
    const lig = it.querySelector('[data-c=lig]'), vis = it.querySelector('[data-c=vis]'), nt = it.querySelector('.nt');
    const status = it.querySelector('.status');
    lig.checked = !!s.lig; vis.checked = !!s.vis; nt.value = s.nt || '';
    const pinta = () => {
      it.classList.toggle('feito', vis.checked); it.classList.toggle('ligado', lig.checked);
      status.innerHTML = (lig.checked ? '<span class="lig">✓ Já liguei</span>' : '') + (vis.checked ? '<span>Visita marcada</span>' : '');
    };
    const grava = () => { const r = reg(k); r.lig = lig.checked; r.vis = vis.checked; r.nt = nt.value; };
    const upd = () => { grava(); pinta(); salva(); contar(); aplicarFiltro(); };
    pinta();
    lig.onchange = upd; vis.onchange = upd; nt.oninput = () => { grava(); salva(); };
    const mv = it.querySelector('.acao.mover'), del = it.querySelector('.acao.del');
    if (mv) mv.onclick = () => { const alvo = defSec(secDe(it)).moverPara; if (!alvo) return; reg(k).s = alvo; salva(); tudo(); };
    if (del) del.onclick = () => { if (!confirm('Deletar "' + it.querySelector('.nome').childNodes[0].textContent.trim() + '" da lista?')) return; reg(k).d = 1; salva(); tudo(); };
  });

  document.querySelectorAll('.filtros button').forEach((b) => {
    b.onclick = () => {
      filtro = b.dataset.f;
      document.querySelectorAll('.filtros button').forEach((x) => x.classList.toggle('on', x === b));
      aplicarFiltro();
    };
  });
  $('q').oninput = aplicarFiltro;

  // tema claro/escuro (a lista abre sempre no claro; o botão lembra a escolha)
  const raiz = document.documentElement;
  const tb = $('tema');
  if (tb) tb.addEventListener('click', () => {
    const novo = raiz.getAttribute('data-tema') === 'claro' ? 'escuro' : 'claro';
    try { LS && LS.setItem('lista-tema', novo); } catch (e) {}
    raiz.classList.add('tema-troca');
    raiz.setAttribute('data-tema', novo);
    tb.setAttribute('aria-label', novo === 'claro' ? 'Mudar para o modo escuro' : 'Mudar para o modo claro');
    setTimeout(() => raiz.classList.remove('tema-troca'), 400);
  });

  tudo();
})();
