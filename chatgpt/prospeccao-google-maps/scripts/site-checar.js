// Etapas 3 e 6: abre o site de cada lead e vê se funciona e se é da empresa. Site funcionando e da empresa: o lead sai (removidos.csv, com o endereço).
// Domínio que não funciona e site em dúvida: o lead fica (grupo próprio na lista). Sem endereço, ou só página de links: sem site.
// Uso: node site-checar.js --dir <rodada> --fase rapida   (etapa 3, por cima: só o link da ficha do Maps)
//      node site-checar.js --dir <rodada> --fase fundo    (etapa 6, a fundo: ficha + links da bio + Linktree e parecidos expandidos
//                                                          + domínios escritos na bio + sites dos resultados do Google já salvos na etapa 4)
//      [--lote i/n] [--juntar-lotes] [--google] [--simular] [--sem-remover]
// --lote i/n: rode n processos em paralelo (cada um grava bruto/sites/lote-i.json); depois --juntar-lotes (aplica e remove).
// --google: busca nova "nome bairro cidade site oficial" (1 crédito/lead) nos que seguem sem site; quase nunca precisa.
// "Funcionando" só vale com prova de identidade (telefone da ficha na página, nome no domínio ou no título); sem prova = dúvida.
'use strict';
const fs = require('fs');
const path = require('path');
const dns = require('dns').promises;
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const FASE = a.fase;
if (FASE !== 'rapida' && FASE !== 'fundo') { console.error('Diga a fase: --fase rapida (etapa 3) ou --fase fundo (etapa 6). Com --juntar-lotes, a mesma fase dos lotes.'); process.exit(1); }
const ETAPA = FASE === 'rapida' ? 'site por cima' : 'site a fundo';
const PERFIL_CHROME = L.perfilChrome('sites-' + FASE + (a.lote ? '-' + String(a.lote).replace('/', 'de') : ''));
// config.tirarQuemTemSite = false (a oferta não é site, por exemplo um sistema de agendamento): o teste roda e informa, mas ninguém sai por ter site
const TIRAR = !(a['sem-remover'] || CFG.tirarQuemTemSite === false);
const HUBS = /(^|\.)(linktr\.ee|linktree\.com|bio\.link|bio\.site|beacons\.ai|lnk\.bio|taplink\.cc|campsite\.bio|linkin\.bio|solo\.to|linke\.to|apptuts\.bio|sandwiche\.me|wa\.me|whatsapp\.com|api\.whatsapp\.com|instagram\.com|facebook\.com|fb\.com|fb\.me|tiktok\.com|youtube\.com|youtu\.be|g\.page|goo\.gl|maps\.app\.goo\.gl|google\.com|bit\.ly|w\.app|encurtador\.com\.br|tinyurl\.com|linkme\.bio|conecta\.bio|keepo\.bio|linkfly\.to|cartoes\.digital|allmylinks\.com|linkr\.bio|instabio\.cc|hoo\.be|lnk\.to|wa\.link|dm\.wa\.link|cutt\.ly|is\.gd|t\.ly|rb\.gy|ow\.ly)$/i;
const EXPANDE = /(linktr\.ee|linktree\.com|bio\.link|bio\.site|beacons\.ai|lnk\.bio|taplink\.cc|campsite\.bio|linkin\.bio|solo\.to|linke\.to|apptuts\.bio|sandwiche\.me|linkme\.bio|conecta\.bio|keepo\.bio|linkfly\.to|cartoes\.digital|carrd\.co|allmylinks\.com|linkr\.bio|instabio\.cc|linktw\.in|hoo\.be|lnk\.to|bio\.site|zapnet|wa\.link)/i;
const ESTACIONADO = /dom[ií]nio (est[aá] )?[àa] venda|sedoparking|hugedomains|account suspended|site em constru[cç][aã]o|em constru[cç][aã]o|p[aá]gina n[aã]o encontrada|default web site|index of \/|parked|this domain/i;
const DIRETORIO = /instagram|facebook|google|tiktok|youtube|linkedin|tripadvisor|guiamais|apontador|escolas\.com|cybo|telelistas|mapquest|waze|yelp|olx|wikipedia|jusbrasil|cnpj|econodata|casadosdados|solutudo|querobolsa|educamaisbrasil|qedu|melhorescola|reclameaqui|pinterest|twitter|x\.com|mercadolivre|indeed|catho/i;

const WA = (t) => [...String(t || '').matchAll(/(?:wa\.me\/|api\.whatsapp\.com\/send\/?\?phone=|whatsapp:\/\/send\?phone=|web\.whatsapp\.com\/send\?phone=)\+?(\d{10,14})/gi)].map((m) => m[1]);
const dig = (s) => String(s || '').replace(/\D/g, '');
const host = (u) => ((String(u).match(/^https?:\/\/([^\/?#]+)/i) || [])[1] || '').toLowerCase().replace(/^www\./, '');
const textoVisivel = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
// diretórios, agregadores, encurtadores e páginas de terceiros: nunca são o site da empresa
const IGNORAR = /(^|\.)(google\.com\.br|ip-api\.com|spotify\.com|canva\.com|forms\.gle|docs\.google\.com|sympla\.com\.br|eventbrite\.com\.br|appbarber\.com\.br|booksy\.com|trinks\.com|avec\.app|avec\.beauty|cashbarber\.com\.br|simplesagenda\.com\.br|agendasalao\.com\.br|salaovip\.com\.br|gendo\.app|agendor\.com\.br|doctoralia\.com\.br|ifood\.com\.br|anota\.ai|goomer\.app|mechameaqui|mechamenozap|encurtador|taggo|sitedacidade|votorantimfacil|github|archdaily|endlista|obraverificada|loqal|acharei|opendi|consultainscricao|prospectavendas|triceleads|contate|linkfly|waze|conecta|keepo|negocio|marmorarias|solutudo|guiamais|telelistas|apontador|hagah|nexdoor|cylex|fixando|habitissimo|casa\.com|olx|mercadolivre|webcargo|ribeiraopreto\.sp\.gov|sorocaba\.sp\.gov|prefeitura|jusbrasil|cnpj|econodata|casadosdados|reclameaqui)\./i;
const urlLimpa = (u) => { u = String(u).trim().replace(/\s+e mais \d+.*$/i, '').replace(/[)\].,;]+$/, ''); if (/^l\.instagram\.com\//.test(u.replace(/^https?:\/\//, ''))) { try { return decodeURIComponent((u.match(/[?&]u=([^&]+)/) || [])[1] || u); } catch { return u; } } return /^https?:/.test(u) ? u : 'https://' + u; };

async function testar(url) {
  const h = host(url);
  if (!h) return { tipo: 'duvida', detalhe: 'endereço sem domínio' };
  if (HUBS.test(h)) return { tipo: 'hub', detalhe: 'página de links ou rede social (' + h + ')' };
  if (IGNORAR.test(h + '.')) return { tipo: 'hub', detalhe: 'diretório, agregador ou encurtador de terceiros, não é o site da empresa (' + h + ')' };
  let temDns = true; try { await dns.lookup(h); } catch { try { await dns.lookup('www.' + h); } catch { temDns = false; } }
  if (!temDns) return { tipo: 'morto', detalhe: 'o domínio não existe (sem DNS)' };
  let melhor = null;
  for (const u of [url, url.replace(/^https?:\/\/(www\.)?/, 'https://www.'), url.replace(/^https?:\/\/(www\.)?/, 'https://'), url.replace(/^https?:/, 'http:')]) {
    const r = L.baixar(u, { tempo: 18 });
    if (r.codigo && r.codigo < 400) { melhor = r; break; }
    if (!melhor || (r.codigo && !melhor.codigo)) melhor = r;
  }
  // sem resposta ou erro no curl: antes de dizer "não funciona", abre no Chrome (muito site bloqueia robô com 403 ou demora a responder)
  if (!melhor || !melhor.codigo || melhor.codigo >= 400) {
    const cod = melhor && melhor.codigo ? 'erro ' + melhor.codigo : 'sem resposta (timeout)';
    const chrome = L.chromeExe(CFG);
    if (chrome) {
      const rr = require('child_process').spawnSync(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--user-data-dir=' + PERFIL_CHROME, '--virtual-time-budget=9000', '--dump-dom', url], { encoding: 'utf8', maxBuffer: 50e6, timeout: 60000 });
      const html = rr.stdout || ''; const t2 = textoVisivel(html);
      if (/just a moment|um momento|attention required|cf-browser-verification|checking your browser/i.test(t2.slice(0, 2000))) return { tipo: 'duvida', detalhe: 'protegido por Cloudflare (' + cod + '): abra para ver', url_final: url };
      if (t2.length >= 400 && !ESTACIONADO.test(t2.slice(0, 4000))) return { tipo: 'real', detalhe: 'abre no navegador (' + cod + ' para robô), ' + t2.length + ' caracteres', url_final: url, titulo: (html.match(/<title>([^<]*)/i) || [])[1] || '', _txt: t2.slice(0, 80000), _html: html.slice(0, 400000) };
    }
    if (melhor && melhor.codigo === 404) return { tipo: 'morto', detalhe: 'a página inicial dá erro 404' };
    if (melhor && melhor.codigo >= 500) return { tipo: 'morto', detalhe: 'a página inicial dá erro ' + melhor.codigo };
    if (!melhor || !melhor.codigo) return { tipo: 'morto', detalhe: 'o domínio existe mas não responde (timeout), nem no navegador' };
    return { tipo: 'duvida', detalhe: 'bloqueia robô (' + cod + ') e não abriu no navegador: abra para ver' };
  }
  const hf = host(melhor.url);
  if (HUBS.test(hf)) return { tipo: 'hub', detalhe: 'redireciona para uma página de links (' + hf + ')' };
  const txt = textoVisivel(melhor.corpo);
  if (ESTACIONADO.test(txt.slice(0, 4000))) return { tipo: 'parado', detalhe: 'abre, mas está estacionado, à venda ou em construção', url_final: melhor.url };
  if (/canva.site|wixsite|my.canva/.test(hf)) return { tipo: 'duvida', detalhe: 'abre, mas é página de construtor (Canva ou parecido): confirme olhando se é um site ou só um cartão', url_final: melhor.url };
  if (txt.length < 400) {
    // site feito em JavaScript: renderiza no Chrome (sem janela) e conta o texto de verdade
    const chrome = [CFG.chrome, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean).find((x) => fs.existsSync(x));
    if (chrome) {
      const rr = require('child_process').spawnSync(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--user-data-dir=' + PERFIL_CHROME, '--virtual-time-budget=9000', '--dump-dom', melhor.url], { encoding: 'utf8', maxBuffer: 50e6, timeout: 60000 });
      const t2 = textoVisivel(rr.stdout || '');
      if (t2.length >= 400 && !ESTACIONADO.test(t2.slice(0, 4000))) return { tipo: 'real', detalhe: 'abre e tem conteúdo (site em JavaScript, ' + t2.length + ' caracteres depois de renderizar)', url_final: melhor.url, titulo: (melhor.corpo.match(/<title>([^<]*)/i) || [])[1] || '', _txt: t2.slice(0, 80000), _html: (rr.stdout || '').slice(0, 400000) };
    }
  }
  if (txt.length < 400) return { tipo: 'duvida', detalhe: 'abre, mas mostra pouco texto sem JavaScript (pode ser site feito em JS ou página única): confirme olhando', url_final: melhor.url };
  return { tipo: 'real', detalhe: 'abre e tem conteúdo (' + txt.length + ' caracteres)', url_final: melhor.url, titulo: (melhor.corpo.match(/<title>([^<]*)/i) || [])[1] || '', _txt: txt.slice(0, 80000), _html: melhor.corpo.slice(0, 400000) };
}


// Expande uma página de links: devolve sites (candidatos) e números de WhatsApp que aparecem nela.
const normalizaCorpo = (s) => String(s || '').replace(/\\u002[Ff]/g, '/').replace(/\\\//g, '/').replace(/&amp;/g, '&').replace(/&#x2F;/gi, '/');
function extrairDoHub(corpo) {
  corpo = normalizaCorpo(corpo);
  const achados = new Set();
  for (const m of corpo.matchAll(/https?:\/\/[^"'\\\s<>)]+/g)) {
    const u = m[0].replace(/[.,;]+$/, ''); const h = host(u);
    if (!h || /^https?:\/\/(tel|mailto|sms|callto|whatsapp):/i.test(u) || HUBS.test(h) || IGNORAR.test(h + '.') || /\.(png|jpe?g|svg|gif|css|js|woff2?|ico|webp)(\?|$)/i.test(u) || /googleapis|gstatic|cloudfront|w3\.org|schema\.org|sentry|cdn\.|static\.|fonts\.|cloudflare|jsdelivr|unpkg|googletagmanager|google-analytics|facebook\.net|doubleclick|ogp\.me|apple\.com|play\.google|akamai|amazonaws|ctfassets|imgix|vercel-storage|wixstatic|beacons\.ai|linktr\.ee|linktree|stripe|sentry/i.test(h)) continue;
    achados.add(u.split('?')[0]);
  }
  return { sites: [...achados].slice(0, 8), wa: WA(corpo) };
}
// abre a página de links; se vier vazia (página feita em JavaScript), renderiza no Chrome sem janela
function expandirHub(url) {
  let r = L.baixar(url, { tempo: 25 });
  let x = extrairDoHub(r.corpo);
  if (!x.sites.length && !x.wa.length) {
    const chrome = [CFG.chrome, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean).find((c2) => fs.existsSync(c2));
    if (chrome) {
      const rr = require('child_process').spawnSync(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--user-data-dir=' + PERFIL_CHROME, '--virtual-time-budget=10000', '--dump-dom', url], { encoding: 'utf8', maxBuffer: 50e6, timeout: 70000 });
      x = extrairDoHub(rr.stdout || '');
    }
  }
  return x;
}
// encurtador (bit.ly, wa.link...): segue o redirecionamento e devolve o destino
const ENCURTADOR = /(^|\.)(bit\.ly|tinyurl\.com|encurtador\.com\.br|wa\.link|dm\.wa\.link|cutt\.ly|is\.gd|t\.ly|l\.wl\.co|rb\.gy|goo\.gl|ow\.ly|zapr\.link|zap\.me)$/i;
function resolverEncurtador(u) { const r = L.baixar(u, { tempo: 20 }); return r.codigo && r.url ? r.url : u; }

// domínios escritos no texto da bio ("www.fulano.com.br")
function dominiosDoTexto(t) {
  const out = new Set();
  for (const m of String(t || '').matchAll(/\b(?:https?:\/\/)?(?:www\.)?([a-z0-9][a-z0-9-]{1,60}(?:\.[a-z0-9-]{2,}){1,2})(?:\/[^\s]*)?/gi)) {
    const h = m[1].toLowerCase();
    if (!/\.(com|net|org|br|app|site|store|shop)(\.br)?$/.test(h) && !/\.br$/.test(h)) continue;
    if (HUBS.test(h) || /instagram|facebook|gmail|hotmail|outlook|whatsapp/.test(h)) continue;
    out.add('https://' + h);
  }
  return [...out];
}

const PARADA = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'a', 'o', 'ltda', 'epp', 'me', 'sao', 'paulo'].concat(((CFG.nicho && CFG.nicho.palavrasComuns) || []).map(L.norm), (CFG.bairros || []).flatMap((b) => L.norm(b.cidade).split(' '))));
const sig = (s) => L.norm(s).split(' ').filter((t) => t.length > 2 && !PARADA.has(t));

// sites que apareceram na busca do Instagram (etapa 4, resposta já paga e salva em bruto/instagram/): só domínios fora de diretório e rede social
function sitesDaBuscaSalva(l) {
  const arq = path.join(dir, 'bruto', 'instagram', l.chave + '.json');
  if (!fs.existsSync(arq)) return [];
  let j; try { j = JSON.parse(fs.readFileSync(arq, 'utf8')); } catch { return []; }
  const out = [];
  for (const o of (j.organic || []).slice(0, 8)) { const h = host(o.link); if (!h || DIRETORIO.test(h) || HUBS.test(h) || IGNORAR.test(h + '.')) continue; out.push(o.link.match(/^https?:\/\/[^\/]+/)[0]); }
  return [...new Set(out)];
}

// candidatos: na fase rápida, só a ficha do Maps; na fase a fundo, ficha + bio + hubs expandidos + domínios da bio + resultados do Google já salvos
function candidatos(l, wa) {
  const c = new Map();
  const add = (u, origem) => { u = urlLimpa(u); if (!c.has(u)) c.set(u, origem); };
  if (l.site_maps && !/instagram\.com/.test(l.site_maps)) add(l.site_maps, 'ficha do Maps');
  if (FASE === 'rapida') return [...c.entries()];
  for (const u of sitesDaBuscaSalva(l)) add(u, 'busca do Instagram (Google, etapa 4)');
  for (const u of (l.bio && l.bio.links) || []) { add(u, 'link da bio'); WA(u).forEach((n) => wa.set(n, 'link da bio')); }
  for (const u of dominiosDoTexto(l.bio && l.bio.texto)) add(u, 'domínio escrito na bio');
  for (const [u, o] of [...c]) if (ENCURTADOR.test(host(u))) { const fim = resolverEncurtador(u); WA(fim).forEach((n) => wa.set(n, 'encurtador ' + host(u))); if (fim !== u && !ENCURTADOR.test(host(fim))) add(fim, 'destino de ' + host(u)); }
  for (const [u] of [...c]) if (EXPANDE.test(host(u))) { const h = expandirHub(u); h.sites.forEach((x) => add(x, 'dentro de ' + host(u))); h.wa.forEach((n) => wa.set(n, 'dentro de ' + host(u))); }
  return [...c.entries()];
}

// prova de que o site é da empresa. Link que a própria empresa publicou (ficha do Maps, bio): telefone na página, nome no domínio ou no título.
// Link achado no Google: telefone na página, ou nome no domínio + cidade na página.
function identidade(l, r) {
  const tels = [l.telefone, ...(l.outras_fichas || []).map((f) => f.telefone), ...((l.cnpj && l.cnpj.telefones) || [])].map(dig).filter((d) => d.length >= 10);
  const corpo = dig(r._txt || '');
  if (tels.some((t) => corpo.includes(t.slice(-8)))) return 'telefone da empresa aparece no site';
  const toks = sig(l.nome); const hh = L.norm(host(r.url_final || r.url)).replace(/ /g, '');
  const noDominio = toks.some((t) => hh.includes(t));
  const doGoogle = /Google/.test(r.origem || '');
  if (noDominio && !doGoogle) return 'nome da empresa no domínio';
  if (noDominio && L.norm(r._txt || '').includes(L.norm(l.cidade))) return 'nome no domínio e cidade na página';
  const tit = L.norm(r.titulo || '');
  if (!doGoogle && toks.filter((t) => tit.includes(t)).length >= Math.min(2, toks.length) && toks.length) return 'nome da empresa no título da página';
  return '';
}

(async () => {
  const leads = L.lerLeads(dir);
  // --lote i/n: processa só o pedaço i de n (rode n processos em paralelo; cada um grava em bruto/sites/lote-i.json, sem tocar no leads.json; depois: --juntar-lotes)
  const juntar = !!a['juntar-lotes'];
  if (juntar) {
    let n = 0; const pastaS = path.join(dir, 'bruto', 'sites');
    const arqs = fs.existsSync(pastaS) ? fs.readdirSync(pastaS).filter((x) => new RegExp('^lote-' + FASE + '-\\d+\\.json$').test(x)) : [];
    for (const f of arqs) {
      const o = JSON.parse(fs.readFileSync(path.join(pastaS, f), 'utf8'));
      for (const l of leads) if (o[l.chave] && l.estado !== 'removido') { l.site = o[l.chave].site; if (o[l.chave].whats_achados) l.whats_achados = o[l.chave].whats_achados; n++; }
      fs.renameSync(path.join(pastaS, f), path.join(pastaS, f.replace(/\.json$/, '.aplicado.json')));
    }
    L.gravarLeads(dir, leads); console.log('lotes juntados:', arqs.length, 'arquivos,', n, 'leads');
  }
  const lote = a.lote ? String(a.lote).split('/').map(Number) : null;
  const saidaLote = lote ? path.join(dir, 'bruto', 'sites', 'lote-' + FASE + '-' + lote[0] + '.json') : '';
  const resultadoLote = lote && fs.existsSync(saidaLote) ? JSON.parse(fs.readFileSync(saidaLote, 'utf8')) : {};
  // site "ruim" (o operador mandou manter) não é testado de novo
  const falta = (l) => !(l.site && l.site.tipo === 'ruim') && (FASE === 'rapida' ? !l.site : !(l.site && l.site.fase === 'fundo'));
  const alvos = juntar ? [] : L.ativos(leads).filter(falta).filter((l, i) => !lote || (i % lote[1]) === (lote[0] - 1)).filter((l) => !resultadoLote[l.chave]);
  console.log(`leads a conferir: ${alvos.length}${a.google ? ' (Google só nos que não tiverem site achado antes: até ' + alvos.length + ' créditos)' : ''}`);
  if (a.simular) { console.log('(--simular: nada foi testado)'); process.exit(0); }
  const chave = a.google ? L.lerChave((CFG.serper && CFG.serper.chaveVar) || 'SERPER_API_KEY', CFG.serper && CFG.serper.envFile, path.join(dir, '.env')) : '';
  if (a.google && !chave) { console.error('Sem chave do Serper para --google'); process.exit(1); }
  if (a.google) L.conferirSaldo(dir, CFG, alvos.length);
  fs.mkdirSync(path.join(dir, 'bruto', 'sites'), { recursive: true });
  const ordem = { real: 5, duvida: 4, parado: 3, morto: 3, hub: 1 };
  let gasto = 0;
  for (const l of alvos) {
    const wa = new Map();   // número -> onde apareceu
    const res = [];
    const testarTodos = async (lista) => { for (const [u, origem] of lista) { const r = await testar(u); WA(r._html).forEach((n) => { if (!wa.has(n)) wa.set(n, 'no site ' + host(u)); }); res.push({ url: u, origem, ...r }); } };
    await testarTodos(candidatos(l, wa));
    // "funcionando" só com prova de identidade; domínio morto achado no Google não é do lead
    for (const r of res) {
      const doGoogle = /Google/.test(r.origem || '');
      if (r.tipo === 'real') {
        const prova = identidade(l, r);
        if (prova) r.detalhe += ' | identidade: ' + prova;
        else if (doGoogle) { r.tipo = 'hub'; r.detalhe = 'site que apareceu no Google, sem prova de ser da empresa; ignorado (' + (r.url_final || r.url) + ')'; }
        else { r.tipo = 'duvida'; r.detalhe += ' | não achei telefone nem o nome da empresa na página: confira se o site é dela'; }
      } else if (doGoogle && (r.tipo === 'morto' || r.tipo === 'parado' || r.tipo === 'duvida')) { r.tipo = 'hub'; r.detalhe = 'endereço que apareceu no Google, sem prova de ser da empresa; ignorado (' + r.detalhe + ')'; }
    }
    // Google: só se ainda não achei site funcionando
    if (a.google && !res.some((r) => r.tipo === 'real')) {
      const nome = l.nome.replace(/ - .*| \(.*|\|.*/, '').trim();
      try {
        const arqG = path.join(dir, 'bruto', 'sites', l.chave + '-google.json');
        let j;
        if (fs.existsSync(arqG)) j = JSON.parse(fs.readFileSync(arqG, 'utf8'));   // já paguei esta busca: reaproveita
        else { j = await L.serperBusca(chave, `"${nome}" ${l.bairro} ${l.cidade} site oficial`); gasto += Number(j.credits || 1); fs.writeFileSync(arqG, JSON.stringify(j, null, 1)); }
        const ja = new Set(res.map((r) => host(r.url)));
        const novos = [];
        for (const o of (j.organic || []).slice(0, 6)) { const h = host(o.link); if (!h || DIRETORIO.test(h) || HUBS.test(h) || ja.has(h)) continue; ja.add(h); novos.push([o.link.match(/^https?:\/\/[^\/]+/)[0], 'busca no Google']); }
        const antes = res.length;
        await testarTodos(novos);
        for (let k = antes; k < res.length; k++) {
          const r = res[k];
          if (r.tipo === 'real') { const prova = identidade(l, r); if (prova) r.detalhe += ' | identidade: ' + prova; else { r.tipo = 'hub'; r.detalhe = 'achado no Google, mas sem prova de ser da empresa (sem telefone nem nome no domínio); ignorado: ' + (r.url_final || r.url); } }
          else if (r.tipo === 'morto' || r.tipo === 'parado') { r.tipo = 'hub'; r.detalhe = 'domínio do Google sem prova de ser da empresa; ignorado (' + r.detalhe + ')'; }
        }
      } catch (e) { console.error('erro na busca do Google:', e.message, '- paro aqui; rode de novo para continuar'); break; }
    }
    const limpo = res.map(({ _txt, _html, ...resto }) => resto);
    fs.writeFileSync(path.join(dir, 'bruto', 'sites', l.chave + '.json'), JSON.stringify(limpo, null, 1));
    const top = limpo.slice().sort((x, y) => (ordem[y.tipo] || 0) - (ordem[x.tipo] || 0))[0];
    const tipo = !top ? 'sem' : top.tipo === 'parado' ? 'morto' : top.tipo;
    const semNada = FASE === 'rapida' ? 'a ficha do Maps não tem link de site' : 'sem endereço de site em nenhum lugar (ficha do Maps, bio, links da bio, busca do Google já salva)';
    l.site = { tipo, url: top ? (top.url_final || top.url) : '', resultado: top ? top.detalhe : semNada, origem: top ? top.origem : '', candidatos: limpo, fase: FASE, testado_em: new Date().toISOString() };
    const numeros = [...wa.entries()].map(([n, fonte]) => ({ numero: n.startsWith('55') ? n : '55' + n, fonte }));
    if (numeros.length) l.whats_achados = numeros;
    if (lote) { resultadoLote[l.chave] = { site: l.site, whats_achados: numeros.length ? l.whats_achados : undefined }; fs.writeFileSync(saidaLote, JSON.stringify(resultadoLote)); }
    else L.gravarLeads(dir, leads);
  }
  if (lote) { console.log('lote ' + lote[0] + '/' + lote[1] + ' terminou: ' + Object.keys(resultadoLote).length + ' leads | créditos gastos: ' + gasto + ' | quando todos terminarem: --fase ' + FASE + ' --juntar-lotes'); if (a.google) L.registrarCreditos(dir, ETAPA, gasto, 'busca de site no Google (lote ' + lote[0] + ')'); return; }
  if (a.google) L.registrarCreditos(dir, ETAPA, gasto, 'busca de site no Google');
  const cont = {}; L.ativos(leads).forEach((l) => { const t = l.site ? l.site.tipo : '-'; cont[t] = (cont[t] || 0) + 1; });
  console.log('\nresultado:', cont, '| créditos gastos:', gasto, '| leads com WhatsApp achado:', L.ativos(leads).filter((l) => (l.whats_achados || []).length).length);
  const lista = (t) => L.ativos(leads).filter((l) => l.site && l.site.tipo === t);
  console.log('\nDomínio que não funciona:'); lista('morto').forEach((l) => console.log(`  - ${l.nome} | ${l.site.url} | ${l.site.resultado}`));
  console.log('\nEm dúvida (confirme olhando):'); lista('duvida').forEach((l) => console.log(`  - ${l.nome} | ${l.site.url} | ${l.site.resultado}`));
  console.log('\nSó link-hub (continuam como sem site):', lista('hub').length);
  if (!TIRAR) { console.log('\n(ninguém saiu: ' + (a['sem-remover'] ? '--sem-remover' : 'config.tirarQuemTemSite = false') + '; o site fica só como informação no cartão)'); L.gravarLeads(dir, leads); return; }
  for (const l of lista('real')) L.remover(dir, l, 'tem site funcionando: ' + l.site.url + ' (' + l.site.resultado + ')', ETAPA);
  L.gravarLeads(dir, leads);
  console.log('\nSaíram por ter site funcionando:', cont.real || 0, '| leads ativos:', L.ativos(leads).length);
})();
