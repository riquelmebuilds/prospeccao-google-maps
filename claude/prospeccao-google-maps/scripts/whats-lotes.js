// Etapa 9 (WhatsApp da empresa, parte dos agentes): depois do whats-achar.js e do whats-testar.js, divide em lotes os leads que AINDA NÃO têm
// nenhum número com WhatsApp confirmado, para agentes procurarem o número em lugares que o script não alcança (Linktree, site, Facebook, Google).
// Uso: node whats-lotes.js --dir <rodada> [--tamanho 10]
// O agente escreve bruto/whats-lotes/resultado-NN.json (formato em referencia/agente-whatsapp.md). Depois: node whats-aplicar.js --dir <rodada>
'use strict';
const fs = require('fs');
const path = require('path');
const L = require('./lib');

const a = L.args(); const dir = L.pastaRodada(a);
const tam = Number(a.tamanho || 10);
const leads = L.ativos(L.lerLeads(dir)).filter((l) => !(l.whats || []).some((w) => w.existe));
const pasta = path.join(dir, 'bruto', 'whats-lotes'); fs.mkdirSync(pasta, { recursive: true });
const item = (l) => ({
  chave: l.chave, nome: l.nome, cidade: l.cidade, bairro: l.bairro, categoria: l.categoria || '', endereco: l.endereco || '',
  telefones_da_ficha: [l.telefone, ...(l.outras_fichas || []).map((f) => f.telefone)].filter(Boolean),
  instagram: l.instagram ? { handle: l.instagram.handle, url: l.instagram.url } : null,
  links_da_bio: (l.bio && l.bio.links) || [], site: (l.site && l.site.url) || '', ficha_maps: l.maps || '',
  numeros_ja_testados_sem_whatsapp: (l.whats || []).filter((w) => w.existe === false).map((w) => w.numero),
});
const n = Math.ceil(leads.length / tam);
for (let i = 0; i < n; i++) fs.writeFileSync(path.join(pasta, 'lote-' + String(i + 1).padStart(2, '0') + '.json'), JSON.stringify(leads.slice(i * tam, (i + 1) * tam).map(item), null, 1));
console.log(`${leads.length} leads sem WhatsApp confirmado, em ${n} lotes de até ${tam} (bruto/whats-lotes/). Agentes sugeridos: ${Math.min(n, 5)} em paralelo.`);
