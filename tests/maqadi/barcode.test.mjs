import test from 'node:test';
import assert from 'node:assert/strict';
import { checkDigit, validGtin, canonicalGtin, pandaGtin } from '../../tools/maqadi/barcode.mjs';
import { sameSize, sameProducts } from '../../tools/maqadi/build-data.mjs';

test('the GS1 check digit', () => {
  assert.equal(checkDigit('628100707475'), '9');   // Almarai burger slices
  assert.equal(checkDigit('01200005577'), '5');    // a UPC-A body
  assert.ok(validGtin('6281007074759'));
  assert.ok(!validGtin('6281007074750'));
  assert.ok(!validGtin('8001'));
});

test('one spelling per barcode; store-only codes are dropped', () => {
  assert.equal(canonicalGtin('6281007074759'), '6281007074759');
  assert.equal(canonicalGtin('012000055775'), '0012000055775');
  assert.equal(canonicalGtin('06281007074759'), '6281007074759');
  assert.equal(canonicalGtin('208001000009'), null);    // weighed produce, UPC range 2
  assert.equal(canonicalGtin('2800003697751'), null);   // in-store EAN-13
  assert.equal(canonicalGtin('6281007074750'), null);   // wrong check digit
});

test("Panda's codes get their check digit back", () => {
  assert.equal(pandaGtin('6281007074750'), '6281007074759');
  assert.equal(pandaGtin('6281007074759'), '6281007074759');   // already right
  assert.equal(pandaGtin('440004293950'), canonicalGtin('44000429395' + checkDigit('44000429395')));
  assert.equal(pandaGtin('2552210000000'), null);
  assert.equal(pandaGtin('6281007074751'), null);   // neither right nor the 0 habit
});

const offer = (id, store, size_qty, size_unit, pack_count, barcodes) => ({ id, store, name: id, size_qty, size_unit, pack_count, barcodes });

test('a barcode match must agree on the whole pack', () => {
  assert.ok(sameSize(offer('a', 'panda', 200, 'g', 1), offer('b', 'tamimi', 200, 'g', 1)));
  assert.ok(sameSize(offer('a', 'panda', 1, 'l', 1), offer('b', 'tamimi', 1000, 'ml', 1)));
  assert.ok(!sameSize(offer('a', 'panda', 90, 'g', 1), offer('b', 'tamimi', 85, 'g', 1)));
  assert.ok(!sameSize(offer('a', 'panda', 495, 'ml', 1), offer('b', 'tamimi', 495, 'ml', 12)));
  assert.ok(!sameSize(offer('a', 'panda', null, null, 1), offer('b', 'tamimi', 200, 'g', 1)));
});

test('the same product is joined across stores, never within one', () => {
  const offers = [
    offer('p1', 'panda', 200, 'g', 1, ['111']),
    offer('t1', 'tamimi', 200, 'g', 1, ['222', '111']),
    offer('p2', 'panda', 495, 'ml', 1, ['333']),
    offer('t2', 'tamimi', 495, 'ml', 12, ['444', '333']),   // the multipack lists the single's code
    offer('p3', 'panda', 1, 'l', 1, ['555']),
    offer('p4', 'panda', 1, 'l', 1, ['555'])                 // two listings at one store only
  ];
  const result = sameProducts(offers);
  assert.equal(result.matched, 1);
  assert.equal(offers[0].same, '111');
  assert.equal(offers[1].same, '111');
  assert.equal(offers[2].same, undefined);
  assert.equal(offers[3].same, undefined);
  assert.equal(offers[4].same, undefined);
});
