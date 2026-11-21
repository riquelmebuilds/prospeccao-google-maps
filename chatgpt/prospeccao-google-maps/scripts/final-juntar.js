// Etapa 12: confere repetidos, junta as fichas da mesma empresa, imprime o funil e grava o rodada.md.
// Uso: node final-juntar.js --dir <rodada> [--aplicar]
// Sem --aplicar só mostra. Com --aplicar junta: mesmo CNPJ; ou mesmo Instagram COM o mesmo telefone ou endereço
// (o mesmo @ em empresas com telefone e endereço diferentes fica como está, com o aviso que a etapa 4 deu). Grava rodada.md.
// Depois: node lista-montar.js --dir <rodada> --etapa "lista final" --abrir
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a);
const todos = L.lerLeads(dir); const ativos = L.ativos(todos);
const grupos = (chaveDe) => { const m = new Map(); for (const l of ativos) { const k = chaveDe(l); if (k) (m.get(k) || m.set(k, []).get(k)).push(l); } return [...m.entries()].filter(([, v]) => v.length > 1); };
const igual = (x, y) => (L.digitos(x.telefone).length >= 8 && L.digitos(x.telefone).slice(-8) === L.digitos(y.telefone).slice(-8)) || (L.norm(x.endereco) && L.norm(x.endereco) === L.norm(y.endereco));
const porIg = grupos((l) => l.instagram && l.instagram.handle.toLowerCase());
const porCnpj = grupos((l) => l.cnpj && l.cnpj.numero && l.cnpj.nivel === 'confirmado' && l.cnpj.numero);
const porTel = grupos((l) => { const w = (l.whats || []).find((x) => x.existe); return w && w.numero; });
const mostra = (t, g) => { console.log(`\n${t}: ${g.length}`); g.forEach(([k, v]) => console.log(`  ${k} → ${v.map((l) => l.nome).join(' | ')}`)); };
mostra('Mesmo Instagram', porIg); mostra('Mesmo CNPJ confirmado', porCnpj); mostra('Mesmo WhatsApp (mesmo dono, rede ou central: fica, com aviso)', porTel);

if (a.aplicar) {
  let juntados = 0;
  const juntar = (base, l, porque) => {
    base.outras_fichas = (base.outras_fichas || []).concat([{ nome: l.nome, endereco: l.endereco, telefone: l.telefone, maps: l.maps }]);
    const nums = new Set((base.whats || []).map((w) => w.numero)); for (const w of l.whats || []) if (!nums.has(w.numero)) (base.whats = base.whats || []).push(w);
    L.remover(dir, l, 'mesma empresa que ' + base.nome + ' (' + porque + '; junto no cartão dela)', 'lista final'); juntados++;
  };
  for (const [, v] of porCnpj) { const vivos = v.filter((l) => l.estado !== 'removido'); for (const l of vivos.slice(1)) juntar(vivos[0], l, 'mesmo CNPJ'); }
  for (const [, v] of porIg) { const vivos = v.filter((l) => l.estado !== 'removido'); for (const l of vivos.slice(1)) if (igual(vivos[0], l)) juntar(vivos[0], l, 'mesmo Instagram e mesmo telefone ou endereço'); }
  for (const [num, v] of porTel) for (const l of v) if (l.estado !== 'removido') {
    const m = 'o WhatsApp ' + L.formatarTelefone(num) + ' também é de: ' + v.filter((x) => x !== l).map((x) => x.nome).join(', ');
    if (!String(l.aviso || '').includes(m)) l.aviso = [l.aviso, m].filter(Boolean).join('; ');
  }
  L.gravarLeads(dir, todos);
  console.log('\nFichas juntadas:', juntados);
}

// funil, na ordem das etapas
const ORDEM = ['captar', 'nicho por cima', 'site por cima', 'instagram', 'bio', 'site a fundo', 'cnpj', 'particular ou pública', 'operador', 'lista final'];
const rem = {}; todos.filter((l) => l.estado === 'removido').forEach((l) => { const k = String(l.etapa_remocao); rem[k] = (rem[k] || 0) + 1; });
const at = L.ativos(L.lerLeads(dir));
const waOk = (l) => (l.whats || []).some(L.waValido);
const g = (l) => (!l.site ? 'sem site' : l.site.tipo === 'morto' ? 'domínio que não funciona' : l.site.tipo === 'duvida' ? 'site em dúvida' : l.site.tipo === 'real' ? 'tem site' : 'sem site');
const abas = {}; at.forEach((l) => { const k = g(l) + (waOk(l) ? ' · com WhatsApp' : ' · sem WhatsApp'); abas[k] = (abas[k] || 0) + 1; });
const linhasCred = fs.existsSync(path.join(dir, 'creditos.log')) ? fs.readFileSync(path.join(dir, 'creditos.log'), 'utf8').split('\n').filter(Boolean) : [];
const cred = {}; linhasCred.forEach((x) => { const p = x.split('\t'); if (p[1] !== 'saldo') cred[p[1]] = (cred[p[1]] || 0) + (Number(p[2]) || 0); });
const totalCred = Object.values(cred).reduce((s, x) => s + x, 0);
const funil = ['Fichas únicas captadas: ' + todos.length];
for (const k of ORDEM.concat(Object.keys(rem).filter((x) => !ORDEM.includes(x)))) if (rem[k]) funil.push('Saíram na etapa "' + k + '": ' + rem[k]);
funil.push('Leads na lista final: ' + at.length);
const cartoes = Object.entries(abas).map(([k, v]) => '- ' + k + ': ' + v);
const extra = [
  'Com WhatsApp do dono (provável): ' + at.filter((l) => l.whatsapp_dono).length,
  'CNPJ confirmado: ' + at.filter((l) => l.cnpj && l.cnpj.nivel === 'confirmado').length + ' · a conferir: ' + at.filter((l) => l.cnpj && l.cnpj.numero && l.cnpj.nivel !== 'confirmado').length + ' · sem CNPJ: ' + at.filter((l) => !(l.cnpj && l.cnpj.numero)).length,
  'Instagram com aviso de conferir: ' + at.filter((l) => l.instagram && l.instagram.suspeito).length,
];
const saldo = L.saldoSerper(dir, L.config(dir));
console.log('\n=== FUNIL ===\n' + funil.join('\n') + '\n\nAbas:\n' + cartoes.join('\n') + '\n\n' + extra.join('\n') + '\n\nCréditos do Serper: ' + totalCred + ' ' + JSON.stringify(cred) + ' | saldo estimado: ' + (saldo === null ? 'desconhecido' : saldo));
if (a.aplicar || a.registrar) {
  const ref = path.join(dir, 'rodada.md');
  const antigo = fs.existsSync(ref) ? fs.readFileSync(ref, 'utf8') : '';
  const notas = (antigo.split('## Decisões e travas')[1] || '\n- (anote aqui as decisões tomadas sem o operador e o que travou)\n');
  fs.writeFileSync(ref, `# Rodada ${path.basename(dir)}\n\nAtualizado em ${new Date().toLocaleString('pt-BR')}\n\n## Funil\n${funil.map((x) => '- ' + x).join('\n')}\n\n## Lista final\n${cartoes.join('\n')}\n\n${extra.map((x) => '- ' + x).join('\n')}\n\n## Créditos do Serper\n- Total: ${totalCred}\n${Object.entries(cred).map(([k, v]) => '- ' + k + ': ' + v).join('\n')}\n\n## Decisões e travas${notas}`);
  console.log('\nRegistro salvo em', ref);
}
