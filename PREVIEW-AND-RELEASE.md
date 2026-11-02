# Preview, checks and release

## Before editing

```sh
git fetch origin
git remote -v
git status --short
git switch -c feature/describe-one-change origin/main
```

If work is already present, preserve it and choose an isolated checkout/branch.
The commands are a new-work example, not instructions to discard or reset changes.
No environment file or credential is needed to preview the static Welcome page.

## Local checks

```sh
node --test preview.test.mjs
node preview.mjs --port 59127
```

Review `http://127.0.0.1:59127/` and `/yield-tracker/`. Confirm images, anchors,
navigation, free playlists, program buttons, carousel behavior and the calendar's
fallback behavior when external services are unavailable. At desktop and mobile
widths, check text wrapping, horizontal overflow, keyboard focus and reduced-motion
behavior. Tests are limited asset/syntax/server checks, not accessibility,
performance, curriculum, payment or external-data certification.

The preview server accepts GET/HEAD only, denies hidden paths and symlink escape,
and serves only the checkout directory on loopback. Do not expose it through a
public tunnel or use it as a production server. External embeds and links retain
their real destinations; do not perform real purchases or participant actions in QA.

## Publish for review

Push only the named feature branch and open a **draft pull request** against
`main`. State the source revision, changed behavior, verification and open decisions.
Do not paste secrets, local environment files, customer records or unredacted logs.

Vercel may generate a preview for a branch/PR if the existing integration allows it.
Record the actual preview URL and commit SHA after confirming them in GitHub/Vercel;
do not invent a preview URL or claim one exists merely because a branch was pushed.
If no preview is produced, local preview remains usable. Do not change account
permissions or production settings to force a preview.

For an LMS-linked preview, verify the destination uses isolated staging data and
safe payment configuration before exercising any authenticated flow. A storefront
preview must not silently route synthetic checkout tests into a real payment.

## Release and recovery

Production release is a separate owner decision. Current repository history shows
Vercel auto-deployments; confirm which branch deploys production before merging.
Treat a merge to `main` as potentially production-affecting. Record the approved
commit, deployment URL, domain mapping, smoke tests and previous working deployment.

If a new Welcome deployment breaks the site, use the existing Vercel deployment
history to restore the last verified build, then correct/revert the code through a
reviewed branch. Reverting source and rolling back a running deployment are distinct
operations; verify the public domain afterward. A Welcome rollback does not undo
LMS database changes, payments, membership grants, provider settings or DNS changes.
No deployment, rollback or provider change is performed by this documentation.
