/*
 * مقاضي — واجهة التطبيق / Maqadi — the app
 * One static page: it reads the week's offers and plans from data/ and keeps
 * the family's choices on the device. All arithmetic lives in lib/.
 * Every word on screen is written twice, L('عربي', 'English'), so the two
 * languages never drift apart.
 */
import { html, render, useState, useEffect, useMemo, useCallback, useRef } from './lib/htm-preact.js';
import {
  buildList, mealHighlight, discountPercent, unitPrice, normalizeAr, money, amount,
  ingredientAmount, offerSize, isLoose, halalas, purchase, toBase, setLang as setPlanLang
} from './lib/plan.js';
import { scannedGtin } from './lib/barcode.js';
import { lookupScan } from './lib/scan.js';
import { fitBudget, budgetBreakdown } from './lib/budget.js';
import { activePlan, portions, AVOID_FOODS, ALLERGIES } from './lib/prefs.js';
import { receiptRows, receiptVerdict } from './lib/receipt.js';
import { tripRecord, saveTrip, savingsSummary } from './lib/savings.js';
import { ramadanOn, ramadanPreview } from './lib/season.js';

/* ---------------------------------------------------------------------
   Language
   ------------------------------------------------------------------- */
let LANG = 'ar';
const L = (ar, en) => (LANG === 'en' ? en : ar);
const pl = (n, one, many) => n + ' ' + (n === 1 ? one : many);
// A product, meal, ingredient or cuisine in the reader's language, Arabic when there is no English.
const nm = item => (item ? (LANG === 'en' && item.name_en) || item.name : '');
const phoneLanguage = () => (/^ar\b/i.test((navigator.languages && navigator.languages[0]) || navigator.language || 'ar') ? 'ar' : 'en');

const CONFIG = {
  minPersons: 1,
  maxPersons: 12,
  minMeals: 3,
  maxMeals: 7,
  shopPage: 24,
  railSize: 12,
  /* Subscription. Off until a payment provider is connected: with
     `enabled: false` every meal is open. `?plus=preview` shows how the
     locked state will look without charging anyone. */
  plus: { enabled: false, freeMeals: 2, priceLabel: null, checkoutUrl: null }
};
const appName = () => L('مقاضي', 'Maqadi');

const AISLES = [
  { id: 'produce', name: 'خضار وفواكه', en: 'Fruit and vegetables', emoji: '🥦', categories: ['produce_veg', 'produce_fruit'] },
  { id: 'butcher', name: 'لحوم ودجاج وأسماك', en: 'Meat, chicken and fish', emoji: '🥩', categories: ['meat', 'poultry', 'fish'] },
  { id: 'dairy', name: 'ألبان وبيض', en: 'Dairy and eggs', emoji: '🥛', categories: ['eggs', 'dairy_milk', 'dairy_cheese', 'dairy_yogurt_labneh', 'butter_cream'] },
  { id: 'bakery', name: 'مخبوزات', en: 'Bakery', emoji: '🍞', categories: ['bakery'] },
  { id: 'frozen', name: 'مجمدات', en: 'Frozen', emoji: '🧊', categories: ['frozen_chicken', 'frozen_veg', 'frozen_other'] },
  { id: 'pantry', name: 'مؤونة', en: 'Pantry', emoji: '🫙', categories: ['rice_grains', 'pasta_noodles', 'flour_baking', 'oil_ghee', 'canned', 'sauces_condiments', 'spices', 'legumes_nuts', 'breakfast_spreads', 'dates_sweets', 'snacks'] },
  { id: 'drinks', name: 'مشروبات', en: 'Drinks', emoji: '🧃', categories: ['drinks_water', 'drinks_juice', 'tea_coffee'] },
  { id: 'home', name: 'المنزل والعناية', en: 'Home and personal care', emoji: '🧽', categories: ['household', 'personal_care', 'baby'] },
  { id: 'other', name: 'أخرى', en: 'Other', emoji: '🛒', categories: ['other'] }
];
const aisleOf = category => AISLES.find(aisle => aisle.categories.includes(category)) || AISLES[AISLES.length - 1];
const aisleName = aisle => L(aisle.name, aisle.en);
// Groceries come before the rest wherever the app suggests products.
const isFood = offer => !['home', 'other'].includes(aisleOf(offer.category).id);

const CATEGORIES = {
  produce_veg: ['خضار', 'Vegetables', '🥦'], produce_fruit: ['فواكه', 'Fruit', '🍎'], meat: ['لحوم', 'Meat', '🥩'],
  poultry: ['دجاج', 'Chicken', '🍗'], fish: ['أسماك', 'Fish', '🐟'], eggs: ['بيض', 'Eggs', '🥚'],
  dairy_milk: ['حليب', 'Milk', '🥛'], dairy_cheese: ['أجبان', 'Cheese', '🧀'], dairy_yogurt_labneh: ['لبن ولبنة', 'Yoghurt and labneh', '🥣'],
  butter_cream: ['زبدة وقشطة', 'Butter and cream', '🧈'], bakery: ['مخبوزات', 'Bakery', '🍞'], rice_grains: ['أرز وحبوب', 'Rice and grains', '🍚'],
  pasta_noodles: ['مكرونة', 'Pasta', '🍝'], flour_baking: ['طحين وسكر', 'Flour and sugar', '🌾'], oil_ghee: ['زيوت وسمن', 'Oil and ghee', '🫒'],
  canned: ['معلبات', 'Canned', '🥫'], sauces_condiments: ['صلصات', 'Sauces', '🍅'], spices: ['بهارات', 'Spices', '🌶️'],
  legumes_nuts: ['بقوليات ومكسرات', 'Pulses and nuts', '🫘'], frozen_chicken: ['دجاج مجمد', 'Frozen chicken', '🧊'],
  frozen_veg: ['خضار مجمدة', 'Frozen vegetables', '🫛'], frozen_other: ['مجمدات', 'Frozen', '🧊'], breakfast_spreads: ['فطور', 'Breakfast', '🍯'],
  drinks_water: ['مياه', 'Water', '💧'], drinks_juice: ['عصائر', 'Juice', '🧃'], tea_coffee: ['شاي وقهوة', 'Tea and coffee', '☕'],
  dates_sweets: ['تمور وحلويات', 'Dates and sweets', '🍫'], snacks: ['سناكات', 'Snacks', '🍪'], household: ['منظفات ومنزلية', 'Household', '🧽'],
  personal_care: ['عناية شخصية', 'Personal care', '🧴'], baby: ['أطفال', 'Baby', '🍼'], other: ['أخرى', 'Other', '🛒']
};
const categoryName = id => (CATEGORIES[id] ? L(CATEGORIES[id][0], CATEGORIES[id][1]) : id);
const categoryEmoji = id => (CATEGORIES[id] ? CATEGORIES[id][2] : '🛒');
const CUISINE_EMOJI = { khaliji: '🍛', shami: '🥙', quick: '🍳', healthy: '🥗', budget: '💰', ramadan: '🌙' };
const STORE_COLORS = { panda: '#e2231a', tamimi: '#f28c28', othaim: '#1f5fae' };
const STORE_EN = { panda: 'Panda', tamimi: 'Tamimi', othaim: 'Othaim' };

const SOLD_BY = {
  each: ['للحبة', 'each'], plate: ['للطبق', 'per tray'], kg: ['للكيلو', 'per kg'], pack: ['للعبوة', 'per pack'],
  carton: ['للكرتون', 'per carton'], bag: ['للكيس', 'per bag'], bunch: ['للحزمة', 'per bunch'], box: ['للعلبة', 'per box']
};
const soldBy = key => (SOLD_BY[key] ? L(SOLD_BY[key][0], SOLD_BY[key][1]) : '');
const NOTES = { 'selected branches': ['في فروع مختارة', 'selected branches'], 'Iktissab members': ['لأعضاء اكتساب', 'Iktissab members'] };
const noteText = note => (NOTES[note] ? L(NOTES[note][0], NOTES[note][1]) : note);

const TAG_INFO = {
  fish: { ar: 'سمك ومأكولات بحرية', en: 'Fish and seafood', short: ['بدون سمك', 'No fish'], emoji: '🐟' },
  red_meat: { ar: 'لحم أحمر', en: 'Red meat', short: ['بدون لحم أحمر', 'No red meat'], emoji: '🥩' },
  chicken: { ar: 'دجاج', en: 'Chicken', short: ['بدون دجاج', 'No chicken'], emoji: '🍗' },
  egg: { ar: 'بيض', en: 'Eggs', short: ['حساسية: بيض', 'Allergy: eggs'], emoji: '🥚' },
  dairy: { ar: 'حليب ومشتقاته', en: 'Milk and dairy', short: ['حساسية: ألبان', 'Allergy: dairy'], emoji: '🥛' },
  gluten: { ar: 'قمح (غلوتين)', en: 'Wheat (gluten)', short: ['حساسية: قمح', 'Allergy: wheat'], emoji: '🌾' },
  sesame: { ar: 'سمسم', en: 'Sesame', short: ['حساسية: سمسم', 'Allergy: sesame'] },
  nuts: { ar: 'مكسرات', en: 'Nuts', short: ['حساسية: مكسرات', 'Allergy: nuts'] }
};
const tagName = tag => L(TAG_INFO[tag].ar, TAG_INFO[tag].en);
const tagShort = tag => L(TAG_INFO[tag].short[0], TAG_INFO[tag].short[1]);

/* ---------------------------------------------------------------------
   Storage, dates, data
   ------------------------------------------------------------------- */
const STORAGE_KEY = 'maqadi:v1';
function readPrefs() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch (error) { return {}; }
}
function writePrefs(prefs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs)); } catch (error) { /* private mode: keep going in memory */ }
}

const riyadhToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh' }).format(new Date());
const formats = {};
const dateFormat = (key, options) => {
  const id = LANG + key;
  if (!formats[id]) formats[id] = new Intl.DateTimeFormat(LANG === 'en' ? 'en-GB' : 'ar-SA-u-ca-gregory-nu-latn', Object.assign({ timeZone: 'UTC' }, options));
  return formats[id];
};
const fromISO = iso => new Date(iso + 'T00:00:00Z');
const longDay = iso => dateFormat('long', { weekday: 'long', day: 'numeric', month: 'long' }).format(fromISO(iso));
const shortDay = iso => dateFormat('short', { day: 'numeric', month: 'long' }).format(fromISO(iso));

async function getJSON(path) {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(path + ' → ' + response.status);
  return response.json();
}
/* The app opens with a small file (core.json: what the plans buy and the home
   screen's deals); the whole catalogue (offers.json) follows in the background. */
async function loadData() {
  const current = await getJSON('data/current.json');
  const [offers, plans] = await Promise.all([getJSON('data/' + (current.core || current.offers)), getJSON('data/' + current.plans)]);
  return { current, offers, plans, full: !current.core };
}

const TABS = ['home', 'shop', 'list', 'plan', 'me'];
function parseRoute() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const first = parts[0] === 'deals' ? 'shop' : parts[0];
  const tab = TABS.concat('meal', 'scan', 'story', 'instore', 'savings', 'ramadan').includes(first) ? first : 'home';
  return { tab, id: parts[1] || null };
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const plusPreview = () => new URLSearchParams(window.location.search).get('plus') === 'preview';
const count = n => n.toLocaleString('en-US');
const riyal = () => L('ريال', 'SAR');

/* Fitting a week to a budget tries every swap; the answer is kept until something changes. */
let fitMemo = { key: null, value: null };
function memoFit(key, compute) {
  if (fitMemo.key !== key) fitMemo = { key, value: compute() };
  return fitMemo.value;
}

/* ---------------------------------------------------------------------
   Pictures
   ------------------------------------------------------------------- */
/* Tamimi's pack shots are 650 px PNGs of about 400 KB; on the live site they
   go through Vercel's resizer (see vercel.json). Panda's are already small. */
const RESIZED = /^https:\/\/ecommedia\.tamimimarkets\.com\//;
const canResize = window.location.protocol === 'https:' && !/^(localhost|127\.)/.test(window.location.hostname);
function photoUrl(data, offer, width) {
  if (!offer || !offer.img) return null;
  const store = data.offers.stores[offer.store] || {};
  const url = /^https:\/\//.test(offer.img) ? offer.img : (store.img_base || '') + offer.img;
  if (!/^https:\/\//.test(url)) return null;
  return canResize && RESIZED.test(url) ? `/_vercel/image?url=${encodeURIComponent(url)}&w=${width}&q=70` : url;
}

const emojiFile = char => 'emoji/' + Array.from(char).map(c => c.codePointAt(0).toString(16)).filter(cp => cp !== 'fe0f').join('-') + '.webp';
function Emoji({ char, size = 28 }) {
  const [broken, setBroken] = useState(false);
  if (!char) return null;
  if (broken) return html`<span class="emoji emoji--text" style=${'font-size:' + Math.round(size * 0.82) + 'px'} aria-hidden="true">${char}</span>`;
  return html`<img class="emoji" src=${emojiFile(char)} width=${size} height=${size} alt="" aria-hidden="true" decoding="async" onError=${() => setBroken(true)} />`;
}

/* A dish: its photo when every meal of the week has one (so photos and
   emoji never sit side by side), otherwise its emoji. `?photos=all` shows
   the photos there are, for previews. `fill` covers its box; otherwise the
   photo is a round plate of `size`. */
let MEAL_PHOTOS = false;
function MealArt({ meal, size = 84, fill = false }) {
  const [broken, setBroken] = useState(false);
  if (!MEAL_PHOTOS || !meal.photo || broken) return html`<${Emoji} char=${meal.emoji} size=${size} />`;
  return html`
    <span class=${'dish' + (fill ? ' dish--fill' : '')} style=${fill ? null : `width:${size}px;height:${size}px`}>
      <img src=${'meals/' + meal.photo} alt="" loading="lazy" decoding="async" onError=${() => setBroken(true)} />
    </span>`;
}

function Photo({ data, offer, width = 384, cls = 'photo' }) {
  const src = photoUrl(data, offer, width);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src || broken) {
    return html`<span class=${cls + ' photo--none'} aria-hidden="true"><${Emoji} char=${categoryEmoji(offer && offer.category)} size=${width > 200 ? 56 : 26} /></span>`;
  }
  return html`<img class=${cls} src=${src} alt="" loading="lazy" decoding="async" onError=${() => setBroken(true)} />`;
}

function Logo({ size = 40, glass = false }) {
  return html`
    <svg class="logo" width=${size} height=${size} viewBox="0 0 100 100" aria-hidden="true">
      ${glass
        ? html`<rect width="100" height="100" rx="24" fill="rgba(255,255,255,.16)" />`
        : html`<defs><linearGradient id="mq-logo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#17945a" /><stop offset="1" stop-color="#075233" /></linearGradient></defs><rect width="100" height="100" rx="24" fill="url(#mq-logo)" />`}
      <path d="M50 44C49 31 57 21 72 18c1 15-7 25-22 26Z" fill="#ffb020" />
      <path d="M50 44C51 34 45 26 33 24c-1 11 5 19 17 20Z" fill="#9be0b6" />
      <rect x="17" y="43" width="66" height="9" rx="4.5" fill="#fff" />
      <path d="M22 55h56l-5.4 23.5a6 6 0 0 1-5.8 4.5H33.2a6 6 0 0 1-5.8-4.5Z" fill="#fff" />
      <path d="M39 61v15M50 61v15M61 61v15" stroke="#0b6e45" stroke-width="4.5" stroke-linecap="round" />
    </svg>`;
}

/* ---------------------------------------------------------------------
   Small pieces
   ------------------------------------------------------------------- */
/* Maqadi's icons. Plain ones are one line path. The ones that carry the
   brand have three layers: a soft fill inside (stronger when selected), the
   line, and one gold touch from the logo's leaf. The basket is the logo's. */
const TAG_PATH = 'M3.5 11.8V5a1.5 1.5 0 0 1 1.5-1.5h6.8c.4 0 .8.2 1.1.4l7.6 7.6a1.5 1.5 0 0 1 0 2.1l-6.9 6.9a1.5 1.5 0 0 1-2.1 0L3.9 12.9a1.5 1.5 0 0 1-.4-1.1z';
const HOUSE_PATH = 'M4 10.6 12 4l8 6.6V19a1.6 1.6 0 0 1-1.6 1.6H5.6A1.6 1.6 0 0 1 4 19z';
const FAMILY = {
  fill: 'M3 20c.5-3.2 2.8-5 5.7-5s5.2 1.8 5.7 5zM15.2 20c.4-2.3 1.6-3.6 3.3-3.6 1.6 0 2.9 1.3 3.2 3.6z',
  line: 'M3 20c.5-3.2 2.8-5 5.7-5s5.2 1.8 5.7 5M8.7 12a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8ZM15.2 20c.4-2.3 1.6-3.6 3.3-3.6 1.6 0 2.9 1.3 3.2 3.6M18.5 14.2a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z'
};
const ICONS = {
  home: { fill: HOUSE_PATH, line: HOUSE_PATH + 'M10 20.6v-4.4a2 2 0 0 1 4 0v4.4', dot: [17.6, 5.2, 1.7] },
  shop: { fill: TAG_PATH, line: TAG_PATH + 'M10.2 15.6l4.4-4.4', dot: [7.8, 7.8, 1.6] },
  plan: { fill: 'M6.5 5h11a3 3 0 0 1 3 3v9.5a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3Z', line: 'M3.5 8a3 3 0 0 1 3-3h11a3 3 0 0 1 3 3v9.5a3 3 0 0 1-3 3h-11a3 3 0 0 1-3-3zM8 3v3.6M16 3v3.6M3.5 10h17M8.3 15.2h7.4a3.7 3.7 0 0 1-7.4 0z', dot: [12, 12.6, 0.9] },
  me: FAMILY,
  people: FAMILY,
  cart: {
    fill: 'M5 11h14l-1.6 7.3a2 2 0 0 1-2 1.6H8.6a2 2 0 0 1-2-1.6z',
    line: 'M3.5 11h17M5 11l1.6 7.3a2 2 0 0 0 2 1.6h6.8a2 2 0 0 0 2-1.6L19 11M9.5 14.3v2.6M12 14.3v2.6M14.5 14.3v2.6',
    leaves: true
  },
  search: { fill: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z', line: 'M10.5 17a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM20 20l-4.4-4.4', dot: [13, 8, 1.4] },
  share: { fill: 'M5 12.5h14V18a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z', line: 'M12 14.5V3.8M8 7.6l4-3.8 4 3.8M5 12.5V18a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5.5', dot: [12, 17, 1.4] },
  clock: { fill: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', line: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM12 9v4.2l2.8 1.8M10 2.8h4', dot: [12, 13, 1.3] },
  swap: { fill: 'M9 6h6a6 6 0 0 1 0 12H9A6 6 0 0 1 9 6Z', line: 'M5 9.5h12.5l-3.2-3.2M19 14.5H6.5l3.2 3.2', dots: [[5, 9.5, 1.5], [19, 14.5, 1.5]] },
  scan: { fill: 'M7 4h10a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z', line: 'M4 8V6a2 2 0 0 1 2-2h2M16 4h2a2 2 0 0 1 2 2v2M20 16v2a2 2 0 0 1-2 2h-2M8 20H6a2 2 0 0 1-2-2v-2M8 9v6M11 9v6M14 9v6M16.8 9v6', goldLine: 'M3.5 12h17' },
  leaf: { fill: 'M12 21s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8C19.5 16.6 12 21 12 21Z', line: 'M12 21s-7.5-4.4-7.5-10.2A4.3 4.3 0 0 1 12 8a4.3 4.3 0 0 1 7.5 2.8C19.5 16.6 12 21 12 21Z', mint: 'M12 8c-.2-2.4 1-4.2 3.6-4.8.2 2.6-1 4.3-3.6 4.8Z' },
  back: 'M9 5l7 7-7 7',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  close: 'M6 6l12 12M18 6 6 18',
  down: 'M6 9l6 6 6-6',
  chevron: 'M15 6l-6 6 6 6',
  flash: 'M13 3 5 14h6l-1 7 8-11h-6l1-7Z',
  keys: 'M4 7h16v10H4zM7 10h.01M10 10h.01M13 10h.01M16 10h.01M8 14h8',
  plus: 'M12 5v14M5 12h14',
  pen: 'M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4',
  wand: 'M4 20 15 9M14 4v2M19 9h2M17.5 5.5 19 4M9 5l1 1M18 14l1 1',
  globe: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3c2.5 2.7 3.8 5.7 3.8 9s-1.3 6.3-3.8 9c-2.5-2.7-3.8-5.7-3.8-9S9.5 5.7 12 3Z'
};
// Arrows that point "back" or "in" turn round with the reading direction.
const DIRECTIONAL = new Set(['back', 'chevron']);
const Icon = ({ name, size = 22, stroke = 1.9 }) => {
  const icon = ICONS[name];
  const rich = typeof icon === 'object';
  const dots = rich ? (icon.dots || (icon.dot ? [icon.dot] : [])) : [];
  return html`
    <svg class=${'icon' + (rich ? ' icon--duo' : '') + (DIRECTIONAL.has(name) ? ' icon--dir' : '')} width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${rich ? Math.min(stroke, 1.9) : stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      ${rich ? html`<path class="icon__fill" d=${icon.fill} />` : null}
      <path d=${rich ? icon.line : icon} />
      ${dots.map(([cx, cy, r]) => html`<circle class="icon__gold" cx=${cx} cy=${cy} r=${r} />`)}
      ${rich && icon.goldLine ? html`<path class="icon__goldline" d=${icon.goldLine} />` : null}
      ${rich && icon.mint ? html`<path class="icon__mint" d=${icon.mint} />` : null}
      ${rich && icon.leaves ? html`<path class="icon__gold" d="M12 9.6c-.3-3 1.6-5.3 5.2-6 .3 3.4-1.6 5.6-5.2 6Z" /><path class="icon__mint" d="M12 9.6c.2-2.4-1.2-4.2-4-4.7-.3 2.6 1.2 4.3 4 4.7Z" />` : null}
    </svg>`;
};

/* ---------------------------------------------------------------------
   Motion. Each one is skipped when the phone asks for reduced motion.
   ------------------------------------------------------------------- */
const calm = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* A product's photo flies along an arc into the basket in the tab bar, which bounces. */
function flyToCart(from) {
  const cart = document.querySelector('.tabbar__fab');
  if (calm() || !from || !cart || !from.animate) return;
  const a = from.getBoundingClientRect();
  const b = cart.getBoundingClientRect();
  if (!a.width || !b.width) return;
  const flyer = from.cloneNode(true);
  flyer.className = 'flyer';
  flyer.removeAttribute('loading');
  Object.assign(flyer.style, { left: a.left + a.width / 2 - 32 + 'px', top: a.top + a.height / 2 - 32 + 'px' });
  document.body.appendChild(flyer);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  flyer.animate([
    { transform: 'translate(0, 0) scale(1) rotate(0)' },
    { transform: `translate(${dx * 0.35}px, ${Math.min(dy * 0.1, 0) - 120}px) scale(1.08) rotate(-12deg)`, offset: 0.4 },
    { transform: `translate(${dx}px, ${dy}px) scale(.25) rotate(8deg)`, opacity: 0.6 }
  ], { duration: 760, easing: 'cubic-bezier(.45, 0, .55, 1)', fill: 'forwards' }).onfinish = () => {
    flyer.remove();
    cart.animate([{ transform: 'rotate(-6deg) scale(1)' }, { transform: 'rotate(-6deg) scale(1.22)' }, { transform: 'rotate(-6deg) scale(.95)' }, { transform: 'rotate(-6deg) scale(1)' }], { duration: 480, easing: 'cubic-bezier(.2, .8, .2, 1)' });
    const badge = cart.querySelector('em');
    if (badge) badge.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.5)' }, { transform: 'scale(1)' }], { duration: 400 });
  };
}

/* A burst of paper around an element: the receipt's stamp, a finished shop. */
function confetti(around, count = 28) {
  if (calm() || !around || !around.animate) return;
  const r = around.getBoundingClientRect();
  const colors = ['#ffb020', '#17945a', '#e5383b', '#9be0b6', '#0b6e45'];
  for (let i = 0; i < count; i++) {
    const bit = document.createElement('i');
    bit.className = 'confetti';
    bit.style.background = colors[i % colors.length];
    bit.style.left = r.left + r.width / 2 + 'px';
    bit.style.top = r.top + r.height / 2 + 'px';
    document.body.appendChild(bit);
    const angle = Math.random() * Math.PI * 2;
    const reach = 80 + Math.random() * 110;
    bit.animate([
      { transform: 'translate(0, 0) rotate(0)', opacity: 1 },
      { transform: `translate(${Math.cos(angle) * reach}px, ${Math.sin(angle) * reach + 140}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], { duration: 1200 + Math.random() * 500, easing: 'cubic-bezier(.1, .6, .4, 1)', fill: 'forwards' }).onfinish = () => bit.remove();
  }
}

/* A number that counts to its new value instead of jumping. */
function useCountUp(value, ms = 650) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    if (calm() || from.current === value) { from.current = value; setShown(value); return undefined; }
    const start = from.current;
    const t0 = performance.now();
    let frame = 0;
    const step = now => {
      const k = Math.min(1, (now - t0) / ms);
      setShown(Math.round(start + (value - start) * (1 - Math.pow(1 - k, 3))));
      if (k < 1) frame = requestAnimationFrame(step); else from.current = value;
    };
    frame = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(frame); from.current = value; };
  }, [value]);
  return shown;
}

/* 287.45 → big "287" with a small ".45" */
function Sum({ value, count = false }) {
  const counted = useCountUp(count ? value : 0);
  const shown = count ? counted : value;
  const [whole, cents] = money(shown).split('.');
  return html`<span class="sum" dir="ltr"><span class="sum__whole">${whole}</span>${cents ? html`<span class="sum__cents">.${cents}</span>` : null}</span>`;
}

function Stepper({ value, min, max, step = 1, label, onChange, format, cls = '' }) {
  return html`
    <div class=${'stepper ' + cls} role="group" aria-label=${label}>
      <button type="button" class="stepper__btn" disabled=${value <= min} onClick=${() => onChange(Math.max(min, value - step))} aria-label=${L('إنقاص', 'Less')}>−</button>
      <output class="stepper__value" aria-live="polite">${format ? format(value) : value}</output>
      <button type="button" class="stepper__btn" disabled=${value >= max} onClick=${() => onChange(Math.min(max, value + step))} aria-label=${L('زيادة', 'More')}>+</button>
    </div>`;
}

function OfferPrice({ offer }) {
  const percent = discountPercent(offer);
  return html`
    <span class="price">
      <span class="price__now" dir="ltr">${money(halalas(offer.price))}</span>
      ${offer.was > offer.price ? html`<s class="price__was" dir="ltr">${money(halalas(offer.was))}</s>` : null}
      ${percent ? html`<span class="badge badge--cut" dir="ltr">−${percent}%</span>` : null}
    </span>`;
}

const storeName = (data, id) => {
  const store = data.offers.stores[id];
  if (!store) return id;
  return L(store.name, store.name_en || STORE_EN[id] || store.name);
};
const StoreDot = ({ id }) => html`<i class="store-dot" style=${'background:' + (STORE_COLORS[id] || '#0b6e45')} aria-hidden="true"></i>`;
const familyLabel = (persons, kids) => (kids
  ? L(`${persons} أفراد (منهم ${kids === 1 ? 'طفل' : kids === 2 ? 'طفلان' : kids + ' أطفال'})`, `${pl(persons, 'person', 'people')} (${pl(kids, 'child', 'children')})`)
  : L(`${persons} أفراد`, pl(persons, 'person', 'people')));
const mealsCount = n => L(n + ' طبخات', pl(n, 'meal', 'meals'));
const mealsWord = n => L(n === 1 ? 'طبخة واحدة' : n === 2 ? 'طبختين' : n + ' طبخات', pl(n, 'meal', 'meals'));

const DAY_MS = 86400000;
/* How old the prices the plans are built on are, and how to say it. A
   flyer has an end date; an online store has the day its prices were read
   and is refreshed weekly, so after eight days it is out of date. */
function pricePeriod(data, id) {
  const store = data.offers.stores[id] || {};
  const name = storeName(data, id);
  const today = riyadhToday();
  if (store.checked) {
    const age = Math.round((fromISO(today) - fromISO(store.checked)) / DAY_MS);
    return {
      badge: L(`أسعار ${shortDay(store.checked)}`, `Prices of ${shortDay(store.checked)}`),
      text: L(`أسعار ${name} كما ظهرت يوم ${shortDay(store.checked)}`, `${name} prices as shown on ${shortDay(store.checked)}`),
      stale: age > 8,
      staleText: L(`هذه أسعار ${name} كما ظهرت يوم ${longDay(store.checked)}، أي قبل ${age} يوماً، وقد تغيّرت منذ ذلك الحين. تتحدّث الخطة كل أسبوع.`,
        `These are ${name}'s prices from ${longDay(store.checked)}, ${age} days ago, and they may have changed since. The plan is updated every week.`)
    };
  }
  return {
    badge: L(`حتى ${shortDay(store.valid_to)}`, `Until ${shortDay(store.valid_to)}`),
    text: L(`عروض ${name} سارية حتى ${shortDay(store.valid_to)}`, `${name} offers valid until ${shortDay(store.valid_to)}`),
    stale: today > store.valid_to,
    staleText: L(`انتهت مدة هذه العروض يوم ${longDay(store.valid_to)}. الأسعار المعروضة قد لا تكون سارية.`,
      `These offers ended on ${longDay(store.valid_to)}. The prices shown may no longer apply.`)
  };
}

/* A bottom sheet: the backdrop or Escape closes it. */
function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const onKey = event => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const first = document.querySelector('.sheet button:not(.sheet__close), .sheet a');
    if (first) first.focus();
    document.body.classList.add('is-locked');
    return () => { document.removeEventListener('keydown', onKey); document.body.classList.remove('is-locked'); };
  }, []);
  return html`
    <div class="sheet-backdrop" onClick=${onClose}></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label=${title}>
      <span class="sheet__grip" aria-hidden="true"></span>
      <div class="sheet__head">
        <h2 class="sheet__title">${title}</h2>
        <button type="button" class="sheet__close" aria-label=${L('إغلاق', 'Close')} onClick=${onClose}><${Icon} name="close" size=${20} /></button>
      </div>
      ${children}
    </div>`;
}

/* The green header every main screen opens with. */
function Head({ data, store, period, onStore, small, children }) {
  return html`
    <header class=${'head' + (small ? ' head--small' : '')}>
      <div class="head__row">
        <a class="brand" href="#/home" aria-label=${L('مقاضي — الرئيسية', 'Maqadi — home')}><${Logo} size=${38} glass /><span class="brand__name">${appName()}</span></a>
        <button type="button" class="storebtn" onClick=${onStore} aria-label=${L('تتسوّق من ' + storeName(data, store) + '. تغيير المتجر', 'Shopping at ' + storeName(data, store) + '. Change store')}>
          <span class="storebtn__label">${L('تتسوّق من', 'Shopping at')}</span>
          <span class="storebtn__name"><${StoreDot} id=${store} />${storeName(data, store)}<${Icon} name="down" size=${15} stroke=${2.4} /></span>
        </button>
      </div>
      ${period.stale ? html`<p class="head__alert" role="alert">${period.staleText}</p>` : null}
      ${children}
    </header>`;
}

/* One product, as a card with its photo. */
function ProductCard({ data, offer, units, onSet, twins }) {
  const percent = discountPercent(offer);
  const per = unitPrice(offer);
  const step = isLoose(offer) ? 0.5 : 1;
  const size = [offerSize(offer), soldBy(offer.sold_by)].filter(Boolean).join(' · ');
  return html`
    <article class="pcard">
      <div class="pcard__media">
        <${Photo} data=${data} offer=${offer} width=${384} cls="pcard__photo" />
        ${percent ? html`<span class="pcard__off" dir="ltr">−${percent}%</span>` : null}
        <span class="pcard__store"><${StoreDot} id=${offer.store} />${storeName(data, offer.store)}</span>
        ${units
          ? html`<${Stepper} cls="stepper--card" value=${units} min=${0} max=${20} step=${step} label=${L('الكمية من ', 'Quantity of ') + nm(offer)} onChange=${onSet} />`
          : html`<button type="button" class="pcard__add" aria-label=${L('إضافة ' + nm(offer) + ' إلى القائمة', 'Add ' + nm(offer) + ' to the list')} onClick=${event => { flyToCart(event.currentTarget.closest('.pcard').querySelector('.pcard__photo')); onSet(step); }}>+</button>`}
      </div>
      <div class="pcard__body">
        <p class="pcard__price">
          <b dir="ltr">${money(halalas(offer.price))}</b><span class="pcard__cur">${riyal()}</span>
          ${offer.was > offer.price ? html`<s dir="ltr">${money(halalas(offer.was))}</s>` : null}
        </p>
        <h3 class="pcard__name">${nm(offer)}</h3>
        ${size ? html`<p class="pcard__size">${size}</p>` : null}
        ${per ? html`<p class="pcard__per"><span dir="ltr">${per.value.toFixed(2)}</span> ${riyal()} ${per.per === 'kg' ? L('للكيلو', 'per kg') : L('لليتر', 'per litre')}</p>` : null}
        ${(twins || []).map(other => html`<span class=${'pcard__twin' + (other.price < offer.price ? ' is-cheaper' : '')}>${L('في ', 'At ')}${storeName(data, other.store)}: <b dir="ltr">${money(halalas(other.price))}</b></span>`)}
        ${offer.note ? html`<span class="badge badge--note">${noteText(offer.note)}</span>` : null}
      </div>
    </article>`;
}

/* The cuisines, as round picture buttons. */
/* The cuisines as photo cards: each shows the first dish of its week and
   what the week costs this family at the current store; the cheapest is marked. */
function Cuisines({ plans, current, onPick, cards = [] }) {
  const byId = new Map(cards.map(card => [card.id, card]));
  const low = cards.length > 1 ? Math.min(...cards.map(card => card.cost)) : null;
  return html`
    <div class="ccards" role="group" aria-label=${L('نوع السفرة', 'Cuisine')}>
      ${plans.map(option => {
        const card = byId.get(option.id) || {};
        const on = option.id === current;
        const meal = card.meal || option.meals[0];
        return html`
          <button type="button" class=${'ccard' + (on ? ' is-on' : '')} aria-pressed=${on} onClick=${() => onPick(option.id)}
            aria-label=${nm(option) + (card.cost ? L(`، ${money(card.cost)} ريال للأسبوع`, `, ${money(card.cost)} SAR a week`) : '')}>
            <span class="ccard__pic">${meal ? html`<${MealArt} meal=${meal} size=${64} fill />` : html`<${Emoji} char=${CUISINE_EMOJI[option.id]} size=${56} />`}</span>
            <span class="ccard__shade" aria-hidden="true"></span>
            ${on ? html`<span class="ccard__check" aria-hidden="true"><${Icon} name="check" size=${15} stroke=${3} /></span>` : null}
            ${low !== null && card.cost === low ? html`<span class="ccard__tag">${L('الأرخص', 'Cheapest')}</span>` : null}
            <span class="ccard__txt" aria-hidden="true">
              <b>${nm(option)}</b>
              ${card.cost ? html`<small><span dir="ltr">${Math.round(card.cost / 100)}</span> ${L('ريال للأسبوع', 'SAR a week')}</small>` : null}
            </span>
          </button>`;
      })}
    </div>`;
}

const SectionTitle = ({ title, emoji, href, more }) => html`
  <div class="section-head">
    <h2 class="section-head__title">${emoji ? html`<${Emoji} char=${emoji} size=${22} /> ` : null}${title}</h2>
    ${href ? html`<a class="section-head__more" href=${href}>${more || L('عرض الكل', 'See all')}</a>` : null}
  </div>`;

/* The two languages, side by side. */
const LangSwitch = ({ lang, onPick, cls = '' }) => html`
  <div class=${'lang-switch ' + cls} role="group" aria-label="اللغة / Language">
    <button type="button" lang="ar" aria-pressed=${lang === 'ar'} onClick=${() => onPick('ar')}>العربية</button>
    <button type="button" lang="en" dir="ltr" aria-pressed=${lang === 'en'} onClick=${() => onPick('en')}>English</button>
  </div>`;

/* ---------------------------------------------------------------------
   Family preferences
   ------------------------------------------------------------------- */
function TagChips({ tags, chosen, onToggle, allergy }) {
  return html`
    <div class="tag-chips">
      ${tags.map(tag => html`
        <button type="button" class=${'tag-chip' + (allergy ? ' is-allergy' : '')} aria-pressed=${chosen.includes(tag)} onClick=${() => onToggle(tag)}>
          ${TAG_INFO[tag].emoji ? html`<${Emoji} char=${TAG_INFO[tag].emoji} size=${20} />` : null}
          ${tagName(tag)}${chosen.includes(tag) ? ' ✓' : ''}
        </button>`)}
    </div>`;
}

const AllergyWarning = () => html`
  <p class="allergy-warning"><${Emoji} char="⚠️" size=${20} /><span>${L(
    'نستبعد الطبخات التي فيها هذه المكونات، لكن بعض المنتجات قد تحتوي على آثار منها. في الحساسية الشديدة راجع ملصق كل منتج.',
    'We leave out meals with these ingredients, but some products may contain traces of them. For a severe allergy, check each product’s label.')}</span></p>`;

function PrefsSheet({ avoid, kids, persons, set, onClose }) {
  const [chosen, setChosen] = useState(avoid);
  const [children, setChildren] = useState(Math.min(kids, persons - 1));
  const toggle = tag => setChosen(chosen.includes(tag) ? chosen.filter(item => item !== tag) : chosen.concat(tag));
  return html`
    <${Sheet} title=${L('تفضيلات العائلة', 'Family preferences')} onClose=${onClose}>
      <p class="sheet__sub">${L('نختار طبخات الأسبوع على ذوق عائلتك.', 'We pick the week’s meals to suit your family.')}</p>
      <div class="pref-group">
        <h3>${L('لا نأكل', 'We don’t eat')}</h3>
        <${TagChips} tags=${AVOID_FOODS} chosen=${chosen} onToggle=${toggle} />
      </div>
      <div class="pref-group">
        <h3>${L('حساسية', 'Allergies')} <small>${L('· نستبعد كل طبخة فيها المكوّن', '· every meal with it is left out')}</small></h3>
        <${TagChips} tags=${ALLERGIES} chosen=${chosen} onToggle=${toggle} allergy />
      </div>
      <div class="pref-group pref-group--row">
        <div><b>${L('منهم أطفال تحت 12 سنة', 'Children under 12')}</b><small>${L('الطفل يُحسب نصف حصة في الكميات', 'A child counts as half a portion')}</small></div>
        <${Stepper} value=${children} min=${0} max=${Math.max(0, persons - 1)} label=${L('عدد الأطفال', 'Children')} onChange=${setChildren} />
      </div>
      <${AllergyWarning} />
      <button type="button" class="btn btn--wide" onClick=${() => { set.prefs(chosen, children); onClose(); }}>${L('حفظ', 'Save')}</button>
    <//>`;
}

/* On the plan screen: what the preferences changed this week. */
function PrefsCard({ plan, avoid, mealsPerWeek, onEdit }) {
  if (!avoid.length) return null;
  const allergy = avoid.some(tag => ALLERGIES.includes(tag));
  const byId = new Map(plan.choices.map(meal => [meal.id, meal]));
  const added = plan.replacements.map(id => byId.get(id)).filter(Boolean);
  const join = list => list.join(L('، ', ', '));
  return html`
    <section class="prefs-card">
      <div class="prefs-card__line">
        <span>${L('حسب تفضيلات عائلتك:', 'For your family:')}</span>
        ${avoid.map(tag => html`<span class=${'pchip' + (ALLERGIES.includes(tag) ? ' is-allergy' : '')}>${tagShort(tag)}</span>`)}
        <button type="button" class="link link--green" onClick=${onEdit}>${L('تعديل', 'Edit')}</button>
      </div>
      ${plan.removed.length || plan.droppedBasics.length || plan.meals.length < mealsPerWeek ? html`
        <div class="prefs-card__changes">
          ${plan.removed.length ? html`<span>${L('استبعدنا: ', 'Left out: ')}${plan.removed.map((meal, i) => html`${i ? L('، ', ', ') : ''}<s>${nm(meal)}</s>`)}</span>` : null}
          ${added.length ? html`<span>${L('وأضفنا: ', 'Added instead: ')}<b>${join(added.map(nm))}</b></span>` : null}
          ${plan.droppedBasics.length ? html`<span>${L('وأزلنا من أساسيات الفطور: ', 'Removed from the breakfast basics: ')}${join(plan.droppedBasics.map(nm))}</span>` : null}
          ${plan.meals.length < mealsPerWeek ? html`<span>${L(`تناسب تفضيلاتكم ${plan.meals.length} طبخات فقط هذا الأسبوع.`, `Only ${pl(plan.meals.length, 'meal suits', 'meals suit')} your preferences this week.`)}</span>` : null}
        </div>` : null}
      ${allergy ? html`<${AllergyWarning} />` : null}
    </section>`;
}

/* ---------------------------------------------------------------------
   Budget
   ------------------------------------------------------------------- */
const BUDGET_PRESETS = [150, 200, 250, 300, 400];

/* The meter under the week's total in the green header. */
function BudgetMeter({ budget, total, onEdit }) {
  const limit = budget * 100;
  const over = total > limit;
  return html`
    <div class=${'meter' + (over ? ' is-over' : '')}>
      <div class="meter__row">
        <span>${L('ميزانيتك', 'Budget')} <b dir="ltr">${budget}</b> ${riyal()} <button type="button" class="meter__edit" onClick=${onEdit}><${Icon} name="pen" size=${13} stroke=${2} /> ${L('تعديل', 'Edit')}</button></span>
        <span class="meter__state">${over
          ? html`${L('أغلى بـ', 'Over by')} <span dir="ltr">${money(total - limit)}</span>`
          : html`${L('باقي', 'Left')} <span dir="ltr">${money(limit - total)}</span> ${riyal()}`}</span>
      </div>
      <div class="meter__bar" role="progressbar" aria-label=${L('ما تصرفه من الميزانية', 'Budget used')} aria-valuemin="0" aria-valuemax=${budget} aria-valuenow=${Math.round(total / 100)}>
        <i style=${'width:' + Math.min(100, total / limit * 100) + '%'}></i>
      </div>
    </div>`;
}

/* Under the search bar on the home screen: over budget, or just brought within it. */
function BudgetCard({ budget, over, fit, done, onFit, onEdit, onMeals, onDismiss }) {
  if (over && fit) {
    if (!fit.swaps.length) {
      return html`
        <section class="budget-card is-over">
          <div class="budget-card__top"><${Emoji} char="💰" size=${40} /><div><b>${L('السفرة أغلى من ميزانيتك', 'This week is over your budget')}</b><span>${L(
            `لا توجد طبخات أرخص تكفي لـ ${budget} ريال هذا الأسبوع. يمكنك تقليل عدد الطبخات أو رفع الميزانية.`,
            `No cheaper meals bring it to ${budget} SAR this week. You can cook fewer meals or raise the budget.`)}</span></div></div>
          <div class="budget-card__actions"><button type="button" class="btn" onClick=${onMeals}>${L('قلّل الطبخات', 'Fewer meals')}</button><button type="button" class="btn btn--ghost" onClick=${onEdit}>${L('عدّل الميزانية', 'Change budget')}</button></div>
        </section>`;
    }
    return html`
      <section class="budget-card is-over">
        <div class="budget-card__top"><${Emoji} char="💰" size=${40} /><div><b>${L('السفرة أغلى من ميزانيتك', 'This week is over your budget')}</b><span>${fit.fits
          ? L(`يمكننا ترتيبها ضمن ${budget} ريال بتبديل ${mealsWord(fit.swaps.length)} بأرخص منها.`, `We can bring it within ${budget} SAR by swapping ${mealsWord(fit.swaps.length)} for cheaper ones.`)
          : L(`أقرب ما نصل إليه ${money(fit.after)} ريال بتبديل ${mealsWord(fit.swaps.length)}.`, `The closest we can get is ${money(fit.after)} SAR, by swapping ${mealsWord(fit.swaps.length)}.`)}</span></div></div>
        <button type="button" class="btn btn--wide" onClick=${onFit}><${Icon} name="wand" size=${20} stroke=${2} /> ${fit.fits ? L('رتّبها ضمن ميزانيتي', 'Fit it to my budget') : L('اقترب من ميزانيتي', 'Get closer to my budget')}</button>
      </section>`;
  }
  if (done && !over) {
    return html`
      <section class="budget-card is-done">
        <div class="budget-card__top"><${Emoji} char="✨" size=${36} /><div><b>${L('سفرتك ضمن ميزانيتك', 'Your week is within budget')}</b><span>${L('بدّلنا ', 'We swapped ')}${mealsWord(done.count)}${L(' ووفّرنا ', ' and saved ')}<b class="inline" dir="ltr">${money(done.saved)}</b> ${riyal()}.</span></div>
          <button type="button" class="budget-card__close" aria-label=${L('إخفاء', 'Hide')} onClick=${onDismiss}><${Icon} name="close" size=${16} /></button></div>
      </section>`;
  }
  return null;
}

function BudgetSheet({ budget, total, breakdown, set, onClose }) {
  const suggested = Math.max(50, Math.ceil(total / 1000) * 10);
  const [value, setValue] = useState(budget || suggested);
  const save = amountValue => { set.budget(amountValue); onClose(); };
  return html`
    <${Sheet} title=${L('ميزانية الأسبوع', 'Weekly budget')} onClose=${onClose}>
      <p class="sheet__sub">${L('كم تريد أن تصرف على المقاضي هذا الأسبوع؟', 'How much do you want to spend on groceries this week?')}</p>
      <div class="budget-amount">
        <${Stepper} cls="stepper--budget" value=${value} min=${50} max=${3000} step=${10} label=${L('ميزانية الأسبوع بالريال', 'Weekly budget in riyals')} onChange=${setValue} format=${v => html`<b dir="ltr">${v}</b><small>${riyal()}</small>`} />
      </div>
      <div class="pills pills--sheet" role="group" aria-label=${L('مبالغ جاهزة', 'Quick amounts')}>
        ${BUDGET_PRESETS.map(preset => html`<button type="button" class="pill" aria-pressed=${value === preset} onClick=${() => setValue(preset)}>${preset}</button>`)}
      </div>
      <div class="budget-includes">
        <b>${L('الميزانية تشمل كل ما في قائمتك:', 'The budget covers everything on your list:')}</b>
        <ul>
          <li><span>${L('الطبخات', 'Meals')}</span><span dir="ltr">${money(breakdown.meals)}</span></li>
          ${breakdown.basics ? html`<li><span>${L('الأساسيات', 'Basics')}${breakdown.basicsNames ? ': ' + breakdown.basicsNames : ''}</span><span dir="ltr">${money(breakdown.basics)}</span></li>` : null}
          <li><span>${L('أغراض أضفتها بنفسك', 'Items you added')}</span><span dir="ltr">${money(breakdown.added)}</span></li>
          <li class="is-total"><span>${L('المجموع الآن', 'Total now')}</span><span dir="ltr">${money(breakdown.total)}</span></li>
        </ul>
      </div>
      <button type="button" class="btn btn--wide" onClick=${() => save(value)}>${L('حفظ', 'Save')}</button>
      ${budget ? html`<button type="button" class="sheet__link" onClick=${() => save(null)}>${L('بدون ميزانية', 'No budget')}</button>` : null}
    <//>`;
}

function FitSheet({ fit, budget, onApply, onClose }) {
  const diff = budget * 100 - fit.after;
  return html`
    <${Sheet} title=${fit.fits ? L('ضمن ميزانية ' + budget + ' ريال', 'Within ' + budget + ' SAR') : L('أقرب ما يمكن لميزانيتك', 'As close as we can get')} onClose=${onClose}>
      <p class="sheet__sub">${L(`بدّلنا ${mealsWord(fit.swaps.length)} بأرخص منها من عروض هذا الأسبوع. باقي السفرة كما هي.`, `We swapped ${mealsWord(fit.swaps.length)} for cheaper ones from this week’s offers. The rest of the week stays as it is.`)}</p>
      <ul class="fit-list">
        ${fit.swaps.map((swap, i) => html`
          <li class="fit-swap">
            <span class="fit-swap__pics" aria-hidden="true">
              <span class=${'fit-swap__pic tile-' + ((i * 2 + 2) % 6)}><${Emoji} char=${swap.from.emoji} size=${30} /></span>
              <span class="fit-swap__arrow">${L('←', '→')}</span>
              <span class=${'fit-swap__pic tile-' + ((i * 2 + 4) % 6)}><${Emoji} char=${swap.to.emoji} size=${30} /></span>
            </span>
            <span class="fit-swap__body">
              <s>${nm(swap.from)}</s>
              <b>${nm(swap.to)}</b>
              <small>${[swap.to.cuisine ? cuisineLabel(swap.to.cuisine) : null, swap.to.minutes + L(' دقيقة', ' min')].filter(Boolean).join(' · ')}</small>
            </span>
            <span class="fit-swap__save" dir="ltr">−${money(swap.saves)}</span>
          </li>`)}
      </ul>
      <div class="fit-sum">
        <div><span>${L('السفرة الآن', 'Now')}</span><s dir="ltr">${money(fit.before)}</s></div>
        <div><span>${L('بعد التبديل', 'After the swaps')}</span><span dir="ltr">${money(fit.after)}</span></div>
        <div class=${'fit-sum__result' + (diff < 0 ? ' is-over' : '')}><span>${diff >= 0 ? L('تحت ميزانيتك بـ', 'Under budget by') : L('أغلى من ميزانيتك بـ', 'Over budget by')}</span><span><b dir="ltr">${money(Math.abs(diff))}</b> ${riyal()}</span></div>
      </div>
      ${fit.fits ? null : html`<p class="fit-hint">${L(`لتصل إلى ${budget} ريال يمكنك أيضاً تقليل عدد الطبخات من «الخطة».`, `To reach ${budget} SAR you can also cook fewer meals, from “Plan”.`)}</p>`}
      <div class="sheet__actions">
        <button type="button" class="btn" onClick=${onApply}>${L('طبّق التبديلات', 'Apply the swaps')}</button>
        <button type="button" class="btn btn--ghost" onClick=${onClose}>${L('لا، اتركها', 'No, keep it')}</button>
      </div>
      <p class="sheet__note">${L('يمكنك تبديل أي طبخة لاحقاً من «الخطة».', 'You can swap any meal later from “Plan”.')}</p>
    <//>`;
}

/* A meal borrowed from another cuisine says which ("شامية" is stored in Arabic). */
const CUISINE_NAMES = { 'خليجية': 'Gulf', 'شامية': 'Levantine', 'سريعة': 'Quick', 'صحية': 'Healthy', 'اقتصادية': 'Budget', 'رمضانية': 'Ramadan' };
const cuisineLabel = name => L(name, CUISINE_NAMES[name] || name);

/* ---------------------------------------------------------------------
   Home
   ------------------------------------------------------------------- */
function HomeTab({ data, store, head, storeRows, plans, plan, persons, kids, week, list, offers, locked, set, openFamily, scanTip, budgetInfo, stories, season, cuisineCards }) {
  const cooked = plan.meals.filter(meal => !week.skipped.includes(meal.id) && !locked.has(meal.id)).length;
  const rail = useMemo(() => data.offers.offers
    .filter(offer => offer.store === store && offer.was > offer.price && offer.img && isFood(offer))
    .sort((a, b) => discountPercent(b) - discountPercent(a) || a.price - b.price)
    .slice(0, CONFIG.railSize), [data, store]);

  return html`
    <${Head} ...${head}>
      <p class="head__greet">
        ${season && season.phase === 'during' ? L('رمضان كريم · اليوم ' + season.day, 'Ramadan Kareem · day ' + season.day) : L('سفرة أسبوعك جاهزة', 'Your week’s meals are ready')}
        <button type="button" class="head__family" onClick=${openFamily} aria-label=${L('عدد أفراد الأسرة ' + persons + '. تغيير', 'Family of ' + persons + '. Change')}><${Emoji} char="👨‍👩‍👧‍👦" size=${20} /> ${familyLabel(persons, kids)}</button>
      </p>
      <p class="head__total"><${Sum} value=${list.totals.cost} count /><span>${L('ريال للأسبوع', 'SAR this week')}</span></p>
      ${budgetInfo.budget ? html`<${BudgetMeter} budget=${budgetInfo.budget} total=${list.totals.cost} onEdit=${budgetInfo.openBudget} />` : null}
      <div class="head__chips">
        ${list.totals.saved ? html`<span class="hchip hchip--gold">${L('وفّرت', 'You save')} <b dir="ltr">${money(list.totals.saved)}</b> ${riyal()}</span>` : null}
        <span class="hchip">${mealsCount(cooked)} · ${L(list.totals.items + ' صنف', pl(list.totals.items, 'item', 'items'))}</span>
        ${list.unpriced.length ? html`<span class="hchip">${L(list.unpriced.length + ' بدون سعر', list.unpriced.length + ' without a price')}</span>` : null}
        ${budgetInfo.budget ? null : html`<button type="button" class="hchip hchip--button" onClick=${budgetInfo.openBudget}><${Icon} name="plus" size=${14} stroke=${2.4} /> ${L('ميزانية الأسبوع', 'Weekly budget')}</button>`}
      </div>
    <//>
    <div class="float searchbar">
      <a class="searchbar__link" href="#/shop/search"><${Icon} name="search" size=${20} /><span>${L('ابحث عن أي غرض: بصل، حليب، منظف…', 'Search anything: onions, milk, cleaner…')}</span></a>
      <a class="searchbar__scan" href="#/scan" aria-label=${L('امسح باركود منتج وقارن سعره', 'Scan a barcode and compare prices')}><${Icon} name="scan" size=${24} stroke=${2} /></a>
    </div>
    ${scanTip ? html`
      <button type="button" class="scan-tip" onClick=${set.scanTipSeen}>
        <b>${L('جديد: امسح وقارن', 'New: scan and compare')}</b>
        ${L('وأنت في السوق، امسح باركود أي منتج واعرف سعره في المتاجر الأخرى.', 'In the shop, scan any product’s barcode to see its price at the other stores.')}
      </button>` : null}
    ${season && season.phase === 'during' && plan.daily ? html`<${RamadanToday} plan=${plan} season=${season} meals=${plan.meals.filter(meal => !week.skipped.includes(meal.id) && !locked.has(meal.id))} />` : null}
    ${season && season.phase === 'before' ? html`<${RamadanBanner} season=${season} />` : null}
    ${stories.length ? html`<${StoryRings} items=${stories} seen=${week.seen} />` : null}

    <${BudgetCard} budget=${budgetInfo.budget} over=${budgetInfo.over} fit=${budgetInfo.fit} done=${week.budgetFit}
      onFit=${budgetInfo.openFit} onEdit=${budgetInfo.openBudget} onMeals=${openFamily} onDismiss=${set.hideFitNote} />

    ${storeRows.length > 1 ? html`<${StoreCards} data=${data} rows=${storeRows} onPick=${set.store} />` : null}

    <${SectionTitle} title=${L('نوع السفرة', 'Cuisine')} />
    <${Cuisines} plans=${plans} current=${plan.id} onPick=${set.plan} cards=${cuisineCards} />

    <${SectionTitle} title=${L('طبخات الأسبوع', 'This week’s meals')} href="#/plan" />
    <div class="carousel">
      ${plan.meals.map((meal, index) => {
        const off = week.skipped.includes(meal.id);
        const isLocked = locked.has(meal.id);
        const best = mealHighlight(meal, offers);
        const isNew = week.fresh.includes(meal.id);
        const swappedIn = plan.replacements.includes(meal.id);
        return html`
          <article class=${'mcard' + (off ? ' is-off' : '') + (isLocked ? ' is-locked' : '')}>
            <a class="mcard__link" href=${isLocked ? '#/me' : '#/meal/' + meal.id} aria-label=${nm(meal)}>
              <span class=${'mcard__art tile-' + (index % 6)}>
                <span class="mcard__tags"><span class="mcard__day">${L('اليوم ', 'Day ')}${index + 1}</span>${isNew ? html`<span class="mcard__new">${L('جديد', 'New')}</span>` : swappedIn ? html`<span class="mcard__new">${L('بديل', 'Swapped in')}</span>` : null}</span>
                <${MealArt} meal=${meal} size=${84} fill />
              </span>
              <span class="mcard__body">
                <span class="mcard__name">${nm(meal)}</span>
                <span class="mcard__meta">${isLocked ? html`<${Icon} name="lock" size=${13} /> ${L('مع مقاضي بلس', 'With Maqadi Plus')}` : html`<${Icon} name="clock" size=${13} /> ${meal.minutes}${L(' دقيقة', ' min')}`}</span>
                ${best && !isLocked ? html`<span class="mcard__deal">${L('عرض ', 'Offer: ')}${nm(best)} <b dir="ltr">${money(halalas(best.price))}</b></span>` : null}
              </span>
            </a>
            ${isLocked ? null : html`
              <button type="button" class="mcard__toggle" aria-pressed=${!off} aria-label=${(off ? L('إضافة ', 'Add ') : L('استبعاد ', 'Leave out ')) + nm(meal)} onClick=${() => set.toggleMeal(meal.id)}>
                <${Icon} name="check" size=${15} stroke=${2.6} />
              </button>`}
          </article>`;
      })}
    </div>

    ${rail.length ? html`
      <${SectionTitle} title=${L('عروض ' + storeName(data, store) + ' هذا الأسبوع', storeName(data, store) + ' offers this week')} emoji="🔥" href="#/shop" />
      <div class="rail">
        ${rail.map(offer => html`<${ProductCard} data=${data} offer=${offer} units=${week.extras[offer.id] || 0} onSet=${value => set.extra(offer.id, value)} />`)}
      </div>` : null}

    <p class="fineprint">${L(
      'الطبخات والأصناف تُختار تلقائياً كل أسبوع من أرخص ما يغطي حاجة الأسرة في كل متجر. الأسعار من المتاجر نفسها وقد تختلف حسب الفرع وتوفّر الكمية، والتوفير محسوب فقط للأصناف التي عليها خصم فعلي.',
      'Meals and items are chosen every week from the cheapest products that cover the family’s needs at each store. Prices come from the stores themselves and may differ by branch and stock; savings count only items with a real discount.')}</p>`;
}

/* The same week at each store; the cheapest is marked only when every
   store priced the same number of items, so the comparison is fair. */
function StoreCards({ data, rows, onPick }) {
  return html`
    <div class="stores" role="group" aria-label=${L('نفس السفرة في كل متجر', 'The same week at each store')}>
      ${rows.map(row => html`
        <button type="button" class=${'scard' + (row.current ? ' is-current' : '')} aria-pressed=${row.current} onClick=${() => onPick(row.id)}>
          ${row.cheapest ? html`<span class="scard__tag">${L('الأرخص', 'Cheapest')}</span>` : null}
          <span class="scard__name"><${StoreDot} id=${row.id} />${row.name}</span>
          <span class="scard__value"><b dir="ltr">${money(row.cost)}</b> <small>${riyal()}</small></span>
          <span class=${'scard__note' + (row.current ? ' is-good' : row.diff > 0 ? ' is-bad' : row.diff < 0 ? ' is-good' : '')}>
            ${row.current ? L('متجرك الحالي', 'Your store')
              : row.diff === null ? row.caveat
              : row.diff > 0 ? html`${L('أغلى بـ', 'More by')} <span dir="ltr">${money(row.diff)}</span>`
              : row.diff < 0 ? html`${L('أرخص بـ', 'Less by')} <span dir="ltr">${money(-row.diff)}</span>`
              : L('نفس التكلفة', 'Same cost')}
          </span>
        </button>`)}
    </div>`;
}

function StoreSheet({ data, rows, onPick, onClose }) {
  return html`
    <${Sheet} title=${L('من أين تتسوّق؟', 'Where do you shop?')} onClose=${onClose}>
      <p class="sheet__sub">${L('تكلفة نفس السفرة في كل متجر، لعدد أفراد أسرتك.', 'The same week at each store, for your family.')}</p>
      <ul class="sheet__list">
        ${rows.map(row => html`
          <li>
            <button type="button" class=${'store-option' + (row.current ? ' is-current' : '')} onClick=${() => { onPick(row.id); onClose(); }}>
              <span class="store-option__name"><${StoreDot} id=${row.id} />${row.name}${row.cheapest ? html`<span class="badge badge--gold">${L('الأرخص', 'Cheapest')}</span>` : null}</span>
              <span class="store-option__sub">${pricePeriod(data, row.id).text}${row.caveat ? ' · ' + row.caveat : ''}</span>
              <span class="store-option__value"><b dir="ltr">${money(row.cost)}</b> ${riyal()}</span>
              ${row.current ? html`<span class="store-option__check"><${Icon} name="check" size=${16} stroke=${2.6} /></span>` : null}
            </button>
          </li>`)}
      </ul>
    <//>`;
}

function FamilySheet({ persons, mealsPerWeek, maxMeals, set, onClose, openPrefs }) {
  return html`
    <${Sheet} title=${L('أسرتك', 'Your family')} onClose=${onClose}>
      <div class="sheet__rows">
        <div class="row"><span>${L('عدد أفراد الأسرة', 'People in the family')}</span><${Stepper} value=${persons} min=${CONFIG.minPersons} max=${CONFIG.maxPersons} label=${L('عدد أفراد الأسرة', 'People in the family')} onChange=${set.persons} /></div>
        <div class="row"><span>${L('عدد الطبخات في الأسبوع', 'Meals a week')}</span><${Stepper} value=${Math.min(mealsPerWeek, maxMeals)} min=${CONFIG.minMeals} max=${maxMeals} label=${L('عدد الطبخات في الأسبوع', 'Meals a week')} onChange=${set.mealsPerWeek} /></div>
        <button type="button" class="row row--button" onClick=${openPrefs}><span>${L('تفضيلات العائلة', 'Family preferences')}</span><span class="row__value"><${Icon} name="chevron" size=${18} /></span></button>
      </div>
      <button type="button" class="btn btn--wide" onClick=${onClose}>${L('تم', 'Done')}</button>
    <//>`;
}

/* ---------------------------------------------------------------------
   Plan
   ------------------------------------------------------------------- */
function PlanTab({ data, head, plans, plan, persons, kids, avoid, mealsPerWeek, maxMeals, week, offers, locked, set, openPrefs, cuisineCards }) {
  const [swapFor, setSwapFor] = useState(null);
  const picked = new Set(plan.meals.map(meal => meal.id));
  const swaps = plan.choices.filter(meal => !picked.has(meal.id));
  const cooked = plan.meals.filter(meal => !week.skipped.includes(meal.id) && !locked.has(meal.id)).length;
  return html`
    <${Head} ...${head} small>
      <h1 class="head__title">${L('خطة الأسبوع', 'This week’s plan')}</h1>
      <p class="head__sub">${nm(plan)} · ${mealsCount(cooked)} · ${familyLabel(persons, kids)}</p>
    <//>
    <div class="float panel">
      <div class="row"><span><${Icon} name="people" size=${20} /> ${L('أفراد الأسرة', 'Family')}</span><${Stepper} value=${persons} min=${CONFIG.minPersons} max=${CONFIG.maxPersons} label=${L('عدد أفراد الأسرة', 'People in the family')} onChange=${set.persons} /></div>
      <div class="row"><span><${Icon} name="plan" size=${20} /> ${L('طبخات الأسبوع', 'Meals a week')}</span><${Stepper} value=${Math.min(mealsPerWeek, maxMeals)} min=${CONFIG.minMeals} max=${maxMeals} label=${L('عدد الطبخات في الأسبوع', 'Meals a week')} onChange=${set.mealsPerWeek} /></div>
      <button type="button" class="row row--button" onClick=${openPrefs}>
        <span><${Icon} name="leaf" size=${20} /> ${L('تفضيلات العائلة', 'Family preferences')}</span>
        <span class="row__value">${avoid.length ? L(avoid.length + ' مختارة', avoid.length + ' set') : L('لا شيء', 'None')} <${Icon} name="chevron" size=${18} /></span>
      </button>
    </div>

    <${PrefsCard} plan=${plan} avoid=${avoid} mealsPerWeek=${mealsPerWeek} onEdit=${openPrefs} />

    <${SectionTitle} title=${L('نوع السفرة', 'Cuisine')} />
    <${Cuisines} plans=${plans} current=${plan.id} onPick=${set.plan} cards=${cuisineCards} />
    <p class="tagline">${L(plan.tagline, plan.tagline_en || plan.tagline)}</p>

    <ol class="meals">
      ${plan.meals.map((meal, index) => {
        const off = week.skipped.includes(meal.id);
        const isLocked = locked.has(meal.id);
        const best = mealHighlight(meal, offers);
        const bought = meal.ingredients.map(ingredient => (ingredient.offer ? offers.get(ingredient.offer) : null)).filter(Boolean);
        return html`
          <li class=${'meal' + (off ? ' is-off' : '') + (isLocked ? ' is-locked' : '')}>
            <a class="meal__main" href=${isLocked ? '#/me' : '#/meal/' + meal.id}>
              <span class=${'meal__tile tile-' + (index % 6)}><${MealArt} meal=${meal} size=${48} fill /></span>
              <span class="meal__body">
                <span class="meal__day">${L('اليوم ', 'Day ')}${index + 1}${week.fresh.includes(meal.id) ? html` <span class="badge badge--gold">${L('جديد', 'New')}</span>` : plan.replacements.includes(meal.id) ? html` <span class="badge badge--gold">${L('بديل', 'Swapped in')}</span>` : null}</span>
                <span class="meal__name">${nm(meal)}</span>
                ${isLocked
                  ? html`<span class="meal__meta"><${Icon} name="lock" size=${13} /> ${L('مع مقاضي بلس', 'With Maqadi Plus')}</span>`
                  : html`<span class="meal__meta"><${Icon} name="clock" size=${13} /> ${meal.minutes}${L(' دقيقة', ' min')} · ${L(bought.length + ' مكونات من المتجر', pl(bought.length, 'item', 'items') + ' to buy')}</span>
                    ${best ? html`<span class="meal__deal">${L('عرض: ', 'Offer: ')}${nm(best)} <b dir="ltr">${money(halalas(best.price))}</b> ${L('بدل', 'instead of')} <s dir="ltr">${money(halalas(best.was))}</s></span>` : null}
                    <span class="thumbs">${bought.slice(0, 4).map(offer => html`<${Photo} data=${data} offer=${offer} width=${128} cls="thumb" />`)}${bought.length > 4 ? html`<em>+${bought.length - 4}</em>` : null}</span>`}
              </span>
            </a>
            ${isLocked ? null : html`
              <div class="meal__actions">
                <button type="button" class="meal__toggle" aria-pressed=${!off} aria-label=${(off ? L('إضافة ', 'Add ') : L('استبعاد ', 'Leave out ')) + nm(meal)} onClick=${() => set.toggleMeal(meal.id)}>
                  <${Icon} name="check" size=${16} stroke=${2.6} />
                </button>
                ${swaps.length ? html`<button type="button" class="meal__swap" aria-label=${L('تبديل ', 'Swap ') + nm(meal)} onClick=${() => setSwapFor(meal)}><${Icon} name="swap" size=${15} /> ${L('بدّل', 'Swap')}</button>` : null}
              </div>`}
          </li>`;
      })}
    </ol>

    ${plan.essentials && plan.essentials.items.length ? html`
      <label class="essentials">
        <span class="essentials__pic"><${Emoji} char=${plan.essentials.items.some(item => (item.tags || []).includes('egg')) ? '🥚' : '🍞'} size=${34} /></span>
        <span class="essentials__body">
          <span class="essentials__name">${L(plan.essentials.name, plan.essentials.name_en || plan.essentials.name)}</span>
          <span class="essentials__text">${plan.essentials.items.map(nm).join(L('، ', ', '))}</span>
        </span>
        <input class="switch" type="checkbox" role="switch" checked=${week.essentials} onChange=${event => set.essentials(event.target.checked)} />
      </label>` : null}

    ${swapFor ? html`<${SwapSheet} meal=${swapFor} options=${swaps} offers=${offers} onPick=${id => { set.swap(swapFor.id, id); setSwapFor(null); }} onClose=${() => setSwapFor(null)} />` : null}

    <p class="fineprint">${L(
      'تتغيّر الطبخات كل أسبوع حسب أرخص ما في المتجر. «بدّل» تعرض طبخات أخرى من نفس السفرة أو من سفر أخرى، والقائمة تتحدّث فوراً.',
      'Meals change every week with the cheapest products in the store. “Swap” shows other meals from this cuisine or others, and the list updates straight away.')}</p>`;
}

/* The meals that can take this one's place. */
function SwapSheet({ meal, options, offers, onPick, onClose }) {
  return html`
    <${Sheet} title=${L('بدل «' + nm(meal) + '»', 'Instead of “' + nm(meal) + '”')} onClose=${onClose}>
      <ul class="sheet__list">
        ${options.map((option, i) => {
          const best = mealHighlight(option, offers);
          const groupStart = option.cuisine && !(options[i - 1] && options[i - 1].cuisine);
          return html`
            ${groupStart ? html`<li class="sheet__group">${L('من سفر أخرى', 'From other cuisines')}</li>` : null}
            <li>
              <button type="button" class="swap-option" onClick=${() => onPick(option.id)}>
                <span class="swap-option__tile"><${MealArt} meal=${option} size=${34} fill /></span>
                <span class="swap-option__body">
                  <span class="swap-option__name">${nm(option)}</span>
                  <span class="swap-option__meta">${option.cuisine ? cuisineLabel(option.cuisine) + ' · ' : ''}${option.minutes}${L(' دقيقة', ' min')}${best ? html` · ${nm(best)} <b dir="ltr">${money(halalas(best.price))}</b>` : null}</span>
                  ${option.unavailable ? html`<span class="swap-option__note">${L('مكوّنها الأساسي غير متوفر في المتجر هذا الأسبوع', 'Its main ingredient is not in the store this week')}</span>` : null}
                </span>
              </button>
            </li>`;
        })}
      </ul>
    <//>`;
}

/* ---------------------------------------------------------------------
   One meal
   ------------------------------------------------------------------- */
/* The recipe as text, for sending to someone who will cook it. */
function recipeText(meal, scale) {
  const steps = LANG === 'en' && meal.steps_en ? meal.steps_en : meal.steps;
  return [
    nm(meal), L(meal.summary, meal.summary_en || meal.summary), '',
    L('المكونات:', 'Ingredients:'),
    ...meal.ingredients.map(ingredient => `▫️ ${nm(ingredient)}${ingredientAmount(ingredient, scale) ? ' — ' + ingredientAmount(ingredient, scale) : ''}`), '',
    L('الطريقة:', 'Method:'),
    ...steps.map((step, at) => `${at + 1}. ${step}`), '',
    L('من تطبيق مقاضي', 'From the Maqadi app') + ' ' + window.location.origin + window.location.pathname
  ].join('\n');
}

function MealPage({ data, plan, meal, index, persons, kids, servings, offers, backHref }) {
  const [sent, setSent] = useState(false);
  const scale = servings / plan.base_persons;
  const bought = meal.ingredients.filter(ingredient => ingredient.offer).length;
  const steps = LANG === 'en' && meal.steps_en ? meal.steps_en : meal.steps;
  const tip = LANG === 'en' && meal.tip_en ? meal.tip_en : meal.tip;
  const photo = MEAL_PHOTOS && meal.photo;
  // The week's offer on this dish, named by its ingredient ("whole chicken") rather than the product.
  const best = mealHighlight(meal, offers);
  const bestFor = best ? meal.ingredients.find(ingredient => ingredient.offer === best.id) : null;
  const share = async () => {
    if (await sendListText(recipeText(meal, scale)) === 'copied') { setSent(true); setTimeout(() => setSent(false), 2500); }
  };
  const chips = html`
    <span class="chip-soft"><${Icon} name="clock" size=${15} /> ${meal.minutes}${L(' دقيقة', ' min')}</span>
    <span class="chip-soft"><${Icon} name="people" size=${15} /> ${L('تكفي ', 'Serves ')}${familyLabel(persons, kids)}</span>
    <span class="chip-soft"><${Icon} name="cart" size=${15} /> ${L(bought + ' مكونات من المتجر', pl(bought, 'item', 'items') + ' to buy')}</span>`;
  const summary = L(meal.summary, meal.summary_en || meal.summary);
  return html`
    <article class="recipe">
      ${photo ? html`
        <header class="recipe__hero recipe__hero--photo">
          <img class="recipe__bg" src=${'meals/' + meal.photo} alt="" decoding="async" />
          <a class="recipe__back recipe__glass" href=${backHref} aria-label=${L('رجوع', 'Back')}><${Icon} name="back" size=${20} stroke=${2.2} /></a>
          <button type="button" class="recipe__share recipe__glass" onClick=${share} aria-label=${L('أرسل الوصفة', 'Send the recipe')}><${Icon} name=${sent ? 'check' : 'share'} size=${19} stroke=${2.1} /></button>
          <div class="recipe__over">
            ${best && bestFor ? html`<span class="recipe__deal">${L('عرض: ', 'Offer: ')}${nm(bestFor)} <b dir="ltr">${money(halalas(best.price))}</b> ${L('بدل', 'instead of')} <s dir="ltr">${money(halalas(best.was))}</s></span>` : null}
            <h1 class="recipe__name">${nm(meal)}</h1>
            <p class="recipe__summary">${summary}</p>
            <div class="recipe__chips">${chips}</div>
          </div>
        </header>`
        : html`
        <header class=${'recipe__hero tile-' + (Math.max(0, index) % 6)}>
          <a class="recipe__back" href=${backHref} aria-label=${L('رجوع', 'Back')}><${Icon} name="back" size=${20} stroke=${2.2} /></a>
          <${MealArt} meal=${meal} size=${132} />
        </header>
        <div class="recipe__head">
          <h1 class="recipe__name">${nm(meal)}</h1>
          <p class="recipe__summary">${summary}</p>
          <div class="recipe__chips">${chips}</div>
        </div>`}

      <h2 class="section-title">${L('المكونات', 'Ingredients')}</h2>
      <ul class="ingredients">
        ${meal.ingredients.map(ingredient => {
          const offer = ingredient.offer ? offers.get(ingredient.offer) : null;
          return html`
            <li class="ingredient">
              ${offer ? html`<${Photo} data=${data} offer=${offer} width=${128} cls="ingredient__photo" />` : html`<span class="ingredient__photo photo--none"><${Emoji} char="🧂" size=${24} /></span>`}
              <span class="ingredient__body">
                <span class="ingredient__name">${nm(ingredient)}${ingredient.pantry ? html`<small>${L(' من مطبخك', ' from your kitchen')}</small>` : null}</span>
                <span class="ingredient__qty">${ingredientAmount(ingredient, scale)}</span>
                ${offer ? html`<span class="ingredient__offer">${storeName(data, offer.store)}: ${nm(offer)} ${offerSize(offer)}</span>` : null}
              </span>
              ${offer ? html`<${OfferPrice} offer=${offer} />` : null}
            </li>`;
        })}
      </ul>

      <h2 class="section-title">${L('الطريقة', 'Method')}</h2>
      <ol class="steps">
        ${steps.map(step => html`<li>${step}</li>`)}
      </ol>
      ${tip ? html`<p class="tip"><${Emoji} char="💡" size=${22} /> <span>${tip}</span></p>` : null}
    </article>`;
}

/* ---------------------------------------------------------------------
   Stories: the week told one screen at a time, opened from the rings on
   the home screen (never on their own). Each meal is a story with its offer;
   the last is the basket.
   ------------------------------------------------------------------- */
const STORY_MS = 6500;

function StoryRings({ items, seen }) {
  return html`
    <nav class="rings" aria-label=${L('قصص الأسبوع', 'This week’s stories')}>
      ${items.map((item, at) => html`
        <a class=${'ring' + (seen.includes(item.id) ? ' is-seen' : '') + (item.basket ? ' ring--basket' : '')} href=${'#/story/' + at}
          aria-label=${(item.basket ? L('قصة السلة', 'Basket story') : L('قصة ', 'Story: ') + item.label) + (seen.includes(item.id) ? L('، شاهدتها', ', seen') : '')}>
          <span class="ring__pic"><span class=${'ring__in' + (item.basket ? '' : ' tile-' + item.tile)}>${item.meal ? html`<${MealArt} meal=${item.meal} size=${36} fill />` : html`<${Emoji} char=${item.emoji} size=${36} />`}</span></span>
          <span class="ring__name" aria-hidden="true">${item.label}</span>
        </a>`)}
    </nav>`;
}

function StoryMeal({ data, item, number, total, offers, onSwap, canSwap, onKeep }) {
  const meal = item.meal;
  const best = mealHighlight(meal, offers);
  const shown = best || meal.ingredients.map(ingredient => (ingredient.offer ? offers.get(ingredient.offer) : null)).find(Boolean);
  const bought = meal.ingredients.filter(ingredient => ingredient.offer).length;
  const percent = best ? discountPercent(best) : 0;
  return html`
    <div class="story__hero"><${MealArt} meal=${meal} size=${240} /></div>
    <p class="story__count">${L(`الطبخة ${number} من ${total}`, `Meal ${number} of ${total}`)}</p>
    <h2 class="story__name">${nm(meal)}</h2>
    <p class="story__chips">
      <span><${Icon} name="clock" size=${16} /> ${meal.minutes}${L(' دقيقة', ' min')}</span>
      <span><${Icon} name="cart" size=${16} /> ${L(bought + ' مكونات من المتجر', pl(bought, 'item', 'items') + ' to buy')}</span>
    </p>
    ${shown ? html`
      <div class="story__deal">
        <${Photo} data=${data} offer=${shown} width=${256} cls="story__photo" />
        <span class="story__dealtext">
          <small><${StoreDot} id=${shown.store} />${best ? L('عرض ' + storeName(data, shown.store) + ' هذا الأسبوع', storeName(data, shown.store) + ' offer this week') : L('من ' + storeName(data, shown.store), 'From ' + storeName(data, shown.store))}</small>
          <b>${nm(shown)}</b>
          <span class="story__price"><strong dir="ltr">${money(halalas(shown.price))}</strong> ${riyal()}${best ? html` <s dir="ltr">${money(halalas(best.was))}</s>` : null}</span>
        </span>
        ${percent ? html`<span class="story__off" dir="ltr">−${percent}%</span>` : null}
      </div>` : null}
    <div class="story__actions">
      ${canSwap ? html`<button type="button" class="story__glass" onClick=${onSwap}><${Icon} name="swap" size=${19} /> ${L('بدّلها', 'Swap')}</button>` : null}
      <button type="button" class="story__solid" onClick=${onKeep}><${Icon} name="check" size=${19} stroke=${2.4} /> ${L('أبقِها', 'Keep it')}</button>
    </div>
    <a class="story__up" href=${'#/meal/' + meal.id}><${Icon} name="down" size=${18} stroke=${2.2} /> ${L('اسحب للأعلى للوصفة', 'Swipe up for the recipe')}</a>`;
}

function StoryBasket({ data, list, storeRows, verdict, cooked, essentials, onShare }) {
  const photos = list.lines.filter(line => line.offer.img).sort((a, b) => b.cost - a.cost).slice(0, 5);
  // The dearest in the middle of the fan.
  const fan = [3, 1, 0, 2, 4].map(at => photos[at]).filter(Boolean);
  const high = Math.max(...storeRows.map(row => row.cost));
  const store = storeRows.find(row => row.current);
  return html`
    <div class="story__done">
      <${Emoji} char="🎉" size=${84} />
      <h2 class="story__title">${L('أسبوعك جاهز!', 'Your week is ready!')}</h2>
      <p>${mealsWord(cooked)}${essentials ? L(' وأساسيات الفطور والعشاء', ' plus breakfast and dinner basics') : ''} · ${L(list.totals.items + ' صنف', pl(list.totals.items, 'item', 'items'))}</p>
    </div>
    <div class="story__fan" aria-hidden="true">${fan.map(line => html`<${Photo} data=${data} offer=${line.offer} width=${256} cls="story__fanpic" />`)}</div>
    <p class="story__total"><${Sum} value=${list.totals.cost} /> <span>${riyal()}</span></p>
    <p class="story__totalsub">
      ${L('كل المقاضي من ' + store.name, 'Everything from ' + store.name)}${list.totals.saved ? html` · ${L('وفّرت', 'you save')} <b dir="ltr">${money(list.totals.saved)}</b> ${L('من العروض', 'on offers')}` : null}
    </p>
    ${storeRows.length > 1 ? html`
      <div class="story__vs">
        ${storeRows.map(row => html`
          <p class=${'story__vsrow' + (verdict && verdict.id === row.id ? ' is-best' : '')}>
            <span class="story__vsname"><${StoreDot} id=${row.id} />${row.name}</span>
            <span class="story__vsbar" aria-hidden="true"><i style=${'width:' + Math.round(row.cost / high * 100) + '%'}></i></span>
            <b dir="ltr">${money(row.cost)}</b>
          </p>`)}
        ${verdict ? html`<p class="story__lead"><${Emoji} char="💰" size=${22} /> ${L(storeName(data, verdict.id) + ' أرخص بـ', storeName(data, verdict.id) + ' is cheaper by')} <b dir="ltr">${money(verdict.by)}</b> ${riyal()}</p>` : null}
      </div>` : null}
    <div class="story__actions story__actions--stack">
      <a class="story__solid" href="#/list">${L('افتح قائمة المقاضي', 'Open the shopping list')}</a>
      <button type="button" class="story__glass" onClick=${onShare}><${Icon} name="share" size=${19} /> ${L('شارك أسبوعك', 'Share your week')}</button>
    </div>`;
}

function Stories({ data, items, start, offers, list, storeRows, verdict, cooked, essentials, swaps, seen, set, onClose, onShare }) {
  const [at, setAt] = useState(() => clamp(Number(start) || 0, 0, items.length - 1));
  const [held, setHeld] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const touch = useRef(null);
  const index = Math.min(at, items.length - 1);
  const item = items[index];
  const rtl = LANG !== 'en';
  const next = () => { if (index < items.length - 1) setAt(index + 1); };
  const prev = () => { if (index > 0) setAt(index - 1); };
  const recipe = () => { if (item.meal) window.location.hash = '#/meal/' + item.meal.id; };

  useEffect(() => { if (item && !seen.includes(item.id)) set.seen(item.id); }, [item && item.id]);
  useEffect(() => {
    document.body.classList.add('is-locked');
    const onVisible = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', onVisible);
    return () => { document.body.classList.remove('is-locked'); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  useEffect(() => {
    const onKey = event => {
      if (swapping || document.querySelector('.sheet')) return; // a sheet on top takes the keys
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowLeft') (rtl ? next : prev)();
      else if (event.key === 'ArrowRight') (rtl ? prev : next)();
      else if (event.key === 'ArrowUp') recipe();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  if (!item) return null;
  const paused = held || swapping || hidden;
  // Swipes inside the swap sheet scroll the sheet; they don't move the stories.
  const onTouchStart = event => { touch.current = swapping ? null : { x: event.touches[0].clientX, y: event.touches[0].clientY }; };
  const onTouchEnd = event => {
    const from = touch.current;
    touch.current = null;
    if (!from) return;
    const dx = event.changedTouches[0].clientX - from.x;
    const dy = event.changedTouches[0].clientY - from.y;
    if (Math.abs(dy) > 70 && Math.abs(dy) > Math.abs(dx)) { if (dy < 0) recipe(); else onClose(); }
    else if (Math.abs(dx) > 60) { if (rtl ? dx > 0 : dx < 0) next(); else prev(); }
  };
  const meals = items.filter(entry => entry.meal);
  return html`
    <div class=${'story ' + (item.basket ? 'story--basket' : 'story--t' + item.tile)} role="dialog" aria-modal="true" aria-label=${L('قصص الأسبوع', 'This week’s stories')}
      onTouchStart=${onTouchStart} onTouchEnd=${onTouchEnd}
      onPointerDown=${() => setHeld(true)} onPointerUp=${() => setHeld(false)} onPointerCancel=${() => setHeld(false)} onPointerLeave=${() => setHeld(false)}>
      <div class="story__bars" aria-hidden="true">
        ${items.map((entry, i) => html`
          <i class=${i < index ? 'is-done' : i === index ? 'is-now' : ''}>
            ${i === index ? html`<u key=${entry.id + ':' + index} class=${entry.basket ? 'is-still' : ''}
              style=${'animation-duration:' + STORY_MS + 'ms;animation-play-state:' + (paused ? 'paused' : 'running')}
              onAnimationEnd=${next}></u>` : null}
          </i>`)}
      </div>
      <div class="story__top">
        <${Logo} size=${34} />
        <span class="story__who"><b>${item.basket ? L('سلّة الأسبوع', 'The week’s basket') : L('طبخات الأسبوع', 'This week’s meals')}</b><small>${item.basket ? L('آخر قصة', 'Last story') : L(`${index + 1} من ${meals.length}`, `${index + 1} of ${meals.length}`)}</small></span>
        <button type="button" class="story__close" onClick=${onClose} aria-label=${L('إغلاق القصص', 'Close the stories')}><${Icon} name="close" size=${24} stroke=${2.2} /></button>
      </div>
      <button type="button" class="story__tap story__tap--prev" onClick=${prev} aria-label=${L('القصة السابقة', 'Previous story')} disabled=${index === 0}></button>
      <button type="button" class="story__tap story__tap--next" onClick=${next} aria-label=${L('القصة التالية', 'Next story')} disabled=${index === items.length - 1}></button>
      <div class="story__body" key=${item.id} aria-live="polite">
        ${item.basket
          ? html`<${StoryBasket} data=${data} list=${list} storeRows=${storeRows} verdict=${verdict} cooked=${cooked} essentials=${essentials} onShare=${onShare} />`
          : html`<${StoryMeal} data=${data} item=${item} number=${meals.indexOf(item) + 1} total=${meals.length} offers=${offers}
              canSwap=${swaps.length > 0} onSwap=${() => setSwapping(true)} onKeep=${next} />`}
      </div>
      ${swapping && item.meal ? html`<${SwapSheet} meal=${item.meal} options=${swaps} offers=${offers}
        onPick=${id => { set.swap(item.meal.id, id); setSwapping(false); }} onClose=${() => setSwapping(false)} />` : null}
    </div>`;
}

/* ---------------------------------------------------------------------
   Shopping list
   ------------------------------------------------------------------- */
function lineDetail(line) {
  const offer = line.offer;
  const each = money(halalas(offer.price));
  const unit = soldBy(offer.sold_by) || L('للعبوة', 'per pack');
  if (line.loose) return L(`${line.units} كجم × ${each} للكيلو`, `${line.units} kg × ${each} per kg`);
  return `${line.units} × ${each} ${unit}`;
}

function shareText(data, list, period) {
  const rows = [];
  rows.push(L(`🛒 مقاضي الأسبوع — ${period.text}`, `🛒 This week’s groceries — ${period.text}`));
  AISLES.forEach(aisle => {
    const lines = list.lines.filter(line => aisleOf(line.offer.category) === aisle);
    if (!lines.length) return;
    rows.push('', aisleName(aisle) + ':');
    lines.forEach(line => rows.push(`▫️ ${nm(line.offer)}${offerSize(line.offer) ? ' ' + offerSize(line.offer) : ''} — ${lineDetail(line)} = ${money(line.cost)} (${storeName(data, line.offer.store)})`));
  });
  if (list.unpriced.length) {
    rows.push('', L('بدون سعر هذا الأسبوع:', 'No price this week:'));
    list.unpriced.forEach(item => rows.push(`▫️ ${nm(item)}${item.need ? ' — ' + amount(item.need) : ''}`));
  }
  rows.push('', L(`إجمالي الأصناف المسعّرة: ${money(list.totals.cost)} ريال`, `Total of priced items: ${money(list.totals.cost)} SAR`));
  if (list.totals.saved) rows.push(L(`التوفير من الخصومات: ${money(list.totals.saved)} ريال`, `Saved on discounts: ${money(list.totals.saved)} SAR`));
  return rows.join('\n');
}

/* Sends the list as text: the phone's share sheet, else the clipboard, else WhatsApp.
   Resolves to 'copied' when it went to the clipboard. */
async function sendListText(text) {
  try {
    if (navigator.share) { await navigator.share({ text }); return 'shared'; }
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch (error) {
    if (error && error.name === 'AbortError') return 'cancelled';
    window.location.href = 'https://wa.me/?text=' + encodeURIComponent(text);
    return 'shared';
  }
}

/* ---------------------------------------------------------------------
   The week's receipt
   ------------------------------------------------------------------- */
const RECEIPT_ROWS = 6;
// A receipt prints every price with its halalas: 4 → "4.00".
const cents = h => (h / 100).toFixed(2);

/* The stamp: the cheapest store and its lead when the comparison is fair,
   otherwise what the offers saved; nothing when there is neither. */
function stampOf(data, receipt) {
  const current = receipt.columns[0];
  if (receipt.verdict) return { top: L(storeName(data, receipt.verdict.id) + ' أرخص', storeName(data, receipt.verdict.id) + ' is cheaper'), value: receipt.verdict.by, bottom: L('ريال · مقاضي ✓', 'SAR · Maqadi ✓') };
  if (current.list.totals.saved) return { top: L('وفّرت', 'You save'), value: current.list.totals.saved, bottom: L('ريال من العروض', 'SAR on offers') };
  return null;
}

function Receipt({ data, receipt, plan, persons, kids, onShare, onStore }) {
  const [open, setOpen] = useState(false);
  const stampRef = useRef(null);
  // The stamp lands after the receipt prints (see .receipt__stamp in app.css); then a burst of paper.
  useEffect(() => {
    const timer = setTimeout(() => confetti(stampRef.current), 900);
    return () => clearTimeout(timer);
  }, []);
  const { columns, rows, verdict } = receipt;
  const current = columns[0];
  const shown = open ? rows : rows.slice(0, RECEIPT_ROWS);
  const stamp = stampOf(data, receipt);
  const checked = (data.offers.stores[current.id] || {}).checked;
  const cheaper = verdict && verdict.id !== current.id ? columns.find(column => column.id === verdict.id) : null;
  const cell = (row, cost, at) => {
    if (cost === null) return html`<td class="is-none">—</td>`;
    const best = at === row.cheapest;
    return html`<td class=${best ? 'is-best' : row.cheapest >= 0 ? 'is-more' : ''}><span>${cents(cost)}</span>${best ? html`<span class="vh">${L(' (الأرخص)', ' (cheapest)')}</span>` : null}</td>`;
  };
  return html`
    <section class="float receipt" aria-label=${L('إيصال الأسبوع', 'The week’s receipt')}>
      <div class="receipt__slot" aria-hidden="true"></div>
      <div class="receipt__wrap">
        <div class=${'receipt__paper' + (stamp ? ' has-stamp' : '')}>
          <div class="receipt__head">
            <${Logo} size=${40} />
            <b>${appName()}</b>
            <small>${cuisineLabel(plan.name)} · ${familyLabel(persons, kids)}</small>
          </div>
          <hr class="receipt__cut" />
          <table class="receipt__table">
            <thead>
              <tr><th scope="col">${L('الصنف', 'Item')}</th>${columns.map(column => html`<th scope="col"><${StoreDot} id=${column.id} />${column.name}</th>`)}</tr>
            </thead>
            <tbody>
              ${shown.map(row => html`
                <tr>
                  <th scope="row">${row.line.extra ? nm(row.line.offer) : nm(row.line)}</th>
                  ${row.costs.map((cost, at) => cell(row, cost, at))}
                </tr>`)}
            </tbody>
          </table>
          ${rows.length > RECEIPT_ROWS ? html`
            <button type="button" class="receipt__more" aria-expanded=${open} onClick=${() => setOpen(!open)}>
              ${open ? L('عرض أقل', 'Show less') : L(`+ ${rows.length - RECEIPT_ROWS} أصناف أخرى`, `+ ${rows.length - RECEIPT_ROWS} more items`)}
            </button>` : null}
          <hr class="receipt__cut" />
          <table class="receipt__table receipt__totals">
            <tbody>
              <tr class="is-total">
                <th scope="row">${L('المجموع', 'Total')}</th>
                ${columns.map(column => html`<td class=${verdict ? (verdict.id === column.id ? 'is-best' : 'is-more') : ''}><span>${cents(column.list.totals.cost)}</span></td>`)}
              </tr>
              <tr class="is-saved">
                <th scope="row">${L('وفّرت من العروض', 'Saved on offers')}</th>
                ${columns.map(column => html`<td>${cents(column.list.totals.saved)}</td>`)}
              </tr>
            </tbody>
          </table>
          ${columns.filter(column => column.caveat).map(column => html`<p class="receipt__note">${column.name}: ${column.caveat}</p>`)}
          ${checked ? html`<p class="receipt__date">${L('أسعار المتاجر كما ظهرت يوم ' + longDay(checked), 'Store prices as shown on ' + longDay(checked))}</p>` : null}
        </div>
      </div>
      ${stamp ? html`
        <p class="receipt__stamp" ref=${stampRef}>
          <small>${stamp.top}</small>
          <b dir="ltr">${money(stamp.value)}</b>
          <span>${stamp.bottom}</span>
        </p>` : null}
      <div class="receipt__actions">
        <button type="button" class="btn" onClick=${onShare}><${Icon} name="share" size=${19} /> ${L('شارك الإيصال', 'Share the receipt')}</button>
        ${cheaper ? html`
          <button type="button" class="btn btn--ghost" onClick=${() => onStore(cheaper.id)}>
            ${L('تسوّق من ' + cheaper.name, 'Shop at ' + cheaper.name)} <small dir="ltr">−${money(current.list.totals.cost - cheaper.list.totals.cost)}</small>
          </button>` : null}
      </div>
    </section>`;
}

/* ---------------------------------------------------------------------
   The picture people share: drawn on a canvas from the app's own fonts and
   pictures, so nothing from other sites is needed.
   ------------------------------------------------------------------- */
function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/* A 1080×1920 picture on the app's green with its name at the top, and
   helpers that write in the reader's direction. `pictures` are loaded too. */
async function cardKit(pictures) {
  const W = 1080;
  const H = 1920;
  const rtl = LANG !== 'en';
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const sample = 'مقاضي Maqadi 0123456789.';
  await Promise.all([document.fonts.load('700 60px "Readex Pro"', sample), document.fonts.load('400 40px "Readex Pro"', sample)]).catch(() => null);
  const [logo, ...images] = await Promise.all(['icons/icon-192.png'].concat(pictures).map(loadImage));

  const start = rtl ? W - 80 : 80;
  const sign = rtl ? -1 : 1; // moving along the reading direction
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textBaseline = 'alphabetic';
  const font = (weight, size) => `${weight} ${size}px "Readex Pro", "Segoe UI", Tahoma, sans-serif`;
  const write = (text, x, y, size, { weight = 400, color = '#fff', align = 'start' } = {}) => {
    ctx.font = font(weight, size);
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
    return ctx.measureText(text).width;
  };
  const fit = (text, size, weight, max) => {
    ctx.font = font(weight, size);
    if (ctx.measureText(text).width <= max) return text;
    let cut = text;
    while (cut.length > 1 && ctx.measureText(cut + '…').width > max) cut = cut.slice(0, -1);
    return cut + '…';
  };
  const round = (x, y, w, h, r) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h); };
  // A number written left to right, wherever the text runs.
  const number = (text, x, y, size, options) => {
    ctx.direction = 'ltr';
    const width = write(text, x, y, size, options);
    ctx.direction = rtl ? 'rtl' : 'ltr';
    return width;
  };

  // The green page, as the app's header.
  const bg = ctx.createRadialGradient(rtl ? 80 : W - 80, 0, 0, rtl ? 80 : W - 80, 0, 2100);
  bg.addColorStop(0, '#25b873');
  bg.addColorStop(0.5, '#0b6e45');
  bg.addColorStop(1, '#053d26');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.05)';
  ctx.lineWidth = 140;
  ctx.beginPath();
  ctx.arc(rtl ? W + 40 : -40, 80, 330, 0, Math.PI * 2);
  ctx.stroke();

  // The name.
  if (logo) {
    ctx.save();
    round(rtl ? start - 110 : start, 96, 110, 110, 28);
    ctx.clip();
    ctx.drawImage(logo, rtl ? start - 110 : start, 96, 110, 110);
    ctx.restore();
  }
  write(appName(), start + sign * 140, 172, 64, { weight: 700 });

  // The invitation.
  write(L('جرّب مقاضي', 'Try Maqadi'), start, H - 150, 50, { weight: 700 });
  write(fit(L('خطة طبخات الأسبوع وقائمة مقاضيها بأرخص سعر', 'The week’s meals and groceries at the lowest price'), 36, 400, W - 160), start, H - 90, 36, { color: 'rgba(255,255,255,.85)' });

  const done = () => new Promise((resolve, reject) => canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('no picture'))), 'image/png'));
  return { ctx, W, H, rtl, start, sign, font, write, fit, round, number, images, done };
}

async function drawShareCard({ data, receipt, meals, persons, kids }) {
  const kit = await cardKit([emojiFile('🎉'), emojiFile('💰')].concat(meals.slice(0, 7).map(meal => emojiFile(meal.emoji))));
  const { ctx, W, rtl, start, sign, font, write, fit, round } = kit;
  const [party, coin, ...dishes] = kit.images;

  // What the week saved, or what it costs when nothing was on offer.
  const current = receipt.columns[0];
  const saved = current.list.totals.saved;
  if (party) {
    ctx.save();
    ctx.translate(rtl ? 200 : W - 200, 420);
    ctx.rotate(0.2);
    ctx.drawImage(party, -100, -100, 200, 200);
    ctx.restore();
  }
  write(saved ? L('هذا الأسبوع وفّرت', 'This week I saved') : L('مقاضي أسبوعي', 'My week’s groceries'), start, 380, 60, { color: 'rgba(255,255,255,.92)' });
  const amount = money(saved || current.list.totals.cost);
  ctx.direction = 'ltr';
  const amountWidth = write(amount, rtl ? start : start, 590, 210, { weight: 700, align: rtl ? 'right' : 'left' });
  ctx.direction = rtl ? 'rtl' : 'ltr';
  write(riyal(), start + sign * (amountWidth + 26), 590, 64, { weight: 600 });
  write(fit(L(`${saved ? 'على ' : ''}مقاضي ${mealsWord(meals.length)} لـ ${familyLabel(persons, kids)}`, `${saved ? 'on ' : ''}groceries for ${mealsWord(meals.length)}, ${familyLabel(persons, kids)}`), 44, 400, W - 160),
    start, 680, 44, { color: 'rgba(255,255,255,.9)' });

  // A torn-off piece of the receipt: the biggest differences and the totals.
  const columns = receipt.columns;
  const rows = receipt.rows.filter(row => row.cheapest >= 0).slice(0, 3);
  const top = 750;
  const height = 120 + rows.length * 66 + 110;
  ctx.fillStyle = '#fffef9';
  ctx.beginPath();
  ctx.moveTo(80, top + 28);
  ctx.arcTo(80, top, 108, top, 28);
  ctx.lineTo(W - 108, top);
  ctx.arcTo(W - 80, top, W - 80, top + 28, 28);
  ctx.lineTo(W - 80, top + height);
  for (let x = W - 80; x > 80; x -= 32) { ctx.lineTo(x - 16, top + height + 16); ctx.lineTo(Math.max(80, x - 32), top + height); }
  ctx.closePath();
  ctx.fill();
  const colW = columns.length > 2 ? 170 : 210;
  const colX = at => (rtl ? 130 + (columns.length - 1 - at) * colW + colW / 2 : W - 130 - (columns.length - at) * colW + colW / 2);
  const nameStart = rtl ? W - 130 : 130;
  const nameMax = W - 260 - columns.length * colW - 20;
  let y = top + 80;
  write(L('الصنف', 'Item'), nameStart, y, 34, { weight: 600, color: '#6b726d' });
  columns.forEach((column, at) => write(column.name, colX(at), y, 34, { weight: 600, color: '#6b726d', align: 'center' }));
  const price = (value, x, yy, best, more, size = 40) => {
    const text = cents(value);
    ctx.font = font(700, size);
    if (best) {
      const w = ctx.measureText(text).width + 36;
      ctx.fillStyle = '#e7f5ec';
      round(x - w / 2, yy - size + 2, w, size + 18, 14);
      ctx.fill();
    }
    ctx.direction = 'ltr';
    write(text, x, yy, size, { weight: best ? 700 : 500, color: best ? '#0b6e45' : more ? '#9aa19c' : '#1b1f1c', align: 'center' });
    ctx.direction = rtl ? 'rtl' : 'ltr';
  };
  rows.forEach(row => {
    y += 66;
    write(fit(row.line.extra ? nm(row.line.offer) : nm(row.line), 40, 400, nameMax), nameStart, y, 40, { color: '#1b1f1c' });
    row.costs.forEach((cost, at) => (cost === null ? write('—', colX(at), y, 40, { color: '#9aa19c', align: 'center' }) : price(cost, colX(at), y, at === row.cheapest, row.cheapest >= 0)));
  });
  ctx.strokeStyle = '#c9ccc6';
  ctx.lineWidth = 3;
  ctx.setLineDash([12, 10]);
  ctx.beginPath();
  ctx.moveTo(130, y + 34);
  ctx.lineTo(W - 130, y + 34);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 100;
  write(L('المجموع', 'Total'), nameStart, y, 44, { weight: 700, color: '#1b1f1c' });
  columns.forEach((column, at) => price(column.list.totals.cost, colX(at), y, receipt.verdict && receipt.verdict.id === column.id, Boolean(receipt.verdict), 46));

  // The week's dishes.
  y = top + height + 70;
  const shown = dishes.filter(Boolean);
  if (shown.length) {
    ctx.fillStyle = 'rgba(255,255,255,.1)';
    round(80, y, W - 160, 150, 36);
    ctx.fill();
    const gap = (W - 160) / shown.length;
    shown.forEach((img, i) => ctx.drawImage(img, (rtl ? W - 80 - gap * (i + 1) : 80 + gap * i) + gap / 2 - 50, y + 25, 100, 100));
    y += 200;
  }

  // Where it costs least.
  if (receipt.verdict) {
    ctx.fillStyle = '#ffb020';
    round(80, y, W - 160, 120, 32);
    ctx.fill();
    if (coin) ctx.drawImage(coin, rtl ? W - 80 - 100 : 100, y + 26, 68, 68);
    write(L(`${storeName(data, receipt.verdict.id)} أرخص بـ ${money(receipt.verdict.by)} ريال`, `${storeName(data, receipt.verdict.id)} is cheaper by ${money(receipt.verdict.by)} SAR`),
      start + sign * 100, y + 76, 46, { weight: 700, color: '#3b2a00' });
  }

  return kit.done();
}

/* The month's saving as a picture: the total, each shop, and a year at this pace. */
async function drawSavingsCard(summary) {
  const kit = await cardKit([emojiFile('🏆'), emojiFile('💰')]);
  const { ctx, W, rtl, start, sign, write, round, number } = kit;
  const [trophy, coin] = kit.images;
  if (trophy) {
    ctx.save();
    ctx.translate(rtl ? 200 : W - 200, 430);
    ctx.rotate(0.18);
    ctx.drawImage(trophy, -110, -110, 220, 220);
    ctx.restore();
  }
  write(L('هذا الشهر وفّرت', 'This month I saved'), start, 400, 60, { color: 'rgba(255,255,255,.92)' });
  const whole = String(Math.round(summary.total / 100));
  const width = number(whole, start, 640, 250, { weight: 700, align: rtl ? 'right' : 'left' });
  write(riyal(), start + sign * (width + 26), 640, 70, { weight: 600 });
  write(L(`على مقاضي البيت، في ${summary.trips.length} ${summary.trips.length === 1 ? 'مرة تسوّق' : 'مرات تسوّق'}`, `on the family's groceries, over ${pl(summary.trips.length, 'shop', 'shops')}`), start, 730, 44, { color: 'rgba(255,255,255,.9)' });

  // One bar per shop, the latest in gold.
  const trips = summary.trips.slice(-6);
  const top = 820;
  ctx.fillStyle = 'rgba(255,255,255,.1)';
  round(80, top, W - 160, 420, 40);
  ctx.fill();
  const high = Math.max(1, ...trips.map(trip => trip.saving));
  const slot = (W - 240) / trips.length;
  trips.forEach((trip, at) => {
    const x = rtl ? W - 120 - slot * (at + 1) : 120 + slot * at;
    const h = Math.max(16, Math.round(trip.saving / high * 230));
    ctx.fillStyle = at === trips.length - 1 ? '#ffb020' : 'rgba(255,255,255,.35)';
    round(x + slot * 0.18, top + 330 - h, slot * 0.64, h, 18);
    ctx.fill();
    number(String(Math.round(trip.saving / 100)), x + slot / 2, top + 310 - h, 40, { weight: 700, align: 'center' });
    write(shortDay(trip.date), x + slot / 2, top + 385, 30, { color: 'rgba(255,255,255,.8)', align: 'center' });
  });

  // A year at this pace.
  const year = Math.floor(summary.total * 12 / 10000) * 100;
  if (year >= 100) {
    const y = top + 480;
    ctx.fillStyle = '#ffb020';
    round(80, y, W - 160, 120, 32);
    ctx.fill();
    if (coin) ctx.drawImage(coin, rtl ? W - 80 - 100 : 100, y + 26, 68, 68);
    write(L(`يعني أكثر من ${count(year)} ريال في السنة`, `That's over ${count(year)} SAR a year`), start + sign * 100, y + 76, 46, { weight: 700, color: '#3b2a00' });
  }
  return kit.done();
}

function ShareSheet({ makeCard, caption, listText, title, onClose }) {
  const [card, setCard] = useState(null);
  const [failed, setFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let alive = true;
    let url = null;
    makeCard().then(blob => {
      if (!alive) return;
      url = URL.createObjectURL(blob);
      setCard({ url, file: new File([blob], 'maqadi.png', { type: 'image/png' }) });
    }).catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; if (url) URL.revokeObjectURL(url); };
  }, []);
  const canShare = Boolean(card && navigator.canShare && navigator.canShare({ files: [card.file] }));
  const shareImage = () => navigator.share({ files: [card.file], text: caption }).catch(() => { /* closed */ });
  const sendText = async () => {
    if (await sendListText(listText) === 'copied') { setCopied(true); setTimeout(() => setCopied(false), 2500); }
  };
  return html`
    <${Sheet} title=${title || L('شارك إيصالك', 'Share your receipt')} onClose=${onClose}>
      <div class="share__preview">
        ${card ? html`<img src=${card.url} alt=${title || L('صورة إيصال الأسبوع', 'A picture of the week’s receipt')} />`
          : html`<span class="share__wait">${failed ? L('تعذّر تجهيز الصورة.', 'The picture couldn’t be made.') : L('جاري تجهيز الصورة…', 'Making the picture…')}</span>`}
      </div>
      <div class="share__actions">
        ${canShare ? html`<button type="button" class="btn btn--wide" onClick=${shareImage}><${Icon} name="share" size=${19} /> ${L('شارك الصورة', 'Share the picture')}</button>` : null}
        ${card ? html`<a class=${'btn btn--wide' + (canShare ? ' btn--ghost' : '')} href=${card.url} download="maqadi.png"><${Icon} name="down" size=${19} /> ${L('حفظ الصورة', 'Save the picture')}</a>` : null}
        ${listText ? html`<button type="button" class="btn btn--wide btn--ghost" onClick=${sendText}>${copied ? L('تم نسخ القائمة', 'List copied') : L('أرسل القائمة نصاً', 'Send the list as text')}</button>` : null}
      </div>
    <//>`;
}

function ListTab({ data, head, list, week, set, period, receipt, plan, persons, kids, budgetInfo, onShare }) {
  const done = key => week.checked.includes(key);
  const total = list.lines.length + list.unpriced.length;
  const ticked = list.lines.filter(line => done(line.key)).length + list.unpriced.filter(item => done('u:' + item.name)).length;

  const title = html`
    <div class="head__titlerow">
      <div>
        <h1 class="head__title">${L('قائمة المقاضي', 'Shopping list')}</h1>
        <p class="head__sub">${period.text}</p>
      </div>
      ${list.lines.length ? html`<a class="head__action head__action--solid" href="#/instore"><${Icon} name="cart" size=${19} stroke=${2.1} /> ${L('أنا في المحل', 'I’m in the shop')}</a>` : null}
    </div>`;

  if (!total) {
    return html`
      <${Head} ...${head} small>${title}<//>
      <div class="float empty">
        <${Emoji} char="🛒" size=${72} />
        <p class="empty__title">${L('القائمة فارغة', 'The list is empty')}</p>
        <p>${L('يلزم اختيار طبخة واحدة على الأقل من الخطة، أو إضافة أصناف من شاشة التسوّق.', 'Choose at least one meal in the plan, or add items from Shop.')}</p>
        <a class="btn" href="#/plan">${L('العودة إلى الخطة', 'Back to the plan')}</a>
      </div>`;
  }

  return html`
    <${Head} ...${head} small>${title}<//>
    ${list.lines.length ? html`<${Receipt} data=${data} receipt=${receipt} plan=${plan} persons=${persons} kids=${kids} onShare=${onShare} onStore=${set.store} />` : null}
    <section class=${'panel summary' + (list.lines.length ? '' : ' float')} aria-label=${L('ملخص القائمة', 'List summary')}>
      ${budgetInfo.budget ? html`
        <p class=${'summary__budget' + (budgetInfo.over ? ' is-over' : '')}>
          ${L('ميزانيتك', 'Budget')} <b dir="ltr">${budgetInfo.budget}</b> ${riyal()} ·
          ${budgetInfo.over
            ? html`${L('أغلى بـ', 'over by')} <b dir="ltr">${money(list.totals.cost - budgetInfo.budget * 100)}</b>`
            : html`${L('باقي', 'left:')} <b dir="ltr">${money(budgetInfo.budget * 100 - list.totals.cost)}</b> ${riyal()}`}
          <button type="button" class="link link--green" onClick=${budgetInfo.over && budgetInfo.fit && budgetInfo.fit.swaps.length ? budgetInfo.openFit : budgetInfo.openBudget}>${budgetInfo.over && budgetInfo.fit && budgetInfo.fit.swaps.length ? L('رتّبها ضمن ميزانيتي', 'Fit it to my budget') : L('تعديل', 'Edit')}</button>
        </p>` : null}
      <div class="summary__progress">
        <span>${L(`تم ${ticked} من ${total}`, `${ticked} of ${total} done`)}</span>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax=${total} aria-valuenow=${ticked} aria-label=${L('ما تم شراؤه', 'Bought so far')}><span style=${'width:' + (total ? ticked / total * 100 : 0) + '%'}></span></div>
      </div>
    </section>

    ${AISLES.map(aisle => {
      const lines = list.lines.filter(line => aisleOf(line.offer.category) === aisle);
      if (!lines.length) return null;
      return html`
        <section class="aisle">
          <h2 class="aisle__name"><${Emoji} char=${aisle.emoji} size=${22} /> ${aisleName(aisle)} <small>${lines.length}</small></h2>
          <ul class="lines">
            ${lines.map(line => html`
              <li class=${'line' + (done(line.key) ? ' is-done' : '')}>
                <label class="line__check">
                  <input type="checkbox" class="tick" checked=${done(line.key)} onChange=${() => set.toggleChecked(line.key)} aria-label=${nm(line.offer)} />
                  <${Photo} data=${data} offer=${line.offer} width=${128} cls="line__photo" />
                  <span class="line__body">
                    <span class="line__name">${nm(line.offer)} <small dir="ltr">${offerSize(line.offer)}</small></span>
                    <span class="line__sub">${lineDetail(line)} · ${storeName(data, line.offer.store)}${line.need ? L(' · يلزمك ', ' · you need ') + amount(line.need) : ''}</span>
                    <span class="line__tags">
                      ${line.saved ? html`<span class="badge badge--save">${L('وفّرت', 'Saved')} <b dir="ltr">${money(line.saved)}</b></span>` : null}
                      ${line.keeps ? html`<span class="badge">${L('يكفي لأكثر من أسبوع', 'Lasts more than a week')}</span>` : null}
                      ${line.offer.promo ? html`<span class="badge badge--cut" dir="ltr">${line.offer.promo}</span>` : null}
                      ${line.offer.note ? html`<span class="badge badge--note">${noteText(line.offer.note)}</span>` : null}
                    </span>
                  </span>
                </label>
                <span class="line__side">
                  <span class="line__cost" dir="ltr">${money(line.cost)}</span>
                  ${line.extra ? html`<button type="button" class="link" onClick=${() => set.extra(line.offer.id, 0)}>${L('إزالة', 'Remove')}</button>` : null}
                </span>
              </li>`)}
          </ul>
        </section>`;
    })}

    ${list.unpriced.length ? html`
      <section class="aisle">
        <h2 class="aisle__name"><${Emoji} char="🏷️" size=${22} /> ${L('بدون سعر هذا الأسبوع', 'No price this week')}</h2>
        <p class="aisle__note">${L('لم نجدها في المتجر هذا الأسبوع، فهي خارج الإجمالي.', 'Not found in the store this week, so not in the total.')}</p>
        <ul class="lines">
          ${list.unpriced.map(item => html`
            <li class=${'line' + (done('u:' + item.name) ? ' is-done' : '')}>
              <label class="line__check">
                <input type="checkbox" class="tick" checked=${done('u:' + item.name)} onChange=${() => set.toggleChecked('u:' + item.name)} aria-label=${nm(item)} />
                <span class="line__body">
                  <span class="line__name">${nm(item)}</span>
                  <span class="line__sub">${item.need ? L('يلزمك ', 'You need ') + amount(item.need) : ''}${item.sources.length ? ' · ' + item.sources.join(L('، ', ', ')) : ''}</span>
                </span>
              </label>
            </li>`)}
        </ul>
      </section>` : null}

    ${list.pantry.length ? html`
      <details class="pantry">
        <summary><${Emoji} char="🧂" size=${20} /> ${L('من مطبخك', 'From your kitchen')} (${list.pantry.length})</summary>
        <p>${list.pantry.map(nm).join(L('، ', ', '))}</p>
      </details>` : null}`;
}

/* ---------------------------------------------------------------------
   Shop
   ------------------------------------------------------------------- */
/* ---------------------------------------------------------------------
   In the shop: the list as a checklist for one hand, aisle by aisle, with
   the screen kept awake. Ticks are the list's own ticks.
   ------------------------------------------------------------------- */
function useWakeLock() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    if (!('wakeLock' in navigator)) return undefined;
    let lock = null;
    let alive = true;
    const ask = () => navigator.wakeLock.request('screen').then(got => {
      if (!alive) { got.release().catch(() => {}); return; }
      lock = got;
      setOn(true);
      got.addEventListener('release', () => setOn(false));
    }).catch(() => setOn(false));
    // The lock ends when the phone leaves the page; it is asked for again on return.
    const onVisible = () => { if (document.visibilityState === 'visible' && (!lock || lock.released)) ask(); };
    ask();
    document.addEventListener('visibilitychange', onVisible);
    return () => { alive = false; document.removeEventListener('visibilitychange', onVisible); if (lock) lock.release().catch(() => {}); };
  }, []);
  return on;
}

function StoreRow({ data, row, done, leaving, onTick }) {
  const line = row.line;
  return html`
    <li>
      <button type="button" class=${'srow' + (done ? ' is-done' : '') + (leaving ? ' is-leaving' : '')} aria-pressed=${done} onClick=${onTick}>
        ${line ? html`<${Photo} data=${data} offer=${line.offer} width=${128} cls="srow__photo" />` : html`<span class="srow__photo photo--none"><${Emoji} char="🏷️" size=${26} /></span>`}
        <span class="srow__body">
          <b>${line ? nm(line.offer) : nm(row.item)}</b>
          <small>${line ? html`${lineDetail(line)} · <em dir="ltr">${money(line.cost)}</em>` : row.item.need ? L('يلزمك ', 'You need ') + amount(row.item.need) : L('بدون سعر هذا الأسبوع', 'No price this week')}</small>
        </span>
        <span class="srow__tick" aria-hidden="true"><${Icon} name="check" size=${22} stroke=${3} /></span>
      </button>
    </li>`;
}

function StoreMode({ data, store, list, week, set, onDone, onClose }) {
  const awake = useWakeLock();
  const [toast, setToast] = useState(null);
  const [leaving, setLeaving] = useState([]);
  const done = key => week.checked.includes(key);
  const rows = list.lines.map(line => ({ key: line.key, line, aisle: aisleOf(line.offer.category) }))
    .concat(list.unpriced.map(item => ({ key: 'u:' + item.name, item, aisle: null })));
  const got = rows.filter(row => done(row.key));
  const left = rows.length - got.length;
  const leftCost = list.lines.filter(line => !done(line.key)).reduce((total, line) => total + line.cost, 0);
  // A ticked row fills its circle and slides away for a moment before it joins the basket.
  const tick = row => {
    const adding = !done(row.key);
    if (adding && !calm()) {
      if (leaving.includes(row.key)) return;
      setLeaving(keys => keys.concat(row.key));
      setTimeout(() => { setLeaving(keys => keys.filter(key => key !== row.key)); set.toggleChecked(row.key); setToast(row); }, 380);
      return;
    }
    set.toggleChecked(row.key);
    setToast(adding ? row : null);
  };
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    document.body.classList.add('is-locked');
    return () => document.body.classList.remove('is-locked');
  }, []);
  const name = row => (row.line ? nm(row.line.offer) : nm(row.item));
  const groups = AISLES.map(aisle => ({ aisle, rows: rows.filter(row => row.aisle === aisle && !done(row.key)) })).filter(group => group.rows.length);
  const unpriced = rows.filter(row => !row.aisle && !done(row.key));
  return html`
    <div class="instore" role="dialog" aria-modal="true" aria-label=${L('وضع المحل', 'In the shop')}>
      <header class="instore__top">
        <div class="instore__bar">
          <h2 class="instore__title"><${StoreDot} id=${store} />${storeName(data, store)} · ${L('وضع المحل', 'In the shop')}</h2>
          <button type="button" class="instore__done" onClick=${got.length ? onDone : onClose}>${got.length ? L('خلصت', 'Done') : L('خروج', 'Leave')}</button>
        </div>
        <p class="instore__left" aria-live="polite">
          ${left ? html`<b>${left}</b> ${L(`${left === 1 ? 'صنف باقٍ' : 'أصناف باقية'} من ${rows.length}`, `left of ${rows.length}`)}` : html`<b>${L('كل شي بالسلة!', 'All in the basket!')}</b>`}
        </p>
        <div class="instore__progress" role="progressbar" aria-valuemin="0" aria-valuemax=${rows.length} aria-valuenow=${got.length} aria-label=${L('ما تم شراؤه', 'Bought so far')}><i style=${'width:' + (rows.length ? got.length / rows.length * 100 : 0) + '%'}></i></div>
        <p class="instore__meta">
          <span>${leftCost ? html`${L('باقي تقريباً', 'About')} <b dir="ltr">${money(leftCost)}</b> ${riyal()}${L('', ' to go')}` : ''}</span>
          ${awake ? html`<span class="instore__awake">☀ ${L('الشاشة تبقى مضاءة', 'Screen stays on')}</span>` : null}
        </p>
      </header>

      ${groups.map(group => html`
        <section class="instore__aisle">
          <h3><${Emoji} char=${group.aisle.emoji} size=${22} /> ${aisleName(group.aisle)} <small>${L(group.rows.length + ' باقية', group.rows.length + ' left')}</small></h3>
          <ul class="srows">${group.rows.map(row => html`<${StoreRow} data=${data} row=${row} done=${false} leaving=${leaving.includes(row.key)} onTick=${() => tick(row)} />`)}</ul>
        </section>`)}
      ${unpriced.length ? html`
        <section class="instore__aisle">
          <h3><${Emoji} char="🏷️" size=${22} /> ${L('بدون سعر هذا الأسبوع', 'No price this week')} <small>${unpriced.length}</small></h3>
          <ul class="srows">${unpriced.map(row => html`<${StoreRow} data=${data} row=${row} done=${false} leaving=${leaving.includes(row.key)} onTick=${() => tick(row)} />`)}</ul>
        </section>` : null}

      ${got.length ? html`
        <details class="instore__basket" open=${!left}>
          <summary><${Icon} name="cart" size=${20} /> ${L('في السلة', 'In the basket')} (${got.length})</summary>
          <ul class="srows">${got.map(row => html`<${StoreRow} data=${data} row=${row} done=${true} onTick=${() => tick(row)} />`)}</ul>
        </details>` : null}
      ${!left ? html`<button type="button" class="btn btn--wide instore__finish" onClick=${onDone}>${L('خلصت المقاضي', 'Finish shopping')}</button>` : null}

      ${toast ? html`
        <div class="instore__toast" role="status">
          <span><${Icon} name="check" size=${18} stroke=${2.6} /> ${L('في السلة: ', 'In the basket: ')}${name(toast)}</span>
          <button type="button" onClick=${() => { set.toggleChecked(toast.key); setToast(null); }}>${L('تراجع', 'Undo')}</button>
        </div>` : null}
    </div>`;
}

/* The end of a shop: what was bought and saved, and what was paid if the
   shopper wants the counter to know. The shop is counted when this opens. */
function StoreDone({ data, store, record, month, set, onClose }) {
  const [paid, setPaid] = useState('');
  const [saved, setSaved] = useState(false);
  const party = useRef(null);
  useEffect(() => { set.recordTrip(null); const timer = setTimeout(() => confetti(party.current, 36), 250); return () => clearTimeout(timer); }, []);
  const save = event => {
    event.preventDefault();
    const value = Math.round(parseFloat(String(paid).replace(',', '.')) * 100);
    if (!(value > 0)) return;
    set.recordTrip(value);
    setSaved(true);
  };
  return html`
    <div class="instore instore--done" role="dialog" aria-modal="true" aria-label=${L('خلصت المقاضي', 'Shopping done')}>
      <span ref=${party} class="instore__party"><${Emoji} char="🎉" size=${96} /></span>
      <h2 class="instore__big">${L('خلصت المقاضي!', 'Shopping done!')}</h2>
      <p>${L(`${record.items} ${record.items === 1 ? 'صنف' : 'أصناف'} من ${storeName(data, store)}`, `${pl(record.items, 'item', 'items')} from ${storeName(data, store)}`)}</p>
      <div class="instore__stats">
        <div><b dir="ltr">${money(record.expected)}</b><small>${L('المجموع المتوقّع', 'Expected total')}</small></div>
        <div class="is-gold"><b dir="ltr">${money(record.offers)}</b><small>${L('وفّرت من العروض', 'Saved on offers')}</small></div>
      </div>
      ${record.store_saving ? html`<p class="instore__extra">${L(`ووفّرت ${money(record.store_saving)} ريال لأنك اشتريت من ${storeName(data, store)}`, `and ${money(record.store_saving)} SAR by shopping at ${storeName(data, store)}`)}</p>` : null}
      ${saved
        ? html`<p class="instore__thanks"><${Icon} name="check" size=${18} stroke=${2.6} /> ${L('سُجّل. عدّاد التوفير يحسب الآن ما دفعته فعلاً.', 'Saved. The counter now knows what you paid.')}</p>`
        : html`
          <form class="instore__ask" onSubmit=${save}>
            <label for="paid"><b>${L('كم دفعت عند الصندوق؟', 'What did you pay at the till?')}</b><span>${L('اختياري، ليحسب عدّاد التوفير بدقة.', 'Optional, so the savings counter is exact.')}</span></label>
            <div class="instore__in">
              <input id="paid" type="text" inputmode="decimal" autocomplete="off" placeholder=${L('مثلاً ', 'e.g. ') + money(record.expected)} value=${paid} onInput=${event => setPaid(event.target.value)} dir="ltr" />
              <button type="submit" class="btn">${L('سجّل', 'Save')}</button>
            </div>
          </form>`}
      <a class="instore__month" href="#/savings">${L('عدّاد التوفير هذا الشهر: ', 'Saved this month: ')}<b dir="ltr">${money(month.total)}</b> ${riyal()}</a>
      <button type="button" class="btn btn--light btn--wide" onClick=${onClose}>${L('تم', 'Done')}</button>
    </div>`;
}

/* ---------------------------------------------------------------------
   The savings counter
   ------------------------------------------------------------------- */
const monthName = month => dateFormat('month', { month: 'long', year: 'numeric' }).format(fromISO(month + '-01'));

/* The card at the top of the account tab. */
function SavingsCard({ summary }) {
  return html`
    <a class="float savings-card" href="#/savings">
      <span class="savings-card__pic"><${Emoji} char="💰" size=${34} /></span>
      <span class="savings-card__body">
        <span class="savings-card__label">${L('وفّرت مع مقاضي', 'Saved with Maqadi')}</span>
        ${summary.all.trips
          ? html`<span class="savings-card__value"><b dir="ltr">${money(summary.total)}</b> ${riyal()} <small>${L('هذا الشهر', 'this month')}</small></span>`
          : html`<span class="savings-card__hint">${L('يبدأ العدّ مع أول تسوّق بوضع المحل', 'It starts counting with your first shop in shop mode')}</span>`}
      </span>
      <${Icon} name="chevron" size=${18} />
    </a>`;
}

function SavingsPage({ data, head, summary, onShare }) {
  const high = Math.max(1, ...summary.trips.map(trip => trip.saving));
  const better = summary.previous > 0 && summary.total > summary.previous;
  return html`
    <${Head} ...${head} small>
      <h1 class="head__title">${L('وفّرت مع مقاضي', 'Saved with Maqadi')}</h1>
      <p class="head__sub">${monthName(summary.month)}${summary.trips.length ? ' · ' + L(summary.trips.length + ' مرات تسوّق', pl(summary.trips.length, 'shop', 'shops')) : ''}</p>
    <//>
    <section class="float panel saved">
      <p class="saved__top"><span>${L('هذا الشهر', 'This month')}</span>${better ? html`<span class="badge badge--save">${L('أكثر من الشهر الماضي', 'More than last month')}</span>` : null}</p>
      <p class="saved__value"><b dir="ltr"><${Sum} value=${summary.total} count /></b> ${riyal()}</p>
      ${summary.trips.length ? html`
        <div class="saved__bars" role="img" aria-label=${summary.trips.map(trip => shortDay(trip.date) + ': ' + money(trip.saving)).join(L('، ', ', '))}>
          ${summary.trips.map((trip, at) => html`
            <div class=${at === summary.trips.length - 1 ? 'is-now' : ''}>
              <b dir="ltr">${money(trip.saving)}</b>
              <i style=${'height:' + Math.max(6, Math.round(trip.saving / high * 90)) + 'px'}></i>
              <small>${shortDay(trip.date)}</small>
            </div>`)}
        </div>`
        : html`<p class="saved__empty">${L('لا يوجد تسوّق مسجّل هذا الشهر. عندما تنهي التسوّق بوضع المحل يُحسب توفيرك هنا.', 'No shops recorded this month. Finish a shop in shop mode and your saving is counted here.')}</p>`}
    </section>
    ${summary.all.trips ? html`
      <div class="saved__split">
        <div><small><${Emoji} char="🏷️" size=${20} /> ${L('من العروض', 'From offers')}</small><b dir="ltr">${money(summary.offers)}</b></div>
        <div><small><${Emoji} char="🛒" size=${20} /> ${L('من المتجر الأرخص', 'From the cheaper store')}</small><b dir="ltr">${money(summary.store)}</b></div>
      </div>
      <div class="saved__row"><${Emoji} char="💰" size=${28} /><span>${L('منذ أول تسوّق', 'Since your first shop')}<small>${shortDay(summary.all.since)} · ${L(summary.all.trips + ' مرات تسوّق', pl(summary.all.trips, 'shop', 'shops'))}</small></span><b dir="ltr">${money(summary.all.total)}</b></div>
      ${summary.paid ? html`<div class="saved__row"><${Emoji} char="🧾" size=${28} /><span>${L('دفعت فعلاً هذا الشهر', 'Paid this month')}<small>${L('المتوقّع كان ', 'Expected ')}<span dir="ltr">${money(summary.paid.expected)}</span></small></span><b dir="ltr">${money(summary.paid.paid)}</b></div>` : null}
      ${summary.total ? html`<button type="button" class="btn btn--wide saved__share" onClick=${onShare}><${Icon} name="share" size=${19} /> ${L('شارك توفيرك', 'Share your saving')}</button>` : null}`
      : html`<a class="btn btn--wide saved__share" href="#/list">${L('افتح قائمة المقاضي', 'Open the shopping list')}</a>`}
    <p class="fineprint">${L(
      'يُحسب فقط ما علّمت أنك اشتريته في وضع المحل: ما خصمته العروض منه، وكم كانت نفس الأصناف ستكلّف أكثر في المتجر التالي الأرخص. كل هذا محفوظ على جهازك فقط.',
      'Only what you ticked as bought in shop mode counts: what the offers took off it, and how much more the same items would have cost at the next-cheapest store. All of it stays on your phone.')}</p>`;
}

/* ---------------------------------------------------------------------
   Ramadan: the night dress, today's iftar and suhoor, and the big shop
   before the month. The dates are in lib/season.js.
   ------------------------------------------------------------------- */
// A dish that changes from day to day (lentil soup, then oat soup) names each in turn.
const dishName = (dish, day) => {
  const names = L(dish.name, dish.name_en || dish.name);
  return Array.isArray(names) ? names[(day - 1) % names.length] : names;
};

function RamadanToday({ plan, season, meals }) {
  const [part, setPart] = useState('iftar');
  const main = meals.length ? meals[(season.day - 1) % meals.length] : null;
  const dishes = (plan.daily && plan.daily[part]) || [];
  const tab = (id, emoji, label) => html`
    <button type="button" role="tab" aria-selected=${part === id} class=${part === id ? 'is-on' : ''} onClick=${() => setPart(id)}><${Emoji} char=${emoji} size=${20} /> ${label}</button>`;
  return html`
    <section class="ramadan-today" aria-label=${L('فطور اليوم وسحوره', 'Today’s iftar and suhoor')}>
      <div class="ramadan-today__tabs" role="tablist">
        ${tab('iftar', '🌙', L('الفطور', 'Iftar'))}
        ${tab('suhoor', '🌅', L('السحور', 'Suhoor'))}
      </div>
      <p class="ramadan-today__title">
        ${part === 'iftar' ? L('فطور اليوم', 'Today’s iftar') : L('سحور اليوم', 'Today’s suhoor')}
        <small>${part === 'iftar' ? L('على أذان المغرب', 'At the sunset call to prayer') : L('قبل الفجر', 'Before dawn')}</small>
      </p>
      <div class="plates" role="tabpanel">
        ${dishes.map((dish, at) => html`
          <div class="plate-card">
            <span class=${'plate-card__pic tile-' + (at % 6)}><${Emoji} char=${dish.emoji} size=${34} /></span>
            <b>${dishName(dish, season.day)}</b>
          </div>`)}
        ${part === 'iftar' && main ? html`
          <a class="plate-card plate-card--main" href=${'#/meal/' + main.id}>
            <span class="plate-card__pic tile-4"><${MealArt} meal=${main} size=${34} fill /></span>
            <span><b>${nm(main)}</b><small>${L('الطبق الرئيسي · ', 'Main dish · ')}${main.minutes}${L(' دقيقة', ' min')}</small></span>
          </a>` : null}
      </div>
      <a class="ramadan-today__shop" href="#/ramadan"><${Emoji} char="🛒" size=${22} /> ${L('مقاضي رمضان الكبيرة', 'The big Ramadan shop')} <${Icon} name="chevron" size=${16} /></a>
    </section>`;
}

const RamadanBanner = ({ season }) => html`
  <a class="ramadan-banner" href="#/ramadan">
    <span class="ramadan-banner__moon"><${Emoji} char="🌙" size=${44} /></span>
    <span class="ramadan-banner__body">
      <b>${L('مقاضي رمضان الكبيرة', 'The big Ramadan shop')}</b>
      <small>${L(`باقي ${season.daysLeft} ${season.daysLeft <= 10 ? 'أيام' : 'يوماً'} على رمضان · تُشترى مرة وتكفي الشهر`, `${pl(season.daysLeft, 'day', 'days')} to Ramadan · buy once for the month`)}</small>
    </span>
    <${Icon} name="chevron" size=${18} />
  </a>`;

/* The big shop at one store: each item bought for its own amount. */
function stockupLines(plan, offers) {
  if (!plan || !plan.stockup) return [];
  return plan.stockup.items.map(item => {
    const offer = item.offer ? offers.get(item.offer) : null;
    const base = toBase(item.qty, item.unit);
    return { item, offer, bought: offer && base ? purchase(offer, base) : null };
  });
}
const linesTotal = lines => lines.reduce((sum, line) => sum + (line.bought ? line.bought.cost : 0), 0);

function StockupPage({ data, head, store, plan, others, offers, season, week, set }) {
  const [added, setAdded] = useState(false);
  const lines = stockupLines(plan, offers);
  if (!lines.length) {
    return html`
      <div class="night-page">
        <${Head} ...${head} small><h1 class="head__title">${L('مقاضي رمضان الكبيرة', 'The big Ramadan shop')}</h1><//>
        <div class="float empty"><${Emoji} char="🌙" size=${64} /><p class="empty__title">${L('ستظهر قريباً', 'Coming soon')}</p><p>${L('تظهر هنا قبل رمضان بأسبوعين، بأسعار ذلك الأسبوع.', 'It shows here two weeks before Ramadan, at that week’s prices.')}</p></div>
      </div>`;
  }
  const priced = lines.filter(line => line.bought);
  const total = linesTotal(lines);
  const saved = priced.reduce((sum, line) => sum + line.bought.saved, 0);
  const addAll = () => {
    priced.forEach(line => set.extra(line.offer.id, Math.max(week.extras[line.offer.id] || 0, line.bought.units)));
    setAdded(true);
  };
  return html`
    <div class="night-page">
      <${Head} ...${head} small>
        <h1 class="head__title">${L('مقاضي رمضان الكبيرة', 'The big Ramadan shop')}</h1>
        <p class="head__sub">${L('أغراض تُشترى مرة واحدة وتكفي الشهر، لأسرة من 4 أفراد', 'Bought once, they last the month, for a family of 4')}</p>
        <div class="night-counts">
          ${season && season.phase === 'before' ? html`<div><b dir="ltr">${season.daysLeft}</b><small>${L('يوماً لرمضان', 'days to Ramadan')}</small></div>` : season && season.phase === 'during' ? html`<div><b dir="ltr">${season.day}</b><small>${L('من رمضان', 'of Ramadan')}</small></div>` : null}
          <div><b dir="ltr">${priced.length}</b><small>${L('صنفاً', 'items')}</small></div>
          ${saved ? html`<div><b dir="ltr">${money(saved)}</b><small>${L('ريال من العروض', 'SAR off')}</small></div>` : null}
        </div>
      <//>
      <ul class="float lines stockup">
        ${lines.map(line => html`
          <li class="line">
            ${line.offer ? html`<${Photo} data=${data} offer=${line.offer} width=${128} cls="line__photo" />` : html`<span class="line__photo photo--none"><${Emoji} char=${line.item.emoji} size=${26} /></span>`}
            <span class="line__body">
              <span class="line__name">${nm(line.item)} <small>${LANG === 'en' || !line.item.display ? amount(toBase(line.item.qty, line.item.unit)) : line.item.display}</small></span>
              <span class="line__sub">${line.offer ? html`<${StoreDot} id=${line.offer.store} />${nm(line.offer)} · ${lineDetail(Object.assign({ offer: line.offer }, line.bought))}` : L('غير متوفر في ' + storeName(data, store) + ' هذا الأسبوع', 'Not at ' + storeName(data, store) + ' this week')}</span>
              ${line.bought && line.bought.saved ? html`<span class="line__tags"><span class="badge badge--save">${L('وفّرت', 'Saved')} <b dir="ltr">${money(line.bought.saved)}</b></span></span>` : null}
            </span>
            <span class="line__side">${line.bought ? html`<span class="line__cost" dir="ltr">${money(line.bought.cost)}</span>` : null}</span>
          </li>`)}
      </ul>
      ${others.map(other => {
        const theirs = stockupLines(other.plan, offers);
        const missing = theirs.filter(line => !line.bought).length;
        return theirs.length ? html`<p class="stockup__compare"><${StoreDot} id=${other.id} />${L('نفس المقاضي في ' + other.name + ': ', 'The same shop at ' + other.name + ': ')}<b dir="ltr">${money(linesTotal(theirs))}</b> ${riyal()}${missing ? L(` (${missing} غير متوفرة هناك)`, ` (${missing} not sold there)`) : ''}</p>` : null;
      })}
      <p class="fineprint">${L(
        `يبدأ رمضان مع رؤية الهلال؛ التاريخ المتوقّع ${season ? longDay(season.start) : ''}. الأسعار أسعار هذا الأسبوع وقد تتغيّر.`,
        `Ramadan begins with the sighting of the crescent; it is expected on ${season ? longDay(season.start) : ''}. Prices are this week’s and may change.`)}</p>
      <div class="stockup-space" aria-hidden="true"></div>
      <div class="stockup-bar">
        <span><small>${L('المجموع', 'Total')}</small><b dir="ltr">${money(total)}</b> ${riyal()}</span>
        ${added
          ? html`<a class="stockup-bar__go" href="#/list"><${Icon} name="check" size=${18} stroke=${2.6} /> ${L('في قائمتك · افتحها', 'In your list · open it')}</a>`
          : html`<button type="button" class="stockup-bar__go" onClick=${addAll}>${L('أضفها لقائمتي', 'Add to my list')}</button>`}
      </div>
    </div>`;
}

/* Shop and the scanner before the whole catalogue has arrived. */
function CatalogueWait({ head, failed, onRetry }) {
  return html`
    <${Head} ...${head} small><h1 class="head__title">${L('تسوّق', 'Shop')}</h1><//>
    <div class="float empty" role="status">
      <${Emoji} char="🛒" size=${64} />
      <p class="empty__title">${failed ? L('تعذّر تحميل كل المنتجات', 'The products couldn’t load') : L('جاري تحميل كل المنتجات…', 'Loading every product…')}</p>
      ${failed ? html`<button type="button" class="btn" onClick=${onRetry}>${L('إعادة المحاولة', 'Try again')}</button>` : html`<p>${L('لحظات، ثم يمكنك البحث في كل منتجات المتاجر.', 'A moment, then you can search every product.')}</p>`}
    </div>`;
}

const ScanWait = ({ failed, onRetry, onClose }) => html`
  <div class="scan" role="dialog" aria-modal="true" aria-label=${L('امسح الباركود', 'Scan a barcode')}>
    <div class="scan__top">
      <button type="button" class="scan__round" aria-label=${L('إغلاق', 'Close')} onClick=${onClose}><${Icon} name="close" size=${22} stroke=${2.2} /></button>
      <span class="scan__title">${L('امسح الباركود', 'Scan a barcode')}</span>
      <span class="scan__round scan__round--empty"></span>
    </div>
    <div class="scan__blocked" role="status">
      <p class="scan__blocked-title">${failed ? L('تعذّر تحميل المنتجات', 'The products couldn’t load') : L('جاري تجهيز الماسح…', 'Getting the scanner ready…')}</p>
      ${failed ? html`<button type="button" class="btn btn--light" onClick=${onRetry}>${L('إعادة المحاولة', 'Try again')}</button>` : null}
    </div>
  </div>`;

function ShopTab({ data, head, week, set, twin, focus }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [store, setStore] = useState('all');
  const [shown, setShown] = useState(CONFIG.shopPage);
  const input = useRef(null);
  const storeIds = Object.keys(data.offers.stores);
  const searching = query.trim().length > 0;
  const browsing = !searching && category === 'all';

  useEffect(() => { if (focus && input.current) input.current.focus(); }, [focus]);

  // Names are normalised once, so searching thousands of products stays instant.
  const haystack = useMemo(() => new Map(data.offers.offers.map(offer => [offer.id, normalizeAr([offer.name, offer.name_en, offer.brand].filter(Boolean).join(' '))])), [data]);
  const words = normalizeAr(query).split(' ').filter(Boolean);
  const inStore = offer => store === 'all' || offer.store === store;

  const categories = useMemo(() => {
    const counts = {};
    data.offers.offers.forEach(offer => { if (inStore(offer)) counts[offer.category] = (counts[offer.category] || 0) + 1; });
    return Object.keys(CATEGORIES).filter(id => counts[id]);
  }, [data, store]);

  // Opening the screen: this week's real discounts. A search or a section: every product, discounts first.
  const results = useMemo(() => data.offers.offers
    .filter(offer => inStore(offer) && (browsing ? offer.was > offer.price : true) && (category === 'all' || offer.category === category) && words.every(word => haystack.get(offer.id).includes(word)))
    .sort(browsing
      ? (a, b) => isFood(b) - isFood(a) || discountPercent(b) - discountPercent(a) || a.price - b.price
      : (a, b) => (b.was > b.price) - (a.was > a.price) || a.price - b.price),
  [data, query, category, store]);

  useEffect(() => setShown(CONFIG.shopPage), [query, category, store]);

  const names = storeIds.map(id => storeName(data, id));
  const storeList = names.length > 1 ? names.slice(0, -1).join(L('، ', ', ')) + L(' و', ' and ') + names[names.length - 1] : names[0];
  const heading = searching ? L(`${count(results.length)} نتيجة`, pl(results.length, 'result', 'results')) : category !== 'all' ? categoryName(category) : L('أقوى عروض الأسبوع', 'Top deals this week');

  return html`
    <${Head} ...${head} small>
      <h1 class="head__title">${L('تسوّق كل أغراضك', 'Shop everything')}</h1>
      <p class="head__sub">${L(`${count(data.offers.offers.length)} منتج من ${storeList}`, `${count(data.offers.offers.length)} products from ${storeList}`)}</p>
    <//>
    <label class="float searchbar">
      <${Icon} name="search" size=${20} />
      <input ref=${input} type="search" inputmode="search" placeholder=${L('ابحث عن أي غرض: بصل، حليب، منظف…', 'Search anything: onions, milk, cleaner…')} aria-label=${L('بحث في المنتجات', 'Search products')} value=${query} onInput=${event => setQuery(event.target.value)} />
      ${query ? html`<button type="button" class="searchbar__clear" aria-label=${L('مسح البحث', 'Clear search')} onClick=${() => setQuery('')}><${Icon} name="close" size=${16} /></button>` : null}
      <a class="searchbar__scan" href="#/scan" aria-label=${L('امسح باركود منتج وقارن سعره', 'Scan a barcode and compare prices')}><${Icon} name="scan" size=${24} stroke=${2} /></a>
    </label>

    ${storeIds.length > 1 ? html`
      <div class="pills" role="group" aria-label=${L('المتجر', 'Store')}>
        <button type="button" class="pill" aria-pressed=${store === 'all'} onClick=${() => setStore('all')}>${L('كل المتاجر', 'All stores')}</button>
        ${storeIds.map(id => html`<button type="button" class="pill" aria-pressed=${store === id} onClick=${() => setStore(id)}><${StoreDot} id=${id} />${storeName(data, id)}</button>`)}
      </div>` : null}

    <div class="circles circles--cats" role="group" aria-label=${L('القسم', 'Aisle')}>
      <button type="button" class="circle" aria-pressed=${category === 'all'} onClick=${() => setCategory('all')}>
        <span class="circle__pic"><${Emoji} char="🔥" size=${36} /></span><span class="circle__name">${L('العروض', 'Deals')}</span>
      </button>
      ${categories.map(id => html`
        <button type="button" class="circle" aria-pressed=${category === id} onClick=${() => setCategory(id)}>
          <span class="circle__pic"><${Emoji} char=${categoryEmoji(id)} size=${36} /></span><span class="circle__name">${categoryName(id)}</span>
        </button>`)}
    </div>

    <${SectionTitle} title=${heading} emoji=${browsing ? '🔥' : null} />
    ${results.length ? html`
      <div class="pgrid">
        ${results.slice(0, shown).map(offer => html`
          <${ProductCard} data=${data} offer=${offer} units=${week.extras[offer.id] || 0} onSet=${value => set.extra(offer.id, value)}
            twins=${storeIds.filter(id => id !== offer.store).map(id => twin(offer, id)).filter(Boolean)} />`)}
      </div>
      ${results.length > shown ? html`<button type="button" class="btn btn--ghost btn--wide" onClick=${() => setShown(shown + CONFIG.shopPage)}>${L('عرض المزيد', 'Show more')} (${count(results.length - shown)})</button>` : null}`
    : html`<div class="empty"><${Emoji} char="🔍" size=${56} /><p class="empty__title">${searching ? L('لا توجد منتجات مطابقة', 'No matching products') : L('لا توجد عروض مطابقة', 'No matching deals')}</p><p>${L('يمكن تجربة كلمة أخرى أو قسم آخر.', 'Try another word or aisle.')}</p></div>`}`;
}

/* ---------------------------------------------------------------------
   Scan and compare
   ------------------------------------------------------------------- */
const SCAN_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e'];
let barcodeIndex = null;   // loaded once, the first time the camera opens
let detectorPromise = null;

/* The phone's own barcode reader where it has one (Android); elsewhere
   (iPhone) the bundled reader in lib/barcode-detector, fetched on first use. */
function getDetector() {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      if ('BarcodeDetector' in window) {
        try {
          const supported = await window.BarcodeDetector.getSupportedFormats();
          const formats = SCAN_FORMATS.filter(format => supported.includes(format));
          if (formats.includes('ean_13')) return new window.BarcodeDetector({ formats });
        } catch (error) { /* fall through to the bundled reader */ }
      }
      const reader = await import('./lib/barcode-detector/ponyfill.js');
      const wasm = new URL('./lib/barcode-detector/zxing_reader.wasm', import.meta.url).href;
      reader.setZXingModuleOverrides({ locateFile: (path, prefix) => (path.endsWith('.wasm') ? wasm : prefix + path) });
      return new reader.BarcodeDetector({ formats: SCAN_FORMATS });
    })();
    detectorPromise.catch(() => { detectorPromise = null; });
  }
  return detectorPromise;
}

function ScanPage({ data, store, offers, twin, week, set, period, onClose, onStore }) {
  const video = useRef(null);
  const stream = useRef(null);
  const [status, setStatus] = useState('starting');   // starting | scanning | denied | unavailable
  const [result, setResult] = useState(null);          // { found } | { missing, code, storeCode }
  const [torch, setTorch] = useState(null);            // null when the camera has no light
  const [typing, setTyping] = useState(false);
  const [index, setIndex] = useState(barcodeIndex);

  useEffect(() => {
    set.scanTipSeen();
    if (barcodeIndex) return;
    getJSON('data/' + data.current.barcodes).then(file => { barcodeIndex = file; setIndex(file); }).catch(() => setIndex({ stores: [], codes: {} }));
  }, []);

  // The camera runs while the page is open and stops when it closes.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) { setStatus('unavailable'); return; }
      try {
        const media = await navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
        if (cancelled) { media.getTracks().forEach(track => track.stop()); return; }
        stream.current = media;
        video.current.srcObject = media;
        await video.current.play().catch(() => {});
        const track = media.getVideoTracks()[0];
        const caps = track && track.getCapabilities ? track.getCapabilities() : {};
        if (caps.torch) setTorch(false);
        setStatus('scanning');
      } catch (error) {
        setStatus(error && (error.name === 'NotAllowedError' || error.name === 'SecurityError') ? 'denied' : 'unavailable');
      }
    })();
    return () => { cancelled = true; if (stream.current) stream.current.getTracks().forEach(track => track.stop()); };
  }, []);

  const show = useCallback((raw, format) => {
    const code = scannedGtin(raw, format);
    const found = code && barcodeIndex ? lookupScan({ code, index: barcodeIndex.codes, offers, stores: barcodeIndex.stores, here: store, twin }) : null;
    if (navigator.vibrate) navigator.vibrate(40);
    setResult(found ? { found } : { missing: true, code: code || String(raw || '').replace(/\D/g, ''), storeCode: !code && /^0?2/.test(String(raw || '').replace(/\D/g, '')) });
  }, [offers, store, twin]);

  // Read frames a few times a second until something is found.
  useEffect(() => {
    if (status !== 'scanning' || result || typing || !index) return;
    let stopped = false;
    let timer = null;
    (async () => {
      let detector;
      try { detector = await getDetector(); } catch (error) { if (!stopped) setStatus('unavailable'); return; }
      const tick = async () => {
        if (stopped) return;
        try {
          if (video.current && video.current.readyState >= 2) {
            const codes = await detector.detect(video.current);
            const hit = codes.find(item => item.rawValue && /^\d{6,14}$/.test(item.rawValue));
            if (hit && !stopped) { show(hit.rawValue, hit.format); return; }
          }
        } catch (error) { /* a frame that cannot be read: try the next */ }
        timer = setTimeout(tick, 180);
      };
      tick();
    })();
    return () => { stopped = true; clearTimeout(timer); };
  }, [status, result, typing, index, show]);

  const toggleTorch = async () => {
    const track = stream.current && stream.current.getVideoTracks()[0];
    if (!track) return;
    try { await track.applyConstraints({ advanced: [{ torch: !torch }] }); setTorch(!torch); } catch (error) { setTorch(null); }
  };

  const blocked = status === 'denied' || status === 'unavailable';
  return html`
    <div class="scan" role="dialog" aria-modal="true" aria-label=${L('امسح الباركود', 'Scan a barcode')}>
      <video ref=${video} class="scan__video" playsinline muted autoplay aria-hidden="true"></video>
      <div class="scan__top">
        <button type="button" class="scan__round" aria-label=${L('إغلاق', 'Close')} onClick=${onClose}><${Icon} name="close" size=${22} stroke=${2.2} /></button>
        <span class="scan__title">${L('امسح الباركود', 'Scan a barcode')}</span>
        ${torch !== null
          ? html`<button type="button" class="scan__round" aria-pressed=${torch} aria-label=${L('ضوء الكاميرا', 'Camera light')} onClick=${toggleTorch}><${Icon} name="flash" size=${20} stroke=${2} /></button>`
          : html`<span class="scan__round scan__round--empty"></span>`}
      </div>

      ${blocked ? html`
        <div class="scan__blocked">
          <${Emoji} char="📷" size=${64} />
          <p class="scan__blocked-title">${status === 'denied' ? L('نحتاج إذن الكاميرا', 'We need the camera') : L('الكاميرا غير متاحة', 'The camera is not available')}</p>
          <p>${status === 'denied'
            ? L('لقراءة الباركود يلزم السماح للتطبيق باستخدام الكاميرا من إعدادات المتصفح، ثم فتح هذه الشاشة من جديد.', 'To read barcodes, allow the camera in your browser settings, then open this screen again.')
            : L('لم نتمكن من تشغيل الكاميرا على هذا الجهاز. يمكنك كتابة رقم الباركود بدلاً من ذلك.', 'We could not start the camera on this device. You can type the barcode number instead.')}</p>
        </div>` : html`
        <div class="scan__finder" aria-hidden="true"><i></i><i></i><i></i><i></i>${status === 'scanning' && !result ? html`<span class="scan__laser"></span>` : null}</div>
        <p class="scan__hint">${status === 'starting' ? L('جاري تشغيل الكاميرا…', 'Starting the camera…') : index ? L('وجّه الكاميرا على باركود المنتج', 'Point the camera at the barcode') : L('جاري تجهيز الماسح…', 'Getting the scanner ready…')}<small>${L('يقرأ تلقائياً، بدون ضغط أي زر', 'It reads by itself, no button needed')}</small></p>`}

      <div class="scan__bottom">
        <button type="button" class="scan__store" onClick=${onStore}><${StoreDot} id=${store} />${L('تتسوّق الآن في ', 'Shopping at ')}${storeName(data, store)}</button>
        <button type="button" class="scan__manual" onClick=${() => setTyping(true)}><${Icon} name="keys" size=${20} /> ${L('إدخال رقم الباركود يدوياً', 'Type the barcode number')}</button>
      </div>

      ${typing ? html`<${TypeCode} onClose=${() => setTyping(false)} onCode=${code => { setTyping(false); show(code); }} />` : null}
      ${result ? html`<${ScanResult} data=${data} result=${result} week=${week} set=${set} period=${period} onAgain=${() => setResult(null)} />` : null}
    </div>`;
}

function TypeCode({ onClose, onCode }) {
  const [value, setValue] = useState('');
  const digits = value.replace(/\D/g, '');
  const input = useRef(null);
  useEffect(() => { if (input.current) input.current.focus(); }, []);
  return html`
    <div class="scan__backdrop" onClick=${onClose}></div>
    <form class="scan-sheet" onSubmit=${event => { event.preventDefault(); if (digits.length >= 8) onCode(digits); }}>
      <span class="sheet__grip" aria-hidden="true"></span>
      <h2 class="sheet__title">${L('رقم الباركود', 'Barcode number')}</h2>
      <p class="sheet__sub">${L('الأرقام المكتوبة تحت خطوط الباركود (8 أو 12 أو 13 رقماً).', 'The digits printed under the bars (8, 12 or 13 digits).')}</p>
      <input ref=${input} class="code-input" type="text" inputmode="numeric" autocomplete="off" dir="ltr" placeholder="6281007074759" aria-label=${L('رقم الباركود', 'Barcode number')} value=${value} onInput=${event => setValue(event.target.value)} />
      <div class="scan-sheet__actions">
        <button type="submit" class="btn" disabled=${digits.length < 8}>${L('بحث', 'Search')}</button>
        <button type="button" class="btn btn--ghost" onClick=${onClose}>${L('إلغاء', 'Cancel')}</button>
      </div>
    </form>`;
}

function ScanResult({ data, result, week, set, period, onAgain }) {
  if (result.missing) {
    return html`
      <div class="scan__backdrop" onClick=${onAgain}></div>
      <div class="scan-sheet" role="status">
        <span class="sheet__grip" aria-hidden="true"></span>
        <div class="scan-missing">
          <${Emoji} char="🔍" size=${56} />
          <p class="scan-missing__title">${L('لم نجد هذا الباركود', 'We couldn’t find this barcode')}</p>
          ${result.code ? html`<p class="scan-missing__code" dir="ltr">${result.code}</p>` : null}
          <p>${result.storeCode
            ? L('هذا باركود خاص بالمتجر، مثل ملصقات الخضار والفواكه الموزونة، فلا يمكن مقارنته بمتجر آخر.', 'This is a store’s own code, like the stickers on weighed fruit and vegetables, so it can’t be compared with another store.')
            : L('المنتج غير موجود في أسعار هذا الأسبوع لدى المتاجر في التطبيق، أو أن الرقم لم يُقرأ كاملاً.', 'The product is not in this week’s prices from the stores in the app, or the number was not read in full.')}</p>
        </div>
        <div class="scan-sheet__actions">
          <button type="button" class="btn" onClick=${onAgain}><${Icon} name="scan" size=${20} /> ${L('امسح منتجاً آخر', 'Scan another')}</button>
          <a class="btn btn--ghost" href="#/shop/search">${L('ابحث بالاسم', 'Search by name')}</a>
        </div>
      </div>`;
  }
  const { found } = result;
  const compared = found.rows.filter(row => row.offer && row.same).length;
  const order = row => (row.cheapest ? 0 : row.here ? 1 : row.offer ? 2 : 3);
  const rows = found.rows.slice().sort((a, b) => order(a) - order(b));
  const product = found.product;
  const mine = found.rows.find(row => row.here && row.offer);
  const buyable = rows.filter(row => row.offer);
  return html`
    <div class="scan__backdrop" onClick=${onAgain}></div>
    <div class="scan-sheet" role="status">
      <span class="sheet__grip" aria-hidden="true"></span>
      <p class="scan-found"><span class="scan-found__ok"><${Icon} name="check" size=${14} stroke=${3} /></span>${compared > 1
        ? L(`نفس المنتج موجود في ${compared === 2 ? 'متجرين' : compared + ' متاجر'}`, `The same product at ${pl(compared, 'store', 'stores')}`)
        : L('وجدنا المنتج', 'Product found')}</p>
      <div class="scan-product">
        <${Photo} data=${data} offer=${product} width=${256} cls="scan-product__photo" />
        <div>
          <h3 class="scan-product__name">${nm(product)}</h3>
          <p class="scan-product__sub">${[offerSize(product), L('باركود ', 'Barcode ') + found.code].filter(Boolean).join(' · ')}</p>
        </div>
      </div>
      <div class="scan-rows">
        ${rows.map(row => {
          const percent = row.offer ? discountPercent(row.offer) : 0;
          return html`
            <div class=${'scan-row' + (row.cheapest ? ' is-best' : '')}>
              <span class="scan-row__name"><${StoreDot} id=${row.store} />${storeName(data, row.store)}
                ${row.cheapest ? html`<span class="badge badge--gold">${L('الأرخص', 'Cheapest')}</span>` : null}
                ${row.here ? html`<span class="badge">${L('أنت هنا', 'You’re here')}</span>` : null}
                ${percent ? html`<span class="badge badge--cut" dir="ltr">−${percent}%</span>` : null}
                ${row.offer && !row.same ? html`<span class="badge badge--note">${L('حجم مختلف', 'Different size')}</span>` : null}
              </span>
              ${row.offer ? html`
                <span class="scan-row__sub">${row.same ? pricePeriod(data, row.store).badge : offerSize(row.offer) + L(' · لا نقارنه لاختلاف الحجم', ' · not compared, the size differs')}</span>
                <span class="scan-row__price"><b dir="ltr">${money(halalas(row.offer.price))}</b> <small>${riyal()}</small>${row.offer.was > row.offer.price ? html`<s dir="ltr">${money(halalas(row.offer.was))}</s>` : null}</span>`
              : html`<span class="scan-row__missing">${L(`لم نجده في ${storeName(data, row.store)} هذا الأسبوع`, `Not found at ${storeName(data, row.store)} this week`)}</span>`}
            </div>`;
        })}
      </div>
      ${found.saving > 0 ? html`
        <p class="scan-note"><${Emoji} char="💰" size=${32} /><span>${L(`أرخص في ${storeName(data, found.best.store)} بـ `, `Cheaper at ${storeName(data, found.best.store)} by `)}<b dir="ltr">${money(halalas(found.saving))}</b> ${riyal()}</span></p>`
      : mine && mine.offer.was > mine.offer.price ? html`
        <p class="scan-note scan-note--green"><${Emoji} char="🏷️" size=${32} /><span>${L(`عليه خصم في ${storeName(data, mine.store)} الآن: توفّر `, `On offer at ${storeName(data, mine.store)} now: you save `)}<b dir="ltr">${money(halalas(mine.offer.was - mine.offer.price))}</b> ${riyal()}</span></p>`
      : null}
      <div class=${'scan-add' + (buyable.length > 1 ? ' scan-add--two' : '')}>
        ${buyable.map(row => {
          const units = week.extras[row.offer.id] || 0;
          const step = isLoose(row.offer) ? 0.5 : 1;
          const label = buyable.length > 1 ? L('أضف من ', 'Add from ') + storeName(data, row.store) : L('أضف للقائمة', 'Add to the list');
          return units
            ? html`<div class="scan-add__in"><span>${L('في قائمتك من ', 'On your list from ')}${storeName(data, row.store)}</span><${Stepper} value=${units} min=${0} max=${20} step=${step} label=${L('الكمية من ', 'Quantity of ') + nm(row.offer)} onChange=${value => set.extra(row.offer.id, value)} /></div>`
            : html`<button type="button" class=${'btn' + (row.cheapest || buyable.length === 1 ? '' : ' btn--ghost')} onClick=${() => set.extra(row.offer.id, step)}><${Icon} name="plus" size=${20} stroke=${2.4} /> ${label}</button>`;
        })}
      </div>
      <button type="button" class="btn btn--ghost btn--wide scan-again" onClick=${onAgain}><${Icon} name="scan" size=${20} /> ${L('امسح منتجاً آخر', 'Scan another')}</button>
      ${compared > 1 ? html`<p class="scan-fine">${L('نفس الباركود ونفس الحجم في المتجرين. الأسعار من المتاجر نفسها وقد تختلف حسب الفرع.', 'Same barcode and size at both stores. Prices come from the stores and may differ by branch.')}</p>` : null}
    </div>`;
}

/* ---------------------------------------------------------------------
   Account and settings
   ------------------------------------------------------------------- */
function MeTab({ data, head, plans, store, plan, persons, kids, avoid, mealsPerWeek, maxMeals, set, plusOn, openStore, openPrefs, budgetInfo, lang, savings }) {
  const storeIds = Object.keys(data.offers.stores);
  return html`
    <${Head} ...${head} small>
      <div class="profile">
        <span class="profile__pic"><${Emoji} char="👨‍👩‍👧‍👦" size=${40} /></span>
        <div>
          <h1 class="head__title">${L('أسرتك', 'Your family')}</h1>
          <p class="head__sub">${familyLabel(persons, kids)} · ${storeName(data, store)} · ${L('سفرة ', '')}${nm(plan)}</p>
        </div>
      </div>
    <//>

    <${SavingsCard} summary=${savings} />
    <section class="panel me-panel">
      <div class="row"><span>${L('عدد أفراد الأسرة', 'People in the family')}</span><${Stepper} value=${persons} min=${CONFIG.minPersons} max=${CONFIG.maxPersons} label=${L('عدد أفراد الأسرة', 'People in the family')} onChange=${set.persons} /></div>
      <button type="button" class="row row--button" onClick=${openPrefs}>
        <span>${L('تفضيلات العائلة', 'Family preferences')}</span>
        <span class="row__value">${avoid.length || kids ? [avoid.length ? avoid.map(tagShort).join(L('، ', ', ')) : null, kids ? L(kids + ' أطفال', pl(kids, 'child', 'children')) : null].filter(Boolean).join(' · ') : L('لا شيء', 'None')} <${Icon} name="chevron" size=${18} /></span>
      </button>
      <button type="button" class="row row--button" onClick=${budgetInfo.openBudget}>
        <span>${L('ميزانية الأسبوع', 'Weekly budget')}</span>
        <span class="row__value">${budgetInfo.budget ? html`<span dir="ltr">${budgetInfo.budget}</span> ${riyal()}` : L('بدون', 'None')} <${Icon} name="chevron" size=${18} /></span>
      </button>
      <button type="button" class="row row--button" onClick=${openStore}>
        <span>${L('المتجر الذي تتسوّق منه', 'Where you shop')}</span>
        <span class="row__value"><${StoreDot} id=${store} />${storeName(data, store)} <${Icon} name="chevron" size=${18} /></span>
      </button>
      <div class="row"><span>${L('عدد الطبخات في الأسبوع', 'Meals a week')}</span><${Stepper} value=${Math.min(mealsPerWeek, maxMeals)} min=${CONFIG.minMeals} max=${maxMeals} label=${L('عدد الطبخات في الأسبوع', 'Meals a week')} onChange=${set.mealsPerWeek} /></div>
      <div class="row">
        <label for="plan-select">${L('نوع السفرة', 'Cuisine')}</label>
        <select id="plan-select" value=${plan.id} onChange=${event => set.plan(event.target.value)}>
          ${plans.map(option => html`<option value=${option.id}>${nm(option)}</option>`)}
        </select>
      </div>
      <div class="row">
        <span><${Icon} name="globe" size=${20} /> اللغة / Language</span>
        <${LangSwitch} lang=${lang} onPick=${set.lang} />
      </div>
    </section>

    <section class="card plus">
      <p class="plus__label"><${Emoji} char="✨" size=${20} /> ${L('مقاضي بلس', 'Maqadi Plus')} ${plusOn ? html`<span class="badge">${L('معاينة', 'Preview')}</span>` : html`<span class="badge">${L('قريباً', 'Coming soon')}</span>`}</p>
      <p class="plus__title">${L('الخطة الكاملة كل أسبوع', 'The full plan every week')}</p>
      <ul class="plus__list">
        <li>${L(`كل طبخات الأسبوع بدل أول ${CONFIG.plus.freeMeals}`, `Every meal of the week, not just the first ${CONFIG.plus.freeMeals}`)}</li>
        <li>${L('كل أنواع السفر، مع تعديل عدد الأفراد', 'Every cuisine, for any family size')}</li>
        <li>${L('قائمة مقاضي كاملة قابلة للمشاركة', 'A full shopping list to share')}</li>
      </ul>
      ${CONFIG.plus.checkoutUrl
        ? html`<a class="btn" href=${CONFIG.plus.checkoutUrl}>${L('اشتراك', 'Subscribe')}${CONFIG.plus.priceLabel ? ' · ' + CONFIG.plus.priceLabel : ''}</a>`
        : html`<p class="plus__note">${L('الدفع الإلكتروني غير مفعّل بعد، والتطبيق مفتوح بالكامل حالياً.', 'Payments are not switched on yet, so the whole app is open for now.')}</p>`}
    </section>

    <section class="card">
      <h2 class="card__title">${L('مصدر الأسعار', 'Where prices come from')}</h2>
      ${storeIds.map(id => {
        const item = data.offers.stores[id];
        return html`
          <p class="source">
            <${StoreDot} id=${id} /><b>${storeName(data, id)}</b> — ${LANG === 'en'
              ? (item.checked ? `online store prices as shown on ${longDay(item.checked)}` : `official weekly offers flyer, valid ${longDay(item.valid_from)} to ${longDay(item.valid_to)}`)
              : item.source + '، ' + (item.checked ? 'كما ظهرت يوم ' + longDay(item.checked) : 'سارية من ' + longDay(item.valid_from) + ' إلى ' + longDay(item.valid_to))}.
            ${item.source_url ? html` <a href=${item.source_url} target="_blank" rel="noopener noreferrer">${L('المصدر', 'Source')}</a>` : null}
          </p>`;
      })}
      <p class="fineprint">${L(
        'الأسعار والصور منقولة من مجلات العروض الرسمية ومن المتاجر الإلكترونية للمتاجر نفسها، وقد تختلف حسب الفرع وتوفّر الكمية، لذا يُنصح بمراجعة السعر على الرف قبل الشراء. التطبيق مستقل وغير تابع لأي متجر.',
        'Prices and photos come from the stores’ official offer flyers and online stores. They may differ by branch and stock, so check the shelf price before you buy. The app is independent and not owned by any store.')}</p>
    </section>

    <section class="card">
      <h2 class="card__title">${L('بياناتك', 'Your data')}</h2>
      <p class="fineprint">${L('اختياراتك محفوظة على هذا الجهاز فقط، ولا تُرسل إلى أي خادم.', 'Your choices are kept on this device only and are not sent to any server.')}</p>
      <button type="button" class="btn btn--ghost" onClick=${() => set.reset()}>${L('مسح اختياراتي من هذا الجهاز', 'Clear my choices from this device')}</button>
    </section>
    <p class="about"><${Logo} size=${22} /> ${appName()} · ${L('نسخة تجريبية', 'Preview version')}</p>`;
}

/* ---------------------------------------------------------------------
   Welcome (first visit)
   ------------------------------------------------------------------- */
/* The welcome picture: the logo's basket with this week's dishes and offers
   around it, and two real numbers (the best discount, the cheaper store). */
function WelcomeScene({ data, plan, offers, rows }) {
  const dishes = plan.meals.slice(0, 3);
  const deals = plan.meals.map(meal => mealHighlight(meal, offers)).filter(Boolean);
  const best = deals.sort((a, b) => discountPercent(b) - discountPercent(a))[0];
  const products = plan.meals.flatMap(meal => meal.ingredients.map(item => item.offer && offers.get(item.offer))).filter(offer => offer && offer.img)
    .filter((offer, at, all) => all.indexOf(offer) === at).slice(0, 2);
  const cheapest = rows.find(row => row.cheapest);
  const lead = cheapest ? Math.max(0, ...rows.filter(row => row !== cheapest).map(row => row.cost - cheapest.cost)) : 0;
  return html`
    <div class="wscene" aria-hidden="true">
      ${dishes.map((meal, at) => html`<span class=${'wscene__dish wscene__dish--' + at}><${MealArt} meal=${meal} size=${at === 0 ? 118 : 90} /></span>`)}
      ${products.map((offer, at) => html`<${Photo} data=${data} offer=${offer} width=${256} cls=${'wscene__prod wscene__prod--' + at} />`)}
      <span class="wscene__basket"><${Logo} size=${190} /></span>
      ${best ? html`<span class="wscene__tag wscene__tag--off" dir="ltr">−${discountPercent(best)}%</span>` : null}
      ${lead ? html`<span class="wscene__tag wscene__tag--lead">${L('أرخص بـ ', 'Save ')}<b dir="ltr">${money(lead)}</b></span>` : null}
    </div>`;
}

function Welcome({ data, plan, offers, rows, persons, kids, avoid, budget, lang, set, onDone }) {
  const [step, setStep] = useState(0);
  if (step === 0) {
    return html`
      <div class="welcome welcome--hello" role="dialog" aria-modal="true" aria-label=${L('أهلاً في مقاضي', 'Welcome to Maqadi')}>
        <${LangSwitch} lang=${lang} onPick=${set.lang} cls="lang-switch--welcome" />
        <p class="welcome__brand"><${Logo} size=${38} glass /> ${appName()}</p>
        <${WelcomeScene} data=${data} plan=${plan} offers=${offers} rows=${rows} />
        <div class="welcome__words">
          <h1 class="welcome__title">${L('مقاضي الأسبوع', 'Your week’s groceries')}<br /><em>${L('بأرخص سعر', 'at the lowest price')}</em></h1>
          <p class="welcome__sub">${L('طبخات الأسبوع جاهزة، وقائمة مقاضيها بأسعار المتاجر، فتعرف كم ستدفع قبل أن تخرج من البيت.', 'The week’s meals, ready, with their shopping list at the stores’ prices, so you know what you’ll pay before you leave home.')}</p>
        </div>
        <div class="welcome__actions">
          <button type="button" class="btn btn--wide btn--light" onClick=${() => setStep(1)}>${L('ابدأ', 'Start')}</button>
          <button type="button" class="welcome__skip" onClick=${onDone}>${L('بلا حساب: كل شيء يبقى على جوالك · تخطي', 'No account: everything stays on your phone · Skip')}</button>
        </div>
      </div>`;
  }
  return html`
    <div class="welcome welcome--setup" role="dialog" aria-modal="true" aria-label=${L('جهّز سفرتك', 'Set up your week')}>
      <div class="welcome__top welcome__top--small">
        <h1 class="welcome__title">${L('جهّز سفرتك', 'Set up your week')}</h1>
        <p class="welcome__sub">${L('يمكنك تغيير هذا لاحقاً من «حسابي».', 'You can change this later in “Account”.')}</p>
      </div>
      <div class="welcome__body">
        <div class="welcome__q welcome__q--family">
          <div class="welcome__qrow">
            <span>${L('كم شخصاً في أسرتك؟', 'How many people in your family?')}</span>
            <${Stepper} cls="stepper--big" value=${persons} min=${CONFIG.minPersons} max=${CONFIG.maxPersons} label=${L('عدد أفراد الأسرة', 'People in the family')} onChange=${set.persons} />
          </div>
          <div class="welcome__qrow welcome__qrow--small">
            <span>${L('منهم أطفال تحت 12 سنة', 'Children under 12')}<small>${L('الطفل يُحسب نصف حصة', 'A child counts as half a portion')}</small></span>
            <${Stepper} value=${kids} min=${0} max=${Math.max(0, persons - 1)} label=${L('عدد الأطفال', 'Children')} onChange=${set.kids} />
          </div>
        </div>
        <div class="welcome__q welcome__q--budget">
          <span>${L('ما لا تأكله العائلة أو تتحسس منه', 'Foods your family avoids or is allergic to')}</span>
          <small class="welcome__hint">${L('لا نأكل', 'We don’t eat')}</small>
          <${TagChips} tags=${AVOID_FOODS} chosen=${avoid} onToggle=${set.toggleAvoid} />
          <small class="welcome__hint">${L('حساسية', 'Allergies')}</small>
          <${TagChips} tags=${ALLERGIES} chosen=${avoid} onToggle=${set.toggleAvoid} allergy />
        </div>
        <div class="welcome__q welcome__q--budget">
          <span>${L('كم ميزانيتك للمقاضي في الأسبوع؟', 'What’s your weekly grocery budget?')}</span>
          <div class="pills pills--wrap" role="group" aria-label=${L('ميزانية الأسبوع', 'Weekly budget')}>
            <button type="button" class="pill" aria-pressed=${!budget} onClick=${() => set.budget(null)}>${L('بدون ميزانية', 'No budget')}</button>
            ${BUDGET_PRESETS.map(preset => html`<button type="button" class="pill" aria-pressed=${budget === preset} onClick=${() => set.budget(preset)}>${preset} ${riyal()}</button>`)}
          </div>
          ${budget ? html`<${Stepper} cls="stepper--budget stepper--compact" value=${budget} min=${50} max=${3000} step=${10} label=${L('ميزانية الأسبوع بالريال', 'Weekly budget in riyals')} onChange=${set.budget} format=${v => html`<b dir="ltr">${v}</b><small>${riyal()}</small>`} />` : null}
          <small class="welcome__hint">${L('تشمل كل ما في قائمتك: الطبخات والأساسيات وما تضيفه.', 'It covers everything on your list: meals, basics and what you add.')}</small>
        </div>
        <p class="welcome__label">${L('من أين تتسوّق عادة؟', 'Where do you usually shop?')}</p>
        <div class="welcome__stores">
          ${rows.map(row => html`
            <button type="button" class=${'store-option' + (row.current ? ' is-current' : '')} aria-pressed=${row.current} onClick=${() => set.store(row.id)}>
              <span class="store-option__name"><${StoreDot} id=${row.id} />${row.name}${row.cheapest ? html`<span class="badge badge--gold">${L('الأرخص هذا الأسبوع', 'Cheapest this week')}</span>` : null}</span>
              <span class="store-option__sub">${L('سفرة أسبوع لأسرتك: ', 'A week for your family: ')}<b dir="ltr">${money(row.cost)}</b> ${riyal()}</span>
              ${row.current ? html`<span class="store-option__check"><${Icon} name="check" size=${16} stroke=${2.6} /></span>` : null}
            </button>`)}
        </div>
      </div>
      <div class="welcome__actions">
        <button type="button" class="btn btn--wide" onClick=${onDone}>${L('جهّز سفرتي', 'Plan my week')}</button>
      </div>
    </div>`;
}

/* ---------------------------------------------------------------------
   Shell
   ------------------------------------------------------------------- */
const NAV = [
  { id: 'home', label: ['الرئيسية', 'Home'] },
  { id: 'shop', label: ['تسوّق', 'Shop'] },
  { id: 'list', label: ['قائمتي', 'My list'], center: true },
  { id: 'plan', label: ['الخطة', 'Plan'] },
  { id: 'me', label: ['حسابي', 'Account'] }
];

/* The page follows the language: direction, lang, title. */
function applyLanguage(lang) {
  LANG = lang;
  setPlanLang(lang);
  const root = document.documentElement;
  if (root.lang !== lang) {
    root.lang = lang;
    root.dir = lang === 'en' ? 'ltr' : 'rtl';
    document.title = L('مقاضي — مقاضي الأسبوع بأرخص سعر', 'Maqadi — weekly groceries at the lowest price');
  }
}

function App() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [prefs, setPrefs] = useState(readPrefs);
  const [route, setRoute] = useState(parseRoute);
  const [sheet, setSheet] = useState(null);
  const [shopDone, setShopDone] = useState(false);
  const lastTab = useRef('home');

  const lang = prefs.lang === 'en' || prefs.lang === 'ar' ? prefs.lang : phoneLanguage();
  applyLanguage(lang);

  const load = useCallback(() => {
    setFailed(false);
    loadData().then(setData).catch(() => setFailed(true));
  }, []);
  useEffect(load, [load]);

  // The whole catalogue, after the first screen. Shop, search and the scanner wait for it.
  const [fullFailed, setFullFailed] = useState(false);
  const [fullTry, setFullTry] = useState(0);
  const fullPath = data && !data.full ? data.current.offers : null;
  useEffect(() => {
    if (!fullPath) return undefined;
    let alive = true;
    setFullFailed(false);
    getJSON('data/' + fullPath)
      .then(full => { if (alive) setData(previous => (previous && !previous.full ? Object.assign({}, previous, { offers: full, full: true }) : previous)); })
      .catch(() => { if (alive) setFullFailed(true); });
    return () => { alive = false; };
  }, [fullPath, fullTry]);
  const retryFull = () => setFullTry(n => n + 1);
  useEffect(() => {
    const onHash = () => {
      setRoute(previous => { if (!['meal', 'scan', 'story', 'instore', 'savings', 'ramadan'].includes(previous.tab)) lastTab.current = previous.tab; return parseRoute(); });
      setSheet(null);
      setShopDone(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const patch = useCallback(change => setPrefs(previous => {
    const next = Object.assign({}, previous, typeof change === 'function' ? change(previous) : change);
    writePrefs(next);
    return next;
  }), []);

  const offers = useMemo(() => new Map(data ? data.offers.offers.map(offer => [offer.id, offer]) : []), [data]);
  // The same product at each store (matched when the data is built), cheapest first.
  const sameIndex = useMemo(() => {
    const index = new Map();
    if (data) data.offers.offers.forEach(offer => {
      if (!offer.same) return;
      const key = offer.store + '|' + offer.same;
      const current = index.get(key);
      if (!current || offer.price < current.price) index.set(key, offer);
    });
    return index;
  }, [data]);

  if (failed) {
    return html`
      <div class="boot">
        <${Logo} size=${88} glass />
        <span class="boot__text">${L('تعذّر تحميل أسعار الأسبوع. يُرجى التحقق من الاتصال ثم إعادة المحاولة.', 'We couldn’t load this week’s prices. Check your connection and try again.')}</span>
        <button type="button" class="btn btn--light" onClick=${load}>${L('إعادة المحاولة', 'Try again')}</button>
      </div>`;
  }
  if (!data) {
    return html`<div class="boot" role="status"><${Logo} size=${88} glass /><span class="boot__mark">${appName()}</span><span class="boot__text">${L('جاري تحميل أسعار الأسبوع…', 'Loading this week’s prices…')}</span></div>`;
  }

  const weekId = data.current.week;
  const stored = prefs.week && prefs.week.id === weekId ? prefs.week : {};
  const week = {
    id: weekId,
    skipped: stored.skipped || [],
    checked: stored.checked || [],
    extras: stored.extras || {},
    essentials: stored.essentials !== false,
    fresh: stored.fresh || [],
    budgetFit: stored.budgetFit || null,
    seen: stored.seen || []
  };
  const avoid = Array.isArray(prefs.avoid) ? prefs.avoid.filter(tag => TAG_INFO[tag]) : [];

  // Products added by hand may only be in the whole catalogue; the totals wait for it rather than show a wrong sum.
  if (!data.full && Object.keys(week.extras).some(id => !offers.has(id))) {
    return html`
      <div class="boot" role="status">
        <${Logo} size=${88} glass />
        <span class="boot__text">${fullFailed ? L('تعذّر تحميل المنتجات. يُرجى التحقق من الاتصال ثم إعادة المحاولة.', 'We couldn’t load the products. Check your connection and try again.') : L('جاري تحميل أسعار الأسبوع…', 'Loading this week’s prices…')}</span>
        ${fullFailed ? html`<button type="button" class="btn btn--light" onClick=${retryFull}>${L('إعادة المحاولة', 'Try again')}</button>` : null}
      </div>`;
  }

  // Plans are published per store, for the same meals; the family picks where they shop.
  const planStores = data.plans.stores || [data.plans.store || Object.keys(data.offers.stores)[0]];
  const setsBy = data.plans.by_store || { [planStores[0]]: data.plans };
  const store = planStores.includes(prefs.store) ? prefs.store : planStores[0];
  // Ramadan: the night dress and the Ramadan cuisine during the month; its big shop from two weeks before.
  const today = riyadhToday();
  const season = ramadanPreview(new URLSearchParams(window.location.search).get('ramadan'), today) || ramadanOn(today);
  const during = Boolean(season && season.phase === 'during');
  const allPlans = setsBy[store].plans;
  const seasonal = allPlans.find(option => option.season === 'ramadan') || null;
  const plans = allPlans.filter(option => !option.season || (during && option.season === 'ramadan'))
    .sort((a, b) => Boolean(b.season) - Boolean(a.season)); // in Ramadan its cuisine comes first
  // A cuisine picked during Ramadan is kept apart, so the family's usual one comes back after Eid.
  const basePlan = (during && (plans.find(option => option.id === prefs.ramadanPlan) || seasonal)) || plans.find(option => option.id === prefs.plan) || plans[0];
  document.documentElement.classList.toggle('is-ramadan', during);
  MEAL_PHOTOS = new URLSearchParams(window.location.search).get('photos') === 'all' || basePlan.meals.every(meal => meal.photo);
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute('content', during ? '#24235e' : '#0b6e45');
  const mealsPerWeek = clamp(prefs.mealsPerWeek || basePlan.meals.length, CONFIG.minMeals, CONFIG.maxMeals);
  const plan = activePlan(basePlan, (stored.picks || {})[basePlan.id], mealsPerWeek, avoid);
  const maxMeals = Math.max(CONFIG.minMeals, Math.min(CONFIG.maxMeals, plan.choices.filter(meal => !meal.unavailable).length));
  const persons = clamp(prefs.persons || plan.base_persons, CONFIG.minPersons, CONFIG.maxPersons);
  const kids = clamp(prefs.kids || 0, 0, persons - 1);
  const servings = portions(persons, kids);
  const plusOn = CONFIG.plus.enabled || plusPreview();
  const locked = new Set(plusOn ? plan.meals.slice(CONFIG.plus.freeMeals).map(meal => meal.id) : []);
  const skipped = new Set(week.skipped.concat(Array.from(locked)));
  const list = buildList({ plan, offers, persons: servings, skipped, essentials: week.essentials, extras: week.extras });
  // Each cuisine's week for this family at this store, for the cuisine cards.
  const cuisineCards = plans.map(option => {
    const active = option.id === plan.id ? plan : activePlan(option, (stored.picks || {})[option.id], mealsPerWeek, avoid);
    const cost = option.id === plan.id ? list.totals.cost : buildList({ plan: active, offers, persons: servings, essentials: week.essentials }).totals.cost;
    return { id: option.id, cost, meal: active.meals[0] || option.meals[0] };
  });

  // The week's budget covers the whole list; swaps are worked out only when it is over.
  const budget = prefs.budget > 0 ? prefs.budget : null;
  const over = budget !== null && list.totals.cost > budget * 100;
  const fitKey = [store, plan.id, plan.meals.map(m => m.id).join(','), servings, Array.from(skipped).join(','), week.essentials, JSON.stringify(week.extras), budget, avoid.join(',')].join('|');
  const fit = over ? memoFit(fitKey, () => fitBudget({ plan, offers, persons: servings, skipped, essentials: week.essentials, extras: week.extras, budget: budget * 100 })) : null;

  // The same week at the other stores: same meals, each store's own products;
  // hand-added products follow when the other store sells the same one.
  const twin = (offer, storeId) => (offer && offer.same ? sameIndex.get(storeId + '|' + offer.same) || null : null);
  const compare = planStores.filter(id => id !== store).map(id => {
    const otherBase = setsBy[id].plans.find(option => option.id === basePlan.id);
    if (!otherBase) return null;
    const otherPlan = activePlan(otherBase, plan.meals.map(meal => meal.id), mealsPerWeek, avoid);
    const extras = {};
    let unmatched = 0;
    Object.keys(week.extras).forEach(extraId => {
      const match = twin(offers.get(extraId), id);
      if (match) extras[match.id] = week.extras[extraId]; else unmatched += 1;
    });
    const other = buildList({ plan: otherPlan, offers, persons: servings, skipped, essentials: week.essentials, extras });
    // Only a like-for-like basket gives a fair difference: same items priced, every added product found.
    const fair = other.unpriced.length === list.unpriced.length && unmatched === 0;
    return { id, name: storeName(data, id), list: other, totals: other.totals, unpriced: other.unpriced.length, unmatched, fair };
  }).filter(Boolean);

  // One row per store for the cards and the store picker.
  const fair = compare.every(other => other.fair);
  const storeRows = [{ id: store, name: storeName(data, store), cost: list.totals.cost, unpriced: list.unpriced.length, unmatched: 0, current: true, fair: true }]
    .concat(compare.map(other => ({ id: other.id, name: other.name, cost: other.totals.cost, unpriced: other.unpriced, unmatched: other.unmatched, current: false, fair: other.fair })))
    .sort((a, b) => planStores.indexOf(a.id) - planStores.indexOf(b.id));
  const lowest = Math.min(...storeRows.map(row => row.cost));
  storeRows.forEach(row => {
    row.cheapest = fair && storeRows.length > 1 && row.cost === lowest;
    row.diff = row.current ? 0 : row.fair ? row.cost - list.totals.cost : null;
    row.caveat = row.unmatched
      ? (row.unmatched === 1 ? L('صنف أضفته غير موجود هنا', 'an item you added is not sold here') : L(row.unmatched + ' أصناف أضفتها غير موجودة هنا', row.unmatched + ' items you added are not sold here'))
      : row.unpriced ? L(row.unpriced + ' بدون سعر', row.unpriced + ' without a price') : '';
  });

  // The receipt: the list at each store, item by item.
  const receiptColumns = [{ id: store, name: storeName(data, store), list, fair: true }]
    .concat(compare.map(other => ({
      id: other.id, name: other.name, list: other.list, fair: other.fair,
      caveat: other.unmatched
        ? (other.unmatched === 1 ? L('لا يبيع صنفاً أضفته', 'doesn’t sell an item you added') : L(`لا يبيع ${other.unmatched} أصناف أضفتها`, `doesn’t sell ${other.unmatched} items you added`))
        : other.unpriced ? L(`${other.unpriced} أصناف بدون سعر`, pl(other.unpriced, 'item', 'items') + ' without a price') : ''
    })));
  const receipt = { columns: receiptColumns, rows: receiptRows(receiptColumns), verdict: receiptVerdict(receiptColumns) };

  // The stories: one per meal the family cooks, then the basket.
  const cookedMeals = plan.meals.map((meal, index) => ({ meal, index })).filter(({ meal }) => !week.skipped.includes(meal.id) && !locked.has(meal.id));
  const stories = cookedMeals.map(({ meal, index }) => ({ id: meal.id, meal, emoji: meal.emoji, tile: index % 6, label: nm(meal) }))
    .concat(list.totals.items ? [{ id: 'basket', basket: true, emoji: '🛒', label: L('سلّتك', 'Your basket') }] : []);
  const pickedIds = new Set(plan.meals.map(meal => meal.id));
  const swapOptions = plan.choices.filter(meal => !pickedIds.has(meal.id));

  const setWeek = change => patch(previous => {
    const base = previous.week && previous.week.id === weekId ? previous.week : { id: weekId };
    return { week: Object.assign({}, base, change(Object.assign({ skipped: [], checked: [], extras: {} }, base))) };
  });
  const toggleIn = (array, value) => (array.includes(value) ? array.filter(item => item !== value) : array.concat(value));
  const set = {
    persons: value => patch(previous => ({ persons: value, kids: Math.min(previous.kids || 0, value - 1) })),
    kids: value => patch({ kids: value }),
    prefs: (chosen, children) => patch({ avoid: chosen, kids: children }),
    toggleAvoid: tag => patch(previous => ({ avoid: toggleIn(Array.isArray(previous.avoid) ? previous.avoid : [], tag) })),
    lang: value => patch({ lang: value }),
    plan: id => patch(during ? { ramadanPlan: id } : { plan: id }),
    store: id => patch({ store: id }),
    essentials: on => setWeek(() => ({ essentials: on })),
    toggleMeal: id => setWeek(current => ({ skipped: toggleIn(current.skipped, id) })),
    swap: (from, to) => setWeek(current => {
      const picks = Object.assign({}, current.picks);
      picks[plan.id] = plan.meals.map(meal => (meal.id === from ? to : meal.id));
      return { picks, skipped: current.skipped.filter(id => id !== from) };
    }),
    mealsPerWeek: value => patch({ mealsPerWeek: value }),
    toggleChecked: key => setWeek(current => ({ checked: toggleIn(current.checked, key) })),
    extra: (id, units) => setWeek(current => {
      const extras = Object.assign({}, current.extras);
      if (units > 0) extras[id] = units; else delete extras[id];
      return { extras };
    }),
    welcomed: () => patch({ welcomed: true }),
    budget: value => patch({ budget: value > 0 ? Math.round(value) : null }),
    applyFit: () => setWeek(current => {
      const picks = Object.assign({}, current.picks);
      picks[plan.id] = fit.ids;
      const fresh = Array.from(new Set((current.fresh || []).concat(fit.swaps.map(swap => swap.to.id))));
      return { picks, fresh, budgetFit: { count: fit.swaps.length, saved: fit.before - fit.after } };
    }),
    hideFitNote: () => setWeek(() => ({ budgetFit: null })),
    seen: id => setWeek(current => ({ seen: (current.seen || []).includes(id) ? current.seen : (current.seen || []).concat(id) })),
    // A finished shop; typing nothing keeps an amount typed before for the same shop.
    recordTrip: paid => patch(previous => {
      const before = (previous.history || []).find(record => record.week === weekId && record.store === store);
      const record = tripRecord({ week: weekId, store, date: riyadhToday(), list, checked: week.checked, receipt, paid: paid === null && before ? before.paid : paid });
      return { history: saveTrip(previous.history, record) };
    }),
    scanTipSeen: () => { if (!prefs.scanTipSeen) patch({ scanTipSeen: true }); },
    reset: () => { try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* nothing stored */ } setPrefs({}); }
  };

  const period = pricePeriod(data, store);
  const openStore = () => setSheet('store');
  const openPrefs = () => setSheet('prefs');
  const head = { data, store, period, onStore: openStore };
  const budgetInfo = { budget, over, fit, openBudget: () => setSheet('budget'), openFit: () => setSheet('fit') };
  const mealIndex = route.tab === 'meal' ? plan.meals.findIndex(item => item.id === route.id) : -1;
  const meal = route.tab === 'meal' ? plan.choices.find(item => item.id === route.id && !locked.has(item.id)) : null;
  const tab = route.tab === 'savings' ? 'me' : route.tab === 'ramadan' ? 'home' : ['meal', 'scan', 'story', 'instore'].includes(route.tab) ? lastTab.current : route.tab;
  const history = Array.isArray(prefs.history) ? prefs.history : [];
  const savings = savingsSummary(history, riyadhToday().slice(0, 7));
  const openShare = () => setSheet('share');
  const shareCaption = L(`${list.totals.saved ? 'وفّرت ' + money(list.totals.saved) + ' ريال على مقاضي الأسبوع' : 'مقاضي أسبوعي'} مع تطبيق مقاضي`, `${list.totals.saved ? 'I saved ' + money(list.totals.saved) + ' SAR on this week’s groceries' : 'My week’s groceries'} with Maqadi`)
    + ' ' + window.location.origin + window.location.pathname;

  return html`
    <div class="shell">
      <main class="main" id="main">
        ${route.tab === 'savings' ? html`<${SavingsPage} data=${data} head=${head} summary=${savings} onShare=${() => setSheet('savings')} />`
          : route.tab === 'ramadan' ? html`<${StockupPage} data=${data} head=${head} store=${store} plan=${seasonal} offers=${offers} season=${season} week=${week} set=${set}
              others=${planStores.filter(id => id !== store).map(id => ({ id, name: storeName(data, id), plan: setsBy[id].plans.find(option => option.season === 'ramadan') })).filter(other => other.plan)} />`
          : meal ? html`<${MealPage} data=${data} plan=${plan} meal=${meal} index=${mealIndex} persons=${persons} kids=${kids} servings=${servings} offers=${offers} backHref=${'#/' + lastTab.current} />`
          : tab === 'list' ? html`<${ListTab} data=${data} head=${head} list=${list} week=${week} set=${set} period=${period} receipt=${receipt} plan=${plan} persons=${persons} kids=${kids} budgetInfo=${budgetInfo} onShare=${openShare} />`
          : tab === 'shop' ? (data.full ? html`<${ShopTab} data=${data} head=${head} week=${week} set=${set} twin=${twin} focus=${route.id === 'search'} />` : html`<${CatalogueWait} head=${head} failed=${fullFailed} onRetry=${retryFull} />`)
          : tab === 'plan' ? html`<${PlanTab} data=${data} head=${head} plans=${plans} plan=${plan} persons=${persons} kids=${kids} avoid=${avoid} mealsPerWeek=${mealsPerWeek} maxMeals=${maxMeals} week=${week} offers=${offers} locked=${locked} set=${set} openPrefs=${openPrefs} cuisineCards=${cuisineCards} />`
          : tab === 'me' ? html`<${MeTab} data=${data} head=${head} plans=${plans} store=${store} plan=${plan} persons=${persons} kids=${kids} avoid=${avoid} mealsPerWeek=${mealsPerWeek} maxMeals=${maxMeals} set=${set} plusOn=${plusOn} openStore=${openStore} openPrefs=${openPrefs} budgetInfo=${budgetInfo} lang=${lang} savings=${savings} />`
          : html`<${HomeTab} data=${data} store=${store} head=${head} storeRows=${storeRows} plans=${plans} plan=${plan} persons=${persons} kids=${kids} week=${week} list=${list} offers=${offers} locked=${locked} set=${set} openFamily=${() => setSheet('family')} scanTip=${prefs.welcomed && !prefs.scanTipSeen} budgetInfo=${budgetInfo} stories=${stories} season=${season} cuisineCards=${cuisineCards} />`}
      </main>

      <nav class="tabbar" aria-label=${L('الأقسام', 'Sections')}>
        ${NAV.map(item => item.center
          ? html`
            <a class="tabbar__center" href="#/list" aria-current=${tab === 'list' && !meal ? 'page' : null}>
              <span class="tabbar__fab"><${Icon} name="cart" size=${26} stroke=${2} />${list.totals.items ? html`<em>${list.totals.items}</em>` : null}</span>
              <span>${L(item.label[0], item.label[1])}</span>
            </a>`
          : html`
            <a class="tabbar__item" href=${'#/' + item.id} aria-current=${tab === item.id && !meal ? 'page' : null}>
              <span class="tabbar__icon"><${Icon} name=${item.id} size=${23} /></span>
              <span>${L(item.label[0], item.label[1])}</span>
            </a>`)}
      </nav>

      ${route.tab === 'instore' && !shopDone && (list.lines.length || list.unpriced.length) ? html`<${StoreMode} data=${data} store=${store} list=${list} week=${week} set=${set}
          onDone=${() => setShopDone(true)} onClose=${() => { window.location.hash = '#/list'; }} />` : null}
      ${route.tab === 'instore' && shopDone ? html`<${StoreDone} data=${data} store=${store} set=${set} month=${savings}
          record=${tripRecord({ week: weekId, store, date: riyadhToday(), list, checked: week.checked, receipt })} onClose=${() => { window.location.hash = '#/list'; }} />` : null}
      ${route.tab === 'story' && stories.length ? html`<${Stories} data=${data} items=${stories} start=${route.id} offers=${offers} list=${list} storeRows=${storeRows} verdict=${receipt.verdict}
          cooked=${cookedMeals.length} essentials=${week.essentials && Boolean(plan.essentials)} swaps=${swapOptions} seen=${week.seen} set=${set}
          onClose=${() => { window.location.hash = '#/' + lastTab.current; }} onShare=${openShare} />` : null}
      ${route.tab === 'scan' && !data.full ? html`<${ScanWait} failed=${fullFailed} onRetry=${retryFull} onClose=${() => { window.location.hash = '#/' + lastTab.current; }} />` : null}
      ${route.tab === 'scan' && data.full ? html`<${ScanPage} data=${data} store=${store} offers=${offers} twin=${twin} week=${week} set=${set} period=${period} onClose=${() => { window.location.hash = '#/' + lastTab.current; }} onStore=${openStore} />` : null}
      ${sheet === 'store' ? html`<${StoreSheet} data=${data} rows=${storeRows} onPick=${set.store} onClose=${() => setSheet(null)} />` : null}
      ${sheet === 'family' ? html`<${FamilySheet} persons=${persons} mealsPerWeek=${mealsPerWeek} maxMeals=${maxMeals} set=${set} onClose=${() => setSheet(null)} openPrefs=${openPrefs} />` : null}
      ${sheet === 'prefs' ? html`<${PrefsSheet} avoid=${avoid} kids=${kids} persons=${persons} set=${set} onClose=${() => setSheet(null)} />` : null}
      ${sheet === 'budget' ? html`<${BudgetSheet} budget=${budget} total=${list.totals.cost} set=${set} onClose=${() => setSheet(null)}
          breakdown=${Object.assign(budgetBreakdown({ plan, offers, persons: servings, skipped, essentials: week.essentials, extras: week.extras }), { basicsNames: week.essentials && plan.essentials ? plan.essentials.items.map(nm).join(L('، ', ', ')) : '' })} />` : null}
      ${sheet === 'share' && list.lines.length ? html`<${ShareSheet} caption=${shareCaption} listText=${shareText(data, list, period)} onClose=${() => setSheet(null)}
          makeCard=${() => drawShareCard({ data, receipt, meals: cookedMeals.map(({ meal }) => meal), persons, kids })} />` : null}
      ${sheet === 'savings' && savings.total ? html`<${ShareSheet} title=${L('شارك توفيرك', 'Share your saving')} caption=${L(`وفّرت ${money(savings.total)} ريال هذا الشهر على مقاضي البيت مع تطبيق مقاضي`, `I saved ${money(savings.total)} SAR on groceries this month with Maqadi`) + ' ' + window.location.origin + window.location.pathname}
          onClose=${() => setSheet(null)} makeCard=${() => drawSavingsCard(savings)} />` : null}
      ${sheet === 'fit' && fit ? html`<${FitSheet} fit=${fit} budget=${budget} onApply=${() => { set.applyFit(); setSheet(null); window.scrollTo(0, 0); }} onClose=${() => setSheet(null)} />` : null}
      ${prefs.welcomed ? null : html`<${Welcome} data=${data} plan=${plan} offers=${offers} rows=${storeRows} persons=${persons} kids=${kids} avoid=${avoid} budget=${budget} lang=${lang} set=${set} onDone=${set.welcomed} />`}
    </div>`;
}

const root = document.getElementById('app');
root.textContent = '';
render(html`<${App} />`, root);

if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ }); });
}
