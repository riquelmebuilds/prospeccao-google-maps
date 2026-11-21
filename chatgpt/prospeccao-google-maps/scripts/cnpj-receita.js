// Etapa 7: acha o CNPJ, o responsável e os telefones do cadastro de cada lead na base da Receita (zips completos, Brasil inteiro).
// Rode em segundo plano (uns 10 min); depois node cnpj-refinar.js (nível e dono).
// Uso: node cnpj-receita.js --dir <rodada> [--google]
// Roda em UMA passada pelos zips (uns 10 min) e junta, para todos os leads, os estabelecimentos que casam por:
//   endereço (CEP + número, ou rua + número na mesma cidade), telefone (últimos 8 dígitos) e, como reforço, nome.
// Confiança: forte = 2 provas ou mais; provável = 1 prova + CNAE compatível; confirmar = o resto (inclui CNPJ baixado, inapto ou nome diferente).
// --google: para quem ficou sem candidato, busca "nome cidade CNPJ" no Serper (1 crédito/lead); o CNPJ sugerido só vale se o endereço bater na Receita.
// Precisa de `unzip` no sistema e dos zips Estabelecimentos0-9, Empresas0-9, Socios0-9 e do Municipios (config.receita.dir).
'use strict';
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { spawn } = require('child_process');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const RDIR = (CFG.receita && CFG.receita.dir) || 'receita-cnpj';
// palavras que não distinguem uma empresa (palavra inteira): as genéricas e as do nicho (config.nicho.palavrasComuns)
const PARADA_NOME = new Set(['ltda', 'de', 'da', 'do', 'dos', 'das', 'centro', 'instituto', 'escola', 'infantil', 'bercario', 'educacao', 'colegio', 'maternal', 'jardim', 'kids'].concat(((CFG.nicho && CFG.nicho.palavrasComuns) || []).map(L.norm)));
const QUAL = { '49': 'Sócio-Administrador', '22': 'Sócio', '05': 'Administrador', '10': 'Diretor', '16': 'Presidente', '65': 'Titular (empresário individual)', '28': 'Sócio-Gerente', '08': 'Conselheiro', '17': 'Procurador', '37': 'Sócio ostensivo', '31': 'Sócio-Menor' };
const SIT = { '01': 'nula', '02': 'ativa', '03': 'suspensa', '04': 'inapta', '08': 'baixada' };
const CHEFE = new Set(['49', '65', '16', '10', '05', '28']);
const sp = (l) => l.replace(/"/g, '').split(';');
const TITULO = { dr: 'doutor', dra: 'doutora', prof: 'professor', profa: 'professora', eng: 'engenheiro', cel: 'coronel', mal: 'marechal', gal: 'general', pe: 'padre', sta: 'santa', sto: 'santo', sao: 'sao', av: '', r: '', rua: '', avenida: '', al: '', alameda: '', pca: '', praca: '', trav: '', travessa: '', estr: '', estrada: '', rod: '', rodovia: '' };
const rua = (s) => L.norm(s).split(' ').map((t) => (t in TITULO ? TITULO[t] : t)).filter(Boolean);
const mesmaRua = (x, y) => { const A = rua(x), B = rua(y); if (!A.length || !B.length) return false; const sa = new Set(A), sb = new Set(B); const [p, g] = A.length <= B.length ? [sa, sb] : [sb, sa]; return [...p].every((t) => g.has(t)) && p.size >= 2 || A.join(' ') === B.join(' '); };

function varrer(zip, aceita, cb) {
  return new Promise((resolve, reject) => {
    const arq = path.join(RDIR, zip);
    if (!fs.existsSync(arq)) { reject(new Error('Não achei ' + arq + ' (config.receita.dir)')); return; }
    const p = spawn('unzip', ['-p', arq]);
    p.on('error', (e) => reject(new Error('Preciso do comando unzip no sistema: ' + e.message)));
    const rl = readline.createInterface({ input: p.stdout, crlfDelay: Infinity });
    rl.on('line', (l) => { if (aceita(l)) cb(sp(l)); });
    p.on('close', resolve);
  });
}

(async () => {
  const leads = L.ativos(L.lerLeads(dir)).filter((l) => !l.cnpj || a.refazer);
  const todos = L.lerLeads(dir);
  console.log('leads a procurar:', leads.length);
  // municípios (código → nome)
  const mun = new Map();
  await varrer('Municipios.zip', () => true, (f) => mun.set(f[0], L.norm(f[1])));
  // alvos por lead
  const alvo = leads.map((l) => {
    const end = l.endereco || '';
    const cep = (end.match(/\b(\d{5})-?(\d{3})\b/) || []).slice(1, 3).join('');
    const num = ((end.match(/,\s*(\d{1,5})\b/) || [])[1]) || '';
    const rr = (end.replace(/^.*? - /, '').split(',')[0] || '').trim();
    const uf = (end.match(/\b([A-Z]{2}),?\s*\d{5}-?\d{3}/) || end.match(/ - ([A-Z]{2})\b/) || [])[1] || '';
    const tels = new Set(); for (const t of [l.telefone, ...(l.outras_fichas || []).map((f) => f.telefone)]) { const d = L.digitos(t); if (d.length >= 10) tels.add(d.slice(-8)); }
    return { l, cep, num, rua: rr, uf, tels, cidade: L.norm(l.cidade), toks: L.norm(l.nome).split(' ').filter((t) => t.length > 2 && !PARADA_NOME.has(t)) };
  });
  const ufs = new Set(alvo.map((x) => x.uf).filter(Boolean));
  const rx = new RegExp(';"(' + [...ufs].join('|') + ')";"');
  const porCep = new Map(), porTel = new Map(), porRuaNum = new Map();
  alvo.forEach((x, i) => {
    if (x.cep && x.num) { const k = x.cep + '|' + x.num; (porCep.get(k) || porCep.set(k, []).get(k)).push(i); }
    if (x.num) { const k = x.num; (porRuaNum.get(k) || porRuaNum.set(k, []).get(k)).push(i); }
    for (const t of x.tels) (porTel.get(t) || porTel.set(t, []).get(t)).push(i);
  });

  // PASSADA 1: estabelecimentos
  const cand = alvo.map(() => new Map());   // por lead: cnpj → candidato
  const tocar = (i, f, prova) => {
    const cnpj = f[0] + f[1] + f[2]; const m = cand[i];
    if (!m.has(cnpj)) m.set(cnpj, { cnpj, basico: f[0], matriz: f[3] === '1', fantasia: f[4], inicio: f[10], sit: f[5], cnae: f[11], cnaeSec: f[12] || '', logr: (f[13] + ' ' + f[14]).trim(), num: f[15], bairro: f[17], cep: f[18], tels: [(f[21] || '') + (f[22] || ''), (f[23] || '') + (f[24] || '')].filter((t) => t.length >= 10), email: (f[27] || '').toLowerCase(), provas: new Set() });
    m.get(cnpj).provas.add(prova);
  };
  const filtro = (linha) => rx.test(linha);
  for (let z = 0; z < 10; z++) {
    await varrer('Estabelecimentos' + z + '.zip', filtro, (f) => {
      const num = String(f[15] || '').replace(/\D/g, '');
      for (const i of porCep.get(f[18] + '|' + num) || []) tocar(i, f, 'endereço');
      for (const i of porRuaNum.get(num) || []) { const x = alvo[i]; if (mun.get(f[20]) === x.cidade && x.rua && mesmaRua(x.rua, f[14]) && !cand[i].has(f[0] + f[1] + f[2])) tocar(i, f, 'endereço'); }
      for (const t of [(f[22] || '').slice(-8), (f[24] || '').slice(-8)]) for (const i of porTel.get(t) || []) tocar(i, f, 'telefone');
    });
    console.log('estabelecimentos', z + 1 + '/10');
  }
  await olharGoogle(alvo, cand, filtro);

  // PASSADA 2: razão social e sócios das empresas casadas
  const basicos = new Set(); cand.forEach((m) => m.forEach((c) => basicos.add(c.basico)));
  const emp = new Map(), soc = new Map();
  for (let z = 0; z < 10; z++) {
    await varrer('Empresas' + z + '.zip', (l) => basicos.has(l.slice(1, 9)), (f) => emp.set(f[0], { razao: f[1], capital: f[4], porte: f[5] }));
    await varrer('Socios' + z + '.zip', (l) => basicos.has(l.slice(1, 9)), (f) => (soc.get(f[0]) || soc.set(f[0], []).get(f[0])).push({ tipo: f[1], nome: f[2], qual: f[4] }));
    console.log('empresas e sócios', z + 1 + '/10');
  }

  // resultado por lead
  let forte = 0, prov = 0, conf = 0, nada = 0;
  alvo.forEach((x, i) => {
    const lista = [...cand[i].values()].map((c) => {
      const razao = (emp.get(c.basico) || {}).razao || ''; const t = new Set(L.norm(c.fantasia + ' ' + razao).split(' '));
      if (x.toks.length && x.toks.every((k) => t.has(k))) c.provas.add('nome');
      const provas = [...c.provas]; const CNAE_OK = new RegExp((CFG.nicho && CFG.nicho.cnaeRx) || '^$'); const educ = CNAE_OK.test(c.cnae) || String(c.cnaeSec || '').split(',').some((x) => CNAE_OK.test(x));   // CNAE do nicho (config.nicho.cnaeRx); sem ele no config, nenhum CNAE conta como do nicho
      const ativa = c.sit === '02';
      const conf = provas.length >= 2 && ativa ? 'forte' : provas.length >= 1 && educ && ativa ? 'provavel' : 'confirmar';
      return { ...c, provas, razao, situacao: SIT[c.sit] || c.sit, confianca: conf, pontos: provas.length * 10 + (ativa ? 5 : 0) + (educ ? 2 : 0) + (c.matriz ? 1 : 0) };
    }).sort((p, q) => q.pontos - p.pontos);
    fs.mkdirSync(path.join(dir, 'bruto', 'cnpj'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'bruto', 'cnpj', x.l.chave + '.json'), JSON.stringify(lista.map((c) => ({ ...c, socios: (soc.get(c.basico) || []) })), null, 1));
    const top = lista[0]; x.l.cnpj_buscado = true;
    if (!top) { nada++; return; }
    const socios = (soc.get(top.basico) || []).map((s) => ({ nome: s.nome.replace(/^[^A-Za-zÀ-ÿ]+/, ''), qual: s.tipo === '1' ? 'empresa sócia' : (QUAL[s.qual] || 'qualif. ' + s.qual), chefe: CHEFE.has(s.qual) }));
    const resp = socios.find((s) => s.chefe) || socios.find((s) => s.qual !== 'empresa sócia');
    x.l.cnpj = {
      numero: top.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5'), razao: top.razao, fantasia: top.fantasia || '', situacao: top.situacao, confianca: top.confianca, provas: top.provas,
      responsavel: resp ? resp.nome + ' (' + resp.qual + ')' : '', socios: socios.filter((s) => s !== resp).map((s) => s.nome + ' (' + s.qual + ')'),
      telefones: top.tels.map(L.normalizarTelefone), email: top.email, capital_social: (emp.get(top.basico) || {}).capital || '', porte: (emp.get(top.basico) || {}).porte || '', inicio_atividade: top.inicio || '', endereco_receita: top.logr + ', ' + top.num + ' - ' + top.bairro, outros_candidatos: lista.slice(1, 3).map((c) => c.cnpj + ' ' + c.razao),
    };
    if (top.confianca === 'forte') forte++; else if (top.confianca === 'provavel') prov++; else conf++;
  });
  // relê o leads.json na hora de gravar e troca só o bloco do CNPJ: o que mudou durante a varredura (exclusões do operador) não se perde
  const atual = L.lerLeads(dir); const porK = new Map(alvo.map((y) => [y.l.chave, y.l]));
  for (const l of atual) { const y = porK.get(l.chave); if (y) { if (y.cnpj) l.cnpj = y.cnpj; l.cnpj_buscado = true; } }
  L.gravarLeads(dir, atual);
  console.log(`\nCNPJ forte: ${forte} | provável: ${prov} | a confirmar: ${conf} | sem candidato: ${nada}`);
  const at = L.ativos(L.lerLeads(dir));
  console.log('sem CNPJ:', at.filter((l) => !l.cnpj).map((l) => l.nome).join(' | ') || '—');
  console.log('situação irregular:', at.filter((l) => l.cnpj && l.cnpj.situacao !== 'ativa').map((l) => `${l.nome} (${l.cnpj.situacao})`).join(' | ') || '—');
  console.log('\nPróximo: node scripts/cnpj-refinar.js --dir <rodada> (nível e dono). O WhatsApp do dono é a etapa 10 (whats-achar.js --cnpj).');

  async function olharGoogle(alvo, cand, filtro) {
    if (!a.google) return;
    const chave = L.lerChave((CFG.serper && CFG.serper.chaveVar) || 'SERPER_API_KEY', CFG.serper && CFG.serper.envFile, path.join(dir, '.env'));
    if (!chave) { console.error('Sem chave do Serper para --google'); return; }
    const reCnpj = /\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g;
    const valido = (c) => { c = L.digitos(c); if (c.length !== 14 || /^(\d)\1+$/.test(c)) return false; const d = (b, p) => { let s = 0; for (let i = 0; i < p.length; i++) s += b[i] * p[i]; const r = s % 11; return r < 2 ? 0 : 11 - r; }; const n = c.split('').map(Number); return d(n, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === n[12] && d(n, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === n[13]; };
    const sugeridos = new Map(); let gasto = 0;
    for (let i = 0; i < alvo.length; i++) {
      if (cand[i].size) continue;
      const x = alvo[i]; const j = await L.serperBusca(chave, `"${x.l.nome.replace(/ - .*| \(.*/, '')}" ${x.l.cidade} CNPJ`); gasto += Number(j.credits || 1);
      for (const o of j.organic || []) for (const c of ((o.title + ' ' + (o.snippet || '')).match(reCnpj) || [])) if (valido(c)) { const d = L.digitos(c); (sugeridos.get(d.slice(0, 8)) || sugeridos.set(d.slice(0, 8), new Set()).get(d.slice(0, 8))).add(i); }
    }
    L.registrarCreditos(dir, 'cnpj', gasto, 'busca de CNPJ no Google');
    if (!sugeridos.size) return;
    console.log('CNPJs sugeridos pelo Google a conferir pelo endereço:', sugeridos.size);
    for (let z = 0; z < 10; z++) {
      await varrer('Estabelecimentos' + z + '.zip', (l) => sugeridos.has(l.slice(1, 9)), (f) => {
        const num = String(f[15] || '').replace(/\D/g, '');
        for (const i of sugeridos.get(f[0]) || []) { const x = alvo[i]; if ((f[18] === x.cep && num === x.num) || (x.num === num && x.rua && mesmaRua(x.rua, f[14]) && mun.get(f[20]) === x.cidade)) tocar(i, f, 'endereço (sugerido pelo Google)'); }
      });
    }
  }
})().catch((e) => { console.error('ERRO', e.message); process.exit(1); });
