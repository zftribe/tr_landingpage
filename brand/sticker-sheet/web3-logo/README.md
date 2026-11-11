# WEB3 Masterclass options - 11 Nov 2026

Finished drawing options for Claude's audit and George's selection. These files are local review assets; no option is approved or integrated.

## Files

- `web3-masterclass-A.svg` - Candle chain vector, 76 x 76 viewBox and exact LP family tile.
- `web3-masterclass-A-256.png` - A logo, 256 x 256 RGBA PNG.
- `web3-masterclass-B.svg` - Node hex vector, 76 x 76 viewBox and exact LP family tile.
- `web3-masterclass-B-256.png` - B logo, 256 x 256 RGBA PNG.
- `web3-masterclass-C.svg` - Block W vector, 76 x 76 viewBox and exact LP family tile.
- `web3-masterclass-C-256.png` - C logo, 256 x 256 RGBA PNG.
- `digital-walkers-A-256.png` - A Discord badge, 256 x 256 RGBA PNG.
- `digital-walkers-A-64.png` - A Discord badge, directly rasterized at 64 x 64.
- `digital-walkers-B-256.png` - B Discord badge, 256 x 256 RGBA PNG.
- `digital-walkers-B-64.png` - B Discord badge, directly rasterized at 64 x 64.
- `digital-walkers-C-256.png` - C Discord badge, 256 x 256 RGBA PNG.
- `digital-walkers-C-64.png` - C Discord badge, directly rasterized at 64 x 64.
- `proof-sizes.png` - 1000 x 880 labelled proof: unchanged LP reference and A/B/C, each at actual 64/40/32/20/16 px on #0b0b0c and white.
- `README.md` - File inventory, drawing changes, badge treatment and verification notes.
- `CODEX-FINAL.txt` - Complete SEND THIS TO CLAUDE handoff.

## Changes from concepts

- A: Removed the dotted diagonal and short horizontal stubs; replaced them with two continuous 4.5-unit diagonal gold links. Separated candle centers to x20/38/56, widened bodies to 11 units and wicks to 3.5 units. Three rising candles remain distinct while links survive reduction.
- B: Thickened hexagon edges from 2.5 to 4 units. Replaced hollow nodes with six solid gold circles of radius 4.5, keeping the six-node network and one green candle. Increased candle wick to 3.5 units and body to 13 units wide. Solid nodes survive small raster sizes more cleanly than tiny ring interiors.
- C: Thickened the W line from 4 to 5 units and enlarged blocks from 9 to 11 units. Nudged turns inward to preserve tile clearance and kept the gold/red/gold/red/green order and tile-colour separation around each block.
- All logo SVGs retain the exact requested tile: x2/y2, 72 x 72, rx16, #141416 fill, #F9A825 stroke at 1.5. Motifs use only the supplied palette. No gradients, visible text, external images or third-party marks.
- Discord badges follow `badge-square.html`: a square canvas containing the rounded tile, transparent exterior corners, a stronger 2-unit tile border and a slightly inset motif. The same finished motif is scaled to 92% about the center, without redesign or extra symbols. The 1.5-unit rule is preserved in the masterclass logos; the badge's 2-unit border follows the supplied badge method.

## Verification and reproducibility

Read the direction guide, all three source SVGs, existing size proof, LP SVG/badge HTML and PNG, and the three supplied current role badges before drawing. Source references were read only.

Rendered locally with installed headless Chrome at device scale 1, using embedded SVGs and no downloads or browser connector. Cropping with System.Drawing preserves pixels without resizing. Visual review covered the final size proof, all 256/64 exports and the before/after sheet. Distinct silhouettes and colour order remain visible at 16/20/32 px; fine candle/network detail is naturally reduced at 16 px. Claude's audit and George's selection remain pending.

Supporting local files outside this delivery folder: `../render.cjs`, `../render.ps1`, `../_render/before-after.png`, and render sheets. Run `powershell -NoProfile -ExecutionPolicy Bypass -File .\render.ps1` from the workdir to reproduce PNGs (process-only execution-policy setting). Temporary Chrome profile is removed after rendering. No Git repository or live site was touched.
