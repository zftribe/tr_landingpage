/* TR Yield Tracker — reads yields.json (official sources, dated), adds live DeFi pools in Advanced view. */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TODAY = new Date(new Date().toISOString().slice(0, 10));
const DAY = 864e5;
const daysBetween = (a, b) => Math.round((b - a) / DAY);
const PH_CATS = ['traditional', 'digital', 'ewallet', 'government'];
const CAT_LABEL = { traditional: 'Banks', digital: 'Digital banks', ewallet: 'E-wallets', government: 'Government', cex: 'Crypto exchanges', dex: 'DeFi · Kamino + Jupiter (live)' };
const CAT_NOTE = {
  cex: 'Paid in the coin you deposit. Not a bank deposit and not PDIC-insured. Rates change often, sometimes daily. Rules differ by country: check with your local regulator (in the Philippines, the SEC) that an exchange is allowed where you live. Adults (18+) only.',
  dex: 'Kamino (its lending markets and curated vaults) and Jupiter Lend on Solana. USDT, USDC and USDG only, pools over $2M. Live from DefiLlama, so rates move every hour. Curated vaults are run by outside managers, not Kamino or us. Smart-contract risk: you could lose some or all of your money. No insurance and no support desk. Adults (18+) only.',
  government: 'Not a bank deposit and not PDIC-insured. The rate is last year’s dividend (7.12% for 2025), not a promise. Money is locked for 5 years. Tax-free.',
};
const ORDER = ['digital', 'ewallet', 'traditional', 'government', 'cex', 'dex'];
const LOGOS = { gcash: 'gcash', maribank: 'maribank', gotyme: 'gotyme', maya: 'maya', cimb: 'cimb', ownbank: 'ownbank', uniondigital: 'uniondigital', 'uno ': 'uno', tonik: 'tonik', ofbank: 'ofbank', 'overseas filipino': 'ofbank', netbank: 'netbank', komo: 'komo', diskartech: 'diskartech', bpi: 'bpi', metrobank: 'metrobank', rcbc: 'rcbc', 'security bank': 'securitybank', landbank: 'landbank', dbp: 'dbp', 'development bank': 'dbp', pnb: 'pnb', 'philippine national': 'pnb', psbank: 'psbank', bdo: 'bdo', eastwest: 'eastwest', unionbank: 'unionbank', aub: 'aub', 'asia united': 'aub', 'china bank': 'chinabank', 'pag-ibig': 'pagibig', okx: 'okx', bybit: 'bybit', bitget: 'bitget', mexc: 'mexc', gate: 'gate', kamino: 'kamino', jupiter: 'jupiter' };
// DeFi: Kamino (its lend markets and curated vaults) and Jupiter Lend on Solana, stablecoins only (George, 9 Nov).
const DEFI = { projects: { 'kamino-lend': ['Kamino', 'https://app.kamino.finance/'], 'jupiter-lend': ['Jupiter', 'https://jup.ag/lend'] }, symbols: ['USDT', 'USDC', 'USDG'], minTvl: 2e6 };

let DATA = null, ROWS = [];
const S = {
  view: 'basic', tax: true, real: false,
  f: { cat: 'all', kind: 'all', cap: 'all', lock: 'all' }, q: '',
  tree: {}, open: new Set(), openProv: new Set(),
};
try { const v = localStorage.getItem('trYieldView'); if (v === 'advanced') S.view = v; } catch (e) {}

/* ── rate maths ───────────────────────────── */
const TAX = () => (DATA && DATA.rules && DATA.rules.tax && DATA.rules.tax.ratePeso) || 20;
const INFL = () => (DATA && DATA.rules && DATA.rules.inflation && DATA.rules.inflation.value);
const isPeso = (r) => PH_CATS.includes(r.category) && r.currency === 'PHP';
const taxable = (r) => isPeso(r) && !r.taxExempt;
function net(rate, r) {
  if (rate == null) return null;
  let n = S.tax && taxable(r) ? rate * (1 - TAX() / 100) : rate;
  if (S.real && isPeso(r) && INFL() != null) n = n - INFL(); // real yield = rate after tax − inflation
  return n;
}
// Amounts are in pesos; crypto caps are in coins, so convert with the BSP rate (stablecoins ≈ US$1).
const FX = () => (DATA && DATA.rules && DATA.rules.fx && DATA.rules.fx.usdphp) || null;
function units(r, pesos) { return isPeso(r) ? pesos : (r.stablecoin && FX() ? pesos / FX() : null); }
// "Have you beaten inflation?" (Advanced view, peso savers in the Philippines)
const afterTax = (r) => (r.rate == null ? null : taxable(r) ? r.rate * (1 - TAX() / 100) : r.rate);
const realYield = (r) => (isPeso(r) && INFL() != null && r.rate != null ? afterTax(r) - INFL() : null);
function inflBadge(r) {
  const ry = realYield(r); if (ry == null || ended(r)) return '';
  return ry >= 0 ? `<span class="badge std adv-only" title="Rate after tax minus ${INFL()}% inflation">Beats inflation ✓</span>` : `<span class="badge stale adv-only" title="Rate after tax minus ${INFL()}% inflation">Below inflation</span>`;
}
function inflSpark(h, w = 280, ht = 64) {
  if (!h || h.length < 2) return '';
  const vs = h.map((p) => p.v), mx = Math.max(...vs), mn = Math.min(0, ...vs), sp = mx - mn || 1;
  const X = (i) => 4 + (i / (h.length - 1)) * (w - 8), Y = (v) => ht - 14 - ((v - mn) / sp) * (ht - 24);
  const pts = h.map((p, i) => `${X(i).toFixed(1)},${Y(p.v).toFixed(1)}`).join(' ');
  const last = h[h.length - 1];
  return `<svg class="infl-spark" viewBox="0 0 ${w} ${ht}" width="100%" height="${ht}" role="img" aria-label="PH inflation ${h[0].m} to ${last.m}: from ${h[0].v}% to ${last.v}%">
    <polyline fill="none" stroke="#ef4444" stroke-width="2" stroke-linejoin="round" points="${pts}"/>
    <circle cx="${X(h.length - 1)}" cy="${Y(last.v)}" r="3.5" fill="#ef4444"/>
    <text x="4" y="${ht - 2}" font-size="10" fill="#9a9a9a">${h[0].m}</text><text x="${w - 4}" y="${ht - 2}" font-size="10" fill="#9a9a9a" text-anchor="end">${last.m}</text>
  </svg>`;
}
function renderInfl() {
  const el = $('#inflPanel'), i = (DATA.rules || {}).inflation; if (!el || !i || i.value == null) return;
  const peso = ROWS.filter((r) => rankable(r) && isPeso(r) && !ended(r));
  const beat = peso.filter((r) => realYield(r) >= 0);
  const beatSteady = beat.filter((r) => r.kind !== 'promo' && !r.strings && !locked(r));
  const h = (i.history || []).slice(-24);
  el.innerHTML = `<div class="infl-head"><div><span class="eyebrow">For savers in the Philippines</span><h3>Have you beaten inflation?</h3>
      <p>Prices rose <b>${i.value}%</b> in the year to ${esc(i.label || i.month)}. To keep your buying power, your rate <b>after tax</b> has to be at least that.
      <b>${beat.length} of ${peso.length}</b> peso rate${peso.length === 1 ? "" : "s"} ${beat.length === 1 ? "does" : "do"} it today${beatSteady.length ? `, and only ${beatSteady.length} without a promo, task or lock-up` : ', and none without a promo, task or lock-up'}.</p></div>
    <div class="infl-chart"><div class="infl-now"><b>${i.value}%</b><small>PH inflation, ${esc(i.label || i.month)}</small></div>${inflSpark(h)}<small class="infl-src">Last 24 months · Source: <a href="${esc(i.source)}" target="_blank" rel="noopener">BSP</a> (CPI ${esc(i.base || '')}) · checked ${fmtDate(i.checkedOn)}</small></div></div>
    <p class="infl-foot">Real yield = rate after tax − inflation. Each peso rate below shows <span class="badge std">Beats inflation ✓</span> or <span class="badge stale">Below inflation</span>. Crypto is paid in dollars, so it isn't compared. This is a comparison, not advice; past inflation doesn't predict future inflation.</p>`;
}
function blended(r, pesos) {
  if (r.rate == null) return null;
  const amount = units(r, pesos);
  if (!amount || amount <= 0) return r.rate;
  if (r.tiers) { // [[upTo, rate], ..., [null, rate]] — each band earns its own rate
    let left = amount, prev = 0, earn = 0;
    for (const [upTo, rate] of r.tiers) { const band = upTo == null ? left : Math.min(left, upTo - prev); earn += band * rate; left -= band; prev = upTo; if (left <= 0) break; }
    return earn / amount;
  }
  const limit = r.cap != null ? r.cap : null;
  if (limit != null && amount > limit) {
    const after = r.rateAfterCap != null ? r.rateAfterCap : 0;
    return (limit * r.rate + (amount - limit) * after) / amount;
  }
  return r.rate;
}
// Rate over the next 12 months: a promo pays its rate until its end date, then the rate after the promo.
function yearRate(r, amount) {
  const b = blended(r, amount);
  if (b == null || r.kind !== 'promo' || !(r.promoEnds || r.promoDays)) return b; // ongoing boosts with no end date: assume they continue
  const d = Math.max(0, Math.min(365, r.promoEnds ? daysLeft(r) + 1 : Infinity, r.promoDays || Infinity));
  const after = r.rateAfterPromo != null ? r.rateAfterPromo : 0;
  return (b * d + after * (365 - d)) / 365;
}
const ended = (r) => r.kind === 'promo' && r.promoEnds && new Date(r.promoEnds) <= TODAY; // treat the end date itself as ended (Legal docket 27)
const daysLeft = (r) => (r.promoEnds ? daysBetween(TODAY, new Date(r.promoEnds)) : null);
const staleLimit = (r) => (r.category === 'cex' ? 16 : r.category === 'dex' ? 2 : 35);
const age = (r) => (r.checkedOn ? daysBetween(new Date(r.checkedOn), TODAY) : 999);
const stale = (r) => age(r) > staleLimit(r);
const locked = (r) => r.lockup && !/^flexible/i.test(r.lockup);
const capped = (r) => r.cap != null || (!!r.capText && r.category !== 'dex'); // DeFi capText is pool size, not a cap
const usable = (r) => r.rate != null && r.verified !== false && !ended(r);
const rankable = (r) => usable(r) && !r.teaser && !r.vipOnly;
const pct = (n, d = 2) => (n == null ? '—' : n.toFixed(d).replace(/\.?0+$/, (m) => (m.startsWith('.') ? '' : m)) + '%');
const pct2 = (n) => (n == null ? '—' : n.toFixed(2) + '%');
const money = (n, ccy = '₱') => ccy + Math.round(n).toLocaleString('en-PH');
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
function logo(r) {
  const n = (r.provider || '').toLowerCase() + ' ';
  for (const k in LOGOS) if (n.includes(k)) return `<img src="logos/${LOGOS[k]}.png" alt="" loading="lazy" onerror="this.remove()">`;
  return esc(n.split(/[\s.()]+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase());
}
function partner(r) {
  if (!DATA.partners) return null;
  for (const k in DATA.partners) if ((r.provider || '').toLowerCase().startsWith(k.toLowerCase())) return { name: k, ...DATA.partners[k] };
  return null;
}
// Partner/referral links live in the footer footnotes; rows and picks only link down to them.
const fnId = (p) => 'fn-' + String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
const fnLink = (p) => `<a class="fn-link" href="#${fnId(p)}" data-fn="${fnId(p)}">${p.kind === 'bank' ? 'Referral' : 'Partner'} link<sup>↓</sup></a>`;
function renderFootnotes() {
  const el = $('#partnerNotes'); if (!el || !DATA.partners) return;
  const list = Object.entries(DATA.partners).map(([name, p]) => ({ name, ...p }));
  const item = (p) => `<li id="${fnId(p)}"><span class="fn-name">${esc(p.label || p.name)}</span>${p.code
      ? `<span class="fn-code"><code>${esc(p.code)}</code><button type="button" class="fn-copy" data-copy="${esc(p.code)}">Copy code</button></span><span class="fn-how">${esc(p.codeHow || '')} <a href="${esc(p.url)}" target="_blank" rel="noopener">Official site ↗</a></span>`
      : `<a class="fn-url" href="${esc(p.url)}" target="_blank" rel="sponsored noopener">Sign up ↗</a> <small class="fn-dom">${esc(new URL(p.url).hostname.replace(/^www\./, ''))}</small>`}</li>`;
  const banks = list.filter((p) => p.kind === 'bank'), ex = list.filter((p) => p.kind !== 'bank');
  el.innerHTML = `<h3 class="fn-title">Partner &amp; referral links</h3>
    <p class="fn-lead">Some links on this page are partner or referral links. We may earn a commission or reward if you sign up. It doesn't change the rankings: partners get no boost, and we list the cons as well as the pros.</p>
    <div class="fn-cols">
      <div><h4>Banks (referral)</h4><ol class="fn-list">${banks.map(item).join('')}</ol><p class="fn-note">Referral link: we may earn a reward. Check the bank's referral terms and availability.</p></div>
      <div><h4>Crypto exchanges (partner)</h4><ol class="fn-list">${ex.map(item).join('')}</ol><p class="fn-note">Partner link: we may earn a commission. An eligible sign-up may qualify for the partner's stated fee rebate. Check the offer's terms and availability. Trading involves risk; this is education, not advice. Adults (18+) only.</p></div>
    </div>`;
}
function spark(h) {
  if (!h || h.length < 2) return '';
  const w = 64, ht = 22, vs = h.map((p) => p.r), mn = Math.min(...vs), mx = Math.max(...vs), sp = mx - mn || 1;
  const pts = h.map((p, i) => `${(i / (h.length - 1)) * (w - 4) + 2},${ht - 3 - ((p.r - mn) / sp) * (ht - 6)}`).join(' ');
  const up = vs[vs.length - 1] >= vs[0];
  return `<svg class="spark" width="${w}" height="${ht}" viewBox="0 0 ${w} ${ht}" aria-label="Rate history: ${h.map((p) => p.d + ' ' + p.r + '%').join(', ')}"><polyline fill="none" stroke="${up ? '#22c55e' : '#ef4444'}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${pts}"/></svg>`;
}
function kindBadge(r) {
  if (r.category === 'government') return '<span class="badge cap">Past dividend</span>';
  if (r.kind !== 'promo') return '<span class="badge std">Standard</span>';
  if (ended(r)) return '<span class="badge stale">Promo ended</span>';
  const d = daysLeft(r);
  const t = r.teaser ? '<span class="badge stale">Teaser · tiny cap</span> ' : '';
  return t + `<span class="badge promo">Promo${d != null ? ` · ${d === 0 ? 'ends today' : d === 1 ? '1 day left' : d + ' days left'}` : r.promoDays ? ` · ${r.promoDays} days per user` : ' · no end date set'}</span>`;
}
function capText(r) {
  const c = r.currency === 'PHP' ? '₱' : '';
  const u = r.currency !== 'PHP' ? ' ' + (r.currency || '') : '';
  if (r.capText) return esc(r.capText);
  if (r.cap != null) return `Up to ${c}${Number(r.cap).toLocaleString('en-PH')}${u}` + (r.rateAfterCap != null ? `<small>then ${pct(r.rateAfterCap)}</small>` : '');
  return 'No cap';
}

/* ── filtering ────────────────────────────── */
function visibleRows() {
  const q = S.q.trim().toLowerCase();
  return ROWS.filter((r) => {
    if (r.category === 'dex' && S.view !== 'advanced') return false;
    if (S.f.cat !== 'all' && r.category !== S.f.cat) return false;
    if (S.f.kind !== 'all' && r.kind !== S.f.kind) return false;
    if (S.f.cap === 'nocap' && capped(r)) return false;
    if (S.f.cap === 'capped' && !capped(r)) return false;
    if (S.view === 'advanced' && S.f.lock === 'flexible' && locked(r)) return false;
    if (S.view === 'advanced' && S.f.lock === 'locked' && !locked(r)) return false;
    if (q && !(`${r.provider} ${r.product}`.toLowerCase().includes(q))) return false;
    if (S.view === 'basic' && (r.rate == null || ended(r) || r.teaser || r.vipOnly || (r.category === 'cex' && !r.stablecoin))) return false;
    return true;
  });
}

/* ── rate list ────────────────────────────── */
function rowHTML(r) {
  const n = net(r.rate, r), id = esc(r.id);
  const p = partner(r);
  const rateCell = r.rate == null
    ? '<div class="rate na">Not published<small>check in the app</small></div>'
    : `<div class="rate">${r.upTo ? '<small>up to</small>' : ''}${pct2(n)}${S.tax && taxable(r) ? '<small>after tax</small>' : r.category === 'government' && r.taxExempt ? '<small>tax-free</small>' : isPeso(r) ? '' : `<small>${esc(r.rateBasis || 'APR')} · ${esc(r.currency)}</small>`}</div>`;
  const ins = r.pdic ? '<span class="badge ins" title="PDIC insures up to ₱1,000,000 per depositor, per bank, across all your accounts at that bank">PDIC ₱1M</span>' : r.category === 'cex' || r.category === 'dex' ? '<span class="badge noins">No insurance</span>' : '';
  const st = stale(r) ? '<span class="badge stale">Needs re-check</span>' : '';
  const facts = [
    ['Rate', r.rate == null ? 'Not published' : `${r.upTo ? 'Up to ' : ''}${pct2(r.rate)} ${isPeso(r) ? 'p.a. before tax' : (r.rateBasis || 'APR')}`],
    S.tax && taxable(r) && r.rate != null ? ['After 20% tax', pct2(r.rate * (1 - TAX() / 100))] : null,
    S.view === 'advanced' && realYield(r) != null ? ['Real yield', `${realYield(r) >= 0 ? '+' : ''}${pct2(realYield(r))} (after tax − ${INFL()}% inflation${r.kind === 'promo' ? '; only while the promo lasts' : ''})`] : null,
    r.taxExempt ? ['Tax', esc(r.taxNote || 'Tax-exempt')] : null,
    ['Type', r.kind === 'promo' ? `Promo${r.promoStarts ? ' from ' + fmtDate(r.promoStarts) : ''}${r.promoEnds ? ' until ' + fmtDate(r.promoEnds) : ''}` : 'Standard (ongoing, can change)'],
    r.kind === 'promo' && r.rateAfterPromo != null ? ['After the promo', pct2(r.rateAfterPromo)] : null,
    ['Cap', capText(r).replace(/<small>/, ' · ').replace('</small>', '')],
    ['Access', esc(r.lockup || '—')],
    r.minDeposit ? ['Minimum', (isPeso(r) ? '₱' : '') + Number(r.minDeposit).toLocaleString('en-PH')] : null,
    r.interestCredited ? ['Interest paid', esc(r.interestCredited)] : null,
    r.eligibility ? ['Who can get it', esc(r.eligibility)] : null,
    ['Insurance', r.pdic ? 'PDIC member bank: up to ₱1,000,000 per depositor, per bank, counting all your accounts at that bank together' : r.category === 'government' ? 'Not PDIC; backed by the agency' : 'None. Not a bank deposit'],
    ['Checked', `${fmtDate(r.checkedOn)}${stale(r) ? ' (older than our schedule)' : ''}`],
  ].filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  return `<div class="row${S.open.has(r.id) ? ' open' : ''}${ended(r) ? ' is-ended' : ''}" data-id="${id}">
  <button class="row-main" aria-expanded="${S.open.has(r.id)}" aria-controls="m-${id}">
    <div class="prov"><div class="logo">${logo(r)}</div><div class="prov-txt"><span class="prov-name">${esc(r.provider)}</span><span class="prov-prod">${esc(r.product)}</span></div></div>
    ${rateCell}
    <div class="adv-only c-adv cell-s">${r.rate == null ? '' : `${pct2(r.rate)}<small>${isPeso(r) ? 'before tax' : 'as shown'}</small>`}</div>
    <div class="c-kind">${kindBadge(r)} ${st} ${inflBadge(r)}</div>
    <div class="c-cap cell-s">${capText(r)}</div>
    <div class="adv-only c-adv cell-s">${esc(locked(r) ? r.lockup : 'Anytime')}<small>${ins.replace(/<[^>]+>/g, '')}</small></div>
    <div class="adv-only c-adv cell-s">${fmtDate(r.checkedOn)}<small>${stale(r) ? '<span style="color:var(--red)">re-check due</span>' : 'on schedule'}</small></div>
    <div class="adv-only c-adv">${spark(r.history)}</div>
    <div class="c-badges">${kindBadge(r)} ${capped(r) ? '<span class="badge cap">Capped</span>' : ''} ${ins} ${st} ${inflBadge(r)}</div>
    <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
  </button>
  <div class="row-more" id="m-${id}">
    <div class="more-grid">
      <div>
        ${r.conditions ? `<h4>What you must do</h4><p>${esc(r.conditions)}</p>` : ''}
        <h4>The fine print</h4><p>${esc(r.finePrint || 'No extra conditions listed on the official page.')}</p>
        ${r.cons ? `<h4>Cons to know</h4><p>${esc(r.cons)}</p>` : ''}
        <div class="more-actions">
          ${r.source ? `<a class="btn" href="${esc(r.source)}" target="_blank" rel="noopener">Official page ↗</a>` : ''}
          ${p ? fnLink(p) : ''}
        </div>
      </div>
      <dl class="facts">${facts}</dl>
    </div>
  </div>
</div>`;
}
// One card per provider: overview first, its products (and their fine print) when expanded.
function groupByProvider(rows) {
  const m = new Map();
  for (const r of rows) { const k = r.category + '|' + r.provider; if (!m.has(k)) m.set(k, []); m.get(k).push(r); }
  return [...m.entries()].map(([k, rs]) => ({ k, rs }));
}
function provHTML({ k, rs }) {
  if (rs.length === 1) return rowHTML(rs[0]);
  const r0 = rs[0], ok = rs.filter((r) => r.rate != null && !ended(r) && !r.teaser);
  const best = (f) => ok.filter(f).sort((a, b) => net(b.rate, b) - net(a.rate, a))[0];
  const top = best(() => true), std = best((r) => r.kind === 'standard'), promo = best((r) => r.kind === 'promo');
  const open = S.openProv.has(k), kid = 'p-' + k.replace(/[^a-z0-9]+/gi, '-');
  const bits = [
    std ? `Steady up to <b>${pct2(net(std.rate, std))}</b>` : '',
    promo ? `Promo up to <b>${pct2(net(promo.rate, promo))}</b>${promo.promoEnds ? ' · ends ' + fmtDate(promo.promoEnds) : ''}` : '',
    rs.some((r) => locked(r)) && rs.some((r) => !locked(r)) ? (isPeso(r0) ? 'Savings + time deposits' : 'Flexible + fixed terms') : rs.every(locked) ? 'Time deposits' : '',
  ].filter(Boolean).join(' <span class="dot">·</span> ');
  const ins = r0.pdic ? '<span class="badge ins" title="PDIC insures up to ₱1,000,000 per depositor, per bank, across all your accounts at that bank">PDIC ₱1M</span>' : r0.category === 'cex' || r0.category === 'dex' ? '<span class="badge noins">No insurance</span>' : '';
  return `<div class="prov-card${open ? ' open' : ''}" data-prov="${esc(k)}">
  <button class="prov-head" aria-expanded="${open}" aria-controls="${kid}">
    <div class="prov"><div class="logo">${logo(r0)}</div><div class="prov-txt"><span class="prov-name">${esc(r0.provider)}</span><span class="prov-prod">${rs.length} products · tap to compare</span></div></div>
    <div class="rate">${top ? '<small>best</small>' + pct2(net(top.rate, top)) : '<span class="na">—</span>'}</div>
    <div class="prov-sum">${bits} ${ins}</div>
    <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
  </button>
  <div class="prov-body" id="${kid}">${rs.map(rowHTML).join('')}</div>
</div>`;
}
function renderRates() {
  const list = visibleRows();
  const sortKey = (r) => (r.rate == null ? -1 : ended(r) ? -0.5 : net(r.rate, r));
  const headFor = (cat) => S.view === 'advanced'
    ? `<div class="row-main" style="cursor:default;padding-top:0;padding-bottom:0;font-size:.68rem;letter-spacing:1px;text-transform:uppercase;color:var(--text-dim)" aria-hidden="true"><div>Provider</div><div>${S.tax && PH_CATS.includes(cat) && cat !== 'government' ? 'Net rate' : 'Rate'}</div><div class="c-adv">Gross</div><div class="c-kind">Type</div><div class="c-cap">Cap</div><div class="c-adv">Access</div><div class="c-adv">Checked</div><div class="c-adv">Trend</div><div></div></div>`
    : '';
  let html = '';
  for (const cat of ORDER) {
    const g = list.filter((r) => r.category === cat).sort((a, b) => sortKey(b) - sortKey(a));
    if (!g.length) continue;
    { const np = new Set(g.map((r) => r.provider)).size; html += `<div class="rgroup-title">${CAT_LABEL[cat]} <span>${np} provider${np > 1 ? 's' : ''} · ${g.length} rate${g.length > 1 ? 's' : ''}</span></div>`; }
    if (CAT_NOTE[cat]) html += `<p class="rgroup-note">${CAT_NOTE[cat]}</p>`;
    html += headFor(cat) + groupByProvider(g).map(provHTML).join('');
  }
  $('#rates').innerHTML = html || '<p class="no-picks">No rates match these filters.</p>';
  const hidden = ROWS.filter((r) => r.rate == null || r.teaser || r.vipOnly || (r.category === 'cex' && !r.stablecoin)).length;
  $('#ratesFoot').innerHTML = S.view === 'basic' && hidden ? `Basic view hides ${hidden} rows: VIP-only offers, tiny-cap teasers, and products that only show a rate inside their app. <a href="#" data-goadv>Switch to Advanced</a> to see them.` : '';
}

/* ── finder (tech tree) ───────────────────── */
const TREE = [
  { key: 'ccy', label: 'Currency', sub: 'What you save in', nodes: [
    ['php', '₱', 'Pesos (PHP)', 'Banks, digital banks, MP2'],
    ['usd', '$', 'US dollars (USD)', 'Stablecoins: USDT, USDC, USDG'],
  ] },
  { key: 'where', label: 'Where', sub: 'Pick your world', nodes: () => S.tree.ccy === 'usd' ? [
    ['crypto', '🪙', 'Crypto exchange', 'OKX, Bybit, Gate and more'],
    ['defi', '🧩', 'DeFi on Solana', 'Kamino, Jupiter · advanced'],
    ['both', '⚖️', 'Show me both', 'Compare side by side'],
  ] : [
    ['bank', '🏦', 'Bank or government', 'Pesos, PDIC-insured banks'],
    ['both', '⚖️', 'Banks + crypto', 'Crypto pays in dollars'],
  ] },
  { key: 'access', label: 'Access', sub: 'When you need it back', nodes: [
    ['flex', '🔓', 'Anytime', 'Withdraw whenever'],
    ['lock', '🔒', 'I can lock it', 'Months or longer'],
    ['any', '↔️', 'Either is fine', ''],
  ] },
  { key: 'amount', label: 'Amount', sub: 'How much to park', amount: () => (S.tree.ccy === 'usd' ? [100, 1000, 5000, 10000] : [10000, 100000, 500000, 1000000]) },
  { key: 'promo', label: 'Promos', sub: 'Short boosts or steady', nodes: [
    ['ok', '⚡', 'Promos are fine', 'I will move my money'],
    ['no', '🌳', 'Steady rates only', 'No end dates'],
  ] },
  { key: 'strings', label: 'Strings', sub: 'Tasks to earn the rate', nodes: [
    ['ok', '✅', 'Tasks are OK', 'Spend, keep a balance'],
    ['no', '🧘', 'No strings', 'Just park it'],
  ] },
];
function renderTree() {
  let html = '', reached = true;
  TREE.forEach((t, i) => {
    if (!reached) return;
    const val = S.tree[t.key];
    html += `<div class="tier${val != null ? ' dim' : ''}" data-tier="${t.key}"><div class="tier-label">${i + 1}. ${t.label}<small>${t.sub}</small></div>`;
    if (t.amount) {
      const usd = S.tree.ccy === 'usd', sym = usd ? '$' : '₱', amts = t.amount();
      const chip = (a) => (usd ? (a >= 10000 ? '$10k+' : a >= 1000 ? '$' + a / 1000 + 'k' : '$' + a) : (a >= 1e6 ? '₱1M+' : '₱' + a / 1000 + 'k'));
      html += `<div class="amount-row">${amts.map((a) => `<button class="node" data-k="amount" data-v="${a}" aria-pressed="${val === a}"><span class="ic">${sym}</span><b>${chip(a)}</b></button>`).join('')}<input type="number" inputmode="numeric" min="${usd ? 10 : 1000}" step="${usd ? 10 : 1000}" placeholder="Other amount" aria-label="Other amount in ${usd ? 'US dollars' : 'pesos'}" id="treeAmt" value="${val && !amts.includes(val) ? val : ''}"></div>`;
    } else {
      html += `<div class="nodes">${(typeof t.nodes === 'function' ? t.nodes() : t.nodes).map(([v, ic, b, s]) => `<button class="node" data-k="${t.key}" data-v="${v}" aria-pressed="${val === v}"><span class="ic" aria-hidden="true">${ic}</span><span><b>${b}</b>${s ? `<span class="sub">${s}</span>` : ''}</span></button>`).join('')}</div>`;
    }
    html += '</div>';
    reached = val != null;
  });
  $('#tree').innerHTML = html;
  const done = TREE.every((t) => S.tree[t.key] != null);
  $('#treeResult').hidden = !done;
  if (done) renderPicks();
}
function renderPicks() {
  const T = S.tree, usd = T.ccy === 'usd', amt = (Number(T.amount) || 0) * (usd ? (FX() || 1) : 1); // amt is always pesos inside
  const show = (p) => (usd ? '$' + Math.round(p / (FX() || 1)).toLocaleString('en-US') : money(p));
  const pool = ROWS.filter((r) => {
    if (!rankable(r)) return false;
    if ((r.category === 'cex' || r.category === 'dex') && !r.stablecoin) return false;
    if (usd && !((r.category === 'cex' || r.category === 'dex') && r.stablecoin)) return false;
    if (T.where === 'bank' && !PH_CATS.includes(r.category)) return false;
    if (T.where === 'crypto' && r.category !== 'cex') return false;
    if (T.where === 'defi' && r.category !== 'dex') return false;
    if (T.where === 'both' && !usd && !(PH_CATS.includes(r.category) || r.category === 'cex')) return false;
    if (T.access === 'flex' && locked(r)) return false;
    if (T.access === 'lock' && !locked(r)) return false;
    if (T.promo === 'no' && r.kind === 'promo') return false;
    if (T.strings === 'no' && r.strings) return false;
    if (r.minDeposit && amt && amt < r.minDeposit && isPeso(r)) return false;
    if (r.maxDeposit && amt && amt > r.maxDeposit && isPeso(r)) return false;
    return true;
  }).map((r) => ({ r, b: blended(r, amt), y: yearRate(r, amt) })).map((x) => ({ ...x, n: net(x.b, x.r), ny: net(x.y, x.r) }))
    .sort((a, b) => b.ny - a.ny);
  const seen = new Set(), top = [];
  for (const x of pool) { const k = x.r.provider; if (seen.has(k)) continue; seen.add(k); top.push(x); if (top.length === 3) break; }
  const lbl = (k, v) => { const t = TREE.find((x) => x.key === k); if (t.amount) return (usd ? '$' : '₱') + Number(v).toLocaleString('en-PH'); const n = (typeof t.nodes === 'function' ? t.nodes() : t.nodes).find((x) => x[0] === v); return n ? n[2] : v; };
  const path = TREE.map((t) => `<span class="step">${lbl(t.key, S.tree[t.key])}</span>`).join('<span aria-hidden="true">→</span>');
  const ranks = ['Best fit', 'Runner-up', 'Also good'];
  const cards = top.map((x, i) => {
    const r = x.r, p = partner(r), yr = amt * x.ny / 100;
    const why = [r.kind === 'promo' ? (r.promoEnds ? `Promo ends ${fmtDate(r.promoEnds)}` : r.promoDays ? `Promo lasts ${r.promoDays} days` : 'Promo, no end date set') : 'Standard rate', r.tiers ? 'tiered rate, blended for your amount' : capped(r) && (units(r, amt) || 0) > (r.cap || Infinity) ? `cap ${isPeso(r) ? '₱' : ''}${Number(r.cap).toLocaleString('en-PH')}${isPeso(r) ? '' : ' ' + r.currency}, rest earns ${pct(r.rateAfterCap || 0)}` : capped(r) ? 'within the cap' : 'no cap', locked(r) ? r.lockup : 'withdraw anytime', r.pdic ? 'PDIC-insured' : r.category === 'cex' ? 'not insured' : ''].filter(Boolean).join(' · ');
    return `<article class="pick">
      <div class="pick-rank">${ranks[i]}</div>
      <div class="pick-head"><div class="logo">${logo(r)}</div><div><div class="pick-prov">${esc(r.provider)}</div><div class="pick-prod">${esc(r.product)}</div></div></div>
      <div class="pick-rate">${r.upTo && !r.tiers ? "<small>up to</small> " : ""}${pct2(x.n)} <small>${S.tax && taxable(r) ? 'after tax' : r.taxExempt ? 'tax-free' : isPeso(r) ? 'p.a.' : esc(r.rateBasis || 'APR')}${x.b !== r.rate ? ' blended' : ''}</small></div>
      <div class="pick-earn">On ${show(amt)}: about <b>${show(yr)}</b> over the next 12 months${r.kind === 'promo' && (r.promoEnds || r.promoDays) ? ` <span class="tag">(${pct2(x.n)} ${r.promoEnds ? 'until ' + fmtDate(r.promoEnds) : 'for your first ' + r.promoDays + ' days'}, then ${pct2(net(r.rateAfterPromo || 0, r))}; that is ${pct2(x.ny)} over the year)</span>` : ''}</div>${r.category === 'cex' || r.category === 'dex' ? `<div class="why">Paid in ${esc(r.currency)}. Not adjusted for tax${usd ? '' : ` or the exchange rate (shown at the BSP rate of ₱${FX()} per dollar)`}. Not insured.${r.category === 'dex' ? ' Smart-contract risk: you could lose some or all of it. Adults (18+) only.' : ''}</div>` : ''}
      <div class="why">${esc(why)}</div>
      <div>${kindBadge(r)} ${stale(r) ? '<span class="badge stale">Needs re-check</span>' : ''} ${inflBadge(r)}</div>${S.view === 'advanced' && realYield(r) != null ? `<div class="why">Real yield ${realYield(r) >= 0 ? '+' : ''}${pct2(realYield(r))} after tax and ${INFL()}% inflation.</div>` : ''}
      <div class="actions"><a class="btn" href="#yields" data-show="${esc(r.id)}">Fine print</a>${r.source ? `<a class="btn" href="${esc(r.source)}" target="_blank" rel="noopener">Official page ↗</a>` : ''}${p ? fnLink(p) : ''}</div>
    </article>`;
  }).join('');
  $('#treeResult').innerHTML = `<div class="path">${path}</div><p class="rank-note">Ranked only by your answers and the rate after tax. Partners get no boost. This is a comparison, not advice.</p>${top.length ? `<div class="picks">${cards}</div>` : '<div class="no-picks">Nothing matches every choice. Try “Either is fine” or allow promos.</div>'}
    <p class="rates-foot">Ranked by what your amount earns over the next 12 months${S.tax ? ' after tax' : ''}: caps applied, and promos count only until they end. Only rates we could check on an official page. Not financial advice.</p>`;
}

/* ── calculator ───────────────────────────── */
function fillCalc() {
  const sel = $('#calcPick');
  const opts = ROWS.filter(rankable).sort((a, b) => a.provider.localeCompare(b.provider) || b.rate - a.rate);
  sel.innerHTML = '<option value="">Custom rate: 5%</option>' + opts.map((r) => `<option value="${esc(r.id)}">${esc(r.provider)} · ${esc(r.product)} — ${r.upTo ? 'up to ' : ''}${pct2(r.rate)}</option>`).join('');
}
function calc() {
  const r = ROWS.find((x) => x.id === $('#calcPick').value);
  const A = Math.max(0, Number($('#calcDeposit').value) || 0), Y = Number($('#calcYears').value) || 1;
  const ccy = '₱';
  let bal = A, first = 0;
  for (let y = 0; y < Y; y++) {
    const b = r ? (y === 0 ? yearRate(r, bal) : blended({ ...r, rate: r.kind === 'promo' && r.promoEnds ? (r.rateAfterPromo || 0) : r.rate }, bal)) : 5; const n = r ? net(b, r) : (S.tax ? 5 * (1 - TAX() / 100) : 5);
    const e = bal * n / 100; if (y === 0) first = e; bal += e;
  }
  $('#resBalance').textContent = money(bal, ccy);
  $('#resBalanceSub').textContent = `after ${Y} year${Y > 1 ? 's' : ''}`;
  $('#resProfit').textContent = '+' + money(bal - A, ccy);
  $('#resProfitSub').textContent = S.tax && (!r || taxable(r)) ? 'after 20% tax' : r && r.taxExempt ? 'tax-free' : 'before any tax';
  $('#resMonth').textContent = money(first / 12, ccy);
  $('#resYear').textContent = money(first, ccy);
  $('#resRate').textContent = A ? pct2(first / A * 100) : '—';
  $('#calcDepositLabel').textContent = money(A, ccy);
  $('#calcYearsLabel').textContent = Y + (Y > 1 ? ' years' : ' year');
  let hint = '';
  if (r) {
    if (r.kind === 'promo') hint += `Promo until ${fmtDate(r.promoEnds)}, then ${pct(r.rateAfterPromo || 0)}. The estimate uses the promo rate only until it ends. `;
    if (r.cap != null && isPeso(r) && A > r.cap) hint += `Only the first ${ccy}${Number(r.cap).toLocaleString('en-PH')} earns ${pct(r.rate)}; the rest earns ${pct(r.rateAfterCap || 0)}. `;
    if (r.upTo) hint += 'This is the top “up to” rate; you may get less. ';
    if (!isPeso(r)) hint += `Paid in ${r.currency}. Shown in pesos at the BSP rate of ₱${FX()} per dollar; the peso value moves with the dollar.`;
  }
  $('#calcHint').textContent = hint;
  $('#calcNote').textContent = 'Interest is added once a year in this estimate. Real banks credit daily or monthly, so actual numbers differ slightly.';
}

/* ── header, rules ────────────────────────── */
function renderStats() {
  const u = ROWS.filter((r) => rankable(r) && r.category !== 'dex');
  const peso = u.filter(isPeso).map((r) => net(r.rate, r));
  const std = u.filter((r) => isPeso(r) && r.kind === 'standard' && !r.strings && !locked(r)).map((r) => net(r.rate, r));
  const promoTop = u.filter((r) => r.kind === 'promo').map((r) => net(r.rate, r));
  const promos = u.filter((r) => r.kind === 'promo').length;
  const providers = new Set(ROWS.filter((r) => r.category !== 'dex').map((r) => r.provider)).size;
  const stat = (v, l) => `<div class="stat-item"><div class="stat-value">${v}</div><div class="stat-label">${l}</div></div>`;
  $('#statsRow').innerHTML = stat(providers, 'Providers') + stat(std.length ? pct2(Math.max(...std)) : '—', `Best steady savings${S.tax ? ', after tax' : ''}`) + stat(promoTop.length ? pct2(Math.max(...promoTop)) : '—', `Top promo rate${S.tax ? ' after tax' : ''} (short-term, conditions apply)`) + stat(promos, 'Live promos');
  const ph = DATA.checked && DATA.checked.ph, cx = DATA.checked && DATA.checked.crypto;
  // Verified seal: last check per group and the next scheduled check (PH: 28th = end of month; crypto: 1st and 15th).
  const nextPh = (() => { const d = new Date(TODAY); if (d.getDate() >= 28) d.setMonth(d.getMonth() + 1, 28); else d.setDate(28); return d; })();
  const nextCx = (() => { const d = new Date(TODAY); if (d.getDate() < 15) d.setDate(15); else d.setMonth(d.getMonth() + 1, 1); return d; })();
  const dm = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const late = (iso, days) => iso && daysBetween(new Date(iso), TODAY) > days;
  $('#verifyChecked').innerHTML = `<span class="vc">Peso rates checked <b>${fmtDate(ph)}</b></span><span class="vsep"> · </span><span class="vc">Crypto checked <b>${fmtDate(cx)}</b></span>`;
  $('#verifyNext').innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> Next update: <span class="vc">peso rates <b>${dm(nextPh)}</b> (end of every month)</span><span class="vsep"> · </span><span class="vc">crypto <b>${dm(nextCx)}</b> (every 2 weeks)</span>${late(ph, 35) || late(cx, 16) ? ' · <span class="verify-late">a re-check is overdue</span>' : ''}`;
}
function renderRules() {
  const R = DATA.rules || {};
  const t = R.tax || {}, p = R.pdic || {}, i = R.inflation || {};
  $('#taxNote').textContent = `(${TAX()}%)`;
  $('#inflNote').textContent = i.value != null ? `(${i.value}% PH CPI)` : '';
  $('#rulesBox').innerHTML = `<div class="rules">
    <h4>Philippine tax on interest</h4><p>${esc(t.summary || '')}</p>
    ${(t.sources || []).slice(0, 2).map((s) => `<a href="${esc(s.url || s)}" target="_blank" rel="noopener">${esc(s.name || 'Source')} ↗</a> `).join('')}
    <h4 style="margin-top:14px">Deposit insurance</h4><p>${esc(p.summary || '')}</p>${p.source ? `<a href="${esc(p.source)}" target="_blank" rel="noopener">PDIC ↗</a>` : ''}
    ${i.value != null ? `<h4 style="margin-top:14px">Inflation</h4><p>PH headline inflation was ${i.value}% in ${esc(i.label || i.month)}. A rate below that loses buying power. See “Have you beaten inflation?” in Advanced view.</p><a href="${esc(i.source)}" target="_blank" rel="noopener">BSP ↗</a>` : ''}
    <p style="margin:14px 0 0;font-size:.76rem;color:var(--text-dim)">Crypto: we do not adjust for tax. Rules differ by country; check yours.</p>
  </div>`;
}

/* ── wiring ───────────────────────────────── */
function setView(v) {
  S.view = v; document.body.dataset.view = v; if (v === 'basic' && S.f.lock !== 'all') S.f.lock = 'all';
  $$('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  try { localStorage.setItem('trYieldView', v); } catch (e) {}
  if (v === 'basic') { if (S.f.cat === 'dex') S.f.cat = 'all'; S.real = false; $('#realToggle').checked = false; syncChips(); }
  renderAll();
}
function syncChips() { $$('.chips').forEach((c) => $$('button', c).forEach((b) => b.setAttribute('aria-pressed', String(S.f[c.dataset.key] === b.dataset.v)))); syncFilterUi(); }

/* ── collapsible filters (preview looks: ?filters=a|b|c, default a) ── */
const FLOOK = (new URLSearchParams(location.search).get('filters') || 'a').toLowerCase();
const FLABEL = { cat: 'Where', kind: 'Promo', cap: 'Cap', lock: 'Access' };
const optLabel = (k, v) => { const b = $(`.chips[data-key="${k}"] button[data-v="${v}"]`); return b ? b.textContent : v; };
function activeKeys(keys) { return keys.filter((k) => S.f[k] !== 'all' && !(k === 'lock' && S.view !== 'advanced')); }
function setupFilters() {
  const box = $('#filters'); if (!box) return;
  box.dataset.flook = FLOOK;
  const groups = { cat: $('.chips[data-key="cat"]', box), kind: $('.chips[data-key="kind"]', box), cap: $('.chips[data-key="cap"]', box), lock: $('.chips[data-key="lock"]', box) };
  const search = $('.search-bar', box);
  const mk = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const icon = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4"/></svg>';
  if (FLOOK === 'c') {
    const row = mk('div', 'f-row');
    for (const k of ['cat', 'kind', 'cap', 'lock']) {
      const g = groups[k]; g.hidden = true;
      const wrap = mk('label', 'f-select' + (g.classList.contains('adv-only') ? ' adv-only' : ''));
      wrap.innerHTML = `<span>${FLABEL[k]}</span><select data-key="${k}">${$$('button', g).map((b) => `<option value="${b.dataset.v}"${b.classList.contains('adv-only') ? ' data-adv="1"' : ''}>${b.textContent}</option>`).join('')}</select>`;
      wrap.querySelector('select').addEventListener('change', (e) => { S.f[k] = e.target.value; syncChips(); renderRates(); });
      row.appendChild(wrap);
    }
    row.appendChild(search); box.prepend(row); return;
  }
  const more = FLOOK === 'b' ? ['cat', 'kind', 'cap', 'lock'] : ['kind', 'cap', 'lock'];
  const panel = mk('div', 'f-panel'); panel.id = 'fPanel'; panel.hidden = true;
  for (const k of more) { const g = groups[k]; const row = mk('div', 'f-group' + (g.classList.contains('adv-only') ? ' adv-only' : ''), `<span class="f-label">${FLABEL[k]}</span>`); row.appendChild(g); panel.appendChild(row); }
  const btn = mk('button', 'f-toggle', `${icon}<span class="f-tl">${FLOOK === 'b' ? 'Filters' : 'More filters'}</span><span class="f-count" hidden></span><svg class="f-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`);
  btn.type = 'button'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'fPanel');
  btn.addEventListener('click', () => { panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden)); });
  const top = mk('div', 'f-row');
  if (FLOOK === 'a') top.appendChild(groups.cat);
  const tools = mk('div', 'f-tools'); tools.appendChild(btn); tools.appendChild(search); top.appendChild(tools);
  const pills = mk('div', 'f-active'); pills.id = 'fActive';
  pills.addEventListener('click', (e) => { const x = e.target.closest('[data-clear]'); if (!x) return; const k = x.dataset.clear; if (k === '*') more.forEach((m) => (S.f[m] = 'all')); else S.f[k] = 'all'; syncChips(); renderRates(); });
  box.prepend(pills); box.prepend(panel); box.prepend(top);
}
function syncFilterUi() {
  const box = $('#filters'); if (!box || !box.dataset.flook) return;
  if (FLOOK === 'c') { $$('select[data-key]', box).forEach((sel) => { sel.value = S.f[sel.dataset.key]; $$('option[data-adv]', sel).forEach((o) => (o.hidden = S.view !== 'advanced')); }); return; }
  const more = FLOOK === 'b' ? ['cat', 'kind', 'cap', 'lock'] : ['kind', 'cap', 'lock'];
  const act = activeKeys(more), cnt = $('.f-count', box);
  cnt.hidden = !act.length; cnt.textContent = act.length;
  $('#fActive').innerHTML = act.length ? act.map((k) => `<button class="f-pill" data-clear="${k}" aria-label="Clear ${FLABEL[k]} filter">${FLABEL[k]}: ${optLabel(k, S.f[k])} <span aria-hidden="true">×</span></button>`).join('') + (act.length > 1 ? '<button class="f-pill f-clear" data-clear="*">Clear all</button>' : '') : '';
}
function renderAll() { renderStats(); renderRates(); if (TREE.every((t) => S.tree[t.key] != null)) renderPicks(); calc(); }
function wire() {
  $$('.seg button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
  $('#taxToggle').addEventListener('change', (e) => { S.tax = e.target.checked; renderAll(); });
  $('#realToggle').addEventListener('change', (e) => { S.real = e.target.checked; renderAll(); });
  $$('.chips').forEach((c) => c.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; S.f[c.dataset.key] = b.dataset.v; syncChips(); renderRates(); }));
  $('#searchInput').addEventListener('input', (e) => { S.q = e.target.value; if (S.q.trim().length > 1) visibleRows().forEach((r) => S.openProv.add(r.category + '|' + r.provider)); renderRates(); });
  $('#rates').addEventListener('click', (e) => {
    const ph = e.target.closest('.prov-head');
    if (ph) { const c = ph.closest('.prov-card'), k = c.dataset.prov; S.openProv.has(k) ? S.openProv.delete(k) : S.openProv.add(k); c.classList.toggle('open'); ph.setAttribute('aria-expanded', String(S.openProv.has(k))); return; }
    const m = e.target.closest('.row-main'); if (!m || !m.closest('.row')) return;
    const id = m.closest('.row').dataset.id; S.open.has(id) ? S.open.delete(id) : S.open.add(id);
    m.closest('.row').classList.toggle('open'); m.setAttribute('aria-expanded', String(S.open.has(id)));
  });
  $('#ratesFoot').addEventListener('click', (e) => { if (e.target.matches('[data-goadv]')) { e.preventDefault(); setView('advanced'); } });
  $('#tree').addEventListener('click', (e) => {
    const b = e.target.closest('.node'); if (!b) return;
    const k = b.dataset.k, v = k === 'amount' ? Number(b.dataset.v) : b.dataset.v;
    const idx = TREE.findIndex((t) => t.key === k);
    if (k === 'ccy' && S.tree.ccy !== v) { delete S.tree.where; delete S.tree.amount; }
    S.tree[k] = v;
    renderTree();
    const next = $(`.tier[data-tier="${(TREE[idx + 1] || {}).key}"]`) || $('#treeResult');
    if (next && next.getBoundingClientRect().top > innerHeight - 120) next.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  $('#tree').addEventListener('change', (e) => { if (e.target.id === 'treeAmt') { const v = Number(e.target.value); if (v > 0) { S.tree.amount = v; renderTree(); } } });
  $('#treeResult').addEventListener('click', (e) => {
    const a = e.target.closest('[data-show]'); if (!a) return;
    e.preventDefault(); const id = a.dataset.show; const r = ROWS.find((x) => x.id === id);
    S.f = { cat: 'all', kind: 'all', cap: 'all', lock: 'all' }; S.q = ''; $('#searchInput').value = ''; syncChips(); S.open.add(id); { const rr = ROWS.find((x) => x.id === id); if (rr) S.openProv.add(rr.category + '|' + rr.provider); } renderRates();
    const el = $(`.row[data-id="${CSS.escape(id)}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.fn-link');
    if (a) { e.preventDefault(); const t = document.getElementById(a.dataset.fn); if (t) { t.scrollIntoView({ behavior: 'smooth', block: 'center' }); t.classList.remove('fn-hit'); void t.offsetWidth; t.classList.add('fn-hit'); } return; }
    const c = e.target.closest('.fn-copy');
    if (c) { const done = () => { c.textContent = 'Copied ✓'; setTimeout(() => (c.textContent = 'Copy code'), 1800); }; try { navigator.clipboard.writeText(c.dataset.copy).then(done, done); } catch (err) { done(); } }
  });
  ['calcPick', 'calcYears'].forEach((i) => $('#' + i).addEventListener('input', calc));
  $('#calcDeposit').addEventListener('input', (e) => { $('#calcDepositSlider').value = e.target.value; calc(); });
  $('#calcDepositSlider').addEventListener('input', (e) => { $('#calcDeposit').value = e.target.value; calc(); });
}
async function loadDefi() {
  try {
    const res = await fetch('https://yields.llama.fi/pools'); const pools = (await res.json()).data || [];
    const today = new Date().toISOString().slice(0, 10);
    return pools.filter((p) => DEFI.projects[p.project] && p.chain === 'Solana' && DEFI.symbols.includes(p.symbol) && (p.tvlUsd || 0) >= DEFI.minTvl)
      .sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
      .map((p) => {
        const [prov, link] = DEFI.projects[p.project];
        const meta = p.poolMeta || 'Main market';
        const rwa = /rwa|institutional|commodity|figure|onre|huma|plume/i.test(meta);
        const rew = p.apyReward > 0.05;
        const avg = p.apyMean30d != null ? ` 30-day average ${p.apyMean30d.toFixed(2)}%.` : '';
        return { id: `dex-${p.pool}`, provider: prov, product: `${meta} · ${p.symbol}`, category: 'dex', currency: p.symbol, stablecoin: true,
          rate: Math.round((p.apy || 0) * 100) / 100, rateBasis: 'APY', kind: rew ? 'promo' : 'standard', lockup: 'flexible',
          capText: `Pool size $${((p.tvlUsd || 0) / 1e6).toFixed(1)}M`,
          finePrint: `Live from DefiLlama: ${(p.apyBase || 0).toFixed(2)}% from borrowers${rew ? ` + ${p.apyReward.toFixed(2)}% in reward tokens (rewards can stop anytime)` : ''}.${avg} The rate moves with demand to borrow.${rwa ? ' This vault lends against real-world assets, which adds credit risk outside crypto.' : ''}`,
          cons: 'Smart-contract, oracle and stablecoin risk. No insurance. You need your own Solana wallet; there is no support desk if you make a mistake.',
          source: link, checkedOn: today, verified: true, history: p.apyMean30d != null ? [{ d: '30-day average', r: Math.round(p.apyMean30d * 100) / 100 }, { d: 'today', r: Math.round((p.apy || 0) * 100) / 100 }] : [] };
      });
  } catch (e) { return []; }
}
async function init() {
  setupFilters();
  wire();
  document.body.dataset.view = S.view; $$('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
  try { DATA = await (await fetch('yields.json', { cache: 'no-cache' })).json(); }
  catch (e) { $('#rates').innerHTML = '<p class="no-picks">Could not load the rates. Please refresh.</p>'; return; }
  ROWS = DATA.rows;
  renderRules(); renderInfl(); renderFootnotes(); fillCalc(); renderTree(); renderAll(); syncFilterUi();
  const u = ROWS.filter((r) => usable(r) && isPeso(r)).sort((a, b) => b.rate - a.rate)[0];
  if (u) { $('#calcPick').value = u.id; calc(); }
  // Preview only: ?demo=1 fills the finder and opens the first row, for screenshots.
  const Q = new URLSearchParams(location.search);
  if (Q.get('demo')) { S.tree = Q.get('ccy') === 'usd' ? { ccy: 'usd', where: 'both', access: 'flex', amount: 1000, promo: 'ok', strings: 'no' } : { ccy: 'php', where: 'bank', access: 'flex', amount: 100000, promo: 'ok', strings: 'no' }; renderTree(); const f = ROWS.find((r) => usable(r) && r.kind === 'promo' && isPeso(r)); if (f) { S.open.add(f.id); renderRates(); } }
  if (Q.get('view') === 'advanced') setView('advanced');
  if (Q.get('fdemo')) { S.f.kind = 'standard'; S.f.cap = 'nocap'; syncChips(); renderRates(); const t = $('.f-toggle'); if (t && Q.get('fdemo') === 'open') t.click(); }
  if (Q.get('scrollto')) { const el = document.getElementById(Q.get('scrollto')); if (el) { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 130); } }
  const dex = await loadDefi(); if (dex.length) { ROWS = ROWS.concat(dex); renderRates(); if (TREE.every((t) => S.tree[t.key] != null)) renderPicks(); }
}
init();
})();
