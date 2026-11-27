import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { itemTags, mealTags, withExtras } from '../../tools/maqadi/recipe-extras.mjs';

const recipes = JSON.parse(readFileSync('tools/maqadi/recipes.json', 'utf8'));
const english = JSON.parse(readFileSync('tools/maqadi/recipes.en.json', 'utf8'));
const meals = recipes.cuisines.flatMap(cuisine => cuisine.meals || []);
const byId = id => meals.find(meal => meal.id === id);

test('tags come from the ingredients, kitchen staples included', () => {
  assert.deepEqual(mealTags(byId('k6')), ['fish']);                                   // fish sayadiyah
  assert.deepEqual(mealTags(byId('q5')), ['fish', 'egg', 'gluten']);                 // tuna, mayonnaise, pasta
  assert.deepEqual(mealTags(byId('s8')), ['chicken', 'dairy', 'gluten', 'sesame', 'nuts']);
  assert.deepEqual(mealTags(byId('s6')), ['red_meat', 'dairy', 'gluten']);           // béchamel: milk, butter, flour
  assert.deepEqual(mealTags(byId('s5')), ['dairy']);                                  // mujaddara with yoghurt
  assert.deepEqual(itemTags({ name: 'طحينة' }), ['sesame']);                          // not gluten
  assert.deepEqual(itemTags({ name: 'طحين' }), ['gluten']);
  assert.deepEqual(itemTags({ name: 'سمن أو زيت' }), []);                             // oil will do
  assert.deepEqual(itemTags({ name: 'فلفل أسود وجوزة الطيب' }), []);                  // nutmeg is a spice
  assert.deepEqual(itemTags({ name: 'صنوبر أو لوز' }), ['nuts']);
});

test('every meal, step and ingredient has its English', () => {
  Object.entries(english.cuisines).forEach(([id, c]) => assert.ok(c.name && c.tagline, id));
  recipes.cuisines.forEach(c => assert.ok(english.cuisines[c.id], c.id));
  meals.forEach(meal => {
    const en = english.meals[meal.id];
    assert.ok(en && en.name && en.summary, meal.id);
    assert.equal(en.steps.length, meal.steps.length, meal.id + ' steps');
    assert.equal(en.ingredients.length, meal.ingredients.length, meal.id + ' ingredients');
    meal.ingredients.forEach((ing, i) => {
      assert.ok(en.ingredients[i].name, meal.id + ' ' + ing.name);
      assert.equal(Boolean(en.ingredients[i].display), Boolean(ing.display), meal.id + ' display of ' + ing.name);
    });
    assert.equal(Boolean(en.tip), Boolean(meal.tip), meal.id + ' tip');
    assert.ok(!/[؀-ۿ]/.test(JSON.stringify(en)), meal.id + ' has Arabic in its English');
  });
  recipes.essentials.items.forEach(item => assert.ok(english.essentials.items[item.key], item.key));
});

test('extras are added without changing the recipes', () => {
  const before = JSON.stringify(recipes);
  const out = withExtras(recipes, english);
  assert.equal(JSON.stringify(recipes), before);
  const k1 = out.cuisines[0].meals.find(meal => meal.id === 'k1');
  assert.equal(k1.name_en, 'Chicken Kabsa');
  assert.deepEqual(k1.tags, ['chicken']);
  assert.equal(k1.ingredients[0].name_en, 'Whole chicken');
  assert.deepEqual(out.essentials.items.find(item => item.key === 'eggs').tags, ['egg']);
});
