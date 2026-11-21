// Auditoria: confere se o que cada etapa afirma tem prova gravada. Rode no fim de cada etapa, antes de seguir para a próxima.
// Uso: node auditar.js --dir <rodada> [--etapa captar|nicho|site|instagram|bio|cnpj|particular|whats|lista|todas] [--fundo]
// --fundo (com --etapa site, no fim da etapa 6): confere também que todo lead passou pela conferência a fundo.
// Sai com código 1 se achar problema: corrija e rode de novo. O operador não pode achar um erro que este script acharia.
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const etapa = String(a.etapa || 'todas');
const todos = L.lerLeads(dir); const leads = L.ativos(todos);
const problemas = [];
const erro = (cat, l, msg) => problemas.push(cat + ' | ' + (l ? l.nome + ' (' + l.chave + '): ' : '') + msg);
const quer = (e) => etapa === 'todas' || etapa === e;

// nada some sem registro
{
  const arq = path.join(dir, 'removidos.csv');
  const linhas = fs.existsSync(arq) ? fs.readFileSync(arq, 'utf8').split('\n').filter(Boolean).length - 1 : 0;
  const removidos = todos.filter((l) => l.estado === 'removido').length;
  if (linhas < removidos) erro('registro', null, removidos + ' leads removidos, mas só ' + linhas + ' linhas em removidos.csv');
  for (const l of todos.filter((x) => x.estado === 'removido' && !x.motivo)) erro('registro', l, 'removido sem motivo');
}
if (quer('captar')) {
  if (!todos.length) erro('captar', null, 'leads.json vazio: a captação não gravou nada');
  for (const l of todos) if (!l.chave || !l.nome || !l.maps) erro('captar', l, 'ficha sem chave, nome ou link do Maps');
  const vistos = new Set(); for (const l of leads) { if (vistos.has(l.maps)) erro('captar', l, 'ficha repetida (mesmo link do Maps)'); vistos.add(l.maps); }
}
if (quer('nicho')) {
  const N = CFG.nicho || {}; const rx = (s) => (s ? new RegExp(s, 'i') : null);
  const FC = rx(N.categoriasFora), FN = rx(N.nomesFora);
  for (const l of leads) {
    if (FC && FC.test(l.categoria || '')) erro('nicho', l, 'categoria de fora ainda ativa: ' + l.categoria);
    if (FN && FN.test(l.nome || '')) erro('nicho', l, 'nome de fora ainda ativo');
  }
}
if (quer('site')) for (const l of leads) {
  if (!l.site) erro('site', l, 'sem resultado de site gravado');
  else if (!l.site.resultado) erro('site', l, 'site sem o texto do teste');
  else if (l.site.tipo === 'real' && CFG.tirarQuemTemSite !== false) erro('site', l, 'tem site funcionando e continua ativo');
  if (l.site && (a.fundo || etapa === 'todas') && l.site.tipo !== 'ruim' && l.site.fase !== 'fundo') erro('site', l, 'ainda não passou pela conferência a fundo (site-checar.js --fase fundo)');
}
if (quer('instagram')) {
  const porHandle = new Map();
  for (const l of leads) {
    if (!l.instagram_buscado && !l.instagram) erro('instagram', l, 'Instagram não buscado');
    else if (!l.instagram) erro('instagram', l, 'sem Instagram e ainda ativo: rode instagram-serper.js --tirar-sem-instagram');
    if (!l.instagram) continue;
    const h = String(l.instagram.handle || '').toLowerCase(); porHandle.set(h, (porHandle.get(h) || []).concat(l));
    if (!l.instagram.url) erro('instagram', l, '@ sem link');
  }
  for (const [h, v] of porHandle) if (v.length > 1 && v.some((x) => !String(x.instagram.suspeito || '').includes('mesmo @'))) erro('instagram', v[0], '@' + h + ' repetido sem aviso em ' + v.map((x) => x.nome).join(' | '));
}
if (quer('bio')) for (const l of leads) {
  if (!l.instagram) continue;
  if (!(l.bio && l.bio.texto) && !l.instagram.trecho) erro('bio', l, 'nem a bio do Chrome nem o trecho do Google: leia de novo (bio-chrome.js) ou peça o login');
  if (!l.nicho_bio) erro('bio', l, 'sem decisão de nicho pela bio (bio-decidir.js)');
  if (!l.o_que_e) erro('bio', l, 'falta "o_que_e" (o que a empresa é e oferece, em uma frase)');
}
if (quer('cnpj')) for (const l of leads) {
  if (!l.cnpj_buscado && !l.cnpj) erro('cnpj', l, 'CNPJ não procurado');
  if (l.cnpj && l.cnpj.numero && !l.cnpj.nivel) erro('cnpj', l, 'CNPJ sem nível (rode cnpj-refinar.js)');
  if (l.cnpj && l.cnpj.nivel === 'confirmado' && !(l.cnpj.provas || []).length) erro('cnpj', l, 'confirmado sem provas');
}
if (quer('particular') && CFG.nicho && CFG.nicho.publicaOuParticular) for (const l of leads) {
  if (!l.particular) erro('particular', l, 'sem decisão de particular ou pública');
  else if (l.particular.decisao === 'publica') erro('particular', l, 'pública e continua ativa');
}
if (quer('whats')) for (const l of leads) {
  for (const w of l.whats || []) {
    if (w.existe === undefined) erro('whats', l, 'número ' + w.numero + ' sem teste na Evolution');
    if (!w.fonte) erro('whats', l, 'número ' + w.numero + ' sem fonte');
  }
  if (l.whatsapp_dono && !(l.whats || []).some((w) => w.numero === l.whatsapp_dono.numero && w.existe)) erro('whats', l, 'WhatsApp do dono sem número confirmado');
}
if (quer('lista')) {
  const arq = path.join(dir, 'lista', 'dados.json');
  if (!fs.existsSync(arq)) erro('lista', null, 'lista/dados.json não existe (rode lista-montar.js)');
  else {
    const d = JSON.parse(fs.readFileSync(arq, 'utf8'));
    if (d.chave !== 'rodada-' + path.basename(dir)) erro('lista', null, 'chave da lista "' + d.chave + '" diferente de rodada-' + path.basename(dir) + ' (as exclusões do operador se perderiam)');
    const ativosK = new Set(leads.map((l) => l.chave));
    if (d.leads.length !== leads.length) erro('lista', null, 'a lista tem ' + d.leads.length + ' cartões e há ' + leads.length + ' leads ativos: regere a lista');
    for (const c of d.leads) if (!ativosK.has(c.chave)) erro('lista', null, 'cartão de lead removido na lista: ' + c.nome);
    const ok = /^(T|N|D|F|R)(A|B)?$/;
    for (const s of d.secoes) if (!ok.test(s.id)) erro('lista', null, 'aba fora do padrão (separar por cidade não vale): ' + s.rotulo);
  }
}
console.log('leads ativos:', leads.length, '| etapa:', etapa);
if (problemas.length) { console.log(problemas.length + ' problema(s):\n' + problemas.slice(0, 60).join('\n')); process.exit(1); }
console.log('Nenhum problema encontrado.');
