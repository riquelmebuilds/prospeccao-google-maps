// Reserva da etapa 5 (só se o Chrome não conseguir ler as bios): lê a bio do Instagram pelo scrape do Serper (10 créditos por perfil) para pegar os LINKS da bio,
// que a busca do Serper não entrega e o Chrome sem login nem sempre mostra ("e mais N links").
// Uso: node bio-scrape.js --dir <rodada> --simular     (só conta o custo)
//      node bio-scrape.js --dir <rodada> [--todos]     (padrão: só quem não tem site real e ainda não teve a bio raspada)
// Grava a resposta INTEIRA em bruto/bio-scrape/<chave>.json, junta os links e telefones achados em l.bio.links e l.whats_achados.
// Uso real: node bio-scrape.js --dir <rodada> --bloqueados (ou --chaves ...). Os links entram na etapa 6 (site-checar.js --fase fundo).
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const CUSTO = 10;
const leads = L.lerLeads(dir);
const pasta = path.join(dir, 'bruto', 'bio-scrape');
let alvos = L.ativos(leads).filter((l) => l.instagram && l.instagram.url && !(l.site && l.site.tipo === 'real'));
if (!a.todos) alvos = alvos.filter((l) => !fs.existsSync(path.join(pasta, l.chave + '.json')));
// recorte obrigatório: --chaves l-0001,l-0002 (os perfis que o Chrome não conseguiu ler), ou --bloqueados (todos com bio.bloqueado)
if (a.chaves) { const ks = new Set(String(a.chaves).split(',').map((x) => x.trim())); alvos = alvos.filter((l) => ks.has(l.chave)); }
else if (a.bloqueados) alvos = alvos.filter((l) => l.bio && l.bio.bloqueado && !(l.instagram && l.instagram.trecho));   // só quem ficou sem nenhum texto (nem bio nem trecho do Google)
else if (!a.simular) { console.error('Diga o recorte: --chaves l-0001,l-0002 ou --bloqueados (cada perfil custa 10 créditos).'); process.exit(1); }
console.log(`${alvos.length} perfis a raspar | ${alvos.length * CUSTO} créditos (${CUSTO} por perfil)`);
if (a.simular) process.exit(0);
const chave = L.lerChave((CFG.serper && CFG.serper.chaveVar) || 'SERPER_API_KEY', CFG.serper && CFG.serper.envFile, path.join(dir, '.env'));
if (!chave) { console.error('Sem chave do Serper'); process.exit(1); }
L.conferirSaldo(dir, CFG, alvos.length * CUSTO);
fs.mkdirSync(pasta, { recursive: true });

const reUrl = /https?:\/\/[^\s)\]"'<>]+/gi;
const reTel = /(?:\+?55\s?)?\(?\b(\d{2})\)?[\s.-]?(9?\d{4})[\s.-]?(\d{4})\b/g;
const IGNORA = /instagram\.com|cdninstagram|facebook\.com\/(tr|plugins)|fbcdn|static\.|gstatic|google\.com\/(maps|url)|schema\.org|w3\.org/i;

(async () => {
  let gasto = 0, comLink = 0, falhas = 0, i = 0;
  const trabalho = async () => {
    while (i < alvos.length) {
      const l = alvos[i++];
      try {
        const r = await fetch('https://scrape.serper.dev', { method: 'POST', headers: { 'X-API-KEY': chave, 'Content-Type': 'application/json' }, body: JSON.stringify({ url: l.instagram.url }) });
        if (!r.ok) { falhas++; console.error('erro', r.status, l.nome); continue; }
        const j = await r.json(); gasto += Number(j.credits || CUSTO);
        fs.writeFileSync(path.join(pasta, l.chave + '.json'), JSON.stringify(j, null, 1));
        const texto = String(j.text || '') + ' ' + JSON.stringify(j.metadata || {});
        const links = [...new Set((texto.match(reUrl) || []).map((u) => u.replace(/[.,;]+$/, '')).filter((u) => !IGNORA.test(u)))];
        const tels = new Set(); let m; reTel.lastIndex = 0;
        while ((m = reTel.exec(String(j.text || '')))) { const d = m[1] + m[2] + m[3]; if (d.length >= 10 && d.length <= 11) tels.add(d); }
        l.bio = l.bio || {};
        const antes = new Set(l.bio.links || []);
        l.bio.links = [...new Set([...(l.bio.links || []), ...links])];
        if (links.some((u) => !antes.has(u))) comLink++;
        l.bio.scrape_em = new Date().toISOString().slice(0, 10);
        l.whats_achados = l.whats_achados || [];
        for (const t of tels) if (!l.whats_achados.some((w) => String(w.numero) === t)) l.whats_achados.push({ numero: t, fonte: 'bio do Instagram (scrape)' });
      } catch (e) { falhas++; console.error('falha', l.nome, e.message); }
      await L.dormir(200);
    }
  };
  await Promise.all(Array.from({ length: 3 }, trabalho));
  if (gasto) L.registrarCreditos(dir, 'bio (scrape)', gasto, 'scrape da bio do Instagram (links)');
  L.gravarLeads(dir, leads);
  console.log(`\nraspados: ${alvos.length - falhas} | com link novo: ${comLink} | falhas: ${falhas} | créditos: ${gasto}`);
  console.log('Próximo: siga a rodada; a etapa 6 (site-checar.js --fase fundo) abre os links novos.');
})();
