/*
 * مقاضي — واجهة التطبيق
 * One static page: it reads the week's offers and plans from data/ and keeps
 * the family's choices on the device. All arithmetic lives in lib/plan.js.
 */
import { html, render, useState, useEffect, useMemo, useCallback, useRef } from './lib/htm-preact.js';
import {
  buildList, mealHighlight, discountPercent, unitPrice, normalizeAr, money, amount,
  ingredientAmount, offerSize, isLoose, halalas
} from './lib/plan.js';

const CONFIG = {
  name: 'مقاضي',
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

const AISLES = [
  { id: 'produce', name: 'خضار وفواكه', emoji: '🥦', categories: ['produce_veg', 'produce_fruit'] },
  { id: 'butcher', name: 'لحوم ودجاج وأسماك', emoji: '🥩', categories: ['meat', 'poultry', 'fish'] },
  { id: 'dairy', name: 'ألبان وبيض', emoji: '🥛', categories: ['eggs', 'dairy_milk', 'dairy_cheese', 'dairy_yogurt_labneh', 'butter_cream'] },
  { id: 'bakery', name: 'مخبوزات', emoji: '🍞', categories: ['bakery'] },
  { id: 'frozen', name: 'مجمدات', emoji: '🧊', categories: ['frozen_chicken', 'frozen_veg', 'frozen_other'] },
  { id: 'pantry', name: 'مؤونة', emoji: '🫙', categories: ['rice_grains', 'pasta_noodles', 'flour_baking', 'oil_ghee', 'canned', 'sauces_condiments', 'spices', 'legumes_nuts', 'breakfast_spreads', 'dates_sweets', 'snacks'] },
  { id: 'drinks', name: 'مشروبات', emoji: '🧃', categories: ['drinks_water', 'drinks_juice', 'tea_coffee'] },
  { id: 'home', name: 'المنزل والعناية', emoji: '🧽', categories: ['household', 'personal_care', 'baby'] },
  { id: 'other', name: 'أخرى', emoji: '🛒', categories: ['other'] }
];
const aisleOf = category => AISLES.find(aisle => aisle.categories.includes(category)) || AISLES[AISLES.length - 1];
// Groceries come before the rest wherever the app suggests products.
const isFood = offer => !['home', 'other'].includes(aisleOf(offer.category).id);

const CATEGORY_NAMES = {
  produce_veg: 'خضار', produce_fruit: 'فواكه', meat: 'لحوم', poultry: 'دجاج', fish: 'أسماك', eggs: 'بيض',
  dairy_milk: 'حليب', dairy_cheese: 'أجبان', dairy_yogurt_labneh: 'لبن ولبنة', butter_cream: 'زبدة وقشطة',
  bakery: 'مخبوزات', rice_grains: 'أرز وحبوب', pasta_noodles: 'مكرونة', flour_baking: 'طحين وسكر',
  oil_ghee: 'زيوت وسمن', canned: 'معلبات', sauces_condiments: 'صلصات', spices: 'بهارات',
  legumes_nuts: 'بقوليات ومكسرات', frozen_chicken: 'دجاج مجمد', frozen_veg: 'خضار مجمدة', frozen_other: 'مجمدات',
  breakfast_spreads: 'فطور', drinks_water: 'مياه', drinks_juice: 'عصائر', tea_coffee: 'شاي وقهوة',
  dates_sweets: 'تمور وحلويات', snacks: 'سناكات', household: 'منظفات ومنزلية', personal_care: 'عناية شخصية', baby: 'أطفال', other: 'أخرى'
};
const CATEGORY_EMOJI = {
  produce_veg: '🥦', produce_fruit: '🍎', meat: '🥩', poultry: '🍗', fish: '🐟', eggs: '🥚',
  dairy_milk: '🥛', dairy_cheese: '🧀', dairy_yogurt_labneh: '🥣', butter_cream: '🧈',
  bakery: '🍞', rice_grains: '🍚', pasta_noodles: '🍝', flour_baking: '🌾',
  oil_ghee: '🫒', canned: '🥫', sauces_condiments: '🍅', spices: '🌶️',
  legumes_nuts: '🫘', frozen_chicken: '🧊', frozen_veg: '🫛', frozen_other: '🧊',
  breakfast_spreads: '🍯', drinks_water: '💧', drinks_juice: '🧃', tea_coffee: '☕',
  dates_sweets: '🍫', snacks: '🍪', household: '🧽', personal_care: '🧴', baby: '🍼', other: '🛒'
};
const CUISINE_EMOJI = { khaliji: '🍛', shami: '🥙', quick: '🍳', healthy: '🥗', budget: '💰' };
const STORE_COLORS = { panda: '#e2231a', tamimi: '#f28c28', othaim: '#1f5fae' };

const SOLD_BY = { each: 'للحبة', plate: 'للطبق', kg: 'للكيلو', pack: 'للعبوة', carton: 'للكرتون', bag: 'للكيس', bunch: 'للحزمة', box: 'للعلبة' };
const NOTES = { 'selected branches': 'في فروع مختارة', 'Iktissab members': 'لأعضاء اكتساب' };

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
const dayFormat = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const shortDayFormat = new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-latn', { day: 'numeric', month: 'long', timeZone: 'UTC' });
const fromISO = iso => new Date(iso + 'T00:00:00Z');
const longDay = iso => dayFormat.format(fromISO(iso));
const shortDay = iso => shortDayFormat.format(fromISO(iso));

async function getJSON(path) {
  const response = await fetch(path, { cache: 'no-cache' });
  if (!response.ok) throw new Error(path + ' → ' + response.status);
  return response.json();
}
async function loadData() {
  const current = await getJSON('data/current.json');
  const [offers, plans] = await Promise.all([getJSON('data/' + current.offers), getJSON('data/' + current.plans)]);
  return { current, offers, plans };
}

const TABS = ['home', 'shop', 'list', 'plan', 'me'];
function parseRoute() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const first = parts[0] === 'deals' ? 'shop' : parts[0];
  const tab = TABS.concat('meal').includes(first) ? first : 'home';
  return { tab, id: parts[1] || null };
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const plusPreview = () => new URLSearchParams(window.location.search).get('plus') === 'preview';
const count = n => n.toLocaleString('en-US');

/* The family's week: the picks they made (or the week's suggestions),
   topped up from the alternatives or trimmed to the number of meals they
   want. `choices` holds every meal that can be swapped in. */
function activePlan(plan, storedPicks, mealCount) {
  const choices = plan.meals.concat(plan.alternatives || []);
  const byId = new Map(choices.map(meal => [meal.id, meal]));
  const ids = (storedPicks || plan.meals.map(meal => meal.id)).filter((id, i, all) => byId.has(id) && all.indexOf(id) === i);
  choices.filter(meal => !meal.unavailable).forEach(meal => { if (ids.length < mealCount && !ids.includes(meal.id)) ids.push(meal.id); });
  return Object.assign({}, plan, { meals: ids.slice(0, mealCount).map(id => byId.get(id)), choices });
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

function Photo({ data, offer, width = 384, cls = 'photo' }) {
  const src = photoUrl(data, offer, width);
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [src]);
  if (!src || broken) {
    return html`<span class=${cls + ' photo--none'} aria-hidden="true"><${Emoji} char=${CATEGORY_EMOJI[offer && offer.category] || '🛒'} size=${width > 200 ? 56 : 26} /></span>`;
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
const ICONS = {
  home: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z',
  shop: 'M3 12.6V4a1 1 0 0 1 1-1h8.6a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-8.6 8.6a1 1 0 0 1-1.4 0L3.3 13.3a1 1 0 0 1-.3-.7ZM8 8h.01',
  plan: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM8.5 14l2.3 2.3 4.7-4.6',
  me: 'M4 20c.7-3.4 3.9-5.5 8-5.5s7.3 2.1 8 5.5M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  cart: 'M3 4h2l2.4 11h10.2L20 7H6.2M9.5 20h.01M17 20h.01',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14ZM20 20l-3.5-3.5',
  back: 'M9 5l7 7-7 7',
  share: 'M12 15V4M8 8l4-4 4 4M5 13v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  swap: 'M7 7h11l-3-3M17 17H6l3 3',
  close: 'M6 6l12 12M18 6 6 18',
  down: 'M6 9l6 6 6-6',
  people: 'M16 19c-.5-2.6-2.4-4-5-4s-4.5 1.4-5 4M11 12a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4ZM17.5 12.5c1.9.3 3.1 1.6 3.5 3.5M15.5 5.8a3 3 0 0 1 0 5.6',
  chevron: 'M15 6l-6 6 6 6'
};
const Icon = ({ name, size = 22, stroke = 1.9 }) => html`
  <svg class="icon" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width=${stroke} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d=${ICONS[name]} />
  </svg>`;

/* 287.45 → big "287" with a small ".45" */
function Sum({ value }) {
  const [whole, cents] = money(value).split('.');
  return html`<span class="sum" dir="ltr"><span class="sum__whole">${whole}</span>${cents ? html`<span class="sum__cents">.${cents}</span>` : null}</span>`;
}

function Stepper({ value, min, max, step = 1, label, onChange, format, cls = '' }) {
  return html`
    <div class=${'stepper ' + cls} role="group" aria-label=${label}>
      <button type="button" class="stepper__btn" disabled=${value <= min} onClick=${() => onChange(Math.max(min, value - step))} aria-label="إنقاص">−</button>
      <output class="stepper__value" aria-live="polite">${format ? format(value) : value}</output>
      <button type="button" class="stepper__btn" disabled=${value >= max} onClick=${() => onChange(Math.min(max, value + step))} aria-label="زيادة">+</button>
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

const storeName = (data, id) => (data.offers.stores[id] ? data.offers.stores[id].name : id);
const StoreDot = ({ id }) => html`<i class="store-dot" style=${'background:' + (STORE_COLORS[id] || '#0b6e45')} aria-hidden="true"></i>`;

const DAY_MS = 86400000;
/* How old the prices the plans are built on are, and how to say it. A
   flyer has an end date; an online store has the day its prices were read
   and is refreshed weekly, so after eight days it is out of date. */
function pricePeriod(data, id) {
  const store = data.offers.stores[id] || {};
  const today = riyadhToday();
  if (store.checked) {
    const age = Math.round((fromISO(today) - fromISO(store.checked)) / DAY_MS);
    return {
      badge: `أسعار ${shortDay(store.checked)}`,
      text: `أسعار ${store.name} كما ظهرت يوم ${shortDay(store.checked)}`,
      stale: age > 8,
      staleText: `هذه أسعار ${store.name} كما ظهرت يوم ${longDay(store.checked)}، أي قبل ${age} يوماً، وقد تغيّرت منذ ذلك الحين. تتحدّث الخطة كل أسبوع.`
    };
  }
  return {
    badge: `حتى ${shortDay(store.valid_to)}`,
    text: `عروض ${store.name || ''} سارية حتى ${shortDay(store.valid_to)}`,
    stale: today > store.valid_to,
    staleText: `انتهت مدة هذه العروض يوم ${longDay(store.valid_to)}. الأسعار المعروضة قد لا تكون سارية.`
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
        <button type="button" class="sheet__close" aria-label="إغلاق" onClick=${onClose}><${Icon} name="close" size=${20} /></button>
      </div>
      ${children}
    </div>`;
}

/* The green header every main screen opens with. */
function Head({ data, store, period, onStore, small, children }) {
  return html`
    <header class=${'head' + (small ? ' head--small' : '')}>
      <div class="head__row">
        <a class="brand" href="#/home" aria-label="مقاضي — الرئيسية"><${Logo} size=${38} glass /><span class="brand__name">${CONFIG.name}</span></a>
        <button type="button" class="storebtn" onClick=${onStore} aria-label=${'تتسوّق من ' + storeName(data, store) + '. تغيير المتجر'}>
          <span class="storebtn__label">تتسوّق من</span>
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
  const size = [offerSize(offer), SOLD_BY[offer.sold_by]].filter(Boolean).join(' · ');
  return html`
    <article class="pcard">
      <div class="pcard__media">
        <${Photo} data=${data} offer=${offer} width=${384} cls="pcard__photo" />
        ${percent ? html`<span class="pcard__off" dir="ltr">−${percent}%</span>` : null}
        <span class="pcard__store"><${StoreDot} id=${offer.store} />${storeName(data, offer.store)}</span>
        ${units
          ? html`<${Stepper} cls="stepper--card" value=${units} min=${0} max=${20} step=${step} label=${'الكمية من ' + offer.name} onChange=${onSet} />`
          : html`<button type="button" class="pcard__add" aria-label=${'إضافة ' + offer.name + ' إلى القائمة'} onClick=${() => onSet(step)}>+</button>`}
      </div>
      <div class="pcard__body">
        <p class="pcard__price">
          <b dir="ltr">${money(halalas(offer.price))}</b><span class="pcard__cur">ريال</span>
          ${offer.was > offer.price ? html`<s dir="ltr">${money(halalas(offer.was))}</s>` : null}
        </p>
        <h3 class="pcard__name">${offer.name}</h3>
        ${size ? html`<p class="pcard__size">${size}</p>` : null}
        ${per ? html`<p class="pcard__per"><span dir="ltr">${per.value.toFixed(2)}</span> ريال ${per.per === 'kg' ? 'للكيلو' : 'لليتر'}</p>` : null}
        ${(twins || []).map(other => html`<span class=${'pcard__twin' + (other.price < offer.price ? ' is-cheaper' : '')}>في ${storeName(data, other.store)}: <b dir="ltr">${money(halalas(other.price))}</b></span>`)}
        ${offer.note ? html`<span class="badge badge--note">${NOTES[offer.note] || offer.note}</span>` : null}
      </div>
    </article>`;
}

/* The cuisines, as round picture buttons. */
function Cuisines({ plans, current, onPick }) {
  return html`
    <div class="circles" role="group" aria-label="نوع السفرة">
      ${plans.map(option => html`
        <button type="button" class="circle" aria-pressed=${option.id === current} onClick=${() => onPick(option.id)}>
          <span class="circle__pic"><${Emoji} char=${CUISINE_EMOJI[option.id] || option.meals[0].emoji} size=${40} /></span>
          <span class="circle__name">${option.name}</span>
        </button>`)}
    </div>`;
}

const SectionTitle = ({ title, emoji, href, more }) => html`
  <div class="section-head">
    <h2 class="section-head__title">${emoji ? html`<${Emoji} char=${emoji} size=${22} /> ` : null}${title}</h2>
    ${href ? html`<a class="section-head__more" href=${href}>${more || 'عرض الكل'}</a>` : null}
  </div>`;

/* ---------------------------------------------------------------------
   Home
   ------------------------------------------------------------------- */
function HomeTab({ data, store, head, storeRows, plans, plan, persons, week, list, offers, locked, set, openFamily }) {
  const cooked = plan.meals.filter(meal => !week.skipped.includes(meal.id) && !locked.has(meal.id)).length;
  const rail = useMemo(() => data.offers.offers
    .filter(offer => offer.store === store && offer.was > offer.price && offer.img && isFood(offer))
    .sort((a, b) => discountPercent(b) - discountPercent(a) || a.price - b.price)
    .slice(0, CONFIG.railSize), [data, store]);

  return html`
    <${Head} ...${head}>
      <p class="head__greet">
        سفرة أسبوعك جاهزة
        <button type="button" class="head__family" onClick=${openFamily} aria-label=${'عدد أفراد الأسرة ' + persons + '. تغيير'}><${Emoji} char="👨‍👩‍👧‍👦" size=${20} /> ${persons} أفراد</button>
      </p>
      <p class="head__total"><${Sum} value=${list.totals.cost} /><span>ريال للأسبوع</span></p>
      <div class="head__chips">
        ${list.totals.saved ? html`<span class="hchip hchip--gold">وفّرت <b dir="ltr">${money(list.totals.saved)}</b> ريال</span>` : null}
        <span class="hchip">${cooked} طبخات · ${list.totals.items} صنف</span>
        ${list.unpriced.length ? html`<span class="hchip">${list.unpriced.length} بدون سعر</span>` : null}
      </div>
    <//>
    <a class="float searchbar" href="#/shop/search"><${Icon} name="search" size=${20} /><span>ابحث عن أي غرض: بصل، حليب، منظف…</span></a>

    ${storeRows.length > 1 ? html`<${StoreCards} data=${data} rows=${storeRows} onPick=${set.store} />` : null}

    <${SectionTitle} title="نوع السفرة" />
    <${Cuisines} plans=${plans} current=${plan.id} onPick=${set.plan} />

    <${SectionTitle} title="طبخات الأسبوع" href="#/plan" />
    <div class="carousel">
      ${plan.meals.map((meal, index) => {
        const off = week.skipped.includes(meal.id);
        const isLocked = locked.has(meal.id);
        const best = mealHighlight(meal, offers);
        return html`
          <article class=${'mcard' + (off ? ' is-off' : '') + (isLocked ? ' is-locked' : '')}>
            <a class="mcard__link" href=${isLocked ? '#/me' : '#/meal/' + meal.id} aria-label=${meal.name}>
              <span class=${'mcard__art tile-' + (index % 6)}>
                <span class="mcard__day">اليوم ${index + 1}</span>
                <${Emoji} char=${meal.emoji} size=${84} />
              </span>
              <span class="mcard__body">
                <span class="mcard__name">${meal.name}</span>
                <span class="mcard__meta">${isLocked ? html`<${Icon} name="lock" size=${13} /> مع مقاضي بلس` : html`<${Icon} name="clock" size=${13} /> ${meal.minutes} دقيقة`}</span>
                ${best && !isLocked ? html`<span class="mcard__deal">عرض ${best.name} <b dir="ltr">${money(halalas(best.price))}</b></span>` : null}
              </span>
            </a>
            ${isLocked ? null : html`
              <button type="button" class="mcard__toggle" aria-pressed=${!off} aria-label=${(off ? 'إضافة ' : 'استبعاد ') + meal.name} onClick=${() => set.toggleMeal(meal.id)}>
                <${Icon} name="check" size=${15} stroke=${2.6} />
              </button>`}
          </article>`;
      })}
    </div>

    ${rail.length ? html`
      <${SectionTitle} title=${'عروض ' + storeName(data, store) + ' هذا الأسبوع'} emoji="🔥" href="#/shop" />
      <div class="rail">
        ${rail.map(offer => html`<${ProductCard} data=${data} offer=${offer} units=${week.extras[offer.id] || 0} onSet=${value => set.extra(offer.id, value)} />`)}
      </div>` : null}

    <p class="fineprint">الطبخات والأصناف تُختار تلقائياً كل أسبوع من أرخص ما يغطي حاجة الأسرة في كل متجر. الأسعار من المتاجر نفسها وقد تختلف حسب الفرع وتوفّر الكمية، والتوفير محسوب فقط للأصناف التي عليها خصم فعلي.</p>`;
}

/* The same week at each store; the cheapest is marked only when every
   store priced the same number of items, so the comparison is fair. */
function StoreCards({ data, rows, onPick }) {
  return html`
    <div class="stores" role="group" aria-label="نفس السفرة في كل متجر">
      ${rows.map(row => html`
        <button type="button" class=${'scard' + (row.current ? ' is-current' : '')} aria-pressed=${row.current} onClick=${() => onPick(row.id)}>
          ${row.cheapest ? html`<span class="scard__tag">الأرخص</span>` : null}
          <span class="scard__name"><${StoreDot} id=${row.id} />${row.name}</span>
          <span class="scard__value"><b dir="ltr">${money(row.cost)}</b> <small>ريال</small></span>
          <span class=${'scard__note' + (row.current ? ' is-good' : row.diff > 0 ? ' is-bad' : row.diff < 0 ? ' is-good' : '')}>
            ${row.current ? 'متجرك الحالي'
              : row.diff === null ? `${row.unpriced} بدون سعر`
              : row.diff > 0 ? html`أغلى بـ <span dir="ltr">${money(row.diff)}</span>`
              : row.diff < 0 ? html`أرخص بـ <span dir="ltr">${money(-row.diff)}</span>`
              : 'نفس التكلفة'}
          </span>
        </button>`)}
    </div>`;
}

function StoreSheet({ data, rows, onPick, onClose }) {
  return html`
    <${Sheet} title="من أين تتسوّق؟" onClose=${onClose}>
      <p class="sheet__sub">تكلفة نفس السفرة في كل متجر، لعدد أفراد أسرتك.</p>
      <ul class="sheet__list">
        ${rows.map(row => html`
          <li>
            <button type="button" class=${'store-option' + (row.current ? ' is-current' : '')} onClick=${() => { onPick(row.id); onClose(); }}>
              <span class="store-option__name"><${StoreDot} id=${row.id} />${row.name}${row.cheapest ? html`<span class="badge badge--gold">الأرخص</span>` : null}</span>
              <span class="store-option__sub">${pricePeriod(data, row.id).text}${row.unpriced ? ` · ${row.unpriced} بدون سعر` : ''}</span>
              <span class="store-option__value"><b dir="ltr">${money(row.cost)}</b> ريال</span>
              ${row.current ? html`<span class="store-option__check"><${Icon} name="check" size=${16} stroke=${2.6} /></span>` : null}
            </button>
          </li>`)}
      </ul>
    <//>`;
}

function FamilySheet({ persons, mealsPerWeek, maxMeals, set, onClose }) {
  return html`
    <${Sheet} title="أسرتك" onClose=${onClose}>
      <div class="sheet__rows">
        <div class="row"><span>عدد أفراد الأسرة</span><${Stepper} value=${persons} min=${CONFIG.minPersons} max=${CONFIG.maxPersons} label="عدد أفراد الأسرة" onChange=${set.persons} /></div>
        <div class="row"><span>عدد الطبخات في الأسبوع</span><${Stepper} value=${Math.min(mealsPerWeek, maxMeals)} min=${CONFIG.minMeals} max=${maxMeals} label="عدد الطبخات في الأسبوع" onChange=${set.mealsPerWeek} /></div>
      </div>
      <button type="button" class="btn btn--wide" onClick=${onClose}>تم</button>
    <//>`;
}

/* ---------------------------------------------------------------------
   Plan
   ------------------------------------------------------------------- */
function PlanTab({ data, head, plans, plan, persons, mealsPerWeek, maxMeals, week, offers, locked, set }) {
  const [swapFor, setSwapFor] = useState(null);
  const picked = new Set(plan.meals.map(meal => meal.id));
  const swaps = plan.choices.filter(meal => !picked.has(meal.id));
  const cooked = plan.meals.filter(meal => !week.skipped.includes(meal.id) && !locked.has(meal.id)).length;
  return html`
    <${Head} ...${head} small>
      <h1 class="head__title">خطة الأسبوع</h1>
      <p class="head__sub">${plan.name} · ${cooked} طبخات · ${persons} أفراد</p>
    <//>
    <div class="float panel">
      <div class="row"><span><${Icon} name="people" size=${20} /> أفراد الأسرة</span><${Stepper} value=${persons} min=${CONFIG.minPersons} max=${CONFIG.maxPersons} label="عدد أفراد الأسرة" onChange=${set.persons} /></div>
      <div class="row"><span><${Icon} name="plan" size=${20} /> طبخات الأسبوع</span><${Stepper} value=${Math.min(mealsPerWeek, maxMeals)} min=${CONFIG.minMeals} max=${maxMeals} label="عدد الطبخات في الأسبوع" onChange=${set.mealsPerWeek} /></div>
    </div>

    <${SectionTitle} title="نوع السفرة" />
    <${Cuisines} plans=${plans} current=${plan.id} onPick=${set.plan} />
    <p class="tagline">${plan.tagline}</p>

    <ol class="meals">
      ${plan.meals.map((meal, index) => {
        const off = week.skipped.includes(meal.id);
        const isLocked = locked.has(meal.id);
        const best = mealHighlight(meal, offers);
        const bought = meal.ingredients.map(ingredient => (ingredient.offer ? offers.get(ingredient.offer) : null)).filter(Boolean);
        return html`
          <li class=${'meal' + (off ? ' is-off' : '') + (isLocked ? ' is-locked' : '')}>
            <a class="meal__main" href=${isLocked ? '#/me' : '#/meal/' + meal.id}>
              <span class=${'meal__tile tile-' + (index % 6)}><${Emoji} char=${meal.emoji} size=${48} /></span>
              <span class="meal__body">
                <span class="meal__day">اليوم ${index + 1}</span>
                <span class="meal__name">${meal.name}</span>
                ${isLocked
                  ? html`<span class="meal__meta"><${Icon} name="lock" size=${13} /> مع مقاضي بلس</span>`
                  : html`<span class="meal__meta"><${Icon} name="clock" size=${13} /> ${meal.minutes} دقيقة · ${bought.length} مكونات من المتجر</span>
                    ${best ? html`<span class="meal__deal">عرض: ${best.name} <b dir="ltr">${money(halalas(best.price))}</b> بدل <s dir="ltr">${money(halalas(best.was))}</s></span>` : null}
                    <span class="thumbs">${bought.slice(0, 4).map(offer => html`<${Photo} data=${data} offer=${offer} width=${128} cls="thumb" />`)}${bought.length > 4 ? html`<em>+${bought.length - 4}</em>` : null}</span>`}
              </span>
            </a>
            ${isLocked ? null : html`
              <div class="meal__actions">
                <button type="button" class="meal__toggle" aria-pressed=${!off} aria-label=${(off ? 'إضافة ' : 'استبعاد ') + meal.name} onClick=${() => set.toggleMeal(meal.id)}>
                  <${Icon} name="check" size=${16} stroke=${2.6} />
                </button>
                ${swaps.length ? html`<button type="button" class="meal__swap" aria-label=${'تبديل ' + meal.name} onClick=${() => setSwapFor(meal)}><${Icon} name="swap" size=${15} /> بدّل</button>` : null}
              </div>`}
          </li>`;
      })}
    </ol>

    ${plan.essentials ? html`
      <label class="essentials">
        <span class="essentials__pic"><${Emoji} char="🥚" size=${34} /></span>
        <span class="essentials__body">
          <span class="essentials__name">${plan.essentials.name}</span>
          <span class="essentials__text">${plan.essentials.items.map(item => item.name).join('، ')}</span>
        </span>
        <input class="switch" type="checkbox" role="switch" checked=${week.essentials} onChange=${event => set.essentials(event.target.checked)} />
      </label>` : null}

    ${swapFor ? html`<${SwapSheet} meal=${swapFor} options=${swaps} offers=${offers} onPick=${id => { set.swap(swapFor.id, id); setSwapFor(null); }} onClose=${() => setSwapFor(null)} />` : null}

    <p class="fineprint">تتغيّر الطبخات كل أسبوع حسب أرخص ما في المتجر. «بدّل» تعرض طبخات أخرى من نفس السفرة أو من سفر أخرى، والقائمة تتحدّث فوراً.</p>`;
}

/* The meals that can take this one's place. */
function SwapSheet({ meal, options, offers, onPick, onClose }) {
  return html`
    <${Sheet} title=${'بدل «' + meal.name + '»'} onClose=${onClose}>
      <ul class="sheet__list">
        ${options.map((option, i) => {
          const best = mealHighlight(option, offers);
          const groupStart = option.cuisine && !(options[i - 1] && options[i - 1].cuisine);
          return html`
            ${groupStart ? html`<li class="sheet__group">من سفر أخرى</li>` : null}
            <li>
              <button type="button" class="swap-option" onClick=${() => onPick(option.id)}>
                <span class="swap-option__tile"><${Emoji} char=${option.emoji} size=${34} /></span>
                <span class="swap-option__body">
                  <span class="swap-option__name">${option.name}</span>
                  <span class="swap-option__meta">${option.cuisine ? option.cuisine + ' · ' : ''}${option.minutes} دقيقة${best ? html` · ${best.name} <b dir="ltr">${money(halalas(best.price))}</b>` : null}</span>
                  ${option.unavailable ? html`<span class="swap-option__note">مكوّنها الأساسي غير متوفر في المتجر هذا الأسبوع</span>` : null}
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
function MealPage({ data, plan, meal, index, persons, offers, backHref }) {
  const scale = persons / plan.base_persons;
  const bought = meal.ingredients.filter(ingredient => ingredient.offer).length;
  return html`
    <article class="recipe">
      <header class=${'recipe__hero tile-' + (Math.max(0, index) % 6)}>
        <a class="recipe__back" href=${backHref} aria-label="رجوع"><${Icon} name="back" size=${20} stroke=${2.2} /></a>
        <${Emoji} char=${meal.emoji} size=${132} />
      </header>
      <div class="recipe__head">
        <h1 class="recipe__name">${meal.name}</h1>
        <p class="recipe__summary">${meal.summary}</p>
        <div class="recipe__chips">
          <span class="chip-soft"><${Icon} name="clock" size=${15} /> ${meal.minutes} دقيقة</span>
          <span class="chip-soft"><${Icon} name="people" size=${15} /> تكفي ${persons} أشخاص</span>
          <span class="chip-soft"><${Icon} name="cart" size=${15} /> ${bought} مكونات من المتجر</span>
        </div>
      </div>

      <h2 class="section-title">المكونات</h2>
      <ul class="ingredients">
        ${meal.ingredients.map(ingredient => {
          const offer = ingredient.offer ? offers.get(ingredient.offer) : null;
          return html`
            <li class="ingredient">
              ${offer ? html`<${Photo} data=${data} offer=${offer} width=${128} cls="ingredient__photo" />` : html`<span class="ingredient__photo photo--none"><${Emoji} char="🧂" size=${24} /></span>`}
              <span class="ingredient__body">
                <span class="ingredient__name">${ingredient.name}${ingredient.pantry ? html`<small> من مطبخك</small>` : null}</span>
                <span class="ingredient__qty">${ingredientAmount(ingredient, scale)}</span>
                ${offer ? html`<span class="ingredient__offer">${storeName(data, offer.store)}: ${offer.name} ${offerSize(offer)}</span>` : null}
              </span>
              ${offer ? html`<${OfferPrice} offer=${offer} />` : null}
            </li>`;
        })}
      </ul>

      <h2 class="section-title">الطريقة</h2>
      <ol class="steps">
        ${meal.steps.map(step => html`<li>${step}</li>`)}
      </ol>
      ${meal.tip ? html`<p class="tip"><${Emoji} char="💡" size=${22} /> <span>${meal.tip}</span></p>` : null}
    </article>`;
}

/* ---------------------------------------------------------------------
   Shopping list
   ------------------------------------------------------------------- */
function lineDetail(line) {
  const offer = line.offer;
  const each = money(halalas(offer.price));
  const unit = SOLD_BY[offer.sold_by] || 'للعبوة';
  if (line.loose) return `${line.units} كجم × ${each} للكيلو`;
  return `${line.units} × ${each} ${unit}`;
}

function shareText(data, list, period) {
  const rows = [];
  rows.push(`🛒 مقاضي الأسبوع — ${period.text}`);
  AISLES.forEach(aisle => {
    const lines = list.lines.filter(line => aisleOf(line.offer.category) === aisle);
    if (!lines.length) return;
    rows.push('', aisle.name + ':');
    lines.forEach(line => rows.push(`▫️ ${line.offer.name}${offerSize(line.offer) ? ' ' + offerSize(line.offer) : ''} — ${lineDetail(line)} = ${money(line.cost)} (${storeName(data, line.offer.store)})`));
  });
  if (list.unpriced.length) {
    rows.push('', 'بدون سعر هذا الأسبوع:');
    list.unpriced.forEach(item => rows.push(`▫️ ${item.name}${item.need ? ' — ' + amount(item.need) : ''}`));
  }
  rows.push('', `إجمالي الأصناف المسعّرة: ${money(list.totals.cost)} ريال`);
  if (list.totals.saved) rows.push(`التوفير من الخصومات: ${money(list.totals.saved)} ريال`);
  return rows.join('\n');
}

function ListTab({ data, head, list, week, set, period, compare }) {
  const done = key => week.checked.includes(key);
  const total = list.lines.length + list.unpriced.length;
  const ticked = list.lines.filter(line => done(line.key)).length + list.unpriced.filter(item => done('u:' + item.name)).length;
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const text = shareText(data, list, period);
    try {
      if (navigator.share) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      window.location.href = 'https://wa.me/?text=' + encodeURIComponent(text);
    }
  };

  const title = html`
    <div class="head__titlerow">
      <div>
        <h1 class="head__title">قائمة المقاضي</h1>
        <p class="head__sub">${period.text}</p>
      </div>
      ${total ? html`<button type="button" class="head__action" onClick=${share}><${Icon} name="share" size=${18} /> ${copied ? 'تم النسخ' : 'مشاركة'}</button>` : null}
    </div>`;

  if (!total) {
    return html`
      <${Head} ...${head} small>${title}<//>
      <div class="float empty">
        <${Emoji} char="🛒" size=${72} />
        <p class="empty__title">القائمة فارغة</p>
        <p>يلزم اختيار طبخة واحدة على الأقل من الخطة، أو إضافة أصناف من شاشة التسوّق.</p>
        <a class="btn" href="#/plan">العودة إلى الخطة</a>
      </div>`;
  }

  return html`
    <${Head} ...${head} small>${title}<//>
    <section class="float panel summary" aria-label="ملخص القائمة">
      <div class="summary__top">
        <div>
          <span class="summary__label">إجمالي الأصناف المسعّرة</span>
          <span class="summary__value"><${Sum} value=${list.totals.cost} /> <small>ريال</small></span>
        </div>
        ${list.totals.saved ? html`<span class="hchip hchip--gold">وفّرت <b dir="ltr">${money(list.totals.saved)}</b></span>` : null}
      </div>
      ${compare.map(other => {
        const diff = other.unpriced === list.unpriced.length ? other.totals.cost - list.totals.cost : null;
        return html`<p class="summary__compare"><${StoreDot} id=${other.id} />نفس القائمة في ${other.name}: <b dir="ltr">${money(other.totals.cost)}</b> ريال${diff ? html` <em class=${diff > 0 ? 'is-bad' : 'is-good'}>(${diff > 0 ? 'أغلى' : 'أرخص'} بـ <span dir="ltr">${money(Math.abs(diff))}</span>)</em>` : ''}${other.unpriced ? ` · ${other.unpriced} بدون سعر هناك` : ''}</p>`;
      })}
      <div class="summary__progress">
        <span>تم ${ticked} من ${total}</span>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax=${total} aria-valuenow=${ticked} aria-label="ما تم شراؤه"><span style=${'width:' + (total ? ticked / total * 100 : 0) + '%'}></span></div>
      </div>
    </section>

    ${AISLES.map(aisle => {
      const lines = list.lines.filter(line => aisleOf(line.offer.category) === aisle);
      if (!lines.length) return null;
      return html`
        <section class="aisle">
          <h2 class="aisle__name"><${Emoji} char=${aisle.emoji} size=${22} /> ${aisle.name} <small>${lines.length}</small></h2>
          <ul class="lines">
            ${lines.map(line => html`
              <li class=${'line' + (done(line.key) ? ' is-done' : '')}>
                <label class="line__check">
                  <input type="checkbox" class="tick" checked=${done(line.key)} onChange=${() => set.toggleChecked(line.key)} aria-label=${line.offer.name} />
                  <${Photo} data=${data} offer=${line.offer} width=${128} cls="line__photo" />
                  <span class="line__body">
                    <span class="line__name">${line.offer.name} <small dir="ltr">${offerSize(line.offer)}</small></span>
                    <span class="line__sub">${lineDetail(line)} · ${storeName(data, line.offer.store)}${line.need ? ' · يلزمك ' + amount(line.need) : ''}</span>
                    <span class="line__tags">
                      ${line.saved ? html`<span class="badge badge--save">وفّرت <b dir="ltr">${money(line.saved)}</b></span>` : null}
                      ${line.keeps ? html`<span class="badge">يكفي لأكثر من أسبوع</span>` : null}
                      ${line.offer.promo ? html`<span class="badge badge--cut" dir="ltr">${line.offer.promo}</span>` : null}
                      ${line.offer.note ? html`<span class="badge badge--note">${NOTES[line.offer.note] || line.offer.note}</span>` : null}
                    </span>
                  </span>
                </label>
                <span class="line__side">
                  <span class="line__cost" dir="ltr">${money(line.cost)}</span>
                  ${line.extra ? html`<button type="button" class="link" onClick=${() => set.extra(line.offer.id, 0)}>إزالة</button>` : null}
                </span>
              </li>`)}
          </ul>
        </section>`;
    })}

    ${list.unpriced.length ? html`
      <section class="aisle">
        <h2 class="aisle__name"><${Emoji} char="🏷️" size=${22} /> بدون سعر هذا الأسبوع</h2>
        <p class="aisle__note">لم نجدها في المتجر هذا الأسبوع، فهي خارج الإجمالي.</p>
        <ul class="lines">
          ${list.unpriced.map(item => html`
            <li class=${'line' + (done('u:' + item.name) ? ' is-done' : '')}>
              <label class="line__check">
                <input type="checkbox" class="tick" checked=${done('u:' + item.name)} onChange=${() => set.toggleChecked('u:' + item.name)} aria-label=${item.name} />
                <span class="line__body">
                  <span class="line__name">${item.name}</span>
                  <span class="line__sub">${item.need ? 'يلزمك ' + amount(item.need) : ''}${item.sources.length ? ' · ' + item.sources.join('، ') : ''}</span>
                </span>
              </label>
            </li>`)}
        </ul>
      </section>` : null}

    ${list.pantry.length ? html`
      <details class="pantry">
        <summary><${Emoji} char="🧂" size=${20} /> من مطبخك (${list.pantry.length})</summary>
        <p>${list.pantry.map(item => item.name).join('، ')}</p>
      </details>` : null}`;
}

/* ---------------------------------------------------------------------
   Shop
   ------------------------------------------------------------------- */
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
    return Object.keys(CATEGORY_NAMES).filter(id => counts[id]);
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
  const heading = searching ? `${count(results.length)} نتيجة` : category !== 'all' ? CATEGORY_NAMES[category] : 'أقوى عروض الأسبوع';

  return html`
    <${Head} ...${head} small>
      <h1 class="head__title">تسوّق كل أغراضك</h1>
      <p class="head__sub">${count(data.offers.offers.length)} منتج من ${names.slice(0, -1).join('، ')}${names.length > 1 ? ' و' : ''}${names[names.length - 1]}</p>
    <//>
    <label class="float searchbar">
      <${Icon} name="search" size=${20} />
      <input ref=${input} type="search" inputmode="search" placeholder="ابحث عن أي غرض: بصل، حليب، منظف…" aria-label="بحث في المنتجات" value=${query} onInput=${event => setQuery(event.target.value)} />
      ${query ? html`<button type="button" class="searchbar__clear" aria-label="مسح البحث" onClick=${() => setQuery('')}><${Icon} name="close" size=${16} /></button>` : null}
    </label>

    ${storeIds.length > 1 ? html`
      <div class="pills" role="group" aria-label="المتجر">
        <button type="button" class="pill" aria-pressed=${store === 'all'} onClick=${() => setStore('all')}>كل المتاجر</button>
        ${storeIds.map(id => html`<button type="button" class="pill" aria-pressed=${store === id} onClick=${() => setStore(id)}><${StoreDot} id=${id} />${storeName(data, id)}</button>`)}
      </div>` : null}

    <div class="circles circles--cats" role="group" aria-label="القسم">
      <button type="button" class="circle" aria-pressed=${category === 'all'} onClick=${() => setCategory('all')}>
        <span class="circle__pic"><${Emoji} char="🔥" size=${36} /></span><span class="circle__name">العروض</span>
      </button>
      ${categories.map(id => html`
        <button type="button" class="circle" aria-pressed=${category === id} onClick=${() => setCategory(id)}>
          <span class="circle__pic"><${Emoji} char=${CATEGORY_EMOJI[id]} size=${36} /></span><span class="circle__name">${CATEGORY_NAMES[id]}</span>
        </button>`)}
    </div>

    <${SectionTitle} title=${heading} emoji=${browsing ? '🔥' : null} />
    ${results.length ? html`
      <div class="pgrid">
        ${results.slice(0, shown).map(offer => html`
          <${ProductCard} data=${data} offer=${offer} units=${week.extras[offer.id] || 0} onSet=${value => set.extra(offer.id, value)}
            twins=${storeIds.filter(id => id !== offer.store).map(id => twin(offer, id)).filter(Boolean)} />`)}
      </div>
      ${results.length > shown ? html`<button type="button" class="btn btn--ghost btn--wide" onClick=${() => setShown(shown + CONFIG.shopPage)}>عرض المزيد (${count(results.length - shown)})</button>` : null}`
    : html`<div class="empty"><${Emoji} char="🔍" size=${56} /><p class="empty__title">${searching ? 'لا توجد منتجات مطابقة' : 'لا توجد عروض مطابقة'}</p><p>يمكن تجربة كلمة أخرى أو قسم آخر.</p></div>`}`;
}

/* ---------------------------------------------------------------------
   Account and settings
   ------------------------------------------------------------------- */
function MeTab({ data, head, plans, store, plan, persons, mealsPerWeek, maxMeals, set, plusOn, openStore }) {
  const stores = Object.keys(data.offers.stores).map(id => data.offers.stores[id]);
  return html`
    <${Head} ...${head} small>
      <div class="profile">
        <span class="profile__pic"><${Emoji} char="👨‍👩‍👧‍👦" size=${40} /></span>
        <div>
          <h1 class="head__title">أسرتك</h1>
          <p class="head__sub">${persons} أفراد · ${storeName(data, store)} · سفرة ${plan.name}</p>
        </div>
      </div>
    <//>

    <section class="float panel">
      <div class="row"><span>عدد أفراد الأسرة</span><${Stepper} value=${persons} min=${CONFIG.minPersons} max=${CONFIG.maxPersons} label="عدد أفراد الأسرة" onChange=${set.persons} /></div>
      <button type="button" class="row row--button" onClick=${openStore}>
        <span>المتجر الذي تتسوّق منه</span>
        <span class="row__value"><${StoreDot} id=${store} />${storeName(data, store)} <${Icon} name="chevron" size=${18} /></span>
      </button>
      <div class="row"><span>عدد الطبخات في الأسبوع</span><${Stepper} value=${Math.min(mealsPerWeek, maxMeals)} min=${CONFIG.minMeals} max=${maxMeals} label="عدد الطبخات في الأسبوع" onChange=${set.mealsPerWeek} /></div>
      <div class="row">
        <label for="plan-select">نوع السفرة</label>
        <select id="plan-select" value=${plan.id} onChange=${event => set.plan(event.target.value)}>
          ${plans.map(option => html`<option value=${option.id}>${option.name}</option>`)}
        </select>
      </div>
    </section>

    <section class="card plus">
      <p class="plus__label"><${Emoji} char="✨" size=${20} /> مقاضي بلس ${plusOn ? html`<span class="badge">معاينة</span>` : html`<span class="badge">قريباً</span>`}</p>
      <p class="plus__title">الخطة الكاملة كل أسبوع</p>
      <ul class="plus__list">
        <li>كل طبخات الأسبوع بدل أول ${CONFIG.plus.freeMeals}</li>
        <li>كل أنواع السفر، مع تعديل عدد الأفراد</li>
        <li>قائمة مقاضي كاملة قابلة للمشاركة</li>
      </ul>
      ${CONFIG.plus.checkoutUrl
        ? html`<a class="btn" href=${CONFIG.plus.checkoutUrl}>اشتراك${CONFIG.plus.priceLabel ? ' · ' + CONFIG.plus.priceLabel : ''}</a>`
        : html`<p class="plus__note">الدفع الإلكتروني غير مفعّل بعد، والتطبيق مفتوح بالكامل حالياً.</p>`}
    </section>

    <section class="card">
      <h2 class="card__title">مصدر الأسعار</h2>
      ${stores.map(item => html`
        <p class="source">
          <${StoreDot} id=${Object.keys(data.offers.stores).find(id => data.offers.stores[id] === item)} /><b>${item.name}</b> — ${item.source}، ${item.checked ? 'كما ظهرت يوم ' + longDay(item.checked) : 'سارية من ' + longDay(item.valid_from) + ' إلى ' + longDay(item.valid_to)}.
          ${item.source_url ? html` <a href=${item.source_url} target="_blank" rel="noopener noreferrer">المصدر</a>` : null}
        </p>`)}
      <p class="fineprint">الأسعار والصور منقولة من مجلات العروض الرسمية ومن المتاجر الإلكترونية للمتاجر نفسها، وقد تختلف حسب الفرع وتوفّر الكمية، لذا يُنصح بمراجعة السعر على الرف قبل الشراء. التطبيق مستقل وغير تابع لأي متجر.</p>
    </section>

    <section class="card">
      <h2 class="card__title">بياناتك</h2>
      <p class="fineprint">اختياراتك محفوظة على هذا الجهاز فقط، ولا تُرسل إلى أي خادم.</p>
      <button type="button" class="btn btn--ghost" onClick=${() => set.reset()}>مسح اختياراتي من هذا الجهاز</button>
    </section>
    <p class="about"><${Logo} size=${22} /> ${CONFIG.name} · نسخة تجريبية</p>`;
}

/* ---------------------------------------------------------------------
   Welcome (first visit)
   ------------------------------------------------------------------- */
function Welcome({ data, rows, persons, set, onDone }) {
  const [step, setStep] = useState(0);
  if (step === 0) {
    return html`
      <div class="welcome" role="dialog" aria-modal="true" aria-label="أهلاً في مقاضي">
        <div class="welcome__top">
          <${Logo} size=${84} glass />
          <h1 class="welcome__title">مقاضي الأسبوع بأرخص سعر</h1>
          <p class="welcome__sub">اعرف كم ستدفع قبل أن تذهب إلى السوق.</p>
        </div>
        <ul class="welcome__points">
          <li><${Emoji} char="🍽️" size=${48} /><span><b>خطة طبخ جاهزة كل أسبوع</b>طبخات مبنية على عروض هذا الأسبوع، ويمكنك تبديل أي طبخة.</span></li>
          <li><${Emoji} char="🛒" size=${48} /><span><b>قائمة مقاضي بالأسعار الحقيقية</b>أكل وخضار ومنظفات وكل أغراض البيت، مع المجموع بالريال.</span></li>
          <li><${Emoji} char="💰" size=${48} /><span><b>قارن بين المتاجر</b>نفس القائمة في كل متجر، لتعرف أين الأرخص.</span></li>
        </ul>
        <div class="welcome__actions">
          <button type="button" class="btn btn--wide btn--light" onClick=${() => setStep(1)}>ابدأ</button>
          <button type="button" class="welcome__skip" onClick=${onDone}>تخطي</button>
        </div>
      </div>`;
  }
  return html`
    <div class="welcome welcome--setup" role="dialog" aria-modal="true" aria-label="جهّز سفرتك">
      <div class="welcome__top welcome__top--small">
        <h1 class="welcome__title">جهّز سفرتك</h1>
        <p class="welcome__sub">يمكنك تغيير هذا لاحقاً من «حسابي».</p>
      </div>
      <div class="welcome__body">
        <div class="welcome__q">
          <span>كم شخصاً في أسرتك؟</span>
          <${Stepper} cls="stepper--big" value=${persons} min=${CONFIG.minPersons} max=${CONFIG.maxPersons} label="عدد أفراد الأسرة" onChange=${set.persons} />
        </div>
        <p class="welcome__label">من أين تتسوّق عادة؟</p>
        <div class="welcome__stores">
          ${rows.map(row => html`
            <button type="button" class=${'store-option' + (row.current ? ' is-current' : '')} aria-pressed=${row.current} onClick=${() => set.store(row.id)}>
              <span class="store-option__name"><${StoreDot} id=${row.id} />${row.name}${row.cheapest ? html`<span class="badge badge--gold">الأرخص هذا الأسبوع</span>` : null}</span>
              <span class="store-option__sub">سفرة أسبوع لأسرتك: <b dir="ltr">${money(row.cost)}</b> ريال</span>
              ${row.current ? html`<span class="store-option__check"><${Icon} name="check" size=${16} stroke=${2.6} /></span>` : null}
            </button>`)}
        </div>
      </div>
      <div class="welcome__actions">
        <button type="button" class="btn btn--wide" onClick=${onDone}>جهّز سفرتي</button>
      </div>
    </div>`;
}

/* ---------------------------------------------------------------------
   Shell
   ------------------------------------------------------------------- */
const NAV = [
  { id: 'home', label: 'الرئيسية' },
  { id: 'shop', label: 'تسوّق' },
  { id: 'list', label: 'قائمتي', center: true },
  { id: 'plan', label: 'الخطة' },
  { id: 'me', label: 'حسابي' }
];

function App() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [prefs, setPrefs] = useState(readPrefs);
  const [route, setRoute] = useState(parseRoute);
  const [sheet, setSheet] = useState(null);
  const lastTab = useRef('home');

  const load = useCallback(() => {
    setFailed(false);
    loadData().then(setData).catch(() => setFailed(true));
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    const onHash = () => {
      setRoute(previous => { if (previous.tab !== 'meal') lastTab.current = previous.tab; return parseRoute(); });
      setSheet(null);
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
  // The cheapest product per store and barcode, to find the same product elsewhere.
  const barcodes = useMemo(() => {
    const index = new Map();
    if (data) data.offers.offers.forEach(offer => {
      if (!offer.barcode) return;
      const key = offer.store + '|' + offer.barcode;
      const current = index.get(key);
      if (!current || offer.price < current.price) index.set(key, offer);
    });
    return index;
  }, [data]);

  if (failed) {
    return html`
      <div class="boot">
        <${Logo} size=${88} glass />
        <span class="boot__text">تعذّر تحميل أسعار الأسبوع. يُرجى التحقق من الاتصال ثم إعادة المحاولة.</span>
        <button type="button" class="btn btn--light" onClick=${load}>إعادة المحاولة</button>
      </div>`;
  }
  if (!data) {
    return html`<div class="boot" role="status"><${Logo} size=${88} glass /><span class="boot__mark">${CONFIG.name}</span><span class="boot__text">جاري تحميل أسعار الأسبوع…</span></div>`;
  }

  const weekId = data.current.week;
  const stored = prefs.week && prefs.week.id === weekId ? prefs.week : {};
  const week = {
    id: weekId,
    skipped: stored.skipped || [],
    checked: stored.checked || [],
    extras: stored.extras || {},
    essentials: stored.essentials !== false
  };
  // Plans are published per store, for the same meals; the family picks where they shop.
  const planStores = data.plans.stores || [data.plans.store || Object.keys(data.offers.stores)[0]];
  const setsBy = data.plans.by_store || { [planStores[0]]: data.plans };
  const store = planStores.includes(prefs.store) ? prefs.store : planStores[0];
  const plans = setsBy[store].plans;
  const basePlan = plans.find(option => option.id === prefs.plan) || plans[0];
  const mealsPerWeek = clamp(prefs.mealsPerWeek || basePlan.meals.length, CONFIG.minMeals, CONFIG.maxMeals);
  const plan = activePlan(basePlan, (stored.picks || {})[basePlan.id], mealsPerWeek);
  const maxMeals = Math.min(CONFIG.maxMeals, plan.choices.filter(meal => !meal.unavailable).length);
  const persons = clamp(prefs.persons || plan.base_persons, CONFIG.minPersons, CONFIG.maxPersons);
  const plusOn = CONFIG.plus.enabled || plusPreview();
  const locked = new Set(plusOn ? plan.meals.slice(CONFIG.plus.freeMeals).map(meal => meal.id) : []);
  const skipped = new Set(week.skipped.concat(Array.from(locked)));
  const list = buildList({ plan, offers, persons, skipped, essentials: week.essentials, extras: week.extras });

  // The same week at the other stores: same meals, each store's own products;
  // hand-added products follow by barcode when the other store sells the same one.
  const twin = (offer, storeId) => (offer && offer.barcode ? barcodes.get(storeId + '|' + offer.barcode) || null : null);
  const compare = planStores.filter(id => id !== store).map(id => {
    const otherBase = setsBy[id].plans.find(option => option.id === basePlan.id);
    if (!otherBase) return null;
    const otherPlan = activePlan(otherBase, plan.meals.map(meal => meal.id), mealsPerWeek);
    const extras = {};
    Object.keys(week.extras).forEach(extraId => {
      const match = twin(offers.get(extraId), id);
      if (match) extras[match.id] = week.extras[extraId];
    });
    const other = buildList({ plan: otherPlan, offers, persons, skipped, essentials: week.essentials, extras });
    return { id, name: storeName(data, id), totals: other.totals, unpriced: other.unpriced.length };
  }).filter(Boolean);

  // One row per store for the cards and the store picker.
  const fair = compare.every(other => other.unpriced === list.unpriced.length);
  const storeRows = [{ id: store, name: storeName(data, store), cost: list.totals.cost, unpriced: list.unpriced.length, current: true }]
    .concat(compare.map(other => ({ id: other.id, name: other.name, cost: other.totals.cost, unpriced: other.unpriced, current: false })))
    .sort((a, b) => planStores.indexOf(a.id) - planStores.indexOf(b.id));
  const lowest = Math.min(...storeRows.map(row => row.cost));
  storeRows.forEach(row => {
    row.cheapest = fair && storeRows.length > 1 && row.cost === lowest;
    row.diff = row.current ? 0 : row.unpriced === list.unpriced.length ? row.cost - list.totals.cost : null;
  });

  const setWeek = change => patch(previous => {
    const base = previous.week && previous.week.id === weekId ? previous.week : { id: weekId };
    return { week: Object.assign({}, base, change(Object.assign({ skipped: [], checked: [], extras: {} }, base))) };
  });
  const toggleIn = (array, value) => (array.includes(value) ? array.filter(item => item !== value) : array.concat(value));
  const set = {
    persons: value => patch({ persons: value }),
    plan: id => patch({ plan: id }),
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
    reset: () => { try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* nothing stored */ } setPrefs({}); }
  };

  const period = pricePeriod(data, store);
  const openStore = () => setSheet('store');
  const head = { data, store, period, onStore: openStore };
  const mealIndex = route.tab === 'meal' ? plan.meals.findIndex(item => item.id === route.id) : -1;
  const meal = route.tab === 'meal' ? plan.choices.find(item => item.id === route.id && !locked.has(item.id)) : null;
  const tab = route.tab === 'meal' ? lastTab.current : route.tab;

  return html`
    <div class="shell">
      <main class="main" id="main">
        ${meal ? html`<${MealPage} data=${data} plan=${plan} meal=${meal} index=${mealIndex} persons=${persons} offers=${offers} backHref=${'#/' + lastTab.current} />`
          : tab === 'list' ? html`<${ListTab} data=${data} head=${head} list=${list} week=${week} set=${set} period=${period} compare=${compare} />`
          : tab === 'shop' ? html`<${ShopTab} data=${data} head=${head} week=${week} set=${set} twin=${twin} focus=${route.id === 'search'} />`
          : tab === 'plan' ? html`<${PlanTab} data=${data} head=${head} plans=${plans} plan=${plan} persons=${persons} mealsPerWeek=${mealsPerWeek} maxMeals=${maxMeals} week=${week} offers=${offers} locked=${locked} set=${set} />`
          : tab === 'me' ? html`<${MeTab} data=${data} head=${head} plans=${plans} store=${store} plan=${plan} persons=${persons} mealsPerWeek=${mealsPerWeek} maxMeals=${maxMeals} set=${set} plusOn=${plusOn} openStore=${openStore} />`
          : html`<${HomeTab} data=${data} store=${store} head=${head} storeRows=${storeRows} plans=${plans} plan=${plan} persons=${persons} week=${week} list=${list} offers=${offers} locked=${locked} set=${set} openFamily=${() => setSheet('family')} />`}
      </main>

      <nav class="tabbar" aria-label="الأقسام">
        ${NAV.map(item => item.center
          ? html`
            <a class="tabbar__center" href="#/list" aria-current=${tab === 'list' && !meal ? 'page' : null}>
              <span class="tabbar__fab"><${Icon} name="cart" size=${26} stroke=${2} />${list.totals.items ? html`<em>${list.totals.items}</em>` : null}</span>
              <span>${item.label}</span>
            </a>`
          : html`
            <a class="tabbar__item" href=${'#/' + item.id} aria-current=${tab === item.id && !meal ? 'page' : null}>
              <span class="tabbar__icon"><${Icon} name=${item.id} size=${23} /></span>
              <span>${item.label}</span>
            </a>`)}
      </nav>

      ${sheet === 'store' ? html`<${StoreSheet} data=${data} rows=${storeRows} onPick=${set.store} onClose=${() => setSheet(null)} />` : null}
      ${sheet === 'family' ? html`<${FamilySheet} persons=${persons} mealsPerWeek=${mealsPerWeek} maxMeals=${maxMeals} set=${set} onClose=${() => setSheet(null)} />` : null}
      ${prefs.welcomed ? null : html`<${Welcome} data=${data} rows=${storeRows} persons=${persons} set=${set} onDone=${set.welcomed} />`}
    </div>`;
}

const root = document.getElementById('app');
root.textContent = '';
render(html`<${App} />`, root);

if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ }); });
}
