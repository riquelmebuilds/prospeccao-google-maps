// Etapa 2 (nicho por cima): tira só o que a categoria ou o nome da ficha do Maps mostram que claramente NÃO é do nicho. Erra para o lado de deixar.
// Uso: node filtrar-maps.js --dir <rodada> --categorias   (lista TODAS as categorias com a contagem e o destino atual; não grava nada)
//      node filtrar-maps.js --dir <rodada> --simular      (mostra o que sairia; não grava)
//      node filtrar-maps.js --dir <rodada>                (aplica: quem sai vai para removidos.csv)
// Regras de config.nicho: categoriasFora (regex), nomesFora (regex), fichaDeBairro (lista de nomes: a ficha que é o próprio bairro),
// e, opcional, removerSemSinal: true + categoriasDentro (regex), que tira também a categoria sem sinal do nicho.
// Rode de novo sempre que o config do nicho mudar: o filtro só pega quem ainda está ativo.
'use strict';
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const N = CFG.nicho || {};
const rx = (s) => (s ? new RegExp(s, 'i') : null);
const FORA_CAT = rx(N.categoriasFora), DENTRO_CAT = rx(N.categoriasDentro), FORA_NOME = rx(N.nomesFora);
const BAIRROS = new Set((N.fichaDeBairro || []).concat((CFG.bairros || []).map((b) => b.nome)).map(L.norm));
const leads = L.lerLeads(dir);
const ativos = L.ativos(leads);

function motivoDe(l) {
  const cat = l.categoria || '';
  if (!cat && BAIRROS.has(L.norm(l.nome))) return 'ficha do próprio bairro, não é empresa';
  if (FORA_NOME && FORA_NOME.test(l.nome)) return 'nome indica fora do nicho ("' + l.nome.match(FORA_NOME)[0] + '")';
  if (FORA_CAT && FORA_CAT.test(cat)) return 'categoria fora do nicho: ' + cat;
  if (N.removerSemSinal && DENTRO_CAT && cat && !DENTRO_CAT.test(cat) && !DENTRO_CAT.test(l.nome)) return 'categoria sem sinal do nicho: ' + cat;
  return '';
}

if (a.categorias) {
  const cats = {};
  for (const l of ativos) { const c = l.categoria || '(sem categoria)'; cats[c] = cats[c] || { n: 0, ex: [] }; cats[c].n++; if (cats[c].ex.length < 2) cats[c].ex.push(l.nome); }
  console.log('categoria | fichas | destino hoje | exemplos');
  Object.entries(cats).sort((x, y) => y[1].n - x[1].n).forEach(([c, v]) => {
    const dest = c === '(sem categoria)' ? 'fica (o nome decide)' : FORA_CAT && FORA_CAT.test(c) ? 'SAI' : DENTRO_CAT && DENTRO_CAT.test(c) ? 'fica (do nicho)' : N.removerSemSinal ? 'SAI (sem sinal)' : 'fica (sem regra)';
    console.log(`${c} | ${v.n} | ${dest} | ${v.ex.join(' ; ')}`);
  });
  console.log('\nTotal de categorias:', Object.keys(cats).length, '| fichas ativas:', ativos.length);
  process.exit(0);
}

const saem = []; const grupos = {};
for (const l of ativos) { const m = motivoDe(l); if (m) { saem.push([l, m]); const g = m.split(':')[0].split(' (')[0]; grupos[g] = (grupos[g] || 0) + 1; } }
console.log('entram:', ativos.length, '| saem:', saem.length, '| ficam:', ativos.length - saem.length);
console.log('por motivo:', grupos);
console.log('\nExemplos do que sai:'); saem.slice(0, 15).forEach(([l, m]) => console.log('  -', l.nome, '|', m));
const ficam = ativos.filter((l) => !saem.some(([s]) => s === l));
console.log('\nExemplos do que fica:'); ficam.slice(0, 15).forEach((l) => console.log('  -', l.nome, '|', l.categoria || '(sem categoria)'));

if (a.simular) { console.log('\n(--simular: nada foi gravado)'); process.exit(0); }
for (const [l, m] of saem) L.remover(dir, l, m, 'nicho por cima');
L.gravarLeads(dir, leads);
console.log('\nGravado. Removidos em removidos.csv. Leads ativos:', L.ativos(leads).length);
