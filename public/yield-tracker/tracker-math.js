/* Pure calculations shared by the tracker and its regression checks.
   Rates, tax, inflation and FX are supplied by yields.json, never by this module. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.YieldMath = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DAY = 864e5;
  const isPeso = r => ['traditional', 'digital', 'ewallet', 'government'].includes(r.category) && r.currency === 'PHP';
  const locked = r => !!r.lockup && !/^flexible/i.test(r.lockup);
  const manilaDate = (now = new Date()) => new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(now);
  const daysBetween = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);
  // Existing source convention: the published end date is the first ended day.
  const ended = (r, today) => r.kind === 'promo' && !!r.promoEnds && r.promoEnds <= today;
  const rankable = (r, today) => r.rate != null && r.verified !== false && !r.teaser && !r.vipOnly && !ended(r, today);
  function bestPlain(rows, today) {
    return rows.filter(r => rankable(r, today) && isPeso(r) && r.category !== 'government' &&
      r.kind === 'standard' && !r.strings && !r.upTo && !r.tiers && !(r.minDeposit > 0) && !locked(r))
      .sort((a, b) => b.rate - a.rate)[0] || null;
  }
  const toPesos = (amount, currency, fx) => currency === 'USD' ? (fx > 0 ? amount * fx : null) : amount;
  const fromPesos = (amount, currency, fx) => amount == null ? null : currency === 'USD' ? (fx > 0 ? amount / fx : null) : amount;
  const units = (r, pesos, fx) => isPeso(r) ? pesos : (r.stablecoin || r.currency === 'USD') && fx > 0 ? pesos / fx : null; // stablecoins and PH bank dollar deposits
  function blended(r, pesos, fx) {
    if (r.rate == null) return null;
    const amount = units(r, pesos, fx);
    if (amount == null) return null;
    if (amount <= 0) return r.rate;
    if (r.tiers) {
      let left = amount, prev = 0, earn = 0;
      for (const [upTo, rate] of r.tiers) {
        const band = upTo == null ? left : Math.max(0, Math.min(left, upTo - prev));
        earn += band * rate; left -= band; prev = upTo;
        if (left <= 0) break;
      }
      return earn / amount;
    }
    if (r.cap != null && amount > r.cap) {
      // An unpublished excess rate is not a zero-interest rate.
      if (r.rateAfterCap == null) return null;
      return (r.cap * r.rate + (amount - r.cap) * r.rateAfterCap) / amount;
    }
    return r.rate;
  }
  function baseProduct(r, rows) {
    const bases = rows.filter(x => x.provider === r.provider && x.currency === r.currency &&
      x.kind === 'standard' && !locked(x) && !x.strings && !x.upTo && !x.tiers && !x.vipOnly && !x.teaser);
    const published = bases.filter(x => x.rate != null && x.verified !== false);
    // An explicit unpublished standard (e.g. Bitget) overrides an old promo's fallback.
    if (bases.length && !published.length) return null;
    if (r.rateAfterPromo != null) {
      const exact = published.find(x => x.rate === r.rateAfterPromo);
      return exact || { ...r, kind: 'standard', rate: r.rateAfterPromo, tiers: null, cap: null, rateAfterCap: null };
    }
    return published.length === 1 ? published[0] : null;
  }
  function yearRate(r, pesos, year, rows, today, fx) {
    if (r.kind !== 'promo') return blended(r, pesos, fx);
    const remaining = Math.max(0, Math.min(
      r.promoEnds ? daysBetween(today, r.promoEnds) : Infinity,
      r.promoDays || Infinity,
      // No confirmed duration: model the boost for year one only.
      r.promoEnds || r.promoDays ? Infinity : 365
    ) - year * 365);
    const promoDays = Math.min(365, remaining), base = baseProduct(r, rows);
    const regular = base ? blended(base, pesos, fx) : null;
    if (!promoDays) return regular;
    const promo = blended(r, pesos, fx);
    if (promo == null || (promoDays < 365 && regular == null)) return null;
    return promoDays === 365 ? promo : (promo * promoDays + regular * (365 - promoDays)) / 365;
  }
  function project(r, pesos, years, rows, today, rules, applyTax = true) {
    const fx = rules.fx && rules.fx.usdphp;
    const phBank = ['traditional', 'digital', 'ewallet', 'government'].includes(r.category); // PH final tax: peso and dollar deposits alike
    const tax = applyTax && phBank && !r.taxExempt ? rules.tax.ratePeso / 100 : 0;
    let grossBalance = pesos, balance = pesos, first = 0;
    for (let y = 0; y < years; y++) {
      const grossRate = yearRate(r, grossBalance, y, rows, today, fx);
      const rate = yearRate(r, balance, y, rows, today, fx);
      if (rate == null || grossRate == null) return null;
      const earn = balance * rate / 100 * (1 - tax);
      if (!y) first = earn;
      grossBalance *= 1 + grossRate / 100;
      balance += earn;
    }
    const gross = grossBalance - pesos, net = balance - pesos;
    const inflation = rules.inflation && rules.inflation.value;
    const realBalance = inflation == null || !isPeso(r) ? null : balance / Math.pow(1 + inflation / 100, years);
    return { balance, gross, tax: gross - net, net, first,
      realBalance, realGain: realBalance == null ? null : realBalance - pesos,
      inflationLoss: realBalance == null ? null : balance - realBalance };
  }
  return { manilaDate, daysBetween, ended, isPeso, locked, rankable, bestPlain, toPesos, fromPesos, units, blended, baseProduct, yearRate, project };
});
