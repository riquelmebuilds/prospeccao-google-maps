// Etapa 1: junta os CSVs brutos do scraper num leads.json, sem fichas repetidas (a mesma ficha aparece em bairros vizinhos).
// Uso: node juntar-leads.js --dir <rodada>
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const pasta = path.join(dir, 'bruto', 'maps');
const vistos = new Map(); let bruto = 0; const porBairro = {};

for (const b of CFG.bairros) {
  const arq = path.join(pasta, b.slug + '.csv');
  if (!fs.existsSync(arq)) { console.log('aviso: falta ' + arq); continue; }
  const linhas = L.csvParse(fs.readFileSync(arq, 'utf8'));
  const cab = linhas[0];
  for (const r of linhas.slice(1)) {
    if (r.length < 10) continue;
    bruto++;
    const o = {}; cab.forEach((k, i) => { o[k] = r[i]; });
    let ca = {}; try { ca = JSON.parse(o.complete_address || '{}'); } catch { /* sem endereço detalhado */ }
    const chave = o.cid || o.link;
    porBairro[b.nome] = (porBairro[b.nome] || 0) + 1;
    if (vistos.has(chave)) { vistos.get(chave).buscado_em.push(b.nome); continue; }
    vistos.set(chave, {
      cidade: b.cidade, bairro: b.nome, buscado_em: [b.nome], nome: o.title, categoria: o.category, endereco: o.address,
      bairro_ficha: ca.borough || '', telefone: o.phone, site_maps: o.website, nota: o.review_rating, avaliacoes: o.review_count, maps: o.link,
    });
  }
}

const antigos = L.lerLeads(dir);
const jaTem = new Set(antigos.map((l) => l.maps));
const novos = [...vistos.values()].filter((x) => !jaTem.has(x.maps));
const leads = antigos.concat(novos.map((x, i) => ({
  chave: 'l-' + String(antigos.length + i + 1).padStart(4, '0'), ...x,
  instagram: null, bio: null, nicho_bio: null, site: null, whats: [], cnpj: null, lista: null, estado: 'ativo', motivo: '',
})));
// rodadas anteriores (config.rodadasAnteriores: pastas de outras rodadas): a mesma ficha do Maps (mesmo link/cid) sai com registro.
// Telefone igual NÃO tira (escolas diferentes do mesmo grupo dividem número): vira aviso no lead.
// A ficha é reconhecida pelo identificador do Google no link (!1s0x...:0x...), procurado em qualquer arquivo da rodada antiga
// (leads.json, dados.json, csv, html), porque rodadas antigas guardam os leads em formatos diferentes.
let anteriores = 0;
const idDaFicha = (u) => ((String(u || '').match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/i) || [])[1] || '').toLowerCase();
for (const p of CFG.rodadasAnteriores || []) {
  const pasta = path.isAbsolute(p) ? p : path.resolve(dir, p);
  if (!fs.existsSync(pasta)) { console.log('AVISO: a rodada anterior ' + pasta + ' não existe; nada foi excluído por ela.'); continue; }
  const ids = new Set(); const tels = new Map();
  // uma pasta (tudo o que a rodada antiga captou) ou um arquivo só (por exemplo, só a lista entregue)
  const ehArquivo = fs.statSync(pasta).isFile();
  (function ler(d, nivel) {
    for (const f of ehArquivo ? [path.basename(pasta)] : fs.readdirSync(d)) {
      const arq = ehArquivo ? pasta : path.join(d, f); const st = fs.statSync(arq);
      if (st.isDirectory()) { if (nivel < 3 && !/^(node_modules|chrome-perfil.*)$/.test(f)) ler(arq, nivel + 1); continue; }
      if (!/\.(json|csv|html|txt|md)$/i.test(f) || st.size > 60e6) continue;
      const t = fs.readFileSync(arq, 'utf8');
      for (const m of t.matchAll(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)/gi)) ids.add(m[1].toLowerCase());
      if (f === 'leads.json') { try { for (const x of JSON.parse(t)) if (L.digitos(x.telefone).length >= 10) tels.set(L.digitos(x.telefone).slice(-8), x.nome); } catch { /* formato diferente */ } }
    }
  })(pasta, 0);
  if (!ids.size) console.log('AVISO: não achei nenhuma ficha do Maps na rodada anterior ' + path.basename(pasta) + '; nada foi excluído por ela.');
  let n = 0;
  for (const l of L.ativos(leads)) {
    const id = idDaFicha(l.maps);
    if (id && ids.has(id)) { L.remover(dir, l, 'já estava na rodada ' + path.basename(pasta), 'captar'); anteriores++; n++; }
    else if (tels.has(L.digitos(l.telefone).slice(-8))) l.aviso = 'mesmo telefone de "' + tels.get(L.digitos(l.telefone).slice(-8)) + '" da rodada ' + path.basename(pasta) + ' (mesmo grupo?)';
  }
  console.log('rodada anterior ' + path.basename(pasta) + ': ' + ids.size + ' fichas conhecidas, ' + n + ' tiradas desta rodada');
}
L.gravarLeads(dir, leads);

console.log('fichas brutas:', bruto, '| únicas:', vistos.size, '| leads agora:', leads.length, anteriores ? '| tirados por já estarem em rodada anterior: ' + anteriores : '');
console.log('por bairro (brutas):', porBairro);
console.log('já com site no Maps:', leads.filter((l) => l.site_maps).length);
