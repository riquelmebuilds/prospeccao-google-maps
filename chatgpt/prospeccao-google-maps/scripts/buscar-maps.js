// Etapa 1: busca no MazyOS Scraper (Google Maps), um trabalho por bairro.
// Uso: node buscar-maps.js --dir <rodada> [--refazer]
// Vigia o trabalho: se o parcial parar de crescer por 6 min, usa o parcial, reinicia o scraper e segue. Teto de 30 min por bairro.
// Raio padrão 3 km e profundidade 12 (config.scraper.raioM / profundidade; raioM no bairro vale só para ele).
'use strict';
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const API = (CFG.scraper && CFG.scraper.api) || 'http://localhost:8090/api/v1';
// Raio 3 km e profundidade 12 deixam cada bairro mais lento: teto de 30 min por bairro e 6 min sem crescer (config.scraper.tetoMin / paradoMin mudam).
const TETO_MIN = (CFG.scraper && CFG.scraper.tetoMin) || 30;
const PARADO_MIN = (CFG.scraper && CFG.scraper.paradoMin) || 6;
const contar = (csv) => Math.max(0, csv.split('\n').filter((l) => l.trim()).length - 1);

async function noAr() { try { const r = await fetch(API + '/jobs'); return r.ok; } catch { return false; } }

async function subirScraper() {
  const exe = CFG.scraper && CFG.scraper.exe;
  if (!exe || !fs.existsSync(exe)) throw new Error('Não achei o MazyOS Scraper em config.scraper.exe (' + exe + '). Instale em https://github.com/mazzeoia/mazyos-scraper e aponte o caminho.');
  L.log('subindo o scraper (janela escondida)');
  try { execSync(process.platform === 'win32' ? 'taskkill /IM ' + path.basename(exe) + ' /F' : 'pkill -f ' + path.basename(exe), { stdio: 'ignore' }); } catch { /* não estava rodando */ }
  await L.dormir(2500);
  const porta = (CFG.scraper && CFG.scraper.porta) || 8090;
  const p = spawn(exe, ['-web', '-addr', ':' + porta, '-c', '4', '-data-folder', 'webdata'], { cwd: path.dirname(exe), detached: true, stdio: 'ignore', windowsHide: true });
  p.unref();
  for (let i = 0; i < 25; i++) { await L.dormir(2000); if (await noAr()) return; }
  throw new Error('o scraper não respondeu em ' + API);
}

async function rodarBairro(b, termos) {
  const arq = path.join(dir, 'bruto', 'maps', b.slug + '.csv');
  fs.mkdirSync(path.dirname(arq), { recursive: true });
  if (fs.existsSync(arq) && contar(fs.readFileSync(arq, 'utf8')) > 0 && !a.refazer) { L.log(`${b.nome}: já existe ${path.basename(arq)}, pulo (--refazer para refazer)`); return; }
  const body = {
    name: `${b.cidade} ${b.nome}`, keywords: termos.map((t) => `${t} em ${b.nome}, ${b.cidade}`), lang: 'pt', zoom: 15,
    lat: String(b.centro.lat), lon: String(b.centro.lon), fast_mode: false, radius: b.raioM || (CFG.scraper && CFG.scraper.raioM) || 3000, depth: (CFG.scraper && CFG.scraper.profundidade) || 12,
    email: false, extra_reviews: false, max_time: 4800000000000, proxies: null,
  };
  const r = await fetch(API + '/jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error('POST /jobs ' + r.status + ' ' + await r.text());
  const { id } = await r.json();
  L.log(`${b.nome}: trabalho ${id} criado com ${termos.length} termos`);
  const ini = Date.now(); let ultimo = -1; let cresceu = Date.now(); let fim = false; let parcial = '';
  while (!fim) {
    await L.dormir(20000);
    let status = '';
    try { status = (await (await fetch(`${API}/jobs/${id}`)).json()).Status || ''; } catch { /* tenta de novo */ }
    try { parcial = await (await fetch(`${API}/jobs/${id}/download`)).text(); } catch { /* tenta de novo */ }
    const n = contar(parcial);
    if (n > ultimo) { ultimo = n; cresceu = Date.now(); }
    L.log(`${b.nome}: status=${status} fichas=${n}`);
    if (status === 'ok') { fim = true; break; }
    if (Date.now() - cresceu > PARADO_MIN * 60000) { L.log(`${b.nome}: parado há ${PARADO_MIN} min, uso o parcial`); break; }
    if (Date.now() - ini > TETO_MIN * 60000) { L.log(`${b.nome}: passou de ${TETO_MIN} min, uso o parcial`); break; }
  }
  fs.writeFileSync(arq, parcial);
  L.log(`${b.nome}: salvo ${path.basename(arq)} com ${contar(parcial)} fichas`);
  if (!fim) { await subirScraper(); try { await fetch(`${API}/jobs/${id}`, { method: 'DELETE' }); } catch { /* ignora */ } }
}

// Coordenada do centro do bairro: Nominatim, depois Photon (grátis); se nenhum conhecer o bairro, o Google pelo Serper (places, 1 crédito).
async function coordenada(b) {
  const q = encodeURIComponent(`${b.nome}, ${b.cidade}, Brasil`);
  const tentar = async (url, ler) => { try { const r = await fetch(url, { headers: { 'User-Agent': 'prospecta-skill/1.0' } }); if (r.ok) return ler(await r.json()); } catch { /* próximo */ } return null; };
  let c = await tentar(`https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1`, (j) => (j[0] ? { lat: +j[0].lat, lon: +j[0].lon, fonte: 'nominatim' } : null));
  if (!c) c = await tentar(`https://photon.komoot.io/api/?q=${q}&limit=1`, (j) => { const f = (j.features || [])[0]; return f ? { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0], fonte: 'photon' } : null; });
  if (!c) {
    const chave = L.lerChave((CFG.serper && CFG.serper.chaveVar) || 'SERPER_API_KEY', CFG.serper && CFG.serper.envFile, path.join(dir, '.env'));
    if (chave) {
      try {
        const r = await fetch('https://google.serper.dev/places', { method: 'POST', headers: { 'X-API-KEY': chave, 'Content-Type': 'application/json' }, body: JSON.stringify({ q: `${b.nome}, ${b.cidade}`, gl: 'br', hl: 'pt-br' }) });
        const j = await r.json(); L.registrarCreditos(dir, 'captar', Number(j.credits || 1), 'coordenada de ' + b.nome);
        const p = (j.places || [])[0]; if (p && p.latitude) c = { lat: p.latitude, lon: p.longitude, fonte: 'google (serper places)' };
      } catch { /* sem coordenada */ }
    }
  }
  return c;
}

(async () => {
  const termos = (CFG.nicho && CFG.nicho.termos) || [];
  if (!termos.length) throw new Error('config.nicho.termos está vazio');
  let mudou = false;
  for (const b of CFG.bairros) {
    if (!b.slug) { b.slug = L.norm(b.cidade + ' ' + b.nome).replace(/ /g, '-'); mudou = true; }
    if (b.centro && b.centro.lat != null && b.centro.lon != null) continue;
    const c = await coordenada(b);
    if (!c) throw new Error(`não achei a coordenada de "${b.nome}, ${b.cidade}". Ponha em config.bairros (centro: {lat, lon}) a coordenada de um lugar conhecido do bairro e rode de novo.`);
    b.centro = { lat: c.lat, lon: c.lon }; L.log(`${b.nome}: coordenada pelo ${c.fonte} (${c.lat.toFixed(4)}, ${c.lon.toFixed(4)})`); mudou = true;
    await L.dormir(1100);   // o Nominatim pede no máximo 1 consulta por segundo
  }
  if (mudou) L.gravarJson(path.join(dir, 'config.json'), CFG);
  if (!(await noAr())) await subirScraper();
  const t0 = Date.now();
  for (const b of CFG.bairros) {
    if (Date.now() - t0 > 40 * 60000 * CFG.bairros.length) { L.log('teto total, parando'); break; }
    await rodarBairro(b, termos);
    await L.dormir(10000);
  }
  L.log('FIM. Próximo: node juntar-leads.js --dir ' + dir);
})().catch((e) => { console.error('ERRO', e.message); process.exit(1); });
