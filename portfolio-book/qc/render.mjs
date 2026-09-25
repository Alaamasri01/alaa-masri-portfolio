// QC render: node render.mjs [proof|all]
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, 'review');
fs.mkdirSync(out, { recursive: true });
const mode = process.argv[2] || 'proof';
const b = await chromium.launch();
async function open(hash, dpr) {
  const p = await b.newPage({ viewport: { width: 900, height: 1200 }, deviceScaleFactor: dpr });
  p.on('pageerror', e => console.log('pageerror', e.message)); p.on('console', m => m.type() === 'error' && console.log('console', m.text()));
  await p.goto('file://' + path.join(here, 'qc.html') + hash);
  await p.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await p.evaluate(() => document.fonts.ready); await p.waitForLoadState('networkidle');
  await p.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => null))));
  return p;
}
const names = ['p20-opener', 'p21-render-material', 'p22-plan', 'p23-elevations', 'p24-details', 'p39-technical'];
if (mode === 'proof') {
  const p = await open('', 1.6); const pages = await p.$$('.page');
  for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: path.join(out, `proof-${names[i]}.jpg`), type: 'jpeg', quality: 85 });
  const ppi = await p.evaluate(() => [...document.querySelectorAll('.crop,.fig')].map(el => { const img = el.querySelector('img'); if (!img) return null; const r = img.getBoundingClientRect(); return [el.closest('.page').dataset.folio.split('|')[0], img.getAttribute('src').split('/').pop(), Math.round(img.naturalWidth / (r.width / 96))]; }).filter(Boolean));
  console.log('low ppi', ppi.filter(x => x[2] < 230));
}
if (mode === 'all') {
  for (const [hash, file] of [['#print', 'QC-walnut-6pp-normal.pdf'], ['#print-grid', 'QC-walnut-6pp-grid-overlay.pdf']]) {
    const p = await open(hash, 1);
    await p.pdf({ path: path.join(out, file), preferCSSPageSize: true, printBackground: true });
    await p.close(); console.log('pdf', file);
  }
  // C · 100 % A4: 96 px per inch = the page at actual size on a standard display
  { const p = await open('#print', 1); const pages = await p.$$('.page');
    for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: path.join(out, `A4-100pct-${names[i]}.png`) });
    // grid overlay at 1.5x for alignment checks
    await p.close(); }
  { const p = await open('#print-grid', 1.5); const pages = await p.$$('.page');
    for (let i = 0; i < pages.length; i++) await pages[i].screenshot({ path: path.join(out, `grid-${names[i]}.jpg`), type: 'jpeg', quality: 88 });
    await p.close(); }
  // D · close-ups at 300 dpi (true-size detail as printed)
  { const p = await open('#print', 300 / 96); const mm = 96 / 25.4;
    const pages = await p.$$('.page');
    const clips = [[2, 'closeup-plan', 15, 37, 175, 167], [3, 'closeup-elevation', 20, 37, 175, 100], [4, 'closeup-detail', 15, 24, 115, 162], [4, 'closeup-detail-junction', 15, 199, 175, 62], [2, 'closeup-titleblock', 15, 203, 175, 77], [5, 'closeup-shop-drawing', 20, 24, 175, 144]];
    for (const [pi, name, x, y, w, h] of clips) {
      await pages[pi].evaluate(e => e.scrollIntoView()); const bb = await pages[pi].boundingBox();
      await p.screenshot({ path: path.join(out, name + '.png'), clip: { x: bb.x + x * mm, y: bb.y + y * mm, width: w * mm, height: h * mm } });
    }
    await p.close(); }
}
await b.close();
