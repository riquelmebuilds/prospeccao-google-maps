// Etapas 9 e 11: lê os resultados dos agentes (bruto/whats-lotes/resultado-NN.json e investida-resultado-NN.json) e põe os números achados no lead, com a fonte.
// Uso: node whats-aplicar.js --dir <rodada> [--simular]
// Depois rode node whats-testar.js --dir <rodada>: só o teste na Evolution confirma que o número TEM WhatsApp.
// Regras: número sem fonte escrita é ignorado; número que o agente marcou como "de outra empresa" é ignorado; número de contador/diretório não entra.
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a);
const pasta = path.join(dir, 'bruto', 'whats-lotes');
const leads = L.lerLeads(dir); const porChave = new Map(leads.map((l) => [l.chave, l]));
let lidos = 0, novos = 0, ignorados = 0, leadsComNovo = 0;
for (const f of fs.existsSync(pasta) ? fs.readdirSync(pasta).filter((x) => /(^|-)resultado-\d+\.json$/.test(x)) : []) {
  let j; try { j = JSON.parse(fs.readFileSync(path.join(pasta, f), 'utf8')); } catch (e) { console.error('JSON inválido em', f); continue; }
  for (const r of j) {
    const l = porChave.get(r.chave); if (!l) continue; lidos++;
    let acheiAlgo = false;
    // celulares e fixos com fonte entram no teste (fixo às vezes tem WhatsApp); a confiança do agente vai junto na fonte
    for (const n of [].concat(r.numeros || [], (r.fixos || []).map((x) => ({ ...x, tipo: 'fixo' })))) {
      const num = L.normalizarTelefone(String(n.numero || ''));
      if (num.length < 10 || num.length > 11 || !n.fonte || n.de_outra_empresa || n.contador) { ignorados++; continue; }
      l.whats = l.whats || [];
      let w = l.whats.find((x) => x.numero === num);
      if (!w) { w = { numero: num, celular: L.ehCelular(num) }; l.whats.push(w); novos++; acheiAlgo = true; }
      const f = 'agente: ' + String(n.fonte).slice(0, 110) + (n.confianca && n.confianca !== 'alta' ? ' (confiança ' + n.confianca + ')' : '');
      w.fonte = [...new Set([].concat(w.fonte ? String(w.fonte).split(' + ') : [], [f]))].join(' + ');
    }
    // o agente apontou que o lead parece errado (Instagram de outra empresa, outra cidade, fora do nicho): vira aviso no cartão
    if (r.lead_errado && l.instagram && !String(l.instagram.suspeito || '').includes(String(r.lead_errado).slice(0, 40))) {
      l.instagram.suspeito = [l.instagram.suspeito, 'agente: ' + String(r.lead_errado).slice(0, 160)].filter(Boolean).join('; ');
    }
    if (acheiAlgo) leadsComNovo++;
  }
}
if (!a.simular) L.gravarLeads(dir, leads);
console.log(`leads com resultado: ${lidos} | números novos: ${novos} em ${leadsComNovo} leads | ignorados: ${ignorados}`);
console.log('Próximo: node whats-testar.js --dir <rodada> (testa os números novos na Evolution).');
