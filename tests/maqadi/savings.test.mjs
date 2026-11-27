import test from 'node:test';
import assert from 'node:assert/strict';
import { tripRecord, tripSaving, saveTrip, savingsSummary } from '../../maqadi/lib/savings.js';
import { receiptRows } from '../../maqadi/lib/receipt.js';

// Lines as buildList() gives them; money in halalas.
const line = (key, name, cost, saved = 0) => ({ key, name, cost, saved, offer: { id: key, store: 'x' }, extra: false });
const panda = { lines: [line('p1', 'دجاج', 2998, 1400), line('p2', 'أرز', 3399, 2351), line('p3', 'بيض', 1699, 500)], totals: { cost: 8096 } };
const tamimi = { lines: [line('t1', 'دجاج', 2798), line('t2', 'أرز', 3199), line('t3', 'بيض', 998)], totals: { cost: 6995 } };
const columns = [{ id: 'panda', list: panda, fair: true }, { id: 'tamimi', list: tamimi, fair: true }];
const receipt = { columns, rows: receiptRows(columns) };

test('a shop counts only what was ticked as bought', () => {
  const record = tripRecord({ week: '2026-W48', store: 'panda', date: '2026-11-27', list: panda, checked: ['p1', 'p3'], receipt });
  assert.equal(record.items, 2);
  assert.equal(record.expected, 2998 + 1699);
  assert.equal(record.offers, 1400 + 500);
  assert.equal(record.paid, null);
});

test('the store saving is what the same items cost more elsewhere, never below zero', () => {
  // At Tamimi the chicken and the eggs cost less, so shopping them at Panda saved nothing.
  assert.equal(tripRecord({ week: 'w', store: 'panda', date: '2026-11-27', list: panda, checked: ['p1', 'p3'], receipt }).store_saving, 0);
  // Shopping at Tamimi: the same three items would have cost 200 + 200 + 701 more at Panda.
  const there = [{ id: 'tamimi', list: tamimi, fair: true }, { id: 'panda', list: panda, fair: true }];
  const record = tripRecord({ week: 'w', store: 'tamimi', date: '2026-11-27', list: tamimi, checked: ['t1', 't2', 't3'], receipt: { columns: there, rows: receiptRows(there) } });
  assert.equal(record.store_saving, 200 + 200 + 701);
  assert.equal(tripSaving(record), record.offers + 1101);
});

test('with one store there is no store saving, and a typed amount is kept', () => {
  const record = tripRecord({ week: 'w', store: 'panda', date: '2026-11-27', list: panda, checked: ['p1'], receipt: { columns: columns.slice(0, 1), rows: [] }, paid: 2950 });
  assert.equal(record.store_saving, 0);
  assert.equal(record.paid, 2950);
});

test('a second shop at the same store in the same week replaces the first', () => {
  const a = { week: '2026-W47', store: 'panda', date: '2026-11-20', offers: 100, store_saving: 0, expected: 1000, paid: null };
  const b = { week: '2026-W48', store: 'panda', date: '2026-11-27', offers: 200, store_saving: 50, expected: 1000, paid: null };
  const again = Object.assign({}, b, { offers: 300 });
  assert.deepEqual(saveTrip(saveTrip(saveTrip([], b), a), again).map(r => [r.week, r.offers]), [['2026-W47', 100], ['2026-W48', 300]]);
});

test('the month adds up its shops and compares with the month before', () => {
  const history = [
    { week: '2026-W44', store: 'panda', date: '2026-10-30', offers: 5000, store_saving: 0, expected: 20000, paid: null },
    { week: '2026-W45', store: 'panda', date: '2026-11-06', offers: 6120, store_saving: 0, expected: 19000, paid: 18800 },
    { week: '2026-W46', store: 'tamimi', date: '2026-11-13', offers: 7000, store_saving: 835, expected: 21000, paid: null },
    { week: '2026-W48', store: 'panda', date: '2026-11-27', offers: 8452, store_saving: 0, expected: 19239, paid: 19000 }
  ];
  const s = savingsSummary(history, '2026-11');
  assert.equal(s.total, 6120 + 7835 + 8452);
  assert.equal(s.offers, 6120 + 7000 + 8452);
  assert.equal(s.store, 835);
  assert.deepEqual(s.trips.map(t => t.saving), [6120, 7835, 8452]);
  assert.equal(s.previous, 5000);
  assert.deepEqual(s.paid, { paid: 18800 + 19000, expected: 19000 + 19239 });
  assert.deepEqual(s.all, { total: 5000 + 6120 + 7835 + 8452, trips: 4, since: '2026-10-30' });
  assert.equal(savingsSummary(history, '2027-01').previous, 0);
  assert.equal(savingsSummary([], '2026-11').all.since, null);
});
