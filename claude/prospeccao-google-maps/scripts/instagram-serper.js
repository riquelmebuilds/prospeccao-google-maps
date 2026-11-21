// Etapa 4: acha o Instagram de cada lead pelo Serper (1 crédito por lead), todos de uma vez. Guarda a resposta INTEIRA em bruto/instagram/
// (o trecho costuma ser o começo da bio, e os outros resultados servem depois para achar o site, na etapa 6).
// Uso: node instagram-serper.js --dir <rodada> [--simular] [--quantas N]
//      node instagram-serper.js --dir <rodada> --por-telefone        (investida: busca pelo telefone da ficha nos que ficaram sem @; 1 crédito/lead)
//      node instagram-serper.js --dir <rodada> --tirar-sem-instagram (quem segue sem @ sai, com registro; rode depois da investida, se houve)
// Escolha do perfil: o @ da ficha do Maps vale sem busca; na busca, o perfil cujo @ ou título tem uma palavra distintiva do nome; senão o primeiro perfil.
// Não exige prova: perfil que não traz palavra do nome, ou de outra cidade, ou repetido em outro lead sem o mesmo telefone ou endereço, ganha
// instagram.suspeito com o motivo (aviso no cartão; a leitura da bio, na etapa 5, confirma ou derruba). Retomável.
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const leads = L.lerLeads(dir);
const limite = a.quantas ? Number(a.quantas) : Infinity;

const PARADA = new Set(['escola', 'infantil', 'colegio', 'bercario', 'educacao', 'creche', 'de', 'da', 'do', 'dos', 'das', 'e', 'maternal', 'centro', 'instituto', 'ensino', 'a', 'o', 'the', 'school', 'kids', 'baby', 'loja', 'studio', 'estudio', 'clinica', 'casa', 'espaco']);
(CFG.nicho.palavrasComuns || []).forEach((p) => PARADA.add(L.norm(p)));
// cidade e bairro no nome não distinguem a empresa ("Barbearia Marista" x "Colégio Marista")
(CFG.bairros || []).forEach((b) => L.norm(b.cidade + ' ' + b.nome).split(' ').forEach((t) => PARADA.add(t)));
['setor', 'jardim', 'vila', 'parque', 'bairro'].forEach((t) => PARADA.add(t));
const sig = (s) => L.norm(s).split(' ').filter((t) => (t.length > 2 || /^[a-z]{2}$/.test(t)) && !PARADA.has(t));
const handleDe = (link) => {
  const m = String(link || '').match(/instagram\.com\/([A-Za-z0-9_.]{2,30})\/?(?:[?#].*)?$/);
  return m && !/^(p|reel|reels|explore|accounts|stories|tv|directory|popular)$/i.test(m[1]) ? m[1] : '';
};
// "Escola (@x) · Campinas, SP" → "campinas"
const cidadeDoTrecho = (t) => { const m = String(t || '').match(/·\s*([^·,]+?),\s*[A-Z]{2}\b/); return m ? L.norm(m[1]) : ''; };
const nomeCurto = (l) => l.nome.replace(/ - .*| \(.*|\|.*/, '').trim();

function escolher(l, j, via) {
  const perfis = (j.organic || []).map((o) => ({ h: handleDe(o.link), titulo: o.title || '', trecho: o.snippet || '' })).filter((p) => p.h);
  const toks = sig(l.nome);
  const tel = L.digitos(l.telefone).slice(-8);
  const bom = perfis.find((p) => toks.some((t) => L.norm(p.h + ' ' + p.titulo).replace(/ /g, '').includes(t)) || (via === 'telefone' && tel && L.digitos(p.trecho).includes(tel)));
  const p = bom || (via === 'nome' ? perfis[0] : null);   // pela busca de telefone, só aceita perfil que bata
  if (!p) return null;
  const cid = cidadeDoTrecho(p.titulo + ' ' + p.trecho);
  const suspeitas = [];
  if (!bom) suspeitas.push('o @ e o nome do perfil não têm palavra do nome da empresa');
  if (cid && cid !== L.norm(l.cidade)) suspeitas.push('o perfil diz outra cidade (' + cid + ')');
  return { handle: p.h, url: 'https://www.instagram.com/' + p.h + '/', titulo: p.titulo, trecho: p.trecho, fonte: 'busca por ' + via, suspeito: suspeitas.join('; ') || '' };
}

const chave = () => L.lerChave((CFG.serper && CFG.serper.chaveVar) || 'SERPER_API_KEY', CFG.serper && CFG.serper.envFile, path.join(dir, '.env'));

(async () => {
  // investida pelo telefone
  if (a['por-telefone']) {
    const alvo = L.ativos(leads).filter((l) => !l.instagram && !l.instagram_por_telefone && L.digitos(l.telefone).length >= 10).slice(0, limite);
    console.log('sem @ e com telefone na ficha:', alvo.length, '(' + alvo.length + ' créditos)');
    if (a.simular || !alvo.length) process.exit(0);
    const k = chave(); if (!k) { console.error('Sem chave do Serper.'); process.exit(1); }
    L.conferirSaldo(dir, CFG, alvo.length);
    fs.mkdirSync(path.join(dir, 'bruto', 'instagram'), { recursive: true });
    let gasto = 0, achou = 0;
    for (const l of alvo) {
      const t = L.normalizarTelefone(l.telefone);
      const fmt = L.formatarTelefone(t);
      let j; try { j = await L.serperBusca(k, `"${fmt}" instagram`); } catch (e) { console.error('erro:', e.message); break; }
      gasto += Number(j.credits || 1); l.instagram_por_telefone = true;
      fs.writeFileSync(path.join(dir, 'bruto', 'instagram', l.chave + '-telefone.json'), JSON.stringify(j, null, 1));
      const ig = escolher(l, j, 'telefone'); if (ig) { l.instagram = ig; achou++; }
      L.gravarLeads(dir, leads); await L.dormir(250);
    }
    L.registrarCreditos(dir, 'instagram', gasto, 'investida pelo telefone');
    console.log('achados pelo telefone:', achou, 'de', alvo.length, '| créditos:', gasto);
    process.exit(0);
  }
  if (a['tirar-sem-instagram']) {
    let n = 0; for (const l of L.ativos(leads).filter((x) => !x.instagram && x.instagram_buscado)) { L.remover(dir, l, 'sem Instagram (não achei nem pela busca do nome' + (l.instagram_por_telefone ? ' nem pela do telefone' : '') + ')', 'instagram'); n++; }
    L.gravarLeads(dir, leads); console.log('saíram por não ter Instagram:', n, '| leads ativos:', L.ativos(leads).length); process.exit(0);
  }

  // 1) quem já tem o @ na própria ficha do Maps não gasta busca
  for (const l of L.ativos(leads)) {
    if (l.instagram) continue;
    const h = handleDe(l.site_maps);
    if (h) { l.instagram = { handle: h, url: 'https://www.instagram.com/' + h + '/', titulo: '', trecho: '', fonte: 'ficha do Maps', suspeito: '' }; l.instagram_buscado = true; }
  }
  const faltam = L.ativos(leads).filter((l) => !l.instagram && !l.instagram_buscado).slice(0, limite);
  console.log(`leads ativos: ${L.ativos(leads).length} | com @ na ficha do Maps: ${L.ativos(leads).filter((l) => l.instagram && l.instagram.fonte === 'ficha do Maps').length} | a buscar: ${faltam.length} (${faltam.length} créditos)`);
  if (a.simular) { console.log('(--simular: nada foi gasto)'); process.exit(0); }
  const k = faltam.length ? chave() : '';
  if (faltam.length && !k) { console.error('Sem chave do Serper. Defina SERPER_API_KEY (ambiente ou arquivo indicado em config.serper.envFile).'); process.exit(1); }
  if (faltam.length) L.conferirSaldo(dir, CFG, faltam.length);
  fs.mkdirSync(path.join(dir, 'bruto', 'instagram'), { recursive: true });
  let gasto = 0;
  for (const l of faltam) {
    let j;
    try { j = await L.serperBusca(k, `${nomeCurto(l)} ${l.cidade} instagram`); } catch (e) { console.error('erro na busca:', e.message, '- paro aqui; rode de novo para continuar'); break; }
    gasto += Number(j.credits || 1);
    fs.writeFileSync(path.join(dir, 'bruto', 'instagram', l.chave + '.json'), JSON.stringify(j, null, 1));   // resposta inteira
    l.instagram_buscado = true;
    const ig = escolher(l, j, 'nome'); if (ig) l.instagram = ig;
    L.gravarLeads(dir, leads);
    await L.dormir(250);
  }
  if (gasto) L.registrarCreditos(dir, 'instagram', gasto, 'busca de Instagram');

  // 2) o mesmo @ em dois leads: com o mesmo telefone ou endereço, é a mesma empresa (junta); senão, os dois ficam suspeitos
  const porHandle = new Map(); let juntadas = 0, repetidos = 0;
  const igual = (x, y) => (L.digitos(x.telefone).length >= 8 && L.digitos(x.telefone).slice(-8) === L.digitos(y.telefone).slice(-8)) || (L.norm(x.endereco) && L.norm(x.endereco) === L.norm(y.endereco));
  for (const l of L.ativos(leads).filter((x) => x.instagram)) {
    const h = l.instagram.handle.toLowerCase();
    if (!porHandle.has(h)) { porHandle.set(h, l); continue; }
    const base = porHandle.get(h);
    if (igual(base, l)) {
      base.outras_fichas = (base.outras_fichas || []).concat([{ nome: l.nome, endereco: l.endereco, telefone: l.telefone, maps: l.maps }]);
      L.remover(dir, l, 'mesma empresa (mesmo Instagram e mesmo telefone ou endereço) que ' + base.nome, 'instagram'); juntadas++;
    } else {
      const m = 'o mesmo @ apareceu para "' + base.nome + '" e "' + l.nome + '"';
      for (const x of [base, l]) if (!String(x.instagram.suspeito || '').includes(m)) x.instagram.suspeito = [x.instagram.suspeito, m].filter(Boolean).join('; ');
      repetidos++;
    }
  }
  L.gravarLeads(dir, leads);

  const at = L.ativos(leads);
  console.log(`\nbuscados: ${faltam.length} | créditos gastos: ${gasto}`);
  console.log(`com Instagram: ${at.filter((l) => l.instagram).length} | sem Instagram: ${at.filter((l) => !l.instagram).length} | suspeitos (aviso no cartão): ${at.filter((l) => l.instagram && l.instagram.suspeito).length}`);
  console.log(`fichas juntadas: ${juntadas} | @ repetido em empresas diferentes: ${repetidos} | leads ativos: ${at.length}`);
})();
