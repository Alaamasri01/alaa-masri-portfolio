/*
 * The week's receipt: every item on the list priced at each store that has
 * the same week, so the shopper sees item by item where it costs less, and
 * which store's whole list is cheapest.
 *
 * A column is { id, list, fair }: a store, its buildList() result, and
 * whether its list can be compared with the others (the same items priced,
 * every hand-added product found there). The shopper's own store comes first.
 */

/* What makes lines at two stores the same row: a planned ingredient goes by
   its name, since every store cooks the same meals; a hand-added product by
   the product match the data carries, or by its own id when nothing matches. */
const rowKey = line => (line.extra ? 'x:' + (line.offer.same || line.offer.store + ':' + line.offer.id) : 'i:' + line.name);

/* One row per item: its cost at each store (null where the store does not
   have it) and the store where it is cheapest, -1 when fewer than two stores
   price it or the lowest price is shared. The biggest differences come first. */
export function receiptRows(columns) {
  const rows = new Map();
  columns.forEach((column, at) => {
    column.list.lines.forEach(line => {
      const key = rowKey(line);
      let row = rows.get(key);
      if (!row) {
        row = { key, line, costs: columns.map(() => null) };
        rows.set(key, row);
      }
      row.costs[at] = (row.costs[at] || 0) + line.cost;
    });
  });
  return Array.from(rows.values()).map(row => {
    const priced = row.costs.filter(cost => cost !== null);
    const low = Math.min(...priced);
    const shared = row.costs.filter(cost => cost === low).length > 1;
    return {
      key: row.key,
      line: row.line,
      costs: row.costs,
      cheapest: priced.length > 1 && !shared ? row.costs.indexOf(low) : -1,
      spread: priced.length > 1 ? Math.max(...priced) - low : 0
    };
  }).sort((a, b) => b.spread - a.spread || (b.costs[0] === null ? -1 : b.costs[0]) - (a.costs[0] === null ? -1 : a.costs[0]));
}

/* The stamp: the store whose whole list costs least and by how much it beats
   the next one. Nothing when there is one store, any comparison is not fair,
   or the cheapest two cost the same. */
export function receiptVerdict(columns) {
  if (columns.length < 2 || columns.some(column => !column.fair)) return null;
  const sorted = columns.slice().sort((a, b) => a.list.totals.cost - b.list.totals.cost);
  const by = sorted[1].list.totals.cost - sorted[0].list.totals.cost;
  return by > 0 ? { id: sorted[0].id, by } : null;
}
