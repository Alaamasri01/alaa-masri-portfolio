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
import { canonicalGtin } from './barcode.mjs';

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
  let t = String(text || '').toUpperCase().replace(/\s+/g, ' ').trim();
  // "6 pcs - 240g": the count is what a recipe buys by.
  const counted = /^(\d+)\s*PCS?\b\s*-/.exec(t);
  if (counted) return { qty: Number(counted[1]), unit: 'pcs', count: 1 };
  // Imported goods are sized in ounces.
  t = t.replace(/(\d+(?:\.\d+)?)\s*OZ\b/, (all, n) => String(Math.round(Number(n) * 28.35)) + 'G');
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
  if (/CANNED|PACKED/.test(sub)) {
    if (/CREAM/.test(name)) return 'butter_cream';
    if (/LABN/.test(parent + ' ' + name)) return 'dairy_yogurt_labneh';
    if (/CREAM/.test(parent)) return 'butter_cream';
    if (/VEGETABLE|BEAN|TOMATO|FRUIT/.test(parent)) return 'canned';
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

/* One entry per variant, in the flyer-transcription shape. Discounted
   variants carry the old price in `was`; the rest are regular prices, used
   to cost the meal plans but never shown as offers. */
export function toOffers(products) {
  const offers = [];
  products.forEach(product => {
    if (outOfScope(product)) return;
    (product.variants || []).forEach(variant => {
      if (!(variant.price > 0) || variant.isActive === false || variant.isDelete) return;
      const discounted = Boolean(variant.hasOffer) && variant.oldPrice > variant.price;
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
        was: discounted ? Math.round(variant.oldPrice * 100) / 100 : null,
        promo: null,
        note: null,
        category: categoryOf(product),
        barcode: allBarcodes(variant.barcodes)[0] || null,
        barcodes: allBarcodes(variant.barcodes),
        image: tamimiImage(variant.images, product.images),
        in_stock: variant.inStock !== false,
        confidence: 'high'
      });
    });
  });
  return offers;
}

/* The variant's own picture, else the product's: the first one is the pack front. */
export function tamimiImage(...lists) {
  for (const list of lists) {
    const url = (list || []).find(item => typeof item === 'string' && /^https:\/\/ecommedia\.tamimimarkets\.com\//.test(item));
    if (url) return url;
  }
  return null;
}

/* A variant often lists several codes (a new pack, the single inside a
   multipack); every valid one is kept so another store's code can meet it. */
export const allBarcodes = codes => Array.from(new Set((codes || []).map(canonicalGtin).filter(Boolean)));

/* Fresh produce is not in the weekly listing, so it is read from single product pages. */
const PRODUCE_AR = [
  ['sweet potato', 'بطاطا حلوة'], ['potato', 'بطاطس'], ['tomato', 'طماطم'], ['onion', 'بصل'], ['cucumber', 'خيار'],
  ['garlic', 'ثوم'], ['lemon', 'ليمون'], ['lime', 'ليمون أخضر'], ['carrot', 'جزر'], ['lettuce', 'خس'], ['cabbage', 'ملفوف'],
  ['cauliflower', 'قرنبيط'], ['broccoli', 'بروكلي'], ['eggplant', 'باذنجان'], ['aubergine', 'باذنجان'], ['zucchini', 'كوسا'],
  ['capsicum', 'فلفل رومي'], ['bell pepper', 'فلفل رومي'], ['chili', 'فلفل حار'], ['chilli', 'فلفل حار'], ['pepper', 'فلفل'],
  ['parsley', 'بقدونس'], ['coriander', 'كزبرة'], ['mint', 'نعناع'], ['dill', 'شبت'], ['spinach', 'سبانخ'], ['okra', 'بامية'],
  ['beans', 'فاصوليا'], ['peas', 'بازلاء'], ['mushroom', 'فطر'], ['ginger', 'زنجبيل'], ['beetroot', 'شمندر'], ['radish', 'فجل'],
  ['celery', 'كرفس'], ['leek', 'كراث'], ['corn', 'ذرة'], ['apple', 'تفاح'], ['banana', 'موز'], ['mandarin', 'يوسفي'],
  ['orange', 'برتقال'], ['grapefruit', 'جريب فروت'], ['grape', 'عنب'], ['mango', 'مانجو'], ['kiwi', 'كيوي'], ['pear', 'كمثرى'],
  ['peach', 'خوخ'], ['plum', 'برقوق'], ['apricot', 'مشمش'], ['watermelon', 'بطيخ'], ['melon', 'شمام'], ['strawberr', 'فراولة'],
  ['pomegranate', 'رمان'], ['avocado', 'أفوكادو'], ['pineapple', 'أناناس'], ['papaya', 'بابايا'], ['guava', 'جوافة'],
  ['blueberr', 'توت أزرق'], ['raspberr', 'توت أحمر'], ['cherr', 'كرز'], ['coconut', 'جوز هند'], ['fig', 'تين'], ['rocket', 'جرجير'],
  ['arugula', 'جرجير'], ['jarjeer', 'جرجير'], ['molokhia', 'ملوخية'], ['pumpkin', 'قرع'], ['turnip', 'لفت']
];
const COLOURS_AR = [['red', 'أحمر'], ['white', 'أبيض'], ['green', 'أخضر'], ['yellow', 'أصفر'], ['local', 'محلي']];
export function produceArabic(nameEn) {
  const lower = String(nameEn || '').toLowerCase();
  const hit = PRODUCE_AR.find(([word]) => lower.includes(word));
  if (!hit) return null;
  const colour = COLOURS_AR.filter(([word]) => new RegExp('\\b' + word + '\\b').test(lower)).map(([, ar]) => ar);
  return [hit[1]].concat(colour).join(' ');
}
// Produce pages are named after the produce, maybe after an origin or a colour: "onion-white-500-g", "fresh-garlic-500-g".
const PRODUCE_SLUG = new RegExp('^(?:(?:fresh|local|organic|baby|mini|red|green|yellow|white|sweet|black|golden|seedless|large|small|jumbo|egyptian|saudi|indian|african|spanish|turkish|lebanese|jordanian|iranian|chinese|american|australian|kenyan|imported)-)*(?:' + PRODUCE_AR.map(([word]) => word.replace(' ', '-')).join('|') + ')');
const PROCESSED_SLUG = /chip|crisp|ring|powder|paste|sauce|ketchup|juice|soup|pickle|dried|flake|salad|soap|shampoo|lotion|oil|cream|cheese|biscuit|cake|bread|candy|drink|tea|spice|season|granul|frozen|fries|wedge|puree|jam|mayo|dip|hummus|vinegar|salt|chutney|relish|pesto|wash|scrub|deodor|body|hair|mask|clean|detergent|syrup|flavo|mix|litter|water|jelly|curry|shrimp|chicken|beef|tuna|salmon|tablet|lemonade|smoothie|yogurt|yoghurt|ice|sorbet|bar|cereal|muesli|granola|cookie|wafer|pie|pasta|noodle|rice|makdous|stuffed|canned|tin|nectar|cordial|squash|essence|extract|perfume|scent|candle|air|sparkling|soda|cola/;

export function readProductPage(html) {
  const chunks = [];
  const pattern = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
  let match;
  while ((match = pattern.exec(html))) chunks.push(JSON.parse('"' + match[1] + '"'));
  const text = chunks.join('');
  const start = text.indexOf('"variants":[{"variantId"');
  if (start < 0) return null;
  let i = start + '"variants":'.length;
  const from = i;
  let depth = 0, inString = false, escaped = false;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inString) { if (escaped) escaped = false; else if (ch === '\\') escaped = true; else if (ch === '"') inString = false; }
    else if (ch === '"') inString = true;
    else if (ch === '[') depth++;
    else if (ch === ']' && --depth === 0) break;
  }
  const variants = JSON.parse(text.slice(from, i + 1));
  const name = /\{"name":"([^"]+)","url":"\/products\/[^"]+","variantId":"[^"]+","articleNumber":"([^"]+)"\}/.exec(text);
  const crumbs = [...html.matchAll(/"@type":"ListItem","position":\d+,"name":"([^"]+)"/g)].map(m => m[1]);
  return { name: name ? name[1] : null, article: name ? name[2] : null, variants, crumbs };
}

export function produceOffers(page) {
  if (!page || !page.name || !/FRUITS & VEGETABLES/.test(page.crumbs.join(' / '))) return [];
  const vegetable = /VEGETABLE/.test(page.crumbs[2] || '');
  return page.variants.filter(v => v.price > 0).map(v => {
    const size = parseSize(v.label || v.unit);
    const discounted = v.oldPrice > v.price;
    return {
      page: 1,
      source_id: v.variantId,
      article: page.article,
      name_ar: produceArabic(page.name) || page.name,
      name_en: page.name,
      brand: null,
      size_text: v.label || null,
      size_qty: size ? size.qty : null,
      size_unit: size ? size.unit : null,
      pack_count: size ? size.count : 1,
      sold_by: null,
      price: Math.round(v.price * 100) / 100,
      was: discounted ? Math.round(v.oldPrice * 100) / 100 : null,
      promo: null,
      note: null,
      category: vegetable ? 'produce_veg' : 'produce_fruit',
      barcode: null,
      image: tamimiImage(v.images),
      in_stock: v.inStock !== false,
      confidence: 'high'
    };
  });
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

  // Fresh produce from single product pages, found by name in the store's sitemap.
  const listed = new Set(products.map(product => String(product.productId)));
  const urls = [];
  for (let n = 0; n < 40; n++) {
    const cached = join(cacheDir, `sitemap-${n}.xml`);
    let xml;
    if (existsSync(cached)) xml = readFileSync(cached, 'utf8');
    else {
      const response = await fetch(`https://www.tamimimarkets.com/sitemaps/products-${n}.xml`, { headers: { 'user-agent': UA } });
      if (!response.ok) break;
      xml = await response.text();
      writeFileSync(cached, xml);
      await sleep(PAUSE_MS);
    }
    if (!xml.includes('<loc>')) break;
    urls.push(...[...xml.matchAll(/<loc>(https:\/\/www\.tamimimarkets\.com\/products\/[^<]+)<\/loc>/g)].map(m => m[1]));
  }
  const byArticle = new Map();
  urls.forEach(url => {
    const slug = url.split('/products/')[1];
    const article = (/-(\d+)$/.exec(slug) || [])[1];
    if (!article || listed.has(article) || byArticle.has(article)) return;
    if (!PRODUCE_SLUG.test(slug) || PROCESSED_SLUG.test(slug)) return;
    byArticle.set(article, url);
  });
  let produce = 0;
  for (const [article, url] of byArticle) {
    const cached = join(cacheDir, `product-${article}.html`);
    let html;
    if (existsSync(cached)) html = readFileSync(cached, 'utf8');
    else {
      const response = await fetch(url, { headers: { 'user-agent': UA } });
      if (!response.ok) continue;
      html = await response.text();
      writeFileSync(cached, html);
      await sleep(PAUSE_MS);
    }
    produceOffers(readProductPage(html)).forEach(offer => {
      if (seen.has(offer.source_id)) return;
      seen.add(offer.source_id);
      offers.push(offer);
      produce++;
    });
  }
  console.log(`  produce: ${byArticle.size} candidate pages, ${produce} fresh fruit and vegetable prices`);
  const out = join(ROOT, 'tools/maqadi/weeks', week, 'tamimi', 'online.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(offers, null, 1) + '\n');
  const sized = offers.filter(offer => offer.size_qty).length;
  const discounted = offers.filter(offer => offer.was).length;
  console.log(`tamimi: ${products.length} products on ${total} pages → ${offers.length} priced variants, ${discounted} discounted, ${sized} with a readable size → ${out}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exit(1); });
}
