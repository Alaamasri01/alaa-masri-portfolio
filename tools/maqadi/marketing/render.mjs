/*
 * مقاضي — store screenshots and a social post, from the app itself
 *
 *   node tools/maqadi/marketing/render.mjs [out-dir]
 *
 * Serves the repository on a local port, photographs four screens of the
 * real app with this week's data (home, the receipt, a story, Ramadan),
 * and lays them out as:
 *   appstore-1..4.png   1290×2796 (App Store, 6.7-inch iPhone)
 *   play-1..4.png       1080×2160 (Google Play, no more than 2:1)
 *   post.png            1080×1080 (social media), with the week's real total
 * Needs Playwright with Chromium (it is in the cloud sessions).
 */
import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { buildList } from '../../../maqadi/lib/plan.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = resolve(process.argv[2] || join(ROOT, 'tools/maqadi/marketing/out'));
const { chromium } = createRequire(import.meta.url)('playwright');

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.jpg': 'image/jpeg', '.wasm': 'application/wasm' };
const server = createServer(async (req, res) => {
  const asked = join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const path = asked.endsWith('/') ? join(asked, 'index.html') : asked;
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] || 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const APP = `http://127.0.0.1:${server.address().port}/maqadi/`;

// This week's real numbers for the post.
const current = JSON.parse(readFileSync(join(ROOT, 'maqadi/data/current.json'), 'utf8'));
const plans = JSON.parse(readFileSync(join(ROOT, 'maqadi/data', current.plans), 'utf8'));
const offers = new Map(JSON.parse(readFileSync(join(ROOT, 'maqadi/data', current.offers), 'utf8')).offers.map(offer => [offer.id, offer]));
const totals = plans.stores.map(id => {
  const plan = plans.by_store[id].plans[0];
  return { id, plan, cost: buildList({ plan, offers, persons: plans.by_store[id].base_persons }).totals.cost };
}).sort((a, b) => a.cost - b.cost);
const cheapest = totals[0];
const lead = totals.length > 1 ? totals[1].cost - cheapest.cost : 0;
const NAMES = { panda: 'بنده', tamimi: 'التميمي', othaim: 'العثيم' };

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();

// 1. The app's screens, at 3× like a phone.
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'ar-SA', timezoneId: 'Asia/Riyadh', isMobile: true, hasTouch: true });
await phone.addInitScript(store => localStorage.setItem('maqadi:v1', JSON.stringify({ welcomed: true, scanTipSeen: true, store, persons: 4, lang: 'ar' })), cheapest.id);
const page = await phone.newPage();
const shots = {};
const shoot = async (name, hash, ready, query = '') => {
  await page.goto(APP + query + hash, { waitUntil: 'networkidle' });
  await page.waitForSelector(ready);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1600);
  shots[name] = 'data:image/png;base64,' + (await page.screenshot()).toString('base64');
};
await shoot('home', '#/home', '.rings');
await shoot('list', '#/list', '.receipt__stamp');
await shoot('story', '#/story/0', '.story__deal');
await shoot('ramadan', '#/home', '.ramadan-today', '?ramadan=during');
await phone.close();

// 2. The panels.
const font = readFileSync(join(ROOT, 'maqadi/fonts/readex-pro-arabic.woff2')).toString('base64');
const latin = readFileSync(join(ROOT, 'maqadi/fonts/readex-pro-latin.woff2')).toString('base64');
const logo = 'data:image/svg+xml;base64,' + readFileSync(join(ROOT, 'maqadi/icons/logo.svg')).toString('base64');
const photo = id => (existsSync(join(ROOT, 'maqadi/meals', id + '.webp')) ? 'data:image/webp;base64,' + readFileSync(join(ROOT, 'maqadi/meals', id + '.webp')).toString('base64') : null);
const style = `
@font-face{font-family:R;src:url(data:font/woff2;base64,${font}) format("woff2");font-weight:200 700}
@font-face{font-family:R;src:url(data:font/woff2;base64,${latin}) format("woff2");font-weight:200 700;unicode-range:U+0000-00FF,U+2212}
*{box-sizing:border-box;margin:0}body{font-family:R,sans-serif;color:#fff;direction:rtl}
.num{direction:ltr;unicode-bidi:isolate}`;
const PANELS = [
  { shot: 'home', bg: 'radial-gradient(120% 80% at 80% 0%,#25b873,#0b6e45 50%,#053d26)', title: 'اعرف كم ستدفع<br><em>قبل أن تذهب</em>', sub: 'طبخات الأسبوع وقائمتها بأسعار المتاجر', em: '#ffb020' },
  { shot: 'list', bg: 'radial-gradient(120% 80% at 80% 0%,#2a3a33,#111b16 60%)', title: 'نفس القائمة<br><em>في كل متجر</em>', sub: 'صنفاً صنفاً، والأرخص معلَّم', em: '#ffb020' },
  { shot: 'story', bg: 'radial-gradient(120% 80% at 80% 0%,#ffc56b,#f39a2b 45%,#c2501a)', title: 'طبخة كل يوم<br><em>مع عرضها</em>', sub: 'بدّلها بلمسة، والسلة تتحدّث فوراً', em: '#3b1500' },
  { shot: 'ramadan', bg: 'radial-gradient(120% 90% at 85% 0%,#3d3a8c 0%,#24235e 45%,#141339 100%)', title: 'سفرة رمضان<br><em>فطور وسحور</em>', sub: 'ومقاضي رمضان الكبيرة قبله بأسبوعين', em: '#ffd678' }
];
const panel = (p, w, h) => {
  const k = w / 1290; // everything is laid out for 1290 wide
  const phoneW = 900 * k;
  const top = Math.max(560 * k, h - phoneW * 2.165 - 40 * k);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${style}
  body{width:${w}px;height:${h}px;overflow:hidden;background:${p.bg};position:relative}
  h1{position:absolute;top:${150 * k}px;inset-inline:${80 * k}px;text-align:center;font-size:${118 * k}px;line-height:1.2;font-weight:700}
  h1 em{font-style:normal;color:${p.em}}
  p{position:absolute;top:${470 * k}px;inset-inline:${80 * k}px;text-align:center;font-size:${54 * k}px;opacity:.88}
  .ph{position:absolute;top:${top}px;left:50%;transform:translateX(-50%);width:${phoneW}px;padding:${26 * k}px;border-radius:${130 * k}px;background:#0c0f0d;box-shadow:0 ${60 * k}px ${120 * k}px -${40 * k}px rgba(0,0,0,.6)}
  .ph img{display:block;width:100%;border-radius:${106 * k}px}
  </style></head><body><h1>${p.title}</h1><p>${p.sub}</p><div class="ph"><img src="${shots[p.shot]}"></div></body></html>`;
};
const sized = await browser.newPage();
for (const [prefix, w, h] of [['appstore', 1290, 2796], ['play', 1080, 2160]]) {
  for (const [at, p] of PANELS.entries()) {
    await sized.setViewportSize({ width: w, height: h });
    await sized.setContent(panel(p, w, h), { waitUntil: 'load' });
    await sized.evaluate(() => document.fonts.ready);
    await sized.screenshot({ path: join(OUT, `${prefix}-${at + 1}.png`) });
  }
}

// 3. The post: the cheapest store's week, with the real total and lead.
const dishes = cheapest.plan.meals.map(meal => photo(meal.id)).filter(Boolean);
const big = dishes[0];
const riyals = Math.floor(cheapest.cost / 100);
await sized.setViewportSize({ width: 1080, height: 1080 });
await sized.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${style}
  .card{position:relative;width:1080px;height:1080px;overflow:hidden;background:radial-gradient(120% 80% at 80% 0%,#25b873,#0b6e45 50%,#053d26)}
  .logo{position:absolute;top:60px;right:60px;display:flex;align-items:center;gap:20px;font-size:52px;font-weight:700}.logo img{width:84px;height:84px;border-radius:24px}
  .k{position:absolute;top:190px;right:60px;font-size:44px;opacity:.9}
  .n{position:absolute;top:250px;right:60px;font-size:190px;font-weight:700;line-height:1}.n small{font-size:58px;margin-inline-start:14px}
  .s{position:absolute;top:470px;right:60px;font-size:40px;opacity:.9}
  .big{position:absolute;bottom:-80px;left:-60px;width:520px;height:520px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 14px rgba(255,255,255,.92),0 40px 80px -20px rgba(0,0,0,.6)}
  .big img{width:100%;height:100%;object-fit:cover}
  .chip{position:absolute;bottom:70px;right:60px;max-width:520px;background:#ffb020;color:#3b2a00;border-radius:36px;padding:24px 32px;font-size:40px;font-weight:700;line-height:1.35}
  </style></head><body><div class="card">
  <div class="logo"><img src="${logo}">مقاضي</div>
  <p class="k">سفرة أسبوع كاملة لـ ${plans.by_store[cheapest.id].base_persons} أفراد</p>
  <p class="n"><span class="num">${riyals}</span><small>ريال</small></p>
  <p class="s">${cheapest.plan.meals.length} طبخات + الفطور والعشاء · ${NAMES[cheapest.id] || cheapest.id}، هذا الأسبوع</p>
  ${big ? `<div class="big"><img src="${big}"></div>` : ''}
  ${lead > 0 ? `<p class="chip">و${NAMES[cheapest.id] || cheapest.id} أرخص من ${NAMES[totals[1].id] || totals[1].id} بـ <span class="num">${(lead / 100).toFixed(2)}</span> ريال</p>` : ''}
  </div></body></html>`, { waitUntil: 'load' });
await sized.evaluate(() => document.fonts.ready);
await sized.screenshot({ path: join(OUT, 'post.png') });

await browser.close();
server.close();
console.log(`written to ${OUT}: appstore-1..4.png, play-1..4.png, post.png (${NAMES[cheapest.id]} ${(cheapest.cost / 100).toFixed(2)} SAR, lead ${(lead / 100).toFixed(2)})`);
