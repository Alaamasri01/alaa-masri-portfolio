/*
 * مقاضي — Tamimi Markets weekly offers
 *
 *   node tools/maqadi/fetch-tamimi.mjs 2026-w48
 *
 * Reads the public "Weekly offers" listing on tamimimarkets.com (allowed by
 * the site's robots.txt; /api/ is not, and is not used), one page at a time
 * with a pause between requests, and writes the discounted items to
 *   tools/maqadi/weeks/<week>/tamimi/online.json
 * in the same shape the flyer transcriptions use, so build-data.mjs treats
 * both stores alike. Raw pages are kept in tools/maqadi/.cache/ (ignored by
 * git) so a rerun does not fetch them again.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = 'https://www.tamimimarkets.com/tag/Weekly%20Offers';
const PAUSE_MS = 2000;
const UA = 'Mozilla/5.0 (compatible; MaqadiPriceCheck/0.1)';

const sleep = ms => new Promise(done => setTimeout(done, ms));

/* The listing is server-rendered; its data sits in the page's streamed payload. */
export function readPage(html) {
  const chunks = [];
  const pattern = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
  let match;
  while ((match = pattern.exec(html))) chunks.push(JSON.parse('"' + match[1] + '"'));
  const text = chunks.join('');
  const start = text.indexOf('"initialProducts":[');
  if (start < 0) return null;
  let i = start + '"initialProducts":'.length;
  const from = i;
  let depth = 0, inString = false, escaped = false;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
    } else if (ch === '"') inString = true;
    else if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) break;
  }
  const products = JSON.parse(text.slice(from, i + 1));
  const total = /"totalPages":(\d+)/.exec(text.slice(i, i + 200));
  return { products, totalPages: total ? Number(total[1]) : null };
}

/* "6 x 200 ML" → { qty: 200, unit: 'ml', count: 6 }; "1.5 L" → { qty: 1.5, unit: 'l', count: 1 } */
export function parseSize(text) {
  const t = String(text || '').toUpperCase().replace(/\s+/g, ' ').trim();
  const units = { G: 'g', GM: 'g', GR: 'g', GRAM: 'g', GRAMS: 'g', KG: 'kg', ML: 'ml', L: 'l', LTR: 'l', LITRE: 'l', LITER: 'l', PC: 'pcs', PCS: 'pcs', PIECE: 'pcs', PIECES: 'pcs' };
  let m = /^(\d+)\s*[X×*]\s*(\d+(?:\.\d+)?)\s*([A-Z]+)$/.exec(t);
  if (m && units[m[3]]) return { qty: Number(m[2]), unit: units[m[3]], count: Number(m[1]) };
  m = /^(\d+(?:\.\d+)?)\s*([A-Z]+)\s*[X×*]\s*(\d+)$/.exec(t);
  if (m && units[m[2]]) return { qty: Number(m[1]), unit: units[m[2]], count: Number(m[3]) };
  m = /^(\d+(?:\.\d+)?)\s*([A-Z]+)$/.exec(t);
  if (m && units[m[2]]) return { qty: Number(m[1]), unit: units[m[2]], count: 1 };
  return null;
}

/* Store departments → the app's categories. Unknown ones fall to "other".
   The most specific level (parent category) is tried first, then the
   sub-department, then the department; the product name settles dairy. */
const VEG_NAME = /VEG|POTATO|ONION|TOMATO|CUCUMBER|PEPPER|CAPSICUM|GARLIC|LETTUCE|CARROT|EGGPLANT|ZUCCHINI|OKRA|HERB|PARSLEY|CORIANDER|MINT|LEMON|LIME|CABBAGE|CAULIFLOWER|BROCCOLI|SPINACH|BEANS|CORN|MUSHROOM/;
const AISLE_RULES = [
  [/CEREAL|GRANOLA|OATS|SPREAD|BREAKFAST/, 'breakfast_spreads'],
  [/CANDIES|CANDY|GUM|CHOCOLATE|SWEET|DATES|HONEY|JAM|CONFECTION/, 'dates_sweets'],
  [/CHIPS|NUTS|SNACK|BISCUIT|COOKIE|CRACKER|POPCORN/, 'snacks'],
  [/BAKING|FLOUR|SUGAR/, 'flour_baking'],
  [/RICE|GRAIN|BULGUR|FREEKEH/, 'rice_grains'],
  [/PASTA|NOODLE/, 'pasta_noodles'],
  [/OIL|GHEE/, 'oil_ghee'],
  [/OLIVE|PICKLE|CANNED|TINNED|CAN FOOD/, 'canned'],
  [/SAUCE|CONDIMENT|DRESSING|KETCHUP|MAYO|PASTE/, 'sauces_condiments'],
  [/SPICE|SEASON|STOCK|SALT/, 'spices'],
  [/PULSE|LEGUME|LENTIL|BEAN/, 'legumes_nuts'],
  [/WATER/, 'drinks_water'],
  [/TEA|COFFEE/, 'tea_coffee'],
  [/JUICE|DRINK|BEVERAGE|SOFT|SODA/, 'drinks_juice'],
  [/CLEAN|HOUSEHOLD|DETERGENT|TISSUE|PAPER|LAUNDRY|DISH|HOME|KITCHEN/, 'household'],
  [/BAKERY|BREAD|CROISSANT|CAKE/, 'bakery']
];
const up = text => String(text || '').toUpperCase();

export function categoryOf(product) {
  const dept = up(product.departmentName), sub = up(product.subDepartmentName), parent = up(product.parentCategoryName);
  const name = up(product.nameEn);
  const path = [dept, sub, parent].join(' / ');

  if (/HEALTH & BEAUTY/.test(dept)) return 'personal_care';
  if (/^BABY/.test(dept)) return 'baby';
  if (/BAKERY/.test(sub)) return 'bakery';
  if (/FRUIT|VEGETABLE/.test(sub)) return /VEGETABLE/.test(parent) ? 'produce_veg' : /FRUIT/.test(parent) ? 'produce_fruit' : (VEG_NAME.test(name) ? 'produce_veg' : 'produce_fruit');
  if (/FROZEN/.test(path)) return /CHICKEN|POULTRY/.test(path + ' ' + name) ? 'frozen_chicken' : (/VEG|PEAS|OKRA|MOLOKHIA|SPINACH|CORN|FRIES|POTATO/.test(path + ' ' + name) ? 'frozen_veg' : 'frozen_other');
  if (/POULTRY/.test(sub)) return 'poultry';
  if (/MEAT|BUTCHER/.test(sub) || /COLD CUT/.test(parent)) return 'meat';
  if (/SEAFOOD|FISH/.test(sub + ' ' + parent)) return 'fish';
  if (/EGG/.test(parent)) return 'eggs';
  if (/DAIRY|DELI/.test(sub)) {
    if (/DESSERT/.test(parent)) return 'snacks';
    if (/CHEESE/.test(name)) return 'dairy_cheese';
    if (/LABN|LABAN|YOG|YOGH/.test(name) || /YOG/.test(parent)) return 'dairy_yogurt_labneh';
    if (/BUTTER|CREAM|GHEE|QAIMAR|QASHTA/.test(name)) return 'butter_cream';
    if (/MILK/.test(name + ' ' + parent)) return 'dairy_milk';
    if (/CHEESE|LABNAH/.test(parent)) return 'dairy_cheese';
    if (/OLIVE|PICKLE/.test(parent)) return 'canned';
    if (/PASTA/.test(parent)) return 'pasta_noodles';
  }
  // "FOOD & BEVERAGES" names the whole grocery department, not drinks.
  for (const level of [parent, sub, /FOOD & BEVERAGE/.test(dept) ? '' : dept]) {
    for (const [pattern, category] of AISLE_RULES) if (level && pattern.test(level)) return category;
  }
  // Aisles such as "Organic food" mix everything: the product name decides.
  for (const [pattern, category] of AISLE_RULES) if (category !== 'household' && pattern.test(name)) return category;
  return 'other';
}

/* Not household shopping: pet supplies, toys and luggage stay out. */
export const outOfScope = product => /^PETS/.test(up(product.departmentName)) || /TOYS|LUGGAGE|TRAVEL/.test(up(product.subDepartmentName) + ' ' + up(product.parentCategoryName));

/* One offer per discounted variant, in the flyer-transcription shape. */
export function toOffers(products) {
  const offers = [];
  products.forEach(product => {
    if (outOfScope(product)) return;
    (product.variants || []).forEach(variant => {
      if (!variant.hasOffer || !(variant.oldPrice > variant.price) || !(variant.price > 0) || variant.isActive === false || variant.isDelete) return;
      const size = parseSize(variant.variantEn);
      offers.push({
        page: 1,
        source_id: variant.variantId,
        name_ar: product.nameAr || null,
        name_en: product.nameEn || null,
        brand: product.brandName || null,
        size_text: variant.variantEn || null,
        size_qty: size ? size.qty : null,
        size_unit: size ? size.unit : null,
        pack_count: size ? size.count : 1,
        sold_by: null,
        price: Math.round(variant.price * 100) / 100,
        was: Math.round(variant.oldPrice * 100) / 100,
        promo: null,
        note: null,
        category: categoryOf(product),
        in_stock: variant.inStock !== false,
        confidence: 'high'
      });
    });
  });
  return offers;
}

async function fetchPage(n, cacheDir) {
  const cached = join(cacheDir, `page-${n}.html`);
  if (existsSync(cached)) return readFileSync(cached, 'utf8');
  const response = await fetch(n === 1 ? BASE : `${BASE}?page=${n}`, { headers: { 'user-agent': UA, 'accept-language': 'ar,en;q=0.8' } });
  if (!response.ok) throw new Error(`page ${n}: HTTP ${response.status}`);
  const html = await response.text();
  writeFileSync(cached, html);
  await sleep(PAUSE_MS);
  return html;
}

async function main() {
  const week = (process.argv[2] || '').toLowerCase();
  if (!/^\d{4}-w\d{2}$/.test(week)) { console.error('usage: node tools/maqadi/fetch-tamimi.mjs 2026-w48'); process.exit(2); }
  const cacheDir = join(ROOT, 'tools/maqadi/.cache/tamimi', week);
  mkdirSync(cacheDir, { recursive: true });

  const first = readPage(await fetchPage(1, cacheDir));
  if (!first) throw new Error('page 1: no product data found — the site layout may have changed');
  const total = first.totalPages || 1;
  const products = first.products.slice();
  for (let n = 2; n <= total; n++) {
    const page = readPage(await fetchPage(n, cacheDir));
    if (!page) throw new Error(`page ${n}: no product data found`);
    products.push(...page.products);
    if (n % 20 === 0) console.log(`  ${n}/${total} pages`);
  }

  const seen = new Set();
  const offers = toOffers(products).filter(offer => !seen.has(offer.source_id) && seen.add(offer.source_id));
  const out = join(ROOT, 'tools/maqadi/weeks', week, 'tamimi', 'online.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(offers, null, 1) + '\n');
  const sized = offers.filter(offer => offer.size_qty).length;
  console.log(`tamimi: ${products.length} products on ${total} pages, ${offers.length} discounted variants (${sized} with a readable size) → ${out}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exit(1); });
}
