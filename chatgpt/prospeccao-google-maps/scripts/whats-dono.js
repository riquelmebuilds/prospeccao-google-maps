// Etapa 10 (WhatsApp do dono): separa o WhatsApp do DONO do WhatsApp da EMPRESA.
// Uso: node whats-dono.js --dir <rodada>
// Antes: node whats-achar.js --dir <rodada> --cnpj (junta os telefones do cadastro) e node whats-testar.js (testa os novos).
// Regras:
//  - telefone que veio SÓ do CNPJ fica sempre (nunca é apagado) e ganha w.so_cnpj = 'confirmado' ou 'a_conferir':
//    com CNPJ a conferir, o número pode ser de outra empresa no mesmo endereço, e o cartão avisa;
//  - perfil comercial de contabilidade: marcado como contador, nunca vira WhatsApp do dono;
//  - WhatsApp do dono = celular do cadastro de um CNPJ CONFIRMADO que tem dono e que a Evolution confirmou. Sempre "provável".
//  - sem WhatsApp do dono não é problema: o WhatsApp da empresa (etapa 9) continua valendo.
'use strict';
const L = require('./lib');
const a = L.args(); const dir = L.pastaRodada(a);
const leads = L.lerLeads(dir);
let tirados = 0, contadores = 0, comDono = 0;
for (const l of L.ativos(leads)) {
  const confirmado = l.cnpj && l.cnpj.nivel === 'confirmado';
  l.whats = l.whats || [];
  for (const w of l.whats) {
    const fontes = String(w.fonte || '').split(' + ');
    const soCnpj = fontes.length && fontes.every((f) => /telefone do CNPJ/.test(f));
    if (soCnpj) { w.so_cnpj = confirmado ? 'confirmado' : 'a_conferir'; if (!confirmado) tirados++; } else delete w.so_cnpj;
  }
  for (const w of l.whats) { const d = (w.perfil && w.perfil.descricao) || ''; if (/contabil|contador|escrit[oó]rio cont/i.test(d)) { w.contador = true; contadores++; } }
  delete l.whatsapp_dono;
  if (confirmado && l.cnpj.dono) {
    const w = l.whats.find((x) => x.existe && !x.contador && x.celular && /telefone do CNPJ/.test(x.fonte || ''));
    if (w) {
      const mei = /Titular/.test(l.cnpj.dono.qualificacao || '');
      l.whatsapp_dono = { numero: w.numero, nome: l.cnpj.dono.nome, grau: 'provável', prova: mei ? 'celular do cadastro de um MEI/empresário individual (costuma ser do próprio dono)' : 'celular do cadastro do CNPJ confirmado; pode ser do dono ou do contador' };
      comDono++;
    }
  }
}
L.gravarLeads(dir, leads);
const at = L.ativos(leads);
console.log(`números só do CNPJ a conferir (ficam, com aviso): ${tirados} | números de contador marcados: ${contadores} | leads com WhatsApp do dono (provável): ${comDono} de ${at.length}`);
console.log('leads sem nenhum WhatsApp da empresa:', at.filter((l) => !(l.whats || []).some((w) => w.existe && !w.contador)).length);
