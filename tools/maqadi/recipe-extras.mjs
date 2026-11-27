/*
 * What the app needs about each recipe beyond the recipe itself:
 *   tags     what a family may avoid (fish, red meat, chicken) or be
 *            allergic to (egg, dairy, gluten, sesame, nuts), read from the
 *            ingredients, so a new recipe is tagged without anyone remembering;
 *   English  from recipes.en.json, by id.
 * The ingredient keys come from ingredients.json; kitchen staples (no key)
 * are matched by name.
 */
export const KEY_TAGS = {
  fish_fillet: ['fish'], tuna: ['fish'],
  beef_minced: ['red_meat'],
  chicken_whole: ['chicken'], chicken_pieces: ['chicken'], chicken_legs: ['chicken'], chicken_breast: ['chicken'],
  eggs: ['egg'],
  milk: ['dairy'], butter: ['dairy'], cooking_cream: ['dairy'], mozzarella: ['dairy'], cheese_slices: ['dairy'], labneh: ['dairy'], yogurt: ['dairy'], laban: ['dairy'],
  pasta_short: ['gluten'], pasta_long: ['gluten'], bread_toast: ['gluten'], tortilla: ['gluten'],
  harees: ['gluten'], jareesh: ['gluten'], sambousa_sheets: ['gluten']
};
// Matched on the whole name: "طحين" (flour) is not "طحينة" (tahini).
export const STAPLE_TAGS = [
  [/^طحين$/, ['gluten']],
  [/صويا/, ['gluten']],
  [/طحينة/, ['sesame']],
  [/صنوبر|لوز|جوز|فستق|كاجو|مكسرات/, ['nuts']],
  [/مايونيز/, ['egg']],
  [/^زبدة$|^سمن$|جبن|حليب|قشطة|كريمة/, ['dairy']]
];
export const TAGS = ['fish', 'red_meat', 'chicken', 'egg', 'dairy', 'gluten', 'sesame', 'nuts'];

export function itemTags(item) {
  if (item.key) return KEY_TAGS[item.key] || [];
  // Nutmeg (جوزة الطيب) is a spice, not a tree nut.
  const name = String(item.name || '').replace(/جوزة الطيب/g, '').trim();
  return STAPLE_TAGS.filter(([pattern]) => pattern.test(name)).flatMap(([, tags]) => tags);
}
export const mealTags = meal => TAGS.filter(tag => meal.ingredients.some(item => itemTags(item).includes(tag)));

/* recipes.json with tags and English added; the original is not changed. */
export function withExtras(recipes, english) {
  const en = english || { cuisines: {}, meals: {}, essentials: { items: {} } };
  const item = (raw, tr) => {
    const out = Object.assign({}, raw);
    const tags = itemTags(raw);
    if (tags.length) out.tags = tags;
    if (tr && tr.name) out.name_en = tr.name;
    if (tr && tr.display) out.display_en = tr.display;
    return out;
  };
  const meal = raw => {
    const tr = en.meals[raw.id] || {};
    const out = Object.assign({}, raw, { ingredients: raw.ingredients.map((ing, i) => item(ing, (tr.ingredients || [])[i])) });
    out.tags = mealTags(raw);
    if (tr.name) out.name_en = tr.name;
    if (tr.summary) out.summary_en = tr.summary;
    if (tr.steps) out.steps_en = tr.steps;
    if (tr.tip) out.tip_en = tr.tip;
    return out;
  };
  return Object.assign({}, recipes, {
    essentials: Object.assign({}, recipes.essentials, {
      name_en: en.essentials && en.essentials.name,
      items: recipes.essentials.items.map(raw => item(raw, { name: ((en.essentials || {}).items || {})[raw.key] }))
    }),
    cuisines: recipes.cuisines.map(cuisine => {
      const tr = en.cuisines[cuisine.id] || {};
      const out = Object.assign({}, cuisine, { name_en: tr.name, tagline_en: tr.tagline, meals: (cuisine.meals || []).map(meal) });
      // A season's own basics and big shop, and the dishes of each day (Ramadan's iftar and suhoor).
      const group = (raw, names) => Object.assign({}, raw, {
        name_en: names && names.name,
        items: raw.items.map(entry => item(entry, { name: ((names || {}).items || {})[entry.key] }))
      });
      if (cuisine.essentials) out.essentials = group(cuisine.essentials, tr.essentials);
      if (cuisine.stockup) out.stockup = group(cuisine.stockup, tr.stockup);
      if (cuisine.daily) {
        out.daily = {};
        Object.keys(cuisine.daily).forEach(part => {
          out.daily[part] = cuisine.daily[part].map((dish, i) => Object.assign({}, dish, { name_en: ((tr.daily || {})[part] || [])[i] }));
        });
      }
      return out;
    })
  });
}
