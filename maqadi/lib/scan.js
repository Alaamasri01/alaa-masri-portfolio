/*
 * What a scanned barcode is at each store. No DOM: the app and the tests
 * call the same function.
 *
 * `index` maps a barcode (as maqadi/lib/barcode.js spells it) to the ids of
 * the products that carry it. Two stores' products count as the same only
 * when the data build joined them (`same`), which also checks the pack
 * size; a product filed under the same code with a different size is shown
 * for what it is, without a comparison.
 */
const cheapest = list => list.slice().sort((a, b) => a.price - b.price)[0] || null;

export function lookupScan({ code, index, offers, stores, here, twin }) {
  const hits = (index[code] || []).map(id => offers.get(id)).filter(Boolean);
  if (!hits.length) return null;
  // The product as the shopper holds it: the one at their store, else one known elsewhere too.
  const product = cheapest(hits.filter(offer => offer.store === here))
    || cheapest(hits.filter(offer => offer.same))
    || cheapest(hits);

  const rows = stores.map(store => {
    if (store === product.store) return { store, offer: product, same: true };
    const match = twin(product, store);
    if (match) return { store, offer: match, same: true };
    const other = cheapest(hits.filter(offer => offer.store === store));
    return { store, offer: other, same: false };
  });

  // "Cheapest" only among the same product, and only when some store charges more.
  const compared = rows.filter(row => row.offer && row.same);
  const low = compared.length > 1 ? Math.min(...compared.map(row => row.offer.price)) : null;
  const high = compared.length > 1 ? Math.max(...compared.map(row => row.offer.price)) : null;
  rows.forEach(row => {
    row.here = row.store === here;
    row.cheapest = low !== null && low < high && row.same && Boolean(row.offer) && row.offer.price === low;
  });

  const best = rows.find(row => row.cheapest) || null;
  const mine = rows.find(row => row.here && row.offer && row.same) || null;
  const saving = best && mine && !mine.cheapest ? Math.round((mine.offer.price - best.offer.price) * 100) / 100 : 0;
  // Named and pictured as the shopper's own store lists it, when it sells the same product.
  return { code, product: mine ? mine.offer : product, rows, best, saving };
}
