/*
 * The savings counter. Each finished shop (store mode's "done") is kept on
 * the phone as one record; the counter adds the records up by month.
 * Money is in halalas.
 *
 * Only what the shopper ticked as bought counts, and two kinds of saving are
 * kept apart:
 *   offers   what the stores' discounts took off those items;
 *   store    how much more the same items cost at the next-cheapest store,
 *            counted only on items both stores price, and never below zero.
 */

/* One finished shop. `receipt` is the list at every store (see receipt.js),
   the shopper's store first; `paid` is what they typed at the till, if anything. */
export function tripRecord({ week, store, date, list, checked, receipt, paid = null }) {
  const ticked = new Set(checked);
  const bought = list.lines.filter(line => ticked.has(line.key));
  const keys = new Set(bought.map(line => line.key));
  let storeSaving = 0;
  if (receipt && receipt.columns.length > 1) {
    const leads = receipt.columns.slice(1).map((column, at) => receipt.rows.reduce((total, row) => {
      const here = row.costs[0];
      const there = row.costs[at + 1];
      if (here === null || there === null || !keys.has(row.line.key)) return total;
      return total + there - here;
    }, 0));
    storeSaving = Math.max(0, Math.min(...leads));
  }
  return {
    week,
    store,
    date,
    items: bought.length,
    expected: bought.reduce((total, line) => total + line.cost, 0),
    offers: bought.reduce((total, line) => total + line.saved, 0),
    store_saving: storeSaving,
    paid: paid > 0 ? Math.round(paid) : null
  };
}

export const tripSaving = record => record.offers + record.store_saving;

/* Adds a record: a second shop at the same store in the same week replaces
   the first. Oldest first, at most two years of weekly shops. */
export function saveTrip(history, record) {
  return (history || [])
    .filter(old => !(old.week === record.week && old.store === record.store))
    .concat(record)
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(-104);
}

const monthOf = date => date.slice(0, 7);
const previousMonth = month => {
  const [year, number] = month.split('-').map(Number);
  return number === 1 ? `${year - 1}-12` : `${year}-${String(number - 1).padStart(2, '0')}`;
};

/* The counter for one month ('2026-11'): its total and the parts it is made
   of, each shop in it, the month before for comparison, and everything since
   the first shop. `paid` compares what was paid with what was expected, over
   the shops where the shopper typed what they paid. */
export function savingsSummary(history, month) {
  const records = history || [];
  const inMonth = records.filter(record => monthOf(record.date) === month);
  const total = list => list.reduce((sum, record) => sum + tripSaving(record), 0);
  const withPaid = inMonth.filter(record => record.paid !== null && record.paid !== undefined);
  return {
    month,
    total: total(inMonth),
    offers: inMonth.reduce((sum, record) => sum + record.offers, 0),
    store: inMonth.reduce((sum, record) => sum + record.store_saving, 0),
    trips: inMonth.map(record => ({ week: record.week, store: record.store, date: record.date, saving: tripSaving(record) })),
    previous: total(records.filter(record => monthOf(record.date) === previousMonth(month))),
    paid: withPaid.length ? { paid: withPaid.reduce((sum, record) => sum + record.paid, 0), expected: withPaid.reduce((sum, record) => sum + record.expected, 0) } : null,
    all: { total: total(records), trips: records.length, since: records.length ? records[0].date : null }
  };
}
