/* Run with: node scripts/check-yield-tracker.cjs
   Fixed-date regressions use the checked-in public dataset; fixtures never alter it. */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const M = require('../public/yield-tracker/tracker-math.js');
const data = require('../public/yield-tracker/yields.json');
const { rows, rules } = data;
const today = '2026-11-10';
const fx = rules.fx.usdphp;
let checks = 0;
function check(name, run) {
  try { run(); checks++; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); throw error; }
}
const near = (actual, expected, label = '') => {
  assert.ok(Number.isFinite(actual), `${label}: expected a finite number, got ${actual}`);
  assert.ok(Math.abs(actual - expected) < 1e-8, `${label}: ${actual} != ${expected}`);
};
const row = id => {
  const found = rows.find(r => r.id === id);
  assert.ok(found, `Dataset fixture missing: ${id}`);
  return found;
};
const own = row('ownbank-own-it-savings');
const mp2 = row('pag-ibig-fund-mp2-savings-2025-dividend');
const php = 100000;

check('best plain savings is computed from the dataset, not the up-to/minimum headline', () => {
  assert.equal(M.bestPlain(rows, today).id, own.id);
  near(own.rate, 3.8);
  near(own.rate * (1 - rules.tax.ratePeso / 100), 3.04);
  const landbank = row('landbank-optisaver-plus-php-500-000-and-up');
  assert.ok(landbank.upTo && landbank.minDeposit > 0);
  assert.notEqual(M.bestPlain([own, landbank], today).id, landbank.id);
});

check('best plain rejects each catch independently and handles missing data', () => {
  // Higher-rate synthetic candidates exercise eligibility rather than current ranking accidents.
  const blocked = [
    { upTo: true }, { minDeposit: 1 }, { strings: true },
    { tiers: [[null, own.rate + 1]] }, { lockup: '180 days' },
    { kind: 'promo' }, { vipOnly: true }, { teaser: true },
    { verified: false }, { rate: null }, { currency: 'USD' },
    { category: 'government', taxExempt: true }
  ];
  for (const [index, fields] of blocked.entries()) {
    const candidate = { ...own, id: `synthetic-catch-${index}`, rate: own.rate + 1, ...fields };
    assert.equal(M.bestPlain([candidate, own], today).id, own.id, JSON.stringify(fields));
  }
  assert.equal(M.bestPlain([], today), null);
});

check('Asia/Manila changes day at 16:00 UTC, including the promo boundary', () => {
  assert.equal(M.manilaDate(new Date('2026-11-08T15:59:59Z')), '2026-11-08');
  assert.equal(M.manilaDate(new Date('2026-11-08T16:00:00Z')), '2026-11-09');
  assert.equal(M.manilaDate(new Date('2026-11-09T16:00:00Z')), today);
  const bitget = row('bitget-simple-earn-flexible-usdt-promo');
  assert.equal(M.ended(bitget, M.manilaDate(new Date('2026-11-08T15:59:59Z'))), false);
  assert.equal(M.ended(bitget, M.manilaDate(new Date('2026-11-08T16:00:00Z'))), true);
  assert.equal(M.rankable(bitget, today), false);
  assert.equal(M.daysBetween('2026-11-08', '2026-11-09'), 1);
  assert.equal(M.daysBetween('2028-02-28', '2028-03-01'), 2);
});

check('dated peso promo weights exactly the remaining days, then reverts', () => {
  const maya = row('maya-bank-maya-savings-boosted-nov-2026-promo');
  const remaining = 20; // Nov 10 to Nov 30; source convention treats Nov 30 as ended.
  const expected = (maya.rate * remaining + maya.rateAfterPromo * (365 - remaining)) / 365;
  near(M.yearRate(maya, php, 0, rows, today, fx), expected);
  near(M.yearRate(maya, php, 0, rows, maya.promoEnds, fx), maya.rateAfterPromo);
  for (let year = 1; year < 10; year++) {
    near(M.yearRate(maya, php, year, rows, today, fx), maya.rateAfterPromo);
  }
});

check('OKX 180-day bonuses stop within year one and use base in years 2–10', () => {
  for (const currency of ['usdt', 'usdc']) {
    const promo = row(`okx-simple-earn-${currency}-flexible-new-user-bonus`);
    const base = row(`okx-simple-earn-${currency}-flexible`);
    const amount = M.toPesos(promo.cap, 'USD', fx);
    assert.equal(M.baseProduct(promo, rows).id, base.id);
    const expected = (promo.rate * promo.promoDays + base.rate * (365 - promo.promoDays)) / 365;
    near(M.yearRate(promo, amount, 0, rows, today, fx), expected);
    for (let year = 1; year < 10; year++) {
      near(M.yearRate(promo, amount, year, rows, today, fx), base.rate, `${currency} year ${year + 1}`);
    }
  }
});

check('Bybit unknown-duration boost lasts year one, with no boosted cap in years 2–10', () => {
  for (const currency of ['usdt', 'usdc']) {
    const promo = row(`bybit-easy-earn-${currency}-flexible-first-100-${currency}-boost`);
    const base = row(`bybit-easy-earn-${currency}-flexible`);
    const amount = M.toPesos(promo.cap * 2, 'USD', fx);
    assert.equal(M.baseProduct(promo, rows).id, base.id);
    near(M.yearRate(promo, amount, 0, rows, today, fx), (promo.rate + promo.rateAfterCap) / 2);
    for (let year = 1; year < 10; year++) {
      near(M.yearRate(promo, amount, year, rows, today, fx), base.rate, `${currency} year ${year + 1}`);
    }
  }
});

check('MEXC boosted tiers and caps are removed when the base starts in year two', () => {
  const ids = ['mexc-savings-flexible-usdt-boost-product-1', 'mexc-savings-flexible-usdt-boost-product-2', 'mexc-savings-flexible-usdc'];
  for (const id of ids) {
    const promo = row(id);
    const base = row(`mexc-savings-flexible-${promo.currency.toLowerCase()}-base`);
    const amount = M.toPesos(2000, 'USD', fx);
    assert.equal(M.baseProduct(promo, rows).id, base.id);
    assert.ok(M.yearRate(promo, amount, 0, rows, today, fx) > base.rate);
    for (let year = 1; year < 10; year++) {
      near(M.yearRate(promo, amount, year, rows, today, fx), base.rate, `${id} year ${year + 1}`);
    }
    const first = M.yearRate(promo, amount, 0, rows, today, fx);
    const projected = M.project(promo, amount, 10, rows, today, rules);
    near(projected.balance, amount * (1 + first / 100) * Math.pow(1 + base.rate / 100, 9));
  }
});

check('unpublished post-promo rates remain unknown, including expired Bitget', () => {
  for (const currency of ['usdt', 'usdc']) {
    const promo = row(`bitget-simple-earn-flexible-${currency}-promo`);
    const standard = row(`bitget-simple-earn-flexible-${currency}-standard`);
    assert.equal(standard.rate, null);
    assert.equal(M.baseProduct(promo, rows), null);
    assert.equal(M.yearRate(promo, php, 0, rows, today, fx), null);
    assert.equal(M.project(promo, php, 10, rows, today, rules), null);
  }
  const unknown = { ...row('bybit-easy-earn-usdt-flexible-first-100-usdt-boost'), provider: 'Synthetic missing base' };
  assert.equal(M.baseProduct(unknown, rows), null);
  assert.ok(M.yearRate(unknown, php, 0, rows, today, fx) > 0);
  assert.equal(M.yearRate(unknown, php, 1, rows, today, fx), null);
  assert.equal(M.project(unknown, php, 2, rows, today, rules), null);
  const missingExcess = { ...unknown, rateAfterCap: null };
  assert.equal(M.blended(missingExcess, M.toPesos(200, 'USD', fx), fx), null);
});

check('PHP/USD use the supplied BSP rate and preserve equivalent caps and earnings', () => {
  assert.ok(fx > 50 && fx < 80, "BSP USD/PHP rate looks wrong: " + fx); // value comes from data/yields/fx.json
  near(M.toPesos(1000, 'USD', fx), 1000 * fx);
  near(M.fromPesos(1000 * fx, 'USD', fx), 1000);
  near(M.toPesos(php, 'PHP', fx), php);
  near(M.fromPesos(php, 'PHP', fx), php);
  assert.equal(M.toPesos(1000, 'USD', null), null);
  assert.equal(M.fromPesos(1000, 'USD', null), null);
  const promo = row('bybit-easy-earn-usdt-flexible-first-100-usdt-boost');
  const phpAmount = M.toPesos(200, 'USD', fx);
  near(M.units(promo, phpAmount, fx), 200);
  near(M.blended(promo, phpAmount, fx), (promo.rate + promo.rateAfterCap) / 2);
  const projection = M.project(promo, phpAmount, 1, rows, today, rules);
  near(M.fromPesos(projection.net, 'USD', fx), 200 * ((promo.rate + promo.rateAfterCap) / 2) / 100);
  near(M.units(own, M.toPesos(1000, 'USD', fx), fx), 1000 * fx);
  near(M.blended(own, M.toPesos(1000, 'USD', fx), fx), own.rate);
});

check('published peso tiers and cap-excess rates retain their weighted blending', () => {
  const goals = row('maya-bank-personal-goals-tiered');
  near(M.blended(goals, php, fx), (4 + 4.5 + 5 + 6.5 + 8) / 5);
  near(M.blended(goals, php * 2, fx), (4 + 4.5 + 5 + 6.5 + 8) / 10);
  near(M.blended(goals, 10000, fx), goals.tiers[0][1]);
});

check('20% peso tax and inflation show the correct OwnBank one-year ledger', () => {
  const result = M.project(own, php, 1, rows, today, rules);
  near(result.gross, 3800);
  near(result.tax, 760);
  near(result.net, 3040);
  near(result.balance, 103040);
  near(result.realGain, -4415.584415584424);
  near(result.inflationLoss, 7455.584415584424);
  near(M.project(own, php, 1, rows, today, rules, false).tax, 0);
});

check('MP2 remains tax-free and crypto is not assigned PH CPI or peso bank tax', () => {
  assert.equal(mp2.taxExempt, true);
  const result = M.project(mp2, php, 1, rows, today, rules);
  near(result.tax, 0);
  near(result.net, php * mp2.rate / 100);
  const crypto = M.project(row('okx-simple-earn-usdt-flexible'), php, 1, rows, today, rules);
  near(crypto.tax, 0);
  assert.equal(crypto.realBalance, null);
  assert.equal(crypto.realGain, null);
});

console.log(`\n${checks} regression groups passed against ${path.basename(require.resolve('../public/yield-tracker/yields.json'))} (${rows.length} rows).`);
