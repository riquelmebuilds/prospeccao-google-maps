// Etapa 8 (só quando config.nicho.publicaOuParticular = true, como em escolas): separa particular de pública ou entidade, com até três fontes:
//   1) sinais no nome, na categoria e na bio (config.nicho.publica.sinaisPublica / sinaisParticular, regex);
//   2) razão social do CNPJ (só CNPJ confirmado, ou "a conferir" com endereço e nome ou telefone batendo);
//   3) Google pelo Serper, só para quem ficou sem resposta nas duas primeiras (1 crédito por lead; resposta inteira em bruto/particular/).
// Uso: node publica-particular.js --dir <rodada> [--simular] [--sem-google]
// Decisão: só "particular" → particular | só "pública" → sai (removidos.csv) | as duas, ou nenhuma → "não sei" (fica, com aviso no cartão).
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const N = CFG.nicho || {};
if (!N.publicaOuParticular) { console.log('config.nicho.publicaOuParticular não está ligado: esta etapa não vale para este nicho.'); process.exit(0); }
const P = N.publica || {};
const rx = (s, padrao) => new RegExp(s || padrao, 'i');
const SIN_PUB = rx(P.sinaisPublica, '\\bCEI\\b|\\bEMEI\\b|\\bCEMEI\\b|\\bCMEI\\b|\\bEMEF\\b|municipal|estadual|prefeitura|conveniad|escola p[úu]blica|rede p[úu]blica|gratuit');
const SIN_PART = rx(P.sinaisParticular, 'escola particular|col[ée]gio privado|escola privada|\\bparticular\\b|\\bprivad|mensalidade|bil[íi]ng|bilingu|maple bear|montessori|waldorf|franquia');
const RAZAO_ENT = /CAIXA ESCOLAR|GRUPO DE ORACAO|CRUZADA|ASSOCIACAO|ASSOCIAÇÃO|FUNDACAO|FUNDAÇÃO|CONGREGACAO|CONGREGAÇÃO|PAROQUIA|PARÓQUIA|MUNICIPIO|MUNICÍPIO|PREFEITURA|SERVICO SOCIAL|SERVIÇO SOCIAL|BENEFICENTE|IRMANDADE|CENTRO SOCIAL|UNIAO|UNIÃO|\bORDEM\b|PROVINCIA|PROVÍNCIA|OBRAS SOCIAIS|FRATERNIDADE|INSTITUTO|\bCEI\b/i;
const RAZAO_PRIV = /LIMITADA|\bLTDA\b|\bEPP\b|\bEIRELI\b|\bS\/?A\b|\bME\b|\bSS\b|SOCIEDADE SIMPLES|\bEI\b|\d{8,11}\s*$/i;
const GOOGLE_PART = /mensalidade|escola particular|rede particular|\bprivad|\bparticular\b|valores e planos|matr[íi]culas abertas/i;
const GOOGLE_PUB = /prefeitura|rede p[úu]blica|escola p[úu]blica|gratuit|conveniad|secretaria municipal|rede municipal/i;
const GEN = new Set(['escola', 'educacao', 'infantil', 'bercario', 'creche', 'colegio', 'centro', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'particular'].concat((N.palavrasComuns || []).map(L.norm)));

const leads = L.lerLeads(dir);
const alvos = L.ativos(leads).filter((l) => !l.particular);

function fontesLocais(l) {
  const ev = [];
  const texto = [l.nome, l.categoria, l.bio && l.bio.texto, l.instagram && l.instagram.trecho].filter(Boolean).join(' · ');
  const mp = texto.match(SIN_PUB), mq = texto.match(SIN_PART);
  if (mp && !mq) ev.push({ fonte: 'nome, categoria ou bio', diz: 'publica', prova: '"' + mp[0] + '"' });
  if (mq && !mp) ev.push({ fonte: 'nome, categoria ou bio', diz: 'particular', prova: '"' + mq[0] + '"' });
  const c = l.cnpj;
  const provas = (c && c.provas) || [];
  const valeCnpj = c && c.numero && (c.nivel === 'confirmado' || (provas.some((p) => /endere/i.test(p)) && provas.some((p) => /nome|telefone/i.test(p))));
  if (valeCnpj) {
    const z = String(c.razao || '');
    // sufixo de empresa (LTDA, EPP, ME, EIRELI, S.A., MEI) vence palavra de entidade: "INSTITUTO EDUCACIONAL X LTDA" é empresa
    if (RAZAO_PRIV.test(z)) ev.push({ fonte: 'razão social do CNPJ', diz: 'particular', prova: z });
    else if (RAZAO_ENT.test(z)) ev.push({ fonte: 'razão social do CNPJ', diz: 'publica', prova: z + ' (entidade)' });
    else if (/^(\d[\d.]*\s+)?([A-ZÀ-Ý]{2,}\s+){1,}[A-ZÀ-Ý]{2,}$/.test(z.trim()) && !/EDUCACAO|ESCOLA|CRECHE|BERCARIO|CENTRO|REDE/.test(z)) ev.push({ fonte: 'razão social do CNPJ', diz: 'particular', prova: z + ' (empresário individual: nome de pessoa)' });
  }
  return ev;
}

function decidir(ev) {
  const p = ev.some((e) => e.diz === 'particular'), q = ev.some((e) => e.diz === 'publica');
  return p && !q ? 'particular' : q && !p ? 'publica' : 'nao_sei';
}

(async () => {
  const semResp = alvos.filter((l) => decidir(fontesLocais(l)) === 'nao_sei');
  console.log('leads a separar:', alvos.length, '| sem resposta pelas fontes locais:', semResp.length, a['sem-google'] ? '' : '(Google: ' + semResp.length + ' créditos)');
  if (a.simular) process.exit(0);
  const chave = !a['sem-google'] && semResp.length ? L.lerChave((CFG.serper && CFG.serper.chaveVar) || 'SERPER_API_KEY', CFG.serper && CFG.serper.envFile, path.join(dir, '.env')) : '';
  if (chave) L.conferirSaldo(dir, CFG, semResp.length);
  fs.mkdirSync(path.join(dir, 'bruto', 'particular'), { recursive: true });
  let gasto = 0;
  for (const l of alvos) {
    const ev = fontesLocais(l);
    if (decidir(ev) === 'nao_sei' && chave) {
      const arq = path.join(dir, 'bruto', 'particular', l.chave + '.json');
      let j = fs.existsSync(arq) ? JSON.parse(fs.readFileSync(arq, 'utf8')) : null;
      if (!j) { try { j = await L.serperBusca(chave, `${l.nome.replace(/ - .*| \(.*/, '')} ${l.bairro} ${l.cidade} é escola particular ou pública?`); gasto += Number(j.credits || 1); fs.writeFileSync(arq, JSON.stringify(j, null, 1)); } catch (e) { console.error('erro na busca:', e.message, '- rode de novo para continuar'); break; } await L.dormir(250); }
      const tk = L.norm(l.nome).split(' ').filter((t) => t.length > 3 && !GEN.has(t));
      const rel = (j.organic || []).slice(0, 8).filter((o) => { const t = L.norm((o.title || '') + ' ' + (o.link || '')); return tk.some((x) => t.includes(x)); });
      const txt = rel.map((o) => (o.title || '') + ' ' + (o.snippet || '')).join(' ');
      const g1 = txt.match(GOOGLE_PART), g2 = txt.match(GOOGLE_PUB);
      if (g1 && !g2) ev.push({ fonte: 'Google', diz: 'particular', prova: 'o resultado sobre a escola diz "' + g1[0] + '"' });
      if (g2 && !g1) ev.push({ fonte: 'Google', diz: 'publica', prova: 'o resultado sobre a escola diz "' + g2[0] + '"' });
    }
    l.particular = { decisao: decidir(ev), fontes: ev, em: new Date().toISOString() };
    L.gravarLeads(dir, leads);
  }
  if (gasto) L.registrarCreditos(dir, 'particular ou pública', gasto, 'é escola particular ou pública?');
  let saiu = 0;
  for (const l of L.ativos(leads).filter((x) => x.particular && x.particular.decisao === 'publica')) { L.remover(dir, l, 'pública ou entidade: ' + l.particular.fontes.map((e) => e.fonte + ' ' + e.prova).join('; '), 'particular ou pública'); saiu++; }
  L.gravarLeads(dir, leads);
  const at = L.ativos(leads);
  console.log(`particular: ${at.filter((l) => l.particular && l.particular.decisao === 'particular').length} | não sei (ficam com aviso): ${at.filter((l) => l.particular && l.particular.decisao === 'nao_sei').length} | saíram por pública/entidade: ${saiu} | créditos: ${gasto} | leads ativos: ${at.length}`);
})();
