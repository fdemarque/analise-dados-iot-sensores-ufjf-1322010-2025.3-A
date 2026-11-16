// Renderiza o HTML do documento em PDF A4 (Chromium), com marcadores gerados a partir dos títulos.
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const [entrada, saida] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + path.resolve(entrada), { waitUntil: 'networkidle' });
  await p.pdf({ path: saida, format: 'A4', preferCSSPageSize: true, printBackground: true, outline: true, tagged: true });
  await b.close();
})();
