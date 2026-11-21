// Etapa 5 (bio): o julgamento é seu; a gravação é deste script.
// Uso: node bio-decidir.js --dir <rodada> --listar            (escreve bruto/bio-para-ler.md: uma linha por lead com nome, categoria, cidade,
//                                                              bio lida no Chrome ou trecho do Google, links, aviso de suspeita e a pista dos sinais do nicho)
//      node bio-decidir.js --dir <rodada> --aplicar <arquivo>  (aplica as suas decisões e tira só o que está claramente fora do nicho)
// O arquivo de decisões é uma lista JSON, um item por lead lido:
//   [{ "chave": "l-0001", "nicho": "dentro|fora|duvida", "motivo": "só quando fora/dúvida: o que a bio mostra",
//      "o_que_e": "uma frase concreta do que a empresa é e oferece",
//      "suspeito": "o motivo, se o perfil parece de outra empresa ou cidade; \"ok\" se a bio confirma um perfil que tinha aviso (o aviso sai); senão vazio",
//      "porte": "só quando config.nicho.criterioPorte existe: o que a bio e os links mostram (ex.: '4 barbeiros na agenda', 'não deu pra contar')" }]
// "fora" sai (removidos.csv, com o motivo); "duvida" fica com aviso; "suspeito" vai para instagram.suspeito (aviso no cartão, não tira o lead).
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const leads = L.lerLeads(dir);
const S = (CFG.nicho && CFG.nicho.sinais) || {};
const rx = (s) => (s ? new RegExp(s, 'i') : null);
const DENTRO = rx(S.dentro), FORA = rx(S.fora);
const umaLinha = (s) => String(s || '').replace(/\s+/g, ' ').trim();

if (a.listar) {
  const at = L.ativos(leads).filter((l) => l.instagram);
  const linhas = ['# Bios para ler (' + at.length + ' leads)', '', 'Decida para cada lead: nicho (dentro | fora | duvida), o_que_e (uma frase) e suspeito (se o perfil parece de outra empresa ou cidade).', ''];
  for (const l of at) {
    const ig = l.instagram; const b = l.bio || {};
    const bio = b.texto ? umaLinha(b.texto) : (b.bloqueado ? '(Chrome não conseguiu ler) ' : '') + umaLinha(ig.trecho);
    const t = [l.nome, l.categoria, bio].join(' ');
    const pista = FORA && FORA.test(t) ? 'sinal de fora: "' + t.match(FORA)[0] + '"' : DENTRO && DENTRO.test(t) ? 'sinal do nicho: "' + t.match(DENTRO)[0] + '"' : 'sem sinal';
    linhas.push(`- **${l.chave}** · ${l.nome} · ${l.categoria || 'sem categoria'} · ${l.cidade}/${l.bairro} · @${ig.handle}` + (b.seguidores ? ' · ' + b.seguidores + ' seguidores' : ''));
    linhas.push(`  bio: ${bio.slice(0, 400) || '(vazia)'}`);
    if ((b.links || []).length) linhas.push('  links: ' + b.links.join(' '));
    if (b.nome_perfil) linhas.push('  nome no perfil: ' + b.nome_perfil);
    linhas.push('  pista: ' + pista + (ig.suspeito ? ' | AVISO: ' + ig.suspeito : '') + (l.endereco ? ' | ficha: ' + l.endereco : ''));
  }
  const arq = path.join(dir, 'bruto', 'bio-para-ler.md');
  fs.mkdirSync(path.dirname(arq), { recursive: true });
  fs.writeFileSync(arq, linhas.join('\n'));
  console.log('escrito', arq, '|', at.length, 'leads | sem bio lida pelo Chrome:', at.filter((l) => !(l.bio && l.bio.texto)).length);
  process.exit(0);
}

if (a.aplicar) {
  // caminho relativo vale a partir da pasta da rodada (ex.: bruto/bio-decisoes.json)
  const arq = path.isAbsolute(String(a.aplicar)) ? String(a.aplicar) : path.join(dir, String(a.aplicar));
  const dec = JSON.parse(fs.readFileSync(arq, 'utf8'));
  const porChave = new Map(leads.map((l) => [l.chave, l]));
  const cont = { dentro: 0, fora: 0, duvida: 0, suspeitos: 0, sem_lead: 0 };
  for (const d of dec) {
    const l = porChave.get(d.chave); if (!l || l.estado === 'removido') { cont.sem_lead++; continue; }
    if (d.o_que_e) l.o_que_e = umaLinha(d.o_que_e);
    if (d.porte) l.porte_aviso = umaLinha(d.porte);   // critério de porte do operador (ex.: "3 barbeiros na agenda", "não deu pra contar")
    // "ok": a bio confirma que o perfil é da empresa, e o aviso da etapa 4 sai; qualquer outro texto vira aviso
    if (d.suspeito === 'ok' && l.instagram) l.instagram.suspeito = '';
    else if (d.suspeito && l.instagram) { l.instagram.suspeito = [l.instagram.suspeito, umaLinha(d.suspeito)].filter(Boolean).join('; '); cont.suspeitos++; }
    l.nicho_bio = d.nicho; if (d.motivo) l.nicho_motivo = umaLinha(d.motivo);
    if (d.nicho === 'fora') { L.remover(dir, l, 'fora do nicho pela bio: ' + umaLinha(d.motivo || ''), 'bio'); cont.fora++; }
    else if (d.nicho === 'duvida') cont.duvida++; else cont.dentro++;
  }
  L.gravarLeads(dir, leads);
  const faltam = L.ativos(leads).filter((l) => l.instagram && !l.nicho_bio);
  console.log('aplicado:', cont, '| leads ativos:', L.ativos(leads).length, '| ainda sem decisão:', faltam.length);
  if (faltam.length) console.log('  sem decisão:', faltam.slice(0, 20).map((l) => l.chave).join(' '));
  process.exit(0);
}

console.error('Use --listar ou --aplicar <arquivo.json>.'); process.exit(1);
