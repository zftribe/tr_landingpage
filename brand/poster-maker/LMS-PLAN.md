# Moving the Poster Maker into the LMS admin dashboard

Status: **plan only, not built.** Do this after George picks the look and staff have used the claude.ai version for a few weeks.

## Why move it
- Staff already sign in to the LMS (zftribe/LMS, Next.js + Supabase). Sharing a claude.ai artifact with each staff member is a manual step and depends on their claude.ai accounts.
- The LMS already has **live events** (`/admin/events`, `/api/admin/live-events`) and **event templates** (`/api/admin/event-templates`). A poster can then be made from the event record itself, so the date, time, host and link are typed once.

## What carries over unchanged
The renderer is one plain-JS file, `brand/poster-maker/src/posters.js` (canvas, no libraries). It moves as-is into the LMS as `lib/posters/engine.ts` (a thin TypeScript wrapper around the same code). Templates, looks, sizes and house rules (adaptive footer pill, 16 px inside every box) stay in that file, so the claude.ai version and the LMS version draw the same posters.

## Steps
1. **Logos and fonts:** copy `brand/logos/` (from the tr_landingpage logo library, PR #11) into `public/brand/` in the LMS, and read `manifest.json` for the partner picker. Load fonts with `next/font/google` (Plus Jakarta Sans, DM Sans, Anton, Archivo Black, Permanent Marker).
2. **Page:** add `app/admin/posters/page.tsx`, a client component with the template picker, the fields, a live `<canvas>` preview and size buttons. Download is a plain `canvas.toBlob()` → `<a download>`; the LMS has no artifact sandbox, so no special capability is needed.
3. **Access:** gate the page with the existing admin check (`profiles.user_role` in `admin`, `super_admin`). Add a `staff` role to the gate if George wants guild leaders and MCs to use it without full admin.
4. **"Make poster" on events:** on `/admin/events`, add a button per live event that opens `/admin/posters?event=<id>` with title, date and time (Asia/Manila), host and link prefilled. Map each event template to a poster template (The Hunt → `hunt`, and so on).
5. **Host photos:** upload to Supabase Storage in a new private bucket `poster-photos`. Only admins can read or write it (RLS). Keep files 90 days. Don't reuse member avatars without consent.
6. **Saved posters (optional):** a `posters` table (`id, event_id, template, look, size, fields jsonb, png_path, created_by, created_at`) and a `posters` storage bucket, so staff can reopen and tweak last week's poster. Write a migration `db/0xx_posters.sql` with RLS (admins only). Staging first, as with every LMS migration.
7. **Tests:** one Playwright check that renders each template at each size and asserts no text box sits closer than 16 px to its edge (the engine can report text boxes in a debug mode). Plus a visual snapshot per favourite.

## Not in scope
- Auto-posting to Discord or Facebook. Posting stays manual, and George's typed go is needed for anything automatic.
- AI-written captions. Could be added later through the existing Claude setup if George wants it.

## Size and cost
About 1–2 days for one developer. Free tier only: Supabase Storage free quota covers photos (keep them small, under 1 MB each, resized in the browser before upload). No new paid services.
