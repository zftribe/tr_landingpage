# Yield Tracker ledger review

Approved scope: the Yield Tracker only. Baseline `46dcc36`, branch `codex/yield-ledger-review`. No rate data changed, no other Welcome page changed, and no merge or production deployment is authorized by this PR.

## Result

- Refined dark gold ledger with Cormorant Garamond, source-date stamp and three product-aware hero cards.
- Best plain selection comes from `yields.json`: OwnBank Own It, 3.80% gross / 3.04% after 20% PH tax. Up-to, minimum-deposit, tiered, locked, task and VIP products cannot win this card.
- Maya's hero says up to 12.00% after tax / 15.00% gross, select users completing tasks, first PHP100,000 only, ends 30 November.
- Calculator defaults to best plain and shows interest, tax, inflation loss and real gain/loss. Undated promos stop after their duration or year one. The published ordinary base product replaces promotional caps and tiers.
- One PHP/USD amount drives rows, Finder, calculator and inflation simulator using the unchanged BSP reference of 63.143. The currency switch preserves equivalent value. PH CPI applies to PHP deposits; a USD display is a conversion, not a USD inflation forecast.
- Manila day boundaries govern dates, remaining days and expiry. The existing convention that the end date is the first ended day is retained consistently.
- Unknown rates stay unknown, including post-promo Bitget and unpublished excess-cap/base rates. Known minimums block estimates below the threshold.
- Only actual two-or-more snapshot histories get a trend cell. The current JSON has 137 rows and one qualifying history. A live 30-day average is not fabricated into a snapshot.
- Basic makes no DeFi request. Advanced fetches once, filters the existing approved Solana stablecoin pool universe, and caches results in sessionStorage. Reopening or reloading uses that cache; feed failures show an unavailable message.
- Phone order: Best, Rates, Finder, Calculator, Inflation. Wrapped chips, visible top links and fixed four-link bottom navigation. Reduced motion covers CSS and programmatic scrolling.
- Canonical, Open Graph and Twitter tags added. Tracker references use `tr-logo.png`; the original spaced asset remains solely to preserve unrelated pages.
- Snapshot automation and story chapters remain future work; no scheduler or new stories added.

## Validation

`node scripts/check-yield-tracker.cjs`: 12 regression groups passed against all 137 JSON rows. Covers best-plain eligibility, no-end-date promo fallback in years 2–10, Manila boundary, FX equivalence, tiers/caps, missing rates, 20% tax, MP2 exemption and buying-power maths.

`npm run build`, `node --check` for both JS files, and `git diff --check` passed. Browser integration tested both 1440x1000 and 390x844 with no horizontal scrolling, page errors or console errors. Shared USD input affects Finder, rows and calculator; minimum guard, expired Bitget detail, reduced motion and session reload were exercised.

Fresh browser network evidence:

- [Basic log](network-basic.log): only `yields.json` among dynamic requests; zero `yields.llama.fi` requests.
- [Advanced log](network-advanced.log): exactly one successful `https://yields.llama.fi/pools`; 19 eligible pools returned. Basic/Advanced toggles and reload produced no additional request.

Before images show the committed baseline, served from Git in memory without a second source checkout. After images show the local final implementation. Hosted Vercel application commit 2b5673c was also verified in the owner-signed-in Chrome session at 1440x1000 and 390x844. Hero/default, shared USD amount ($30.40 OwnBank first-year net on $1,000 display amount), Finder, Advanced feed, empty trends and phone navigation passed with no horizontal overflow or site errors. Local fresh-browser console errors: zero. The existing Chrome Phantom extension logged an unrelated ethereum-property conflict. The Vercel connector returned403; signed-in Chrome successfully accessed the protected preview. Protection was not changed.

Hosted preview: https://tr-landingpage-h09ls37mg-tr-lms-vercel.vercel.app/yield-tracker/index.html

Hosted captures: [desktop](vercel-desktop.png), [phone rates](vercel-phone-rates.png).

## Polish pass (10 Nov 2026): original look restored

George asked to keep the tracker's original look. The Cormorant Garamond restyle is reverted to the original stylesheet (Plus Jakarta Sans display, DM Sans body, gold #F9A825, rounded dark cards, centred hero with "Where should your money earn?"). All functional fixes from this PR stay. The new parts (best-today cards, shared ₱/$ amount, calculator ledger, phone nav and bottom bar) are drawn in the original style. The freshness line is a small gold stamp instead of the green seal.

Fixes in the same pass: the Advanced Trend column is decided per rate group, so header and row columns stay aligned; peso amounts show whole pesos and dollar amounts show cents (switching ₱→$ no longer shows 1583.706824); the per-row "vs inflation" line is Advanced-only, as in the original; partner footnotes use only the approved referral wording (OKX, MEXC, Gate: 20% trading-fee rebate; Bybit: 15% trading-fee discount; none for Bitget), and the generic note no longer implies a Bitget rebate; the phone controls bar wraps instead of widening the page.
