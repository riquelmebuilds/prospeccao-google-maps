// A lista viva da rodada: uma página só, no design MazyOS, regerada no fim de cada etapa. Chave fixa "rodada-<pasta>": o que o operador
// apaga numa versão continua apagado nas seguintes (e marcacoes-chrome.js lê essa mesma chave antes de cada etapa).
// Uso: node lista-montar.js --dir <rodada> --etapa "<nome da etapa que acabou>" [--abrir]
//      --abrir abre no Chrome do operador (faça isso na primeira vez que a lista sai e na lista final).
// Abas (só aparecem as que têm lead): tipo de site × WhatsApp, cidades sempre juntas:
//   Sem site · com WhatsApp | Domínio que não funciona · com WhatsApp | Site em dúvida · com WhatsApp | e as mesmas "sem WhatsApp".
//   Antes do teste de WhatsApp, as abas são só pelo tipo de site; antes da etapa de site, uma aba só.
// Cada cartão: o que a empresa é, WhatsApp da empresa e do dono (rotulados), Instagram, Maps, o link de TODO site achado (com o resultado do teste),
// bio, CNPJ, dono e sócios, porte, avisos (Instagram suspeito, particular ou pública?, CNPJ a conferir). Mais avaliações primeiro.
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const leads = L.ativos(L.lerLeads(dir));
const host = (u) => ((String(u).match(/^(?:https?:\/\/)?([^\/?#]+)/i) || [])[1] || String(u)).toLowerCase().replace(/^www\./, '');
const fmt = (n) => L.formatarTelefone(L.normalizarTelefone(n));
const wa = (n) => 'https://wa.me/55' + L.normalizarTelefone(n);
const temSite = leads.some((l) => l.site);
const testouWa = leads.some((l) => (l.whats || []).some((w) => w.existe !== undefined));

// R só existe quando a oferta não é site (config.tirarQuemTemSite = false): aí quem tem site funcionando fica, num grupo próprio
const grupoSite = (l) => (!l.site ? 'N' : l.site.tipo === 'morto' ? 'D' : l.site.tipo === 'duvida' ? 'F' : l.site.tipo === 'real' ? 'R' : 'N');
const soCnpjAConferir = (w) => w.so_cnpj === 'a_conferir';
const waConfirmados = (l) => (l.whats || []).filter((w) => w.existe && !w.contador);   // todos os botões (inclusive os "a conferir")
const temWaValido = (l) => (l.whats || []).some(L.waValido);                          // o que decide a aba com/sem WhatsApp
const secaoDe = (l) => (!temSite ? 'T' : grupoSite(l)) + (testouWa ? (temWaValido(l) ? 'A' : 'B') : '');

function oQueE(l) {
  if (l.o_que_e) return l.o_que_e;
  const txt = [l.nome, l.categoria, l.bio && l.bio.texto].join(' ');
  for (const r of ((CFG.nicho && CFG.nicho.rotulos) || [])) if (new RegExp(r.padrao, 'i').test(txt)) return r.rotulo;
  return l.categoria || '';
}

function cartao(l) {
  const chips = []; const botoes = []; const campos = [];
  const q = oQueE(l); if (q) chips.push({ html: '<b>O que é:</b> ' + esc(q) });
  const nota = parseFloat(l.nota); chips.push({ html: nota ? '<b>' + nota.toFixed(1).replace('.', ',') + '</b> · ' + (l.avaliacoes || 0) + ' avaliações' : 'sem avaliações' });
  if (l.site) chips.push({ html: { morto: '<b>domínio que não funciona</b>', duvida: '<b>site em dúvida</b>', hub: 'sem site (só página de links)', ruim: 'site muito ruim (você mandou manter)', real: '<b>tem site funcionando</b>' }[l.site.tipo] || 'sem site' });
  if (l.instagram && l.instagram.suspeito) chips.push({ html: '<b>Confira o Instagram:</b> ' + esc(l.instagram.suspeito) });
  if (!l.instagram && l.instagram_buscado) chips.push({ html: '<b>Instagram não encontrado</b>' });
  if (l.nicho_bio === 'duvida') chips.push({ html: '<b>Nicho em dúvida:</b> ' + esc(l.nicho_motivo || 'a bio não deixa claro') });
  if (l.particular && l.particular.decisao === 'nao_sei') chips.push({ html: '<b>Particular ou pública? Não deu pra dizer</b>' });
  if (l.cnpj && l.cnpj.numero) chips.push({ html: l.cnpj.nivel === 'confirmado' ? 'CNPJ confirmado' : '<b>CNPJ a conferir</b>' });
  if (l.aviso) chips.push({ html: esc(l.aviso) });
  if (l.porte_aviso) chips.push({ html: '<b>Porte:</b> ' + esc(l.porte_aviso) });

  // WhatsApp: o da empresa primeiro, depois o do dono, depois os do cadastro a conferir. Só número que a Evolution confirmou vira botão.
  const confirmados = waConfirmados(l);
  const dono = l.whatsapp_dono && confirmados.find((w) => w.numero === l.whatsapp_dono.numero);
  const daEmpresa = confirmados.filter((w) => !w.so_cnpj).sort((x, y) => (/agente|Google/.test(x.fonte || '') ? 1 : 0) - (/agente|Google/.test(y.fonte || '') ? 1 : 0));
  const usados = new Set();
  if (daEmpresa[0]) { const w = daEmpresa[0]; usados.add(w.numero); botoes.push({ tipo: 'wa', titulo: 'WhatsApp da empresa ' + fmt(w.numero) + (dono && dono.numero === w.numero ? ' (também do dono)' : ''), sub: 'testado: tem WhatsApp · ' + String(w.fonte || '').slice(0, 90), href: wa(w.numero) }); }
  if (dono && !usados.has(dono.numero)) { usados.add(dono.numero); botoes.push({ tipo: 'wa', titulo: 'WhatsApp do dono ' + fmt(dono.numero) + ' (' + l.whatsapp_dono.nome + ', provável)', sub: l.whatsapp_dono.prova, href: wa(dono.numero) }); }
  for (const w of confirmados.filter((x) => !usados.has(x.numero))) {
    usados.add(w.numero);
    const rot = w.so_cnpj ? (soCnpjAConferir(w) ? 'WhatsApp do cadastro do CNPJ (a conferir) ' : 'WhatsApp do cadastro do CNPJ ') : 'Outro WhatsApp ';
    botoes.push({ tipo: 'wa', titulo: rot + fmt(w.numero), sub: 'testado: tem WhatsApp · ' + String(w.fonte || '').slice(0, 90), href: wa(w.numero) });
  }
  if (l.instagram) botoes.push({ tipo: 'ig', titulo: 'Instagram @' + l.instagram.handle, href: l.instagram.url });
  if (l.maps) botoes.push({ titulo: 'Google Maps', href: l.maps });
  // o link de TODO site achado (ficha, bio, Linktree, Google), com o resultado do teste
  const sites = new Map();
  for (const c of (l.site && l.site.candidatos) || []) if (c.url) sites.set(c.url_final || c.url, { tipo: c.tipo, origem: c.origem, detalhe: c.detalhe });
  if (l.site_maps && !sites.has(l.site_maps)) sites.set(l.site_maps, { tipo: '', origem: 'ficha do Maps' });
  for (const u of (l.bio && l.bio.links) || []) if (!sites.has(u)) sites.set(u, { tipo: '', origem: 'bio' });
  const rotTipo = { real: 'abre', morto: 'não abre', duvida: 'dúvida', hub: 'página de links', parado: 'parado' };
  for (const [u, s] of sites) botoes.push({ titulo: 'Abrir ' + host(u) + (s.tipo ? ' (' + (rotTipo[s.tipo] || s.tipo) + ')' : ''), sub: s.origem, href: /^https?:/i.test(u) ? u : 'http://' + u });

  if (l.site) campos.push({ rotulo: 'Teste do site', html: esc(l.site.resultado || l.site.tipo) + ((l.site.candidatos || []).length ? '<br><small>' + l.site.candidatos.map((c) => esc((c.url_final || c.url) + ' · ' + c.origem + ' · ' + c.tipo + ' · ' + (c.detalhe || ''))).join('<br>') + '</small>' : ''), tipo: 'fonte' });
  if (l.bio && l.bio.texto) campos.push({ rotulo: 'Bio do Instagram', html: esc(l.bio.texto).replace(/\n/g, '<br>') + (l.bio.seguidores ? '<br><small>' + esc(l.bio.seguidores) + ' seguidores</small>' : ''), tipo: 'fonte' });
  else if (l.instagram && l.instagram.trecho) campos.push({ rotulo: 'Bio (trecho do Google)', html: esc(l.instagram.trecho), tipo: 'fonte' });
  const c = l.cnpj;
  if (c && c.numero) {
    campos.push({ rotulo: 'CNPJ', html: '<b>' + esc(c.numero) + '</b> · ' + esc(c.razao) + (c.situacao && c.situacao !== 'ativa' ? ' · <b>situação: ' + esc(c.situacao) + '</b>' : '') + '<br><small>' + esc(c.nivel === 'confirmado' ? 'confirmado' : 'a conferir: ' + (c.nivel_motivo || c.confianca || '')) + '</small>', tipo: c.nivel === 'confirmado' ? 'fonte' : 'obs' });
    const socios = (c.socios || []).map((s) => (typeof s === 'string' ? s : s.nome || '')).filter(Boolean);
    const resp = c.dono ? c.dono.nome + (c.dono.qualificacao ? ' (' + c.dono.qualificacao + ')' : '') : c.responsavel || '';
    campos.push({ rotulo: c.nivel === 'confirmado' ? 'Dono / responsável' : 'Dono / responsável (CNPJ a conferir)', html: esc(resp || 'o cadastro não traz o nome') + (socios.length ? '<br><small>sócios: ' + esc(socios.join(', ')) + '</small>' : '') });
    const cap = Number(String(c.capital_social || '0').replace(/\./g, '').replace(',', '.')); const ini = String(c.inicio_atividade || '');
    const porte = [cap ? 'capital social R$ ' + cap.toLocaleString('pt-BR') : '', ini.length === 8 ? 'aberta em ' + ini.slice(6) + '/' + ini.slice(4, 6) + '/' + ini.slice(0, 4) : ''].filter(Boolean).join(' · ');
    if (porte) campos.push({ rotulo: 'Porte', html: esc(porte) });
  } else if (leads.some((x) => x.cnpj)) campos.push({ rotulo: 'CNPJ', html: 'não encontrei CNPJ no endereço da ficha', tipo: 'obs' });
  if (l.particular) campos.push({ rotulo: 'Particular ou pública', html: esc({ particular: 'particular', nao_sei: 'não deu pra dizer' }[l.particular.decisao] || l.particular.decisao) + (l.particular.fontes.length ? '<br><small>' + l.particular.fontes.map((e) => esc(e.fonte + ': ' + e.prova)).join('<br>') + '</small>' : ''), tipo: 'obs' });
  const semWa = (l.whats || []).filter((w) => w.existe === false);
  if (semWa.length) campos.push({ rotulo: 'Números sem WhatsApp', html: semWa.map((w) => esc(fmt(w.numero)) + ' <small>(' + esc(String(w.fonte || '').slice(0, 60)) + ')</small>').join('<br>') });
  if ((l.outras_fichas || []).length) campos.push({ rotulo: 'Outra ficha do Google', html: l.outras_fichas.map((f) => esc(f.nome + ' · ' + (f.telefone || '') + ' · ' + (f.endereco || ''))).join('<br>'), tipo: 'obs' });
  if (l.telefone) campos.push({ rotulo: 'Telefone (Maps)', html: esc(l.telefone) });
  campos.push({ rotulo: 'Endereço', html: esc(l.endereco) });
  if (l.nota_operador) campos.push({ rotulo: 'Tua anotação', html: esc(l.nota_operador), tipo: 'obs' });
  // o bairro do cartão é o da ficha (o Maps devolve também o entorno do bairro buscado)
  const bairroReal = l.bairro_ficha && L.norm(l.bairro_ficha) !== L.norm(l.bairro) ? l.bairro_ficha + ' (buscado em ' + l.bairro + ')' : l.bairro;
  return { chave: l.chave, nome: l.nome, bairro: l.cidade + ' · ' + bairroReal, nicho: l.categoria || '', secao: secaoDe(l), av: Number(l.avaliacoes) || 0, chips, botoes, campos };
}

const cards = leads.map(cartao).sort((x, y) => y.av - x.av);
cards.forEach((x) => delete x.av);
const n = (id) => cards.filter((x) => x.secao === id).length;
const nomeGrupo = { T: 'Leads', N: 'Sem site', D: 'Domínio que não funciona', F: 'Site em dúvida', R: 'Tem site' };
const subGrupo = { T: 'Ainda sem a conferência de site.', N: 'Sem site, ou só página de links e rede social.', D: 'O endereço existe, mas não abre: conta como sem site.', F: 'Abre, mas não deu pra provar que o site é da empresa. Abra o link e decida.', R: 'Tem site funcionando (a oferta desta rodada não é site, então ficam).' };
const secoes = [];
for (const g of temSite ? ['N', 'D', 'F', 'R'] : ['T']) for (const w of testouWa ? ['A', 'B'] : ['']) {
  const id = g + w; if (!n(id)) continue;
  secoes.push({ id, rotulo: nomeGrupo[g] + (w === 'A' ? ' · com WhatsApp' : w === 'B' ? ' · sem WhatsApp' : '') + ' (' + n(id) + ')', sub: subGrupo[g] + (w === 'A' ? ' Pelo menos um número testado tem WhatsApp.' : w === 'B' ? ' Nenhum número achado tem WhatsApp: contato pelo Instagram.' : '') });
}
const agora = new Date();
const quando = agora.toLocaleDateString('pt-BR') + ' ' + agora.toTimeString().slice(0, 5);
const base = path.basename(dir);
const dados = {
  chave: 'rodada-' + base,
  titulo: ((CFG.listas && CFG.listas.titulo) || (CFG.nicho && CFG.nicho.nome) || 'Leads'),
  eyebrow: 'Rodada ' + base, etiqueta: (CFG.listas && CFG.listas.etiqueta) || 'LISTA DE LEADS',
  subtitulo: cards.length + ' leads · atualizada em ' + quando + (a.etapa ? ' · depois da etapa: ' + a.etapa : '') + '. Mais avaliações primeiro. O que você apagar aqui não volta.',
  fundo: true, secoes, leads: cards,
  etapa: a.etapa || '', gerada_em: agora.toISOString(),   // para retomar a rodada: a última etapa concluída
};
const pasta = path.join(dir, 'lista'); fs.mkdirSync(pasta, { recursive: true });
L.gravarJson(path.join(pasta, 'dados.json'), dados);
// o gerador do design MazyOS: config.listas.gerador, ou lista/gerar.js dentro da skill, ou ferramentas/lista/gerar.js do projeto onde a skill está instalada
const gerar = (CFG.listas && CFG.listas.gerador) || [path.join(__dirname, '..', 'lista', 'gerar.js'), path.join(__dirname, '..', '..', '..', '..', 'ferramentas', 'lista', 'gerar.js')].find((p) => fs.existsSync(p)) || path.join(__dirname, '..', 'lista', 'gerar.js');
if (!fs.existsSync(gerar)) { console.error('Não achei o gerador da lista (' + gerar + '). Aponte config.listas.gerador para ferramentas/lista/gerar.js.'); process.exit(1); }
const r = spawnSync(process.execPath, [gerar, pasta], { encoding: 'utf8', maxBuffer: 1 << 28 });
console.log(((r.stdout || '') + (r.stderr || '')).trim());
console.log('abas:', secoes.map((s) => s.rotulo).join(' | '), '| total:', cards.length);
if (a.abrir) L.abrirNoChrome(path.join(pasta, 'lista.html'), CFG);
