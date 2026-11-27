/*
 * مقاضي — the whole weekly update in one command
 *
 *   node tools/maqadi/weekly.mjs            # this week, in Riyadh
 *   node tools/maqadi/weekly.mjs 2026-12-02 # the week containing that date
 *
 * 1. Works out the ISO week and creates weeks/<week>/meta.json if needed,
 *    with Tamimi as the store the plans are costed at.
 * 2. Reads Tamimi's weekly-offers listing and fresh produce (fetch-tamimi.mjs)
 *    and Panda's whole catalogue (fetch-panda.mjs).
 * 3. Builds the published data and chooses the plans (build-data.mjs).
 * 4. Keeps only the two most recent weeks; older ones stay in git history.
 * Exits non-zero if any step fails, so a scheduled run reports the failure.
 */
import { readdirSync, existsSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const KEEP_WEEKS = 2;

export function riyadhDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(now);
}

/* ISO-8601 week: weeks start on Monday; week 1 holds the year's first Thursday. */
export function isoWeek(isoDate) {
  const date = new Date(isoDate + 'T00:00:00Z');
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const year = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(year, 0, 4));
  const week = 1 + Math.round(((date - firstThursday) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return { year, week, id: `${year}-W${String(week).padStart(2, '0')}`, dir: `${year}-w${String(week).padStart(2, '0')}` };
}

export function metaFor(weekId, today) {
  return {
    week: weekId,
    city: 'riyadh',
    updated: today,
    plan_stores: ['panda', 'tamimi'],
    publish_all: true,
    stores: {
      panda: {
        prefix: 'pd',
        name: 'بنده',
        source: 'متجر بنده الإلكتروني (كل الأقسام)',
        source_url: 'https://panda.sa/ar',
        checked: today
      },
      tamimi: {
        prefix: 'tm',
        name: 'التميمي',
        source: 'متجر التميمي الإلكتروني: العروض الأسبوعية والخضار والفواكه',
        source_url: 'https://www.tamimimarkets.com/tag/Weekly%20Offers',
        checked: today
      }
    },
    corrections: {},
    drop: []
  };
}

const weekDirs = base => (existsSync(base) ? readdirSync(base).filter(name => /^\d{4}-w\d{2}$/.test(name)).sort() : []);

function main() {
  const today = process.argv[2] || riyadhDate();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today)) { console.error('usage: node tools/maqadi/weekly.mjs [YYYY-MM-DD]'); process.exit(2); }
  const week = isoWeek(today);
  const weekDir = join(ROOT, 'tools/maqadi/weeks', week.dir);
  const metaPath = join(weekDir, 'meta.json');
  mkdirSync(weekDir, { recursive: true });
  if (existsSync(metaPath)) {
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    Object.values(meta.stores).forEach(store => { if (store.checked) store.checked = today; });
    meta.updated = today;
    writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
  } else {
    writeFileSync(metaPath, JSON.stringify(metaFor(week.id, today), null, 2) + '\n');
  }
  console.log(`week ${week.id} (${today})`);

  const run = script => execFileSync(process.execPath, [join(ROOT, 'tools/maqadi', script), week.dir], { stdio: 'inherit' });
  run('fetch-tamimi.mjs');
  run('fetch-panda.mjs');
  run('build-data.mjs');

  for (const base of [join(ROOT, 'tools/maqadi/weeks'), join(ROOT, 'maqadi/data')]) {
    const dirs = weekDirs(base);
    dirs.slice(0, Math.max(0, dirs.length - KEEP_WEEKS)).forEach(name => {
      rmSync(join(base, name), { recursive: true, force: true });
      console.log(`removed old week ${name} from ${base.replace(ROOT + '/', '')}`);
    });
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
