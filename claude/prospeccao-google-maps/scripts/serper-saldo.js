// Consulta o saldo REAL do Serper (google.serper.dev/account, não gasta crédito) e grava em config.serper.saldoInicial,
// com uma marca "saldo" no creditos.log: a partir dela o saldo é estimado pelos gastos registrados.
// Uso: node serper-saldo.js --dir <rodada>
// Rode no começo da rodada e sempre que o operador trocar a chave. Nunca imprime a chave.
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const chave = L.lerChave((CFG.serper && CFG.serper.chaveVar) || 'SERPER_API_KEY', CFG.serper && CFG.serper.envFile, path.join(dir, '.env'));
if (!chave) { console.error('Sem chave do Serper (SERPER_API_KEY no ambiente ou no arquivo de config.serper.envFile).'); process.exit(1); }
(async () => {
  const r = await fetch('https://google.serper.dev/account', { headers: { 'X-API-KEY': chave } });
  const t = await r.text();
  if (!r.ok) { console.error('O Serper recusou a chave (' + r.status + '). Talvez a conta tenha acabado: peça ao operador uma chave nova.'); process.exit(3); }
  const j = JSON.parse(t);
  const saldo = Number(j.balance);
  CFG.serper = CFG.serper || {}; CFG.serper.saldoInicial = saldo;
  L.gravarJson(path.join(dir, 'config.json'), CFG);
  fs.appendFileSync(path.join(dir, 'creditos.log'), `${new Date().toISOString()}\tsaldo\t0\tsaldo real consultado: ${saldo}\n`);
  console.log('saldo real do Serper: ' + saldo + ' créditos');
})().catch((e) => { console.error('erro ao consultar o saldo:', e.message); process.exit(1); });
