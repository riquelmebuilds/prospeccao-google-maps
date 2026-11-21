// Antes de cada etapa (a partir da 3) e na lista final: lê o que o operador apagou, moveu e anotou na lista viva aberta no Chrome (localStorage do perfil).
// Uso: node marcacoes-chrome.js --dir <rodada> [--aplicar] [--perfil "Profile 2"] [--chave <chave-da-lista>]
// Sem --aplicar só mostra. Lê só a chave desta lista no banco local do Chrome; nada é enviado para fora. "Não achei marcações" = ele não mexeu ainda (o Chrome grava com atraso: o que faltar é lido na etapa seguinte).
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a);
// a lista viva da rodada tem uma chave só, do começo ao fim: rodada-<pasta>. --chave lê uma página antiga de outra chave.
const chaveLista = 'lista:' + (a.chave || ('rodada-' + path.basename(dir)));

function pastaChrome() {
  if (process.platform === 'win32') return path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'User Data');
  if (process.platform === 'darwin') return path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
  return path.join(os.homedir(), '.config', 'google-chrome');
}

// ---- decodificador mínimo de LevelDB (tabelas .ldb com compressão snappy) ----
function snappy(b) {
  let p = 0, len = 0, sh = 0;
  for (;;) { const c = b[p++]; len |= (c & 127) << sh; if (c < 128) break; sh += 7; }
  const o = Buffer.alloc(len); let q = 0;
  while (p < b.length) {
    const t = b[p++]; const ty = t & 3;
    if (ty === 0) { let l = t >> 2; if (l >= 60) { const nb = l - 59; l = 0; for (let i = 0; i < nb; i++) l |= b[p++] << (8 * i); } l += 1; b.copy(o, q, p, p + l); p += l; q += l; }
    else {
      let l, off;
      if (ty === 1) { l = ((t >> 2) & 7) + 4; off = ((t >> 5) << 8) | b[p++]; }
      else if (ty === 2) { l = (t >> 2) + 1; off = b[p] | (b[p + 1] << 8); p += 2; }
      else { l = (t >> 2) + 1; off = b.readUInt32LE(p); p += 4; }
      for (let i = 0; i < l; i++) { o[q] = o[q - off]; q++; }
    }
  }
  return o;
}
const vint = (b, p) => { let r = 0, s = 0, c; do { c = b[p++]; r |= (c & 127) << s; s += 7; } while (c & 128); return [r, p]; };
function entradas(blk) {
  const n = blk.readUInt32LE(blk.length - 4); const lim = blk.length - 4 - 4 * n; let p = 0; let chave = Buffer.alloc(0); const out = [];
  while (p < lim) { let sh, ns, vl; [sh, p] = vint(blk, p); [ns, p] = vint(blk, p); [vl, p] = vint(blk, p); chave = Buffer.concat([chave.slice(0, sh), blk.slice(p, p + ns)]); p += ns; out.push([chave, blk.slice(p, p + vl)]); p += vl; }
  return out;
}
const handle = (b, p) => { let o, s; [o, p] = vint(b, p); [s, p] = vint(b, p); return [o, s, p]; };
const bloco = (b, o, s) => { const raw = b.slice(o, o + s); return b[o + s] === 1 ? snappy(raw) : raw; };

function lerPerfil(pasta) {
  const origem = path.join(pasta, 'Local Storage', 'leveldb');
  if (!fs.existsSync(origem)) return null;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-ls-'));
  for (const f of fs.readdirSync(origem)) { try { fs.copyFileSync(path.join(origem, f), path.join(tmp, f)); } catch { /* arquivo em uso */ } }
  const achados = [];
  for (const f of fs.readdirSync(tmp).filter((x) => x.endsWith('.ldb'))) {
    const b = fs.readFileSync(path.join(tmp, f)); if (b.length < 48) continue;
    try {
      const ft = b.slice(b.length - 48); let p = 0; let mo, ms, io, is;
      [mo, ms, p] = handle(ft, p); [io, is, p] = handle(ft, p);
      for (const [, hv] of entradas(bloco(b, io, is))) {
        const [o, s] = handle(hv, 0);
        for (const [k, v] of entradas(bloco(b, o, s))) {
          // chave exata: "lista:x" não pode ler as marcações de "lista:x-v2"
          if (k.slice(0, k.length - 8).toString('latin1').endsWith(chaveLista)) { const tag = k.readBigUInt64LE(k.length - 8); achados.push({ seq: Number(tag >> 8n), tipo: Number(tag & 255n), v }); }
        }
      }
    } catch { /* tabela ilegível: ignora */ }
  }
  // log de escrita (valores recentes, sem compressão)
  for (const f of fs.readdirSync(tmp).filter((x) => x.endsWith('.log'))) {
    const s = fs.readFileSync(path.join(tmp, f)).toString('latin1'); let i = -1;
    while ((i = s.indexOf(chaveLista, i + 1)) >= 0) {
      // a chave tem que terminar aqui: depois dela vêm o tamanho do valor (varint), o byte de formato (0 ou 1) e o JSON
      const resto = s.slice(i + chaveLista.length); let j = 0;
      while (j < 4 && resto.charCodeAt(j) >= 128) j++;
      j++; if (resto[j] !== '\u0001' && resto[j] !== '\u0000') continue;
      j++; if (resto[j] !== '{') continue;
      let d = 0, fim = -1; for (let k = j; k < resto.length; k++) { if (resto[k] === '{') d++; else if (resto[k] === '}') { d--; if (!d) { fim = k; break; } } }
      if (fim > 0) achados.push({ seq: Number.MAX_SAFE_INTEGER, tipo: 1, v: Buffer.from('\u0001' + resto.slice(j, fim + 1), 'latin1') });
    }
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  const ult = achados.filter((x) => x.tipo === 1).sort((x, y) => x.seq - y.seq).pop();
  if (!ult) return null;
  try { return JSON.parse(ult.v.slice(1).toString(ult.v[0] === 0 ? 'utf16le' : 'latin1')); } catch { return null; }
}

const raiz = pastaChrome();
if (!fs.existsSync(raiz)) { console.error('Não achei o Chrome em ' + raiz); process.exit(1); }
const perfis = a.perfil ? [a.perfil] : fs.readdirSync(raiz).filter((x) => x === 'Default' || /^Profile \d+$/.test(x));
let estado = null; let onde = '';
for (const p of perfis) { const e = lerPerfil(path.join(raiz, p)); if (e) { estado = e; onde = p; } }
if (!estado) { console.error('Não achei marcações para a chave "' + chaveLista + '". Confira se a lista foi aberta e mexida no Chrome, e se o nome da rodada bate. O Chrome grava com um pequeno atraso: tente de novo em um minuto.'); process.exit(1); }

const regs = Object.entries(estado);
const apagados = regs.filter(([, v]) => v.d).map(([k]) => k);
const movidos = regs.filter(([, v]) => v.s).map(([k, v]) => [k, v.s]);
const ligados = regs.filter(([, v]) => v.lig).map(([k]) => k);
const notas = regs.filter(([, v]) => v.nt).map(([k, v]) => [k, v.nt]);
console.log(`perfil do Chrome: ${onde} | marcações: ${regs.length} | apagados: ${apagados.length} | movidos: ${movidos.length} | ligados: ${ligados.length} | com anotação: ${notas.length}`);
L.gravarJson(path.join(dir, 'bruto', 'marcacoes', chaveLista.slice(6).replace(/[^\w.-]/g, '_') + '.json'), estado);

if (!a.aplicar) { console.log('(sem --aplicar: nada foi alterado no leads.json)'); process.exit(0); }
const leads = L.lerLeads(dir); const porChave = new Map(leads.map((l) => [l.chave, l]));
for (const k of apagados) { const l = porChave.get(k); if (l && l.estado !== 'removido') L.remover(dir, l, 'apagado pelo operador na lista', 'operador'); }
for (const [k, s] of movidos) { const l = porChave.get(k); if (l) l.lista = s; }
for (const [k, n] of notas) { const l = porChave.get(k); if (l) l.nota_operador = n; }
L.gravarLeads(dir, leads);
console.log('Aplicado. Leads ativos agora:', L.ativos(leads).length);
