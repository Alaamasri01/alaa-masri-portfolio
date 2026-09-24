// Renders the Phase 5 review boards to JPG and reports image resolution per board.
import { createRequire } from 'node:module'; import { execSync } from 'node:child_process';
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require(path.join(execSync('npm root -g').toString().trim(), 'playwright'));
const here = path.dirname(fileURLToPath(import.meta.url));
const names = ['01-cover-image', '02-cover-grid', '03-cover-hybrid', '04-profile', '05-opener', '06-design-language', '07-technical-cad', '08-material-detail', '09-cinematic-dark', '10-expertise', '11-technical-capability', '12-contact-back'];
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1900, height: 1200 }, deviceScaleFactor: 2 });
p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
p.on('pageerror', e => console.log('pageerror:', e.message));
await p.goto('file://' + path.join(here, 'review.html'));
await p.waitForFunction(() => document.documentElement.dataset.ready === '1');
await p.evaluate(() => document.fonts.ready); await p.waitForLoadState('networkidle');
await p.evaluate(() => Promise.all([...document.images].map(i => i.decode().catch(() => null))));
const rep = await p.evaluate(() => [...document.querySelectorAll('.board')].map(bd => {
  const r = [];
  bd.querySelectorAll('img').forEach(img => {
    const rc = img.getBoundingClientRect(); if (!img.naturalWidth) { r.push({ f: img.getAttribute('src'), ppi: 0 }); return; }
    const cover = getComputedStyle(img).objectFit === 'cover' && img.closest('.fig') && !img.closest('.fig--native');
    const sc = cover ? Math.max(rc.width / img.naturalWidth, rc.height / img.naturalHeight) : rc.width / img.naturalWidth;
    r.push({ f: img.getAttribute('src').split('/').pop(), ppi: Math.round(96 / sc) });
  });
  return r;
}));
fs.writeFileSync(path.join(here, 'previews', 'ppi-report.json'), JSON.stringify(rep, null, 1));
rep.forEach((r, i) => { const low = r.filter(x => x.ppi < 230); console.log(names[i], 'images', r.length, 'min ppi', Math.min(...r.map(x => x.ppi)), low.length ? 'LOW: ' + low.map(x => x.f + ' ' + x.ppi).join(', ') : ''); });
const boards = await p.$$('.board');
for (let i = 0; i < boards.length; i++) await boards[i].screenshot({ path: path.join(here, 'previews', names[i] + '.jpg'), type: 'jpeg', quality: 88 });
await b.close();
