/*
 * The seasons the app dresses for. Ramadan's dates are the expected ones:
 * the month begins with the sighting of the crescent, so a day either way is
 * possible. The app and the weekly tools read them from here.
 */
export const RAMADAN = [
  { start: '2027-02-08', end: '2027-03-09' },
  { start: '2028-01-28', end: '2028-02-26' }
];

// The big Ramadan shop is offered this many days before the month.
export const STOCKUP_DAYS = 14;

const DAY_MS = 86400000;
const daysBetween = (from, to) => Math.round((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / DAY_MS);

/* What `today` (YYYY-MM-DD) is: { phase: 'before', daysLeft } in the two
   weeks before Ramadan, { phase: 'during', day } in it (day 1 is the first
   day), null the rest of the year. Both carry the month's start and end. */
export function ramadanOn(today, table = RAMADAN) {
  for (const month of table) {
    const until = daysBetween(today, month.start);
    if (until > 0 && until <= STOCKUP_DAYS) return { phase: 'before', daysLeft: until, start: month.start, end: month.end };
    if (until <= 0 && daysBetween(today, month.end) >= 0) return { phase: 'during', day: 1 - until, start: month.start, end: month.end };
  }
  return null;
}

/* For showing the season before it comes: `?ramadan=before` counts down to
   the next Ramadan from today, `?ramadan=during` is its third day. */
export function ramadanPreview(kind, today, table = RAMADAN) {
  const next = table.find(month => daysBetween(today, month.end) >= 0);
  if (!next) return null;
  if (kind === 'before') return { phase: 'before', daysLeft: Math.max(1, daysBetween(today, next.start)), start: next.start, end: next.end, preview: true };
  if (kind === 'during') return { phase: 'during', day: 3, start: next.start, end: next.end, preview: true };
  return null;
}
