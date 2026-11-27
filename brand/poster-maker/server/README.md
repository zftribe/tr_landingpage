# Poster Maker server (zeefreaks.io/posters)

These are the PHP files that run the live Poster Maker on Hostinger (georgeasibal.com `public_html/posters/`, served at zeefreaks.io/posters). They were copied from the live folder on 26 Nov 2026 (live snapshot). The page itself, `app.html`, is not stored here: it is built from `../src/` with `python build.py --standalone <out>/app.html`.

## What runs where
- `index.php`: the sign-in page, or the tool (`app.html` + the signed-in user's `window.ZT`) once signed in.
- `auth-discord.php`, `auth-email.php`, `verify.php`, `logout.php`: sign-in for the Guild Leaders role (Discord) or invited emails.
- `admin.php`: the Access page (roles, invites, team brand kit, scheduled posts, photo requests, activity).
- `designs.php`: saved designs and team history. `presets.php`: weekly and monthly presets. `prefs.php`: tour flag, hidden templates and photo requests.
- `brand.php`: the team brand kit. `schedule.php` + `cron.php`: scheduled Discord posts. `cron.php` runs only from the command line, via the Hostinger Cron Job every 5 minutes.
- `post-discord.php`, `post-fb.php`, `fb-login.php`, `event.php`: posting and Discord events.
- `lib/`: helpers (blocked from the web by `.htaccess`). `photos/`: the backdrop photo library, also produced by `build.py --standalone` from the photo masters.

## Secrets and live values: never in Git
- Real settings live in `zft-tools/config.php`, one level above `public_html`, together with `data/` and `sessions/`. They are not in this repo and must never be.
- `config.sample.php` shows every key.
- In this copy, the live values below are replaced with `CHANGE_ME`. Restore them before uploading the file:
  - `config.sample.php`: `guild_id`, `allowed_role_ids`, `mail_from`, `smtp_user`.
  - `lib/bootstrap.php` (defaults used only when config.php lacks a key): `guild_id` (Trading Republic server ID) and `mail_from`.
- Upload rule: replace only the files a release changes, and never upload `lib/bootstrap.php` from here unless its `CHANGE_ME` defaults are restored first.
