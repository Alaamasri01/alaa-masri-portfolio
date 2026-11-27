/*
 * The week's budget. No DOM: the app and the tests call the same functions.
 *
 * The budget covers everything on the shopping list: the meals, the weekly
 * basics and anything added by hand, because that is what the family pays.
 * To bring a week within it, meals are swapped for cheaper ones from the
 * plan's choices (its alternatives and other cuisines' meals), one swap at
 * a time, always the swap that lowers the list total most, until the total
 * fits. Nothing is applied here: the app shows the swaps and the family
 * decides.
 */
import { buildList } from './plan.js';

/* A swap has to be worth it: changing a meal to save a few halalas is not offered. */
export const MIN_SWAP_SAVING = 100;

const total = (plan, mealIds, byId, ctx) => buildList({
  plan: Object.assign({}, plan, { meals: mealIds.map(id => byId.get(id)) }),
  offers: ctx.offers, persons: ctx.persons, skipped: ctx.skipped, essentials: ctx.essentials, extras: ctx.extras
}).totals.cost;

/* `budget` and every amount returned are in halalas.
   Returns { before, after, fits, swaps: [{ from, to, saves }], ids }. */
export function fitBudget({ plan, offers, persons, skipped = new Set(), essentials = true, extras = {}, budget }) {
  const ctx = { offers, persons, skipped, essentials, extras };
  const choices = plan.choices || plan.meals.concat(plan.alternatives || []);
  const byId = new Map(choices.map(meal => [meal.id, meal]));
  let ids = plan.meals.map(meal => meal.id);
  const before = total(plan, ids, byId, ctx);
  let now = before;
  const swaps = [];

  // Only meals that will be cooked are swapped; a meal the family left out costs nothing.
  for (let step = 0; step < ids.length && now > budget; step++) {
    let best = null;
    ids.forEach(from => {
      if (skipped.has(from)) return;
      choices.forEach(to => {
        if (to.unavailable || ids.includes(to.id)) return;
        const cost = total(plan, ids.map(id => (id === from ? to.id : id)), byId, ctx);
        if (cost <= now - MIN_SWAP_SAVING && (!best || cost < best.cost)) best = { from, to: to.id, cost };
      });
    });
    if (!best) break;
    swaps.push({ from: byId.get(best.from), to: byId.get(best.to), saves: now - best.cost });
    ids = ids.map(id => (id === best.from ? best.to : id));
    now = best.cost;
  }
  return { before, after: now, fits: now <= budget, swaps, ids };
}

/* What the list total is made of: meals, the weekly basics, products added
   by hand. Shared items (eggs in a meal and in the basics) count once. */
export function budgetBreakdown({ plan, offers, persons, skipped = new Set(), essentials = true, extras = {} }) {
  const cost = (withBasics, withExtras) => buildList({ plan, offers, persons, skipped, essentials: withBasics && essentials, extras: withExtras ? extras : {} }).totals.cost;
  const meals = cost(false, false);
  const basics = cost(true, false) - meals;
  const all = cost(true, true);
  return { meals, basics, added: all - meals - basics, total: all };
}
