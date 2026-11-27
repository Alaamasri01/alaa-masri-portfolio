import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArabicSize, toOffers, categoryFromSlug, readPage } from '../../tools/maqadi/fetch-panda.mjs';

test('Arabic sizes the store prints', () => {
  assert.deepEqual(parseArabicSize('125', 'جرام'), { qty: 125, unit: 'g' });
  assert.deepEqual(parseArabicSize('1.8', 'كيلو جرام'), { qty: 1.8, unit: 'kg' });
  assert.deepEqual(parseArabicSize('1', 'لتر'), { qty: 1, unit: 'l' });
  assert.deepEqual(parseArabicSize('500', 'مل'), { qty: 500, unit: 'ml' });
  assert.deepEqual(parseArabicSize('6', 'حبات'), { qty: 6, unit: 'pcs' });
  assert.equal(parseArabicSize('1', 'صندوق كبير'), null);
  assert.equal(parseArabicSize('', 'جرام'), null);
});

test('weighed produce is priced per kilo; only real discounts keep an old price', () => {
  const offers = toOffers([
    { name: 'بصل أحمر طازج', varieties: [{ id: 1, price: '3.99', size: '0.5', unit: 'كجم', wighted: true, undiscounted_price: '5.99', barcode: '2552210000000' }] },
    { name: 'حليب طازج', brand: { name: 'المراعي' }, varieties: [{ id: 2, price: '6.50', size: '1', unit: 'لتر', wighted: false, undiscounted_price: null, barcode: '6281007025344' }] },
    { name: 'بلا سعر', varieties: [{ id: 3, price: '0', size: '1', unit: 'لتر' }] }
  ], 'fruits-and-vegetables-352');
  assert.equal(offers.length, 2);
  assert.deepEqual([offers[0].sold_by, offers[0].size_qty, offers[0].size_unit, offers[0].price, offers[0].was, offers[0].barcode], ['kg', 1, 'kg', 3.99, 5.99, null]);
  assert.deepEqual([offers[1].size_qty, offers[1].size_unit, offers[1].was, offers[1].barcode, offers[1].brand], [1, 'l', null, '6281007025344', 'المراعي']);
  assert.equal(offers[0].category, 'produce_veg');
});

test('aisles are read from the category slug', () => {
  assert.equal(categoryFromSlug('fruits-and-vegetables-352', 'تفاح جالا'), 'produce_fruit');
  assert.equal(categoryFromSlug('fruits-and-vegetables-352', 'خيار طازج'), 'produce_veg');
  assert.equal(categoryFromSlug('rice-and-grains-368'), 'rice_grains');
  assert.equal(categoryFromSlug('laundry-411'), 'household');
  assert.equal(categoryFromSlug('dairy-and-eggs-356', 'بيض أبيض طازج 30 حبة'), 'eggs');
  assert.equal(categoryFromSlug('dairy-and-eggs-356', 'حليب طازج كامل الدسم'), 'dairy_milk');
  assert.equal(categoryFromSlug('dairy-and-eggs-356', 'لبن زبادي'), 'dairy_yogurt_labneh');
  assert.equal(categoryFromSlug('meat-and-poultry-353', 'صدور دجاج طازجة'), 'poultry');
  assert.equal(categoryFromSlug('meat-and-poultry-353', 'لحم عجل مفروم'), 'meat');
  assert.equal(categoryFromSlug('hair-care-406', 'شامبو'), 'personal_care');
  assert.equal(categoryFromSlug('food-basics-466', 'المهباج عدس أحمر 800 جم'), 'legumes_nuts');
  assert.equal(categoryFromSlug('food-basics-466', 'صلصة طماطم'), 'sauces_condiments');
  assert.equal(categoryFromSlug('diapers-and-pants-400', 'حفاضات'), 'baby');
});

test('a page without products is reported, not guessed', () => {
  assert.deepEqual(readPage('<html></html>'), { products: [], count: null });
});

test('frozen produce is told apart from fresh by its parent aisle', () => {
  const [fresh, frozen] = toOffers([
    { name: 'بامية طازجة', category: { id: 352, parent: 311 }, varieties: [{ id: 1, price: '9', size: '0.5', unit: 'كجم', wighted: true }] },
    { name: 'خضار مشكلة', category: { id: 362, parent: 211 }, varieties: [{ id: 2, price: '6', size: '400', unit: 'جرام' }] }
  ], 'fruits-and-vegetables-352');
  assert.equal(fresh.category, 'produce_veg');
  assert.equal(frozen.category, 'frozen_veg');
});
