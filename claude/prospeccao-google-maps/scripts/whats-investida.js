// Etapa 11 (investida nos sem WhatsApp): busca no Google, pelo Serper, o WhatsApp e o Facebook de quem ainda não tem nenhum número com WhatsApp,
// guarda tudo e monta os lotes para os agentes conferirem (os resultados do Google trazem muito número de diretório e de outra empresa).
// Uso: node whats-investida.js --dir <rodada> [--simular] [--tamanho 7]
// Custo: 3 créditos por lead ("<nome> <cidade> whatsapp", "<nome> <rua> telefone contato", "<nome> <cidade> site:facebook.com").
// Grava: bruto/whats-investida/<chave>.jsonl (respostas inteiras) e bruto/whats-lotes/investida-NN.json (um lote por agente).
// Depois: agentes (prompt em referencia/agente-whatsapp.md, modo investida) → node whats-aplicar.js → node whats-testar.js.
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const tam = Number(a.tamanho || 7);
const leads = L.lerLeads(dir);
const temWa = (l) => (l.whats || []).some(L.waValido);
const alvos = L.ativos(leads).filter((l) => !temWa(l));
const NUM = /(?:\+?55\s*)?\(?\b(\d{2})\)?[\s.-]*(9?\d{4})[\s.-]?(\d{4})\b/g;
const rua = (e) => String(e || '').replace(/^[^-]*-\s*/, '').split(',').slice(0, 2).join(',');
const nomeCurto = (l) => l.nome.replace(/ - .*| \(.*|\|.*/, '').trim();

(async () => {
  // cada busca é gravada assim que volta (uma linha por busca): se o crédito acabar no meio, nada pago se perde e a retomada pula o que já tem
  const qsDe = (l) => [`${nomeCurto(l)} ${l.cidade} whatsapp`, `${nomeCurto(l)} ${rua(l.endereco)} telefone contato`, `${nomeCurto(l)} ${l.cidade} site:facebook.com`];
  const arqDe = (l) => path.join(dir, 'bruto', 'whats-investida', l.chave + '.jsonl');
  const feitas = (l) => (fs.existsSync(arqDe(l)) ? fs.readFileSync(arqDe(l), 'utf8').split('\n').filter(Boolean).map((x) => JSON.parse(x).q) : []);
  const pendentes = alvos.map((l) => [l, qsDe(l).filter((q) => !feitas(l).includes(q))]).filter(([, qs]) => qs.length);
  const total = pendentes.reduce((s, [, qs]) => s + qs.length, 0);
  console.log('leads sem WhatsApp:', alvos.length, '| buscas a fazer:', total, '(' + total + ' créditos)');
  if (a.simular) process.exit(0);
  const chave = L.lerChave((CFG.serper && CFG.serper.chaveVar) || 'SERPER_API_KEY', CFG.serper && CFG.serper.envFile, path.join(dir, '.env'));
  if (total && !chave) { console.error('Sem chave do Serper.'); process.exit(1); }
  if (total) L.conferirSaldo(dir, CFG, total);
  fs.mkdirSync(path.join(dir, 'bruto', 'whats-investida'), { recursive: true });
  let gasto = 0;
  const registrar = () => { if (gasto) L.registrarCreditos(dir, 'investida WhatsApp', gasto, 'Google e Facebook dos sem WhatsApp'); gasto = 0; };
  process.on('exit', registrar);   // registra o gasto mesmo se o script parar por falta de crédito
  for (const [l, qs] of pendentes) {
    for (const q of qs) {
      let j; try { j = await L.serperBusca(chave, q); } catch (e) { console.error('erro na busca:', e.message, '- rode de novo para continuar'); process.exit(1); }
      gasto += Number(j.credits || 1);
      fs.appendFileSync(arqDe(l), JSON.stringify({ q, j }) + '\n');
      await L.dormir(250);
    }
  }
  registrar();

  // lotes para os agentes: dados do lead + números e páginas que apareceram (ruidosos: o agente confere de quem é cada um)
  const pastaLotes = path.join(dir, 'bruto', 'whats-lotes'); fs.mkdirSync(pastaLotes, { recursive: true });
  const itens = alvos.map((l) => {
    const arq = path.join(dir, 'bruto', 'whats-investida', l.chave + '.jsonl');
    const cand = {}; const paginas = [];
    if (fs.existsSync(arq)) for (const ln of fs.readFileSync(arq, 'utf8').split('\n').filter(Boolean)) {
      const { j } = JSON.parse(ln);
      for (const b of [].concat(j.organic || [], j.places || [], j.knowledgeGraph ? [j.knowledgeGraph] : [])) {
        const t = [b.title, b.snippet, b.description, b.phoneNumber].join(' ');
        for (const m of t.matchAll(NUM)) { const n = m[1] + m[2] + m[3]; (cand[n] = cand[n] || []).push(String(b.link || b.website || b.title || '').slice(0, 120)); }
        if (b.link && /facebook\.com|linkedin\.com|instagram\.com/.test(b.link)) paginas.push({ link: b.link, titulo: b.title || '', trecho: String(b.snippet || '').slice(0, 200) });
      }
    }
    return {
      chave: l.chave, nome: l.nome, cidade: l.cidade, bairro: l.bairro, endereco: l.endereco, telefone_ficha: l.telefone, maps: l.maps,
      instagram: l.instagram && l.instagram.url, bio: (l.bio && l.bio.texto) || (l.instagram && l.instagram.trecho) || '', links_bio: (l.bio && l.bio.links) || [], site: l.site && l.site.url,
      cnpj: l.cnpj && { numero: l.cnpj.numero, razao: l.cnpj.razao, dono: l.cnpj.dono && l.cnpj.dono.nome, telefones: l.cnpj.telefones },
      numeros_ja_testados_sem_whatsapp: (l.whats || []).filter((w) => w.existe === false).map((w) => w.numero),
      numeros_do_google: cand, paginas_de_redes: paginas.slice(0, 12), arquivo_bruto_google: arq.replace(/\\/g, '/'),
    };
  });
  for (const f of fs.readdirSync(pastaLotes).filter((x) => /^investida-\d+\.json$/.test(x))) fs.unlinkSync(path.join(pastaLotes, f));
  let n = 0; for (let i = 0; i < itens.length; i += tam) { n++; L.gravarJson(path.join(pastaLotes, 'investida-' + String(n).padStart(2, '0') + '.json'), itens.slice(i, i + tam)); }
  console.log('créditos gastos:', gasto, '| lotes para agentes:', n, '(' + tam + ' leads cada) em', pastaLotes.replace(/\\/g, '/'));
})();
