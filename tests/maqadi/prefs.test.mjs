import test from 'node:test';
import assert from 'node:assert/strict';
import { activePlan, allowed, portions } from '../../maqadi/lib/prefs.js';

const meal = (id, tags = [], extra = {}) => Object.assign({ id, name: id, tags, ingredients: [] }, extra);
const plan = {
  base_persons: 4,
  meals: [meal('kabsa', ['chicken']), meal('tuna-salad', ['fish']), meal('omelette', ['egg', 'dairy']), meal('lentils')],
  alternatives: [meal('kofta', ['red_meat', 'dairy']), meal('fatteh', ['chicken', 'dairy', 'gluten', 'sesame', 'nuts'], { cuisine: 'شامية' }), meal('gone', [], { unavailable: true })],
  essentials: { name: 'basics', items: [{ name: 'eggs', tags: ['egg'] }, { name: 'labneh', tags: ['dairy'] }, { name: 'bread', tags: ['gluten'] }] }
};

test('no preferences: the week as suggested', () => {
  const p = activePlan(plan, null, 4, []);
  assert.deepEqual(p.meals.map(m => m.id), ['kabsa', 'tuna-salad', 'omelette', 'lentils']);
  assert.deepEqual(p.removed, []);
  assert.deepEqual(p.replacements, []);
  assert.equal(p.essentials.items.length, 3);
});

test('no fish and an egg allergy: those meals and basics go, the next allowed ones come in', () => {
  const p = activePlan(plan, null, 4, ['fish', 'egg']);
  assert.deepEqual(p.meals.map(m => m.id), ['kabsa', 'lentils', 'kofta', 'fatteh']);
  assert.deepEqual(p.removed.map(m => m.id), ['tuna-salad', 'omelette']);
  assert.deepEqual(p.replacements, ['kofta', 'fatteh']);
  assert.deepEqual(p.essentials.items.map(i => i.name), ['labneh', 'bread']);
  assert.deepEqual(p.droppedBasics.map(i => i.name), ['eggs']);
  assert.ok(p.choices.every(m => allowed(m, ['fish', 'egg'])));      // swaps and budget only see allowed meals
});

test('too few allowed meals: a shorter week, never an avoided or unavailable meal', () => {
  const p = activePlan(plan, null, 4, ['chicken', 'fish', 'egg', 'dairy']);
  assert.deepEqual(p.meals.map(m => m.id), ['lentils']);
});

test("the family's own picks are kept unless a preference rules them out", () => {
  const p = activePlan(plan, ['kofta', 'tuna-salad', 'lentils', 'kabsa'], 4, ['fish']);
  assert.deepEqual(p.meals.map(m => m.id), ['kofta', 'lentils', 'kabsa', 'omelette']);
  assert.deepEqual(p.removed.map(m => m.id), ['tuna-salad']);
});

test('children under 12 count as half a portion', () => {
  assert.equal(portions(5, 2), 4);
  assert.equal(portions(4, 0), 4);
  assert.equal(portions(3, 5), 2);        // at least one grown-up
  assert.equal(portions(1, 1), 1);
});
