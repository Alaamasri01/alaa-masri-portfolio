import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { upcEtoA, scannedGtin, canonicalGtin } from '../../maqadi/lib/barcode.js';
import { lookupScan } from '../../maqadi/lib/scan.js';

test('UPC-E codes are written out as their UPC-A', () => {
  assert.equal(upcEtoA('04252614'), '042100005264');   // GS1's worked example
  assert.equal(upcEtoA('01234565'), '012345000065');
  assert.equal(upcEtoA('12345678'), null);              // wrong check digit
  assert.equal(scannedGtin('04252614', 'upc_e'), canonicalGtin('042100005264'));
  assert.equal(scannedGtin(' 6281007074759 ', 'ean_13'), '6281007074759');
  assert.equal(scannedGtin('2800003697751', 'ean_13'), null);   // a store's own code
});

const offer = (id, store, price, extra = {}) => Object.assign({ id, store, name: id, price }, extra);
const setup = list => {
  const offers = new Map(list.map(o => [o.id, o]));
  const same = new Map();
  list.forEach(o => { if (o.same) { const k = o.store + '|' + o.same; if (!same.has(k) || o.price < same.get(k).price) same.set(k, o); } });
  return { offers, twin: (o, store) => (o.same ? same.get(store + '|' + o.same) || null : null) };
};

test('found at both stores: the cheaper one is marked and the saving counted', () => {
  const { offers, twin } = setup([offer('pd-1', 'panda', 49.99, { same: '5063305003386' }), offer('tm-1', 'tamimi', 32.99, { same: '5063305003386', was: 45.95 })]);
  const index = { '5063305003386': ['pd-1', 'tm-1'] };
  const r = lookupScan({ code: '5063305003386', index, offers, stores: ['panda', 'tamimi'], here: 'panda', twin });
  assert.equal(r.product.id, 'pd-1');
  assert.deepEqual(r.rows.map(row => [row.store, row.offer.id, row.here, row.cheapest]), [['panda', 'pd-1', true, false], ['tamimi', 'tm-1', false, true]]);
  assert.equal(r.saving, 17);
});

test('the same price at both stores: nobody is "cheapest"', () => {
  const { offers, twin } = setup([offer('pd-1', 'panda', 1.5, { same: 'x' }), offer('tm-1', 'tamimi', 1.5, { same: 'x' })]);
  const r = lookupScan({ code: 'x', index: { x: ['pd-1', 'tm-1'] }, offers, stores: ['panda', 'tamimi'], here: 'panda', twin });
  assert.ok(r.rows.every(row => !row.cheapest));
  assert.equal(r.saving, 0);
});

test('only at one store, or filed under the code with a different size', () => {
  const { offers, twin } = setup([offer('pd-1', 'panda', 9.99, { was: 12.99 }), offer('tm-9', 'tamimi', 70, {})]);
  const only = lookupScan({ code: 'c', index: { c: ['pd-1'] }, offers, stores: ['panda', 'tamimi'], here: 'panda', twin });
  assert.equal(only.rows[1].offer, null);
  assert.equal(only.best, null);
  const sized = lookupScan({ code: 'c', index: { c: ['pd-1', 'tm-9'] }, offers, stores: ['panda', 'tamimi'], here: 'panda', twin });
  assert.equal(sized.rows[1].offer.id, 'tm-9');
  assert.equal(sized.rows[1].same, false);
  assert.ok(sized.rows.every(row => !row.cheapest));
});

test('scanning at a store that does not sell it starts from the other store', () => {
  const { offers, twin } = setup([offer('tm-1', 'tamimi', 5)]);
  const r = lookupScan({ code: 'c', index: { c: ['tm-1'] }, offers, stores: ['panda', 'tamimi'], here: 'panda', twin });
  assert.equal(r.product.id, 'tm-1');
  assert.equal(r.rows[0].offer, null);
  assert.equal(lookupScan({ code: 'nope', index: {}, offers, stores: ['panda'], here: 'panda', twin }), null);
});

test('the published barcode lookup points only at published products', () => {
  const current = JSON.parse(readFileSync('maqadi/data/current.json', 'utf8'));
  const barcodes = JSON.parse(readFileSync('maqadi/data/' + current.barcodes, 'utf8'));
  const ids = new Set(JSON.parse(readFileSync('maqadi/data/' + current.offers, 'utf8')).offers.map(o => o.id));
  assert.equal(barcodes.week, current.week);
  assert.ok(barcodes.stores.length >= 1);
  const codes = Object.keys(barcodes.codes);
  assert.ok(codes.length > 1000);
  codes.forEach(code => { assert.equal(canonicalGtin(code), code); barcodes.codes[code].forEach(id => assert.ok(ids.has(id), id)); });
});

test("named as the shopper's store lists it, even when the code is the other store's", () => {
  const { offers, twin } = setup([offer('pd-1', 'panda', 49.99, { same: 'k' }), offer('tm-1', 'tamimi', 32.99, { same: 'k' })]);
  const r = lookupScan({ code: 'tamimi-only-code', index: { 'tamimi-only-code': ['tm-1'] }, offers, stores: ['panda', 'tamimi'], here: 'panda', twin });
  assert.equal(r.product.id, 'pd-1');
  assert.equal(r.rows[0].offer.id, 'pd-1');
  assert.equal(r.saving, 17);
});
