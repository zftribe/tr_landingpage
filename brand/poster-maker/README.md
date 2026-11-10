# TR Poster Maker

Live tool (claude.ai artifact, private until shared): https://claude.ai/artifact/CYMPqGvbySrUYd49dUhYsN

- **Templates:** 5 favourites (The Hunt, The Council, Monthly Meetup, Charts Decoded, Monday Market Updates) + 12 base templates.
- **Looks:** Series looks in 5 styles (Signature, Spotlight, Split panel, Terminal, Editorial) + Bold blocks. George's pick, 8 Nov 2026.
- **Colour themes:** 11 (Show colours, House gold, Midnight, Emerald, Sunset, Royal, Crimson, Ocean, Mono, Paper light, Neon pink).
- **Speakers:** up to 3, each with an optional photo.
- **Sizes:** square 1080, 4:5 1080×1350, story 1080×1920, Discord cover 1600×640.
- **Export:** PNG, or a looping GIF (4–10 s, 10–15 fps, 540/720/1080 px wide).
- **House rules in the engine:** the footer is an adaptive pill only, and text stays at least 16 px inside every box.

## Files
- `src/posters.js`: the engine (canvas, no libraries).
- `src/gif.js`: the GIF writer (median-cut palette, ordered dither, LZW).
- `src/studio.html`: the tool page.
- `src/pick.html` + `src/pick-engine-v1.js`: the look-pick page George answered.
- `src/test.html`, `src/giftest.html`: render harnesses used for testing.
- `build.py`: inlines logos from `../logos/` and the scripts into self-contained pages. Usage: `python build.py <before_dir> <out_dir> studio.html`.
- `LMS-PLAN.md`: how this moves into the LMS admin dashboard later.

## Sharing with staff (George does this)
1. Open the link above, then use **Share** (top right) to share with each staff member's claude.ai account, or with the organisation.
2. Viewers can use it fully, including downloading PNGs and GIFs; nothing they type is saved for others.
3. To update the tool, ask Claude to republish the same artifact so the link stays the same.
