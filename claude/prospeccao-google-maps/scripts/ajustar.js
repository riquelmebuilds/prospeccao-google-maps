// Ajustes pontuais num lead, sempre por script (nunca edite o leads.json à mão).
// Uso: node ajustar.js --dir <rodada> --chave l-0001 --site-ruim "motivo"   (o operador quer manter apesar do site: o lead volta, se tinha saído por site,
//                                                                            e as etapas de site não o testam de novo)
//      node ajustar.js --dir <rodada> --chave l-0001 --aviso "texto"        (acrescenta um aviso de conferir o Instagram ou o lead)
//      node ajustar.js --dir <rodada> --chave l-0001 --devolver "motivo"    (devolve um lead removido por engano; nunca um que o operador apagou)
//      node ajustar.js --dir <rodada> --chave l-0001 --instagram <@certo>   (troca um @ de outra empresa pelo certo; depois rode bio-chrome.js para ler a bio nova)
// Várias chaves: --chave l-0001,l-0002
'use strict';
const L = require('./lib');
const a = L.args(); const dir = L.pastaRodada(a);
const leads = L.lerLeads(dir);
const chaves = String(a.chave || '').split(',').map((x) => x.trim()).filter(Boolean);
if (!chaves.length) { console.error('Diga o lead: --chave l-0001'); process.exit(1); }
for (const k of chaves) {
  const l = leads.find((x) => x.chave === k); if (!l) { console.error('não achei', k); continue; }
  if (a['site-ruim']) {
    l.site = Object.assign({}, l.site, { tipo: 'ruim', resultado: 'tem site, mas o operador mandou manter: ' + (a['site-ruim'] === true ? 'site muito ruim' : a['site-ruim']), fase: 'fundo' });
    if (l.estado === 'removido' && /site/.test(String(l.motivo))) { l.estado = 'ativo'; l.devolvido = 'site ruim, mantido pelo operador'; }
  }
  if (a.aviso && a.aviso !== true) { l.instagram = l.instagram || {}; l.instagram.suspeito = [l.instagram.suspeito, a.aviso].filter(Boolean).join('; '); }
  if (a.instagram && a.instagram !== true) {
    // troca o @ errado pelo certo (achado na busca salva ou na bio); a bio é lida de novo pelo bio-chrome.js
    const h = String(a.instagram).replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '');
    const velho = l.instagram && l.instagram.handle;
    l.instagram = { handle: h, url: 'https://www.instagram.com/' + h + '/', titulo: '', trecho: '', fonte: 'trocado: o @ ' + (velho || '?') + ' era de outra empresa', suspeito: '' };
    l.instagram_buscado = true; delete l.bio; delete l.nicho_bio;
  }
  if (a.devolver) {
    if (l.etapa_remocao === 'operador') { console.error(k + ': foi o operador que apagou; não devolvo.'); continue; }
    l.estado = 'ativo'; l.devolvido = a.devolver === true ? 'devolvido' : a.devolver;
  }
  console.log('ok', k, l.nome, '| estado:', l.estado, l.site ? '| site: ' + l.site.tipo : '');
}
L.gravarLeads(dir, leads);
