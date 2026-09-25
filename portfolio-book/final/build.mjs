// Final build: QC report + PDFs + proof spreads.   node build.mjs   (run prep_images.py first; finish_pdfs.py after)
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const here = path.dirname(fileURLToPath(import.meta.url)), out = path.join(here, '..', 'output');
fs.mkdirSync(path.join(out, 'proof'), { recursive: true });
const NAME = 'Alaa-Masri-Portfolio-2026-2027';
const browser = await chromium.launch();
async function open(hash, scale = 1) {
  const p = await browser.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: scale });
  p.on('console', m => m.type() === 'error' && console.log('console:', m.text())); p.on('pageerror', e => console.log('pageerror:', e.message));
  await p.goto('file://' + path.join(here, 'book.html') + '#' + hash);
  await p.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await p.evaluate(() => document.fonts.ready); await p.waitForLoadState('networkidle');
  await p.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => null))));
  return p;
}
{ // QC on the print layout
  const p = await open('print');
  const r = await p.evaluate(() => {
    const MM = 25.4 / 96, PT = 72 / 96, res = { pages: 0, problems: window.bookProblems, minTextPt: 99, small: [], nearTrim: [], overflow: [], images: [], svgMinMm: 99, svgSmall: [] };
    const pages = [...document.querySelectorAll('#book .page')]; res.pages = pages.length;
    pages.forEach(pg => {
      const n = +pg.dataset.page, pr = pg.getBoundingClientRect();
      const w = document.createTreeWalker(pg, NodeFilter.SHOW_TEXT); let t;
      while ((t = w.nextNode())) {
        if (!t.textContent.trim()) continue; const el = t.parentElement; if (el.closest('svg')) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize) * PT; if (fs < res.minTextPt) res.minTextPt = +fs.toFixed(2);
        if (fs < 7.45) res.small.push([n, fs.toFixed(2), t.textContent.trim().slice(0, 40)]);
        const rg = document.createRange(); rg.selectNodeContents(t);
        for (const b of rg.getClientRects()) { if (b.width < .5) continue;
          const d = Math.min(b.left - pr.left, pr.right - b.right, b.top - pr.top, pr.bottom - b.bottom) * MM;
          if (d < 7.9) { res.nearTrim.push([n, +d.toFixed(1), t.textContent.trim().slice(0, 40)]); break; } }
      }
      pg.querySelectorAll('svg text').forEach(tx => { const s = parseFloat(tx.getAttribute('font-size')); if (s < res.svgMinMm) res.svgMinMm = s; if (s < 2.64) res.svgSmall.push([n, s, tx.textContent.slice(0, 30)]); });
      pg.querySelectorAll('.cap, .body, .keys, .note, .lead, .cell, .meta, table').forEach(el => { if (el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow !== 'visible') res.overflow.push([n, el.className, el.textContent.slice(0, 30)]); });
      pg.querySelectorAll('img').forEach(img => {
        const b = img.getBoundingClientRect(), fig = img.closest('.fig'), cover = fig && !fig.classList.contains('fig--native');
        const sc = cover ? Math.max(b.width / img.naturalWidth, b.height / img.naturalHeight) : b.width / img.naturalWidth;
        res.images.push({ page: n, file: img.getAttribute('src').split('/').pop(), px: img.naturalWidth + '×' + img.naturalHeight, ppi: Math.round(96 / sc) });
      });
    });
    return res;
  });
  fs.writeFileSync(path.join(out, 'proof-report.json'), JSON.stringify(r, null, 1));
  const low = r.images.filter(i => i.ppi < 230);
  console.log(`pages ${r.pages} · engine problems ${r.problems.length} · min HTML text ${r.minTextPt} pt · min drawing text ${r.svgMinMm} mm (${(r.svgMinMm * 2.835).toFixed(2)} pt) · small ${r.small.length + r.svgSmall.length} · text <8 mm from trim ${r.nearTrim.length} · images <230 ppi ${low.length} · min ppi ${Math.min(...r.images.map(i => i.ppi))}`);
  [...r.problems, ...r.small, ...r.svgSmall, ...r.nearTrim, ...r.overflow, ...low].slice(0, 40).forEach(x => console.log('  ', JSON.stringify(x)));
  await p.close();
}
for (const [hash, file] of [['print', `${NAME}-print-bleed.pdf`], ['marks', `${NAME}-print-cropmarks.pdf`], ['screen', `${NAME}-screen.pdf`], ['grid', `${NAME}-grid-overlay.pdf`]]) {
  const p = await open(hash);
  await p.pdf({ path: path.join(out, file), preferCSSPageSize: true, printBackground: true, tagged: hash === 'screen' });
  await p.close(); console.log('pdf', file);
}
{ const p = await open('proof', 1.5); const rows = await p.$$('.spreadrow');
  for (let i = 0; i < rows.length; i++) await rows[i].screenshot({ path: path.join(out, 'proof', `spread-${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 86 });
  console.log('proof spreads', rows.length); await p.close(); }
await browser.close();
