// Renders each presentation board of a concept to a JPG preview.
// Usage: node render.mjs a [b c]
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const globalRoot = execSync('npm root -g').toString().trim();
const { chromium } = require(path.join(globalRoot, 'playwright'));

const here = path.dirname(fileURLToPath(import.meta.url));
const concepts = process.argv.slice(2).length ? process.argv.slice(2) : ['a', 'b', 'c'];
const names = ['00-system', 'A-cover', 'B-intro-profile', 'C-project-opener', 'D-image-spread', 'E-mixed-spread', 'F-expertise-technical', 'G-contact-back'];

const browser = await chromium.launch();
for (const c of concepts) {
  const page = await browser.newPage({ viewport: { width: 1800, height: 1200 }, deviceScaleFactor: 2 });
  await page.goto('file://' + path.join(here, `concept-${c}.html`));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  const boards = await page.$$('.board');
  for (let i = 0; i < boards.length; i++) {
    await boards[i].screenshot({ path: path.join(here, 'previews', `concept-${c}-${names[i] || i}.jpg`), type: 'jpeg', quality: 90 });
  }
  await page.close();
  console.log(`concept ${c}: ${boards.length} boards`);
}
await browser.close();
