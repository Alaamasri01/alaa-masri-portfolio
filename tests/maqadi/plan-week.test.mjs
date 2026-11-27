import test from 'node:test';
import assert from 'node:assert/strict';
import { candidates, bestOffer, autoPlans } from '../../tools/maqadi/plan-week.mjs';

const offer = (id, name, extra) => Object.assign({ id, store: 's', name, name_en: null, brand: null, category: 'poultry', size_qty: 1000, size_unit: 'g', pack_count: 1, sold_by: null, price: 10, was: null, promo: null }, extra);

test('rules match names in Arabic or English and respect exclusions', () => {
  const spec = { categories: ['poultry'], include: 'whole chicken|دجاج كامل', exclude: 'marinat|متبل' };
  const pool = [
    offer('a', 'دجاج كامل طازج'),
    offer('b', 'Chicken', { name_en: 'Whole Chicken Tray' }),
    offer('c', 'دجاج كامل متبل'),
    offer('d', 'دجاج كامل', { category: 'snacks' })
  ];
  assert.deepEqual(candidates(spec, pool).map(o => o.id), ['a', 'b']);
});

test('the cheapest way to cover the need wins, not the cheapest pack', () => {
  const pool = [
    offer('small', 'أرز', { size_qty: 1000, price: 9 }),
    offer('big', 'أرز', { size_qty: 5000, price: 30, was: 45 }),
    offer('carton', 'أرز', { size_qty: 250, price: 3 })
  ];
  assert.equal(bestOffer(pool, { qty: 900, family: 'mass' }).offer.id, 'small');
  assert.equal(bestOffer(pool, { qty: 4500, family: 'mass' }).offer.id, 'big');
  // 18 packs of 250 g would be absurd: more than twelve units is never chosen.
  assert.notEqual(bestOffer(pool, { qty: 4500, family: 'mass' }).offer.id, 'carton');
  assert.equal(bestOffer(pool, { qty: 3, family: 'count' }), null);
});

test('plans pick available meals, keep the rest as swaps, and flag missing mains', () => {
  const ingredients = {
    chicken: { categories: ['poultry'], include: 'دجاج' },
    fish: { categories: ['fish'], include: 'سمك' },
    rice: { categories: ['rice_grains'], include: 'ارز' }
  };
  const meal = (id, main) => ({ id, name: id, emoji: '🍽', minutes: 30, summary: id, main: [main], steps: ['a', 'b', 'c'],
    ingredients: [{ key: main, name: main, qty: 500, unit: 'g' }, { key: 'rice', name: 'أرز', qty: 300, unit: 'g' }] });
  const recipes = {
    base_persons: 4, meals_per_week: 5,
    essentials: { name: 'أساسيات', items: [] },
    cuisines: [{ id: 'c', name: 'سفرة', tagline: 't', meals: ['m1', 'm2', 'm3', 'm4', 'm5'].map(id => meal(id, 'chicken')).concat(meal('f1', 'fish')) }]
  };
  const offers = [offer('ch', 'دجاج', { was: 12 }), offer('rc', 'ارز', { category: 'rice_grains', size_qty: 5000, price: 20 })];
  const { plans } = autoPlans({ recipes, ingredients: Object.assign({}, ingredients), offers, store: 's' });
  const plan = plans.plans[0];
  assert.equal(plan.meals.length, 5);
  assert.ok(plan.meals.every(m => m.ingredients[0].offer === 'ch'));
  assert.deepEqual(plan.alternatives.map(m => [m.id, Boolean(m.unavailable)]), [['f1', true]]);
  assert.equal(plan.alternatives[0].ingredients[0].offer, undefined);
  assert.equal(plan.alternatives[0].ingredients[1].offer, 'rc');
});

test('core.json keeps what the plans buy and each store\'s best food discounts', async () => {
  const { coreOffers } = await import('../../tools/maqadi/build-data.mjs');
  const o = (id, store, price, was, category = 'meat', img = 'x.jpg') => ({ id, store, price, was, category, img });
  const published = [
    o('a1', 'a', 10, 20), o('a2', 'a', 10, 12), o('a3', 'a', 5, 10, 'household'), o('a4', 'a', 9, 18, 'meat', null),
    o('a5', 'a', 3, 4), o('b1', 'b', 1, 2), o('b2', 'b', 7)
  ];
  const core = coreOffers(published, new Set(['b2']), 2);
  // Store a: a1 (50% off) and a5 (25%) beat a2 (17%); cleaning products and products without a photo never count.
  assert.deepEqual(core.map(offer => offer.id), ['a1', 'a5', 'b1', 'b2']);
});
