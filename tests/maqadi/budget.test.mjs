import test from 'node:test';
import assert from 'node:assert/strict';
import { fitBudget, budgetBreakdown } from '../../maqadi/lib/budget.js';

// Prices in riyals; packs of 1 kg unless noted.
const offers = new Map([
  ['beef', { id: 'beef', price: 40, size_qty: 1, size_unit: 'kg', category: 'meat' }],
  ['chicken', { id: 'chicken', price: 20, size_qty: 1, size_unit: 'kg', category: 'poultry' }],
  ['fish', { id: 'fish', price: 30, size_qty: 1, size_unit: 'kg', category: 'fish' }],
  ['eggs', { id: 'eggs', price: 12, size_qty: 30, size_unit: 'pcs', category: 'eggs' }],
  ['lentils', { id: 'lentils', price: 8, size_qty: 1, size_unit: 'kg', category: 'legumes_nuts' }],
  ['bread', { id: 'bread', price: 5, size_qty: 600, size_unit: 'g', category: 'bakery' }]
]);
const meal = (id, offer, qty, unit = 'g') => ({ id, name: id, ingredients: [{ name: offer, qty, unit, offer }] });
const plan = {
  base_persons: 4,
  meals: [meal('beef-stew', 'beef', 1000), meal('fish-tray', 'fish', 1000), meal('chicken-rice', 'chicken', 1000)],
  alternatives: [meal('omelette', 'eggs', 12, 'pcs'), meal('lentil-soup', 'lentils', 500), Object.assign(meal('gone', 'chicken', 10), { unavailable: true })],
  essentials: { name: 'basics', items: [{ name: 'bread', qty: 600, unit: 'g', offer: 'bread' }] }
};
const sar = n => n * 100;

test('a week already within budget is left alone', () => {
  const r = fitBudget({ plan, offers, persons: 4, budget: sar(100) });
  assert.equal(r.before, sar(95));
  assert.equal(r.fits, true);
  assert.deepEqual(r.swaps, []);
});

test('the most expensive meals go first, one swap at a time, until it fits', () => {
  const r = fitBudget({ plan, offers, persons: 4, budget: sar(70) });
  assert.equal(r.before, sar(95));
  assert.deepEqual(r.swaps.map(s => [s.from.id, s.to.id, s.saves]), [['beef-stew', 'lentil-soup', sar(32)]]);
  assert.equal(r.after, sar(63));
  assert.equal(r.fits, true);
});

test('a budget too low for any swap reports the lowest week it can reach', () => {
  const r = fitBudget({ plan, offers, persons: 4, budget: sar(20) });
  assert.equal(r.fits, false);
  assert.equal(r.swaps.length, 2);
  assert.ok(!r.ids.includes('gone'));                       // never an unavailable meal
  assert.equal(r.after, sar(5 + 20 + 8 + 12));              // bread + chicken + lentils + eggs
});

test('meals the family left out are not swapped and cost nothing', () => {
  const r = fitBudget({ plan, offers, persons: 4, skipped: new Set(['beef-stew']), budget: sar(50) });
  assert.equal(r.before, sar(55));
  assert.ok(r.swaps.every(s => s.from.id !== 'beef-stew'));
});

test('the budget counts products added by hand', () => {
  const r = fitBudget({ plan, offers, persons: 4, extras: { eggs: 2 }, budget: sar(100) });
  assert.equal(r.before, sar(119));
  assert.equal(r.fits, true);
  const b = budgetBreakdown({ plan, offers, persons: 4, extras: { eggs: 2 } });
  assert.deepEqual([b.meals, b.basics, b.added, b.total], [sar(90), sar(5), sar(24), sar(119)]);
});

test('a swap that saves less than a riyal is not offered', () => {
  const cheapOffers = new Map(offers);
  cheapOffers.set('fish', Object.assign({}, offers.get('fish'), { price: 12.5 }));   // fish tray costs 12.50
  const r = fitBudget({ plan, offers: cheapOffers, persons: 4, budget: sar(10) });
  // swapping the 12.50 fish tray for the 12.00 omelette would save 0.50: left alone
  assert.ok(r.swaps.every(s => s.saves >= 100));
  assert.ok(!r.swaps.some(s => s.from.id === 'fish-tray' && s.to.id === 'omelette'));
});
