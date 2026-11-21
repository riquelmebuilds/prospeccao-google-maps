// Funções comuns dos scripts da skill prospeccao-google-maps. Sem dependências externas (Node 18+).
'use strict';
const fs = require('fs');
const path = require('path');

/** Lê os argumentos: --dir <pasta>, --flag, --chave valor. */
function args(argv = process.argv.slice(2)) {
  // --help nunca executa a etapa: mostra o cabeçalho do script e sai
  if (argv.includes('--help') || argv.includes('-h')) {
    const arq = require.main && require.main.filename;
    const cab = arq ? fs.readFileSync(arq, 'utf8').split('\n').filter((x) => x.startsWith('//')).slice(0, 12).join('\n') : '';
    console.log(cab || '(sem ajuda)'); process.exit(0);
  }
  const o = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (argv[i + 1] && !argv[i + 1].startsWith('--')) o[k] = argv[++i]; else o[k] = true;
    } else o._.push(a);
  }
  return o;
}

/** Pasta da rodada: --dir ou a pasta atual. Sem config.json ali, o script para (assim nenhum leads.json nasce fora da rodada). */
function pastaRodada(a) {
  const d = path.resolve(a.dir || process.cwd());
  if (!fs.existsSync(path.join(d, 'config.json'))) { console.error('Não achei config.json em ' + d + '. Rode com --dir <pasta-da-rodada>.'); process.exit(1); }
  return d;
}

function lerJson(arq, padrao) {
  if (!fs.existsSync(arq)) { if (padrao !== undefined) return padrao; throw new Error('Não achei ' + arq); }
  return JSON.parse(fs.readFileSync(arq, 'utf8'));
}
function gravarJson(arq, dados) {
  fs.mkdirSync(path.dirname(arq), { recursive: true });
  const tmp = arq + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(dados, null, 1));
  fs.renameSync(tmp, arq);
}

const config = (dir) => lerJson(path.join(dir, 'config.json'));
const lerLeads = (dir) => lerJson(path.join(dir, 'leads.json'), []);
const gravarLeads = (dir, leads) => gravarJson(path.join(dir, 'leads.json'), leads);
const ativos = (leads) => leads.filter((l) => l.estado !== 'removido');

const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
const digitos = (s) => String(s || '').replace(/\D/g, '');
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const hora = () => new Date().toTimeString().slice(0, 8);
const log = (m) => console.log(hora() + ' ' + m);
const csvCel = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';

/** CSV com aspas → matriz. */
function csvParse(t) {
  const rows = []; let r = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { r.push(c); c = ''; }
    else if (ch === '\n') { r.push(c.replace(/\r$/, '')); rows.push(r); r = []; c = ''; }
    else c += ch;
  }
  if (c || r.length) { r.push(c); rows.push(r); }
  return rows;
}

/** Marca o lead como removido e registra em removidos.csv. Nada some sem registro. */
function remover(dir, lead, motivo, etapa) {
  lead.estado = 'removido'; lead.motivo = motivo; lead.etapa_remocao = etapa;
  const arq = path.join(dir, 'removidos.csv');
  if (!fs.existsSync(arq)) fs.writeFileSync(arq, '﻿nome,bairro,cidade,instagram,motivo,etapa\n');
  const ig = (lead.instagram && lead.instagram.handle) || '';
  fs.appendFileSync(arq, [lead.nome, lead.bairro, lead.cidade, ig, motivo, etapa].map(csvCel).join(',') + '\n');
}

/** Lê uma variável de um arquivo .env ou do ambiente. Nunca imprima o valor. */
function lerChave(nomeVar, ...arquivos) {
  if (process.env[nomeVar]) return process.env[nomeVar];
  for (const f of arquivos.filter(Boolean)) {
    if (!fs.existsSync(f)) continue;
    const linha = fs.readFileSync(f, 'utf8').split(/\r?\n/).find((l) => l.startsWith(nomeVar + '='));
    if (linha) return linha.slice(nomeVar.length + 1).trim().replace(/^["']|["']$/g, '');
  }
  return '';
}

/** Registra gasto de crédito em creditos.log. */
function registrarCreditos(dir, etapa, qtd, obs = '') {
  fs.appendFileSync(path.join(dir, 'creditos.log'), `${new Date().toISOString()}\t${etapa}\t${qtd}\t${obs}\n`);
}

/** Saldo do Serper = o último saldo real consultado (serper-saldo.js grava em config.serper.saldoInicial e marca "saldo" no creditos.log)
 *  menos o que foi gasto depois dessa marca. */
function saldoSerper(dir, cfg) {
  const bruto = cfg.serper && cfg.serper.saldoInicial;
  if (bruto === undefined || bruto === null || bruto === '' || isNaN(Number(bruto))) return null;
  const ini = Number(bruto);
  const arq = path.join(dir, 'creditos.log');
  const linhas = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8').split('\n').filter(Boolean) : [];
  let k = -1; linhas.forEach((x, i) => { if (x.split('\t')[1] === 'saldo') k = i; });
  return ini - linhas.slice(k + 1).reduce((s, x) => s + (Number(x.split('\t')[2]) || 0), 0);
}

/** Confere antes de gastar. Se o saldo não cobre, o script para com código 3: é a hora de o operador trocar a chave. */
function conferirSaldo(dir, cfg, precisa) {
  const s = saldoSerper(dir, cfg);
  if (s === null) { console.log('(saldo do Serper desconhecido: rode node scripts/serper-saldo.js --dir <rodada>)'); return; }
  console.log('saldo do Serper: ' + s + ' créditos | esta etapa gasta até: ' + precisa);
  if (s < precisa) pareSemCredito(cfg, 'os créditos do Serper não cobrem esta etapa (' + s + ' < ' + precisa + ')');
}

/** Para o script com código 3 e a instrução de troca de chave. Tudo o que já foi pago está salvo: a etapa retoma de onde parou. */
function pareSemCredito(cfg, motivo) {
  console.error('PARE: ' + motivo + '. Abra no Chrome do operador https://serper.dev/api-keys e, no Bloco de Notas, o arquivo da chave (' + ((cfg && cfg.serper && cfg.serper.envFile) || '.env') + '); ele põe crédito ou troca a chave e avisa. Depois: node scripts/serper-saldo.js --dir <rodada> e rode a etapa de novo (ela continua de onde parou).');
  process.exit(3);
}

/** Busca no Google pelo Serper. Devolve o JSON inteiro (guarde-o em bruto/). */
async function serperBusca(chave, q, extra = {}) {
  const r = await fetch('https://google.serper.dev/search', {
    method: 'POST', headers: { 'X-API-KEY': chave, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q, gl: 'br', hl: 'pt-br', num: 10, ...extra }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    // crédito acabou ou chave recusada no meio da etapa: para igual ao pré-cheque (código 3); quem chamou já salvou o que foi pago antes
    if (r.status === 401 || r.status === 402 || r.status === 403 || /credit|quota|balance|not enough|unauthori/i.test(t)) pareSemCredito(null, 'o Serper recusou a busca (' + r.status + ': ' + t.slice(0, 80) + ')');
    throw new Error('Serper ' + r.status);
  }
  return r.json();
}

/** curl com navegador de mentira; devolve {codigo, url, corpo}. */
function baixar(url, { tempo = 20, redirs = 6 } = {}) {
  const { spawnSync } = require('child_process');
  const r = spawnSync('curl', ['-sk', '-L', '--max-time', String(tempo), '--max-redirs', String(redirs), '-A',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36', '-w', '\n@@%{http_code} %{url_effective}', url], { maxBuffer: 20e6 });
  const s = (r.stdout || Buffer.alloc(0)).toString('utf8');
  const m = s.match(/@@(\d+) (\S+)\s*$/);
  return { codigo: m ? +m[1] : 0, url: m ? m[2] : url, corpo: s.replace(/@@\d+ \S+\s*$/, '') };
}

/** Celular antigo com 8 dígitos (sem o 9 da frente) → 11 dígitos. */
function normalizarTelefone(t) {
  t = digitos(t).replace(/^55(?=\d{10,11}$)/, '');
  return (t.length === 10 && /[6-9]/.test(t[2])) ? t.slice(0, 2) + '9' + t.slice(2) : t;
}
const ehCelular = (t) => t.length === 11 && t[2] === '9';
const formatarTelefone = (t) => '(' + t.slice(0, 2) + ') ' + (t.length === 11 ? t.slice(2, 7) + '-' + t.slice(7) : t.slice(2, 6) + '-' + t.slice(6));

/** Caminho do Chrome (config.chrome, CHROME_PATH ou os lugares de costume). */
function chromeExe(cfg = {}) {
  return [cfg.chrome, process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((x) => fs.existsSync(x)) || '';
}

/** Abre um arquivo ou endereço no Chrome do operador (janela normal, para ele ver). */
function abrirNoChrome(alvo, cfg = {}) {
  const { spawn } = require('child_process');
  const c = chromeExe(cfg);
  if (c) spawn(c, [alvo], { detached: true, stdio: 'ignore' }).unref();
  else if (process.platform === 'win32') spawn('cmd', ['/c', 'start', '', alvo], { detached: true, stdio: 'ignore' }).unref();
  else spawn(process.platform === 'darwin' ? 'open' : 'xdg-open', [alvo], { detached: true, stdio: 'ignore' }).unref();
}

/** Número que conta como WhatsApp do lead: a Evolution confirmou, não é de contador e não veio só do cadastro de um CNPJ a conferir. */
const waValido = (w) => !!(w && w.existe && !w.contador && w.so_cnpj !== 'a_conferir');

/** Pasta de perfil própria para o Chrome headless (nunca o perfil do operador: sem ela, o Chrome pode abrir uma aba na janela dele). */
function perfilChrome(nome) {
  const p = path.join(require('os').tmpdir(), 'prospecta-chrome', String(nome || 'geral') + '-' + process.pid);
  fs.mkdirSync(p, { recursive: true });
  return p;
}

module.exports = { waValido, perfilChrome, pareSemCredito, chromeExe, abrirNoChrome, args, pastaRodada, lerJson, gravarJson, config, lerLeads, gravarLeads, ativos, norm, digitos, dormir, log, csvCel, csvParse, remover, lerChave, registrarCreditos, saldoSerper, conferirSaldo, serperBusca, baixar, normalizarTelefone, ehCelular, formatarTelefone };
