// Etapa 7: depois do cnpj-receita.js, dá o nível de confiança do CNPJ (confirmado | a_conferir) e tira o nome do dono. Uso: node cnpj-refinar.js --dir <rodada>
// confirmado = situação ativa E (duas provas ou mais, OU uma prova + nome da empresa batendo com a razão/fantasia)
// a conferir  = o resto (baixada/inapta, só uma prova sem nome, nome diferente)
const L = require('./lib');
const a = L.args(); const dir = L.pastaRodada(a); const CFG = L.config(dir);
// palavras de negócio (genéricas e do nicho) que mostram que a razão social não é só o nome do dono
const NEGOCIO = new Set(['ltda', 'eireli', 'epp', 'servicos', 'comercio', 'industria', 'escola', 'creche', 'bercario', 'educacao', 'colegio', 'centro', 'instituto', 'barbearia', 'barber', 'salao', 'studio', 'estudio', 'estetica', 'clinica', 'odontologia', 'academia', 'loja', 'marmoraria', 'marmores', 'granitos', 'pedras', 'auto', 'center', 'car', 'motors', 'veiculos'].concat(((CFG.nicho && CFG.nicho.palavrasComuns) || []).map(L.norm)));
const dig = (s) => String(s || '').replace(/\D/g, '');
const PARADA = new Set(['de', 'da', 'do', 'dos', 'das', 'e', 'a', 'o', 'ltda', 'epp', 'me', 'eireli', 'sao', 'paulo', 'com', 'comercio', 'industria', 'servicos'].concat(((CFG.nicho && CFG.nicho.palavrasComuns) || []).map(L.norm)));
const sig = (s) => L.norm(s).split(' ').filter((t) => t.length > 2 && !PARADA.has(t));

// MEI / firma individual: a razão social é "NOME + CPF" ou "NN.NNN.NNN NOME"
function donoDaRazao(razao) {
  const r = String(razao || '').trim();
  let m = r.match(/^(.+?)\s+(\d{8,11})$/);                       // NOME 18325508850 (CPF inteiro ou parcial)
  if (m && /^[A-Za-zÀ-ÿ' .-]+$/.test(m[1]) && m[1].trim().split(/\s+/).length >= 2) return m[1].trim();
  m = r.match(/^\d{2}\.\d{3}\.\d{3}\s+(.+)$/);                   // 52.515.649 NOME
  if (m && m[1].trim().split(/\s+/).length >= 2) return m[1].trim();
  // empresário individual com a razão só com o nome da pessoa (sem LTDA, ME, EIRELI nem palavra de negócio)
  if (L.norm(r).split(' ').some((t) => NEGOCIO.has(t))) return '';   // palavra de negócio ou do nicho na razão: não é só o nome de uma pessoa
  if (/^[A-ZÀ-Ý' ]+$/.test(r) && r.split(/\s+/).length>= 2 && r.split(/\s+/).length <= 6 && !/\b(LTDA|EIRELI|EPP|ME|S\/?A|SA|COMERCIO|COM|IND|INDUSTRIA|MARMORARIA|MARMORES|MARMORE|GRANITOS|GRANITO|PEDRAS|PEDRA|STONE|DECOR|ACABAMENTOS|REVESTIMENTOS|SERVICOS|CONSTRUCOES|MATERIAIS|DISTRIBUIDORA|ARTES|ARTE|GRUPO|EMPREENDIMENTOS)\b/.test(r)) return r;
  return '';
}

const leads = L.lerLeads(dir);
const cont = { confirmado: 0, a_conferir: 0, sem_cnpj: 0 }; let comDono = 0; const motivos = {};
for (const l of L.ativos(leads)) {
  const c = l.cnpj;
  if (!c) { cont.sem_cnpj++; continue; }
  const razaoNorm = L.norm((c.razao || '') + ' ' + (c.fantasia || ''));
  const toks = sig(l.nome);
  const nomeParcial = toks.length > 0 && toks.some((t) => razaoNorm.split(' ').includes(t));
  const provas = new Set(c.provas || []);
  const ativa = c.situacao === 'ativa';
  let nivel = 'a_conferir'; let por = '';
  if (!ativa) por = 'CNPJ ' + c.situacao + ' (empresa pode ter fechado; pode ser de quem ocupou o endereço antes)';
  else if (provas.size >= 2) { nivel = 'confirmado'; por = 'duas provas: ' + [...provas].join(' + '); }
  else if (provas.size >= 1 && nomeParcial) { nivel = 'confirmado'; por = [...provas].join(' + ') + ' + nome da empresa bate com a razão social'; }
  else por = 'só uma prova (' + [...provas].join(' + ') + ') e o nome da empresa não bate com a razão social: pode ser outra empresa no mesmo endereço/telefone';
  c.nivel = nivel; c.nivel_motivo = por;
  // dono: sócio-administrador da Receita; senão, titular de MEI/firma individual pela razão social
  let dono = null;
  if (c.responsavel) { const m = c.responsavel.match(/^(.*?)\s*\(([^)]+)\)\s*$/); dono = { nome: m ? m[1] : c.responsavel, qualificacao: m ? m[2] : '', fonte: 'quadro societário da Receita' }; }
  else { const n = donoDaRazao(c.razao); if (n) dono = { nome: n, qualificacao: 'Titular (MEI/empresário individual)', fonte: 'razão social do CNPJ (nome do titular)' }; }
  c.dono = dono; if (dono) comDono++;
  cont[nivel]++; motivos[por.split(':')[0].slice(0, 40)] = (motivos[por.split(':')[0].slice(0, 40)] || 0) + 1;
}
L.gravarLeads(dir, leads);
const at = L.ativos(leads);
console.log(cont, '| com nome do dono:', comDono, '| confirmados com dono:', at.filter((l) => l.cnpj && l.cnpj.nivel === 'confirmado' && l.cnpj.dono).length);
console.log(motivos);
