/*
 * مقاضي — the week's plans, chosen automatically
 *
 * Recipes (recipes.json) never name a product. Each ingredient names a key
 * from ingredients.json, which says how to recognise that ingredient in a
 * store's catalogue. Every week this module:
 *   1. finds, for each key, the store's product that covers the need for the
 *      least money (a discount helps only when it makes the purchase cheaper);
 *   2. keeps the meals whose main ingredients were found, and picks the ones
 *      with the biggest savings, at most two meals per main ingredient;
 *   3. writes the plans in the shape the app reads, with real offer ids.
 * An ingredient that cannot be found is kept, without a price, so the
 * shopping list still tells the family to buy it.
 */
import { toBase, purchase, packContent, isLoose, normalizeAr } from '../../maqadi/lib/plan.js';

const MAX_UNITS = 12;
const MAX_PER_MAIN = 2;
const MIN_MEALS = 5;

const textOf = offer => normalizeAr([offer.name, offer.name_en, offer.brand].filter(Boolean).join(' | '));

/* Products in the right aisles whose names match the key's rules. */
export function candidates(spec, offers) {
  const include = new RegExp(normalizeAr(spec.include), 'i');
  const exclude = spec.exclude ? new RegExp(normalizeAr(spec.exclude), 'i') : null;
  return offers.filter(offer => {
    if (spec.categories && !spec.categories.includes(offer.category)) return false;
    const text = textOf(offer);
    return include.test(text) && !(exclude && exclude.test(text));
  });
}

const fits = (offer, need) => (isLoose(offer) ? need.family === 'mass' : (packContent(offer) || {}).family === need.family);

/* The purchase that covers `need` for the least money. */
export function bestOffer(pool, need) {
  let best = null;
  pool.forEach(offer => {
    if (!need || !fits(offer, need)) return;
    const bought = purchase(offer, need);
    if (bought.approx || bought.units > MAX_UNITS) return;
    const better = !best
      || bought.cost < best.cost
      || (bought.cost === best.cost && bought.saved > best.saved)
      || (bought.cost === best.cost && bought.saved === best.saved && offer.price < best.offer.price);
    if (better) best = { offer, cost: bought.cost, saved: bought.saved, units: bought.units };
  });
  return best;
}

const add = (map, key, base) => {
  if (!base) return;
  const current = map.get(key);
  if (!current) map.set(key, { qty: base.qty, family: base.family });
  else if (current.family === base.family) current.qty += base.qty;
};

/*
 * recipes      recipes.json
 * ingredients  ingredients.json → ingredients
 * offers       every offer of the week (all stores)
 * store        the store the plans are costed at
 */
export function autoPlans({ recipes, ingredients, offers, store, log = () => {} }) {
  const pool = offers.filter(offer => offer.store === store);
  const byKey = {};
  Object.keys(ingredients).forEach(key => { byKey[key] = candidates(ingredients[key], pool); });

  const keyed = item => item && item.key && !item.pantry;
  const plans = [];
  const choices = {};

  recipes.cuisines.forEach(cuisine => {
    // 1. Each meal on its own: can its main ingredients be bought, and what does it save?
    const scored = cuisine.meals.map((meal, order) => {
      let saved = 0;
      const found = new Set();
      meal.ingredients.filter(keyed).forEach(item => {
        const best = bestOffer(byKey[item.key] || [], toBase(item.qty, item.unit));
        if (best) { found.add(item.key); saved += best.saved; }
      });
      const ready = meal.main.every(key => found.has(key));
      return { meal, order, saved, ready, found: found.size };
    });

    // 2. Pick: available meals with the biggest savings, then fill if short.
    const picked = [];
    const perMain = {};
    const take = entry => {
      if (picked.length >= recipes.meals_per_week || picked.includes(entry)) return;
      if (entry.meal.main.some(key => (perMain[key] || 0) >= MAX_PER_MAIN)) return;
      picked.push(entry);
      entry.meal.main.forEach(key => { perMain[key] = (perMain[key] || 0) + 1; });
    };
    scored.filter(entry => entry.ready).sort((a, b) => b.saved - a.saved || a.order - b.order).forEach(take);
    scored.filter(entry => !entry.ready && entry.found > 0).sort((a, b) => b.found - a.found || a.order - b.order).forEach(take);
    if (picked.length < MIN_MEALS) {
      log(`  ${cuisine.id}: only ${picked.length} meals can be costed this week — cuisine left out`);
      return;
    }
    picked.sort((a, b) => a.order - b.order);

    // 3. One product per ingredient for the whole week, chosen for the week's total need.
    const need = new Map();
    picked.forEach(entry => entry.meal.ingredients.filter(keyed).forEach(item => add(need, item.key, toBase(item.qty, item.unit))));
    recipes.essentials.items.filter(keyed).forEach(item => add(need, item.key, toBase(item.qty, item.unit)));
    const chosen = {};
    need.forEach((total, key) => {
      const best = bestOffer(byKey[key] || [], total);
      if (best) chosen[key] = best.offer;
    });
    choices[cuisine.id] = { chosen, need };

    const toPlanItem = item => {
      if (!keyed(item)) return item;
      const out = { name: item.name, qty: item.qty, unit: item.unit };
      if (chosen[item.key]) out.offer = chosen[item.key].id;
      if (item.display) out.display = item.display;
      return out;
    };
    plans.push({
      id: cuisine.id,
      name: cuisine.name,
      tagline: cuisine.tagline,
      base_persons: recipes.base_persons,
      meals: picked.map(({ meal }) => {
        const { main, ingredients: items, ...rest } = meal;
        return Object.assign({}, rest, { ingredients: items.map(toPlanItem) });
      }),
      essentials: { name: recipes.essentials.name, items: recipes.essentials.items.map(toPlanItem) }
    });
    const missing = [...need.keys()].filter(key => !chosen[key]);
    log(`  ${cuisine.id}: ${picked.map(entry => entry.meal.id).join(' ')}${missing.length ? ' — no price for: ' + missing.join(', ') : ''}`);
  });

  if (!plans.length) throw new Error(`no cuisine could be planned from ${store}'s products this week`);
  return { plans: { base_persons: recipes.base_persons, plans }, choices };
}
