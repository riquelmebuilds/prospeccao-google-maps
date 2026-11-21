// Etapas 9, 10 e 11 (testar): consulta na Evolution se cada número tem WhatsApp e lê o perfil comercial. SÓ CONSULTA: não envia mensagem.
// Uso: node whats-testar.js --dir <rodada> [--refazer] [--qr]
// --qr gera o QR code para conectar a instância (WhatsApp → Aparelhos conectados → Conectar um aparelho) e abre a página.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const EV = CFG.evolution || {};
const URL = (EV.url || 'http://localhost:8080').replace(/\/$/, ''); const INST = EV.instancia || 'agendamento';
const KEY = L.lerChave(EV.chaveVar || 'AUTHENTICATION_API_KEY', EV.envFile);
if (!KEY) { console.error('Sem a chave da Evolution (' + (EV.chaveVar || 'AUTHENTICATION_API_KEY') + '). Aponte config.evolution.envFile.'); process.exit(1); }
const H = { apikey: KEY, 'Content-Type': 'application/json' };

async function estado() { try { const r = await fetch(`${URL}/instance/connectionState/${INST}`, { headers: H }); return (await r.json()).instance.state; } catch (e) { return 'fora do ar (' + e.message + ')'; } }

async function qr() {
  const r = await fetch(`${URL}/instance/connect/${INST}`, { headers: H }); const j = await r.json();
  if (!j.base64) { console.log('Sem QR: a instância pode já estar conectada ou criada de outro jeito.', Object.keys(j)); return; }
  const arq = path.join(dir, 'qr-whatsapp.html');
  fs.writeFileSync(arq, `<!doctype html><meta charset="utf-8"><title>Conectar WhatsApp</title><body style="font-family:sans-serif;text-align:center;padding:30px"><h2>Conectar o WhatsApp para testar os números</h2><p>No celular: WhatsApp → Configurações → Aparelhos conectados → Conectar um aparelho.</p><img src="${j.base64}" width="380"><p>O código expira em cerca de 1 minuto. Se expirar, rode de novo com --qr.</p></body>`);
  if (process.platform === 'win32') spawnSync('cmd', ['/c', 'start', '', arq]); else spawnSync(process.platform === 'darwin' ? 'open' : 'xdg-open', [arq]);
  console.log('QR aberto em ' + arq + '. Peça ao operador para ler com o celular e rode de novo.');
}

// Evolution fora do ar: liga o Docker Desktop (se preciso) e sobe os contêineres (docker compose up -d na pasta do envFile ou de config.evolution.compose).
async function subirEvolution() {
  const { execSync, spawn } = require('child_process');
  const ok = () => { try { execSync('docker info', { stdio: 'ignore', timeout: 20000 }); return true; } catch { return false; } };
  if (!ok()) {
    const dd = EV.dockerDesktop || 'C:/Program Files/Docker/Docker/Docker Desktop.exe';
    if (process.platform === 'win32' && fs.existsSync(dd)) { console.log('ligando o Docker Desktop...'); spawn(dd, [], { detached: true, stdio: 'ignore' }).unref(); }
    for (let i = 0; i < 40 && !ok(); i++) await L.dormir(5000);
    if (!ok()) { console.error('O Docker não subiu em 3 minutos. Peça ao operador para abrir o Docker Desktop.'); process.exit(2); }
  }
  const pasta = EV.compose || (EV.envFile && path.dirname(EV.envFile));
  if (pasta && fs.existsSync(pasta)) { console.log('subindo a Evolution (docker compose up -d)...'); try { execSync('docker compose up -d', { cwd: pasta, stdio: 'ignore', timeout: 180000 }); } catch (e) { console.error('docker compose falhou:', e.message); } }
  for (let i = 0; i < 24; i++) { await L.dormir(5000); const s = await estado(); if (!/fora do ar/.test(s)) return s; }
  return await estado();
}

(async () => {
  if (a.qr) { await qr(); return; }
  let st = await estado();
  if (/fora do ar/.test(st)) st = await subirEvolution();
  console.log('Evolution, instância "' + INST + '":', st);
  if (st !== 'open') { console.error('A instância não está conectada: abrindo o QR para o operador ler no celular (WhatsApp → Aparelhos conectados). Depois rode de novo.'); await qr(); process.exit(2); }

  const leads = L.lerLeads(dir);
  const todos = new Map();
  for (const l of L.ativos(leads)) for (const w of l.whats || []) if (a.refazer || w.existe === undefined) todos.set(w.numero, null);
  const nums = [...todos.keys()];
  console.log('números a testar:', nums.length);
  const res = {};
  for (let i = 0; i < nums.length; i += 10) {
    const lote = nums.slice(i, i + 10);
    const r = await fetch(`${URL}/chat/whatsappNumbers/${INST}`, { method: 'POST', headers: H, body: JSON.stringify({ numbers: lote.map((n) => '55' + n) }) });
    if (!r.ok) { console.error('erro na Evolution', r.status, await r.text()); process.exit(1); }
    const j = await r.json();
    j.forEach((x, k) => { res[lote[k]] = { existe: !!x.exists, jid: x.jid || '' }; });
  }
  for (const [n, o] of Object.entries(res).filter(([, o]) => o.existe)) {
    try {
      const r = await fetch(`${URL}/chat/fetchBusinessProfile/${INST}`, { method: 'POST', headers: H, body: JSON.stringify({ number: o.jid || '55' + n }) });
      if (r.ok) { const p = await r.json(); if (p && (p.description || p.email || p.address || (p.website || []).length)) o.perfil = { descricao: p.description || '', email: p.email || '', endereco: p.address || '', site: p.website || [] }; }
    } catch { /* sem perfil comercial */ }
    await L.dormir(300);
  }
  fs.mkdirSync(path.join(dir, 'bruto', 'whats'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'bruto', 'whats', 'teste-' + Date.now() + '.json'), JSON.stringify(res, null, 1));
  for (const l of L.ativos(leads)) for (const w of l.whats || []) if (res[w.numero]) { w.existe = res[w.numero].existe; w.jid = res[w.numero].jid; if (res[w.numero].perfil) w.perfil = res[w.numero].perfil; w.testado_em = new Date().toISOString(); }
  L.gravarLeads(dir, leads);

  const at = L.ativos(leads); const tem = (l) => (l.whats || []).some((w) => w.existe);
  const v = Object.values(res);
  console.log(`\ntestados: ${v.length} | com WhatsApp: ${v.filter((x) => x.existe).length} | sem: ${v.filter((x) => !x.existe).length} | com perfil comercial: ${v.filter((x) => x.perfil).length}`);
  console.log(`leads com pelo menos um WhatsApp: ${at.filter(tem).length} de ${at.length}`);
  console.log('leads SEM nenhum WhatsApp:', at.filter((l) => !tem(l)).map((l) => l.nome).join(' | ') || '—');
  const aviso = at.flatMap((l) => (l.whats || []).filter((w) => w.perfil && /contab|psic|advoc|cl[ií]nica|imobili/i.test(w.perfil.descricao || '')).map((w) => `${l.nome}: ${w.numero} (${w.perfil.descricao})`));
  if (aviso.length) console.log('\nAvisos de perfil que parece de outra atividade:\n  ' + aviso.join('\n  '));
})();
