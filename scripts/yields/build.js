// Build public/yield-tracker/yields.json from the dated research files in data/yields/.
// Usage: node scripts/yields/build.js        (writes the file and prints a check report)
//        node scripts/yields/build.js --check (only checks; exits 1 on errors)
// Rules: every row needs an official source and a checkedOn date; nothing without a source gets a rate.
const fs = require('fs'), path = require('path')
const ROOT = path.join(__dirname, '..', '..')
const D = (f) => path.join(ROOT, 'data', 'yields', f)
const read = (f) => (fs.existsSync(D(f)) ? JSON.parse(fs.readFileSync(D(f), 'utf8')) : null)
const checkOnly = process.argv.includes('--check')

const sources = ['digital.json', 'traditional.json', 'usd.json', 'cex.json'].map((f) => ({ f, rows: read(f) || [] }))
const rules = read('rules.json') || {}
rules.fx = read('fx.json') || null
rules.fxBoard = read('fx-board.json') || null // banks' published USD buying/selling rates (George, 10 Nov)
const bankKey = (s) => String(s || '').toLowerCase().replace(/\b(unibank|bank|of the philippines|philippines|savings|digital|inc\.?|corp\.?|the)\b/g, '').replace(/[^a-z]/g, '')
const overrides = read('overrides.json') || {}
const history = read('history.json') || {}
const regions = read('cex-regions.json') || []

// Partner and referral links. They are shown only in the footer footnotes ("Partner & referral links"); rows link down to them.
const PARTNERS = {
  Maya: { kind: 'bank', label: 'Maya', url: 'https://official.maya.ph/be7m/gmsb47rr' },
  MariBank: { kind: 'bank', label: 'MariBank', url: 'https://www.maribank.ph/c/earnfreemoney?referralCode=GA233507' },
  GoTyme: { kind: 'bank', label: 'GoTyme Bank', code: 'GTXGFA27Z70', url: 'https://www.gotyme.com.ph/', codeHow: 'Enter this referral code when you sign up in the GoTyme app.' },
  OKX: { kind: 'exchange', label: 'OKX', url: 'https://www.okx.com/join/OFF2O' },
  MEXC: { kind: 'exchange', label: 'MEXC', url: 'https://www.mexc.com/acquisition/custom-sign-up?shareCode=mexc-TR20OFF' },
  Bitget: { kind: 'exchange', label: 'Bitget', url: 'https://partner.bitget.com/bg/OFF20' },
  Bybit: { kind: 'exchange', label: 'Bybit', url: 'https://partner.bybit.com/b/tradingrepub' },
  Gate: { kind: 'exchange', label: 'Gate', url: 'https://www.gate.com/share/BULLZONE' },
}
// Words that mean "you must do something to get this rate".
const STRINGS = /\b(spend|purchase|transact|cash[- ]?in|card|loan|payroll|maintain|average daily balance|adb|task|refer|invite|new users? only|first[- ]time|vip|hold(ing)? (okb|bgb|mx|gt)|stake)\b/i

const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
const errors = [], warns = [], rows = [], ids = new Set()
for (const { f, rows: list } of sources) {
  for (const r0 of list) {
    let r = { ...r0 }
    let id = slug(`${r.provider}-${r.product}`)
    while (ids.has(id)) id += '-x'
    ids.add(id)
    r.id = id
    Object.assign(r, overrides[id] || {})
    if (r.category === 'fund') { r.pastReturn = true; r.pdic = false; r.category = 'traditional' } // UITFs/funds: past return only, never ranked as a deposit rate
    if (!['traditional', 'digital', 'ewallet', 'government', 'cex'].includes(r.category)) r.category = 'traditional' // e.g. 'savings', 'high-yield savings'
    if (r.drop) continue
    if (!r.source) errors.push(`${f}: ${id} has no source`)
    if (!r.checkedOn) errors.push(`${f}: ${id} has no checkedOn`)
    if (r.rate != null && r.verified === false) { warns.push(`${id}: unverified rate hidden`); r.rate = null }
    if (r.rate != null && (typeof r.rate !== 'number' || r.rate < 0 || r.rate > 1000)) errors.push(`${id}: bad rate ${r.rate}`)
    if (r.kind !== 'promo' && r.kind !== 'standard') errors.push(`${id}: kind must be promo or standard`)
    if (r.kind === 'promo' && (r.promoEnds || r.promoDays) && r.rateAfterPromo == null && !(r.rate > 30)) warns.push(`${id}: promo without rateAfterPromo (12-month figure will assume 0%)`)
    delete r._why
    const elig = String(r.eligibility || '')
    if (/\bvip\b/i.test(elig)) r.vipOnly = true
    if (/new[- ]user|first[- ]time/i.test(elig + ' ' + (r.product || ''))) r.newUsersOnly = true
    if (r.rate != null && r.rate > 30) r.teaser = true // tiny-cap headline offers: listed, never ranked
    if (r.category === 'cex' && !/^(usdt|usdc|usdg)$/i.test(r.currency || '')) continue // George 9 Nov: crypto = USDT, USDC, USDG only (no other stablecoins, no BTC/ETH)
    if (r.category === 'cex') r.stablecoin = /^(usdt|usdc|usdg)$/i.test(r.currency || '')
    if (r.vipOnly || r.newUsersOnly) r.strings = r.strings ?? true
    if (r.strings == null) r.strings = STRINGS.test(`${r.conditions || ''}`) && !/^none|no (special )?conditions/i.test(r.conditions || '')
    if (r.category === 'cex') {
      const reg = regions.find((x) => (r.provider || '').toLowerCase().startsWith(String(x.provider).toLowerCase()))
      const cons = ['Not a bank deposit and not insured.', 'The exchange can change the rate or pause withdrawals.']
      if (reg && reg.secPhAdvisory) cons.push(reg.secPhAdvisory)
      r.cons = r.cons || cons.join(' ')
    }
    const h = history[id] || []
    const now = r.rate != null ? [{ d: r.checkedOn, r: r.rate }] : []
    r.history = [...h.filter((p) => p.d !== r.checkedOn), ...now].sort((a, b) => (a.d < b.d ? -1 : 1)).slice(-12)
    if (r.currency === 'USD' && r.category !== 'cex' && rules.fxBoard) {
      const bd = (rules.fxBoard.banks || []).find((x) => bankKey(x.provider) && (bankKey(x.provider) === bankKey(r.provider) || bankKey(r.provider).startsWith(bankKey(x.provider)) || bankKey(x.provider).startsWith(bankKey(r.provider))))
      if (bd && bd.buy > 0 && bd.sell > 0) Object.assign(r, { fxBuy: bd.buy, fxSell: bd.sell, fxAsOf: bd.asOf || rules.fxBoard.checkedOn, fxSource: bd.source, fxBasis: bd.basis })
    }
    for (const k of ['evidence', 'note', 'maxBalance', 'verified']) if (r[k] == null || r[k] === '') delete r[k]
    rows.push(r)
  }
}
const latest = (cats) => rows.filter((r) => cats.includes(r.category)).map((r) => r.checkedOn).sort().pop() || null
const out = {
  generated: new Date().toISOString(),
  checked: { ph: latest(['traditional', 'digital', 'ewallet', 'government']), crypto: latest(['cex']) },
  schedule: { ph: 'End of each month', crypto: 'Every two weeks' },
  rules, partners: PARTNERS, rows,
}
console.log(`${rows.length} rows · ${rows.filter((r) => r.rate != null).length} with a checked rate · ${rows.filter((r) => r.kind === 'promo').length} promos`)
warns.forEach((w) => console.log('  note:', w))
errors.forEach((e) => console.log('  ERROR:', e))
if (errors.length) process.exit(1)
if (!checkOnly) fs.writeFileSync(path.join(ROOT, 'public', 'yield-tracker', 'yields.json'), JSON.stringify(out, null, 1) + '\n')
