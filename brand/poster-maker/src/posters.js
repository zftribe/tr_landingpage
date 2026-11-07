/* Trading Republic poster engine v2.
   Looks: "series" (5 styles) and "bold" (colour blocks). Colour themes override any template.
   Up to 3 speakers. Every render can be a frame of a seamless loop (opts.t seconds of opts.dur).
   House rules: footer is an adaptive pill only; text keeps >= 16 px inside any box. */
(function () {
  const IMG = {};
  const SIZES = {
    square: { w: 1080, h: 1080, label: "Square 1:1", sub: "FB / IG feed", file: "square" },
    portrait: { w: 1080, h: 1350, label: "Portrait 4:5", sub: "FB / IG feed", file: "4x5" },
    story: { w: 1080, h: 1920, label: "Story 9:16", sub: "FB / IG story", file: "story" },
    discord: { w: 1600, h: 640, label: "Discord cover", sub: "Event banner 2.5:1", file: "discord" },
  };
  const GOLD = "#FFB400";
  const BOX_PAD = 16;
  const DISPLAY = '"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';
  const BODY = '"DM Sans", "Segoe UI", Arial, sans-serif';
  const ANTON = 'Anton, Impact, "Arial Narrow", sans-serif';
  const ARCHIVO = '"Archivo Black", "Arial Black", Arial, sans-serif';
  const MARKER = '"Permanent Marker", "Comic Sans MS", cursive';
  const MONO = '"JetBrains Mono", Consolas, "Courier New", monospace';
  const TAU = Math.PI * 2;

  /* ---------- colour + maths helpers ---------- */
  function rgb(hex) { const h = hex.replace("#", ""); const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function A(hex, a) { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${a})`; }
  function lum(r, g, b) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
  function hexLum(hex) { return lum(...rgb(hex)); }
  function rng(seed) {
    let a = 0; for (const c of String(seed)) a = (a * 31 + c.charCodeAt(0)) >>> 0;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
  function rr(ctx, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function font(w, px, fam) { return `${w} ${Math.round(px)}px ${fam}`; }
  function setFont(ctx, w, px, fam, ls) { ctx.font = font(w, px, fam); ctx.letterSpacing = ((ls || 0) * px).toFixed(2) + "px"; }
  function wrap(ctx, text, maxW) {
    const out = [];
    for (const para of String(text || "").split("\n")) {
      let line = "";
      for (const w of para.split(/\s+/).filter(Boolean)) { const t = line ? line + " " + w : w; if (ctx.measureText(t).width <= maxW || !line) line = t; else { out.push(line); line = w; } }
      if (line) out.push(line);
    }
    return out;
  }
  function fit(ctx, text, fam, w, maxW, maxPx, minPx, maxLines, ls) {
    maxPx = Math.max(minPx, maxPx);
    for (let px = Math.floor(maxPx); px >= minPx; px -= 2) {
      setFont(ctx, w, px, fam, ls); const lines = wrap(ctx, text, maxW);
      if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxW)) return { px, lines };
    }
    setFont(ctx, w, minPx, fam, ls);
    const lines = wrap(ctx, text, maxW); if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] += "…"; }
    return { px: minPx, lines };
  }
  function avgColor(ctx, x, y, w, h) {
    try { const d = ctx.getImageData(Math.max(0, x | 0), Math.max(0, y | 0), Math.max(1, w | 0), Math.max(1, h | 0)).data; let r = 0, g = 0, b = 0, n = 0; for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } return [r / n, g / n, b / n]; } catch (e) { return [20, 20, 24]; }
  }
  function coverImg(ctx, img, x, y, w, h, fx, fy, zoom) {
    const s = Math.max(w / img.width, h / img.height) * (zoom || 1); const iw = img.width * s, ih = img.height * s;
    ctx.drawImage(img, x + (w - iw) * (fx ?? 0.5), y + (h - ih) * (fy ?? 0.4), iw, ih);
  }
  function containImg(ctx, img, x, y, w, h, ax) {
    const s = Math.min(w / img.width, h / img.height); const iw = img.width * s, ih = img.height * s;
    ctx.drawImage(img, x + (w - iw) * (ax === "left" ? 0 : ax === "right" ? 1 : 0.5), y + (h - ih) / 2, iw, ih); return iw;
  }
  function vignette(ctx, W, H, col, a, cx, cy) {
    const v = ctx.createRadialGradient(W * (cx ?? 0.5), H * (cy ?? 0.5), Math.min(W, H) * 0.15, W / 2, H / 2, Math.max(W, H) * 0.78);
    v.addColorStop(0, A(col, 0)); v.addColorStop(1, A(col, a)); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  }
  function fadeDown(ctx, W, H, col, a0, a1, from) {
    const g = ctx.createLinearGradient(0, H * (from ?? 0.3), 0, H); g.addColorStop(0, A(col, a0)); g.addColorStop(1, A(col, a1)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  /* periodic random walk: n points, starts and ends at 0 */
  function walk(r, n, amp) { const v = [0]; for (let i = 1; i < n; i++) v.push(v[i - 1] + (r() - 0.5) * amp); const d = v[n - 1] / (n - 1); return v.map((x, i) => x - d * i); }

  /* ---------- dates ---------- */
  function fmtDate(d) {
    if (!d) return ""; const [Y, M, D] = d.split("-").map(Number); const dt = new Date(Date.UTC(Y, M - 1, D));
    return `${["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][dt.getUTCDay()]} · ${["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][M - 1]} ${D}`;
  }
  function fmtTime(t) { if (!t) return ""; let [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; return `${h}${m ? ":" + String(m).padStart(2, "0") : ""} ${ap}`; }
  function timeLine(f) { const a = fmtTime(f.time), b = fmtTime(f.endTime); return a ? (b ? `${a} – ${b}` : a) + " PH time" : ""; }

  /* ---------- colour themes ---------- */
  const THEMES = {
    show: { name: "Show colours" },
    gold: { name: "House gold", bg: "#0b0b0f", bg2: "#18150b", ink: "#ffffff", sub: "#d2d2db", accent: GOLD, block: GOLD, blockInk: "#111111" },
    midnight: { name: "Midnight", bg: "#0a1022", bg2: "#14224f", ink: "#ffffff", sub: "#c9d3f0", accent: "#7db2ff", block: "#1d3fbf", blockInk: "#ffffff" },
    emerald: { name: "Emerald", bg: "#03140c", bg2: "#0b3a25", ink: "#effff6", sub: "#bfe9cf", accent: "#3ddc84", block: "#0E7A4F", blockInk: "#ffffff" },
    sunset: { name: "Sunset", bg: "#1a0905", bg2: "#3d1407", ink: "#ffffff", sub: "#ffd9c2", accent: "#ff8a3d", block: "#FF6A13", blockInk: "#ffffff" },
    royal: { name: "Royal", bg: "#120a22", bg2: "#2a1650", ink: "#ffffff", sub: "#ddd0ff", accent: "#c3a6ff", block: "#5B2A86", blockInk: "#ffffff" },
    crimson: { name: "Crimson", bg: "#160608", bg2: "#3a0b12", ink: "#ffffff", sub: "#ffd0d4", accent: "#ff5d6c", block: "#C1121F", blockInk: "#ffffff" },
    ocean: { name: "Ocean", bg: "#031418", bg2: "#0a3640", ink: "#eaffff", sub: "#bfe6ea", accent: "#3fe0d6", block: "#127475", blockInk: "#ffffff" },
    mono: { name: "Mono", bg: "#0b0b0b", bg2: "#202020", ink: "#ffffff", sub: "#cfcfcf", accent: "#ffffff", block: "#1c1c1c", blockInk: "#ffffff" },
    paper: { name: "Paper (light)", bg: "#f3f3ef", bg2: "#e4e3dc", ink: "#121212", sub: "#3c3c3c", accent: "#b87800", block: "#f3f3ef", blockInk: "#121212" },
    pink: { name: "Neon pink", bg: "#14040f", bg2: "#3a0a2c", ink: "#ffffff", sub: "#ffd1ef", accent: "#ff4fb8", block: "#d6248f", blockInk: "#ffffff" },
  };

  /* ---------- styles ---------- */
  const STYLES = {
    signature: { name: "Signature", look: "series", note: "Each show's own art and type" },
    spotlight: { name: "Spotlight", look: "series", note: "Big speakers or photo, cinematic" },
    split: { name: "Split panel", look: "series", note: "Solid text panel beside the art" },
    terminal: { name: "Terminal", look: "series", note: "Trading screen, ticker tape" },
    editorial: { name: "Editorial", look: "series", note: "Centred, clean, outlined title" },
    bold: { name: "Bold blocks", look: "bold", note: "One strong colour, big type" },
  };

  /* ---------- background art (p = loop phase 0..1) ---------- */
  const ART = {
    charts(ctx, W, H, s, r, P, p) {
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, P.bg); g.addColorStop(1, P.bg2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const gs = 60 * s, off = p * gs;
      ctx.strokeStyle = A(P.accent, 0.07); ctx.lineWidth = 1.5 * s;
      for (let x = -gs + (off % gs); x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      candles(ctx, W, H, s, r, P.accent, p, H * 0.6, 0.32);
      vignette(ctx, W, H, P.bg, 0.75);
    },
    council(ctx, W, H, s, r, P, p) {
      const g = ctx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.4, Math.max(W, H)); g.addColorStop(0, P.bg2); g.addColorStop(1, P.bg); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const n = Math.max(4, Math.round(W / (180 * s)));
      for (let i = 0; i < n; i++) {
        const fl = 0.75 + 0.25 * Math.sin(TAU * (p + i / n));
        const aw = 110 * s, x = (i + 0.5) * (W / n) - aw / 2, top = H * 0.08, bot = H * 0.62;
        const lg = ctx.createLinearGradient(0, top, 0, bot); lg.addColorStop(0, A(P.accent, 0.13 * fl)); lg.addColorStop(1, A(P.accent, 0));
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x, bot); ctx.lineTo(x, top + aw / 2); ctx.arc(x + aw / 2, top + aw / 2, aw / 2, Math.PI, 0); ctx.lineTo(x + aw, bot); ctx.fill();
      }
      ctx.fillStyle = A(P.accent, 0.09); ctx.beginPath(); ctx.ellipse(W / 2, H * 0.8, W * 0.55, H * 0.12, 0, 0, TAU); ctx.fill();
      fadeDown(ctx, W, H, P.bg, 0, 0.8, 0.45);
    },
    hunt(ctx, W, H, s, r, P, p) {
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      const R = Math.min(W, H) * 0.24, cy = H * 0.4;
      [W / 2 - R * 1.05, W / 2 + R * 1.05].forEach((cx, k) => {
        const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R); g.addColorStop(0, A(P.sub, 0.35)); g.addColorStop(0.7, A(P.sub, 0.14)); g.addColorStop(1, A(P.sub, 0.05));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.fill();
        ctx.strokeStyle = A(P.ink, 0.2); ctx.lineWidth = 10 * s; ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, TAU); ctx.clip();
        const v = walk(rng("hunt" + k), 40, 40 * s), step = (R * 2) / 20, off = p * 20 * step;
        ctx.strokeStyle = A(P.accent, 0.6); ctx.lineWidth = 3 * s; ctx.beginPath();
        for (let i = 0; i < 42; i++) { const x = cx - R - off + i * step; const y = cy + R * 0.2 + v[i % 40]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
        ctx.stroke();
        ctx.fillStyle = A(P.ink, 0.12); ctx.beginPath(); ctx.ellipse(cx - R * 0.35 + Math.sin(TAU * p) * R * 0.08, cy - R * 0.4, R * 0.28, R * 0.12, -0.5, 0, TAU); ctx.fill();
        ctx.restore();
      });
      vignette(ctx, W, H, P.bg, 0.9, 0.5, 0.42);
    },
    meetup(ctx, W, H, s, r, P, p) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.bg2); g.addColorStop(1, P.bg); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 46; i++) {
        const ph = r(), x = r() * W, y0 = r() * H * 0.75, rad = (10 + r() * 60) * s, a = 0.1 + r() * 0.22;
        const y = y0 + Math.sin(TAU * (p + ph)) * 14 * s, aa = a * (0.7 + 0.3 * Math.sin(TAU * (p * 2 + ph)));
        const bg = ctx.createRadialGradient(x, y, 0, x, y, rad); bg.addColorStop(0, A(P.accent, aa)); bg.addColorStop(1, A(P.accent, 0));
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = A(P.bg, 0.7);
      for (let i = 0; i < 14; i++) { const x = r() * W, w = (60 + r() * 90) * s; ctx.beginPath(); ctx.ellipse(x, H * 0.99, w, H * (0.1 + r() * 0.08), 0, 0, TAU); ctx.fill(); }
      fadeDown(ctx, W, H, P.bg, 0, 0.55, 0.4);
    },
    mmu(ctx, W, H, s, r, P, p) {
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) {
        const x = W * (0.2 + i * 0.3), y = H * (0.18 + r() * 0.15), rad = (70 + r() * 50) * s, rot = TAU * p * (i % 2 ? 1 : -1);
        ctx.strokeStyle = A(P.accent, 0.35); ctx.lineWidth = 8 * s; ctx.beginPath(); ctx.arc(x, y, rad, rot, rot + TAU * 0.8); ctx.stroke();
        ctx.strokeStyle = A(P.accent, 0.15); ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.arc(x, y, rad * 0.72, 0, TAU); ctx.stroke();
      }
      const v = walk(r, 30, 70 * s), step = W / 24, off = p * 30 * step;
      ctx.save(); ctx.shadowColor = A(P.accent, 0.9); ctx.shadowBlur = (22 + 10 * Math.sin(TAU * p)) * s; ctx.strokeStyle = P.accent; ctx.lineWidth = 6 * s; ctx.beginPath();
      for (let i = 0; i < 62; i++) { const x = -off + i * step; const y = H * 0.42 + v[i % 30]; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke(); ctx.restore();
      fadeDown(ctx, W, H, P.bg, 0.05, 0.85, 0.2);
    },
    grid(ctx, W, H, s, r, P, p) {
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      const gs = 72 * s, off = p * gs; ctx.strokeStyle = A(P.accent, 0.07); ctx.lineWidth = 1.5 * s;
      for (let x = -gs + off; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = -gs + off; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      const mark = hexLum(P.bg) > 0.5 ? IMG.trBlack : IMG.trGold;
      if (mark) { ctx.globalAlpha = 0.07; const mw = Math.max(W, H) * 0.75; ctx.drawImage(mark, W - mw * 0.7, H - mw * 0.55, mw, mw * mark.height / mark.width); ctx.globalAlpha = 1; }
      const v = ctx.createRadialGradient(W * 0.3, H * 0.3, 0, W * 0.3, H * 0.3, Math.max(W, H)); v.addColorStop(0, A(P.accent, 0.14 + 0.04 * Math.sin(TAU * p))); v.addColorStop(1, A(P.accent, 0)); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    },
    rays(ctx, W, H, s, r, P, p) {
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.rotate(p * TAU / 12); ctx.fillStyle = A(P.accent, 0.08);
      for (let i = 0; i < 24; i += 2) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, Math.max(W, H) * 1.2, (i / 24) * TAU, ((i + 1) / 24) * TAU); ctx.fill(); }
      ctx.restore(); vignette(ctx, W, H, P.bg, 0.8, 0.5, 0.42);
    },
    confetti(ctx, W, H, s, r, P, p) {
      ART.rays(ctx, W, H, s, r, P, p);
      const cols = [P.accent, P.ink, "#ff5d73", "#5ad1ff"];
      for (let i = 0; i < 90; i++) {
        const x = r() * W + Math.sin(TAU * (p + i * 0.1)) * 10 * s, y = ((r() + p) % 1) * (H + 40 * s) - 20 * s, rot = r() * Math.PI + TAU * p;
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = cols[i % 4]; ctx.globalAlpha = 0.5 + r() * 0.4; ctx.fillRect(-7 * s, -3 * s, 14 * s, 6 * s); ctx.restore();
      }
    },
    stripes(ctx, W, H, s, r, P, p) {
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      const band = 34 * s, off = p * band * 2; ctx.fillStyle = P.accent;
      for (const yy of [0, H - band * 1.6]) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, yy, W, band * 1.6); ctx.clip();
        for (let x = -band * 4 + off; x < W + band * 2; x += band * 2) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + band, yy); ctx.lineTo(x + band * 2.6, yy + band * 1.6); ctx.lineTo(x + band * 1.6, yy + band * 1.6); ctx.fill(); }
        ctx.restore();
      }
      const v = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.6); v.addColorStop(0, A(P.accent, 0.12 + 0.08 * Math.sin(TAU * p))); v.addColorStop(1, A(P.accent, 0)); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    },
    blueprint(ctx, W, H, s, r, P, p) {
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      const off = p * 120 * s;
      ctx.strokeStyle = A(P.accent, 0.1); ctx.lineWidth = 1 * s;
      for (let x = -120 * s + (off % (24 * s)); x < W; x += 24 * s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 24 * s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.strokeStyle = A(P.accent, 0.22); ctx.lineWidth = 2 * s;
      for (let x = -120 * s + off; x < W; x += 120 * s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 120 * s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    },
    spot(ctx, W, H, s, r, P, p) {
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      const cx = W * (0.62 + 0.12 * Math.sin(TAU * p));
      const g = ctx.createRadialGradient(cx, H * 0.2, 0, cx, H * 0.4, Math.max(W, H) * 0.8); g.addColorStop(0, A(P.accent, 0.3)); g.addColorStop(1, A(P.accent, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
    festive(ctx, W, H, s, r, P, p) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, P.bg2); g.addColorStop(1, P.bg); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) { const x = r() * W, y = r() * H, rad = (2 + r() * 5) * s, ph = r(); ctx.fillStyle = A(P.accent, 0.2 + 0.5 * (0.5 + 0.5 * Math.sin(TAU * (p * 2 + ph)))); ctx.beginPath(); ctx.arc(x, y, rad, 0, TAU); ctx.fill(); }
      ctx.strokeStyle = A(P.accent, 0.4); ctx.lineWidth = 3 * s; ctx.beginPath();
      for (let x = 0; x <= W; x += 10 * s) ctx.lineTo(x, H * 0.06 + Math.sin(x / (W / 4) + TAU * p) * 30 * s);
      ctx.stroke();
    },
    calm(ctx, W, H, s, r, P, p) {
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = A(P.accent, 0.08);
      ctx.beginPath(); ctx.arc(W * 0.9 + Math.sin(TAU * p) * 20 * s, H * 0.12, Math.max(W, H) * 0.32, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(W * 0.05, H + Math.cos(TAU * p) * 20 * s, Math.max(W, H) * 0.25, 0, TAU); ctx.fill();
    },
  };
  function candles(ctx, W, H, s, r, col, p, base, alpha) {
    const cw = 26 * s, step = cw * 1.6, n = Math.ceil(W / step) + 2, v = walk(r, n, 70 * s), off = p * n * step;
    for (let k = 0; k < n * 2; k++) {
      const x = k * step - off; if (x < -step || x > W) continue;
      const i = k % n, o = base + v[i], c = base + v[(i + 1) % n], hi = Math.min(o, c) - 20 * s, lo = Math.max(o, c) + 20 * s, up = c < o;
      ctx.strokeStyle = ctx.fillStyle = A(col, up ? alpha : alpha * 0.45); ctx.lineWidth = 1.5 * s;
      ctx.beginPath(); ctx.moveTo(x + cw / 2, hi); ctx.lineTo(x + cw / 2, lo); ctx.stroke();
      ctx.fillRect(x, Math.min(o, c), cw, Math.max(3 * s, Math.abs(c - o)));
    }
  }

  /* ---------- templates ---------- */
  const T = [];
  const sp = (name, role) => ({ name, role });
  function add(t) { T.push(t); }
  add({ id: "hunt", fav: true, name: "The Hunt", blurb: "Crypto watchlist session", art: "hunt",
    pal: { bg: "#0b0b0c", bg2: "#1d1e21", ink: "#ffffff", sub: "#cfd0d4", accent: "#e9e9ea" }, block: { bg: "#232427", ink: "#ffffff", accent: "#e8e8e8" },
    font: { fam: ARCHIVO, w: 400, ls: 0.02 },
    fields: { kicker: "Crypto watchlist session", title: "The Hunt", topic: "Learn how to build your own watchlist and turn it into trading ideas", speakers: [sp("Coach Sean", "Coach")], date: "2026-11-10", time: "17:00", where: "FB Live · YouTube", channel: "#upcoming-events", live: true, cta: "Free for everyone" } });
  add({ id: "council", fav: true, name: "The Council", blurb: "PSE + crypto deep-dive", art: "council",
    pal: { bg: "#08090c", bg2: "#2a2e35", ink: "#ffffff", sub: "#d6d2c8", accent: "#e9d3a6" }, block: { bg: "#1B2A4A", ink: "#ffffff", accent: "#9fc2ff" },
    font: { fam: DISPLAY, w: 800, ls: -0.01 },
    fields: { kicker: "Crypto and PSE", title: "The Council", topic: "Weekly market deep-dive: technical analysis, risk management and trading psychology with the ZFT system", speakers: [sp("Iluso", "Coach"), sp("Sicilian Trader", "Coach")], date: "2026-11-12", time: "20:00", where: "Zoom", channel: "#upcoming-events", live: false, cta: "Free for a limited time" } });
  add({ id: "meetup", fav: true, name: "Monthly Meetup", blurb: "In-person community meetup", art: "meetup",
    pal: { bg: "#0b0703", bg2: "#24170a", ink: "#ffffff", sub: "#efe3cf", accent: GOLD }, block: { bg: GOLD, ink: "#111111", accent: "#111111" },
    font: { fam: ANTON, w: 400, ls: 0, script: true },
    fields: { kicker: "New generation of wealth builders", title: "Monthly Meet-up", topic: "Talk markets, share what this year taught you, and meet the people behind the usernames", speakers: [], date: "2026-11-21", time: "11:00", endTime: "15:00", where: "Ortigas Center, Pasig City", channel: "#create-a-ticket", live: false, cta: "30 seats · Eternals free" } });
  add({ id: "charts", fav: true, name: "Charts Decoded", blurb: "Trading webinar series", art: "charts",
    pal: { bg: "#021209", bg2: "#08331c", ink: "#eafff2", sub: "#bfe9cf", accent: "#5dff9e" }, block: { bg: "#0E7A4F", ink: "#ffffff", accent: "#b6ffd6" },
    font: { fam: DISPLAY, w: 700, ls: 0.04 },
    fields: { kicker: "Trading webinar series", title: "Charts Decoded", topic: "Top-down analysis, market structure, tools, psychology and risk management", speakers: [sp("Glacier", "Coach")], date: "2026-11-11", time: "20:00", where: "FB Live · YouTube", channel: "#upcoming-events", live: true, cta: "Free webinar" } });
  add({ id: "mmu", fav: true, name: "Monday Market Updates", blurb: "MMU: Monday night check-in", art: "mmu",
    pal: { bg: "#070505", bg2: "#1d0e05", ink: "#ffffff", sub: "#f3dcc8", accent: "#ff9a2e" }, block: { bg: "#FF6A13", ink: "#ffffff", accent: "#fff2c2" },
    font: { fam: ANTON, w: 400, ls: 0.01 },
    fields: { kicker: "MMU", title: "Monday Market Updates", topic: "What has held up, what has weakened, and what would need to change before a setup is worth it?", speakers: [], date: "2026-11-09", time: "21:00", where: "Discord Stage", channel: "#all-chat", live: true, cta: "Bring a chart you're unsure about" } });
  const base = [
    ["announcement", "Announcement", "General news", "grid", { bg: "#0b1020", bg2: "#18244a", accent: "#7db2ff" }, "#25407A", { kicker: "Announcement", title: "Something new is coming", topic: "Tell members what changed, why it matters and what to do next.", channel: "#announcement-board" }],
    ["guest", "Guest Speaker", "Spotlight an expert", "spot", { bg: "#0f0c08", bg2: "#2a1f10", accent: "#ffd68a" }, "#5B2A86", { kicker: "Guest speaker", title: "Live with a special guest", topic: "Topic of the session goes here", speakers: [sp("Guest Name", "Founder, Company")], date: "2026-11-18", time: "20:00", where: "Zoom", channel: "#upcoming-events", live: true }],
    ["workshop", "Workshop", "Hands-on class", "blueprint", { bg: "#0b2340", bg2: "#123562", accent: "#9fd0ff" }, "#0B5CAD", { kicker: "Hands-on workshop", title: "Build your trading plan", topic: "Bring your laptop. We'll set up entries, stops and a journal together.", speakers: [sp("Coach Name", "Coach")], date: "2026-11-15", time: "14:00", endTime: "17:00", where: "Zoom", channel: "#upcoming-events", cta: "Citizens free" }],
    ["giveaway", "Giveaway", "Prizes and raffles", "confetti", { bg: "#1a0f2e", bg2: "#2e1a50", accent: GOLD }, "#7B2CBF", { kicker: "Giveaway", title: "Win 100 USDT", topic: "Join the giveaway in Discord. Winners picked live.", date: "2026-11-20", time: "20:00", where: "Discord", channel: "#giveaways", cta: "React in Discord to join" }],
    ["partner", "Partner Collab", "Co-branded post", "grid", { bg: "#0a0a0a", bg2: "#1a1a1a", accent: "#ffffff" }, "#111111", { kicker: "In partnership", title: "Trading Republic × Partner", topic: "What the collaboration gives members.", channel: "#announcement-board", partner: "okx" }],
    ["milestone", "Milestone", "Celebrate a number", "rays", { bg: "#120d02", bg2: "#2a1e04", accent: GOLD }, "#C98A00", { kicker: "Milestone", title: "8,300 members strong", topic: "Thank you for building the Republic with us." }],
    ["holiday", "Holiday Greeting", "Seasonal greetings", "festive", { bg: "#12060a", bg2: "#3a0b12", accent: "#ffd27a" }, "#A4161A", { kicker: "Season's greetings", title: "Merry Christmas, Republic", topic: "Rest well. Markets will still be here after the holidays." }],
    ["urgent", "Urgent Notice", "Security alerts", "stripes", { bg: "#120708", bg2: "#2a0c0e", accent: "#E5383B" }, "#C1121F", { kicker: "Important", title: "Beware of scam DMs", topic: "Our team will never DM you first or ask for your seed phrase. Report it in #create-a-ticket.", channel: "#create-a-ticket" }],
    ["campaign", "Trading Campaign", "Exchange competition", "rays", { bg: "#06080d", bg2: "#121826", accent: "#ffffff" }, "#0F0F0F", { kicker: "Trading campaign", title: "4,500 USDT prize pool", topic: "Rank on PNL or volume. Join manually: it's not automatic.", date: "2026-11-08", channel: "#announcement-board", partner: "okx", cta: "Join via the link in Discord" }],
    ["winners", "Winners", "Congratulate winners", "confetti", { bg: "#0b0b0f", bg2: "#1c1a10", accent: GOLD }, "#1F7A4D", { kicker: "Congratulations", title: "Top volume traders", topic: "Name 1 · Name 2 · Name 3", channel: "#announcement-board" }],
    ["schedule", "Schedule Change", "Moved or cancelled", "calm", { bg: "#0e1d1d", bg2: "#173232", accent: "#5ad1c4" }, "#127475", { kicker: "Schedule update", title: "No MMU tonight", topic: "We're taking a break for the holiday. See you next Monday.", date: "2026-11-02", channel: "#upcoming-events" }],
    ["teaser", "Coming Soon", "Tease a launch", "spot", { bg: "#05060a", bg2: "#141826", accent: GOLD }, "#0B0B0F", { kicker: "Coming soon", title: "A new world awaits", topic: "Something we've been building for a long time.", channel: "#announcement-board" }],
  ];
  for (const [id, name, blurb, art, pal, block, f] of base) {
    add({ id, name, blurb, art, pal: Object.assign({ ink: "#ffffff", sub: "#d8d8e0" }, pal), block: { bg: block, ink: "#ffffff", accent: GOLD }, font: { fam: DISPLAY, w: 800, ls: -0.01 },
      fields: Object.assign({ kicker: "", topic: "", speakers: [], date: "", time: "", endTime: "", where: "", channel: "", live: false, cta: "", partner: "" }, f) });
  }

  /* ---------- palette resolution ---------- */
  function palette(tpl, cfg) {
    const th = THEMES[cfg.theme] && cfg.theme !== "show" ? THEMES[cfg.theme] : null;
    const P = Object.assign({}, tpl.pal);
    const B = Object.assign({}, tpl.block);
    if (th) { Object.assign(P, { bg: th.bg, bg2: th.bg2, ink: th.ink, sub: th.sub, accent: th.accent }); Object.assign(B, { bg: th.block, ink: th.blockInk, accent: th.blockInk === "#111111" || th.blockInk === "#121212" ? th.blockInk : th.accent }); if (cfg.theme === "gold") B.accent = "#111111"; }
    if (cfg.style === "bold") {
      const light = hexLum(B.bg) > 0.55;
      return guard({ bg: B.bg, bg2: B.bg, ink: B.ink, sub: B.ink, accent: B.accent, chipBg: light ? "rgba(0,0,0,0.10)" : "rgba(0,0,0,0.22)", chipInk: B.ink, chipLine: "rgba(0,0,0,0)", ring: B.ink });
    }
    const light = hexLum(P.bg) > 0.55;
    guard(P);
    return Object.assign(P, { chipBg: A(P.accent, light ? 0.14 : 0.12), chipInk: P.ink, chipLine: A(P.accent, 0.45), ring: P.accent });
  }

  function guard(P) { if (Math.abs(hexLum(P.accent) - hexLum(P.bg)) < 0.28) P.accent = P.ink; return P; }
  /* ---------- pieces ---------- */
  function drawLogos(ctx, xRight, y, h, tone) {
    const z = tone === "black" ? IMG.zftBlack : IMG.zftWhite, t = tone === "black" ? IMG.trBlack : IMG.trWhite;
    if (!z || !t) return 0;
    const zw = h * 0.82 * z.width / z.height, tw = h * t.width / t.height, gap = h * 0.45, x0 = xRight - (zw + gap + tw);
    ctx.drawImage(z, x0, y + h * 0.09, zw, h * 0.82); ctx.drawImage(t, x0 + zw + gap, y, tw, h); return zw + gap + tw;
  }
  function chipSize(ctx, text, px, fam, w, ls) { setFont(ctx, w, px, fam, ls); const pad = Math.max(BOX_PAD, px * 0.75); return { w: ctx.measureText(text).width + pad * 2, h: px + pad * 1.2, pad }; }
  function chip(ctx, x, y, text, px, o) {
    const fam = o.fam || BODY, w = o.weight || 700, ls = o.ls ?? 0.04;
    const m = chipSize(ctx, text, px, fam, w, ls); let cw = m.w + (o.dot ? px * 1.1 : 0);
    rr(ctx, x, y, cw, m.h, o.square ? 6 : m.h / 2); ctx.fillStyle = o.bg; ctx.fill();
    if (o.line && o.line !== "rgba(0,0,0,0)") { ctx.strokeStyle = o.line; ctx.lineWidth = 2; ctx.stroke(); }
    let tx = x + m.pad;
    if (o.dot) { ctx.fillStyle = o.dot; ctx.beginPath(); ctx.arc(tx + px * 0.35, y + m.h / 2, px * 0.3, 0, TAU); ctx.fill(); tx += px * 1.1; }
    setFont(ctx, w, px, fam, ls); ctx.fillStyle = o.ink; ctx.textBaseline = "middle"; ctx.fillText(text, tx, y + m.h / 2 + px * 0.04); ctx.textBaseline = "alphabetic";
    return { w: cw, h: m.h };
  }
  function avatar(ctx, cx, cy, R, spk, P, s) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.closePath();
    if (spk.photo) { ctx.fillStyle = P.bg2 || "#222"; ctx.fill(); ctx.clip(); coverImg(ctx, spk.photo, cx - R, cy - R, R * 2, R * 2, 0.5, 0.3, spk.zoom || 1); }
    else {
      ctx.fillStyle = A(P.ink, 0.14); ctx.fill(); ctx.clip();
      const ini = (spk.name || "?").replace(/^coach\s+/i, "").split(/[\s&]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
      setFont(ctx, 800, R * 0.75, DISPLAY, 0); ctx.fillStyle = P.ink; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(ini, cx, cy + R * 0.05); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    }
    ctx.restore();
    ctx.strokeStyle = P.ring; ctx.lineWidth = Math.max(3, R * 0.06); ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU); ctx.stroke();
  }
  function footerPill(ctx, canvas, x, y, text, px, align) {
    setFont(ctx, 700, px, BODY, 0.06);
    const pad = Math.max(BOX_PAD, px * 0.9), w = ctx.measureText(text).width + pad * 2 + px * 1.6, h = px + pad * 1.2;
    const x0 = align === "left" ? x : x - w / 2;
    const [r, g, b] = avgColor(ctx, x0, y, w, h), L = lum(r, g, b);
    ctx.save(); rr(ctx, x0, y, w, h, h / 2); ctx.clip();
    ctx.filter = `blur(${Math.round(px * 0.8)}px)`; ctx.drawImage(canvas, x0 - 30, y - 30, w + 60, h + 60, x0 - 30, y - 30, w + 60, h + 60); ctx.filter = "none";
    const k = L > 0.55 ? -0.25 : 0.35, mix = (c) => Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k));
    ctx.fillStyle = `rgba(${mix(r)},${mix(g)},${mix(b)},0.42)`; ctx.fillRect(x0, y, w, h); ctx.restore();
    rr(ctx, x0, y, w, h, h / 2); ctx.strokeStyle = L > 0.55 ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.28)"; ctx.lineWidth = 1.5; ctx.stroke();
    const ink = L > 0.55 ? "#111" : "#fff", t = L > 0.55 ? IMG.trBlack : IMG.trWhite; let tx = x0 + pad;
    if (t) { const th = px * 0.95, tw = th * t.width / t.height; ctx.drawImage(t, tx, y + (h - th) / 2, tw, th); tx += tw + px * 0.6; }
    setFont(ctx, 700, px, BODY, 0.06); ctx.fillStyle = ink; ctx.textBaseline = "middle"; ctx.fillText(text, tx, y + h / 2 + px * 0.04); ctx.textBaseline = "alphabetic";
    return { w, h };
  }
  function footerHeight(px) { return px + Math.max(BOX_PAD, px * 0.9) * 1.2; }

  /* draw several speakers big inside a rect (side mode) */
  function speakerGallery(ctx, rect, spk, P, s, alpha, dy) {
    const n = spk.length; if (!n) return;
    const nameH = 64 * s, row = rect.w >= rect.h * 0.9;
    let R = row ? Math.min(rect.w / (n * 2.3), (rect.h - nameH) / 2.1) : Math.min(rect.w / 2.3, (rect.h - n * nameH) / (n * 2.1));
    R = Math.min(R, (n === 1 ? 230 : 150) * s);
    ctx.save(); ctx.globalAlpha *= alpha;
    spk.forEach((p, i) => {
      let cx, cy;
      if (row) { const cw = rect.w / n; cx = rect.x + cw * (i + 0.5); cy = rect.y + (rect.h - nameH) / 2 + (n === 3 && i === 1 ? -R * 0.25 : 0); }
      else { const ch = rect.h / n; cx = rect.x + rect.w / 2; cy = rect.y + ch * i + (ch - nameH) / 2; }
      cy += dy;
      avatar(ctx, cx, cy, R, p, P, s);
      const maxW = row ? rect.w / n - 8 * s : rect.w;
      ctx.textAlign = "center";
      const nm = fit(ctx, p.name || "", DISPLAY, 800, maxW, 30 * s, 16 * s, 1, 0); ctx.fillStyle = P.ink; setFont(ctx, 800, nm.px, DISPLAY, 0); ctx.fillText(nm.lines[0] || "", cx, cy + R + nm.px * 1.25);
      if (p.role) { const rl = fit(ctx, p.role.toUpperCase(), BODY, 700, maxW, 18 * s, 12 * s, 1, 0.1); ctx.fillStyle = P.accent; setFont(ctx, 700, rl.px, BODY, 0.1); ctx.fillText(rl.lines[0], cx, cy + R + nm.px * 1.25 + rl.px * 1.5); }
      ctx.textAlign = "left";
    });
    ctx.restore();
  }

  /* ---------- per-style backgrounds and layout ---------- */
  function styleFonts(tpl, style) {
    if (style === "signature") return Object.assign({ upper: true }, tpl.font);
    if (style === "spotlight") return { fam: ANTON, w: 400, ls: 0.01, upper: true };
    if (style === "split") return { fam: DISPLAY, w: 800, ls: -0.02, upper: true };
    if (style === "terminal") return { fam: ARCHIVO, w: 400, ls: 0, upper: true, mono: true };
    if (style === "editorial") return { fam: DISPLAY, w: 800, ls: -0.02, upper: true, outline: true };
    return { fam: ARCHIVO, w: 400, ls: -0.01, upper: true };
  }

  function drawStyle(ctx, canvas, W, H, s, r, P, tpl, f, cfg, p, L) {
    const style = cfg.style, spk = f.speakers || [], artFn = ART[tpl.art] || ART.grid;
    const photo = f.bgPhoto;
    const M = L.M, top = L.top, bottom = L.bottom;
    const out = { rect: { x: M, y: top, w: W - 2 * M, h: bottom - top }, align: "left", v: "bottom", side: null };
    if (L.wide && spk.length) { out.rect.w = W * 0.62 - M; out.side = { x: W * 0.64, y: top, w: W * 0.36 - M, h: bottom - top }; }

    if (style === "signature") {
      artFn(ctx, W, H, s, r, P, p);
      if (photo) { coverImg(ctx, photo, 0, 0, W, H, 0.5, 0.5, 1 + 0.03 * Math.sin(TAU * p)); fadeDown(ctx, W, H, P.bg, 0.35, 0.9, 0); }
      return out;
    }
    if (style === "spotlight") {
      const hero = photo || (spk.length === 1 && spk[0].photo) || null;
      if (hero) { ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H); coverImg(ctx, hero, 0, 0, W, H, 0.5, 0.25, 1.04 + 0.04 * Math.sin(TAU * p)); }
      else { artFn(ctx, W, H, s, r, P, p); ctx.fillStyle = A(P.bg, 0.45); ctx.fillRect(0, 0, W, H); }
      // light beam
      const bx = W * (0.75 + 0.06 * Math.sin(TAU * p));
      const g = ctx.createRadialGradient(bx, -H * 0.05, 0, bx, H * 0.3, Math.max(W, H) * 0.7); g.addColorStop(0, A(P.accent, 0.35)); g.addColorStop(1, A(P.accent, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const lg = ctx.createLinearGradient(0, 0, L.wide ? W : 0, L.wide ? 0 : H);
      if (L.wide) { lg.addColorStop(0, A(P.bg, 0.92)); lg.addColorStop(0.6, A(P.bg, 0.5)); lg.addColorStop(1, A(P.bg, 0.1)); }
      else { lg.addColorStop(0, A(P.bg, 0.1)); lg.addColorStop(0.45, A(P.bg, 0.35)); lg.addColorStop(1, A(P.bg, 0.95)); }
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
      if (!hero && spk.length) {
        if (L.wide) out.side = { x: W * 0.62, y: top, w: W * 0.38 - M, h: bottom - top };
        else { const gh = (L.tall ? 0.34 : 0.4) * (bottom - top); out.side = { x: M, y: top + (L.tall ? 60 * s : 0), w: W - 2 * M, h: gh }; out.rect = { x: M, y: top + gh + (L.tall ? 60 * s : 10 * s), w: W - 2 * M, h: bottom - top - gh - (L.tall ? 60 * s : 10 * s) }; out.stack = true; }
        out.noInlineSpeakers = true;
      } else if (hero && spk.length === 1 && !photo) { out.noInlineSpeakers = false; out.nameOnly = true; out.side = null; }
      if (L.wide) { out.rect.w = W * 0.58 - M; }
      return out;
    }
    if (style === "split") {
      artFn(ctx, W, H, s, r, P, p);
      if (photo) coverImg(ctx, photo, 0, 0, W, H, 0.5, 0.5);
      const vertical = !(L.wide || H / W < 1.1);
      ctx.fillStyle = P.bg2;
      const slant = 60 * s;
      ctx.beginPath();
      let panel;
      if (vertical) { const py = H * (L.tall ? 0.42 : 0.4); ctx.moveTo(0, py + slant); ctx.lineTo(W, py - slant * 0.2); ctx.lineTo(W, H); ctx.lineTo(0, H); panel = { x: M, y: py + slant + 30 * s, w: W - 2 * M, h: bottom - (py + slant + 30 * s) }; out.side = spk.length ? { x: M, y: top, w: W - 2 * M, h: py - top - 10 * s } : null; }
      else { const px = W * (L.wide ? 0.58 : 0.6); ctx.moveTo(0, 0); ctx.lineTo(px, 0); ctx.lineTo(px - slant * 1.5, H); ctx.lineTo(0, H); panel = { x: M, y: top, w: px - slant * 1.5 - M - 24 * s, h: bottom - top }; out.side = spk.length ? { x: px + 10 * s, y: top + 30 * s, w: W - px - M - 10 * s, h: bottom - top - 30 * s } : null; }
      ctx.closePath(); ctx.fill();
      // accent edge
      ctx.strokeStyle = P.accent; ctx.lineWidth = 6 * s; ctx.stroke();
      out.rect = panel; out.v = "center"; out.noInlineSpeakers = !!spk.length;
      if (!vertical) out.footerLeft = true;
      return out;
    }
    if (style === "terminal") {
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      const gs = 40 * s; ctx.strokeStyle = A(P.accent, 0.06); ctx.lineWidth = 1;
      for (let x = 0; x < W; x += gs) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += gs) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      candles(ctx, W, H, s, r, P.accent, p, H * 0.38, 0.22);
      if (photo) { ctx.globalAlpha = 0.35; coverImg(ctx, photo, 0, 0, W, H); ctx.globalAlpha = 1; }
      // scanlines
      ctx.fillStyle = A(P.bg, 0.25); for (let y = 0; y < H; y += 4 * s) ctx.fillRect(0, y, W, 1.5 * s);
      vignette(ctx, W, H, P.bg, 0.7);
      // ticker tape under the top bar
      const tapeH = 44 * s, ty = top - 10 * s;
      ctx.fillStyle = A(P.accent, 0.12); ctx.fillRect(0, ty, W, tapeH);
      ctx.fillStyle = P.accent; ctx.fillRect(0, ty, W, 2 * s); ctx.fillRect(0, ty + tapeH - 2 * s, W, 2 * s);
      const items = ["BTC ▲", "ETH ▲", "PSEi ▼", "SOL ▲", "XRP ▼", "BNB ▲", "USD/PHP ▼", "OKB ▲", "GOLD ▲", "SPX ▲"];
      setFont(ctx, 700, 20 * s, MONO, 0.06); const unit = items.join("    ") + "    "; const uw = ctx.measureText(unit).width;
      ctx.save(); ctx.beginPath(); ctx.rect(0, ty, W, tapeH); ctx.clip(); ctx.fillStyle = P.ink; ctx.textBaseline = "middle";
      for (let x = -p * uw; x < W; x += uw) ctx.fillText(unit, x, ty + tapeH / 2 + 1); ctx.restore(); ctx.textBaseline = "alphabetic";
      out.rect.y = ty + tapeH + 30 * s; out.rect.h = bottom - out.rect.y;
      if (out.side) { out.side.y = out.rect.y; out.side.h = out.rect.h; }
      return out;
    }
    if (style === "editorial") {
      ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.7); g.addColorStop(0, A(P.accent, 0.10)); g.addColorStop(1, A(P.accent, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // giant outlined word drifting behind
      const word = (tpl.name.split(" ").slice(-1)[0] || "").toUpperCase();
      setFont(ctx, 800, H * (L.wide ? 0.9 : 0.42), DISPLAY, -0.02); ctx.strokeStyle = A(P.accent, 0.1); ctx.lineWidth = 2 * s;
      const ww = ctx.measureText(word).width; ctx.strokeText(word, W / 2 - ww / 2 + Math.sin(TAU * p) * 30 * s, H * (L.wide ? 0.85 : 0.62));
      if (photo) { ctx.globalAlpha = 0.25; coverImg(ctx, photo, 0, 0, W, H); ctx.globalAlpha = 1; }
      ctx.strokeStyle = A(P.ink, 0.25); ctx.lineWidth = 1.5 * s;
      ctx.beginPath(); ctx.moveTo(M, top - 6 * s); ctx.lineTo(W - M, top - 6 * s); ctx.stroke();
      out.align = L.wide ? "left" : "center"; out.v = "center";
      return out;
    }
    // bold
    ctx.fillStyle = P.bg; ctx.fillRect(0, 0, W, H);
    const light = hexLum(P.bg) > 0.55;
    ctx.fillStyle = light ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.08)";
    ctx.beginPath(); ctx.arc(W * 0.92 + Math.sin(TAU * p) * 18 * s, H * 0.14, Math.max(W, H) * 0.34, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(W * 0.04, H * 1.02 + Math.cos(TAU * p) * 18 * s, Math.max(W, H) * 0.26, 0, TAU); ctx.fill();
    ctx.fillStyle = light ? "rgba(0,0,0,0.06)" : "rgba(0,0,0,0.12)";
    ctx.save(); ctx.translate(W * 0.5, H * 0.5); ctx.rotate(-0.2); ctx.fillRect(-W, H * 0.1 + Math.sin(TAU * p) * 10 * s, W * 2, 90 * s); ctx.restore();
    if (photo) { ctx.globalAlpha = 0.18; coverImg(ctx, photo, 0, 0, W, H); ctx.globalAlpha = 1; }
    out.big = true;
    return out;
  }

  /* ---------- main render ---------- */
  function normCfg(cfg) {
    if (typeof cfg === "string") return cfg === "C" ? { style: "bold", theme: "show" } : cfg === "B" ? { style: "signature", theme: "gold" } : { style: "signature", theme: "show" };
    return Object.assign({ style: "signature", theme: "show" }, cfg);
  }
  function render(canvas, tpl, f, cfgIn, sizeKey, opts) {
    opts = opts || {};
    const cfg = normCfg(cfgIn);
    const S = SIZES[sizeKey] || SIZES.square, W = S.w, H = S.h;
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = "none"; ctx.shadowBlur = 0;
    const wide = sizeKey === "discord", tall = sizeKey === "story";
    const s = wide ? H / 560 : Math.min(W, H) / 1080;
    const P = palette(tpl, cfg);
    const r = rng(tpl.id + cfg.style);
    const dur = opts.dur || 8, t = opts.t ?? null, animated = t !== null;
    const p = animated ? (t / dur) % 1 : 0.15;
    // intro/outro timing (seconds)
    const outA = animated ? 1 - ease((t - (dur - 0.6)) / 0.5) : 1;
    const inA = (i) => (animated ? ease((t - 0.15 - i * 0.14) / 0.55) : 1) * outA;
    const spk = (f.speakers || []).filter((x) => x && (x.name || x.photo)).slice(0, 3);
    const F = Object.assign({}, f, { speakers: spk });

    const M = Math.round(64 * s);
    const logoH = Math.round((wide ? 40 : 46) * s);
    const fpx = Math.round((wide ? 20 : 24) * s), fh = footerHeight(fpx), fy = H - M - fh;
    const L = { M, wide, tall, top: M + logoH + Math.round((tall ? 110 : 34) * s), bottom: fy - Math.round(28 * s) };

    ctx.save();
    const lay = drawStyle(ctx, canvas, W, H, s, r, P, tpl, F, cfg, p, L);
    ctx.restore();
    const fonts = styleFonts(tpl, cfg.style);
    const mono = !!fonts.mono;

    // top bar
    const [lr, lg, lb] = avgColor(ctx, W - M - 260 * s, M, 260 * s, logoH);
    const tone = lum(lr, lg, lb) > 0.6 ? "black" : "white";
    ctx.save(); ctx.globalAlpha = inA(0);
    drawLogos(ctx, W - M, M, logoH, tone);
    let lx = M; const cpx = Math.round(22 * s);
    if (F.live) {
      const blink = animated ? 0.55 + 0.45 * Math.abs(Math.cos(TAU * p * 4)) : 1;
      const ch = cpx + Math.max(BOX_PAD, cpx * 0.75) * 1.2;
      const c = chip(ctx, lx, M + (logoH - ch) / 2, "LIVE", cpx, { bg: "#E5383B", ink: "#fff", dot: `rgba(255,255,255,${blink})`, weight: 800, fam: mono ? MONO : BODY });
      lx += c.w + 14 * s;
    }
    const [ar, ag, ab] = avgColor(ctx, M, M, 300 * s, logoH);
    if (F.where && /fb|youtube|zoom|discord|live/i.test(F.where) && !wide) {
      setFont(ctx, 700, cpx * 0.9, mono ? MONO : BODY, 0.06); ctx.fillStyle = lum(ar, ag, ab) > 0.6 ? "#222" : "rgba(255,255,255,0.85)"; ctx.textBaseline = "middle";
      ctx.fillText(F.where.toUpperCase(), lx, M + logoH / 2); ctx.textBaseline = "alphabetic";
    }
    ctx.restore();

    // content stack
    const R = lay.rect, center = lay.align === "center";
    const colW = R.w;
    const blocks = [];
    const textFam = mono ? MONO : BODY;
    const gap = 22 * s;
    // chips
    const det = [];
    if (F.date) det.push(fmtDate(F.date));
    if (F.time) det.push(timeLine(F));
    if (F.where && (!/fb|youtube|zoom|discord|live/i.test(F.where) || wide)) det.push(F.where.toUpperCase());
    if (det.length) {
      const dpx = Math.round((wide ? 22 : 28) * s), cg = 12 * s;
      const rows = []; let row = [], rw = 0;
      for (const d of det) { const m = chipSize(ctx, d, dpx, mono ? MONO : BODY, 700, 0.04); if (row.length && rw + m.w > colW) { rows.push({ items: row, w: rw - cg }); row = []; rw = 0; } row.push({ d, w: m.w, h: m.h }); rw += m.w + cg; }
      if (row.length) rows.push({ items: row, w: rw - cg });
      const ch = rows[0].items[0].h, h = rows.length * ch + (rows.length - 1) * cg;
      blocks.push({ k: "chips", h, draw(x, y, a, dy) { ctx.save(); ctx.globalAlpha = a; let yy = y + dy; for (const rw2 of rows) { let xx = center ? x + (colW - rw2.w) / 2 : x; for (const it of rw2.items) { chip(ctx, xx, yy, it.d, dpx, { bg: P.chipBg, ink: P.chipInk, line: P.chipLine, fam: mono ? MONO : BODY, square: mono }); xx += it.w + cg; } yy += ch + cg; } ctx.restore(); } });
    }
    // speakers inline
    if (spk.length && !lay.side && !lay.noInlineSpeakers) {
      const big = lay.big ? 1.3 : 1, n = spk.length;
      const Rr = Math.round((n === 1 ? 66 : 56) * s * big), ov = n > 1 ? Rr * 0.55 : 0;
      const avW = Rr * 2 + (n - 1) * (Rr * 2 - ov);
      const h = Rr * 2;
      const roleTxt = n === 1 ? (spk[0].role ? "WITH " + spk[0].role.toUpperCase() : "WITH") : "WITH " + (spk.every((x) => /coach/i.test(x.role || "")) ? "COACHES" : "SPEAKERS");
      const namesTxt = spk.map((x) => x.name).filter(Boolean).join(n === 2 ? " & " : " · ");
      blocks.push({ k: "spk", h, draw(x, y, a, dy) {
        ctx.save(); ctx.globalAlpha = a; y += dy;
        setFont(ctx, 800, 40 * s * big, DISPLAY, 0);
        const textMax = colW - avW - 24 * s;
        const nm = fit(ctx, namesTxt, DISPLAY, 800, textMax, 40 * s * big, 20 * s, n > 1 ? 2 : 1, 0);
        setFont(ctx, 600, 22 * s, textFam, 0.08); const roleW = ctx.measureText(roleTxt).width;
        setFont(ctx, 800, nm.px, DISPLAY, 0); const nmW = Math.max(...nm.lines.map((l) => ctx.measureText(l).width), roleW);
        const total = avW + 24 * s + nmW;
        let x0 = center ? x + (colW - total) / 2 : x;
        for (let i = n - 1; i >= 0; i--) avatar(ctx, x0 + Rr + i * (Rr * 2 - ov), y + Rr, Rr, spk[i], P, s);
        const tx = x0 + avW + 24 * s, lh = nm.px * 1.08, blockH = 22 * s * 1.4 + nm.lines.length * lh, ty = y + Rr - blockH / 2;
        ctx.fillStyle = P.sub; setFont(ctx, 600, 22 * s, textFam, 0.08); ctx.fillText(roleTxt, tx, ty + 22 * s);
        ctx.fillStyle = P.ink; setFont(ctx, 800, nm.px, DISPLAY, 0);
        nm.lines.forEach((l, i) => ctx.fillText(l, tx, ty + 22 * s * 1.4 + lh * (i + 0.85)));
        ctx.restore();
      } });
    } else if (lay.nameOnly && spk.length === 1) {
      const nm = spk[0], px = 36 * s;
      blocks.push({ k: "spk", h: px * 1.9, draw(x, y, a, dy) { ctx.save(); ctx.globalAlpha = a; y += dy; ctx.fillStyle = P.accent; setFont(ctx, 700, 22 * s, textFam, 0.1); ctx.textAlign = center ? "center" : "left"; const xx = center ? x + colW / 2 : x; ctx.fillText(("with " + (nm.role || "")).trim().toUpperCase(), xx, y + 22 * s); ctx.fillStyle = P.ink; setFont(ctx, 800, px, DISPLAY, 0); ctx.fillText(nm.name || "", xx, y + 22 * s + px * 1.25); ctx.textAlign = "left"; ctx.restore(); } });
    }
    // partner
    if (F.partnerImg) {
      const ph = (wide ? 46 : 60) * s, pw = 240 * s, lab = 20 * s;
      blocks.push({ k: "partner", h: ph + lab * 1.6, draw(x, y, a, dy) { ctx.save(); ctx.globalAlpha = a; y += dy; ctx.fillStyle = P.sub; setFont(ctx, 600, lab, textFam, 0.12); ctx.textAlign = center ? "center" : "left"; ctx.fillText("IN PARTNERSHIP WITH", center ? x + colW / 2 : x, y + lab); ctx.textAlign = "left"; containImg(ctx, F.partnerImg, center ? x + (colW - pw) / 2 : x, y + lab * 1.6, pw, ph, center ? "center" : "left"); ctx.restore(); } });
    }
    // CTA
    if (F.cta && !wide) {
      const cp = Math.round((wide ? 22 : 28) * s);
      const c = fit(ctx, F.cta, textFam, 700, colW, cp, 16 * s, 1, 0);
      blocks.push({ k: "cta", h: c.px * 1.2, draw(x, y, a, dy) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = P.accent; setFont(ctx, 700, c.px, textFam, 0); ctx.textAlign = center ? "center" : "left"; ctx.fillText(c.lines[0], center ? x + colW / 2 : x, y + dy + c.px * 0.95); ctx.textAlign = "left"; ctx.restore(); } });
    }
    // topic
    if (F.topic && !wide) {
      const tpx = Math.round((wide ? 26 : tall ? 40 : 32) * s);
      const tp = fit(ctx, F.topic, BODY, 500, colW, tpx, 18 * s, wide ? 2 : 3, 0); const lh = tp.px * 1.3;
      blocks.push({ k: "topic", h: tp.lines.length * lh, draw(x, y, a, dy) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = P.sub; setFont(ctx, 500, tp.px, BODY, 0); ctx.textAlign = center ? "center" : "left"; tp.lines.forEach((l, i) => ctx.fillText(l, center ? x + colW / 2 : x, y + dy + lh * i + tp.px)); ctx.textAlign = "left"; ctx.restore(); } });
    }
    // title gets the remaining space
    const kpx = Math.round((wide ? 22 : 26) * s);
    const otherH = blocks.reduce((a, b) => a + b.h + gap, 0) + (F.kicker ? kpx * 1.9 : 0);
    const avail = Math.max(34 * s, R.h - otherH);
    const ttl = (fonts.upper ? (F.title || "").toUpperCase() : F.title || "");
    let titleBlock;
    if (fonts.script && /\s/.test(F.title || "") && cfg.style === "signature") {
      const words = (F.title || "").split(/\s+/), first = words[0].toUpperCase(), rest = words.slice(1).join(" ");
      const a1 = fit(ctx, first, fonts.fam, fonts.w, colW, Math.min(260 * s, avail * 0.55), 40 * s, 1, fonts.ls);
      const b1 = fit(ctx, rest, MARKER, 400, colW * 0.95, Math.min(170 * s, avail * 0.42), 28 * s, 1, 0);
      titleBlock = { k: "title", h: a1.px * 0.95 + b1.px * 1.1, draw(x, y, a, dy) {
        ctx.save(); ctx.globalAlpha = a; y += dy; ctx.fillStyle = P.ink; setFont(ctx, fonts.w, a1.px, fonts.fam, fonts.ls); ctx.fillText(a1.lines[0] || "", x, y + a1.px * 0.9);
        ctx.translate(x + 10 * s, y + a1.px * 0.95 + b1.px * 0.9); ctx.rotate(-0.06); ctx.fillStyle = P.accent; setFont(ctx, 400, b1.px, MARKER, 0);
        if (animated) { const w = ctx.measureText(b1.lines[0] || "").width; ctx.beginPath(); ctx.rect(-10 * s, -b1.px * 1.2, (w + 20 * s) * ease((t - 0.5) / 0.9), b1.px * 1.6); ctx.clip(); }
        ctx.fillText(b1.lines[0] || "", 0, 0); ctx.restore(); } };
    } else {
      const maxPx = Math.min((wide ? 110 : tall ? 170 : 150) * s * (lay.big ? 1.1 : 1), avail);
      const lhK = fonts.fam === ANTON ? 1.0 : 1.02;
      let tt = fit(ctx, ttl, fonts.fam, fonts.w, colW, maxPx, 30 * s, wide ? 2 : 3, fonts.ls);
      while (tt.px > 30 * s && tt.px * lhK * tt.lines.length > avail) tt = fit(ctx, ttl, fonts.fam, fonts.w, colW, tt.px - 4, 30 * s, wide ? 2 : 3, fonts.ls);
      const lh = tt.px * lhK, capTop = tt.px * (fonts.fam === ANTON ? 0.98 : 0.8);
      titleBlock = { k: "title", h: lh * (tt.lines.length - 1) + capTop + tt.px * 0.05, draw(x, y, a, dy) {
        ctx.save(); ctx.globalAlpha = a; y += dy; setFont(ctx, fonts.w, tt.px, fonts.fam, fonts.ls); ctx.textAlign = center ? "center" : "left";
        const xx = center ? x + colW / 2 : x;
        tt.lines.forEach((l, i) => {
          const yy = y + capTop + lh * i;
          if (fonts.outline && i === tt.lines.length - 1 && tt.lines.length > 1) { ctx.strokeStyle = P.accent; ctx.lineWidth = Math.max(2, tt.px * 0.035); ctx.strokeText(l, xx, yy); }
          else { ctx.fillStyle = (cfg.theme === "gold" && i === tt.lines.length - 1 && cfg.style !== "bold") ? P.accent : P.ink; ctx.fillText(l, xx, yy); }
        });
        ctx.restore(); } };
    }
    blocks.unshift(titleBlock);
    if (F.kicker) {
      const kk = fit(ctx, (mono ? "> " : "") + F.kicker.toUpperCase(), mono ? MONO : BODY, 700, colW, kpx, 14 * s, 1, 0.14);
      blocks.unshift({ k: "kicker", h: kk.px * 1.0, gapAfter: kk.px * 0.75, draw(x, y, a, dy) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = P.accent; setFont(ctx, 700, kk.px, mono ? MONO : BODY, 0.14); ctx.textAlign = center ? "center" : "left"; let txt = kk.lines[0]; if (mono && animated) { const show = Math.floor(txt.length * ease((t - 0.2) / 1.0)); txt = txt.slice(0, show) + (Math.floor(t * 2) % 2 ? "▌" : " "); } ctx.fillText(txt, center ? x + colW / 2 : x, y + dy + kk.px * 0.85); ctx.textAlign = "left"; ctx.restore(); } });
    }
    // order: kicker, title, topic, cta, speakers, chips, partner
    const order = ["kicker", "title", "topic", "cta", "spk", "chips", "partner"];
    blocks.sort((a, b) => order.indexOf(a.k) - order.indexOf(b.k));
    const total = blocks.reduce((a, b, i) => a + b.h + (i < blocks.length - 1 ? (b.gapAfter ?? (b.k === "title" ? 20 * s : gap)) : 0), 0);
    if (total > R.h && lay.stack && lay.side) { const ex = Math.min(total - R.h, lay.side.h * 0.5); lay.side.h -= ex; R.y -= ex; R.h += ex; }
    let y = lay.v === "center" ? R.y + Math.max(0, (R.h - total) / 2) : R.y + R.h - total;
    if (y < R.y) y = R.y;
    blocks.forEach((b, i) => { const a = inA(i + 1); b.draw(R.x, y, a, (1 - a) * 26 * s); y += b.h + (b.gapAfter ?? (b.k === "title" ? 20 * s : gap)); });

    // side speakers
    if (lay.side && spk.length) { const a = inA(3); speakerGallery(ctx, lay.side, spk, P, s, a, (1 - a) * 30 * s); }

    // footer
    const footText = (opts.footer || "Trading Republic by ZFT") + (F.channel ? "  ·  " + F.channel : "");
    ctx.save(); ctx.globalAlpha = inA(blocks.length + 1);
    footerPill(ctx, canvas, wide || lay.footerLeft ? M : W / 2, fy, footText.toUpperCase(), fpx, wide || lay.footerLeft ? "left" : "center");
    ctx.restore();
    ctx.letterSpacing = "0px";
    return canvas;
  }

  function loadImg(key, src) { return new Promise((res) => { const i = new Image(); i.onload = () => { if (key) IMG[key] = i; res(i); }; i.onerror = () => res(null); i.src = src; }); }
  async function loadAssets(map) { await Promise.all(Object.entries(map).map(([k, v]) => loadImg(k, v))); }
  async function loadFonts() {
    const want = ['800 40px "Plus Jakarta Sans"', '700 40px "Plus Jakarta Sans"', '500 40px "DM Sans"', '600 40px "DM Sans"', '700 40px "DM Sans"', '800 40px "DM Sans"', '400 40px Anton', '400 40px "Archivo Black"', '400 40px "Permanent Marker"', '700 40px "JetBrains Mono"'];
    try { await Promise.all(want.map((f) => document.fonts.load(f))); } catch (e) {}
  }
  window.TRPoster = { render, TEMPLATES: T, SIZES, STYLES, THEMES, loadAssets, loadFonts, loadImg, IMG, fmtDate, timeLine };
})();
