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

/* What a meal's share of a product costs, used to rank meals by price:
   the cost of what the recipe uses, not of the whole pack. */
function shareCost(offer, need) {
  if (isLoose(offer)) return Math.round(offer.price * 100 * need.qty / 1000);
  const content = packContent(offer);
  return Math.round(offer.price * 100 * need.qty / content.qty);
}

/*
 * recipes      recipes.json
 * ingredients  ingredients.json → ingredients
 * offers       every offer of the week (all stores)
 * store        the store the plans are costed at
 *
 * A cuisine with "from": "all" draws on every other cuisine's meals; with
 * "rank": "cost" it prefers the cheapest meals instead of the biggest savings.
 * Each plan lists the week's picks in `meals` and every other meal that can
 * be costed in `alternatives`, so a family can swap one for another.
 */
export function autoPlans({ recipes, ingredients, offers, store, log = () => {} }) {
  const pool = offers.filter(offer => offer.store === store);
  const byKey = {};
  Object.keys(ingredients).forEach(key => { byKey[key] = candidates(ingredients[key], pool); });

  const keyed = item => item && item.key && !item.pantry;
  const plans = [];
  const choices = {};
  const everyMeal = [];
  const homeOf = {};
  recipes.cuisines.filter(cuisine => cuisine.from !== 'all').forEach(cuisine => cuisine.meals.forEach(meal => {
    if (everyMeal.some(other => other.id === meal.id)) return;
    everyMeal.push(meal);
    homeOf[meal.id] = cuisine.name;
  }));

  const score = (meal, order) => {
    let saved = 0;
    let cost = 0;
    const found = new Set();
    meal.ingredients.filter(keyed).forEach(item => {
      const need = toBase(item.qty, item.unit);
      const best = bestOffer(byKey[item.key] || [], need);
      if (best) { found.add(item.key); saved += best.saved; cost += shareCost(best.offer, need); }
    });
    return { meal, order, saved, cost, ready: meal.main.every(key => found.has(key)), found: found.size };
  };
  const everyScored = everyMeal.map(score);

  recipes.cuisines.forEach(cuisine => {
    const meals = cuisine.from === 'all' ? everyMeal : cuisine.meals;
    const byCost = cuisine.rank === 'cost';

    // 1. Each meal on its own: can its main ingredients be bought, what does it save and cost?
    const scored = meals.map(score);
    const rankReady = byCost ? (a, b) => a.cost - b.cost || a.order - b.order : (a, b) => b.saved - a.saved || a.order - b.order;

    // 2. Pick: available meals ranked, then fill if short.
    const picked = [];
    const perMain = {};
    const take = capped => entry => {
      if (picked.length >= recipes.meals_per_week || picked.includes(entry)) return;
      if (capped && entry.meal.main.some(key => (perMain[key] || 0) >= MAX_PER_MAIN)) return;
      picked.push(entry);
      entry.meal.main.forEach(key => { perMain[key] = (perMain[key] || 0) + 1; });
    };
    // Variety first; then a third meal on the same main ingredient beats a meal that cannot be bought.
    const ready = scored.filter(entry => entry.ready).sort(rankReady);
    ready.forEach(take(true));
    ready.forEach(take(false));
    scored.filter(entry => !entry.ready && entry.found > 0).sort((a, b) => b.found - a.found || a.order - b.order).forEach(take(true));
    if (picked.length < MIN_MEALS) {
      log(`  ${cuisine.id}: only ${picked.length} meals can be costed this week — cuisine left out`);
      return;
    }
    picked.sort((a, b) => a.order - b.order);
    // Swaps: this cuisine's other meals first, then other cuisines' meals that can be cooked this week.
    const own = new Set(meals.map(meal => meal.id));
    const others = scored.filter(entry => !picked.includes(entry) && entry.found > 0)
      .sort((a, b) => (b.ready - a.ready) || rankReady(a, b))
      .concat(everyScored.filter(entry => !own.has(entry.meal.id) && entry.ready).sort(rankReady).map(entry => Object.assign({ foreign: true }, entry)));

    // 3. One product per ingredient for the whole week, chosen for the week's total need;
    //    ingredients only the alternatives use are chosen for one meal's need.
    const need = new Map();
    picked.forEach(entry => entry.meal.ingredients.filter(keyed).forEach(item => add(need, item.key, toBase(item.qty, item.unit))));
    recipes.essentials.items.filter(keyed).forEach(item => add(need, item.key, toBase(item.qty, item.unit)));
    const chosen = {};
    need.forEach((total, key) => {
      const best = bestOffer(byKey[key] || [], total);
      if (best) chosen[key] = best.offer;
    });
    others.forEach(entry => entry.meal.ingredients.filter(keyed).forEach(item => {
      if (chosen[item.key] || need.has(item.key)) return;
      const best = bestOffer(byKey[item.key] || [], toBase(item.qty, item.unit));
      if (best) chosen[item.key] = best.offer;
    }));
    choices[cuisine.id] = { chosen, need };

    const toPlanItem = item => {
      if (!keyed(item)) return item;
      const out = { name: item.name, qty: item.qty, unit: item.unit };
      if (chosen[item.key]) out.offer = chosen[item.key].id;
      if (item.display) out.display = item.display;
      return out;
    };
    const toPlanMeal = ({ meal, ready, foreign }) => {
      const { main, ingredients: items, ...rest } = meal;
      const out = Object.assign({}, rest, { ingredients: items.map(toPlanItem) });
      if (!ready) out.unavailable = true;
      if (foreign) out.cuisine = homeOf[meal.id];
      return out;
    };
    plans.push({
      id: cuisine.id,
      name: cuisine.name,
      tagline: cuisine.tagline,
      base_persons: recipes.base_persons,
      meals: picked.map(toPlanMeal),
      alternatives: others.map(toPlanMeal),
      essentials: { name: recipes.essentials.name, items: recipes.essentials.items.map(toPlanItem) }
    });
    const missing = [...need.keys()].filter(key => !chosen[key]);
    log(`  ${cuisine.id}: ${picked.map(entry => entry.meal.id).join(' ')} (+${others.length} alternatives)${missing.length ? ' — no price for: ' + missing.join(', ') : ''}`);
  });

  if (!plans.length) throw new Error(`no cuisine could be planned from ${store}'s products this week`);
  return { plans: { base_persons: recipes.base_persons, plans }, choices };
}
