/*
 * مقاضي — واجهة التطبيق
 * One static page: it reads the week's offers and plans from data/ and keeps
 * the family's choices on the device. All arithmetic lives in lib/plan.js.
 */
import { html, render, useState, useEffect, useMemo, useCallback } from './lib/htm-preact.js';
import {
  buildList, mealHighlight, discountPercent, unitPrice, matches, money, amount,
  ingredientAmount, offerSize, isLoose, halalas
} from './lib/plan.js';

const CONFIG = {
  name: 'مقاضي',
  minPersons: 1,
  maxPersons: 12,
  dealsPage: 40,
  /* Subscription. Off until a payment provider is connected: with
     `enabled: false` every meal is open. `?plus=preview` shows how the
     locked state will look without charging anyone. */
  plus: { enabled: false, freeMeals: 2, priceLabel: null, checkoutUrl: null }
};

const AISLES = [
  { id: 'produce', name: 'خضار وفواكه', categories: ['produce_veg', 'produce_fruit'] },
  { id: 'butcher', name: 'لحوم ودجاج وأسماك', categories: ['meat', 'poultry', 'fish'] },
  { id: 'dairy', name: 'ألبان وبيض', categories: ['eggs', 'dairy_milk', 'dairy_cheese', 'dairy_yogurt_labneh', 'butter_cream'] },
  { id: 'bakery', name: 'مخبوزات', categories: ['bakery'] },
  { id: 'frozen', name: 'مجمدات', categories: ['frozen_chicken', 'frozen_veg', 'frozen_other'] },
  { id: 'pantry', name: 'مؤونة', categories: ['rice_grains', 'pasta_noodles', 'flour_baking', 'oil_ghee', 'canned', 'sauces_condiments', 'spices', 'legumes_nuts', 'breakfast_spreads', 'dates_sweets', 'snacks'] },
  { id: 'drinks', name: 'مشروبات', categories: ['drinks_water', 'drinks_juice', 'tea_coffee'] },
  { id: 'other', name: 'أخرى', categories: ['household', 'other'] }
];
const aisleOf = category => AISLES.find(aisle => aisle.categories.includes(category)) || AISLES[AISLES.length - 1];

const CATEGORY_NAMES = {
  produce_veg: 'خضار', produce_fruit: 'فواكه', meat: 'لحوم', poultry: 'دجاج', fish: 'أسماك', eggs: 'بيض',
  dairy_milk: 'حليب', dairy_cheese: 'أجبان', dairy_yogurt_labneh: 'لبن ولبنة', butter_cream: 'زبدة وقشطة',
  bakery: 'مخبوزات', rice_grains: 'أرز وحبوب', pasta_noodles: 'مكرونة', flour_baking: 'طحين وسكر',
  oil_ghee: 'زيوت وسمن', canned: 'معلبات', sauces_condiments: 'صلصات', spices: 'بهارات',
  legumes_nuts: 'بقوليات ومكسرات', frozen_chicken: 'دجاج مجمد', frozen_veg: 'خضار مجمدة', frozen_other: 'مجمدات',
  breakfast_spreads: 'فطور', drinks_water: 'مياه', drinks_juice: 'عصائر', tea_coffee: 'شاي وقهوة',
  dates_sweets: 'تمور وحلويات', snacks: 'سناكات', household: 'منزلية', other: 'أخرى'
};

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

function parseRoute() {
  const parts = window.location.hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  const tab = ['plan', 'list', 'deals', 'me', 'meal'].includes(parts[0]) ? parts[0] : 'plan';
  return { tab, id: parts[1] || null };
}

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const plusPreview = () => new URLSearchParams(window.location.search).get('plus') === 'preview';

/* ---------------------------------------------------------------------
   Small pieces
   ------------------------------------------------------------------- */
const ICONS = {
  plan: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM8.5 14l2.3 2.3 4.7-4.6',
  list: 'M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01',
  deals: 'M3 12.6V4a1 1 0 0 1 1-1h8.6a1 1 0 0 1 .7.3l7.4 7.4a1 1 0 0 1 0 1.4l-8.6 8.6a1 1 0 0 1-1.4 0L3.3 13.3a1 1 0 0 1-.3-.7ZM8 8h.01',
  me: 'M4 20c.7-3.4 3.9-5.5 8-5.5s7.300 2.100 8 5.5M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  back: 'M9 5l7 7-7 7',
  share: 'M12 15V4M8 8l4-4 4 4M5 13v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1Z',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  check: 'M5 12.5l4.5 4.5L19 7.5'
};
const Icon = ({ name, size = 22 }) => html`
  <svg class="icon" width=${size} height=${size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <path d=${ICONS[name]} />
  </svg>`;

/* 287.45 → big "287" with a small ".45" */
function Sum({ value }) {
  const [whole, cents] = money(value).split('.');
  return html`<span class="sum" dir="ltr"><span class="sum__whole">${whole}</span>${cents ? html`<span class="sum__cents">.${cents}</span>` : null}</span>`;
}

function Stepper({ value, min, max, step = 1, label, onChange, format }) {
  return html`
    <div class="stepper" role="group" aria-label=${label}>
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

/* ---------------------------------------------------------------------
   Plan
   ------------------------------------------------------------------- */
function PlanTab({ data, plan, persons, week, list, offers, locked, set }) {
  const cooked = plan.meals.filter(meal => !week.skipped.includes(meal.id) && !locked.has(meal.id)).length;
  return html`
    <section class="hero" aria-label="ملخص الأسبوع">
      <p class="hero__label">سفرة هذا الأسبوع</p>
      <div class="hero__figures">
        <div class="figure">
          <p class="figure__value"><${Sum} value=${list.totals.cost} /><span class="figure__unit">ريال</span></p>
          <p class="figure__caption">تكلفة أصناف العروض</p>
        </div>
        <div class="figure figure--save">
          <p class="figure__value"><${Sum} value=${list.totals.saved} /><span class="figure__unit">ريال</span></p>
          <p class="figure__caption">توفيرك عن السعر قبل العرض</p>
        </div>
      </div>
      <div class="hero__row">
        <span class="hero__family">عدد أفراد الأسرة</span>
        <${Stepper} value=${persons} min=${CONFIG.minPersons} max=${CONFIG.maxPersons} label="عدد أفراد الأسرة" onChange=${value => set.persons(value)} />
      </div>
    </section>

    <div class="segmented" role="tablist" aria-label="نوع السفرة">
      ${data.plans.plans.map(option => html`
        <button type="button" role="tab" class="segmented__item" aria-selected=${option.id === plan.id} onClick=${() => set.plan(option.id)}>${option.name}</button>`)}
    </div>
    <p class="plan-tagline">${plan.tagline}</p>

    <ol class="meals">
      ${plan.meals.map((meal, index) => {
        const off = week.skipped.includes(meal.id);
        const isLocked = locked.has(meal.id);
        const best = mealHighlight(meal, offers);
        return html`
          <li class=${'meal' + (off ? ' is-off' : '') + (isLocked ? ' is-locked' : '')}>
            <a class="meal__main" href=${isLocked ? '#/me' : '#/meal/' + meal.id}>
              <span class=${'meal__tile tile-' + (index % 6)} aria-hidden="true">${meal.emoji}</span>
              <span class="meal__body">
                <span class="meal__day">اليوم ${index + 1}</span>
                <span class="meal__name">${meal.name}</span>
                ${isLocked
                  ? html`<span class="meal__meta"><${Icon} name="lock" size=${14} /> مع مقاضي بلس</span>`
                  : html`<span class="meal__meta"><${Icon} name="clock" size=${14} /> ${meal.minutes} دقيقة${best ? html` · <span class="meal__deal">${best.name} <b dir="ltr">${money(halalas(best.price))}</b> بدل <s dir="ltr">${money(halalas(best.was))}</s></span>` : null}</span>`}
              </span>
            </a>
            ${isLocked ? null : html`
              <button type="button" class="meal__toggle" aria-pressed=${!off} aria-label=${(off ? 'إضافة ' : 'استبعاد ') + meal.name} onClick=${() => set.toggleMeal(meal.id)}>
                <${Icon} name="check" size=${18} />
              </button>`}
          </li>`;
      })}
    </ol>

    ${plan.essentials ? html`
      <label class="essentials">
        <input type="checkbox" checked=${week.essentials} onChange=${event => set.essentials(event.target.checked)} />
        <span class="essentials__body">
          <span class="essentials__name">${plan.essentials.name}</span>
          <span class="essentials__text">${plan.essentials.items.map(item => item.name).join('، ')}</span>
        </span>
      </label>` : null}

    <a class="cta" href="#/list">
      <span>قائمة المقاضي · ${cooked} طبخات</span>
      <span class="cta__count">${list.totals.items} صنف</span>
    </a>
    <p class="fineprint">الأسعار من مجلات العروض الرسمية المنشورة، وقد تختلف حسب الفرع وتوفّر الكمية. التوفير محسوب فقط للأصناف التي طُبع لها سعر قبل العرض.</p>`;
}

/* ---------------------------------------------------------------------
   One meal
   ------------------------------------------------------------------- */
function MealPage({ data, plan, meal, persons, offers }) {
  const scale = persons / plan.base_persons;
  return html`
    <article class="recipe">
      <a class="back" href="#/plan"><${Icon} name="back" size=${18} /> الخطة</a>
      <header class="recipe__head">
        <span class="recipe__tile" aria-hidden="true">${meal.emoji}</span>
        <h1 class="recipe__name">${meal.name}</h1>
        <p class="recipe__summary">${meal.summary}</p>
        <p class="recipe__meta"><${Icon} name="clock" size=${15} /> ${meal.minutes} دقيقة · تكفي ${persons} أشخاص</p>
      </header>

      <h2 class="section-title">المكونات</h2>
      <ul class="ingredients">
        ${meal.ingredients.map(ingredient => {
          const offer = ingredient.offer ? offers.get(ingredient.offer) : null;
          return html`
            <li class="ingredient">
              <span class="ingredient__name">${ingredient.name}${ingredient.pantry ? html`<small> من مطبخك</small>` : null}</span>
              <span class="ingredient__qty">${ingredientAmount(ingredient, scale)}</span>
              ${offer ? html`<span class="ingredient__offer">عرض ${storeName(data, offer.store)}: ${offer.name} ${offerSize(offer)} <${OfferPrice} offer=${offer} /></span>` : null}
            </li>`;
        })}
      </ul>

      <h2 class="section-title">الطريقة</h2>
      <ol class="steps">
        ${meal.steps.map(step => html`<li>${step}</li>`)}
      </ol>
      ${meal.tip ? html`<p class="tip">${meal.tip}</p>` : null}
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

function shareText(data, list, validTo) {
  const rows = [];
  rows.push(`🛒 مقاضي الأسبوع — عروض سارية حتى ${shortDay(validTo)}`);
  AISLES.forEach(aisle => {
    const lines = list.lines.filter(line => aisleOf(line.offer.category) === aisle);
    if (!lines.length) return;
    rows.push('', aisle.name + ':');
    lines.forEach(line => rows.push(`▫️ ${line.offer.name}${offerSize(line.offer) ? ' ' + offerSize(line.offer) : ''} — ${lineDetail(line)} = ${money(line.cost)} (${storeName(data, line.offer.store)})`));
  });
  if (list.unpriced.length) {
    rows.push('', 'بدون عرض هذا الأسبوع:');
    list.unpriced.forEach(item => rows.push(`▫️ ${item.name}${item.need ? ' — ' + amount(item.need) : ''}`));
  }
  rows.push('', `الإجمالي من العروض: ${money(list.totals.cost)} ريال`);
  if (list.totals.saved) rows.push(`التوفير عن السعر قبل العرض: ${money(list.totals.saved)} ريال`);
  return rows.join('\n');
}

function ListTab({ data, list, week, set, validTo }) {
  const done = key => week.checked.includes(key);
  const total = list.lines.length + list.unpriced.length;
  const ticked = list.lines.filter(line => done(line.key)).length + list.unpriced.filter(item => done('u:' + item.name)).length;
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const text = shareText(data, list, validTo);
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

  if (!total) {
    return html`
      <div class="empty">
        <p class="empty__title">القائمة فارغة</p>
        <p>يلزم اختيار طبخة واحدة على الأقل من الخطة، أو إضافة أصناف من العروض.</p>
        <a class="btn" href="#/plan">العودة إلى الخطة</a>
      </div>`;
  }

  return html`
    <header class="list-head">
      <div>
        <h1 class="page-title">قائمة المقاضي</h1>
        <p class="page-sub">تم ${ticked} من ${total} · عروض سارية حتى ${shortDay(validTo)}</p>
      </div>
      <button type="button" class="btn btn--ghost" onClick=${share}><${Icon} name="share" size=${18} /> ${copied ? 'تم النسخ' : 'مشاركة'}</button>
    </header>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax=${total} aria-valuenow=${ticked} aria-label="ما تم شراؤه"><span style=${'width:' + (total ? ticked / total * 100 : 0) + '%'}></span></div>

    ${AISLES.map(aisle => {
      const lines = list.lines.filter(line => aisleOf(line.offer.category) === aisle);
      if (!lines.length) return null;
      return html`
        <section class="aisle">
          <h2 class="aisle__name">${aisle.name}</h2>
          <ul class="lines">
            ${lines.map(line => html`
              <li class=${'line' + (done(line.key) ? ' is-done' : '')}>
                <label class="line__check">
                  <input type="checkbox" checked=${done(line.key)} onChange=${() => set.toggleChecked(line.key)} />
                  <span class="line__body">
                    <span class="line__name">${line.offer.name} <small dir="ltr">${offerSize(line.offer)}</small></span>
                    <span class="line__sub">${lineDetail(line)} · ${storeName(data, line.offer.store)}${line.need ? ' · يلزمك ' + amount(line.need) : ''}</span>
                    <span class="line__tags">
                      ${line.saved ? html`<span class="badge badge--save">وفّرت <b dir="ltr">${money(line.saved)}</b></span>` : null}
                      ${line.keeps ? html`<span class="badge">يكفي لأكثر من أسبوع</span>` : null}
                      ${line.offer.promo ? html`<span class="badge badge--cut" dir="ltr">${line.offer.promo}</span>` : null}
                      ${line.offer.note ? html`<span class="badge badge--note">${NOTES[line.offer.note] || line.offer.note}</span>` : null}
                      ${line.extra ? html`<button type="button" class="link" onClick=${() => set.extra(line.offer.id, 0)}>إزالة</button>` : null}
                    </span>
                  </span>
                </label>
                <span class="line__cost" dir="ltr">${money(line.cost)}</span>
              </li>`)}
          </ul>
        </section>`;
    })}

    ${list.unpriced.length ? html`
      <section class="aisle">
        <h2 class="aisle__name">بدون عرض هذا الأسبوع</h2>
        <p class="aisle__note">لم يرد لها عرض في المجلة، فهي خارج الإجمالي.</p>
        <ul class="lines">
          ${list.unpriced.map(item => html`
            <li class=${'line' + (done('u:' + item.name) ? ' is-done' : '')}>
              <label class="line__check">
                <input type="checkbox" checked=${done('u:' + item.name)} onChange=${() => set.toggleChecked('u:' + item.name)} />
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
        <summary>من مطبخك (${list.pantry.length})</summary>
        <p>${list.pantry.map(item => item.name).join('، ')}</p>
      </details>` : null}

    <div class="total-bar" role="status">
      <div>
        <span class="total-bar__label">الإجمالي من العروض</span>
        <span class="total-bar__value"><${Sum} value=${list.totals.cost} /> ريال</span>
      </div>
      ${list.totals.saved ? html`<span class="total-bar__saved">وفّرت <b dir="ltr">${money(list.totals.saved)}</b> ريال</span>` : null}
    </div>`;
}

/* ---------------------------------------------------------------------
   Deals
   ------------------------------------------------------------------- */
function DealsTab({ data, week, set }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [shown, setShown] = useState(CONFIG.dealsPage);

  const categories = useMemo(() => {
    const counts = {};
    data.offers.offers.forEach(offer => { counts[offer.category] = (counts[offer.category] || 0) + 1; });
    return Object.keys(CATEGORY_NAMES).filter(id => counts[id]);
  }, [data]);

  const results = useMemo(() => data.offers.offers
    .filter(offer => (category === 'all' || offer.category === category) && matches(offer, query))
    .sort((a, b) => discountPercent(b) - discountPercent(a) || a.price - b.price),
  [data, query, category]);

  useEffect(() => setShown(CONFIG.dealsPage), [query, category]);

  return html`
    <h1 class="page-title">عروض الأسبوع</h1>
    <p class="page-sub">${data.offers.offers.length} عرض · مرتّبة من الأعلى خصماً</p>
    <input class="search" type="search" inputmode="search" placeholder="بحث: دجاج، أرز، جبنة…" aria-label="بحث في العروض" value=${query} onInput=${event => setQuery(event.target.value)} />
    <div class="chips" role="group" aria-label="القسم">
      <button type="button" class="chip" aria-pressed=${category === 'all'} onClick=${() => setCategory('all')}>الكل</button>
      ${categories.map(id => html`<button type="button" class="chip" aria-pressed=${category === id} onClick=${() => setCategory(id)}>${CATEGORY_NAMES[id]}</button>`)}
    </div>

    ${results.length ? html`
      <ul class="deals">
        ${results.slice(0, shown).map(offer => {
          const per = unitPrice(offer);
          const units = week.extras[offer.id] || 0;
          const step = isLoose(offer) ? 0.5 : 1;
          return html`
            <li class="deal">
              <div class="deal__body">
                <span class="deal__name">${offer.name}</span>
                <span class="deal__sub">${[offerSize(offer), SOLD_BY[offer.sold_by], storeName(data, offer.store), offer.note ? (NOTES[offer.note] || offer.note) : null].filter(Boolean).join(' · ')}</span>
                ${per ? html`<span class="deal__per"><span dir="ltr">${per.value.toFixed(2)}</span> ريال ${per.per === 'kg' ? 'للكيلو' : 'لليتر'}</span>` : null}
              </div>
              <div class="deal__side">
                <${OfferPrice} offer=${offer} />
                ${units
                  ? html`<${Stepper} value=${units} min=${0} max=${20} step=${step} label=${'الكمية من ' + offer.name} onChange=${value => set.extra(offer.id, value)} />`
                  : html`<button type="button" class="btn btn--small" onClick=${() => set.extra(offer.id, step)}>إضافة للقائمة</button>`}
              </div>
            </li>`;
        })}
      </ul>
      ${results.length > shown ? html`<button type="button" class="btn btn--ghost btn--wide" onClick=${() => setShown(shown + CONFIG.dealsPage)}>عرض المزيد (${results.length - shown})</button>` : null}`
    : html`<div class="empty"><p class="empty__title">لا توجد عروض مطابقة</p><p>يمكن تجربة كلمة أخرى أو قسم آخر.</p></div>`}`;
}

/* ---------------------------------------------------------------------
   Settings and about
   ------------------------------------------------------------------- */
function MeTab({ data, plan, persons, set, plusOn }) {
  const stores = Object.keys(data.offers.stores).map(id => data.offers.stores[id]);
  return html`
    <h1 class="page-title">الإعدادات</h1>

    <section class="card">
      <div class="row">
        <span>عدد أفراد الأسرة</span>
        <${Stepper} value=${persons} min=${CONFIG.minPersons} max=${CONFIG.maxPersons} label="عدد أفراد الأسرة" onChange=${value => set.persons(value)} />
      </div>
      <div class="row">
        <label for="plan-select">نوع السفرة</label>
        <select id="plan-select" value=${plan.id} onChange=${event => set.plan(event.target.value)}>
          ${data.plans.plans.map(option => html`<option value=${option.id}>${option.name}</option>`)}
        </select>
      </div>
    </section>

    <section class="card plus">
      <p class="plus__label">مقاضي بلس ${plusOn ? html`<span class="badge">معاينة</span>` : html`<span class="badge">قريباً</span>`}</p>
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
      ${stores.map(store => html`
        <p class="source">
          <b>${store.name}</b> — ${store.source}، سارية من ${longDay(store.valid_from)} إلى ${longDay(store.valid_to)}.
          ${store.source_url ? html` <a href=${store.source_url} target="_blank" rel="noopener noreferrer">المصدر</a>` : null}
        </p>`)}
      <p class="fineprint">الأسعار منقولة من مجلات العروض الرسمية المنشورة، وقد تختلف حسب الفرع وتوفّر الكمية، لذا يُنصح بمراجعة السعر على الرف قبل الشراء. التطبيق مستقل وغير تابع لأي متجر.</p>
    </section>

    <section class="card">
      <h2 class="card__title">بياناتك</h2>
      <p class="fineprint">اختياراتك محفوظة على هذا الجهاز فقط، ولا تُرسل إلى أي خادم.</p>
      <button type="button" class="btn btn--ghost" onClick=${() => set.reset()}>مسح اختياراتي من هذا الجهاز</button>
    </section>`;
}

/* ---------------------------------------------------------------------
   Shell
   ------------------------------------------------------------------- */
const TABS = [
  { id: 'plan', label: 'الخطة' },
  { id: 'list', label: 'المقاضي' },
  { id: 'deals', label: 'العروض' },
  { id: 'me', label: 'الإعدادات' }
];

function App() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);
  const [prefs, setPrefs] = useState(readPrefs);
  const [route, setRoute] = useState(parseRoute);

  const load = useCallback(() => {
    setFailed(false);
    loadData().then(setData).catch(() => setFailed(true));
  }, []);
  useEffect(load, [load]);
  useEffect(() => {
    const onHash = () => { setRoute(parseRoute()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const patch = useCallback(change => setPrefs(previous => {
    const next = Object.assign({}, previous, typeof change === 'function' ? change(previous) : change);
    writePrefs(next);
    return next;
  }), []);

  const offers = useMemo(() => new Map(data ? data.offers.offers.map(offer => [offer.id, offer]) : []), [data]);

  if (failed) {
    return html`
      <div class="boot">
        <span class="boot__mark" aria-hidden="true">${CONFIG.name}</span>
        <span class="boot__text">تعذّر تحميل عروض الأسبوع. يُرجى التحقق من الاتصال ثم إعادة المحاولة.</span>
        <button type="button" class="btn" onClick=${load}>إعادة المحاولة</button>
      </div>`;
  }
  if (!data) {
    return html`<div class="boot" role="status"><span class="boot__mark" aria-hidden="true">${CONFIG.name}</span><span class="boot__text">جاري تحميل عروض الأسبوع…</span></div>`;
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
  const plan = data.plans.plans.find(option => option.id === prefs.plan) || data.plans.plans[0];
  const persons = clamp(prefs.persons || plan.base_persons, CONFIG.minPersons, CONFIG.maxPersons);
  const plusOn = CONFIG.plus.enabled || plusPreview();
  const locked = new Set(plusOn ? plan.meals.slice(CONFIG.plus.freeMeals).map(meal => meal.id) : []);
  const skipped = new Set(week.skipped.concat(Array.from(locked)));
  const list = buildList({ plan, offers, persons, skipped, essentials: week.essentials, extras: week.extras });

  const setWeek = change => patch(previous => {
    const base = previous.week && previous.week.id === weekId ? previous.week : { id: weekId };
    return { week: Object.assign({}, base, change(Object.assign({ skipped: [], checked: [], extras: {} }, base))) };
  });
  const toggleIn = (array, value) => (array.includes(value) ? array.filter(item => item !== value) : array.concat(value));
  const set = {
    persons: value => patch({ persons: value }),
    plan: id => patch({ plan: id }),
    essentials: on => setWeek(() => ({ essentials: on })),
    toggleMeal: id => setWeek(current => ({ skipped: toggleIn(current.skipped, id) })),
    toggleChecked: key => setWeek(current => ({ checked: toggleIn(current.checked, key) })),
    extra: (id, units) => setWeek(current => {
      const extras = Object.assign({}, current.extras);
      if (units > 0) extras[id] = units; else delete extras[id];
      return { extras };
    }),
    reset: () => { try { localStorage.removeItem(STORAGE_KEY); } catch (error) { /* nothing stored */ } setPrefs({}); }
  };

  const validTo = Object.keys(data.offers.stores).map(id => data.offers.stores[id].valid_to).sort()[0];
  const expired = riyadhToday() > validTo;
  const meal = route.tab === 'meal' ? plan.meals.find(item => item.id === route.id && !locked.has(item.id)) : null;
  const tab = route.tab === 'meal' ? 'plan' : route.tab;

  return html`
    <div class="shell">
      <header class="topbar">
        <a class="wordmark" href="#/plan">${CONFIG.name}</a>
        <span class=${'validity' + (expired ? ' is-expired' : '')}>${expired ? 'انتهت عروض هذا الأسبوع' : 'الرياض · حتى ' + shortDay(validTo)}</span>
      </header>

      ${expired ? html`<p class="notice" role="alert">انتهت مدة هذه العروض يوم ${longDay(validTo)}. الأسعار المعروضة قد لا تكون سارية؛ الخطة الجديدة تُنشر مع مجلة الأسبوع القادم.</p>` : null}

      <main class="main" id="main">
        ${meal ? html`<${MealPage} data=${data} plan=${plan} meal=${meal} persons=${persons} offers=${offers} />`
          : tab === 'list' ? html`<${ListTab} data=${data} list=${list} week=${week} set=${set} validTo=${validTo} />`
          : tab === 'deals' ? html`<${DealsTab} data=${data} week=${week} set=${set} />`
          : tab === 'me' ? html`<${MeTab} data=${data} plan=${plan} persons=${persons} set=${set} plusOn=${plusOn} />`
          : html`<${PlanTab} data=${data} plan=${plan} persons=${persons} week=${week} list=${list} offers=${offers} locked=${locked} set=${set} />`}
      </main>

      <nav class="tabbar" aria-label="الأقسام">
        ${TABS.map(item => html`
          <a class="tabbar__item" href=${'#/' + item.id} aria-current=${tab === item.id ? 'page' : null}>
            <${Icon} name=${item.id} />
            <span>${item.label}</span>
            ${item.id === 'list' && list.totals.items ? html`<span class="tabbar__count">${list.totals.items}</span>` : null}
          </a>`)}
      </nav>
    </div>`;
}

const root = document.getElementById('app');
root.textContent = '';
render(html`<${App} />`, root);

if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ }); });
}
