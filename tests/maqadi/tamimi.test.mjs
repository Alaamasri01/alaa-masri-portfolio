import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSize, categoryOf, toOffers, readPage } from '../../tools/maqadi/fetch-tamimi.mjs';

test('sizes in the forms the store prints', () => {
  assert.deepEqual(parseSize('500 G'), { qty: 500, unit: 'g', count: 1 });
  assert.deepEqual(parseSize('95g'), { qty: 95, unit: 'g', count: 1 });
  assert.deepEqual(parseSize('5 x 13g'), { qty: 13, unit: 'g', count: 5 });
  assert.deepEqual(parseSize('6 X 200 ML'), { qty: 200, unit: 'ml', count: 6 });
  assert.deepEqual(parseSize('1.5 L'), { qty: 1.5, unit: 'l', count: 1 });
  assert.deepEqual(parseSize('1 pc'), { qty: 1, unit: 'pcs', count: 1 });
  assert.deepEqual(parseSize('6 pcs - 240g'), { qty: 6, unit: 'pcs', count: 1 });
  assert.deepEqual(parseSize('16.3oz'), { qty: 462, unit: 'g', count: 1 });
  assert.equal(parseSize('Family pack'), null);
  assert.equal(parseSize(''), null);
});

test('departments map to the app categories', () => {
  const p = (department, sub, parent, nameEn = '') => ({ departmentName: department, subDepartmentName: sub, parentCategoryName: parent, nameEn });
  assert.equal(categoryOf(p('FRESH', 'FRUITS & VEGETABLES', 'VEGETABLES', 'Okra')), 'produce_veg');
  assert.equal(categoryOf(p('FRESH', 'FRUITS & VEGETABLES', 'FRUITS', 'Apple Gala')), 'produce_fruit');
  assert.equal(categoryOf(p('FOOD & BEVERAGES', 'BREAKFAST', 'Cereals & Granola Bars')), 'breakfast_spreads');
  assert.equal(categoryOf(p('FOOD & BEVERAGES', 'SNACKS & CONFECTIONERY', 'CHOCOLATES')), 'dates_sweets');
  assert.equal(categoryOf(p('FOOD & BEVERAGES', '', '')), 'other');
  assert.equal(categoryOf(p('FRESH', 'DAIRY', 'CHEESE & BUTTER', 'Unsalted Butter')), 'butter_cream');
  assert.equal(categoryOf(p('FRESH', 'DAIRY', 'CHEESE & BUTTER', 'Cheddar Slices')), 'dairy_cheese');
  assert.equal(categoryOf(p('FRESH', 'DAIRY', 'MILK & LABAN', 'Fresh Milk Full Fat')), 'dairy_milk');
  assert.equal(categoryOf(p('FRESH', 'DELI', 'COLD CUTS', 'Turkey Breast')), 'meat');
  assert.equal(categoryOf(p('FRESH', 'BAKERY', 'CAKES, COOKIES, & PIES')), 'bakery');
  assert.equal(categoryOf(p('FROZEN', 'FROZEN FOOD', 'FROZEN VEGETABLES', 'Green Peas')), 'frozen_veg');
  assert.equal(categoryOf(p('HEALTH & BEAUTY', 'HAIR CARE', 'SHAMPOO')), 'personal_care');
  assert.equal(categoryOf(p('HEALTHY LIVING', 'GROCERY', 'ORGANIC FOOD', 'Organic Basmati Rice')), 'rice_grains');
});

test('active variants become prices; only real discounts carry an old price', () => {
  const offers = toOffers([{
    nameEn: 'Fresh Milk', nameAr: 'حليب طازج', brandName: 'Almarai', departmentName: 'FRESH', subDepartmentName: 'DAIRY', parentCategoryName: 'MILK & LABAN',
    variants: [
      { variantId: 'A', variantEn: '2 L', price: 10.5, oldPrice: 12, hasOffer: true, inStock: true },
      { variantId: 'B', variantEn: '1 L', price: 6, oldPrice: null, hasOffer: false },
      { variantId: 'C', variantEn: '4 x 1 L', price: 20, oldPrice: 19, hasOffer: true },
      { variantId: 'D', variantEn: '200 ML', price: 1, oldPrice: 1.5, hasOffer: true, isActive: false }
    ]
  }]);
  assert.deepEqual(offers.map(o => [o.source_id, o.size_qty, o.size_unit, o.pack_count, o.price, o.was]), [
    ['A', 2, 'l', 1, 10.5, 12],
    ['B', 1, 'l', 1, 6, null],
    ['C', 1, 'l', 4, 20, null]
  ]);
  assert.equal(offers[0].category, 'dairy_milk');
});

test('pet supplies and toys are left out', () => {
  const offers = toOffers([
    { nameEn: 'Cat Food', departmentName: 'PETS', subDepartmentName: 'FOOD', parentCategoryName: 'CAT', variants: [{ variantId: 'P', variantEn: '400 G', price: 5, oldPrice: 7, hasOffer: true }] },
    { nameEn: 'Guitar Game', departmentName: 'HOUSEHOLD', subDepartmentName: 'TOYS, STATIONERY & TRAVEL', parentCategoryName: 'TOYS & PARTY GOODS', variants: [{ variantId: 'T', variantEn: '1 pc', price: 15, oldPrice: 18, hasOffer: true }] }
  ]);
  assert.equal(offers.length, 0);
});


test('a page without product data is reported, not guessed', () => {
  assert.equal(readPage('<html><body>maintenance</body></html>'), null);
});

test('weeks are numbered the ISO way, as the data folders are', async () => {
  const { isoWeek } = await import('../../tools/maqadi/weekly.mjs');
  assert.equal(isoWeek('2026-11-27').id, '2026-W48');
  assert.equal(isoWeek('2026-11-23').id, '2026-W48');
  assert.equal(isoWeek('2026-11-22').id, '2026-W47');
  assert.equal(isoWeek('2026-12-02').id, '2026-W49');
  assert.equal(isoWeek('2027-01-01').id, '2026-W53');
  assert.equal(isoWeek('2027-01-04').id, '2027-W01');
  assert.equal(isoWeek('2026-11-27').dir, '2026-w48');
});
