/*
 * مقاضي — weekly data build
 *
 *   node tools/maqadi/build-data.mjs 2026-w48
 *
 * Reads   tools/maqadi/weeks/<week>/meta.json          stores, dates, corrections
 *         tools/maqadi/weeks/<week>/<store>/*.json     offers as read from each flyer
 *         tools/maqadi/weeks/<week>/plans.json         the week's meal plans
 * Writes  maqadi/data/<week>/offers.json, plans.json and maqadi/data/current.json
 *
 * The build refuses to publish anything it cannot stand behind: an offer with
 * an unreadable price is dropped, and a plan that points at a missing offer or
 * asks for an amount that cannot be bought from its offer stops the build.
 */
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildList, toBase, packContent, isLoose, money } from '../../maqadi/lib/plan.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const CATEGORIES = ['produce_fruit', 'produce_veg', 'meat', 'poultry', 'fish', 'eggs', 'dairy_milk', 'dairy_cheese', 'dairy_yogurt_labneh', 'butter_cream', 'bakery', 'rice_grains', 'pasta_noodles', 'flour_baking', 'oil_ghee', 'canned', 'sauces_condiments', 'spices', 'legumes_nuts', 'frozen_chicken', 'frozen_veg', 'frozen_other', 'breakfast_spreads', 'drinks_water', 'drinks_juice', 'tea_coffee', 'dates_sweets', 'snacks', 'household', 'other'];
const SIZE_UNITS = ['g', 'kg', 'ml', 'l', 'pcs'];
const SOLD_BY = ['each', 'plate', 'kg', 'pack', 'carton', 'bag', 'bunch', 'box'];
const KITCHEN_UNITS = ['tbsp', 'tsp', 'cup', 'pinch', 'bunch', 'clove', 'can', 'pack', 'taste'];

const readJSON = path => JSON.parse(readFileSync(path, 'utf8'));
const writeJSON = (path, value) => { mkdirSync(dirname(path), { recursive: true }); writeFileSync(path, JSON.stringify(value, null, 1) + '\n'); };
const pad = n => String(n).padStart(2, '0');
const clean = text => (typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : null);
const isPrice = n => typeof n === 'number' && Number.isFinite(n) && n > 0 && n < 5000;

export function buildOffers(week, log = console.log) {
  const dir = join(ROOT, 'tools/maqadi/weeks', week);
  const meta = readJSON(join(dir, 'meta.json'));
  const offers = [];
  const report = { read: 0, dropped: [], fixed: [], duplicates: 0 };

  Object.keys(meta.stores).forEach(storeId => {
    const store = meta.stores[storeId];
    const files = readdirSync(join(dir, storeId)).filter(name => name.endsWith('.json')).sort();
    const perPage = {};
    const seen = new Set();

    files.forEach(file => {
      readJSON(join(dir, storeId, file)).forEach(raw => {
        report.read += 1;
        const page = Number(raw.page);
        perPage[page] = (perPage[page] || 0) + 1;
        const id = `${store.prefix}-${pad(page)}-${pad(perPage[page])}`;
        const item = Object.assign({}, raw, (meta.corrections || {})[id]);

        if ((meta.drop || []).includes(id)) { report.dropped.push([id, 'dropped by hand']); return; }
        const name = clean(item.name_ar) || clean(item.name_en);
        if (!name) { report.dropped.push([id, 'no name']); return; }
        if (!isPrice(item.price)) { report.dropped.push([id, 'no readable price: ' + name]); return; }
        if (item.confidence === 'low' && !(meta.corrections || {})[id]) { report.dropped.push([id, 'low confidence: ' + name]); return; }

        let was = isPrice(item.was) ? item.was : null;
        if (was !== null && was <= item.price) { report.fixed.push([id, `old price ${was} not above ${item.price}; removed`]); was = null; }
        const sizeUnit = SIZE_UNITS.includes(item.size_unit) ? item.size_unit : null;
        const sizeQty = sizeUnit && item.size_qty > 0 ? item.size_qty : null;

        const offer = {
          id,
          store: storeId,
          page,
          name,
          name_en: clean(item.name_en),
          brand: clean(item.brand),
          category: CATEGORIES.includes(item.category) ? item.category : 'other',
          size_text: clean(item.size_text),
          size_qty: sizeQty,
          size_unit: sizeQty ? sizeUnit : null,
          pack_count: item.pack_count > 1 ? Math.round(item.pack_count) : 1,
          sold_by: SOLD_BY.includes(item.sold_by) ? item.sold_by : null,
          price: item.price,
          was,
          promo: clean(item.promo),
          note: clean(item.note)
        };
        // The two halves of a page overlap; the same product read twice is one offer.
        const key = [storeId, page, offer.name, offer.size_text, offer.price].join('|');
        if (seen.has(key)) { report.duplicates += 1; perPage[page] -= 1; return; }
        seen.add(key);
        offers.push(offer);
      });
    });
  });

  log(`offers: read ${report.read}, published ${offers.length}, duplicates ${report.duplicates}, dropped ${report.dropped.length}, old prices removed ${report.fixed.length}`);
  report.dropped.forEach(([id, why]) => log(`  dropped ${id}: ${why}`));
  report.fixed.forEach(([id, why]) => log(`  fixed   ${id}: ${why}`));
  return { meta, offers, report };
}

export function checkPlans(plans, offers) {
  const problems = [];
  const byId = new Map(offers.map(offer => [offer.id, offer]));
  const say = (where, what) => problems.push(`${where}: ${what}`);
  if (!(plans.base_persons > 0)) say('plans', 'base_persons missing');
  const planIds = new Set();

  (plans.plans || []).forEach(plan => {
    const at = `plan ${plan.id}`;
    if (!plan.id || planIds.has(plan.id)) say(at, 'id missing or repeated');
    planIds.add(plan.id);
    if (!plan.name || !plan.tagline) say(at, 'name or tagline missing');
    if (plan.base_persons !== plans.base_persons) say(at, 'base_persons differs from the file');
    if (!Array.isArray(plan.meals) || plan.meals.length < 5) say(at, 'needs at least five meals');
    const mealIds = new Set();

    const checkIngredient = (ingredient, where) => {
      if (!ingredient.name) { say(where, 'ingredient without a name'); return; }
      const here = `${where} › ${ingredient.name}`;
      if (ingredient.pantry) {
        if (ingredient.offer) say(here, 'a pantry item cannot point at an offer');
        if (!KITCHEN_UNITS.includes(ingredient.unit) && !SIZE_UNITS.includes(ingredient.unit)) say(here, `unknown unit "${ingredient.unit}"`);
        return;
      }
      const base = toBase(ingredient.qty, ingredient.unit);
      if (!base) { say(here, `needs a quantity in g, kg, ml, l or pcs (got ${ingredient.qty} ${ingredient.unit})`); return; }
      if (!ingredient.offer) return;
      const offer = byId.get(ingredient.offer);
      if (!offer) { say(here, `offer ${ingredient.offer} is not in this week's offers`); return; }
      if (isLoose(offer)) { if (base.family !== 'mass') say(here, `offer ${offer.id} is sold by the kilo; give the amount in g or kg`); return; }
      const content = packContent(offer);
      if (!content) { say(here, `offer ${offer.id} has no readable size`); return; }
      if (content.family !== base.family) say(here, `amount is ${base.family} but offer ${offer.id} is sold by ${content.family}`);
    };

    (plan.meals || []).forEach(meal => {
      const where = `${at} › ${meal.name || meal.id}`;
      if (!meal.id || mealIds.has(meal.id)) say(where, 'meal id missing or repeated');
      mealIds.add(meal.id);
      ['name', 'emoji', 'summary'].forEach(field => { if (!meal[field]) say(where, field + ' missing'); });
      if (!(meal.minutes > 0)) say(where, 'minutes missing');
      if (!Array.isArray(meal.steps) || meal.steps.length < 3) say(where, 'needs at least three steps');
      if (!Array.isArray(meal.ingredients) || meal.ingredients.length < 3) say(where, 'needs at least three ingredients');
      (meal.ingredients || []).forEach(ingredient => checkIngredient(ingredient, where));
      if (!(meal.ingredients || []).some(ingredient => ingredient.offer)) say(where, 'uses no offer at all');
    });
    if (plan.essentials) (plan.essentials.items || []).forEach(item => checkIngredient(item, `${at} › essentials`));
  });
  return problems;
}

function main() {
  const week = (process.argv[2] || '').toLowerCase();
  if (!/^\d{4}-w\d{2}$/.test(week)) { console.error('usage: node tools/maqadi/build-data.mjs 2026-w48'); process.exit(2); }
  const dir = join(ROOT, 'tools/maqadi/weeks', week);
  const { meta, offers } = buildOffers(week);

  const stores = {};
  Object.keys(meta.stores).forEach(id => {
    const { prefix, ...rest } = meta.stores[id];
    stores[id] = Object.assign({ offers: offers.filter(offer => offer.store === id).length }, rest);
  });
  const out = join(ROOT, 'maqadi/data', week);
  writeJSON(join(out, 'offers.json'), { week: meta.week, city: meta.city, stores, offers });

  const plansPath = join(dir, 'plans.json');
  if (!existsSync(plansPath)) { console.log('no plans.json yet: offers written, plans skipped'); return; }
  const plans = readJSON(plansPath);
  const problems = checkPlans(plans, offers);
  if (problems.length) {
    console.error(`\n${problems.length} problem(s) in plans.json — nothing published:`);
    problems.forEach(problem => console.error('  ✗ ' + problem));
    process.exit(1);
  }
  writeJSON(join(out, 'plans.json'), Object.assign({ week: meta.week }, plans));
  writeJSON(join(ROOT, 'maqadi/data/current.json'), { week: meta.week, offers: `${week}/offers.json`, plans: `${week}/plans.json`, updated: meta.updated });

  const byId = new Map(offers.map(offer => [offer.id, offer]));
  plans.plans.forEach(plan => {
    const list = buildList({ plan, offers: byId, persons: plans.base_persons });
    const flagged = list.lines.filter(line => line.approx).map(line => line.offer.id);
    console.log(`plan ${plan.id}: ${plan.meals.length} meals, ${list.lines.length} offer items, ${list.unpriced.length} without offer, pays ${money(list.totals.cost)} SAR, saves ${money(list.totals.saved)} SAR (${list.totals.percent}%)${flagged.length ? ' — APPROX: ' + flagged.join(',') : ''}`);
  });
  console.log('published ' + week);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
