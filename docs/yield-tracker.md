# Yield Tracker: data and refresh runbook

The page is `public/yield-tracker/` (index.html, tracker.css, tracker.js, yields.json).
`yields.json` is **generated**. Never edit it by hand: edit the files in `data/yields/` and run the build.

```
node scripts/yields/build.js           # writes public/yield-tracker/yields.json and prints notes
node scripts/yields/build.js --check   # checks only; exits 1 on errors
```

## Live and preview (George, 9 Nov 2026)
| | Where | Branch |
|---|---|---|
| **Live** | www.tradingrepublic.io/yield-tracker/ | `main` |
| **Preview** | tr-welcome-preview.1037293.workers.dev/yield-tracker/ (ribbon "PREVIEW, not live") | `claude/yield-tracker-polish` (draft PR #16) |
| **Compare** | tr-welcome-preview.1037293.workers.dev/yield-options.html (live vs preview, web + phone) | — |

- Every polish round is committed to `claude/yield-tracker-polish` and deployed to the preview only: `sh D:/Temp/yield-tracker/deploy.sh` (adds the ribbon at deploy time; the ribbon is never committed). `/yield-tracker-live/` on the preview mirrors `origin/main`.
- Scheduled data refreshes open a data PR to `main` **and** merge the same data into the polish branch, then redeploy the preview.
- When George says polishing is done: one release card to the Command Center keeper with live vs preview screenshots and the go line. Only George's go, typed in the Yield Tracker session's chat, merges PR #16. After merging, check that Vercel deployed main; if not, start it from the Vercel dashboard (team tr-lms-vercel → tr-landingpage → Deployments → … → Create Deployment → main → Deploy to Production).

## Data files (`data/yields/`)

| File | What | Refresh |
|---|---|---|
| `digital.json` | Digital banks, neobanks, e-wallet savings (PHP) | End of each month |
| `traditional.json` | Traditional banks and government savings (PHP) | End of each month |
| `cex.json` | Partner exchanges' Earn products (OKX, MEXC, Bitget, Bybit, Gate) | Every two weeks |
| `cex-regions.json` | Regulator facts per exchange (e.g. PH SEC advisory) | With crypto |
| `rules.json` | PH tax on interest, PDIC cover, inflation, policy rate, each with source | End of each month |
| `fx.json` | BSP peso per US dollar rate (converts ₱ amounts to coin caps) | Every refresh |
| `overrides.json` | Hand fixes keyed by row id (tiers, rate after promo, why) | As needed |
| `history.json` | Past rates per row id, for the sparkline: `{ "id": [{ "d": "2026-04-30", "r": 3.5 }] }` | Every refresh |

### Row fields
`provider, product, category (traditional|digital|ewallet|government|cex), currency, rate (% a year, or null),
upTo, kind (standard|promo), promoStarts, promoEnds, promoDays, rateAfterPromo, cap, rateAfterCap, capText,
tiers [[upTo, rate], …, [null, rate]], lockup, tenorDays, minDeposit, interestCredited, eligibility,
conditions, finePrint, pdic, taxExempt, taxNote, source (official URL), checkedOn (YYYY-MM-DD), verified, evidence, note`.

The build adds: `id`, `strings` (must do something to earn it), `vipOnly`, `newUsersOnly`, `teaser` (rate over 30%: listed, never ranked), `stablecoin`, `cons` (crypto), `history`.

## Stablecoins
Only **USDT, USDC and USDG** (George, 9 Nov 2026). The build drops every other coin from the exchange data: other stablecoins (USDe, FDUSD, DAI, PYUSD…) and BTC/ETH earn. DeFi (Kamino, Jupiter) lists the same three.

## Rules for every rate
1. **Official sources only:** the bank's or exchange's own page, its public API, or its official announcement. Rules come from BIR, PDIC, BSP and PSA. Never a blog or comparison site. Search results can lead you to the official page; they are not the source.
2. **Nothing invented.** If a rate is only in the app or the page can't be read, keep the row with `rate: null, verified: false` and say why in `note`.
3. **Promo or standard:** a promo has an end date (`promoEnds`) or a fixed length per user (`promoDays`), plus `rateAfterPromo`. A standard rate is ongoing, even if the bank can change it.
4. **Caps:** `cap` is the balance the rate applies to; money above it earns `rateAfterCap`. Use `tiers` when each band has its own rate.
5. **Date everything:** `checkedOn` is the day you read the page. Rows older than 35 days (PH) or 16 days (crypto) show "Needs re-check" on the page.

## Refresh procedure (what the scheduled tasks do)
1. Make a fresh worktree from `origin/main` on a new branch `claude/yields-refresh-YYYY-MM-DD`. Never work in the shared folder, and never push to `main`.
2. For each row in the files for this refresh (PH or crypto), open its `source` and re-read the rate, cap, promo dates and conditions. Look for new promos on the providers' official promo or announcement pages.
3. Before changing a rate, append the old `{ d: checkedOn, r: rate }` to `history.json` under the row's id.
4. Update the row and set `checkedOn` to today. Drop promos that have ended (keep them in history).
5. PH refresh only: update `rules.json` and `fx.json`:
   - **Inflation tracker:** set `inflation.value`, `month`, `label` and `checkedOn` from the BSP home page "Inflation Rate" key-rates chart. Append new months to `inflation.history` as `{ "m": "YYYY-MM", "v": 7.8 }`. The Advanced view's "Have you beaten inflation?" panel and the Beats / Below inflation badges read these fields. Real yield = rate after tax − inflation.
   - BSP policy rate (Target RRP) from the same page; re-check BIR/PDIC wording.
   - `fx.json`: BSP daily peso per US dollar rate. BSP blocks scripts, so use the in-app browser.
6. Run `node scripts/yields/build.js`, then fix every ERROR. Read the notes.
7. Commit (`Yield Tracker refresh (PH|crypto) YYYY-MM-DD: N rates changed`), push the branch, and open a PR with a short table of what changed (old → new, with source links).
8. Deploy the preview (`sh D:/Temp/yield-tracker/deploy.sh` with W pointed at the refresh worktree), then send the Command Center keeper a one-line card: what changed and the PR link.
9. **Going live needs George's typed go** (merge the PR). Do not merge unless George has said auto-publish is OK for refreshes.

## Partner and referral links
All partner (OKX, MEXC, Bitget, Bybit, Gate) and referral (Maya, MariBank, GoTyme code GTXGFA27Z70) links live in ONE place: the footer footnotes "Partner & referral links" (George, 9 Nov 2026). Rows and Finder picks show only a small "Referral link ↓" / "Partner link ↓" that jumps to the footnote. Links are set in `PARTNERS` in scripts/yields/build.js.

## Legal lines on the page
- Not financial advice (footer and finder note).
- Partner links (OKX, MEXC, Bitget, Bybit, Gate), Legal docket 26 / LD-023: "Partner link: we may earn a commission. An eligible sign-up may qualify for the partner's stated fee rebate. Check the offer's terms and availability. Trading involves risk; this is education, not advice." Links use `rel="sponsored"`.
- Bias line: "We may earn a commission if you sign up. It doesn't change our review: we list the cons as well as the pros."
- Global warning: "Rules differ by country. Check with your local regulator (in the Philippines, the SEC) that this exchange is allowed where you live before you sign up." Exchange accounts 18+.
- Crypto rows carry cons: not insured, rates and withdrawals can change, regulator facts from `cex-regions.json`.

Footer credit: "By Zeefreaks and jayowtrades" (Jake/jayowtrades is on the team; George confirmed the OK, 9 Nov 2026).
