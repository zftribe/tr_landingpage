# TR sticker sheet renders - 11 November 2026

Local review batch for Claude. Source: sheet.html and img/. Source wording and badge art were not edited. No git repository or live site was touched.

## Capture

Headless Chrome with direct CDP pipe, no browser connector or Computer Use. The Animation domain playback rate was set to zero. Every CSS/Web Animation, including pseudo-elements, was paused and sought to frame_number * 1000/30 milliseconds before a screenshot. For cc-badge-anim3, native external SVG CSS is also advanced using CDP Emulation virtual-time budgets at 30 fps. The three badges use settled source capture frames 288..431, with frame 432 retained only for wrap verification. No real-time screen recording or repeated endpoint frames in the exported loops. HTTP(S) requests were blocked; no install or download was performed.

Web: 1600 px viewport, 1600x1938 output. Phone: 390 px viewport at device scale 2, 780x4536 output. Full sheet height is retained, including a little overflow from entrance transforms. Both poster versions contain 240 frames over 8 seconds. Original entrance finishes at 3.8 s, leaving 4.2 s of idle motion, including the requested final 2 s. Poster GIF replay restarts the entrance; seamless wrapping applies to badge exports.

MP4 settings: H.264 High, yuv420p, CRF 16, slow preset, faststart, 30 fps, silent.

## Badge loop closure

All badge backgrounds are opaque #1b1612. Main GIFs and lossless WebP twins are 256x256; Discord GIFs are 64x64. Each GIF contains 144 frames over 4.8 seconds. GIF centisecond timing alternates 30/40 ms to average 30 fps. WebP uses 33/34 ms and coalesces identical consecutive frames; its final delay is adjusted by 1 ms to reach exactly 4.8 seconds. The inventory lists actual stored WebP frames.

The ten regular badges use the sheet's light sweep and exactly 6 px of float on the 256 px canvas. The 64 px exports scale that motion proportionally. Tile geometry, silver/gold rims and source image choices are retained. WEB3 Masterclass uses digital-walkers-B-256.png (selected logo B, Node hex); Pathfinders uses masterclass.png on the gold-rim tile.

Booster durations were retimed: float 4.8 s; flame .6 s alternate (1.2 s full period); glow 1.2 s alternate (2.4 s full period); sparkles 2.4 s. Every full period divides 4.8 s. Sparkle delays are 0, -1.6 and -.8 s: equivalent steady-state phases to the original 0, .8 and 1.6 s, without an unanimated initial delay. Frame samples run from t=0 through t=4.7667 s, omitting a duplicate t=4.8 s endpoint. The ten regular badge endpoint renders match exactly; the booster has negligible subpixel edge rasterization differences (66 pixels, mean absolute RGB difference 0.005/255 on its canvas).

## Palettes and size limits

Each badge GIF has its own fixed palette, generated over its entire loop, with Sierra2_4a error diffusion. No changing per-frame palette is used. Every main and 64 px badge GIF is below 1,500,000 bytes. WebP twins are lossless.

Web poster GIF uses a fixed 256-entry palette and Sierra2_4a dither. Where the source pixel is unchanged, its previous quantized colour is retained, avoiding dither churn. An exact remap with dither=none packages those already-dithered colours for delta compression.

Phone poster GIF encoding exception: a fixed 96-entry palette, ordered Bayer dither in flat areas, and Sierra2_4a in the booster candle/glow gradient area. This keeps its full 780x4536 size and all 240 frames below 15,000,000 bytes. Palette indices are remapped exactly after compositing; the composited background remains opaque. Both poster GIFs reserve one palette slot for delta-frame transparency. The MP4 twins retain full-colour gradients.

## Offline local fonts (corrected poster render)

Job cc-badge-poster-fonts re-rendered the four poster media files from sheet.html using fonts/local.css and local WOFF2 files. Both viewports waited for document.fonts.ready. document.fonts.check passed for every text element's actual family, weight and style: Playfair Display 700, Space Grotesk 500/700, Patrick Hand 400/700, Caveat 600/700, all normal. CDP CSS.getPlatformFontsForNode confirmed custom Playfair Display, Space Grotesk Light (internal family name, Medium/Bold faces), Patrick Hand and Caveat SemiBold. Caveat's 700 NEW label uses the supplied 600 face with browser weight synthesis. No Times New Roman, Arial or Comic Sans fallback was used in the inspected text. Full results for both viewports are in validation.json.

Poster checks: poster-web-check.png and poster-phone-check.png each show decoded MP4 frame 0 at left and frame 120 (4 s) at right, at full resolution. Frame 0 is the source's empty entrance state. Both composites and final GIF midpoint images were visually inspected.

WEB3 B update (cc-badge-web3b): the four posters were re-rendered because the fonts job captured the old WEB3 art. Current posters use the selected Node hex image and the same verified local fonts. The 30 other badge files remain byte-identical; validation.json records before/after SHA-256 hashes. Only the 256x256 WEB3 image rectangle changed in contact.png; zero pixels changed outside it. WEB3 t=0 and t=4.8 s captures match exactly.

## Verification

All 24 GIFs were fully decoded. GIF and WebP frame tables, durations, dimensions and infinite-loop flags were checked. Both MP4s were checked with ffprobe for frame count, duration, resolution, High profile and yuv420p; MP4 atom order confirms faststart. Source sheet and image SHA-256 hashes were rechecked. Final poster images and badge contact sheet were visually inspected. contact.png shows the decoded first frame of each final badge GIF, labelled. validation.json includes exact byte counts and SHA-256 hashes for all media.

Temporary files: _chrome-profile and _render are retained as explicitly requested for owner review. No cleanup was attempted in the fonts correction job. No publication or Claude approval is claimed. Root HANDOFF.md records this local render session.

## File inventory

| File | Dimensions | Bytes | Duration (s) | Stored frames |
|---|---:|---:|---:|---:|
| booster-64.gif | 64x64 | 135978 | 4.8 | 144 |
| booster.gif | 256x256 | 807482 | 4.8 | 144 |
| booster.webp | 256x256 | 1420114 | 4.8 | 144 |
| citizen-64.gif | 64x64 | 139455 | 4.8 | 144 |
| citizen.gif | 256x256 | 858527 | 4.8 | 144 |
| citizen.webp | 256x256 | 1011282 | 4.8 | 144 |
| community-leader-64.gif | 64x64 | 119212 | 4.8 | 144 |
| community-leader.gif | 256x256 | 813316 | 4.8 | 144 |
| community-leader.webp | 256x256 | 1363128 | 4.8 | 119 |
| contact.png | 1120x1010 | 192843 | 0 | 1 |
| eternals-64.gif | 64x64 | 194907 | 4.8 | 144 |
| eternals.gif | 256x256 | 1399883 | 4.8 | 144 |
| eternals.webp | 256x256 | 2573014 | 4.8 | 119 |
| explorer-64.gif | 64x64 | 91649 | 4.8 | 144 |
| explorer.gif | 256x256 | 556405 | 4.8 | 144 |
| explorer.webp | 256x256 | 604218 | 4.8 | 119 |
| guild-leader-64.gif | 64x64 | 142982 | 4.8 | 144 |
| guild-leader.gif | 256x256 | 1014670 | 4.8 | 144 |
| guild-leader.webp | 256x256 | 1360068 | 4.8 | 144 |
| liquidity-provider-64.gif | 64x64 | 125465 | 4.8 | 144 |
| liquidity-provider.gif | 256x256 | 454654 | 4.8 | 144 |
| liquidity-provider.webp | 256x256 | 598822 | 4.8 | 144 |
| pathfinders-64.gif | 64x64 | 153942 | 4.8 | 144 |
| pathfinders.gif | 256x256 | 953636 | 4.8 | 144 |
| pathfinders.webp | 256x256 | 1484206 | 4.8 | 142 |
| poster-phone.gif | 780x4536 | 13956903 | 8 | 240 |
| poster-phone.mp4 | 780x4536 | 2852890 | 8 | 240 |
| poster-web.gif | 1600x1938 | 12836746 | 8 | 240 |
| poster-web.mp4 | 1600x1938 | 1729861 | 8 | 240 |
| technical-intensive-64.gif | 64x64 | 150576 | 4.8 | 144 |
| technical-intensive.gif | 256x256 | 842246 | 4.8 | 144 |
| technical-intensive.webp | 256x256 | 843530 | 4.8 | 142 |
| wealth-builder-64.gif | 64x64 | 172596 | 4.8 | 144 |
| wealth-builder.gif | 256x256 | 933931 | 4.8 | 144 |
| wealth-builder.webp | 256x256 | 1351590 | 4.8 | 119 |
| web3-masterclass-64.gif | 64x64 | 133789 | 4.8 | 144 |
| web3-masterclass.gif | 256x256 | 724607 | 4.8 | 144 |
| web3-masterclass.webp | 256x256 | 1070740 | 4.8 | 119 |
| anim3-check.png | 1152x1776 | 644697 | 0 | 1 |
| validation.json | text | 123932 | n/a | n/a |
| CODEX-FINAL.txt | text | 1634 | n/a | n/a |
| README.md | text | 11200 | n/a | n/a |

| poster-web-check.png | 3200x1938 | 936772 | 0 | 1 |
| poster-phone-check.png | 1560x4536 | 1421753 | 0 | 1 |
| CODEX-FINAL-fonts.txt | text | 500 | n/a | n/a |
| CODEX-FINAL-web3b.txt | text | 2415 | n/a | n/a |
| CODEX-FINAL-anim3.txt | text | 3865 | n/a | n/a |

## cc-badge-anim3 final pass

Re-rendered Liquidity Provider, Citizen and Guild Leader from the original animated SVGs rendered as img elements inside the sheet-derived badge tiles. The SVG files were neither rewritten nor inlined. Headless Chrome virtual time advances their own CSS, while the parent float and sweep are paused and sought through CDP. Each screenshot's 0.001 ms compositor wake-up is included in the next frame's budget. A warm-up paint and two complete 30 fps pre-roll cycles settle SVG image clocks. Final badge frame 0 and diagnostic frame 144 are pixel-identical across all three badges, with zero changed pixels. All periods divide 4.8 seconds, including LP's 0.8/0.96/1.2/1.6 s bars and the candles' 2.4 s cycles. The three final GIFs use per-badge palettegen/paletteuse Sierra2_4a; all are below 1.5 MB. Lossless WebP ANMF frames were checked for VP8L.

The four posters were captured again from current sheet.html, retaining WEB3 logo B and all three native SVG animations. document.fonts.ready, document.fonts.check, computed styles and CDP custom platform-font checks passed for all four families at both viewports before capture. Every SVG was warmed while the sheet was visible, before resetting the poster entrance to zero. Poster GIF settings remain the fixed 256-colour Sierra web / 96-colour hybrid phone settings documented above.

Only the three 256x256 image rectangles in contact.png changed (x=564, y=28/347/666); zero outside pixels changed. All 24 files for the other eight badges match both their before hashes and the post-cc-badge-web3b hashes. Full before/after SHA-256 values and source hashes are in validation.json.

Candle timings below use zero-based output frames. Motion turning points are estimated from rendered wick geometry fitted to the source ease-in-out curve after subtracting the known 6 px parent float. Colour changes are measured independently from rendered green/red pixels. Each colour flip is within one frame of the corresponding motion extremum. anim3-check.png shows each turning frame and its adjacent frames, all three badges at once.

| Candle | Top turns | Bottom turns | Colour changes | Maximum offset |
|---|---|---|---|---|
| citizen-left | 34, 106 | 70, 142 | 35 red, 71 green, 107 red, 143 green | 1 frame |
| citizen-right | 70, 142 | 34, 106 | 35 green, 71 red, 107 green, 143 red | 1 frame |
| guild-left | 34, 106 | 70, 142 | 35 red, 71 green, 107 red, 143 green | 1 frame |
| guild-middle | 10, 82 | 46, 118 | 11 red, 47 green, 83 red, 119 green | 1 frame |
| guild-right | 58, 130 | 22, 94 | 23 green, 59 red, 95 green, 131 red | 1 frame |
