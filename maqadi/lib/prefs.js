/*
 * The family's preferences. No DOM: the app and the tests call the same
 * functions.
 *
 * Every meal in plans.json carries `tags` read from its ingredients when
 * the data is built (tools/maqadi/recipe-extras.mjs): fish, red_meat,
 * chicken, egg, dairy, gluten, sesame, nuts. A meal with a tag the family
 * avoids is left out and its place is taken by the next allowed meal, from
 * the same cuisine first and then from the others.
 */
export const AVOID_FOODS = ['fish', 'red_meat', 'chicken'];
export const ALLERGIES = ['egg', 'dairy', 'gluten', 'sesame', 'nuts'];

export const allowed = (item, avoid) => !(item.tags || []).some(tag => avoid.includes(tag));

/* Children under 12 count as half a portion. At least one grown-up cooks. */
export const portions = (persons, kids) => persons - Math.min(Math.max(0, kids || 0), persons - 1) * 0.5;

/*
 * The family's week: the picks they made (or the week's suggestions),
 * without the meals they avoid, topped up from the alternatives or trimmed
 * to the number of meals they want. Also reports what the preferences took
 * out and put in, for the plan screen to say so.
 *   choices       every meal that can be swapped in (allowed only)
 *   removed       meals the family would have had, left out for a preference
 *   replacements  ids of the meals that took their places
 *   droppedBasics basics left out for a preference (eggs, labneh…)
 */
export function activePlan(plan, storedPicks, mealCount, avoid = []) {
  const every = plan.meals.concat(plan.alternatives || []);
  const choices = every.filter(meal => allowed(meal, avoid));
  const byId = new Map(choices.map(meal => [meal.id, meal]));
  const wanted = storedPicks || plan.meals.map(meal => meal.id);
  const ids = wanted.filter((id, i, all) => byId.has(id) && all.indexOf(id) === i);
  const removed = every.filter(meal => wanted.includes(meal.id) && !allowed(meal, avoid));

  const filled = [];
  choices.filter(meal => !meal.unavailable).forEach(meal => {
    if (ids.length < mealCount && !ids.includes(meal.id)) { ids.push(meal.id); filled.push(meal.id); }
  });
  const meals = ids.slice(0, mealCount).map(id => byId.get(id));
  const kept = new Set(meals.map(meal => meal.id));

  const essentials = plan.essentials
    ? Object.assign({}, plan.essentials, { items: plan.essentials.items.filter(item => allowed(item, avoid)) })
    : plan.essentials;
  return Object.assign({}, plan, {
    meals,
    choices,
    essentials,
    removed: removed.filter(meal => plan.meals.some(base => base.id === meal.id) || (storedPicks || []).includes(meal.id)),
    replacements: filled.slice(0, removed.length).filter(id => kept.has(id)),
    droppedBasics: plan.essentials ? plan.essentials.items.filter(item => !allowed(item, avoid)) : []
  });
}
