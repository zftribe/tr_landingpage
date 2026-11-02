# Trading Republic Welcome

Public storefront for Trading Republic by ZFT: **https://welcome.tradingrepublic.io/**.

Canonical source: [zftribe/tr_landingpage](https://github.com/zftribe/tr_landingpage).
This is a static HTML site. It introduces programs, free lessons, webinars and
community access; it does not authenticate members or determine paid entitlements.

Start here with any developer or coding agent:

- [Cross-repository handoff and current status](HANDOFF.md)
- [Local preview, checks, review and release/rollback](PREVIEW-AND-RELEASE.md)
- [Decisions and unresolved product questions](DECISIONS.md)
- [Historical V2 changelog](v2-changelog.md) — historical, not current offer terms

## Run locally

Node.js 20 or later is sufficient. There are no packages to install or build step.

```sh
git clone --branch codex/welcome-handoff-2026-11-02 https://github.com/zftribe/tr_landingpage.git
cd tr_landingpage
node preview.mjs
```

Open **http://127.0.0.1:59127/**. The server listens on loopback only. Stop it with
Ctrl+C. Use `node preview.mjs --port 59128` if that port is occupied.
The branch option is required while this handoff is an unmerged review branch;
the new preview files are not present on `main` yet.

```sh
node --test preview.test.mjs
```

## Structure

| Path | Purpose |
|---|---|
| `index.html` | Main page, inline CSS and browser JavaScript |
| `logos/`, `programs/`, `webinars/` | Referenced visual assets; prefer current WebP files |
| `yield-tracker/index.html` | Separate tracker with its own data dependencies |
| `preview.mjs` | Local static server, no authentication or payment processing |
| `preview.test.mjs` | Local asset, JavaScript syntax and server boundary checks |

Google Fonts, YouTube and Google Calendar require network access. Current program
buttons lead to the existing shop; Discord and social buttons leave this site.
Inspect those destinations before clicking during review. Tests do not sign in,
buy anything, post messages or change the calendar.

## Relationship to LMS

The intended model is **Welcome = public storefront; LMS = member profile and
learning hub**. Future Welcome product selections should enter a verified LMS
product/checkout route using stable catalogue identifiers. That link contract is
not implemented on this branch. Existing shop links remain in `index.html` until
the catalogue, pricing, checkout and existing customer rights are reconciled.

LMS source is a separate private repository: [zftribe/LMS](https://github.com/zftribe/LMS).
Access to this public repository does not confer access to LMS or its deployments.

## Review boundary

This handoff branch adds documentation and local preview tooling. It does not
change homepage offers, authentication, checkout, permissions or production
settings. A branch or draft PR is for review, not release approval. Do not merge
to `main` or promote a deployment without the owner's explicit release decision.
