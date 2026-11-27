import test from 'node:test';
import assert from 'node:assert/strict';
import { ramadanOn, ramadanPreview, RAMADAN, STOCKUP_DAYS } from '../../maqadi/lib/season.js';

const table = [{ start: '2027-02-08', end: '2027-03-09' }];

test('most of the year is no season', () => {
  assert.equal(ramadanOn('2026-11-27', table), null);
  assert.equal(ramadanOn('2027-01-24', table), null);
  assert.equal(ramadanOn('2027-03-10', table), null);
});

test('the two weeks before Ramadan count down to it', () => {
  assert.deepEqual(ramadanOn('2027-01-25', table), { phase: 'before', daysLeft: STOCKUP_DAYS, start: '2027-02-08', end: '2027-03-09' });
  assert.equal(ramadanOn('2027-02-07', table).daysLeft, 1);
});

test('in Ramadan, the day of the month', () => {
  assert.equal(ramadanOn('2027-02-08', table).phase, 'during');
  assert.equal(ramadanOn('2027-02-08', table).day, 1);
  assert.equal(ramadanOn('2027-03-09', table).day, 30);
});

test('a preview shows the next Ramadan', () => {
  assert.equal(ramadanPreview('before', '2026-11-27', table).daysLeft, 73);
  assert.equal(ramadanPreview('during', '2026-11-27', table).day, 3);
  assert.equal(ramadanPreview('other', '2026-11-27', table), null);
  assert.equal(ramadanPreview('during', '2030-01-01', table), null);
});

test('the dates are in order and a month long', () => {
  RAMADAN.forEach(month => {
    const days = (Date.parse(month.end) - Date.parse(month.start)) / 86400000 + 1;
    assert.ok(days === 29 || days === 30, month.start);
  });
});
