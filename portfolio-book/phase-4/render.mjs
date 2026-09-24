// Renders each approval board to a JPG preview and combines them into a
// review PDF (screen review only — not the portfolio PDF).
// Usage: node render.mjs
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = execSync('npm root -g').toString().trim();
const { chromium } = require(path.join(globalRoot, 'playwright'));

const here = path.dirname(fileURLToPath(import.meta.url));
const names = ['00-system', '01-cover-option-1', '02-cover-option-2', '03-profile', '04-light-opener', '05-dark-opener', '06-image-spread', '07-expertise-technical', '08-contact-back-cover'];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1900, height: 1200 }, deviceScaleFactor: 2 });
await page.goto('file://' + path.join(here, 'approval.html'));
await page.evaluate(() => document.fonts.ready);
await page.waitForLoadState('networkidle');
const boards = await page.$$('.board');
for (let i = 0; i < boards.length; i++) {
  await boards[i].screenshot({ path: path.join(here, 'previews', `${names[i] || i}.jpg`), type: 'jpeg', quality: 90 });
}
await browser.close();
console.log(`${boards.length} boards`);
