// Etapa 5: lê a bio e o link da bio de cada Instagram abrindo o Chrome em modo headless (sem janela e sem gastar crédito).
// Uso:  node bio-chrome.js --dir <rodada> [--quantas N] [--login]
//   --login  abre o Chrome COM janela, no perfil desta rodada, para o operador entrar numa conta do Instagram uma vez; as leituras seguintes usam essa sessão.
// Grava em leads.json (lead.bio) e as linhas de texto cruas em bruto/bio/<@>.json. Retomável: pula quem já foi lido.
// Pausa entre perfis e para sozinho se o Instagram bloquear 3 vezes seguidas (aí peça uma conta ao operador: rode com --login).
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync, spawn } = require('child_process');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
const PERFIL = path.join(dir, 'bruto', 'bio', 'chrome-perfil');
fs.mkdirSync(PERFIL, { recursive: true });

function achaChrome() {
  const c = [CFG.chrome, process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(Boolean);
  return c.find((x) => fs.existsSync(x));
}
const CHROME = achaChrome();
if (!CHROME) { console.error('Não achei o Chrome. Defina config.chrome ou a variável CHROME_PATH com o caminho do executável.'); process.exit(1); }

if (a.login) {
  console.log('Abrindo o Chrome com janela. Peça ao operador para entrar no Instagram e fechar a janela depois.');
  spawn(CHROME, ['--user-data-dir=' + PERFIL, '--no-first-run', 'https://www.instagram.com/accounts/login/'], { detached: true, stdio: 'ignore' }).unref();
  process.exit(0);
}

const limpa = (s) => s.replace(/&amp;/g, '&').replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

function ler(handle) {
  const r = spawnSync(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--user-data-dir=' + PERFIL, '--virtual-time-budget=12000', '--dump-dom', 'https://www.instagram.com/' + handle + '/'], { encoding: 'utf8', maxBuffer: 50e6, timeout: 90000 });
  const html = r.stdout || '';
  const i = html.indexOf('<body'); const corpo = i >= 0 ? html.slice(i) : html;
  const linhas = limpa(corpo.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<br\s*\/?>/g, '\n').replace(/<[^>]+>/g, '\n')).split('\n').map((x) => x.trim()).filter(Boolean);
  const titulo = limpa((html.match(/<title>([^<]*)/) || [])[1] || '');
  const ih = linhas.findIndex((x) => x.toLowerCase() === handle.toLowerCase());
  const seg = ih >= 0 ? linhas.findIndex((x, k) => k > ih && /^(seguindo|following)$/i.test(x)) : -1;
  if (ih < 0 || seg < 0 || !new RegExp('@' + handle, 'i').test(titulo)) return { handle, bloqueado: true, titulo, linhas: linhas.slice(0, 15) };
  const nome = linhas[seg + 1] || '';
  const fim = linhas.findIndex((x, k) => k > seg + 1 && (/^(\.\.\.|…|mais|more)$/i.test(x) || /^(Ícone de link|Link icon)$/i.test(x) || /^\.\.\./.test(x)));
  const bio = linhas.slice(seg + 2, fim > 0 ? fim : seg + 14).join('\n');
  const truncada = fim > 0 && /^(\.\.\.|…|mais|more)/i.test(linhas[fim]);
  const ilink = linhas.findIndex((x) => /^(Ícone de link|Link icon)$/i.test(x));
  const textoLinks = ilink >= 0 ? [linhas[ilink + 1]].filter(Boolean) : [];
  const hrefs = [...new Set([...html.matchAll(/https?:\/\/l\.instagram\.com\/\?u=([^"'&\s]+)/g)].map((m) => { try { return decodeURIComponent(m[1]); } catch { return m[1]; } }))];
  const links = [...new Set([...hrefs, ...textoLinks.map((u) => (/^https?:/.test(u) ? u : 'https://' + u))])];
  const num = (k) => { const m = (linhas[ih + k] || '').match(/[\d.,]+(?:\s?(?:mil|mi|k|m))?/i); return m ? m[0] : ''; };
  const seguidores = linhas.slice(ih, seg).find((x) => /^[\d.,]+\s?(mil|mi|k|m)?$/i.test(x) && x !== handle) || '';
  return { handle, bloqueado: false, nome, bio, bio_truncada: truncada, links, seguidores, titulo };
}

(async () => {
  const leads = L.lerLeads(dir);
  const fila = L.ativos(leads).filter((l) => l.instagram && !(l.bio && !l.bio.bloqueado)).slice(0, a.quantas ? Number(a.quantas) : Infinity);
  console.log('perfis a ler:', fila.length, '(custo: nenhum crédito)');
  fs.mkdirSync(path.join(dir, 'bruto', 'bio'), { recursive: true });
  let seguidosBloqueados = 0; let lidos = 0;
  for (const l of fila) {
    const h = l.instagram.handle;
    const r = ler(h);
    fs.writeFileSync(path.join(dir, 'bruto', 'bio', h + '.json'), JSON.stringify(r, null, 1));
    if (r.bloqueado) {
      l.bio = { bloqueado: true, lido_em: new Date().toISOString() }; seguidosBloqueados++;
      console.log('  bloqueado ou vazio:', h, '|', r.titulo);
      if (seguidosBloqueados >= 3) { console.log('\nO Instagram bloqueou 3 leituras seguidas (provável tela de login). Peça ao operador para conectar uma conta: node bio-chrome.js --dir <rodada> --login'); break; }
    } else {
      seguidosBloqueados = 0; lidos++;
      l.bio = { texto: r.bio, bio_truncada: r.bio_truncada, links: r.links, seguidores: r.seguidores, nome_perfil: r.nome, lido_em: new Date().toISOString(), fonte: 'chrome headless' };
      console.log('  ok:', h, '|', r.nome, '|', r.bio.replace(/\n/g, ' / ').slice(0, 80), '| links:', r.links.join(' ') || '—');
    }
    L.gravarLeads(dir, leads);
    await L.dormir(3000 + Math.random() * 3000);
  }
  console.log(`\nlidos: ${lidos} | ainda sem bio: ${L.ativos(leads).filter((l) => l.instagram && (!l.bio || l.bio.bloqueado)).length}`);
  console.log('Obs.: a bio vem cortada no "mais" do Instagram (bio_truncada: true); o link da bio vem inteiro.');
})();
