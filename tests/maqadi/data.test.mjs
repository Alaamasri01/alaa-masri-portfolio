/*
 * Checks the data the app actually ships: every published week must be
 * internally consistent before it reaches a phone.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildList, packContent, isLoose } from '../../maqadi/lib/plan.js';
import { checkPlans } from '../../tools/maqadi/build-data.mjs';

const DATA = resolve(dirname(fileURLToPath(import.meta.url)), '../../maqadi/data');
const read = path => JSON.parse(readFileSync(join(DATA, path), 'utf8'));

const current = read('current.json');
const offersFile = read(current.offers);
const plansFile = read(current.plans);
const offers = offersFile.offers;
const byId = new Map(offers.map(offer => [offer.id, offer]));
const isDate = text => /^\d{4}-\d{2}-\d{2}$/.test(text) && !Number.isNaN(Date.parse(text));

test('current.json points at one week', () => {
  assert.match(current.week, /^\d{4}-W\d{2}$/);
  assert.equal(offersFile.week, current.week);
  assert.equal(plansFile.week, current.week);
});

test('every store names its source and a valid date range', () => {
  const ids = Object.keys(offersFile.stores);
  assert.ok(ids.length >= 1);
  ids.forEach(id => {
    const store = offersFile.stores[id];
    assert.ok(store.name && store.source, id + ' needs a name and a source');
    // A printed flyer has a validity period; an online listing has the date it was read.
    if (store.checked) assert.ok(isDate(store.checked), id + ' needs the date it was checked');
    else {
      assert.ok(isDate(store.valid_from) && isDate(store.valid_to), id + ' needs dates');
      assert.ok(store.valid_from <= store.valid_to, id + ' dates are reversed');
    }
    assert.equal(store.offers, offers.filter(offer => offer.store === id).length);
  });
});

test('every offer has a unique id, a name and a believable price', () => {
  assert.ok(offers.length >= 100, 'expected a full flyer, got ' + offers.length);
  assert.equal(byId.size, offers.length, 'duplicate offer ids');
  offers.forEach(offer => {
    assert.ok(offersFile.stores[offer.store], offer.id + ' belongs to an unknown store');
    assert.ok(offer.name && offer.name.length >= 2, offer.id + ' has no name');
    assert.ok(offer.price > 0 && offer.price < 5000, offer.id + ' price ' + offer.price);
    if (offer.was !== null) assert.ok(offer.was > offer.price, offer.id + ' old price must be above the offer price');
    if (offer.size_qty !== null) assert.ok(offer.size_qty > 0 && offer.size_unit, offer.id + ' size');
    assert.ok(offer.pack_count >= 1);
  });
});

test('the plans pass the same checks as the build', () => {
  assert.deepEqual(checkPlans(plansFile, offers), []);
  assert.ok(plansFile.plans.length >= 2);
});

test('every plan can be costed exactly for any family size', () => {
  plansFile.plans.forEach(plan => {
    for (let persons = 1; persons <= 12; persons++) {
      const list = buildList({ plan, offers: byId, persons });
      assert.ok(list.lines.length >= 8, plan.id + ' has too few offer items');
      list.lines.forEach(line => {
        assert.equal(line.approx, false, `${plan.id}: ${line.offer.id} could not be sized for ${persons}`);
        assert.ok(Number.isInteger(line.cost) && line.cost > 0, `${plan.id}: ${line.offer.id} cost`);
        assert.ok(Number.isInteger(line.saved) && line.saved >= 0);
        // What is bought always covers what the recipes need.
        if (line.bought && line.need) assert.ok(line.bought.qty >= line.need.qty - 1e-6, `${plan.id}: ${line.offer.id} buys less than needed`);
      });
      assert.equal(list.totals.cost, list.lines.reduce((sum, line) => sum + line.cost, 0));
      assert.equal(list.totals.saved, list.lines.reduce((sum, line) => sum + line.saved, 0));
    }
  });
});

test('a bigger family never pays less', () => {
  plansFile.plans.forEach(plan => {
    let previous = 0;
    for (let persons = 1; persons <= 12; persons++) {
      const cost = buildList({ plan, offers: byId, persons }).totals.cost;
      assert.ok(cost >= previous, `${plan.id}: ${persons} persons cost less than ${persons - 1}`);
      previous = cost;
    }
  });
});

test('offers used by the plans have a size the app can buy by', () => {
  plansFile.plans.forEach(plan => {
    const used = plan.meals.flatMap(meal => meal.ingredients).concat(plan.essentials ? plan.essentials.items : []).filter(item => item.offer);
    used.forEach(item => {
      const offer = byId.get(item.offer);
      assert.ok(isLoose(offer) || packContent(offer), `${plan.id}: ${item.offer} has no usable size`);
    });
  });
});

test('every swap a family can make can be costed too', () => {
  plansFile.plans.forEach(plan => {
    (plan.alternatives || []).forEach(meal => {
      const swapped = Object.assign({}, plan, { meals: [meal] });
      const list = buildList({ plan: swapped, offers: byId, persons: 4, essentials: false });
      list.lines.forEach(line => assert.equal(line.approx, false, `${plan.id} › ${meal.id}: ${line.offer.id}`));
      if (!meal.unavailable) assert.ok(list.lines.length > 0, `${plan.id} › ${meal.id} has nothing to buy`);
    });
  });
});
