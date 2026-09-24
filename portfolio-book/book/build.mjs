// Builds the portfolio PDFs and proof material from book.html.
//   node build.mjs          → output/*.pdf, output/proof/*.jpg, output/proof-report.json
// Run prep_images.py first. Post-processing (trim/bleed boxes, CMYK) is in finish_pdfs.py.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, '..', 'output');
fs.mkdirSync(path.join(out, 'proof'), { recursive: true });
const NAME = 'Alaa-Masri-Portfolio-2026-2027';

const browser = await chromium.launch();
async function open(hash, scale = 1) {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: scale });
  await page.goto('file://' + path.join(here, 'book.html') + '#' + hash);
  await page.waitForFunction(() => document.documentElement.dataset.ready === '1');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => null))));
  return page;
}

// 1 · Proof checks, measured on the print-mode layout.
{
  const page = await open('print');
  const report = await page.evaluate(() => {
    const mm = 25.4 / 96;
    const res = { pages: 0, sideProblems: window.bookProblems, text: [], images: [] };
    const pages = [...document.querySelectorAll('#book .page')];
    res.pages = pages.length;
    pages.forEach(p => {
      const n = +p.dataset.page, pr = p.getBoundingClientRect();
      const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        if (!node.textContent.trim()) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const r of range.getClientRects()) {
          if (r.width < 0.5) continue;
          const d = { l: (r.left - pr.left) * mm, r: (pr.right - r.right) * mm, t: (r.top - pr.top) * mm, b: (pr.bottom - r.bottom) * mm };
          const min = Math.min(d.l, d.r, d.t, d.b);
          if (min < 7.9) { res.text.push({ page: n, minMm: +min.toFixed(1), text: node.textContent.trim().slice(0, 50) }); break; }
        }
      }
      p.querySelectorAll('img').forEach(img => {
        const r = img.getBoundingClientRect();
        const cover = getComputedStyle(img).objectFit === 'cover';
        const scale = cover ? Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight) : r.width / img.naturalWidth;
        const clip = img.closest('.fig') ? img.closest('.fig').getBoundingClientRect() : r;
        res.images.push({ page: n, file: img.getAttribute('src').split('/').pop(), px: img.naturalWidth + '×' + img.naturalHeight,
          printedMm: Math.round(Math.min(clip.width, r.width) * mm) + '×' + Math.round(Math.min(clip.height, r.height) * mm),
          ppi: Math.round(96 / scale), cropped: cover || (img.style.marginLeft !== '') });
      });
    });
    return res;
  });
  fs.writeFileSync(path.join(out, 'proof-report.json'), JSON.stringify(report, null, 2));
  const low = report.images.filter(i => i.ppi < 230);
  console.log(`pages ${report.pages} · side problems ${report.sideProblems.length} · text < 8 mm from trim ${report.text.length} · images < 230 ppi ${low.length}`);
  report.sideProblems.forEach(p => console.log('  side:', p));
  report.text.forEach(t => console.log(`  text p${t.page} ${t.minMm} mm: ${t.text}`));
  low.forEach(i => console.log(`  image p${i.page} ${i.file} ${i.ppi} ppi`));
  console.log('  min ppi', Math.min(...report.images.map(i => i.ppi)));
  await page.close();
}

// 2 · PDFs.
for (const [hash, file] of [['print', `${NAME}-print-bleed.pdf`], ['marks', `${NAME}-print-cropmarks.pdf`], ['screen', `${NAME}-screen.pdf`]]) {
  const page = await open(hash);
  await page.pdf({ path: path.join(out, file), preferCSSPageSize: true, printBackground: true, tagged: hash === 'screen', outline: false });
  await page.close();
  console.log('pdf', file);
}

// 3 · Proof spreads.
{
  const page = await open(process.argv.includes('--guides') ? 'guides' : 'proof', 1.5);
  const rows = await page.$$('.spreadrow');
  for (let i = 0; i < rows.length; i++) {
    await rows[i].screenshot({ path: path.join(out, 'proof', `spread-${String(i + 1).padStart(2, '0')}.jpg`), type: 'jpeg', quality: 86 });
  }
  console.log('proof spreads', rows.length);
  await page.close();
}
await browser.close();
