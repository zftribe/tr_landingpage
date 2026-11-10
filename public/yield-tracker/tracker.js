/* TR Yield Tracker — reads yields.json (official sources, dated), adds live DeFi pools in Advanced view. */
(() => {
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const M = window.YieldMath;
const TODAY_ISO = M.manilaDate();
const TODAY = new Date(TODAY_ISO + 'T00:00:00Z');
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
let TREND_GROUP = false; // Trend column only for groups with 2+ real snapshots
const S = {
  view: 'basic', tax: true, real: false, currency: 'PHP', amount: 100000,
  f: { cat: 'all', kind: 'all', cap: 'all', lock: 'all' }, q: '',
  tree: {}, open: new Set(), openProv: new Set(),
};
try { const v = localStorage.getItem('trYieldView'); if (v === 'advanced') S.view = v; } catch (e) {}

/* ── rate maths ───────────────────────────── */
const TAX = () => (DATA && DATA.rules && DATA.rules.tax && DATA.rules.tax.ratePeso) || 20;
const INFL = () => (DATA && DATA.rules && DATA.rules.inflation && DATA.rules.inflation.value);
const isPeso = (r) => PH_CATS.includes(r.category) && r.currency === 'PHP';
const taxable = (r) => PH_CATS.includes(r.category) && !r.taxExempt; // PH final tax applies to peso AND dollar deposits (RA 12214)
const isUsdBank = (r) => PH_CATS.includes(r.category) && r.currency === 'USD';
const sym = (r) => (r.currency === 'USD' ? '$' : isPeso(r) ? '₱' : '');
function net(rate, r) {
  if (rate == null) return null;
  let n = S.tax && taxable(r) ? rate * (1 - TAX() / 100) : rate;
  if (S.real && isPeso(r) && INFL() != null) n = n - INFL(); // real yield = rate after tax − inflation
  return n;
}
// Amounts are in pesos; crypto caps are in coins, so convert with the BSP rate (stablecoins ≈ US$1).
const FX = () => (DATA && DATA.rules && DATA.rules.fx && DATA.rules.fx.usdphp) || null;
function units(r, pesos) { return M.units(r, pesos, FX()); }
const amountPesos = () => M.toPesos(S.amount, S.currency, FX());
const showMoney = pesos => {
  const n = M.fromPesos(pesos, S.currency, FX());
  const usd = S.currency === 'USD', d = usd ? 2 : 0;
  return n == null ? 'Not available' : (n < 0 ? '−' : '') + (usd ? '$' : '₱') + Math.abs(n).toLocaleString('en-PH', { maximumFractionDigits: d, minimumFractionDigits: d });
};
const scrollMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth';
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
  el.classList.toggle('infl-slim', INFL_MODE === 'a');
  if (INFL_MODE === 'a') { el.innerHTML = `<span class="infl-n">${i.value}%</span><span>PH inflation, ${esc(i.label || i.month)} (<a href="${esc(i.source)}" target="_blank" rel="noopener" style="margin:0">BSP</a>)</span><span class="sep">·</span><span><b>${beat.length} of ${peso.length}</b> peso rates beat it after tax${beatSteady.length ? '' : ', none without a promo, task or lock-up'}</span><span class="sep">·</span><span>Each row shows <span class="badge std">Beats inflation ✓</span> or <span class="badge stale">Below inflation</span></span><a href="#inflation-check">Run the inflation check</a>`; return }
  el.innerHTML = `<div class="infl-head"><div><span class="eyebrow">For savers in the Philippines</span><h3>Have you beaten inflation?</h3>
      <p>Prices rose <b>${i.value}%</b> in the year to ${esc(i.label || i.month)}. To keep your buying power, your rate <b>after tax</b> has to be at least that.
      <b>${beat.length} of ${peso.length}</b> peso rate${peso.length === 1 ? "" : "s"} ${beat.length === 1 ? "does" : "do"} it today${beatSteady.length ? `, and only ${beatSteady.length} without a promo, task or lock-up` : ', and none without a promo, task or lock-up'}.</p></div>
    <div class="infl-chart"><div class="infl-now"><b>${i.value}%</b><small>PH inflation, ${esc(i.label || i.month)}</small></div>${inflSpark(h)}<small class="infl-src">Last 24 months · Source: <a href="${esc(i.source)}" target="_blank" rel="noopener">BSP</a> (CPI ${esc(i.base || '')}) · checked ${fmtDate(i.checkedOn)}</small></div></div>
    <p class="infl-foot">Real yield = rate after tax − inflation. Each peso rate below shows <span class="badge std">Beats inflation ✓</span> or <span class="badge stale">Below inflation</span>. Crypto is paid in dollars, so it isn't compared. This is a comparison, not advice; past inflation doesn't predict future inflation.</p>`;
}
/* ── "Have you beaten inflation?" simulator (Basic + Advanced) ── */
function simRows() { return ROWS.filter((r) => rankable(r) && isPeso(r) && !locked(r) || (rankable(r) && r.category === 'government')).sort((a, b) => b.rate - a.rate); }
function fillSim() {
  const sel = $('#simPick'); if (!sel) return;
  const rows = simRows();
  sel.innerHTML = rows.map((r) => `<option value="${esc(r.id)}">${esc(r.provider)} · ${esc(r.product)} — ${r.upTo ? 'up to ' : ''}${pct2(r.rate)}${r.kind === 'promo' ? ' (promo)' : ''}</option>`).join('') + '<option value="">My own rate…</option>';
  const def = M.bestPlain(ROWS, TODAY_ISO) || rows[0];
  if (def) { sel.value = def.id; $('#simRate').value = def.rate; }
  const i = INFL(); if (i != null) $('#simInfl').value = i;
  const h = ((DATA.rules || {}).inflation || {});
  $('#simExplain').innerHTML = i == null ? '' : `<p><b>Inflation</b> is how fast prices go up. Philippine prices rose <b>${i}%</b> in the year to ${esc(h.label || h.month || '')}: groceries that cost ₱1,000 a year earlier now cost about <b>₱${Math.round(1000 * (1 + i / 100)).toLocaleString('en-PH')}</b>.</p>
    <p><b>Tax</b>: banks keep <b>${TAX()}%</b> of the interest you earn and pay it to the BIR, so a 4% rate pays you about ${pct2(4 * (1 - TAX() / 100))}. Pag-IBIG MP2 is tax-free.</p>
    <p><b>So:</b> if your rate <i>after tax</i> is lower than inflation, your money grows in pesos but buys <b>less</b> every year. Try it below.</p>`;
  $('#simChart').innerHTML = inflSpark((h.history || []).slice(-24), 320, 70) + `<small>PH inflation, last 24 months · Source: <a href="${esc(h.source || '#')}" target="_blank" rel="noopener">BSP</a> · checked ${fmtDate(h.checkedOn)}</small>`;
  sim();
}
function syncSim() {
  const r = ROWS.find((x) => x.id === ($('#calcPick') || {}).value), sp = $('#simPick'); if (!r || !sp) return
  if ([...sp.options].some((o) => o.value === r.id)) sp.value = r.id; else sp.value = ''
  $('#simRate').value = r.rate; const y = Number(($('#calcYears') || {}).value) || 1; $('#simYears').value = y; sim()
}
function sim() {
  const A = amountPesos(), Y = Math.max(1, Math.min(30, Number($('#simYears').value) || 1));
  const pick = ROWS.find((x) => x.id === $('#simPick').value);
  const r = (Number($('#simRate').value) || 0) / 100, i = (Number($('#simInfl').value) || 0) / 100;
  const taxFree = pick ? !taxable(pick) : false, t = $('#simTax').checked && !taxFree ? TAX() / 100 : 0;
  $('#simTaxNote').textContent = taxFree ? '(this one is tax-free)' : '';
  const custom = { rate: r * 100, category: 'digital', currency: 'PHP', kind: 'standard' };
  const minMet = !pick || !pick.minDeposit || (units(pick, A) || 0) >= pick.minDeposit;
  const result = minMet ? M.project(pick || custom, A, Y, ROWS, TODAY_ISO, { ...DATA.rules, inflation: { value: i * 100 } }, $('#simTax').checked) : null;
  if (!result) { ['simGross', 'simTaxAmt', 'simInflAmt', 'simReal'].forEach(id => $('#' + id).textContent = 'Not available'); $('#simVerdict').textContent = !minMet ? 'Your amount is below the published minimum deposit. Choose another product or increase your amount.' : 'A required rate is not published for this amount or period. Choose another product.'; $('#simBar').innerHTML = ''; return; }
  const { gross, balance: netBal, net, tax, realBalance: realBal, realGain, inflationLoss: inflEat } = result;
  const m = showMoney;
  $('#simGross').textContent = m(gross); $('#simTaxAmt').textContent = t ? '−' + m(tax) : m(0);
  $('#simInflAmt').textContent = '−' + m(inflEat); $('#simReal').textContent = (realGain >= 0 ? '+' : '') + m(realGain);
  $('#simRealTile').dataset.good = String(realGain >= 0);
  const tot = Math.max(gross, tax + inflEat, 1), w = (n) => Math.max(0, n / tot * 100).toFixed(1) + '%';
  $('#simBar').innerHTML = `<span class="sb-tax" style="width:${w(tax)}" title="Tax"></span><span class="sb-infl" style="width:${w(Math.min(inflEat, Math.max(net, 0)))}" title="Inflation"></span><span class="sb-real" style="width:${w(Math.max(realGain, 0))}" title="Real gain"></span>${realGain < 0 ? `<span class="sb-loss" style="width:${w(-realGain)}" title="Buying power lost"></span>` : ''}`;
  $('#simVerdict').innerHTML = !A ? 'Enter an amount to see the result.' : realGain >= 0
    ? `<b class="good">You beat inflation.</b> After ${Y} year${Y > 1 ? 's' : ''}, your ${m(A)} grows to ${m(netBal)} after tax. In today's prices that buys what ${m(realBal)} buys now: <b>${m(realGain)} more</b>.`
    : `<b class="bad">Inflation wins.</b> After ${Y} year${Y > 1 ? 's' : ''}, your ${m(A)} grows to ${m(netBal)} after tax, but prices rise faster. It will buy only what ${m(realBal)} buys today: <b>${m(-realGain)} less</b> than now.`;
}
function blended(r, pesos) {
  return M.blended(r, pesos, FX());
}
// Rate over the next 12 months: a promo pays its rate until its end date, then the rate after the promo.
function yearRate(r, amount) {
  return M.yearRate(r, amount, 0, ROWS, TODAY_ISO, FX());
}
const ended = (r) => M.ended(r, TODAY_ISO); // keep the established end-date convention in Manila time
const daysLeft = (r) => (r.promoEnds ? daysBetween(TODAY, new Date(r.promoEnds)) : null);
const staleLimit = (r) => (r.category === 'cex' ? 16 : r.category === 'dex' ? 2 : 35);
const age = (r) => (r.checkedOn ? daysBetween(new Date(r.checkedOn), TODAY) : 999);
const stale = (r) => age(r) > staleLimit(r);
const locked = (r) => r.lockup && !/^flexible/i.test(r.lockup);
const capped = (r) => r.cap != null || (!!r.capText && r.category !== 'dex'); // DeFi capText is pool size, not a cap
const usable = (r) => r.rate != null && r.verified !== false && !ended(r);
const rankable = (r) => usable(r) && !r.teaser && !r.vipOnly && !r.pastReturn;
const pct = (n, d = 2) => (n == null ? '—' : n.toFixed(d).replace(/\.?0+$/, (m) => (m.startsWith('.') ? '' : m)) + '%');
const pct2 = (n) => (n == null ? '—' : n.toFixed(2) + '%');
const money = (n, ccy = '₱') => ccy + Math.round(n).toLocaleString('en-PH');
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—');
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
// Approved referral wording only. Bitget has no approved wording, so it shows none.
const REBATE = { OKX: '20% trading-fee rebate (referral)', MEXC: '20% trading-fee rebate (referral)', Gate: '20% trading-fee rebate (referral)', Bybit: '15% trading-fee discount (referral)', Binance: '5% trading-fee rebate (referral)' };
const fnId = (p) => 'fn-' + String(p.name).toLowerCase().replace(/[^a-z0-9]+/g, '-');
// Opens the partner's own link in a new tab; the button text is the disclosure ("Referral link" / "Partner link").
const fnLink = (p) => p.code
  ? `<span class="ref-code"><span class="ref-lbl">Referral code</span><code>${esc(p.code)}</code><button type="button" class="fn-copy" data-copy="${esc(p.code)}">Copy code</button></span><span class="ref-how">${esc(p.codeHow || 'Enter this referral code when you sign up.')}</span>`
  : `<a class="ref-btn" href="${esc(p.url)}" target="_blank" rel="sponsored noopener">${p.kind === 'bank' ? 'Referral' : 'Partner'} link ↗</a>${p.kind === 'bank' ? '' : '<span class="ref-how">Adults (18+) only</span>'}`;
function renderFootnotes() {
  const el = $('#partnerNotes'); if (!el || !DATA.partners) return;
  const list = Object.entries(DATA.partners).map(([name, p]) => ({ name, ...p }));
  const item = (p) => `<li id="${fnId(p)}"><span class="fn-name">${esc(p.label || p.name)}</span>${p.code
      ? `<span class="fn-code"><code>${esc(p.code)}</code><button type="button" class="fn-copy" data-copy="${esc(p.code)}">Copy code</button></span><span class="fn-how">${esc(p.codeHow || '')} <a href="${esc(p.url)}" target="_blank" rel="noopener">Official site ↗</a></span>`
      : `<a class="fn-url" href="${esc(p.url)}" target="_blank" rel="sponsored noopener">Sign up ↗</a> <small class="fn-dom">${esc(new URL(p.url).hostname.replace(/^www\./, ''))}</small>${REBATE[p.name] ? `<span class="fn-how">${REBATE[p.name]}</span>` : ''}`}</li>`;
  const banks = list.filter((p) => p.kind === 'bank'), ex = list.filter((p) => p.kind !== 'bank');
  // Collapsed by default (George, 9 Nov); the heading and disclosure line always stay visible.
  el.innerHTML = `<div class="fn-head"><h3 class="fn-title">Partner &amp; referral links</h3>
    <button type="button" class="fn-toggle" id="fnToggle" aria-expanded="false" aria-controls="fnBody">Show all ${list.length} links <span aria-hidden="true">▾</span></button></div>
    <p class="fn-lead">Some links on this page are partner or referral links. We may earn a commission or reward if you sign up. It doesn't change the rankings: partners get no boost, and we list the cons as well as the pros.</p>
    <div class="fn-cols" id="fnBody" hidden>
      <div><h4>Banks (referral)</h4><ol class="fn-list">${banks.map(item).join('')}</ol><p class="fn-note">Referral link: we may earn a reward. Check the bank's referral terms and availability.</p></div>
      <div><h4>Crypto exchanges (partner)</h4><ol class="fn-list">${ex.map(item).join('')}</ol><p class="fn-note">Partner link: we may earn a commission. Where a fee rebate or discount applies, it is named next to the exchange; check the offer's terms and availability. Trading involves risk; this is education, not advice. Adults (18+) only.</p></div>
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
    if (S.view === 'basic' && !/^Bitget$/i.test(r.provider) && (r.rate == null || ended(r) || r.teaser || r.vipOnly || (r.category === 'cex' && !r.stablecoin))) return false;
    if (S.view === 'basic' && /^Bitget$/i.test(r.provider) && (r.kind === 'promo' || r.vipOnly)) return false;
    return true;
  });
}

/* ── rate list ────────────────────────────── */
/* Round 6: compact estimate cells (the asterisk points to the note above the list). */
const estCell = (earn, minMet, r) => earn != null ? (r.upTo ? '<small>up to</small>' : '') + '≈ ' + showMoney(earn) + '<sup>*</sup>' : '<small>' + (minMet ? '—' : 'Below minimum') + '</small>'
const estMobile = (earn, minMet, r) => earn != null ? '<small class="m-est">≈ ' + showMoney(earn) + '*</small>' : ''
function rowHTML(r) {
  const n = net(r.rate, r), id = esc(r.id);
  const p = partner(r);
  const base = r.kind === 'promo' ? M.baseProduct(r, ROWS) : null;
  const unavailable = r.rate == null || ended(r);
  const estimate = unavailable ? null : yearRate(r, amountPesos());
  const minMet = !r.minDeposit || (units(r, amountPesos()) || 0) >= r.minDeposit;
  const earn = estimate == null || !minMet ? null : amountPesos() * (S.tax && taxable(r) ? estimate * (1 - TAX() / 100) : estimate) / 100;
  const ry = !unavailable && isPeso(r) && S.view === 'advanced' ? realYield(r) : null;
  const earning = !minMet ? 'Below the minimum deposit' : earn == null ? 'Annual estimate unavailable' : `${r.upTo ? 'Up to ' : ''}${showMoney(earn)} in 12 months${S.tax && taxable(r) ? ' after tax' : ''}, if the rate stays the same`;
  const rateCell = unavailable
    ? `<div class="rate na">Not published${ended(r) ? '<small>Promo ended ' + fmtDate(r.promoEnds) + '</small>' : ''}</div>`
    : `<div class="rate">${r.upTo ? '<small>up to</small>' : ''}${pct2(n)}${S.real && isPeso(r) ? '<small>rate − PH CPI' + (S.tax && taxable(r) ? ', after tax' : '') + '</small>' : S.tax && taxable(r) ? `<small>after tax${isPeso(r) ? '' : ' · ' + esc(r.currency)}</small>` : r.category === 'government' && r.taxExempt ? '<small>tax-free</small>' : isPeso(r) ? '' : `<small>${esc(r.rateBasis || 'APR')} · ${esc(r.currency)}</small>`}</div>`;
  const ins = r.pdic ? '<span class="badge ins" title="PDIC insures up to ₱1,000,000 per depositor, per bank, across all your accounts at that bank">PDIC ₱1M</span>' : r.category === 'cex' || r.category === 'dex' ? '<span class="badge noins">No insurance</span>' : '';
  const st = stale(r) ? '<span class="badge stale">Needs re-check</span>' : '';
  const facts = [
    ['Rate', r.rate == null ? 'Not published' : `${r.upTo ? 'Up to ' : ''}${pct2(r.rate)} ${isPeso(r) ? 'p.a. before tax' : (r.rateBasis || 'APR')}`],
    S.tax && taxable(r) && r.rate != null ? ['After 20% tax', pct2(r.rate * (1 - TAX() / 100))] : null,
    S.view === 'advanced' && realYield(r) != null ? ['Real yield', `${realYield(r) >= 0 ? '+' : ''}${pct2(realYield(r))} (after tax − ${INFL()}% inflation${r.kind === 'promo' ? '; only while the promo lasts' : ''})`] : null,
    r.taxExempt ? ['Tax', esc(r.taxNote || 'Tax-exempt')] : null,
    ['Type', r.kind === 'promo' ? `Promo${r.promoStarts ? ' from ' + fmtDate(r.promoStarts) : ''}${r.promoEnds ? ' until ' + fmtDate(r.promoEnds) : ''}` : 'Standard (ongoing, can change)'],
    r.kind === 'promo' ? ['After the promo', base ? pct2(base.rate) : 'No current rate published'] : null,
    ['Cap', capText(r).replace(/<small>/, ' · ').replace('</small>', '')],
    ['Access', esc(r.lockup || '—')],
    r.minDeposit ? ['Minimum', sym(r) + Number(r.minDeposit).toLocaleString('en-PH') + (sym(r) ? '' : ' ' + r.currency)] : null,
    r.pastReturn ? ['Note', 'Past return, not a promised rate. A fund can go down.'] : null,
    r.interestCredited ? ['Interest paid', esc(r.interestCredited)] : null,
    r.eligibility ? ['Who can get it', esc(r.eligibility)] : null,
    ['Insurance', r.pdic ? 'PDIC member bank: up to ₱1,000,000 per depositor, per bank, counting all your accounts at that bank together' : r.category === 'government' ? 'Not PDIC; backed by the agency' : 'None. Not a bank deposit'],
    ['Checked', `${fmtDate(r.checkedOn)}${stale(r) ? ' (older than our schedule)' : ''}`],
  ].filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  return `<div class="row${TREND_GROUP ? ' has-trend' : ''}${S.open.has(r.id) ? ' open' : ''}${ended(r) ? ' is-ended' : ''}" data-id="${id}">
  <button class="row-main" aria-expanded="${S.open.has(r.id)}" aria-controls="m-${id}">
    <div class="prov"><div class="logo">${logo(r)}</div><div class="prov-txt"><span class="prov-name">${esc(r.provider)}</span><span class="prov-prod">${esc(r.product)}${r.kind === 'promo' ? ' <span class="badge promo">Promo</span>' : ''}${stale(r) ? ' <span class="badge stale">Re-check</span>' : ''}</span></div></div>
    ${rateCell.replace('</div>', estMobile(earn, minMet, r) + '</div>')}
    <div class="c-est">${estCell(earn, minMet, r)}</div>
    <div class="c-cap cell-s">${capText(r)}</div>
    <div class="c-acc cell-s">${esc(locked(r) ? r.lockup : 'Anytime')}<small>${r.pdic ? 'PDIC ₱1M' : r.category === 'government' ? 'Agency-backed' : 'Not insured'}</small></div>
    <div class="c-chk cell-s">${fmtDate(r.checkedOn)}</div>
    <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
  </button>
  <div class="row-more" id="m-${id}">
    <div class="more-grid">
      <div>
        ${r.conditions ? `<h4>What you must do</h4><p>${esc(r.conditions)}</p>` : ''}
        <h4>The fine print</h4><p>${esc(r.finePrint || 'No extra conditions listed on the official page.')}</p>
        ${r.cons ? `<h4>Cons to know</h4><p>${esc(r.cons)}</p>` : ''}
        <div class="more-actions">
          ${cmpBtn(r)}
          ${isUsdBank(r) ? `<a class="btn" href="#fx-check" data-fx="${esc(r.id)}">Peso round trip</a>` : ''}
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
  const earns = ok.map(earnOf).filter((v) => v != null), bestEarn = earns.length ? Math.max(...earns) : null;
  const bits = [
    std ? `Steady <b>${pct2(net(std.rate, std))}</b>` : '',
    promo ? `Promo <b>${pct2(net(promo.rate, promo))}</b>` : '',
  ].filter(Boolean).join(' <span class="dot">·</span> ');
  const ins = r0.pdic ? '<span class="badge ins" title="PDIC insures up to ₱1,000,000 per depositor, per bank, across all your accounts at that bank">PDIC ₱1M</span>' : r0.category === 'cex' || r0.category === 'dex' ? '<span class="badge noins">No insurance</span>' : '';
  return `<div class="prov-card${open ? ' open' : ''}" data-prov="${esc(k)}">
  <button class="prov-head" aria-expanded="${open}" aria-controls="${kid}">
    <div class="prov"><div class="logo">${logo(r0)}</div><div class="prov-txt"><span class="prov-name">${esc(r0.provider)}</span><span class="prov-prod">${rs.length} products</span></div></div>
    <div class="rate">${top ? '<small>best' + (top.upTo || top.tiers ? ' up to' : '') + '</small>' + pct2(net(top.rate, top)) + (bestEarn != null ? '<small class="m-est">≈ ' + showMoney(bestEarn) + '*</small>' : '') : '<span class="na">Not published</span>'}</div>
    <div class="c-est">${bestEarn != null ? (ok.some((r) => r.upTo) ? '<small>up to</small>' : '') + '≈ ' + showMoney(bestEarn) + '<sup>*</sup>' : '<small>—</small>'}</div>
    <div class="prov-sum">${bits} ${ins}</div>
    <svg class="chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>
  </button>
  <div class="prov-body" id="${kid}">${rs.map(rowHTML).join('')}</div>
</div>`;
}
/* Round 5: what the shared amount earns in a year, after tax where it applies (same maths as each row). */
function earnOf(r) {
  if (r.rate == null || ended(r)) return null
  const p = amountPesos(), y = yearRate(r, p)
  if (y == null || (r.minDeposit && (units(r, p) || 0) < r.minDeposit)) return null
  return p * (S.tax && taxable(r) ? y * (1 - TAX() / 100) : y) / 100
}
/* Round 6: Basic is a guided journey. Step 1 Finder, 2 Calculator + inflation, 3 Dollar round trip (pesos only), 4 See the full list. */
const INFL_MODE = new URLSearchParams(location.search).get('infl') === 'b' ? 'b' : 'a'
document.body.dataset.infl = INFL_MODE
const journey = () => {
  const seq = ['#finder', '#calculator']
  if (S.currency === 'USD' && S.tree.where === 'bank') seq.push('#fx-check') // dollars kept at a bank: the exchange round trip
  else if (S.currency === 'PHP' && INFL_MODE === 'a') seq.push('#inflation-check') // pesos: have you beaten inflation?
  seq.push('#nextSteps'); return seq
}
const STEP_LABEL = { '#finder': 'Finder', '#calculator': 'What would it earn?', '#fx-check': 'Dollar round trip', '#inflation-check': 'Have you beaten inflation?', '#nextSteps': 'More analytics' }
const JR_KEY = 'tr-yield-journey'
function saveJourney() {
  try { if (!S.step || S.step < 2) return; localStorage.setItem(JR_KEY, JSON.stringify({ at: Date.now(), step: S.step, tree: S.tree, currency: S.currency, amount: S.amount, pick: ($('#calcPick') || {}).value, years: Number(($('#calcYears') || {}).value) || 1 })) } catch (e) {}
}
const loadJourney = () => { try { const j = JSON.parse(localStorage.getItem(JR_KEY) || 'null'); return j && Date.now() - j.at < 30 * 864e5 ? j : null } catch (e) { return null } }
function applyJourney(j) {
  if (j.currency && j.currency !== S.currency) { S.currency = j.currency }
  if (j.amount) S.amount = j.amount
  S.tree = j.tree || {}; renderTree(); updateAmount()
  if (j.pick) { S.choice = j.pick; renderPicks() }
  if (j.pick && $('#calcPick')) $('#calcPick').value = j.pick
  if (j.years && $('#calcYears')) $('#calcYears').value = j.years
  calc(); const seq = journey(), n = Math.min(j.step || 2, seq.length); setStep(n, seq[n - 1])
}
function restartJourney() {
  try { localStorage.removeItem(JR_KEY) } catch (e) {}
  if (document.body.dataset.flow || S.view !== 'basic') { delete document.body.dataset.flow; setView('basic') }
  S.tree = {}; S.topPick = null; S.choice = null; renderTree(); $('#jrWelcome').hidden = true; setStep(1, '#finder')
}
function renderStrip() {
  const st = $('#jrStrip'); if (!st) return
  const seq = journey(), n = document.body.dataset.flow ? seq.length : Math.min(S.step || 1, seq.length)
  st.hidden = !(S.step >= 2 || document.body.dataset.flow)
  $('#jrStep').textContent = 'Step ' + n + ' of ' + seq.length
  $('#jrLabel').textContent = document.body.dataset.flow ? (innerWidth < 720 ? 'Every rate' : 'Every rate, with its fine print') : (STEP_LABEL[seq[n - 1]] || '')
  $('#jrDots').innerHTML = seq.map((_, i) => '<i class="' + (i < n ? 'on' : '') + '"></i>').join('')
  const ctl = $('#controls'), nav = document.querySelector('.nav'), stickyCtl = ctl && getComputedStyle(ctl).position === 'sticky'
  st.style.top = ((nav ? nav.offsetHeight : 0) + (stickyCtl ? ctl.offsetHeight : 0)) + 'px'
}
/* C: the result card */
function journeyResult() {
  const r = ROWS.find((x) => x.id === ($('#calcPick') || {}).value); if (!r) return null
  const A = amountPesos(), Y = Number($('#calcYears').value) || 1, minMet = !r.minDeposit || (units(r, A) || 0) >= r.minDeposit
  const p = minMet ? M.project(r, A, Y, ROWS, TODAY_ISO, DATA.rules, S.tax) : null; if (!p) return null
  const rt = isUsdBank(r) && S.currency === 'PHP' ? roundTrip(r, A, Y * 12) : null
  return { r, A, Y, p, rt, rate: net(r.rate, r) }
}
function renderCard() {
  const box = $('#jrCard'); if (!box) return
  const x = journeyResult(); if (!x) { box.innerHTML = ''; return }
  const { r, A, Y, p } = x, yrs = Y === 1 ? '12 months' : Y + ' years'
  const rows = ['<div><span>Interest after tax</span><strong>' + showMoney(p.net) + '</strong></div>']
  if (p.realGain != null) rows.push('<div><span>Inflation (' + INFL() + '%) takes</span><strong class="bad">−' + showMoney(p.inflationLoss) + '</strong></div>', '<div><span>Real buying power</span><strong class="' + (p.realGain < 0 ? 'bad' : 'good') + '">' + (p.realGain < 0 ? '−' : '+') + showMoney(Math.abs(p.realGain)) + '</strong></div>')
  box.innerHTML = '<div class="jr-card-in"><div class="jr-card-top"><span>My savings check</span><span>Trading Republic</span></div>' +
    '<h3>' + showMoney(A) + ' could earn <em>' + showMoney(p.net) + '</em> in ' + yrs + '</h3>' +
    '<small>' + esc(r.provider) + ' · ' + esc(r.product) + ' · ' + pct2(x.rate) + (S.tax && taxable(r) ? ' after 20% tax' : '') + ' · if the rate stays the same</small>' +
    '<div class="jr-rows">' + rows.join('') + '</div>' +
    '<small>Rates checked ' + fmtDate(r.checkedOn) + ' · welcome.tradingrepublic.io/yield-tracker · not financial advice</small>' +
    '<div class="jr-card-act"><button type="button" class="btn gold" data-jr="save">Save image</button><button type="button" class="btn" data-jr="share">Share</button><button type="button" class="btn" data-jr="link">Copy link</button><span class="jr-toast" id="jrToast" role="status"></span></div></div>'
}
function journeyLink() {
  const q = new URLSearchParams({ amt: String(S.amount), ccy: S.currency, ...S.tree, pick: ($('#calcPick') || {}).value || '', y: ($('#calcYears') || {}).value || '1' })
  return location.origin + location.pathname + '?' + q.toString()
}
function shareText() { const x = journeyResult(); if (!x) return ''; return 'My savings check on the TR Yield Tracker: ' + showMoney(x.A) + ' could earn about ' + showMoney(x.p.net) + ' in ' + (x.Y === 1 ? '12 months' : x.Y + ' years') + ' at ' + x.r.provider + ' (after tax, if the rate stays the same).' + (x.p.realGain != null ? ' After ' + INFL() + '% inflation: ' + (x.p.realGain < 0 ? '−' : '+') + showMoney(Math.abs(x.p.realGain)) + ' in buying power.' : '') + ' Not financial advice.' }
function toast(t) { const el = $('#jrToast'); if (el) { el.textContent = t; clearTimeout(el._t); el._t = setTimeout(() => (el.textContent = ''), 2600) } }
function saveCardImage() {
  const x = journeyResult(); if (!x) return
  const c = document.createElement('canvas'), W = 1080, H = 1080; c.width = W; c.height = H; const g = c.getContext('2d')
  const grd = g.createRadialGradient(0, 0, 0, 0, 0, 1100); grd.addColorStop(0, '#2a2110'); grd.addColorStop(1, '#0b0b0f'); g.fillStyle = grd; g.fillRect(0, 0, W, H)
  g.strokeStyle = '#F9A825'; g.lineWidth = 4; g.strokeRect(40, 40, W - 80, H - 80)
  const T = (t, x0, y, font, col, al) => { g.font = font; g.fillStyle = col; g.textAlign = al || 'left'; g.fillText(t, x0, y) }
  T('MY SAVINGS CHECK', 100, 150, '800 34px "Plus Jakarta Sans", sans-serif', '#F9A825'); T('TRADING REPUBLIC', W - 100, 150, '800 30px "Plus Jakarta Sans", sans-serif', '#F9A825', 'right')
  T(showMoney(x.A) + ' could earn', 100, 300, '800 66px "Plus Jakarta Sans", sans-serif', '#f5f5f7')
  T(showMoney(x.p.net), 100, 400, '800 96px "Plus Jakarta Sans", sans-serif', '#22c55e'); T('in ' + (x.Y === 1 ? '12 months' : x.Y + ' years'), 100, 470, '700 46px "Plus Jakarta Sans", sans-serif', '#f5f5f7')
  T(x.r.provider + ' · ' + pct2(x.rate) + (S.tax && taxable(x.r) ? ' after 20% tax' : ''), 100, 550, '500 34px "DM Sans", sans-serif', '#cbcbd7')
  let y = 660; const line = (k, v, col) => { T(k, 100, y, '500 36px "DM Sans", sans-serif', '#cbcbd7'); T(v, W - 100, y, '700 40px "DM Sans", sans-serif', col, 'right'); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(100, y + 22, W - 200, 2); y += 84 }
  line('Interest after tax', showMoney(x.p.net), '#f5f5f7')
  if (x.p.realGain != null) { line('Inflation (' + INFL() + '%) takes', '−' + showMoney(x.p.inflationLoss), '#ef4444'); line('Real buying power', (x.p.realGain < 0 ? '−' : '+') + showMoney(Math.abs(x.p.realGain)), x.p.realGain < 0 ? '#ef4444' : '#22c55e') }
  T('If the rate stays the same. Rates checked ' + fmtDate(x.r.checkedOn) + '. Not financial advice.', 100, H - 130, '500 26px "DM Sans", sans-serif', '#85859a')
  T('welcome.tradingrepublic.io/yield-tracker', 100, H - 86, '700 28px "DM Sans", sans-serif', '#F9A825')
  c.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'tr-savings-check.png'; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove() }, 1000); toast('Image saved') }, 'image/png')
}
async function copyLink() {
  const u = journeyLink()
  try { await Promise.race([navigator.clipboard.writeText(u), new Promise((_, no) => setTimeout(() => no(new Error('slow')), 1500))]); toast('Link copied'); return } catch (e) {}
  // no clipboard access: show the link, selected, so it can be copied by hand
  let box = document.getElementById('jrLinkBox'); if (!box) { box = document.createElement('input'); box.id = 'jrLinkBox'; box.className = 'jr-linkbox'; box.readOnly = true; box.setAttribute('aria-label', 'Link to this result'); const act = document.querySelector('.jr-card-act'); if (act) act.after(box) }
  box.value = u; box.focus(); box.select(); toast('Copy the link below')
}
async function shareCard() { const data = { title: 'My savings check', text: shareText(), url: journeyLink() }; if (navigator.share) { try { await navigator.share(data); return } catch (e) { if (e && e.name === 'AbortError') return } } copyLink() }
const STEP_SECTIONS = ['#finder', '#calculator', '#fx-check', '#inflation-check', '#nextSteps']
const NEXT_LABEL = { '#fx-check': 'Next: does a dollar account pay after the exchange? →', '#inflation-check': 'Next: have you beaten inflation? →', '#nextSteps': 'Next: more analytics →' }
function setStep(n, go) {
  S.step = n; const seq = journey()
  if (S.view === 'basic' && seq.includes('#inflation-check') && !S.inflTouched) { const t = $('#calcInflToggle'), c = $('#calculator'); if (t && c) { t.checked = false; c.classList.add('no-infl') } }
  STEP_SECTIONS.forEach((sel) => { const el = $(sel); if (!el) return; const i = seq.indexOf(sel)
    el.classList.toggle('jhide', i < 0 || i >= n)
    el.querySelectorAll('[data-step-of]').forEach((t) => (t.textContent = i < 0 ? '' : 'Step ' + (i + 1) + ' of ' + seq.length + ' · ')) })
  const nb = $('#nextFromCalc'); if (nb) nb.textContent = NEXT_LABEL[seq[2]]
  { const hostSel = seq[seq.length - 2], host = $(hostSel), box = $('#jrCardHost'), nx = host && host.querySelector('.step-next')
    if (box && host) { if (nx) host.insertBefore(box, nx); else host.appendChild(box) }
    if (box) box.hidden = !(n >= seq.length - 1); if (n >= seq.length - 1) renderCard() }
  if (seq.includes('#inflation-check') && n >= seq.indexOf('#inflation-check') + 1) syncSim()
  renderStrip(); saveJourney()
  if (go) { const el = $(go); if (el) { el.classList.remove('step-in'); void el.offsetWidth; el.classList.add('step-in'); setTimeout(() => el.scrollIntoView({ behavior: scrollMotion(), block: 'start' }), 60) } }
}
const SORTS = { rate: null, earn: (r) => earnOf(r) ?? -1, min: (r) => (r.rate == null ? -1e12 : -((r.minDeposit || 0) * (isPeso(r) ? 1 : (FX() || 60)))), checked: (r) => (r.checkedOn ? Date.parse(r.checkedOn) : 0) }
document.addEventListener('toggle', (e) => { const d = e.target; if (!d || !d.matches || !d.matches('details.np-more')) return; S.npOpen = S.npOpen || new Set(); d.open ? S.npOpen.add(d.dataset.np) : S.npOpen.delete(d.dataset.np) }, true)
function renderRates() {
  const list = visibleRows();
  const sortKey = (r) => (r.rate == null ? -1 : ended(r) ? -0.5 : net(r.rate, r));
  const headFor = (cat) => `<div class="rate-columns"><div class="row-main" aria-hidden="true"><div>Provider</div><div>${S.real && PH_CATS.includes(cat) ? 'Rate − CPI' : S.tax && PH_CATS.includes(cat) && cat !== 'government' ? 'After tax' : 'Rate'}</div><div class="c-est">Your 12 months*</div><div class="c-cap">Cap</div><div class="c-acc">Access</div><div class="c-chk">Checked</div><div></div></div></div>`;
  let html = '';
  for (const cat of ORDER) {
    const sk = S.view === 'advanced' && SORTS[S.sort] ? SORTS[S.sort] : sortKey
    const g = list.filter((r) => r.category === cat).sort((a, b) => sk(b) - sk(a) || sortKey(b) - sortKey(a));
    if (!g.length) continue;
    { const np = new Set(g.map((r) => r.provider)).size; html += `<div class="rgroup-title">${CAT_LABEL[cat]} <span>${np} provider${np > 1 ? 's' : ''} · ${g.length} rate${g.length > 1 ? 's' : ''}</span></div>`; }
    if (CAT_NOTE[cat]) html += `<p class="rgroup-note">${CAT_NOTE[cat]}</p>`;
    TREND_GROUP = g.some(r => (r.history || []).length >= 2);
    { const gp = groupByProvider(g), np = gp.filter((p) => p.rs.every((r) => r.rate == null)), pub = gp.filter((p) => !np.includes(p))
      html += headFor(cat, TREND_GROUP) + pub.map(provHTML).join('')
      if (np.length) html += `<details class="np-more" data-np="${cat}"${S.npOpen && S.npOpen.has(cat) ? ' open' : ''}><summary><b>${np.length} more ${np.length > 1 ? 'don’t' : 'doesn’t'} publish a rate online</b><span>${np.slice(0, 4).map((p) => esc(p.rs[0].provider)).join(', ')}${np.length > 4 ? '…' : ''}</span><i>Show</i></summary>${np.map(provHTML).join('')}</details>` }
    TREND_GROUP = false;
  }
  $('#rates').innerHTML = html ? '<p class="est-note">* What ' + showMoney(amountPesos()) + ' would earn in 12 months, after the 20% PH tax where it applies, if the rate stays the same.</p>' + html : '<p class="no-picks">No rates match these filters.</p>';
  const hidden = ROWS.filter((r) => r.rate == null || r.teaser || r.vipOnly || (r.category === 'cex' && !r.stablecoin)).length;
  $('#ratesFoot').innerHTML = S.view === 'basic' && hidden ? `Basic view hides ${hidden} rows: VIP-only offers, tiny-cap teasers, and products that only show a rate inside their app. <a href="#" data-goadv>Switch to Advanced</a> to see them.` : '';
}

/* ── finder (tech tree) ───────────────────── */
const TREE = [
  { key: 'where', label: 'Where', sub: 'Pick your world', nodes: () => S.currency === 'USD' ? [
    ['bank', '🏦', 'Bank (USD)', 'PDIC-insured up to ₱1M'],
    ['crypto', '🪙', 'Crypto exchange', 'Stablecoins · not insured'],
    ['defi', '🧩', 'DeFi on Solana', 'Not insured · advanced'],
    ['both', '↔', 'Show me all', 'Banks and crypto side by side'],
  ] : [
    ['bank', '₱', 'Peso savings', 'Banks, digital banks, MP2'],
    ['crypto', '🪙', 'Crypto exchange', 'OKX, Bybit, Gate and more'],
    ['defi', '🧩', 'DeFi on Solana', 'Kamino, Jupiter · advanced'],
    ['both', '↔', 'Compare both', 'Different currencies and risks'],
  ] },
  { key: 'access', label: 'Access', sub: 'When you need it back', nodes: [
    ['flex', '🔓', 'Anytime', 'Withdraw whenever'],
    ['lock', '🔒', 'I can lock it', 'Months or longer'],
    ['any', '↔️', 'Either is fine', ''],
  ] },
  { key: 'promo', label: 'Promos', sub: 'Short boosts or steady', nodes: [
    ['ok', '⚡', 'Promos are fine', 'I will move my money'],
    ['no', '🌳', 'Steady rates only', 'No end dates'],
  ] },
  { key: 'strings', label: 'Strings', sub: 'Tasks to earn the rate', nodes: [
    ['ok', '✅', 'Tasks are OK', 'Spend, keep a balance'],
    ['no', '🧘', 'No strings', 'Just park it'],
  ] },
];
/* ── Dollar round trip (George, 10 Nov): ₱ → $ at the bank's selling rate, earn, $ → ₱ at its buying rate ── */
const MID = () => FX();
const hasBoard = (r) => isUsdBank(r) && r.fxBuy > 0 && r.fxSell > 0;
const usdNet = (r, pesos) => { const y = yearRate(r, pesos); return y == null ? null : taxable(r) ? y * (1 - TAX() / 100) : y; };
function roundTrip(r, pesos, months) {
  if (!hasBoard(r) || !(pesos > 0)) return null;
  const usd = pesos / r.fxSell, nr = usdNet(r, pesos) || 0;
  const intUsd = usd * nr / 100 * months / 12;              // simple interest, no compounding
  const cost = pesos - usd * r.fxBuy;                      // what the two conversions alone cost
  const intPhp = intUsd * r.fxBuy;
  const perMonth = usd * r.fxBuy * nr / 100 / 12;
  return { usd, nr, cost, costPct: cost / pesos * 100, intPhp, net: intPhp - cost, be: perMonth > 0 ? cost / perMonth : Infinity };
}
const beText = (m) => (!isFinite(m) ? 'never, at this rate' : m < 1 ? 'under a month' : 'about ' + Math.ceil(m) + ' month' + (Math.ceil(m) === 1 ? '' : 's'));
const fxBoardRows = () => ((DATA.rules && DATA.rules.fxBoard && DATA.rules.fxBoard.banks) || []);
function renderFx() {
  const box = $('#fxOut'); if (!box) return;
  const pesos = parseAmount($('#fxAmt').value), months = Number($('#fxMonths').value) || 12;
  const r = ROWS.find((x) => x.id === $('#fxPick').value);
  if (!r) { box.innerHTML = '<p class="fx-verdict none">Pick a bank dollar account above.</p>'; return; }
  const x = roundTrip(r, pesos, months);
  if (!x) { box.innerHTML = '<p class="fx-verdict none">' + 'We could not find ' + esc(r.provider) + '\'s dollar buying and selling rates on its official site, so we can\'t work out the exchange cost. Ask the bank for its rate before you convert.</p>'; return; }
  const sign = (n) => (n >= 0 ? '+' : '−') + money(Math.abs(n));
  const tiles = [['Exchange round trip costs', money(x.cost), x.costPct.toFixed(2) + '% of your pesos'], ['Interest after tax, ' + months + ' mo', money(x.intPhp), pct2(x.nr) + ' a year in dollars'], ['Break-even', beText(x.be), 'of interest to cover the spread'], ['Net after ' + months + ' months', sign(x.net), x.net >= 0 ? 'gain' : 'loss']];
  const ladder = [3, 6, 12, 24, 36].map((m) => { const y = roundTrip(r, pesos, m); return '<li class="' + (y.net >= 0 ? 'up' : 'down') + '"><b>' + m + ' mo</b><span>' + sign(y.net) + '</span></li>'; }).join('');
  box.innerHTML = '<div class="fx-tiles">' + tiles.map((q, i) => '<div class="st' + (i === 3 ? (x.net >= 0 ? ' st-real' : ' st-loss') : '') + '"><small>' + q[0] + '</small><b>' + q[1] + '</b><span>' + q[2] + '</span></div>').join('') + '</div>' +
    '<p class="fx-verdict ' + (x.net >= 0 ? 'up' : 'down') + '">' + (isFinite(x.be) ? 'You need ' + beText(x.be) + ' of interest just to cover the exchange spread. ' : 'At this rate the interest never covers the exchange spread. ') +
    'Holding ' + months + ' months: ' + (x.net >= 0 ? 'about <b>' + money(x.net) + ' net gain</b>.' : 'you\'d lose about <b>' + money(-x.net) + ' net</b>.') + '</p>' +
    '<ul class="fx-ladder" aria-label="Net result by holding time">' + ladder + '</ul>' +
    '<p class="fx-note">' + esc(r.provider) + ' sells dollars at ₱' + r.fxSell.toFixed(2) + ' and buys them back at ₱' + r.fxBuy.toFixed(2) + ' (' + esc(r.fxBasis || 'board rate') + ', checked ' + fmtDate(r.fxAsOf) + (r.fxSource ? ', <a href="' + esc(r.fxSource) + '" target="_blank" rel="noopener">official page ↗</a>' : '') + '). <b>This assumes the exchange rate itself does not move.</b> If the peso weakens you gain more; if it strengthens you can lose more. It is not a forecast. Simple interest, 20% PH tax taken off the dollar interest.</p>';
}
function fillFx() {
  const sel = $('#fxPick'); if (!sel) return;
  const opts = ROWS.filter((r) => isUsdBank(r) && rankable(r) && !locked(r)).concat(ROWS.filter((r) => isUsdBank(r) && rankable(r) && locked(r)));
  sel.innerHTML = opts.map((r) => '<option value="' + esc(r.id) + '">' + esc(r.provider) + ' · ' + esc(r.product) + ' — ' + pct2(r.rate) + (hasBoard(r) ? '' : ' (exchange rate not found)') + '</option>').join('') || '<option value="">No bank dollar rates yet</option>';
  const best = opts.filter(hasBoard).sort((a, b) => roundTrip(b, 100000, 12).net - roundTrip(a, 100000, 12).net)[0];
  if (best) sel.value = best.id;
  const bd = fxBoardRows(), mid = MID(), tb = $('#fxBoard');
  if (tb) tb.innerHTML = bd.length ? '<table class="cmp-table fx-table"><thead><tr><th>Bank</th><th>Sells $ at</th><th>Buys $ at</th><th>Spread vs BSP</th><th>Round trip on $1,000</th></tr></thead><tbody>' +
    bd.slice().sort((a, b) => (a.sell && b.sell ? (a.sell - a.buy) - (b.sell - b.buy) : a.sell ? -1 : 1)).map((b) => b.buy && b.sell
      ? '<tr><td>' + esc(b.provider) + (b.category === 'remittance' ? ' <small>(not a bank)</small>' : '') + '</td><td>₱' + b.sell.toFixed(2) + '</td><td>₱' + b.buy.toFixed(2) + '</td><td>' + (mid ? '+' + ((b.sell - mid) / mid * 100).toFixed(2) + '% / −' + ((mid - b.buy) / mid * 100).toFixed(2) + '%' : '—') + '</td><td><b>' + money((b.sell - b.buy) * 1000) + '</b></td></tr>'
      : '<tr><td>' + esc(b.provider) + '</td><td colspan="4" class="dim">Not found on its official site</td></tr>').join('') + '</tbody></table><p class="fx-note">Board rates checked ' + fmtDate((DATA.rules.fxBoard || {}).checkedOn) + '. BSP reference rate ₱' + (mid || '—') + ' per $1 (' + fmtDate((DATA.rules.fx || {}).asOf) + ') is the midpoint. Banks change these rates during the day; your branch or app may differ.</p>' : '';
}

/* ── Comparator + best match (George, 10 Nov) ── */
const CMP = { ids: [], ccy: 'php', amount: 100000, promo: true, tasks: true, insured: false, flex: false, open: false };
const CMP_MAX = 3;
const cmpBtn = (r) => (!usable(r) || r.pastReturn ? '' : `<button type="button" class="cmp-btn" data-cmp="${esc(r.id)}" aria-pressed="${CMP.ids.includes(r.id)}">${CMP.ids.includes(r.id) ? '✓ Comparing' : '+ Compare'}</button>`);
const riskOf = (r) => r.pdic ? ['Low', 'PDIC-insured up to ₱1M per depositor, per bank'] : r.category === 'government' ? ['Low', 'Backed by the agency, not PDIC'] : r.category === 'cex' ? ['Higher', 'Exchange risk; not insured'] : r.category === 'dex' ? ['Highest', 'Smart-contract risk; not insured'] : ['Medium', 'Not a bank deposit'];
function cmpEarn(r, pesos) {
  if (CMP.ccy === 'php' && isUsdBank(r)) { const x = roundTrip(r, pesos, 12); return x ? { n: x.net / pesos * 100, earn: x.net, rt: x } : null; } const y = yearRate(r, pesos); const n = r.rate == null ? null : (taxable(r) ? y * (1 - TAX() / 100) : y); return n == null ? null : { n, earn: pesos * n / 100 }; }
function syncCmp() {
  document.querySelectorAll('[data-cmp]').forEach((b) => { const on = CMP.ids.includes(b.dataset.cmp); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '✓ Comparing' : '+ Compare'; });
  const tray = $('#cmpTray'); if (!tray) return;
  tray.hidden = !CMP.ids.length;
  $('#cmpCount').textContent = CMP.ids.length + ' of ' + CMP_MAX;
  $('#cmpNames').textContent = CMP.ids.map((id) => (ROWS.find((r) => r.id === id) || {}).provider).filter(Boolean).join(' · ');
  $('#cmpOpen').disabled = CMP.ids.length < 2;
  $('#cmpOpen').textContent = CMP.ids.length < 2 ? 'Pick one more to compare' : 'Compare side by side';
  if (CMP.open) renderCmp();
}
function renderCmp() {
  const box = $('#cmpPanel'); if (!box) return;
  box.hidden = !CMP.open; if (!CMP.open) return;
  const usd = CMP.ccy === 'usd', fx = FX() || 1, pesos = (Number(CMP.amount) || 0) * (usd ? fx : 1);
  const show = (p) => (usd ? '$' + (p / fx).toLocaleString('en-US', { maximumFractionDigits: 0 }) : money(p));
  const rows = CMP.ids.map((id) => ROWS.find((r) => r.id === id)).filter(Boolean);
  const res = rows.map((r) => {
    const e = cmpEarn(r, pesos), why = [];
    if (ended(r)) why.push('promo ended');
    if (!CMP.promo && r.kind === 'promo') why.push('a promo');
    if (!CMP.tasks && r.strings) why.push('needs tasks');
    if (CMP.insured && !r.pdic) why.push('not insured');
    if (CMP.flex && locked(r)) why.push('locked for ' + r.lockup);
    const u = units(r, pesos);
    if (r.minDeposit && u != null && u < r.minDeposit) why.push('below the ' + sym(r) + Number(r.minDeposit).toLocaleString('en-PH') + ' minimum');
    if (r.maxDeposit && u != null && u > r.maxDeposit) why.push('above this band');
    if (CMP.ccy === 'php' && isUsdBank(r) && !hasBoard(r)) why.push('no published exchange rate found, so the conversion cost is unknown');
    return { r, e, out: why };
  });
  const ok = res.filter((x) => !x.out.length && x.e && x.e.earn > 0).sort((a, b) => b.e.earn - a.e.earn);
  const best = ok[0], second = ok[1];
  const tie = best && second && Math.abs(best.e.earn - second.e.earn) <= Math.max(1, best.e.earn * 0.02);
  const what = rows.every(taxable) ? 'after-tax earnings' : rows.some(taxable) ? 'earnings after the PH tax on bank interest' : 'earnings';
  const scope = [CMP.insured ? 'insured options' : 'the options you picked', !CMP.promo ? 'without promos' : '', !CMP.tasks ? 'with no tasks' : '', CMP.flex ? 'that you can withdraw anytime' : ''].filter(Boolean).join(' ');
  const caveat = (x) => [x.r.kind === 'promo' ? (x.r.promoEnds ? 'promo ends ' + fmtDate(x.r.promoEnds) : 'promo can end anytime') : '', !x.r.pdic && x.r.category !== 'government' ? 'not insured' : '', locked(x.r) ? 'locked for ' + x.r.lockup : '', x.r.upTo ? '"up to" rate: you may get less' : '', x.r.newUsersOnly ? 'new users only' : '', CMP.ccy === 'php' && (x.r.category === 'cex' || x.r.category === 'dex') ? 'peso-to-crypto conversion cost not counted' : '', x.e && x.e.rt ? 'exchange spread of ' + money(x.e.rt.cost) + ' already taken off' : '', x.r.strings && !x.r.newUsersOnly ? 'needs tasks' : ''].filter(Boolean).join(' · ');
  const verdict = !best ? '<p class="cmp-verdict none">No best match: none of these fits your choices. Try allowing promos or tasks, or turn off "insured only" or "withdraw anytime".</p>'
    : tie ? `<p class="cmp-verdict"><b>Tie:</b> ${esc(best.r.provider)} and ${esc(second.r.provider)} earn about the same (${show(best.e.earn)} vs ${show(second.e.earn)}) on ${show(pesos)} over 12 months among ${scope}. Pick on access and risk.</p>`
    : `<p class="cmp-verdict"><b>Best match: ${esc(best.r.provider)} · ${esc(best.r.product)}</b>: highest ${what} on ${show(pesos)} over 12 months among ${scope}, on today's checked data and if the rates stay the same (${show(best.e.earn)}).${caveat(best) ? ' <span class="cmp-cav">Keep in mind: ' + esc(caveat(best)) + '.</span>' : ''}</p>`;
  const td = (x, f) => '<td' + (best && !tie && x === best ? ' class="win"' : '') + '>' + f(x) + '</td>';
  const line = (label, f) => '<tr><th scope="row">' + label + '</th>' + res.map((x) => td(x, f)).join('') + '</tr>';
  $('#cmpBody').innerHTML = verdict + '<div class="cmp-scroll"><table class="cmp-table"><thead><tr><th scope="col"><span class="sr">Feature</span></th>' + res.map((x) => '<th scope="col"' + (best && !tie && x === best ? ' class="win"' : '') + '>' + (best && !tie && x === best ? '<span class="badge std">Best match</span>' : '') + '<div class="cmp-h"><div class="logo">' + logo(x.r) + '</div><div><b>' + esc(x.r.provider) + '</b><small>' + esc(x.r.product) + '</small></div></div><button type="button" class="cmp-x" data-cmp="' + esc(x.r.id) + '" aria-label="Remove ' + esc(x.r.provider) + '">Remove</button></th>').join('') + '</tr></thead><tbody>' +
    line('Currency', (x) => esc(x.r.currency)) +
    line('Rate', (x) => (x.r.upTo ? 'up to ' : '') + pct2(x.r.rate) + ' ' + (isPeso(x.r) || isUsdBank(x.r) ? 'p.a.' : esc(x.r.rateBasis || 'APR'))) +
    line('After tax', (x) => taxable(x.r) ? pct2(x.r.rate * (1 - TAX() / 100)) : x.r.taxExempt ? 'tax-free' : pct2(x.r.rate) + ' <small>no PH tax applied</small>') +
    line('Earns in 12 months', (x) => x.e ? '<b>' + (x.e.earn < 0 ? '−' + show(-x.e.earn) : show(x.e.earn)) + '</b>' + (x.e.rt ? '<small>after the exchange round trip</small>' : '') + (x.r.kind === 'promo' && (x.r.promoEnds || x.r.promoDays) ? '<small>promo counted only until it ends</small>' : '') : '—') +
    (CMP.ccy === 'php' && res.some((x) => isUsdBank(x.r)) ? line('Exchange round trip', (x) => isUsdBank(x.r) ? (x.e && x.e.rt ? money(x.e.rt.cost) + ' <small>' + x.e.rt.costPct.toFixed(2) + '% · ₱→$→₱ at the bank\'s rates</small>' : 'Not published') : isPeso(x.r) ? 'None' : '<small>not counted</small>') + line('Break-even', (x) => x.e && x.e.rt ? beText(x.e.rt.be) : '—') : '') +
    line('Cap', (x) => capText(x.r)) +
    line('Minimum', (x) => x.r.minDeposit ? sym(x.r) + Number(x.r.minDeposit).toLocaleString('en-PH') + (sym(x.r) ? '' : ' ' + x.r.currency) : '—') +
    line('Access', (x) => esc(locked(x.r) ? x.r.lockup : 'Withdraw anytime')) +
    line('Insurance', (x) => esc(riskOf(x.r)[1])) +
    line('Risk level', (x) => '<span class="risk risk-' + riskOf(x.r)[0].toLowerCase() + '">' + riskOf(x.r)[0] + '</span>') +
    line('Type', (x) => kindBadge(x.r)) +
    line('Fine print', (x) => [x.r.strings ? 'needs tasks' : '', x.r.vipOnly ? 'VIP only' : '', x.r.newUsersOnly ? 'new users only' : '', x.r.upTo ? '"up to" rate' : ''].filter(Boolean).join(' · ') || '—') +
    line('Fits your choices', (x) => x.out.length ? '<span class="cmp-out">No: ' + esc(x.out.join(', ')) + '</span>' : '<span class="cmp-in">Yes</span>') +
    line('Checked', (x) => fmtDate(x.r.checkedOn)) +
    '</tbody></table></div>' +
    '<p class="cmp-note">' + (rows.some((r) => !isPeso(r)) || usd ? 'Dollar and peso amounts are converted at the BSP rate of ₱' + fx + ' per $1 (' + fmtDate((DATA.rules.fx || {}).asOf) + '). ' : '') + (CMP.ccy === 'php' && res.some((x) => isUsdBank(x.r)) ? 'Dollar accounts started from pesos count the bank\'s own buy/sell spread and assume the exchange rate does not move. ' : '') + 'Best match is based only on your inputs and the rates we checked, after the 20% PH tax on bank interest (crypto is not adjusted for tax). Partners get no boost. This is a comparison, not advice; rates can change any time.</p>';
}
function wireCmp() {
  document.addEventListener('click', (e) => {
    const fxl = e.target.closest('[data-fx]'); if (fxl) { $('#fxPick').value = fxl.dataset.fx; renderFx(); return; }
    const b = e.target.closest('[data-cmp]');
    if (b) { e.preventDefault(); e.stopPropagation(); const id = b.dataset.cmp, i = CMP.ids.indexOf(id);
      if (i >= 0) CMP.ids.splice(i, 1); else if (CMP.ids.length < CMP_MAX) CMP.ids.push(id); else { $('#cmpNames').textContent = 'You can compare up to 3. Remove one first.'; return; }
      if (CMP.ids.length < 2) CMP.open = false; syncCmp(); return; }
    if (e.target.closest('#cmpOpen')) { if (S.view === 'basic') { document.body.dataset.flow = journey().includes('#fx-check') ? 'fx' : 'journey'; setView('advanced') } CMP.open = true; const r0 = ROWS.find((r) => r.id === CMP.ids[0]); if (r0 && !isPeso(r0)) { CMP.ccy = 'usd'; CMP.amount = 1000; $('#cmpAmt').value = fmtAmount(1000); } syncCmpForm(); syncCmp(); setTimeout(() => { const pn = $('#cmpPanel'), off = [...document.querySelectorAll('.nav, #controls, #jrStrip')].reduce((t, el) => t + (el && !el.hidden && getComputedStyle(el).display !== 'none' && getComputedStyle(el).position !== 'static' ? el.offsetHeight : 0), 0); scrollTo({ top: pn.getBoundingClientRect().top + scrollY - off - 12, behavior: scrollMotion() }) }, 80); return; }
    if (e.target.closest('#cmpClear')) { CMP.ids = []; CMP.open = false; syncCmp(); return; }
    if (e.target.closest('#cmpClose')) { CMP.open = false; syncCmp(); return; }
    const c = e.target.closest('[data-ccy]'); if (c) { CMP.ccy = c.dataset.ccy; CMP.amount = CMP.ccy === 'usd' ? 1000 : 100000; $('#cmpAmt').value = fmtAmount(CMP.amount); syncCmpForm(); renderCmp(); }
  }, true);
  { const ca = $('#cmpAmt'); if (ca) { ca.addEventListener('change', () => (ca.value = fmtAmount(parseAmount(ca.value)))); ca.addEventListener('focus', () => ca.select()) } }
  ['cmpAmt', 'cmpPromo', 'cmpTasks', 'cmpIns', 'cmpFlex'].forEach((id) => { const el = $('#' + id); if (el) el.addEventListener('input', () => { CMP.amount = parseAmount($('#cmpAmt').value); CMP.promo = $('#cmpPromo').checked; CMP.tasks = $('#cmpTasks').checked; CMP.insured = $('#cmpIns').checked; CMP.flex = $('#cmpFlex').checked; renderCmp(); }); });
}
function syncCmpForm() { document.querySelectorAll('[data-ccy]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.ccy === CMP.ccy))); $('#cmpSym').textContent = CMP.ccy === 'usd' ? '$' : '₱'; }
function renderTree() {
  let html = '', reached = true;
  TREE.forEach((t, i) => {
    if (!reached) return;
    const val = S.tree[t.key];
    html += `<div class="tier${val != null ? ' dim' : ''}" data-tier="${t.key}"><div class="tier-label">${i + 1}. ${t.label}<small>${t.sub}</small></div>`;
    html += `<div class="nodes">${(typeof t.nodes === 'function' ? t.nodes() : t.nodes).map(([v, ic, b, s]) => `<button class="node" data-k="${t.key}" data-v="${v}" aria-pressed="${val === v}"><span class="ic" aria-hidden="true">${ic}</span><span><b>${b}</b>${s ? `<span class="sub">${s}</span>` : ''}</span></button>`).join('')}</div>`;
    html += '</div>';
    reached = val != null;
  });
  $('#tree').innerHTML = html;
  const done = TREE.every((t) => S.tree[t.key] != null);
  $('#treeResult').hidden = !done;
  if (done) renderPicks();
}
/* Round 13 A: in the step 4 card, the best rates the answers left out (same currency and "where", access/promo/strings answers relaxed) */
function renderNextTop() {
  const box = $('#nextTop'); if (!box) return
  const T = S.tree, usd = S.currency === 'USD', amt = amountPesos(), skip = new Set(S.topProv || [])
  if (!T.where) { box.hidden = true; return }
  const pool = ROWS.filter((r) => {
    if (!rankable(r) || r.pastReturn || skip.has(r.provider)) return false
    if ((r.category === 'cex' || r.category === 'dex') && !r.stablecoin) return false
    if (usd && !(((r.category === 'cex' || r.category === 'dex') && r.stablecoin) || isUsdBank(r))) return false
    if (!usd && isUsdBank(r)) return false
    if (T.where === 'bank' && !PH_CATS.includes(r.category)) return false
    if (T.where === 'crypto' && r.category !== 'cex') return false
    if (T.where === 'defi' && r.category !== 'dex') return false
    if (r.category === 'dex' && S.view !== 'advanced' && T.where !== 'defi') return false
    if (r.minDeposit && (units(r, amt) || 0) < r.minDeposit) return false
    if (r.maxDeposit && amt && amt > r.maxDeposit && isPeso(r)) return false
    return true
  }).map((r) => { const y = yearRate(r, amt); return y == null ? null : { r, ny: y * (S.tax && taxable(r) ? 1 - TAX() / 100 : 1) } }).filter(Boolean).sort((a, b) => b.ny - a.ny)
  const seen = new Set(), top = []
  for (const x of pool) { if (seen.has(x.r.provider)) continue; seen.add(x.r.provider); top.push(x); if (top.length === 3) break }
  if (!top.length) { box.hidden = true; return }
  const why = (r) => [r.category === 'government' ? 'Past dividend' : '', r.kind === 'promo' ? (r.promoEnds ? 'Promo until ' + fmtDate(r.promoEnds) : 'Promo') : '', r.strings ? 'Has tasks' : '', locked(r) ? 'Locked in' : '', r.category === 'cex' || r.category === 'dex' ? 'Not insured' : ''].filter(Boolean)
  box.hidden = false
  box.innerHTML = '<p class="next-top-h">The top 3 your answers left out <span>each has a catch, so check it in the list</span></p><div class="next-top-row">' + top.map((x) => {
    const r = x.r, w = why(r)
    return '<div class="nt"><div class="logo">' + logo(r) + '</div><div class="nt-txt"><b>' + esc(r.provider) + '</b><small>' + esc(r.product || '') + '</small></div><div class="nt-rate">' + pct2(x.ny) + '<small>' + (taxable(r) ? (S.tax ? 'after tax' : 'a year') : 'tax-free') + '</small></div>' + (w.length ? '<div class="nt-why">' + w.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>' : '') + '</div>'
  }).join('') + '</div>'
}
function renderPicks() {
  if (S.step) setStep(S.step);
  const T = S.tree, usd = S.currency === 'USD', amt = amountPesos();
  const show = showMoney;
  const pool = ROWS.filter((r) => {
    if (!rankable(r)) return false;
    if ((r.category === 'cex' || r.category === 'dex') && !r.stablecoin) return false;
    if (usd && !(((r.category === 'cex' || r.category === 'dex') && r.stablecoin) || isUsdBank(r))) return false;
    if (!usd && isUsdBank(r)) return false;
    if (r.pastReturn) return false; // funds show past returns, not rates: never ranked
    if (T.where === 'bank' && !PH_CATS.includes(r.category)) return false;
    if (T.where === 'crypto' && r.category !== 'cex') return false;
    if (T.where === 'defi' && r.category !== 'dex') return false;
    if (r.category === 'dex' && S.view !== 'advanced') return false;
    if (T.access === 'flex' && locked(r)) return false;
    if (T.access === 'lock' && !locked(r)) return false;
    if (T.promo === 'no' && r.kind === 'promo') return false;
    if (T.strings === 'no' && r.strings) return false;
    if (r.minDeposit && (units(r, amt) || 0) < r.minDeposit) return false;
    if (r.maxDeposit && amt && amt > r.maxDeposit && isPeso(r)) return false;
    return true;
  }).map((r) => ({ r, b: blended(r, amt), y: yearRate(r, amt) })).filter(x => x.y != null).map((x) => {
    const factor = S.tax && taxable(x.r) ? 1 - TAX() / 100 : 1;
    return { ...x, n: x.b * factor, ny: x.y * factor };
  })
    .sort((a, b) => b.ny - a.ny);
  const seen = new Set(), top = [];
  for (const x of pool) { const k = x.r.provider; if (seen.has(k)) continue; seen.add(k); top.push(x); if (top.length === 3) break; }
  S.topProv = top.map((x) => x.r.provider); renderNextTop()
  const lbl = (k, v) => { const t = TREE.find((x) => x.key === k); const n = (typeof t.nodes === 'function' ? t.nodes() : t.nodes).find((x) => x[0] === v); return n ? n[2] : v; };
  const path = TREE.map((t) => `<span class="step">${lbl(t.key, S.tree[t.key])}</span>`).join('<span aria-hidden="true">→</span>');
  const ranks = ['Best fit', 'Runner-up', 'Also good'];
  if (!top.some((x) => x.r.id === S.choice)) S.choice = top[0] ? top[0].r.id : null;
  const cards = top.map((x, i) => {
    const r = x.r, p = partner(r), yr = amt * x.ny / 100;
    const base = r.kind === 'promo' ? M.baseProduct(r, ROWS) : null;
    const why = [r.kind === 'promo' ? (r.promoEnds ? `Promo ends ${fmtDate(r.promoEnds)}` : r.promoDays ? `Promo lasts ${r.promoDays} days` : 'Promo, no end date set') : 'Standard rate', r.tiers ? 'tiered rate, blended for your amount' : capped(r) && (units(r, amt) || 0) > (r.cap || Infinity) ? `cap ${isPeso(r) ? '₱' : ''}${Number(r.cap).toLocaleString('en-PH')}${isPeso(r) ? '' : ' ' + r.currency}, rest earns ${pct(r.rateAfterCap || 0)}` : capped(r) ? 'within the cap' : 'no cap', locked(r) ? r.lockup : 'withdraw anytime', r.pdic ? 'PDIC-insured' : r.category === 'cex' ? 'not insured' : ''].filter(Boolean).join(' · ');
    const on = r.id === S.choice;
    return `<article class="pick${on ? ' chosen' : ''}" data-choose="${esc(r.id)}" tabindex="0" aria-pressed="${on}">
      <div class="pick-rank"><span>${ranks[i]}</span><span class="pick-choice basic-only">${on ? '✓ Your choice' : 'Choose this'}</span></div>
      <div class="pick-head"><div class="logo">${logo(r)}</div><div><div class="pick-prov">${esc(r.provider)}</div><div class="pick-prod">${esc(r.product)}</div></div></div>
      <div class="pick-rate">${r.upTo && !r.tiers ? "<small>up to</small> " : ""}${pct2(x.n)} <small>${S.tax && taxable(r) ? 'after tax' : r.taxExempt ? 'tax-free' : isPeso(r) ? 'p.a.' : esc(r.rateBasis || 'APR')}${x.b !== r.rate ? ' blended' : ''}</small></div>
      <div class="pick-earn">On ${show(amt)}: about <b>${show(yr)}</b> over the next 12 months if the rate stays the same${r.kind === 'promo' ? ` <span class="tag">(${r.promoEnds ? 'ends ' + fmtDate(r.promoEnds) : r.promoDays ? 'first ' + r.promoDays + ' days' : 'modeled for year 1 only'}, then ${base ? pct2(net(base.rate, r)) : 'base not published'}; ${pct2(x.ny)} over the year)</span>` : ''}</div>${r.category === 'cex' || r.category === 'dex' ? `<div class="why">Paid in ${esc(r.currency)}. No tax adjustment. Stablecoins modeled at US$1${usd ? '' : `, converted at BSP ₱${FX()}/US$1`}. Future FX changes excluded. Not insured.${r.category === 'dex' ? ' Smart-contract risk: you could lose some or all of it. Adults (18+) only.' : ''}</div>` : ''}
      <div class="why">${esc(why)}</div>
      <div>${kindBadge(r)} ${stale(r) ? '<span class="badge stale">Needs re-check</span>' : ''} ${inflBadge(r)}</div>${S.view === 'advanced' && realYield(r) != null ? `<div class="why">Real yield ${realYield(r) >= 0 ? '+' : ''}${pct2(realYield(r))} after tax and ${INFL()}% inflation.</div>` : ''}
      ${isUsdBank(r) && usd ? (() => { const q = roundTrip(r, amt, 12); return q ? `<div class="why fx-why">Starting with pesos? The exchange round trip here costs about ${money(q.cost)} (${q.costPct.toFixed(2)}%). Break-even: ${beText(q.be)}. <a href="#fx-check" data-fx="${esc(r.id)}">Check it</a></div>` : `<div class="why fx-why">We could not find this bank's published exchange rate. Ask for it before converting pesos.</div>`; })() : ''}
      <div class="actions">${cmpBtn(r)}<a class="btn" href="#yields" data-show="${esc(r.id)}">Fine print</a>${r.source ? `<a class="btn" href="${esc(r.source)}" target="_blank" rel="noopener">Official page ↗</a>` : ''}${p ? fnLink(p) : ''}</div>
    </article>`;
  }).join('');
  S.topPick = S.choice;
  $('#treeResult').innerHTML = `<div class="path">${path}</div><p class="rank-note">Ranked only by your answers and the rate after tax. Partners get no boost. This is a comparison, not advice.<span class="basic-only"> Best fit is chosen for you; tap another card to use it in the next steps.</span></p>${top.length ? `<div class="picks">${cards}</div>` : '<div class="no-picks">Nothing matches every choice. Try “Either is fine” or allow promos.</div>'}
    <p class="rates-foot">Ranked by what your amount earns over the next 12 months${S.tax ? ' after tax' : ''}: caps applied, and promos count only until they end. Only rates we could check on an official page. Not financial advice.</p>${top.length ? '<div class="step-next basic-only"><button type="button" class="btn gold" data-step-next="finder">Next: what would it earn? →</button></div>' : ''}`;
}

/* ── calculator ───────────────────────────── */
function fillCalc() {
  const sel = $('#calcPick');
  const previous = sel.value;
  const opts = ROWS.filter(r => rankable(r) && (isPeso(r) || r.stablecoin || isUsdBank(r))).sort((a, b) => a.provider.localeCompare(b.provider) || b.rate - a.rate);
  sel.innerHTML = opts.map((r) => `<option value="${esc(r.id)}">${esc(r.provider)} · ${esc(r.product)} — ${r.upTo ? 'up to ' : ''}${pct2(r.rate)}</option>`).join('');
  sel.value = opts.some(r => r.id === previous) ? previous : (M.bestPlain(ROWS, TODAY_ISO) || opts[0] || {}).id || '';
}
function calc() {
  if (S.step && S.step >= journey().length - 1) setTimeout(renderCard, 0);
  if (S.step && journey().includes('#inflation-check') && S.step >= journey().indexOf('#inflation-check') + 1) setTimeout(syncSim, 0);
  if (S.step >= 2) setTimeout(saveJourney, 0);
  const r = ROWS.find((x) => x.id === $('#calcPick').value);
  const A = amountPesos(), Y = Number($('#calcYears').value) || 1;
  const minMet = r && (!r.minDeposit || (units(r, A) || 0) >= r.minDeposit);
  const result = r && minMet ? M.project(r, A, Y, ROWS, TODAY_ISO, DATA.rules, S.tax) : null;
  const m = value => value == null ? 'Not available' : showMoney(value);
  $('#calcDepositLabel').textContent = showMoney(A); { const cd = $('#calcDeposit'); if (cd && document.activeElement !== cd) cd.value = fmtAmount(S.amount); const sl = $('#calcDepositSlider'); if (sl) sl.value = Math.min(5000000, Math.max(1000, Math.round(amountPesos()))) }
  $('#calcYearsLabel').textContent = Y + (Y > 1 ? ' years' : ' year');
  $('#resBalance').textContent = m(result && result.balance);
  $('#resBalanceSub').textContent = `after ${Y} year${Y > 1 ? 's' : ''}`;
  $('#resProfit').textContent = result ? m(result.net) : 'Not available';
  $('#resProfitSub').textContent = S.tax && r && taxable(r) ? `after ${TAX()}% tax` : r && r.taxExempt ? 'tax-free' : 'before any tax';
  $('#resMonth').textContent = m(result && result.first / 12);
  $('#resYear').textContent = m(result && result.first);
  $('#resRate').textContent = result && A ? pct2(result.first / A * 100) : '—';
  $('#calcGross').textContent = m(result && result.gross);
  $('#calcTax').textContent = result ? '−' + m(result.tax) : 'Not available';
  $('#calcInflation').textContent = result && result.inflationLoss != null ? '−' + m(result.inflationLoss) : 'Not compared';
  $('#calcReal').textContent = m(result && result.realGain);
  $('#calcReal').className = result && result.realGain != null && result.realGain < 0 ? 'bad' : 'good';
  { const v = $('#inflVerdict'), g = result && result.realGain; $('#calcInflRate').textContent = INFL() != null ? 'PH inflation ' + INFL() + '%' : ''; if (v) v.innerHTML = g == null ? '' : g >= 0 ? '<b class="good">✓ You beat inflation</b> Your money keeps about ' + m(g) + ' more buying power.' : '<b class="bad">✕ Inflation wins</b> You lose about ' + m(-g) + ' in buying power, even after interest.'; if (v) v.className = 'infl-verdict ' + (g == null ? '' : g >= 0 ? 'up' : 'down') }
  $('#calcRealNote').textContent = r && isPeso(r) ? `Buying power at ${INFL()}% PH inflation${S.currency === 'USD' ? ', for a PHP deposit shown in USD at the fixed reference rate' : ''}. ${Y > 1 ? 'Tax includes its compounding effect. ' : ''}Rates and inflation are scenarios, not forecasts.` : 'PH inflation is not a measure of dollar buying power. Crypto returns are not adjusted for tax or inflation.';
  let hint = '';
  if (r) {
    if (r.kind === 'promo') { const base = M.baseProduct(r, ROWS); hint += `${r.promoEnds ? 'Promo ends ' + fmtDate(r.promoEnds) : r.promoDays ? 'Promo lasts ' + r.promoDays + ' days' : 'No published end date: boost modeled for year 1 only'}, then ${base ? pct(base.rate) : 'base rate not published'}. `; }
    if (r.cap != null && (units(r, A) || 0) > r.cap) hint += `The first ${r.currency === 'PHP' ? '₱' : ''}${Number(r.cap).toLocaleString('en-PH')} ${r.currency === 'PHP' ? '' : r.currency + ' '}earns ${pct(r.rate)}; excess ${r.rateAfterCap == null ? 'rate is not published' : 'earns ' + pct(r.rateAfterCap)}. `;
    if (r.upTo) hint += 'This is the top “up to” rate; you may get less. ';
    if (!isPeso(r)) hint += `Paid in ${r.currency}; stablecoins are modeled at US$1. `;
    if ((isPeso(r) && S.currency === 'USD') || (!isPeso(r) && S.currency === 'PHP')) hint += `Converted at BSP ₱${FX()}/US$1; future exchange-rate changes are excluded. `;
    if (!minMet) hint += 'Your amount is below the published minimum deposit. ';
    if (!result && minMet) hint += 'A required rate is unpublished; a complete estimate is unavailable. ';
  }
  $('#calcHint').innerHTML = esc(hint) + (r && r.source ? ` <a href="${esc(r.source)}" target="_blank" rel="noopener">Official source ↗</a>` : '');
  $('#calcNote').textContent = 'Interest compounds annually in this estimate. Caps and tiers are applied each year; actual crediting schedules differ. A promo ends at its published date or duration; undated boosts are limited to year 1.';
}

/* ── header, rules ────────────────────────── */
function renderStats() {
  const u = ROWS.filter((r) => rankable(r) && r.category !== 'dex');
  const plain = M.bestPlain(ROWS, TODAY_ISO);
  const promo = u.filter(r => isPeso(r) && r.kind === 'promo').sort((a, b) => afterTax(b) - afterTax(a))[0];
  const usd = u.filter(r => r.stablecoin && r.kind === 'standard' && !r.strings && !r.upTo && !locked(r)).sort((a, b) => b.rate - a.rate)[0];
  const card = (r, label, primary) => {
    if (!r) return `<article class="best-card"><p class="best-label">${label}</p><p>No current rate published</p></article>`;
    const catches = [r.minDeposit ? `Minimum ${r.currency === 'PHP' ? '₱' : ''}${Number(r.minDeposit).toLocaleString('en-PH')} ${r.currency === 'PHP' ? '' : r.currency}` : 'No minimum deposit',
      r.cap != null ? `First ${r.currency === 'PHP' ? '₱' : ''}${Number(r.cap).toLocaleString('en-PH')} ${r.currency === 'PHP' ? 'only' : r.currency + ' only'}` : 'No cap',
      /select users/i.test(r.finePrint || '') ? 'Select users completing tasks; most get a lower tier' : r.strings ? 'Eligibility and tasks apply' : '',
      !isPeso(r) ? 'Not a bank deposit; not insured' : '',
      r.promoEnds ? `Ends ${fmtDate(r.promoEnds)}` : r.kind === 'standard' ? 'Variable standard rate' : ''].filter(Boolean).join(' · ');
    return `<article class="best-card ${primary ? 'best-primary' : 'best-small'}" data-best-id="${esc(r.id)}"><p class="best-label">${label}</p>${primary ? bestDef : ''}<div class="best-rate">${r.upTo ? '<small>Up to </small>' : ''}${pct2(afterTax(r))}</div><p class="best-net">${taxable(r) ? `After ${TAX()}% tax · ${pct2(r.rate)} gross` : r.taxExempt ? 'Tax-free · past dividend' : esc(r.rateBasis || 'APR') + ' · paid in ' + esc(r.currency)}</p><h3 class="best-product">${esc(r.provider)}<span>${esc(r.product)}</span></h3><p class="best-catch">${esc(catches)}</p>${r.source ? `<a class="best-source" href="${esc(r.source)}" target="_blank" rel="noopener">Official source ↗</a>` : '<p>Source not available</p>'}</article>`;
  };
  // The live four-stat look (George, 11 Nov), with honest figures: "best steady" is the best plain rate (no "up to",
  // no minimum, no tasks, withdraw anytime), and the top promo says "up to" when it is one.
  const promoRows = u.filter((r) => r.kind === 'promo'), promoBest = promoRows.sort((a, b) => net(b.rate, b) - net(a.rate, a))[0]
  const providers = new Set(ROWS.filter((r) => r.category !== 'dex').map((r) => r.provider)).size
  const stat = (v, l) => '<div class="stat-item"><div class="stat-value">' + v + '</div><div class="stat-label">' + l + '</div></div>'
  $('#statsRow').innerHTML = stat(providers, 'Providers') +
    stat(plain ? pct2(net(plain.rate, plain)) : '—', 'Best steady savings' + (S.tax ? ', after tax' : '') + '<sup>*</sup>') +
    stat(promoBest ? (promoBest.upTo ? '<small>up to </small>' : '') + pct2(net(promoBest.rate, promoBest)) : '—', 'Top promo rate' + (S.tax ? ' after tax' : '') + ' (short-term, conditions apply)') +
    stat(promoRows.length, 'Live promos') +
    '<p class="stats-note">* Highest after-tax standard rate with no minimum, no tasks and withdraw anytime, on today\'s checked data: ' + (plain ? esc(plain.provider) + ' ' + esc(plain.product) : '') + '.</p>';
  const ph = DATA.checked && DATA.checked.ph, cx = DATA.checked && DATA.checked.crypto;
  // Next scheduled checks: peso rates on the 28th, crypto on the 1st and 15th (Manila calendar date).
  const t = new Date(TODAY), nextPh = new Date(t), nextCx = new Date(t);
  if (t.getUTCDate() >= 28) nextPh.setUTCMonth(t.getUTCMonth() + 1, 28); else nextPh.setUTCDate(28);
  if (t.getUTCDate() < 15) nextCx.setUTCDate(15); else nextCx.setUTCMonth(t.getUTCMonth() + 1, 1);
  const dm = (d) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const late = (iso, days) => iso && daysBetween(new Date(iso), TODAY) > days;
  $('#verifyChecked').innerHTML = `<span class="vc">Peso rates checked <b>${fmtDate(ph)}</b></span><span class="vsep"> · </span><span class="vc">Crypto checked <b>${fmtDate(cx)}</b></span>${late(ph, 35) || late(cx, 16) ? '<span class="vsep"> · </span><span class="vc verify-late">a re-check is overdue</span>' : ''}`;
  $('#verifyNext').innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> Next update: <span class="vc">peso rates <b>${dm(nextPh)}</b> (end of every month)</span><span class="vsep"> · </span><span class="vc">crypto <b>${dm(nextCx)}</b> (every 2 weeks)</span>`;
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
  S.view = v; document.body.dataset.view = v; setTimeout(renderStrip, 0); const rt = document.getElementById('rates'); if (rt) { rt.classList.remove('swap'); void rt.offsetWidth; rt.classList.add('swap') } if (v === 'basic' && S.f.lock !== 'all') S.f.lock = 'all';
  $$('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
  try { localStorage.setItem('trYieldView', v); } catch (e) {}
  if (v === 'basic') { if (S.f.cat === 'dex') S.f.cat = 'all'; S.real = false; $('#realToggle').checked = false; syncChips(); }
  renderAll();
  if (v === 'advanced' && DATA) ensureDefi();
}
function syncChips() { $$('.chips').forEach((c) => $$('button', c).forEach((b) => b.setAttribute('aria-pressed', String(S.f[c.dataset.key] === b.dataset.v)))); syncFilterUi(); }

/* ── collapsible filters (preview looks: ?filters=a|b|c, default a) ── */
const FLOOK = 'a'; // George picked A on the review board, 9 Nov
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
  const more = ['kind', 'cap', 'lock'];
  const panel = mk('div', 'f-panel'); panel.id = 'fPanel'; panel.hidden = true;
  for (const k of more) { const g = groups[k]; const row = mk('div', 'f-group' + (g.classList.contains('adv-only') ? ' adv-only' : ''), `<span class="f-label">${FLABEL[k]}</span>`); row.appendChild(g); panel.appendChild(row); }
  const btn = mk('button', 'f-toggle', `${icon}<span class="f-tl">More filters</span><span class="f-count" hidden></span><svg class="f-chev" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>`);
  btn.type = 'button'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'fPanel');
  btn.addEventListener('click', () => { panel.hidden = !panel.hidden; btn.setAttribute('aria-expanded', String(!panel.hidden)); });
  const top = mk('div', 'f-row');
  top.appendChild(groups.cat);
  const tools = mk('div', 'f-tools'); tools.appendChild(btn); tools.appendChild(search); top.appendChild(tools);
  const pills = mk('div', 'f-active'); pills.id = 'fActive';
  pills.addEventListener('click', (e) => { const x = e.target.closest('[data-clear]'); if (!x) return; const k = x.dataset.clear; if (k === '*') more.forEach((m) => (S.f[m] = 'all')); else S.f[k] = 'all'; syncChips(); renderRates(); });
  box.prepend(pills); box.prepend(panel); box.prepend(top);
}
function syncFilterUi() {
  const box = $('#filters'); if (!box || !box.dataset.flook) return;
  const more = ['kind', 'cap', 'lock'];
  const act = activeKeys(more), cnt = $('.f-count', box);
  cnt.hidden = !act.length; cnt.textContent = act.length;
  $('#fActive').innerHTML = act.length ? act.map((k) => `<button class="f-pill" data-clear="${k}" aria-label="Clear ${FLABEL[k]} filter">${FLABEL[k]}: ${optLabel(k, S.f[k])} <span aria-hidden="true">×</span></button>`).join('') + (act.length > 1 ? '<button class="f-pill f-clear" data-clear="*">Clear all</button>' : '') : '';
}
function renderAll() { if (!DATA) return; renderStats(); renderRates(); syncCmp(); if (TREE.every((t) => S.tree[t.key] != null)) renderPicks(); calc(); }
const AMT_CHIPS = { PHP: [10000, 50000, 100000, 500000], USD: [100, 500, 1000, 5000] }
function countTo(el, to, fmt) {
  if (!el) return
  const from = Number(el.dataset.v || 0), reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  el.dataset.v = to
  if (reduce || !isFinite(from) || from === to) { el.textContent = fmt(to); return }
  const t0 = performance.now(), dur = 450
  const step = (now) => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(from + (to - from) * e); if (k < 1 && el.dataset.v == to) requestAnimationFrame(step) }
  requestAnimationFrame(step)
}
function renderAmountCard() {
  if (!DATA || !$('#amtCard')) return
  const usd = S.currency === 'USD'
  $('#amtSym').textContent = usd ? '$' : '₱'
  const big = $('#amtBig'); if (document.activeElement !== big) big.value = Number(S.amount.toFixed(usd ? 2 : 0))
  $('#amtChips').innerHTML = AMT_CHIPS[S.currency].map((v) => '<button type="button" data-amt="' + v + '" aria-pressed="' + (Math.abs(S.amount - v) < 0.005) + '">' + (usd ? '$' : '₱') + v.toLocaleString('en-PH') + '</button>').join('')
  const u = ROWS.filter((r) => rankable(r) && r.category !== 'dex')
  const best = usd ? u.filter((r) => (r.stablecoin || isUsdBank(r)) && r.kind === 'standard' && !r.strings && !r.upTo && !locked(r) && !r.pastReturn).sort((a, b) => (earnOf(b) ?? -1) - (earnOf(a) ?? -1))[0] : M.bestPlain(ROWS, TODAY_ISO)
  const e = best ? earnOf(best) : null
  countTo($('#amtEarn'), e == null ? 0 : e, (v) => (e == null ? '—' : showMoney(v)))
  $('#amtWhere').innerHTML = best ? (e == null ? 'Below the minimum deposit for ' + esc(best.provider) : esc(best.provider) + ' · ' + esc(best.product) + ', ' + pct2(net(best.rate, best)) + (S.tax && taxable(best) ? ' after tax' : isPeso(best) ? '' : ' APR · not insured')) : 'No current rate published'
}
const fmtAmount = (n) => Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const parseAmount = (t) => { const v = Number(String(t).replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1')); return isFinite(v) && v > 0 ? v : 0 }
function updateAmount() {
  if (S.step) setTimeout(() => setStep(S.step), 0);
  $('#sharedAmount').value = fmtAmount(S.amount);
  $('#sharedAmount').setAttribute('aria-label', 'Amount in ' + (S.currency === 'USD' ? 'US dollars' : 'pesos'));
  $$('[data-currency]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.currency === S.currency)));
  renderAll(); renderAmountCard(); if (DATA) sim();
}
function wire() {
  $$('.seg button').forEach((b) => b.addEventListener('click', () => { delete document.body.dataset.flow; setView(b.dataset.view) }));
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
    const k = b.dataset.k, v = b.dataset.v;
    const idx = TREE.findIndex((t) => t.key === k);
    if (k === 'where' && v === 'defi') setView('advanced');
    S.tree[k] = v;
    renderTree();
    const next = $(`.tier[data-tier="${(TREE[idx + 1] || {}).key}"]`) || $('#treeResult');
    if (next && next.getBoundingClientRect().top > innerHeight - 120) next.scrollIntoView({ behavior: scrollMotion(), block: 'center' });
  });
  $('#treeResult').addEventListener('click', (e) => {
    const a = e.target.closest('[data-show]'); if (!a) return;
    e.preventDefault(); const id = a.dataset.show; const r = ROWS.find((x) => x.id === id);
    S.f = { cat: 'all', kind: 'all', cap: 'all', lock: 'all' }; S.q = ''; $('#searchInput').value = ''; syncChips(); S.open.add(id); { const rr = ROWS.find((x) => x.id === id); if (rr) S.openProv.add(rr.category + '|' + rr.provider); } renderRates();
    const el = $(`.row[data-id="${CSS.escape(id)}"]`); if (el) el.scrollIntoView({ behavior: scrollMotion(), block: 'center' });
  });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.fn-link');
    if (a) { e.preventDefault(); const t = document.getElementById(a.dataset.fn); if (t) { t.scrollIntoView({ behavior: scrollMotion(), block: 'center' }); t.classList.remove('fn-hit'); void t.offsetWidth; t.classList.add('fn-hit'); } return; }
    const c = e.target.closest('.fn-copy');
    if (c) { const done = () => { c.textContent = 'Copied ✓'; setTimeout(() => (c.textContent = 'Copy code'), 1800); }; try { navigator.clipboard.writeText(c.dataset.copy).then(done, done); } catch (err) { done(); } }
  });
  ['simYears', 'simInfl', 'simTax'].forEach((id) => { const el = $('#' + id); if (el) el.addEventListener('input', sim); });
  $('#simRate').addEventListener('input', () => { $('#simPick').value = ''; sim(); });
  const sp = $('#simPick'); if (sp) sp.addEventListener('change', () => { const r = ROWS.find((x) => x.id === sp.value); if (r) $('#simRate').value = r.rate; sim(); });
  document.addEventListener('click', (e) => {
    const t = e.target.closest('#fnToggle'); if (!t) return;
    const body = document.getElementById('fnBody'), open = body.hidden;
    body.hidden = !open; t.setAttribute('aria-expanded', String(open));
    t.innerHTML = (open ? 'Hide links' : 'Show all ' + body.querySelectorAll('li').length + ' links') + ' <span aria-hidden="true">' + (open ? '▴' : '▾') + '</span>';
  });
  ['calcPick', 'calcYears'].forEach((i) => $('#' + i).addEventListener('input', calc));
  $('#sharedAmount').addEventListener('input', e => { S.amount = parseAmount(e.target.value); renderAll(); if (DATA) sim(); });
  $('#sharedAmount').addEventListener('change', e => { e.target.value = fmtAmount(S.amount); });
  { const cd = $('#calcDeposit'), sl = $('#calcDepositSlider')
    const push = () => { const sa = $('#sharedAmount'); if (document.activeElement !== sa) sa.value = fmtAmount(S.amount); renderAll(); if (DATA) sim() }
    if (cd) { cd.addEventListener('input', () => { S.amount = parseAmount(cd.value); push() }); cd.addEventListener('change', () => (cd.value = fmtAmount(S.amount))); cd.addEventListener('focus', () => cd.select()) }
    if (sl) sl.addEventListener('input', () => { const pesos = Number(sl.value); S.amount = S.currency === 'USD' ? Math.round(pesos / (FX() || 1) * 100) / 100 : pesos; if (cd) cd.value = fmtAmount(S.amount); push() }) }
  $('#sharedAmount').addEventListener('focus', e => e.target.select());
  $$('[data-currency]').forEach(b => b.addEventListener('click', () => {
    if (S.currency === b.dataset.currency || !DATA) return;
    const pesos = amountPesos(); S.currency = b.dataset.currency;
    const d = S.currency === 'USD' ? 100 : 1; // show cents for dollars, whole pesos
    S.amount = Math.round(M.fromPesos(pesos, S.currency, FX()) * d) / d; updateAmount();
  }));
}
async function loadDefi() {
  try {
    const res = await fetch('https://yields.llama.fi/pools'); const pools = (await res.json()).data || [];
    if (!res.ok) throw new Error('Rate feed unavailable');
    const today = TODAY_ISO;
    return pools.filter((p) => DEFI.projects[p.project] && p.chain === 'Solana' && DEFI.symbols.includes(p.symbol) && (p.tvlUsd || 0) >= DEFI.minTvl)
      .sort((a, b) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
      .map((p) => {
        const [prov, link] = DEFI.projects[p.project];
        const meta = p.poolMeta || 'Main market';
        const rwa = /rwa|institutional|commodity|figure|onre|huma|plume/i.test(meta);
        const rew = p.apyReward > 0.05;
        const avg = p.apyMean30d != null ? ` 30-day average ${p.apyMean30d.toFixed(2)}%.` : '';
        return { id: `dex-${p.pool}`, provider: prov, product: `${meta} · ${p.symbol}`, category: 'dex', currency: p.symbol, stablecoin: true,
          rate: p.apy == null ? null : Math.round(p.apy * 100) / 100, rateBasis: 'APY', kind: rew ? 'promo' : 'standard', rateAfterPromo: rew ? p.apyBase : null, lockup: 'flexible',
          capText: `Pool size $${((p.tvlUsd || 0) / 1e6).toFixed(1)}M`,
          finePrint: `Live from DefiLlama: ${(p.apyBase || 0).toFixed(2)}% from borrowers${rew ? ` + ${p.apyReward.toFixed(2)}% in reward tokens (rewards can stop anytime)` : ''}.${avg} The rate moves with demand to borrow.${rwa ? ' This vault lends against real-world assets, which adds credit risk outside crypto.' : ''}`,
          cons: 'Smart-contract, oracle and stablecoin risk. No insurance. You need your own Solana wallet; there is no support desk if you make a mistake.',
          source: link, checkedOn: today, verified: true, history: [] }; // A 30-day average is not a second historical snapshot.
      });
  } catch (e) { return null; }
}
let defiPromise;
function ensureDefi() {
  if (defiPromise) return defiPromise;
  const status = $('#defiStatus'), key = 'trYieldDefi-v1:' + DATA.generated;
  status.textContent = 'Loading live DeFi rates…';
  defiPromise = (async () => {
    let rows, saved;
    try { saved = sessionStorage.getItem(key); } catch (e) {}
    if (saved != null) { try { rows = JSON.parse(saved); } catch (e) { rows = null; } }
    else {
      rows = await loadDefi();
      try { sessionStorage.setItem(key, JSON.stringify(rows)); } catch (e) {}
    }
    if (!rows) { status.textContent = 'Live DeFi feed unavailable. Saved official rates remain available; no live DeFi estimate is shown.'; return; }
    ROWS = ROWS.concat(rows);
    status.textContent = `${rows.length} live Solana pools · DefiLlama · loaded once this session. Averages are not historical snapshots.`;
    fillCalc(); renderAll();
  })();
  return defiPromise;
}
function chooseCard(id) {
  S.choice = id; S.topPick = id
  $$('#treeResult .pick').forEach((p) => { const on = p.dataset.choose === id; p.classList.toggle('chosen', on); p.setAttribute('aria-pressed', String(on)); const c = p.querySelector('.pick-choice'); if (c) c.textContent = on ? '✓ Your choice' : 'Choose this' })
  if (S.step >= 2 && $('#calcPick')) { $('#calcPick').value = id; calc() }
}
/* Step 4: the full list opens right below the journey (Advanced columns), then the dollar check as a good-to-know */
function openListBelow() {
  const seq = journey(); document.body.dataset.flow = seq.includes('#fx-check') ? 'fx' : 'journey'
  setView('advanced')
  const el = $('#yields'); el.classList.remove('step-in'); void el.offsetWidth; el.classList.add('step-in')
  setTimeout(() => el.scrollIntoView({ behavior: scrollMotion(), block: 'start' }), 80)
}
async function init() {
  wireCmp();
  document.addEventListener('click', (e) => {
    if (e.target.closest('#jrRestart') || e.target.closest('#jrFresh')) { restartJourney(); return }
    if (e.target.closest('#jrContinue')) { const j = loadJourney(); $('#jrWelcome').hidden = true; if (j) applyJourney(j); return }
    if (e.target.closest('#jrBack')) { const seq = journey(), n = Math.min(S.step || 1, seq.length); const cur = seq.slice(0, n).reduce((best, sel) => { const el = $(sel); return el && el.getBoundingClientRect().top < innerHeight * 0.4 ? sel : best }, seq[0]); const i = Math.max(0, seq.indexOf(cur) - 1); $(seq[i]).scrollIntoView({ behavior: scrollMotion(), block: 'start' }); return }
    const ch = e.target.closest('[data-choose]'); if (ch && S.view === 'basic' && !e.target.closest('a, button, .actions')) { chooseCard(ch.dataset.choose); return }
    if (e.target.closest('[data-flow-list]')) { openListBelow(); return }
    const jb = e.target.closest('[data-jr]'); if (jb) { const k = jb.dataset.jr; if (k === 'save') saveCardImage(); else if (k === 'share') shareCard(); else copyLink(); return }
    const nx = e.target.closest('[data-step-next]')
    if (nx) {
      const k = nx.dataset.stepNext, seq = journey()
      if (k === 'finder') { if (S.topPick && $('#calcPick')) { $('#calcPick').value = S.topPick; calc() } setStep(Math.max(S.step, 2), '#calculator'); return }
      if (k === 'calc') { if (seq[2] === '#fx-check') { const fa = $('#fxAmt'); if (fa) fa.value = fmtAmount(Math.round(amountPesos())); renderFx() } setStep(Math.max(S.step, 3), seq[2]); return }
      if (k === 'fx' || k === 'infl') { setStep(seq.length, '#nextSteps'); return }
    }
    const it = e.target.closest('#calcInflToggle'); if (it) { S.inflTouched = true; $('#calculator').classList.toggle('no-infl', !it.checked); return }
    const ra = e.target.closest('a[href="#yields"]'); if (ra && S.view === 'basic') { e.preventDefault(); setView('advanced'); setTimeout(() => $('#yields').scrollIntoView({ behavior: scrollMotion(), block: 'start' }), 60); return }
    const c = e.target.closest('[data-amt]'); if (c) { S.amount = Number(c.dataset.amt); updateAmount(); return }
    const g = e.target.closest('[data-goadv]'); if (g && !e.target.closest('#ratesFoot')) { e.preventDefault(); setView('advanced'); const to = $(g.dataset.go || '#yields'); setTimeout(() => to && to.scrollIntoView({ behavior: scrollMotion(), block: 'start' }), 60); return }
    const t = e.target.closest('[data-tool="compare"]'); if (t && !CMP.open) { e.preventDefault(); const tip = $('#advCmpTip'); tip.hidden = false; $('#rates').scrollIntoView({ behavior: scrollMotion(), block: 'start' }) }
  })
  const big = $('#amtBig'); if (big) big.addEventListener('input', () => { const v = Number(big.value); if (isFinite(v) && v >= 0) { S.amount = v; $('#sharedAmount').value = v; renderAll(); renderAmountCard(); if (DATA) sim() } })
  const sb = $('#sortBy'); if (sb) sb.addEventListener('change', () => { S.sort = sb.value; renderRates() });
  ['fxAmt', 'fxMonths', 'fxPick'].forEach((id) => { const el = $('#' + id); if (el) el.addEventListener('input', renderFx); });
  { const fa = $('#fxAmt'); if (fa) { fa.addEventListener('change', () => (fa.value = fmtAmount(parseAmount(fa.value)))); fa.addEventListener('focus', () => fa.select()) } }
  setupFilters();
  wire();
  document.body.dataset.view = S.view; $$('.seg button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === S.view)));
  try { DATA = await (await fetch('yields.json', { cache: 'no-cache' })).json(); }
  catch (e) { $('#rates').innerHTML = '<p class="no-picks">Could not load the rates. Please refresh.</p>'; return; }
  ROWS = DATA.rows;
  renderRules(); renderInfl(); renderFootnotes(); fillSim(); fillCalc(); renderTree(); renderAll(); syncFilterUi(); fillFx(); renderFx(); setStep(1); $('#sharedAmount').value = fmtAmount(S.amount);
  const u = M.bestPlain(ROWS, TODAY_ISO);
  if (u) { $('#calcPick').value = u.id; calc(); }
  { const Q0 = new URLSearchParams(location.search)
    if (Q0.get('where') && Q0.get('amt') && !Q0.get('demo')) { applyJourney({ step: 9, tree: { where: Q0.get('where'), access: Q0.get('access') || 'any', promo: Q0.get('promo') || 'ok', strings: Q0.get('strings') || 'ok' }, currency: Q0.get('ccy') === 'USD' ? 'USD' : 'PHP', amount: Number(Q0.get('amt')) || 100000, pick: Q0.get('pick'), years: Number(Q0.get('y')) || 1 }) }
    else { const j = loadJourney(); if (j && j.step >= 2 && S.view === 'basic') { const seq = (() => { const t = S.tree, c = S.currency; S.tree = j.tree || {}; S.currency = j.currency || 'PHP'; const q = journey(); S.tree = t; S.currency = c; return q })(); const n = Math.min(j.step, seq.length), pickRow = ROWS.find((x) => x.id === j.pick)
      $('#jrWelcomeTitle').textContent = 'Welcome back! You stopped at Step ' + n + ': ' + (STEP_LABEL[seq[n - 1]] || '')
      $('#jrWelcomeSub').textContent = (j.currency === 'USD' ? '$' : '₱') + Number(j.amount || 0).toLocaleString('en-PH') + (pickRow ? ' · ' + pickRow.provider + ' ' + pickRow.product : '')
      $('#jrWelcome').hidden = false } } }
  addEventListener('resize', renderStrip)
  // Preview only: ?demo=1 fills the finder (ccy=usd switches to dollars; where/access override), ?cmp=id,id opens Compare.
  const Q = new URLSearchParams(location.search);
  if (Q.get('demo')) { if (Q.get('ccy') === 'usd') { S.currency = 'USD'; S.amount = 1000; updateAmount() } S.tree = { where: Q.get('where') || (Q.get('ccy') === 'usd' ? 'crypto' : 'bank'), access: Q.get('access') || 'flex', promo: 'ok', strings: 'no' }; renderTree(); }
  if (Q.get('cmp')) { CMP.ids = Q.get('cmp').split(',').filter((id) => ROWS.some((r) => r.id === id)).slice(0, 3); if (Q.get('cmpccy') === 'usd') { CMP.ccy = 'usd'; CMP.amount = 1000; $('#cmpAmt').value = fmtAmount(1000); } CMP.open = CMP.ids.length > 1; syncCmpForm(); syncCmp(); }
  if (Q.get('open')) { Q.get('open').split(',').forEach((id) => { const r = ROWS.find((x) => x.id === id); if (r) { S.open.add(id); S.openProv.add(r.category + '|' + r.provider); } }); renderRates(); } // preview screenshots only
  if (Q.get('view') === 'advanced') setView('advanced');
  if (Q.get('fdemo')) { S.f.kind = 'standard'; S.f.cap = 'nocap'; syncChips(); renderRates(); const t = $('.f-toggle'); if (t && Q.get('fdemo') === 'open') t.click(); }
  if (Q.get('scrollto')) { const el = document.getElementById(Q.get('scrollto')); if (el) { document.documentElement.style.scrollBehavior = 'auto'; window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 130); } }
  if (S.view === 'advanced') ensureDefi();
}
init();
})();
