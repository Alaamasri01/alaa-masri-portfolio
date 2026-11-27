/*
 * مقاضي — Panda's full catalogue
 *
 *   node tools/maqadi/fetch-panda.mjs 2026-w48
 *
 * Reads panda.sa's public category pages (robots.txt allows them; /api/ is
 * not used) with a two-second pause between requests. The category list
 * comes from the site's own sitemap. Each category's first page tells
 * whether it is a leaf (all its products belong to it); only leaves are
 * read in full, so no product is fetched twice. Writes
 *   tools/maqadi/weeks/<week>/panda/catalogue.json
 * in the shape build-data.mjs reads. Raw pages are cached in
 * tools/maqadi/.cache/panda/<week>/ (ignored by git).
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pandaGtin } from './barcode.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const BASE = 'https://panda.sa';
const PAUSE_MS = 2000;
const PER_PAGE = 30;
const UA = 'Mozilla/5.0 (compatible; MaqadiPriceCheck/0.1)';
const sleep = ms => new Promise(done => setTimeout(done, ms));

function payload(html) {
  const chunks = [];
  const pattern = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
  let match;
  while ((match = pattern.exec(html))) chunks.push(JSON.parse('"' + match[1] + '"'));
  return chunks.join('');
}

/* Every `"products":[...]` array in the page's streamed payload. */
export function readPage(html) {
  const text = payload(html);
  const products = [];
  const key = '"products":[';
  let from = 0;
  for (;;) {
    const start = text.indexOf(key, from);
    if (start < 0) break;
    let i = start + key.length - 1;
    const open = i;
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
    try { JSON.parse(text.slice(open, i + 1)).forEach(item => { if (item && item.varieties) products.push(item); }); } catch (error) { /* not a product list */ }
    from = i;
  }
  const count = /"search_result_count":(\d+)/.exec(text);
  return { products, count: count ? Number(count[1]) : null };
}

/* "125 جرام", "1.8 كيلو جرام", "1 لتر", "6 حبات" → { qty, unit } */
const AR_UNITS = [
  [/^(كجم|كغ|كيلو ?جرام|كيلوجرام|كيلو غرام|كيلو)$/, 'kg'],
  [/^(جرام|جم|غرام|غ|جرامات)$/, 'g'],
  [/^(لتر|لترات|ل)$/, 'l'],
  [/^(مل|ملي|ملل|مليلتر|ملي لتر)$/, 'ml'],
  [/^(حبة|حبات|حبه|قطعة|قطع|عبوة|عبوات|كيس|اكياس|رول|لفة|ورقة|منديل|مناديل)$/, 'pcs']
];
export function parseArabicSize(size, unit) {
  const qty = Number(String(size || '').replace(',', '.'));
  const word = String(unit || '').trim().replace(/\s+/g, ' ');
  if (!(qty > 0) || !word) return null;
  for (const [pattern, code] of AR_UNITS) if (pattern.test(word)) return { qty, unit: code };
  return null;
}

/* Panda's size field often holds one piece of a multipack ("170 جرام" for
   "زبادي 6×170 جرام", or "6 قطع" for "سويس رول 6×55 جم"). When the name
   spells N×size and one of its numbers is the size field, the pack is
   counted whole; when they disagree, the store's own field is kept. */
const NAME_UNITS = [
  [/^(كجم|كغ|كيلو|kg)$/i, 'kg'], [/^(جرام|غرام|جم|غم|غ|gm|g)$/i, 'g'],
  [/^(ملل|مل|ml)$/i, 'ml'], [/^(لتر|ل|l)$/i, 'l']
];
const UNIT_AR = { g: 'جرام', kg: 'كجم', ml: 'مل', l: 'لتر' };
const NAME_BASE = { g: 1, kg: 1000, ml: 1, l: 1000 };
export function packFromName(name, size) {
  const text = String(name || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g, '.');
  const match = /(\d+(?:\.\d+)?)\s*[×xX*]\s*(\d+(?:\.\d+)?)\s*(كجم|كغ|كيلو|جرام|غرام|جم|غم|غ|ملل|مل|لتر|ل|kg|gm|g|ml|l)(?![\p{L}\d])/iu.exec(text);
  if (!match || !size) return null;
  const unit = (NAME_UNITS.find(([pattern]) => pattern.test(match[3])) || [])[1];
  const [a, b] = [Number(match[1]), Number(match[2])];
  // The label keeps the name's own order; only the total matters for prices and quantities.
  const pack = (count, qty) => (Number.isInteger(count) && count > 1 && count <= 96 ? { count, qty, unit, text: `${a}×${b} ${UNIT_AR[unit]}` } : null);
  if (size.unit === 'pcs') return size.qty === a ? pack(a, b) : size.qty === b ? pack(b, a) : null;
  if (!NAME_BASE[size.unit] || !unit) return null;
  const mass = u => u === 'g' || u === 'kg';
  if (mass(size.unit) !== mass(unit)) return null;
  const field = size.qty * NAME_BASE[size.unit];
  if (field === b * NAME_BASE[unit]) return pack(a, b);
  if (field === a * NAME_BASE[unit]) return pack(b, a);
  return null;
}

/* Aisles that are not household shopping stay out. */
export const OUT_OF_SCOPE = /^(cat|dogs|pets-care|electronics|televisions|mobiles-and-tablets|computing|headphones-and-wearables|toys|luggage|stationary|camping)-\d+$/;

/* Panda's aisles, by the words of their slug, in order; the product's Arabic
   name settles mixed aisles (dairy, meat and poultry, produce). */
const has = (pattern, name) => pattern.test(String(name || ''));
const SLUG_RULES = [
  [/fruits-and-vegetables|fruits-cuts|salad-cuts/, name => (VEG_AR.test(name) ? 'produce_veg' : 'produce_fruit')],
  [/french-fries/, () => 'frozen_veg'],
  [/ice-creams|pizza-pastries|^frozen/, name => (has(/دجاج|ناجتس|برجر دجاج/, name) ? 'frozen_chicken' : has(/خضار|بازلاء|بامي|ملوخي|ذرة|سبانخ|فاصوليا/, name) ? 'frozen_veg' : 'frozen_other')],
  [/meat-and-poultry/, name => (has(/دجاج|فروج|صدور|افخاذ|أفخاذ|اجنحة|أجنحة|ديك رومي|حبش|تشكن/, name) ? 'poultry' : 'meat')],
  [/fish-and-seafood/, () => 'fish'],
  [/cheese-and-labneh/, name => (has(/لبن/, name) ? 'dairy_yogurt_labneh' : 'dairy_cheese')],
  [/dairy-and-eggs|long-life-milk/, name => (has(/بيض/, name) ? 'eggs' : has(/جبن/, name) ? 'dairy_cheese' : has(/لبنة|لبنه|لبن|زبادي|روب/, name) ? 'dairy_yogurt_labneh' : has(/زبدة|زبده|قشطة|قشطه|كريمة|كريمه|قيمر/, name) ? 'butter_cream' : 'dairy_milk')],
  [/^deli/, name => (has(/جبن|لبنة/, name) ? 'dairy_cheese' : has(/زيتون|مخلل/, name) ? 'canned' : 'meat')],
  [/bakery|breads|croissants|donuts|desserts-and-cakes|rusks|ready-to-bake|sandwiches/, () => 'bakery'],
  [/rice-and-grains/, () => 'rice_grains'],
  [/pasta-and-noodles/, () => 'pasta_noodles'],
  [/oil-and-ghee/, () => 'oil_ghee'],
  [/sugar-and-sweeteners|home-baking/, () => 'flour_baking'],
  [/tinned-cans|olives-and-pickles|^soup/, () => 'canned'],
  [/sauce-marinades|cooking-ingredients|cooking-essentials|food-basics/, name => (
    has(/عدس|حمص|فول|فاصوليا|لوبيا|بقول|ترمس/, name) ? 'legumes_nuts'
      : has(/أرز|ارز|برغل|جريش|قمح|شوفان|كينوا/, name) ? 'rice_grains'
        : has(/سكر|طحين|دقيق|خميرة|نشا/, name) ? 'flour_baking'
          : has(/زيت|سمن/, name) ? 'oil_ghee'
            : has(/بهار|ملح|كمون|كركم|فلفل اسود|فلفل أسود|مرقة|مكعبات|توابل/, name) ? 'spices' : 'sauces_condiments')],
  [/breakfast|cereal|jams-and-spreads|honey/, () => 'breakfast_spreads'],
  [/^dates/, () => 'dates_sweets'],
  [/dried-fruits-nuts|nuts-and-dried/, () => 'legumes_nuts'],
  [/chocolate|candies|candy|mints-and-gums|^desserts/, () => 'dates_sweets'],
  [/biscuits|chips|popcorn|snacks/, () => 'snacks'],
  [/still-water|sparkling-water|premium-water|^water/, () => 'drinks_water'],
  [/coffee|tea-and-herbal/, () => 'tea_coffee'],
  [/beverages|carbonated|juices|energy-drinks|coconut-water|flavored-water/, () => 'drinks_juice'],
  [/cleaning|laundry|dishwashing|air-freshener|pest-control|tissues|toilet-roll|kitchen-roll|disposables|household|brushes|kitchen-essentials|houseware/, () => 'household'],
  [/baby|diapers/, () => 'baby'],
  [/personal-care|beauty|body-care|hair-care|oral-care|shower|skin-care|perfumes|health-and-wellness|pharmaceutical|accessories/, () => 'personal_care']
];
export function categoryFromSlug(slug, name) {
  const bare = String(slug || '').replace(/-\d+$/, '');
  for (const [pattern, pick] of SLUG_RULES) if (pattern.test(bare)) return pick(String(name || ''));
  return 'other';
}
const VEG_AR = /بصل|ثوم|طماطم|خيار|بطاطس|بطاطا|فلفل|جزر|خس|كوس|باذنجان|زنجبيل|بقدونس|كزبر|نعناع|جرجير|بروكلي|زهر|ملفوف|كرنب|فاصوليا|بامي|سبانخ|ملوخي|فطر|ليمون|شمندر|لفت|فجل|كرفس|ذره|ذرة|قرع|شبت|كراث/;

/* The frozen department reuses aisle names ("fruits-and-vegetables" twice),
   so a product's parent category decides between fresh and frozen. */
export const FROZEN_PARENT = 211;
export function frozenCategory(slug, name) {
  if (/fish/.test(slug)) return 'fish';
  if (/french-fries/.test(slug)) return 'frozen_veg';
  if (/fruits-and-vegetables/.test(slug)) return VEG_AR.test(name) || has(/خضار|خضروات|بازلاء|بازيلا|بطاطس|بطاطا/, name) ? 'frozen_veg' : 'frozen_other';
  if (/meat-and-poultry/.test(slug) && has(/دجاج|فروج|ناجتس|تشكن|صدور|افخاذ|أفخاذ|اجنحة|أجنحة/, name)) return 'frozen_chicken';
  return 'frozen_other';
}

/* One entry per variety, in the shape the flyer transcriptions use. */
/* The listing links the 120 px thumbnail; the 600 px picture beside it is
   still small (about 11 KB) and stays sharp on a phone screen. */
export function pandaImage(url) {
  if (!url || !/^https:\/\/images\.todoorstep\.com\//.test(url)) return null;
  return url.replace(/\?t=$/, '').replace(/_small\.jpg/, '.jpg');
}

export function toOffers(products, slug) {
  const offers = [];
  products.forEach(product => {
    (product.varieties || []).forEach(variety => {
      const price = Number(variety.price);
      if (!(price > 0)) return;
      const before = Number(variety.undiscounted_price);
      const weighted = Boolean(variety.wighted);
      const field = weighted ? null : parseArabicSize(variety.size, variety.unit);
      const pack = weighted ? null : packFromName(product.name, field);
      const size = pack ? { qty: pack.qty, unit: pack.unit } : field;
      const label = weighted ? 'للكيلو' : pack ? pack.text : [variety.size, variety.unit].filter(Boolean).join(' ').trim() || null;
      offers.push({
        page: 1,
        source_id: String(variety.id),
        name_ar: (product.name || variety.description || '').trim() || null,
        name_en: null,
        brand: product.brand && product.brand.name ? product.brand.name : null,
        size_text: label,
        size_qty: weighted ? 1 : (size ? size.qty : null),
        size_unit: weighted ? 'kg' : (size ? size.unit : null),
        pack_count: pack ? pack.count : 1,
        sold_by: weighted ? 'kg' : null,
        price: Math.round(price * 100) / 100,
        was: before > price ? Math.round(before * 100) / 100 : null,
        promo: null,
        note: null,
        category: product.category && product.category.parent === FROZEN_PARENT ? frozenCategory(slug, product.name) : categoryFromSlug(slug, product.name),
        barcode: pandaGtin(variety.barcode),
        image: pandaImage(variety.imageURL),
        confidence: 'high'
      });
    });
  });
  return offers;
}

async function get(url, cacheFile) {
  if (existsSync(cacheFile)) return readFileSync(cacheFile, 'utf8');
  const response = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'ar' } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const text = await response.text();
  writeFileSync(cacheFile, text);
  await sleep(PAUSE_MS);
  return text;
}

async function main() {
  const week = (process.argv[2] || '').toLowerCase();
  if (!/^\d{4}-w\d{2}$/.test(week)) { console.error('usage: node tools/maqadi/fetch-panda.mjs 2026-w48'); process.exit(2); }
  const cache = join(ROOT, 'tools/maqadi/.cache/panda', week);
  mkdirSync(cache, { recursive: true });

  const sitemap = await get(`${BASE}/sitemaps/pages.xml`, join(cache, 'pages.xml'));
  const categories = [...new Set([...sitemap.matchAll(/<loc>https:\/\/panda\.sa\/ar\/c\/([^<]+)<\/loc>/g)].map(m => m[1]))];
  if (!categories.length) throw new Error('no categories in the sitemap — the site layout may have changed');

  const seen = new Set();
  const offers = [];
  let leaves = 0, requests = 0;
  for (const slug of categories) {
    if (OUT_OF_SCOPE.test(slug)) continue;
    const id = Number(/-(\d+)$/.exec(slug)[1]);
    const first = readPage(await get(`${BASE}/ar/c/${slug}`, join(cache, `${slug}-1.html`)));
    requests++;
    if (!first.products.length) continue;
    const leaf = first.products.every(product => product.category_id === id);
    if (!leaf) continue;
    leaves++;
    const pages = Math.ceil((first.count || first.products.length) / PER_PAGE);
    const all = first.products.slice();
    for (let n = 2; n <= pages; n++) {
      all.push(...readPage(await get(`${BASE}/ar/c/${slug}?page=${n}`, join(cache, `${slug}-${n}.html`))).products);
      requests++;
    }
    toOffers(all, slug).forEach(offer => {
      if (seen.has(offer.source_id)) return;
      seen.add(offer.source_id);
      offers.push(offer);
    });
    if (leaves % 10 === 0) console.log(`  ${leaves} aisles, ${offers.length} products so far`);
  }

  const out = join(ROOT, 'tools/maqadi/weeks', week, 'panda', 'catalogue.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(offers, null, 1) + '\n');
  const discounted = offers.filter(offer => offer.was).length;
  const barcoded = offers.filter(offer => offer.barcode).length;
  console.log(`panda: ${categories.length} categories, ${leaves} aisles read in ${requests} pages → ${offers.length} products, ${discounted} discounted, ${barcoded} with a barcode → ${out}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exit(1); });
}
