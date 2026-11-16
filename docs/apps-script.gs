/**
 * Sentinela Pomba: Web App de persistência em Google Sheets.
 *
 * Planilha: abas "telemetria", "alertas" e "resumo_diario", com cabeçalho na linha 1
 * e a coluna "chave" como identificador único (idempotência).
 *
 * Instalação:
 *  1. Na planilha: Extensões > Apps Script. Cole este arquivo.
 *  2. Configurações do projeto > Propriedades do script: SHEETS_TOKEN = <um segredo longo>.
 *  3. Implantar > Nova implantação > App da Web. Executar como: Eu. Acesso: Qualquer pessoa.
 *  4. Na Vercel: SHEETS_WEBAPP_URL = URL /exec da implantação e SHEETS_TOKEN = o mesmo segredo.
 *
 * Contrato (POST, corpo JSON em text/plain):
 *  { token, acao: 'ping' }
 *  { token, acao: 'upsert', aba, modo: 'ignorar'|'substituir', linhas: [{ chave, ...colunas }] }
 *  { token, acao: 'listar', aba, desde?: { campo, valor }, ordem?: { campo, direcao: 'asc'|'desc' }, limite? }
 * Resposta: { ok: true, ... } ou { ok: false, erro }
 */

const ABAS = ['telemetria', 'alertas', 'resumo_diario'];

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    const token = PropertiesService.getScriptProperties().getProperty('SHEETS_TOKEN');
    if (!token || req.token !== token) return json({ ok: false, erro: 'token inválido' });
    if (req.acao === 'ping') return json({ ok: true, abas: ABAS.filter((a) => SpreadsheetApp.getActive().getSheetByName(a)) });
    if (ABAS.indexOf(req.aba) < 0) return json({ ok: false, erro: 'aba inválida' });
    if (req.acao === 'upsert') return json(upsert(req.aba, req.linhas || [], req.modo || 'ignorar'));
    if (req.acao === 'listar') return json(listar(req.aba, req));
    return json({ ok: false, erro: 'ação inválida' });
  } catch (err) {
    return json({ ok: false, erro: String(err) });
  }
}

function doGet() {
  return json({ ok: true, servico: 'sentinela-pomba', abas: ABAS });
}

function upsert(nomeAba, linhas, modo) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const aba = SpreadsheetApp.getActive().getSheetByName(nomeAba);
    const cab = aba.getRange(1, 1, 1, aba.getLastColumn()).getValues()[0].map(String);
    const iChave = cab.indexOf('chave');
    const n = aba.getLastRow() - 1;
    const chaves = n > 0 ? aba.getRange(2, iChave + 1, n, 1).getValues().map((r) => String(r[0])) : [];
    const indice = {};
    chaves.forEach((c, i) => (indice[c] = i + 2));
    const novas = [];
    let ignoradas = 0, substituidas = 0;
    linhas.forEach((l) => {
      const valores = cab.map((c) => (l[c] === undefined || l[c] === null ? '' : String(l[c])));
      const linhaExistente = indice[String(l.chave)];
      if (linhaExistente) {
        if (modo === 'substituir') { aba.getRange(linhaExistente, 1, 1, cab.length).setNumberFormat('@').setValues([valores]); substituidas++; }
        else ignoradas++;
      } else {
        novas.push(valores);
        indice[String(l.chave)] = -1; // evita duplicata dentro do mesmo lote
      }
    });
    // Formato texto: impede o Sheets de converter timestamps ISO em datas locais (mantém a ordenação lexicográfica).
    if (novas.length) aba.getRange(aba.getLastRow() + 1, 1, novas.length, cab.length).setNumberFormat('@').setValues(novas);
    return { ok: true, inseridas: novas.length, ignoradas: ignoradas, substituidas: substituidas };
  } finally {
    lock.releaseLock();
  }
}

function listar(nomeAba, req) {
  const aba = SpreadsheetApp.getActive().getSheetByName(nomeAba);
  const dados = aba.getDataRange().getDisplayValues();
  const cab = dados.shift();
  let linhas = dados.map((r) => {
    const o = {};
    cab.forEach((c, i) => (o[c] = r[i]));
    return o;
  });
  if (req.desde) linhas = linhas.filter((l) => String(l[req.desde.campo]) >= String(req.desde.valor));
  if (req.ordem) {
    const c = req.ordem.campo, d = req.ordem.direcao === 'desc' ? -1 : 1;
    linhas.sort((a, b) => (String(a[c]) < String(b[c]) ? -d : String(a[c]) > String(b[c]) ? d : 0));
  }
  if (req.limite) linhas = req.ordem && req.ordem.direcao === 'desc' ? linhas.slice(0, req.limite) : linhas.slice(-req.limite);
  return { ok: true, linhas: linhas };
}

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
