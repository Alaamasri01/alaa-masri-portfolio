/*
 * مقاضي — منطق الحساب
 * Pure functions: turn a weekly meal plan and the week's offers into a
 * shopping list with exact costs. No DOM here, so the same file runs in the
 * browser and under `node --test`.
 *
 * Money is handled in halalas (1 SAR = 100) so totals never drift.
 */

const UNITS = {
  g: { family: 'mass', factor: 1 },
  kg: { family: 'mass', factor: 1000 },
  ml: { family: 'volume', factor: 1 },
  l: { family: 'volume', factor: 1000 },
  pcs: { family: 'count', factor: 1 }
};

/* Fresh food does not wait in the cupboard for next week. */
const PERISHABLE = new Set(['produce_fruit', 'produce_veg', 'meat', 'poultry', 'fish', 'eggs', 'dairy_milk', 'dairy_cheese', 'dairy_yogurt_labneh', 'butter_cream', 'bakery']);

/* Loose items priced per kilo are bought in quarter-kilo steps. */
const LOOSE_STEP_G = 250;

export const halalas = sar => Math.round(sar * 100);
export const sar = h => h / 100;

/* { qty, family } in grams / millilitres / pieces, or null for kitchen
   measures such as "tbsp" that cannot be bought by. */
export function toBase(qty, unit) {
  const u = UNITS[unit];
  if (!u || !(qty > 0)) return null;
  return { qty: qty * u.factor, family: u.family };
}

/* What one priced unit of an offer contains, in base units. */
export function packContent(offer) {
  const base = toBase(offer.size_qty, offer.size_unit);
  if (!base) return null;
  return { qty: base.qty * (offer.pack_count || 1) * bundleSize(offer), family: base.family };
}

/* "1+1" means the printed price buys two. */
export function bundleSize(offer) {
  const match = /^\s*(\d)\s*\+\s*(\d)/.exec(offer.promo || '');
  return match ? Number(match[1]) + Number(match[2]) : 1;
}

export const isLoose = offer => offer.sold_by === 'kg';

export function discountPercent(offer) {
  if (!(offer.was > offer.price)) return 0;
  return Math.round((offer.was - offer.price) / offer.was * 100);
}

/* Price per kilo or litre, for comparing sizes. Null when it cannot be known. */
export function unitPrice(offer) {
  if (isLoose(offer)) return { value: offer.price, per: 'kg' };
  const content = packContent(offer);
  if (!content || content.family === 'count') return null;
  return { value: offer.price / (content.qty / 1000), per: content.family === 'mass' ? 'kg' : 'l' };
}

/* How much to buy of one offer to cover a need, and what it costs. */
export function purchase(offer, needBase) {
  const price = halalas(offer.price);
  const cut = offer.was > offer.price ? halalas(offer.was) - price : 0;

  if (isLoose(offer)) {
    const grams = needBase && needBase.family === 'mass' ? needBase.qty : 1000;
    const buyG = Math.max(LOOSE_STEP_G, Math.ceil(grams / LOOSE_STEP_G - 1e-9) * LOOSE_STEP_G);
    return {
      loose: true, units: buyG / 1000, bought: { qty: buyG, family: 'mass' },
      cost: Math.round(price * buyG / 1000), saved: Math.round(cut * buyG / 1000), approx: !needBase
    };
  }

  const content = packContent(offer);
  const comparable = content && needBase && content.family === needBase.family;
  const units = comparable ? Math.max(1, Math.ceil(needBase.qty / content.qty - 1e-9)) : 1;
  return {
    loose: false, units,
    bought: content ? { qty: content.qty * units, family: content.family } : null,
    cost: price * units, saved: cut * units, approx: !comparable
  };
}

/*
 * The shopping list for a plan.
 *   plan      one entry of plans.json → plans[]
 *   offers    Map of offer id → offer
 *   persons   people to cook for; quantities scale from plan.base_persons
 *   skipped   Set of meal ids the family will not cook
 *   essentials whether the breakfast-and-dinner basket is included
 *   extras    { offerId: units } added by hand from the deals screen
 */
export function buildList({ plan, offers, persons, skipped = new Set(), essentials = true, extras = {} }) {
  const scale = persons / plan.base_persons;
  const byOffer = new Map();
  const unpriced = new Map();
  const pantry = new Map();

  const take = (ingredient, source) => {
    if (ingredient.pantry) {
      const entry = pantry.get(ingredient.name) || { name: ingredient.name, sources: [] };
      if (!entry.sources.includes(source)) entry.sources.push(source);
      pantry.set(ingredient.name, entry);
      return;
    }
    const base = toBase(ingredient.qty * scale, ingredient.unit);
    const offer = ingredient.offer ? offers.get(ingredient.offer) : null;
    if (offer) {
      const entry = byOffer.get(offer.id) || { offer, name: ingredient.name, need: null, sources: [] };
      if (base && !entry.need) entry.need = { qty: base.qty, family: base.family };
      else if (base && entry.need.family === base.family) entry.need.qty += base.qty;
      if (!entry.sources.includes(source)) entry.sources.push(source);
      byOffer.set(offer.id, entry);
      return;
    }
    const key = ingredient.name + '|' + (base ? base.family : ingredient.unit);
    const entry = unpriced.get(key) || { name: ingredient.name, need: null, unit: ingredient.unit, qty: 0, sources: [] };
    if (base) entry.need = { qty: (entry.need ? entry.need.qty : 0) + base.qty, family: base.family };
    else entry.qty += ingredient.qty * scale;
    if (!entry.sources.includes(source)) entry.sources.push(source);
    unpriced.set(key, entry);
  };

  plan.meals.forEach(meal => {
    if (skipped.has(meal.id)) return;
    meal.ingredients.forEach(ingredient => take(ingredient, meal.name));
  });
  if (essentials && plan.essentials) plan.essentials.items.forEach(item => take(item, plan.essentials.name));

  const lines = [];
  byOffer.forEach(entry => {
    const bought = purchase(entry.offer, entry.need);
    lines.push({
      key: 'o:' + entry.offer.id, offer: entry.offer, name: entry.name, need: entry.need, sources: entry.sources,
      units: bought.units, loose: bought.loose, bought: bought.bought, cost: bought.cost, saved: bought.saved, approx: bought.approx,
      // More than three times what the week needs, of something that keeps: the rest stays in the cupboard.
      keeps: !PERISHABLE.has(entry.offer.category) && Boolean(bought.bought && entry.need && bought.bought.family === entry.need.family && bought.bought.qty >= entry.need.qty * 3),
      extra: false
    });
  });

  Object.keys(extras).forEach(id => {
    const offer = offers.get(id);
    const units = extras[id];
    if (!offer || !(units > 0)) return;
    const price = halalas(offer.price);
    const cut = offer.was > offer.price ? halalas(offer.was) - price : 0;
    lines.push({
      key: 'x:' + id, offer, name: offer.name, need: null, sources: [], units, loose: isLoose(offer), bought: null,
      cost: Math.round(price * units), saved: Math.round(cut * units), approx: false, keeps: false, extra: true
    });
  });

  const cost = lines.reduce((sum, line) => sum + line.cost, 0);
  const saved = lines.reduce((sum, line) => sum + line.saved, 0);
  return {
    lines,
    unpriced: Array.from(unpriced.values()),
    pantry: Array.from(pantry.values()),
    totals: { cost, saved, before: cost + saved, items: lines.length, percent: cost + saved > 0 ? Math.round(saved / (cost + saved) * 100) : 0 }
  };
}

/* The saving a meal's card shows: its main ingredient's, and ingredients are
   listed main first. */
export function mealHighlight(meal, offers) {
  for (const ingredient of meal.ingredients) {
    const offer = ingredient.offer ? offers.get(ingredient.offer) : null;
    if (offer && offer.was > offer.price) return offer;
  }
  return null;
}

/* ---------------------------------------------------------------------
   Text helpers
   ------------------------------------------------------------------- */
/* Arabic search that ignores spelling variants: أ/إ/آ→ا, ة→ه, ى→ي, tashkeel. */
export function normalizeAr(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

export function matches(offer, query) {
  const q = normalizeAr(query);
  if (!q) return true;
  const hay = normalizeAr([offer.name, offer.name_en, offer.brand].filter(Boolean).join(' '));
  return q.split(' ').every(word => hay.includes(word));
}

const trim = n => String(Math.round(n * 100) / 100).replace(/\.0+$/, '');

/* 16.99 → "16.99", 17 → "17" */
export function money(h) {
  const value = h / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

/* The app's language for the words below. The data tools leave it Arabic. */
let LANG = 'ar';
export const setLang = lang => { LANG = lang === 'en' ? 'en' : 'ar'; };

/* A base quantity in the unit a shopper thinks in. */
export function amount(base) {
  if (!base) return '';
  const en = LANG === 'en';
  if (base.family === 'count') return trim(roundHalf(base.qty)) + (en ? ' pcs' : ' حبة');
  const big = base.family === 'mass' ? (en ? 'kg' : 'كجم') : (en ? 'L' : 'لتر');
  const small = base.family === 'mass' ? (en ? 'g' : 'جم') : (en ? 'ml' : 'مل');
  if (base.qty >= 1000) return trim(Math.round(base.qty / 50) * 50 / 1000) + ' ' + big;
  return trim(base.qty >= 100 ? Math.round(base.qty / 10) * 10 : Math.round(base.qty)) + ' ' + small;
}

const roundHalf = n => Math.max(0.5, Math.round(n * 2) / 2);

const KITCHEN = { tbsp: 'ملعقة كبيرة', tsp: 'ملعقة صغيرة', cup: 'كوب', pinch: 'رشة', bunch: 'حزمة', clove: 'فص', can: 'علبة', pack: 'كيس', taste: 'حسب الرغبة' };
const KITCHEN_EN = { tbsp: 'tbsp', tsp: 'tsp', cup: 'cups', pinch: 'pinch', bunch: 'bunches', clove: 'cloves', can: 'cans', pack: 'packs', taste: 'to taste' };
const KITCHEN_EN_ONE = { cup: 'cup', bunch: 'bunch', clove: 'clove', can: 'can', pack: 'pack' };

/* An ingredient line for a recipe, scaled to the family. */
export function ingredientAmount(ingredient, scale) {
  // `display` is the cook's wording ("2 حبة متوسطة") for the plan's own family size.
  const en = LANG === 'en';
  const display = en ? ingredient.display_en : ingredient.display;
  if (display && scale === 1) return display;
  if (ingredient.unit === 'taste') return en ? KITCHEN_EN.taste : KITCHEN.taste;
  const base = toBase(ingredient.qty * scale, ingredient.unit);
  if (base) return amount(base);
  const qty = roundHalf(ingredient.qty * scale);
  const label = en ? (qty === 1 && KITCHEN_EN_ONE[ingredient.unit]) || KITCHEN_EN[ingredient.unit] : KITCHEN[ingredient.unit];
  if (!label || !(ingredient.qty > 0)) return '';
  return trim(qty) + ' ' + label;
}

/* "1100 جم" for an offer, as the flyer prints it; in English, its units translated. */
export function offerSize(offer) {
  if (LANG === 'en') {
    if (offer.size_text) return englishSize(offer.size_text);
    return isLoose(offer) ? 'per kg' : '';
  }
  if (offer.size_text) return offer.size_text;
  if (isLoose(offer)) return 'للكيلو';
  return '';
}

const AR = '\u0600-\u06FF';
const SIZE_WORDS = [
  ['للكيلو', 'per kg'],
  ['كيلو ?جرام|كيلوجرام|كيلو غرام|كيلو|كجم|كغم|كغ', 'kg'],
  ['جرام|غرام|جم|غم|غ', 'g'],
  ['مليلتر|ملل|مل', 'ml'],
  ['لترات|لتر|ل', 'L'],
  ['قطعة|قطع|حبات|حبة|حبه', 'pcs'],
  ['أكياس|اكياس|كيس', 'bags'],
  ['عبوات|عبوة', 'packs'],
  ['لفات|لفة|رول', 'rolls'],
  ['مناديل|منديل', 'sheets']
].map(([words, en]) => [new RegExp(`(?<![${AR}])(?:${words})(?![${AR}])`, 'g'), en]);
/* "6×170 جرام" → "6×170 g". Words it does not know stay as they are. */
export function englishSize(text) {
  let out = String(text || '').replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/٫/g, '.');
  SIZE_WORDS.forEach(([pattern, en]) => { out = out.replace(pattern, en); });
  return out.replace(/\b(\d+(?:\.\d+)?)\s*gm\b/gi, '$1 g').replace(/\s+/g, ' ').trim();
}
