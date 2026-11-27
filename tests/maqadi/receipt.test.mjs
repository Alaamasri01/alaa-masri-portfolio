import test from 'node:test';
import assert from 'node:assert/strict';
import { receiptRows, receiptVerdict } from '../../maqadi/lib/receipt.js';

// Costs in halalas, as buildList() gives them.
const line = (name, cost, extra) => ({ name, cost, offer: Object.assign({ id: name + '-id', store: 'x' }, extra || {}), extra: Boolean(extra) });
const list = (lines) => ({ lines, totals: { cost: lines.reduce((sum, l) => sum + l.cost, 0) } });

const panda = list([line('دجاج كامل', 2998), line('أرز بسمتي', 3399), line('بيض', 1699), line('بصل', 499)]);
const tamimi = list([line('دجاج كامل', 2798), line('أرز بسمتي', 3199), line('بيض', 998), line('بصل', 499), line('ليمون', 348)]);
const columns = [{ id: 'panda', list: panda, fair: true }, { id: 'tamimi', list: tamimi, fair: true }];

test('the same ingredient at two stores is one row, the cheaper store marked', () => {
  const rows = receiptRows(columns);
  const chicken = rows.find(row => row.line.name === 'دجاج كامل');
  assert.deepEqual(chicken.costs, [2998, 2798]);
  assert.equal(chicken.cheapest, 1);
  assert.equal(chicken.spread, 200);
});

test('a shared lowest price marks no store', () => {
  const onion = receiptRows(columns).find(row => row.line.name === 'بصل');
  assert.deepEqual(onion.costs, [499, 499]);
  assert.equal(onion.cheapest, -1);
});

test('an item one store does not have is empty there and marks nothing', () => {
  const lemon = receiptRows(columns).find(row => row.line.name === 'ليمون');
  assert.deepEqual(lemon.costs, [null, 348]);
  assert.equal(lemon.cheapest, -1);
  assert.equal(lemon.spread, 0);
});

test('the biggest differences come first, then the dearest', () => {
  assert.deepEqual(receiptRows(columns).map(row => row.line.name), ['بيض', 'أرز بسمتي', 'دجاج كامل', 'بصل', 'ليمون']);
});

test('hand-added products meet across stores by their product match', () => {
  const a = list([line('شاي', 1500, { id: 'pd-1', store: 'panda', same: 'g6281' }), line('صابون', 900, { id: 'pd-2', store: 'panda' })]);
  const b = list([line('شاي ربيع', 1350, { id: 'tm-9', store: 'tamimi', same: 'g6281' })]);
  const rows = receiptRows([{ id: 'panda', list: a, fair: false }, { id: 'tamimi', list: b, fair: false }]);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0].costs, [1500, 1350]);
  assert.equal(rows[0].cheapest, 1);
  assert.deepEqual(rows[1].costs, [900, null]);
});

test('the stamp names the cheapest whole list and its lead', () => {
  assert.deepEqual(receiptVerdict(columns), { id: 'tamimi', by: (2998 + 3399 + 1699 + 499) - (2798 + 3199 + 998 + 499 + 348) });
});

test('no stamp for one store, an unfair comparison, or a tie', () => {
  assert.equal(receiptVerdict(columns.slice(0, 1)), null);
  assert.equal(receiptVerdict([columns[0], Object.assign({}, columns[1], { fair: false })]), null);
  assert.equal(receiptVerdict([columns[0], { id: 'tamimi', list: panda, fair: true }]), null);
});
