# Trusted Partners affiliate carryover

Source: https://georgeasibal.com/#partners
Observed from the live partner cards' raw href attributes at 2026-11-06T15:29:05.544Z.

George approved the design and requested: "make sure the affiliate links are also carried over from my personal website to the welcome". This authorizes local link edits; no push, merge or deployment.

| Partner | Exact destination | Result |
| --- | --- | --- |
| Binance | `https://www.binance.com/register?ref=TROFF5` | already exact match |
| Bitget | `https://partner.bitget.com/bg/OFF20` | added affiliate link |
| OKX | `https://www.okx.com/join/OFF2O` | added affiliate link |
| MEXC | `https://www.mexc.com/acquisition/custom-sign-up?shareCode=mexc-TR20OFF` | added affiliate link |
| Bybit | `https://partner.bybit.com/b/tradingrepub` | added affiliate link |
| Gate.io | `https://www.gate.com/share/BULLZONE` | already exact match |
| XM | `https://affs.click/mkfnD` | added affiliate link |
| eToro | No affiliate link on source site | no source link; left unlinked |

The personal site's additional nine brands are outside the Welcome section's existing partner list and were not added. All eight existing partner identities matched unambiguously. eToro remains the only missing affiliate destination; owner-supplied link needed if it should become clickable.

The live Welcome page previously linked only Binance and Gate.io in this strip. Its six detailed exchange cards already match the personal-site URLs exactly and remain unchanged. Layout, logos and motion code are unchanged from the approved review.

Verification passed:
- Production build, including TypeScript and all six static routes.
- JavaScript syntax and git diff whitespace checks.
- All 28 rendered hrefs (seven destinations, four repeated sets) exactly equal source hrefs; referral identifiers and query parameters preserved.
- All affiliate links use target=_blank and rel=noopener noreferrer sponsored.
- Seven keyboard tab stops in partner order; all decorative clone links tabindex=-1 inside aria-hidden groups.
- Mobile 320px keyboard navigation reaches XM with visible gold focus, static grid, and focus bounds inside the viewport after smooth scrolling settles. No horizontal page overflow.
- Source diff confirms no changes in styles, motion script, detailed exchange content, package manifest or lockfile for this follow-up.

No affiliate links were opened, signup flows created, or third parties contacted. These checks verify link equality and rendered behavior; no claims about partner landing-page availability or affiliate attribution after signup.

Evidence files: C:/Users/Zeefreaks/Documents/Codex/2026-11-06/task-5/review/personal-affiliate-source.json, affiliate-mappings.json, affiliate-rendered-checks.json, affiliate-keyboard-order.json and affiliates-mobile-focus.jpg.
