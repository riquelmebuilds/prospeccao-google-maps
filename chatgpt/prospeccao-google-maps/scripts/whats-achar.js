// Etapa 9 (WhatsApp da empresa) e etapa 10 (com --cnpj, os telefones do cadastro): reúne os números de WhatsApp possíveis de cada lead, com a fonte de cada um. Ainda NÃO testa.
// Uso: node whats-achar.js --dir <rodada> [--cnpj] [--google] [--so-sem-whatsapp]
// --cnpj (etapa 10) junta também os telefones do cadastro do CNPJ (fonte "telefone do CNPJ"); sem ele, os do CNPJ ficam de fora.
// Fontes: texto da bio, links da bio (wa.me, api.whatsapp.com, encurtadores resolvidos, Linktree e parecidos expandidos), trecho da busca do Instagram,
// telefone da ficha do Maps, outras fichas, telefones do CNPJ e, com --google (e o aval do operador), busca por nome e cidade (2 créditos/lead).
// --so-sem-whatsapp roda só nos leads sem nenhum número com WhatsApp confirmado (etapa 11).
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const REDE_HUB = /(linktr\.ee|linktree\.com|bio\.link|bio\.site|beacons\.ai|lnk\.bio|taplink\.cc|campsite\.bio|linkin\.bio|solo\.to|linke\.to|apptuts\.bio|sandwiche\.me)/i;
const ENCURTADOR = /(bit\.ly|w\.app|encurtador\.com\.br|tinyurl\.com|wa\.link|cutt\.ly|is\.gd)/i;
const reTel = /(?:\+?55\s?)?\(?\b(\d{2})\)?[\s.-]?(9?\d{4})[\s.-]?(\d{4})\b/g;
const foneDeLink = (s) => { const m = String(s).match(/(?:wa\.me\/|phone=|whatsapp\.com\/send\/?\?phone=)\+?(\d{10,13})/i); return m ? m[1] : ''; };
const telefones = (t) => { const o = new Set(); let m; reTel.lastIndex = 0; while ((m = reTel.exec(String(t)))) { const d = m[1] + m[2] + m[3]; if (d.length >= 10 && d.length <= 11) o.add(d); } return [...o]; };
const textoPuro = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ');

function dosLinks(links) {
  const achados = [];
  const olha = (u, origem) => {
    let n = foneDeLink(decodeURIComponent(u).replace(/&amp;/g, '&'));
    if (n) { achados.push([n, origem + ' (link direto)']); return; }
    if (ENCURTADOR.test(u) || /wa\.me\/message/i.test(u)) {
      const r = L.baixar(/^https?:/.test(u) ? u : 'https://' + u, { tempo: 20 });
      n = foneDeLink(r.url) || foneDeLink(r.corpo);
      if (n) achados.push([n, origem + ' (encurtador resolvido)']);
    } else if (REDE_HUB.test(u)) {
      const r = L.baixar(/^https?:/.test(u) ? u : 'https://' + u, { tempo: 25 });
      for (const m of r.corpo.matchAll(/(?:wa\.me\/|phone=)\+?(\d{10,13})/gi)) achados.push([m[1], origem + ' (dentro de ' + u.replace(/^https?:\/\//, '').slice(0, 30) + ')']);
      for (const t of telefones(textoPuro(r.corpo).slice(0, 20000))) if (/whats|zap/i.test(textoPuro(r.corpo))) achados.push([t, origem + ' (página de links)']);
    }
  };
  for (const u of links || []) olha(String(u), 'link da bio');
  return achados;
}

(async () => {
  const leads = L.lerLeads(dir);
  let alvos = L.ativos(leads);
  if (a['so-sem-whatsapp']) alvos = alvos.filter((l) => !(l.whats || []).some((w) => w.existe));
  console.log('leads a procurar:', alvos.length, a.google ? '(com busca no Google: ' + alvos.length * 2 + ' créditos)' : '');
  const chave = a.google ? L.lerChave((CFG.serper && CFG.serper.chaveVar) || 'SERPER_API_KEY', CFG.serper && CFG.serper.envFile, path.join(dir, '.env')) : '';
  if (a.google && !chave) { console.error('Sem chave do Serper para --google'); process.exit(1); }
  if (a.google) L.conferirSaldo(dir, CFG, alvos.length * 2);
  fs.mkdirSync(path.join(dir, 'bruto', 'whats'), { recursive: true });
  let gasto = 0;

  for (const l of alvos) {
    const cand = new Map();
    const add = (n, fonte) => { n = L.normalizarTelefone(n); if (n.length < 10 || n.length > 11) return; if (!cand.has(n)) cand.set(n, new Set()); cand.get(n).add(fonte); };
    const igConfiavel = !(l.instagram && l.instagram.cidade_ok === false);
    if (igConfiavel && l.bio && l.bio.texto) for (const t of telefones(l.bio.texto)) add(t, 'bio do Instagram');
    if (igConfiavel && l.bio) for (const [n, f] of dosLinks(l.bio.links)) add(n, f);
    if (igConfiavel && l.instagram && l.instagram.trecho) for (const t of telefones(l.instagram.trecho)) add(t, 'trecho da busca do Instagram');
    for (const w of l.whats_achados || []) add(String(w.numero), w.fonte || 'achado no site ou página de links');   // guardados na etapa 5
    if (l.telefone) for (const t of telefones(l.telefone)) add(t, 'telefone da ficha do Google');
    for (const f of l.outras_fichas || []) for (const t of telefones(f.telefone || '')) add(t, 'outra ficha do Google');
    if (a.cnpj) for (const t of (l.cnpj && l.cnpj.telefones) || []) add(t, 'telefone do CNPJ');   // só na etapa 10 (--cnpj): o celular do cadastro é candidato a WhatsApp do dono, não da empresa
    if (a.google && chave) {
      const nome = l.nome.replace(/ - .*| \(.*/, '').trim(); const rua = ((l.endereco || '').match(/- ([^,]+?), \d+/) || [])[1] || '';
      const toks = L.norm(nome).split(' ').filter((t) => t.length > 3 && !/escola|infantil|bercario|educacao|colegio|centro|instituto|maternal|kids/.test(t));
      for (const q of [`"${nome}" ${l.cidade} whatsapp`, `${nome} ${rua} ${l.cidade} telefone celular whatsapp`]) {
        try {
          const j = await L.serperBusca(chave, q); gasto += Number(j.credits || 1);
          fs.writeFileSync(path.join(dir, 'bruto', 'whats', l.chave + '-' + Buffer.from(q).toString('base64').slice(0, 8).replace(/[^A-Za-z0-9]/g, '') + '.json'), JSON.stringify(j, null, 1));
          for (const o of j.organic || []) {
            const t = L.norm(o.title + ' ' + (o.snippet || ''));
            if (toks.length && !toks.some((x) => t.includes(x))) continue;
            if (!t.includes(L.norm(l.cidade)) && !(rua && t.includes(L.norm(rua)))) continue;
            for (const n of telefones(o.title + ' ' + (o.snippet || ''))) add(n, 'Google (' + o.link.replace(/^https?:\/\/(www\.)?/, '').slice(0, 35) + ')');
          }
        } catch (e) { console.error('busca falhou:', e.message); }
      }
    }
    // mescla com o que já existe (preserva os testes feitos)
    const atual = new Map((l.whats || []).map((w) => [w.numero, w]));
    for (const [n, fontes] of cand) {
      const w = atual.get(n) || { numero: n, celular: L.ehCelular(n) };
      w.fonte = [...new Set([].concat(w.fonte || [], [...fontes]))].join(' + ');
      atual.set(n, w);
    }
    l.whats = [...atual.values()];
  }
  if (gasto) L.registrarCreditos(dir, a['so-sem-whatsapp'] ? 9 : 7, gasto, 'busca de WhatsApp no Google');
  L.gravarLeads(dir, leads);
  const at = L.ativos(leads);
  console.log(`\nleads com pelo menos um número: ${at.filter((l) => (l.whats || []).length).length} de ${at.length} | números reunidos: ${at.reduce((s, l) => s + (l.whats || []).length, 0)}`);
  console.log('leads sem nenhum número:', at.filter((l) => !(l.whats || []).length).map((l) => l.nome).join(' | ') || '—');
  console.log('\nPróximo: testar os números com whats-testar.js');
})();
