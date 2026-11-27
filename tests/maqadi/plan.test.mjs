import test from 'node:test';
import assert from 'node:assert/strict';
import {
  toBase, packContent, bundleSize, discountPercent, unitPrice, purchase, buildList,
  mealHighlight, normalizeAr, matches, money, amount, ingredientAmount, halalas
} from '../../maqadi/lib/plan.js';

const offer = extra => Object.assign({
  id: 'o1', store: 'othaim', name: 'دجاج', size_qty: 1000, size_unit: 'g', pack_count: 1,
  sold_by: 'each', price: 16.99, was: 21.5, promo: null
}, extra);

const mapOf = list => new Map(list.map(o => [o.id, o]));

test('units convert to grams, millilitres and pieces', () => {
  assert.deepEqual(toBase(1.5, 'kg'), { qty: 1500, family: 'mass' });
  assert.deepEqual(toBase(2, 'l'), { qty: 2000, family: 'volume' });
  assert.deepEqual(toBase(6, 'pcs'), { qty: 6, family: 'count' });
  assert.equal(toBase(1, 'tbsp'), null);
  assert.equal(toBase(0, 'g'), null);
});

test('a multi-pack contains every unit in it', () => {
  assert.deepEqual(packContent(offer({ size_qty: 1000, pack_count: 10 })), { qty: 10000, family: 'mass' });
  assert.deepEqual(packContent(offer({ size_qty: 1.5, size_unit: 'l', pack_count: 2 })), { qty: 3000, family: 'volume' });
  assert.equal(packContent(offer({ size_qty: null, size_unit: null })), null);
});

test('"1+1" doubles what the printed price buys', () => {
  assert.equal(bundleSize(offer({ promo: '1+1' })), 2);
  assert.equal(bundleSize(offer({ promo: '2+1 Free' })), 3);
  assert.equal(bundleSize(offer({ promo: null })), 1);
  assert.deepEqual(packContent(offer({ size_qty: 500, promo: '1+1' })), { qty: 1000, family: 'mass' });
});

test('discount percent comes only from a printed old price', () => {
  assert.equal(discountPercent(offer({ price: 15, was: 20 })), 25);
  assert.equal(discountPercent(offer({ was: null })), 0);
  assert.equal(discountPercent(offer({ price: 20, was: 15 })), 0);
});

test('unit price compares sizes per kilo or litre', () => {
  assert.equal(unitPrice(offer({ price: 10, size_qty: 500 })).value, 20);
  assert.equal(unitPrice(offer({ price: 12, size_qty: 1.5, size_unit: 'l', pack_count: 2 })).value, 4);
  assert.deepEqual(unitPrice(offer({ price: 7.95, sold_by: 'kg' })), { value: 7.95, per: 'kg' });
  assert.equal(unitPrice(offer({ size_qty: 30, size_unit: 'pcs' })), null);
});

test('packs are bought whole and never fewer than one', () => {
  const o = offer({ price: 16.99, was: 21.5, size_qty: 1000 });
  const one = purchase(o, { qty: 900, family: 'mass' });
  assert.equal(one.units, 1);
  assert.equal(one.cost, 1699);
  assert.equal(one.saved, 451);
  const three = purchase(o, { qty: 2001, family: 'mass' });
  assert.equal(three.units, 3);
  assert.equal(three.cost, 5097);
  assert.equal(three.saved, 1353);
  // An exact multiple must not round up to an extra pack.
  assert.equal(purchase(o, { qty: 2000, family: 'mass' }).units, 2);
});

test('loose produce is bought in quarter-kilo steps', () => {
  const o = offer({ price: 3.95, was: 5.95, sold_by: 'kg', size_qty: 1, size_unit: 'kg' });
  const half = purchase(o, { qty: 430, family: 'mass' });
  assert.equal(half.units, 0.5);
  assert.equal(half.cost, 198); // 3.95 × 0.5 = 1.975 → 198 halalas
  assert.equal(half.saved, 100);
  assert.equal(purchase(o, { qty: 100, family: 'mass' }).units, 0.25);
  assert.equal(purchase(o, { qty: 1000, family: 'mass' }).units, 1);
});

test('a need in the wrong kind of unit is flagged, not guessed', () => {
  const o = offer({ size_qty: 1000 });
  const result = purchase(o, { qty: 3, family: 'count' });
  assert.equal(result.units, 1);
  assert.equal(result.approx, true);
});

const plan = {
  id: 'p', name: 'خطة', base_persons: 4,
  meals: [
    { id: 'm1', name: 'كبسة دجاج', ingredients: [
      { name: 'دجاج', qty: 1100, unit: 'g', offer: 'chicken' },
      { name: 'أرز', qty: 600, unit: 'g', offer: 'rice' },
      { name: 'بصل', qty: 300, unit: 'g', offer: 'onion', display: '2 حبة متوسطة' },
      { name: 'بهارات كبسة', qty: 1, unit: 'tbsp', pantry: true },
      { name: 'طماطم', qty: 400, unit: 'g' }
    ] },
    { id: 'm2', name: 'مقلوبة', ingredients: [
      { name: 'دجاج', qty: 1100, unit: 'g', offer: 'chicken' },
      { name: 'أرز', qty: 500, unit: 'g', offer: 'rice' },
      { name: 'طماطم', qty: 200, unit: 'g' },
      { name: 'ملح', qty: 1, unit: 'tsp', pantry: true }
    ] }
  ],
  essentials: { name: 'أساسيات الفطور والعشاء', items: [{ name: 'بيض', qty: 30, unit: 'pcs', offer: 'eggs' }] }
};
const offers = mapOf([
  offer({ id: 'chicken', name: 'دجاج مبرد', price: 16.99, was: 21.5, size_qty: 1100 }),
  offer({ id: 'rice', name: 'أرز بسمتي', price: 35.99, was: 44.5, size_qty: 5, size_unit: 'kg', sold_by: 'bag', category: 'rice_grains' }),
  offer({ id: 'onion', name: 'بصل أحمر', price: 2.99, was: null, sold_by: 'kg', size_qty: 1, size_unit: 'kg' }),
  offer({ id: 'eggs', name: 'بيض', price: 13.99, was: 17.5, size_qty: 30, size_unit: 'pcs', sold_by: 'plate' })
]);

test('the shopping list adds the same item across meals', () => {
  const list = buildList({ plan, offers, persons: 4 });
  const byKey = Object.fromEntries(list.lines.map(line => [line.key, line]));
  assert.equal(byKey['o:chicken'].need.qty, 2200);
  assert.equal(byKey['o:chicken'].units, 2);
  assert.equal(byKey['o:chicken'].cost, 3398);
  assert.deepEqual(byKey['o:chicken'].sources, ['كبسة دجاج', 'مقلوبة']);
  assert.equal(byKey['o:rice'].units, 1);
  assert.equal(byKey['o:rice'].keeps, true);
  // 30 eggs for a week that needs 20 is not "keeps for more than a week".
  assert.equal(byKey['o:eggs'].keeps, false);
  assert.equal(byKey['o:onion'].units, 0.5);
  assert.equal(byKey['o:onion'].cost, 150); // 2.99 × 0.5 = 1.495 → 150
  assert.equal(byKey['o:eggs'].units, 1);
  // Items with no offer are listed but never priced.
  assert.deepEqual(list.unpriced.map(u => [u.name, u.need.qty]), [['طماطم', 600]]);
  assert.deepEqual(list.pantry.map(p => p.name).sort(), ['بهارات كبسة', 'ملح'].sort());
});

test('totals are the exact sum of the lines', () => {
  const list = buildList({ plan, offers, persons: 4 });
  const cost = list.lines.reduce((sum, line) => sum + line.cost, 0);
  const saved = list.lines.reduce((sum, line) => sum + line.saved, 0);
  assert.equal(list.totals.cost, cost);
  assert.equal(list.totals.saved, saved);
  assert.equal(list.totals.cost, 3398 + 3599 + 150 + 1399);
  assert.equal(list.totals.saved, 2 * 451 + 851 + 0 + 351);
  assert.equal(list.totals.before, list.totals.cost + list.totals.saved);
  assert.equal(list.totals.items, 4);
});

test('quantities scale with the family size', () => {
  const two = buildList({ plan, offers, persons: 2 });
  const eight = buildList({ plan, offers, persons: 8 });
  const units = (list, key) => list.lines.find(line => line.key === key).units;
  assert.equal(units(two, 'o:chicken'), 1);
  assert.equal(units(eight, 'o:chicken'), 4);
  assert.equal(units(eight, 'o:eggs'), 2);
  assert.ok(eight.totals.cost > two.totals.cost);
});

test('skipping a meal or the essentials removes their items', () => {
  const list = buildList({ plan, offers, persons: 4, skipped: new Set(['m2']), essentials: false });
  const keys = list.lines.map(line => line.key).sort();
  assert.deepEqual(keys, ['o:chicken', 'o:onion', 'o:rice']);
  assert.equal(list.lines.find(line => line.key === 'o:chicken').units, 1);
  assert.deepEqual(list.pantry.map(p => p.name), ['بهارات كبسة']);
});

test('items added by hand from the deals are costed too', () => {
  const list = buildList({ plan, offers, persons: 4, extras: { eggs: 2, missing: 1 } });
  const extra = list.lines.find(line => line.key === 'x:eggs');
  assert.equal(extra.cost, 2798);
  assert.equal(extra.saved, 702);
  assert.equal(list.lines.filter(line => line.extra).length, 1);
});

test('a meal card highlights the saving on its main ingredient', () => {
  assert.equal(mealHighlight(plan.meals[0], offers).id, 'chicken');
  assert.equal(mealHighlight({ ingredients: [{ name: 'بصل', qty: 1, unit: 'kg', offer: 'onion' }] }, offers), null);
});

test('Arabic search ignores spelling variants', () => {
  assert.equal(normalizeAr('أَرُزّ  بسمتي'), 'ارز بسمتي');
  assert.equal(normalizeAr('جبنة'), normalizeAr('جبنه'));
  assert.ok(matches({ name: 'جبنة شيدر المراعي', name_en: 'Almarai Cheddar' }, 'جبنه المراعي'));
  assert.ok(matches({ name: 'جبنة شيدر', name_en: 'Almarai Cheddar' }, 'cheddar'));
  assert.ok(!matches({ name: 'جبنة شيدر', name_en: null }, 'لبنة'));
  assert.ok(matches({ name: 'أي شيء' }, ''));
});

test('money and amounts read the way a shopper expects', () => {
  assert.equal(money(1699), '16.99');
  assert.equal(money(1700), '17');
  assert.equal(money(halalas(0.5)), '0.50');
  assert.equal(amount({ qty: 2200, family: 'mass' }), '2.2 كجم');
  assert.equal(amount({ qty: 450, family: 'mass' }), '450 جم');
  assert.equal(amount({ qty: 1500, family: 'volume' }), '1.5 لتر');
  assert.equal(amount({ qty: 3, family: 'count' }), '3 حبة');
  assert.equal(ingredientAmount({ qty: 300, unit: 'g', display: '2 حبة متوسطة' }, 1), '2 حبة متوسطة');
  assert.equal(ingredientAmount({ qty: 300, unit: 'g', display: '2 حبة متوسطة' }, 2), '600 جم');
  assert.equal(ingredientAmount({ qty: 1, unit: 'tbsp' }, 1.5), '1.5 ملعقة كبيرة');
  assert.equal(ingredientAmount({ qty: 0, unit: 'taste' }, 1), 'حسب الرغبة');
});

test('fresh food is never marked as lasting beyond the week', () => {
  const single = (category, sizeQty) => buildList({
    plan: { base_persons: 4, meals: [{ id: 'm', name: 'طبخة', ingredients: [{ name: 'صنف', qty: 300, unit: 'g', offer: 'x' }] }] },
    offers: mapOf([offer({ id: 'x', price: 5, was: null, size_qty: sizeQty, size_unit: 'g', category })]),
    persons: 4,
    essentials: false
  }).lines[0];
  assert.equal(single('produce_veg', 2000).keeps, false);
  assert.equal(single('rice_grains', 2000).keeps, true);
  assert.equal(single('rice_grains', 600).keeps, false);
});
