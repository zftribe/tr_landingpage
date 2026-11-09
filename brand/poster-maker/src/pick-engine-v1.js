/* Trading Republic poster renderer. One canvas engine for every template, look and size.
   House rules baked in: footer is an adaptive pill only; text keeps >= 16 px inside any box. */
(function () {
  const IMG = {};
  const SIZES = {
    square: { w: 1080, h: 1080, label: "FB/IG square 1:1", file: "square-1080" },
    portrait: { w: 1080, h: 1350, label: "FB/IG feed 4:5", file: "4x5-1080x1350" },
    story: { w: 1080, h: 1920, label: "Story 9:16", file: "story-1080x1920" },
    discord: { w: 1600, h: 640, label: "Discord event cover", file: "discord-1600x640" },
  };
  const GOLD = "#FFB400";
  const BOX_PAD = 16; // minimum inner padding (px at 1080) inside any box

  /* ---------- helpers ---------- */
  function rng(seed) {
    let a = 0;
    for (const c of String(seed)) a = (a * 31 + c.charCodeAt(0)) >>> 0;
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rr(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function font(weight, px, fam) { return `${weight} ${Math.round(px)}px ${fam}`; }
  function wrap(ctx, text, maxW) {
    const out = [];
    for (const para of String(text || "").split("\n")) {
      const words = para.split(/\s+/).filter(Boolean);
      let line = "";
      for (const w of words) {
        const t = line ? line + " " + w : w;
        if (ctx.measureText(t).width <= maxW || !line) line = t;
        else { out.push(line); line = w; }
      }
      if (line) out.push(line);
    }
    return out;
  }
  /* largest size where text fits maxLines and maxW; returns {px, lines} */
  function fit(ctx, text, fam, weight, maxW, maxPx, minPx, maxLines, ls) {
    for (let px = maxPx; px >= minPx; px -= 2) {
      ctx.font = font(weight, px, fam);
      ctx.letterSpacing = (ls || 0) * px + "px";
      const lines = wrap(ctx, text, maxW);
      if (lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxW)) return { px, lines };
    }
    ctx.font = font(weight, minPx, fam);
    let lines = wrap(ctx, text, maxW).slice(0, maxLines);
    return { px: minPx, lines };
  }
  function lum(r, g, b) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255; }
  function avgColor(ctx, x, y, w, h) {
    try {
      const d = ctx.getImageData(Math.max(0, x | 0), Math.max(0, y | 0), Math.max(1, w | 0), Math.max(1, h | 0)).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < d.length; i += 16) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
      return [r / n, g / n, b / n];
    } catch (e) { return [20, 20, 24]; }
  }
  function coverImg(ctx, img, x, y, w, h, fx, fy) {
    const s = Math.max(w / img.width, h / img.height);
    const iw = img.width * s, ih = img.height * s;
    ctx.drawImage(img, x + (w - iw) * (fx ?? 0.5), y + (h - ih) * (fy ?? 0.4), iw, ih);
  }
  function containImg(ctx, img, x, y, w, h, alignX) {
    const s = Math.min(w / img.width, h / img.height);
    const iw = img.width * s, ih = img.height * s;
    const ax = alignX === "left" ? 0 : alignX === "right" ? 1 : 0.5;
    ctx.drawImage(img, x + (w - iw) * ax, y + (h - ih) / 2, iw, ih);
    return iw;
  }
  function fmtDate(d) {
    if (!d) return "";
    const [Y, M, D] = d.split("-").map(Number);
    const dt = new Date(Date.UTC(Y, M - 1, D));
    const wd = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][dt.getUTCDay()];
    const mo = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"][M - 1];
    return `${wd} · ${mo} ${D}`;
  }
  function fmtTime(t) {
    if (!t) return "";
    let [h, m] = t.split(":").map(Number);
    const ap = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}${m ? ":" + String(m).padStart(2, "0") : ""} ${ap}`;
  }
  function timeLine(f) {
    const a = fmtTime(f.time), b = fmtTime(f.endTime);
    if (!a) return "";
    return (b ? `${a} – ${b}` : a) + " PH time";
  }

  /* ---------- backgrounds ---------- */
  const BG = {
    charts(ctx, W, H, s, r) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, "#021209"); g.addColorStop(1, "#06301a");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(90,255,160,0.07)"; ctx.lineWidth = 1.5 * s;
      for (let x = 0; x < W; x += 60 * s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 60 * s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      let p = H * 0.62; const cw = 26 * s;
      for (let x = cw; x < W; x += cw * 1.6) {
        const o = p, c = p + (r() - 0.53) * 70 * s; const hi = Math.min(o, c) - r() * 40 * s, lo = Math.max(o, c) + r() * 40 * s;
        const up = c < o; ctx.strokeStyle = ctx.fillStyle = up ? "rgba(70,240,140,0.32)" : "rgba(70,240,140,0.14)";
        ctx.beginPath(); ctx.moveTo(x + cw / 2, hi); ctx.lineTo(x + cw / 2, lo); ctx.stroke();
        ctx.fillRect(x, Math.min(o, c), cw, Math.max(3 * s, Math.abs(c - o))); p = c;
      }
      const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.1, W / 2, H / 2, Math.max(W, H) * 0.75);
      v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.7)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    },
    council(ctx, W, H, s, r) {
      const g = ctx.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.4, Math.max(W, H));
      g.addColorStop(0, "#2a2e35"); g.addColorStop(0.5, "#121418"); g.addColorStop(1, "#050506");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const n = Math.max(4, Math.round(W / (180 * s)));
      for (let i = 0; i < n; i++) {
        const aw = 110 * s, x = (i + 0.5) * (W / n) - aw / 2, top = H * 0.08, bot = H * 0.62;
        const lg = ctx.createLinearGradient(0, top, 0, bot); lg.addColorStop(0, "rgba(220,200,160,0.10)"); lg.addColorStop(1, "rgba(220,200,160,0)");
        ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(x, bot); ctx.lineTo(x, top + aw / 2); ctx.arc(x + aw / 2, top + aw / 2, aw / 2, Math.PI, 0); ctx.lineTo(x + aw, bot); ctx.fill();
      }
      ctx.fillStyle = "rgba(180,150,100,0.10)"; ctx.beginPath(); ctx.ellipse(W / 2, H * 0.78, W * 0.55, H * 0.12, 0, 0, Math.PI * 2); ctx.fill();
      const v = ctx.createLinearGradient(0, 0, 0, H); v.addColorStop(0, "rgba(0,0,0,0.3)"); v.addColorStop(0.55, "rgba(0,0,0,0.05)"); v.addColorStop(1, "rgba(0,0,0,0.75)");
      ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    },
    hunt(ctx, W, H, s, r) {
      ctx.fillStyle = "#0b0b0c"; ctx.fillRect(0, 0, W, H);
      const R = Math.min(W, H) * 0.24, cy = H * 0.42;
      for (const cx of [W / 2 - R * 1.05, W / 2 + R * 1.05]) {
        const g = ctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
        g.addColorStop(0, "#5a5d62"); g.addColorStop(0.7, "#2b2d30"); g.addColorStop(1, "#141516");
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.18)"; ctx.lineWidth = 10 * s; ctx.stroke();
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.86, 0, Math.PI * 2); ctx.clip();
        ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 3 * s; ctx.beginPath();
        let y = cy + R * 0.3; ctx.moveTo(cx - R, y);
        for (let x = cx - R; x < cx + R; x += 14 * s) { y += (r() - 0.56) * 22 * s; ctx.lineTo(x, y); }
        ctx.stroke(); ctx.restore();
      }
      const v = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.8);
      v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.85)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    },
    meetup(ctx, W, H, s, r) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#22160a"); g.addColorStop(1, "#0b0703");
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 46; i++) {
        const x = r() * W, y = r() * H * 0.7, rad = (10 + r() * 60) * s;
        const bg = ctx.createRadialGradient(x, y, 0, x, y, rad); bg.addColorStop(0, `rgba(255,${170 + r() * 60 | 0},60,${0.12 + r() * 0.22})`); bg.addColorStop(1, "rgba(255,180,60,0)");
        ctx.fillStyle = bg; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      for (let i = 0; i < 14; i++) { const x = r() * W, w = (60 + r() * 90) * s; ctx.beginPath(); ctx.ellipse(x, H * 0.98, w, H * (0.1 + r() * 0.08), 0, 0, Math.PI * 2); ctx.fill(); }
    },
    mmu(ctx, W, H, s, r) {
      ctx.fillStyle = "#070505"; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 3; i++) {
        const x = W * (0.2 + i * 0.3), y = H * (0.18 + r() * 0.15), rad = (70 + r() * 50) * s;
        ctx.strokeStyle = "rgba(255,140,30,0.35)"; ctx.lineWidth = 8 * s; ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = "rgba(255,140,30,0.15)"; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.arc(x, y, rad * 0.72, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.save(); ctx.shadowColor = "rgba(255,120,20,0.9)"; ctx.shadowBlur = 30 * s; ctx.strokeStyle = "#ff8a1f"; ctx.lineWidth = 6 * s; ctx.beginPath();
      let y = H * 0.35; ctx.moveTo(0, y);
      for (let x = 0; x <= W; x += 40 * s) { y = Math.min(H * 0.85, Math.max(H * 0.2, y + (r() - 0.42) * 60 * s)); ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
      const v = ctx.createLinearGradient(0, 0, 0, H); v.addColorStop(0, "rgba(0,0,0,0.1)"); v.addColorStop(1, "rgba(0,0,0,0.8)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    },
    house(ctx, W, H, s, r, pal) {
      ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = pal.line || "rgba(255,180,0,0.06)"; ctx.lineWidth = 1.5 * s;
      for (let x = 0; x < W; x += 72 * s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 72 * s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      if (IMG.trGold) { ctx.globalAlpha = 0.07; const mw = Math.max(W, H) * 0.75; ctx.drawImage(IMG.trGold, W - mw * 0.7, H - mw * 0.55, mw, mw * IMG.trGold.height / IMG.trGold.width); ctx.globalAlpha = 1; }
      const v = ctx.createRadialGradient(W * 0.3, H * 0.3, 0, W * 0.3, H * 0.3, Math.max(W, H));
      v.addColorStop(0, pal.glow || "rgba(255,180,0,0.12)"); v.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    },
    solid(ctx, W, H, s, r, pal) {
      ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = pal.shape || "rgba(0,0,0,0.12)";
      ctx.beginPath(); ctx.arc(W * 0.92, H * 0.12, Math.max(W, H) * 0.32, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W * 0.05, H * 1.0, Math.max(W, H) * 0.25, 0, Math.PI * 2); ctx.fill();
    },
    rays(ctx, W, H, s, r, pal) {
      ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.translate(W / 2, H * 0.42); ctx.fillStyle = pal.ray || "rgba(255,180,0,0.07)";
      for (let i = 0; i < 24; i += 2) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, Math.max(W, H) * 1.2, (i / 24) * Math.PI * 2, ((i + 1) / 24) * Math.PI * 2); ctx.fill(); }
      ctx.restore();
      const v = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, Math.max(W, H) * 0.7);
      v.addColorStop(0, "rgba(0,0,0,0)"); v.addColorStop(1, "rgba(0,0,0,0.65)"); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
    },
    confetti(ctx, W, H, s, r, pal) {
      BG.rays(ctx, W, H, s, r, pal);
      const cols = pal.confetti || [GOLD, "#ffffff", "#ff5d73", "#5ad1ff"];
      for (let i = 0; i < 90; i++) {
        ctx.save(); ctx.translate(r() * W, r() * H); ctx.rotate(r() * Math.PI); ctx.fillStyle = cols[i % cols.length]; ctx.globalAlpha = 0.5 + r() * 0.4;
        ctx.fillRect(-7 * s, -3 * s, 14 * s, 6 * s); ctx.restore();
      }
    },
    stripes(ctx, W, H, s, r, pal) {
      ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.fillStyle = pal.stripe;
      const band = 34 * s;
      for (const yy of [0, H - band * 1.6]) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, yy, W, band * 1.6); ctx.clip();
        for (let x = -H; x < W + H; x += band * 2) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + band, yy); ctx.lineTo(x + band + band * 1.6, yy + band * 1.6); ctx.lineTo(x + band * 1.6, yy + band * 1.6); ctx.fill(); }
        ctx.restore();
      }
      ctx.restore();
    },
    blueprint(ctx, W, H, s, r, pal) {
      ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "rgba(160,210,255,0.10)"; ctx.lineWidth = 1 * s;
      for (let x = 0; x < W; x += 24 * s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 24 * s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
      ctx.strokeStyle = "rgba(160,210,255,0.22)"; ctx.lineWidth = 2 * s;
      for (let x = 0; x < W; x += 120 * s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 120 * s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    },
    spotlight(ctx, W, H, s, r, pal) {
      ctx.fillStyle = pal.bg; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W * 0.7, H * 0.2, 0, W * 0.7, H * 0.4, Math.max(W, H) * 0.8);
      g.addColorStop(0, pal.light || "rgba(255,220,150,0.28)"); g.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
    festive(ctx, W, H, s, r, pal) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, pal.bg); g.addColorStop(1, pal.bg2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 70; i++) {
        const x = r() * W, y = r() * H, rad = (2 + r() * 5) * s; ctx.fillStyle = `rgba(255,230,170,${0.25 + r() * 0.5})`;
        ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = "rgba(255,200,90,0.35)"; ctx.lineWidth = 3 * s; ctx.beginPath();
      for (let x = 0; x <= W; x += 10 * s) ctx.lineTo(x, H * 0.06 + Math.sin(x / (W / 4)) * 30 * s);
      ctx.stroke();
    },
  };

  /* ---------- looks: how each template is dressed ----------
     A = series looks (each show keeps its own identity, tidied)
     B = one house look (black + TR gold on everything)
     C = bold colour blocks (one strong colour per show, host-forward) */
  const LOOKS = {
    A: { name: "Series looks" },
    B: { name: "House gold" },
    C: { name: "Bold blocks" },
  };

  const DISPLAY = '"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';
  const BODY = '"DM Sans", "Segoe UI", Arial, sans-serif';
  const ANTON = 'Anton, Impact, "Arial Narrow", sans-serif';
  const ARCHIVO = '"Archivo Black", "Arial Black", Arial, sans-serif';
  const MARKER = '"Permanent Marker", "Comic Sans MS", cursive';

  /* per-template, per-look theme */
  function theme(tpl, look) {
    const A = tpl.lookA || {};
    if (look === "B") {
      return { bg: "house", pal: { bg: "#0b0b0f" }, ink: "#ffffff", sub: "#cbcbd7", accent: GOLD, title: { fam: DISPLAY, w: 800, ls: -0.02, upper: true }, goldWord: true, chipBg: "rgba(255,180,0,0.12)", chipInk: "#ffe2a0", chipLine: "rgba(255,180,0,0.45)" };
    }
    if (look === "C") {
      const c = tpl.lookC || { bg: "#1B2A4A", ink: "#fff" };
      return { bg: "solid", pal: { bg: c.bg, shape: c.shape || "rgba(255,255,255,0.08)" }, ink: c.ink, sub: c.sub || c.ink, accent: c.accent || GOLD, title: { fam: ARCHIVO, w: 400, ls: -0.01, upper: true }, chipBg: c.chipBg || "rgba(0,0,0,0.22)", chipInk: c.ink, chipLine: "rgba(0,0,0,0)", bigHost: true, logoTone: c.logoTone || "white" };
    }
    return Object.assign({ bg: "house", pal: { bg: "#0b0b0f" }, ink: "#fff", sub: "#d5d5de", accent: GOLD, title: { fam: DISPLAY, w: 800, ls: -0.01, upper: true }, chipBg: "rgba(255,255,255,0.08)", chipInk: "#fff", chipLine: "rgba(255,255,255,0.22)" }, A);
  }

  /* ---------- templates ---------- */
  const T = [];
  function add(t) { T.push(t); }
  // Favourites (recurring sessions)
  add({ id: "hunt", fav: true, name: "The Hunt", blurb: "Weekly crypto watchlist session", seed: "hunt",
    lookA: { bg: "hunt", accent: "#ffffff", title: { fam: ARCHIVO, w: 400, ls: 0.02, upper: true }, chipBg: "rgba(255,255,255,0.10)" },
    lookC: { bg: "#232427", ink: "#fff", accent: "#e8e8e8" },
    fields: { kicker: "Crypto watchlist session", title: "The Hunt", topic: "Learn how to build your own watchlist and turn it into trading ideas", hostName: "Coach Sean", hostRole: "Coach", date: "2026-11-10", time: "17:00", where: "FB Live · YouTube", channel: "#upcoming-events", live: true, cta: "Free for everyone" } });
  add({ id: "council", fav: true, name: "The Council", blurb: "Weekly PSE + crypto deep-dive", seed: "council",
    lookA: { bg: "council", accent: "#e9d3a6", title: { fam: DISPLAY, w: 800, ls: -0.01, upper: true }, chipBg: "rgba(233,211,166,0.10)", chipLine: "rgba(233,211,166,0.35)" },
    lookC: { bg: "#1B2A4A", ink: "#fff", accent: "#9fc2ff" },
    fields: { kicker: "Crypto and PSE", title: "The Council", topic: "Weekly market deep-dive: technical analysis, risk management and trading psychology with the ZFT system", hostName: "Iluso & Sicilian Trader", hostRole: "Coaches", date: "2026-11-12", time: "20:00", where: "Zoom", channel: "#upcoming-events", live: false, cta: "Free for a limited time" } });
  add({ id: "meetup", fav: true, name: "Monthly Meetup", blurb: "In-person community meetup", seed: "meetup",
    lookA: { bg: "meetup", accent: GOLD, title: { fam: ANTON, w: 400, ls: 0, upper: true, script: true }, chipBg: "rgba(255,180,0,0.12)", chipInk: "#fff", chipLine: "rgba(255,180,0,0.5)" },
    lookC: { bg: GOLD, ink: "#111111", sub: "#2a2000", accent: "#111111", chipBg: "rgba(0,0,0,0.12)", logoTone: "black" },
    fields: { kicker: "New generation of wealth builders", title: "Monthly Meet-up", topic: "Talk markets, share what this year taught you, and meet the people behind the usernames", hostName: "", hostRole: "", date: "2026-11-21", time: "11:00", endTime: "15:00", where: "Ortigas Center, Pasig City", channel: "#create-a-ticket", live: false, cta: "30 seats · Eternals free" } });
  add({ id: "charts", fav: true, name: "Charts Decoded", blurb: "Trading webinar series", seed: "charts",
    lookA: { bg: "charts", ink: "#eafff2", sub: "#bfe9cf", accent: "#5dff9e", title: { fam: DISPLAY, w: 700, ls: 0.04, upper: true }, chipBg: "rgba(93,255,158,0.10)", chipInk: "#eafff2", chipLine: "rgba(93,255,158,0.4)" },
    lookC: { bg: "#0E7A4F", ink: "#fff", accent: "#b6ffd6" },
    fields: { kicker: "Trading webinar series", title: "Charts Decoded", topic: "Top-down analysis, market structure, tools, psychology and risk management", hostName: "Glacier", hostRole: "Coach", date: "2026-11-11", time: "20:00", where: "FB Live · YouTube", channel: "#upcoming-events", live: true, cta: "Free webinar" } });
  add({ id: "mmu", fav: true, name: "Monday Market Updates", blurb: "MMU: Monday night market check-in", seed: "mmu",
    lookA: { bg: "mmu", accent: "#ff9a2e", title: { fam: ANTON, w: 400, ls: 0.01, upper: true }, chipBg: "rgba(255,154,46,0.12)", chipLine: "rgba(255,154,46,0.45)" },
    lookC: { bg: "#FF6A13", ink: "#fff", accent: "#fff2c2", chipBg: "rgba(0,0,0,0.18)" },
    fields: { kicker: "MMU", title: "Monday Market Updates", topic: "What has held up, what has weakened, and what would need to change before a setup is worth it?", hostName: "", hostRole: "", date: "2026-11-09", time: "21:00", where: "Discord Stage", channel: "#all-chat", live: true, cta: "Bring a chart you're unsure about" } });
  // Base templates
  const base = [
    ["announcement", "Announcement", "General news for the Republic", "house", { bg: "#0d1220", line: "rgba(120,160,255,0.07)", glow: "rgba(90,140,255,0.18)" }, "#25407A", { kicker: "Announcement", title: "Something new is coming", topic: "Tell members what changed, why it matters and what to do next.", where: "", channel: "#announcement-board" }],
    ["guest", "Guest Speaker", "Spotlight an outside expert", "spotlight", { bg: "#0f0c08" }, "#5B2A86", { kicker: "Guest speaker", title: "Live with a special guest", topic: "Topic of the session goes here", hostName: "Guest Name", hostRole: "Founder, Company", date: "2026-11-18", time: "20:00", where: "Zoom", channel: "#upcoming-events", live: true }],
    ["workshop", "Workshop", "Hands-on class with steps", "blueprint", { bg: "#0b2340" }, "#0B5CAD", { kicker: "Hands-on workshop", title: "Build your trading plan", topic: "Bring your laptop. We'll set up entries, stops and a journal together.", hostName: "Coach Name", hostRole: "Coach", date: "2026-11-15", time: "14:00", endTime: "17:00", where: "Zoom", channel: "#upcoming-events", cta: "Citizens free" }],
    ["giveaway", "Giveaway", "Prizes, raffles, contests", "confetti", { bg: "#1a0f2e", ray: "rgba(255,180,0,0.08)" }, "#7B2CBF", { kicker: "Giveaway", title: "Win 100 USDT", topic: "Join the giveaway in Discord. Winners picked live.", date: "2026-11-20", time: "20:00", where: "Discord", channel: "#giveaways", cta: "How to join: react in Discord" }],
    ["partner", "Partner Collab", "Co-branded with a partner", "house", { bg: "#0a0a0a", line: "rgba(255,255,255,0.05)", glow: "rgba(255,255,255,0.10)" }, "#111111", { kicker: "In partnership", title: "Trading Republic × Partner", topic: "What the collaboration gives members.", date: "", time: "", where: "", channel: "#announcement-board", partner: "okx" }],
    ["milestone", "Milestone", "Celebrate a community number", "rays", { bg: "#120d02", ray: "rgba(255,180,0,0.09)" }, "#C98A00", { kicker: "Milestone", title: "8,300 members strong", topic: "Thank you for building the Republic with us.", where: "", channel: "" }],
    ["holiday", "Holiday Greeting", "Seasonal greetings", "festive", { bg: "#3a0b12", bg2: "#12060a" }, "#A4161A", { kicker: "Season's greetings", title: "Merry Christmas, Republic", topic: "Rest well. Markets will still be here after the holidays.", where: "", channel: "" }],
    ["urgent", "Urgent Notice", "Security or important alerts", "stripes", { bg: "#120708", stripe: "#E5383B" }, "#C1121F", { kicker: "Important", title: "Beware of scam DMs", topic: "Our team will never DM you first or ask for your seed phrase. Report it in #create-a-ticket.", where: "", channel: "#create-a-ticket" }],
    ["campaign", "Trading Campaign", "Exchange competition or campaign", "rays", { bg: "#06080d", ray: "rgba(255,255,255,0.05)" }, "#0F0F0F", { kicker: "Trading campaign", title: "4,500 USDT prize pool", topic: "Rank on PNL or volume. Join manually: it's not automatic.", date: "2026-11-08", time: "", where: "", channel: "#announcement-board", partner: "okx", cta: "Join via the link in Discord" }],
    ["winners", "Winners", "Congratulate winners or top traders", "confetti", { bg: "#0b0b0f", ray: "rgba(255,180,0,0.07)" }, "#1F7A4D", { kicker: "Congratulations", title: "Top volume traders", topic: "Name 1 · Name 2 · Name 3", where: "", channel: "#announcement-board" }],
    ["schedule", "Schedule Change", "Moved, cancelled or no session", "solid", { bg: "#0e1d1d", shape: "rgba(90,200,190,0.07)" }, "#127475", { kicker: "Schedule update", title: "No MMU tonight", topic: "We're taking a break for the holiday. See you next Monday.", date: "2026-11-02", time: "", where: "", channel: "#upcoming-events" }],
    ["teaser", "Coming Soon", "Tease a launch", "spotlight", { bg: "#05060a", light: "rgba(255,180,0,0.22)" }, "#0B0B0F", { kicker: "Coming soon", title: "A new world awaits", topic: "Something we've been building for a long time.", where: "", channel: "#announcement-board" }],
  ];
  for (const [id, name, blurb, bg, pal, cbg, f] of base) {
    add({ id, name, blurb, seed: id, lookA: { bg, pal }, lookC: { bg: cbg, ink: "#fff" }, fields: Object.assign({ hostName: "", hostRole: "", date: "", time: "", live: false, cta: "" }, f) });
  }

  /* ---------- drawing pieces ---------- */
  function logoImg(tone, which) {
    if (which === "zft") return tone === "black" ? IMG.zftBlack : IMG.zftWhite;
    return tone === "black" ? IMG.trBlack : tone === "gold" ? IMG.trGold : IMG.trWhite;
  }
  function drawLogos(ctx, x, y, h, tone, alignRight) {
    const z = logoImg(tone, "zft"), t = logoImg(tone, "tr");
    if (!z || !t) return 0;
    const zw = h * 0.82 * z.width / z.height, tw = h * t.width / t.height, gap = h * 0.45;
    const total = zw + gap + tw;
    const x0 = alignRight ? x - total : x;
    ctx.drawImage(z, x0, y + h * 0.09, zw, h * 0.82);
    ctx.drawImage(t, x0 + zw + gap, y, tw, h);
    return total;
  }
  function chip(ctx, x, y, text, px, th, s, opt) {
    ctx.font = font(opt.weight || 700, px, opt.fam || BODY);
    ctx.letterSpacing = (opt.ls || 0.04) * px + "px";
    const pad = Math.max(BOX_PAD, px * 0.75) * s / s; // >= 16 px inside the box
    const w = ctx.measureText(text).width + pad * 2 + (opt.dot ? px * 1.1 : 0), h = px + pad * 1.4;
    rr(ctx, x, y, w, h, h / 2);
    ctx.fillStyle = opt.bg; ctx.fill();
    if (opt.line && opt.line !== "rgba(0,0,0,0)") { ctx.strokeStyle = opt.line; ctx.lineWidth = 2; ctx.stroke(); }
    let tx = x + pad;
    if (opt.dot) { ctx.fillStyle = opt.dot; ctx.beginPath(); ctx.arc(tx + px * 0.35, y + h / 2, px * 0.3, 0, Math.PI * 2); ctx.fill(); tx += px * 1.1; }
    ctx.fillStyle = opt.ink; ctx.textBaseline = "middle"; ctx.fillText(text, tx, y + h / 2 + px * 0.04);
    ctx.textBaseline = "alphabetic";
    return { w, h };
  }
  function hostPhoto(ctx, cx, cy, R, f, th, s) {
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.closePath();
    if (f.photo) { ctx.clip(); coverImg(ctx, f.photo, cx - R, cy - R, R * 2, R * 2, 0.5, 0.3); }
    else {
      ctx.fillStyle = "rgba(255,255,255,0.12)"; ctx.fill(); ctx.clip();
      const ini = (f.hostName || "?").replace(/^coach\s+/i, "").split(/[\s&]+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
      ctx.fillStyle = th.ink; ctx.font = font(800, R * 0.8, DISPLAY); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.letterSpacing = "0px";
      ctx.fillText(ini, cx, cy + R * 0.05); ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
    }
    ctx.restore();
    ctx.strokeStyle = th.accent; ctx.lineWidth = Math.max(4, R * 0.06); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  }
  /* adaptive footer pill: frosted copy of the art behind it + tint sampled from that art */
  function footerPill(ctx, canvas, cx, y, text, px, align) {
    ctx.font = font(700, px, BODY); ctx.letterSpacing = 0.06 * px + "px";
    const pad = Math.max(BOX_PAD, px * 0.9);
    const w = ctx.measureText(text).width + pad * 2 + px * 1.6, h = px + pad * 1.2;
    const x = align === "left" ? cx : cx - w / 2;
    const [r, g, b] = avgColor(ctx, x, y, w, h);
    const L = lum(r, g, b);
    ctx.save(); rr(ctx, x, y, w, h, h / 2); ctx.clip();
    ctx.filter = `blur(${Math.round(px * 0.8)}px)`; ctx.drawImage(canvas, x - 30, y - 30, w + 60, h + 60, x - 30, y - 30, w + 60, h + 60); ctx.filter = "none";
    const k = L > 0.55 ? -0.25 : 0.35;
    const mix = (c) => Math.round(k > 0 ? c + (255 - c) * k : c * (1 + k));
    ctx.fillStyle = `rgba(${mix(r)},${mix(g)},${mix(b)},0.42)`; ctx.fillRect(x, y, w, h);
    ctx.restore();
    rr(ctx, x, y, w, h, h / 2); ctx.strokeStyle = L > 0.55 ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.28)"; ctx.lineWidth = 1.5; ctx.stroke();
    const ink = L > 0.55 ? "#111" : "#fff";
    // tiny TR mark inside the pill
    const t = L > 0.55 ? IMG.trBlack : IMG.trWhite;
    let tx = x + pad;
    if (t) { const th = px * 0.95, tw = th * t.width / t.height; ctx.drawImage(t, tx, y + (h - th) / 2, tw, th); tx += tw + px * 0.6; }
    ctx.fillStyle = ink; ctx.textBaseline = "middle"; ctx.fillText(text, tx, y + h / 2 + px * 0.04); ctx.textBaseline = "alphabetic";
    return { w, h };
  }

  /* ---------- main render ---------- */
  function render(canvas, tpl, f, look, sizeKey, opts) {
    opts = opts || {};
    const S = SIZES[sizeKey] || SIZES.square;
    const W = S.w, H = S.h;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d");
    const th = theme(tpl, look);
    const s = Math.min(W, H) / 1080 * (sizeKey === "discord" ? 1.45 : 1);
    const r = rng(tpl.seed + look);
    ctx.save();
    BG[th.bg](ctx, W, H, s, r, th.pal || {});
    if (f.bgPhoto) {
      coverImg(ctx, f.bgPhoto, 0, 0, W, H, 0.5, 0.5);
      const ov = ctx.createLinearGradient(0, 0, 0, H); ov.addColorStop(0, "rgba(0,0,0,0.45)"); ov.addColorStop(0.5, "rgba(0,0,0,0.25)"); ov.addColorStop(1, "rgba(0,0,0,0.85)");
      ctx.fillStyle = ov; ctx.fillRect(0, 0, W, H);
    }
    ctx.restore();
    const M = Math.round(64 * s);
    const tone = th.logoTone || "white";
    const wide = sizeKey === "discord";
    const tall = sizeKey === "story";

    // top bar
    const logoH = Math.round((wide ? 40 : 46) * s);
    drawLogos(ctx, W - M, M, logoH, tone, true);
    let lx = M;
    const chipPx = Math.round(24 * s);
    if (f.live) { const c = chip(ctx, lx, M + (logoH - (chipPx + Math.max(BOX_PAD, chipPx * 0.75) * 1.4)) / 2, "LIVE", chipPx, th, s, { bg: "#E5383B", ink: "#fff", dot: "#fff", fam: BODY, weight: 800 }); lx += c.w + 12 * s; }
    if (f.where && /fb|youtube|zoom|discord/i.test(f.where) && !wide) {
      ctx.font = font(700, chipPx * 0.9, BODY); ctx.letterSpacing = "0px"; ctx.fillStyle = th.sub; ctx.textBaseline = "middle";
      ctx.fillText(f.where.toUpperCase(), lx + 4 * s, M + logoH / 2); ctx.textBaseline = "alphabetic";
    }

    // footer pill
    const fpx = Math.round((wide ? 20 : 24) * s);
    const footText = (opts.footer || "Trading Republic by ZFT") + (f.channel ? "  ·  " + f.channel : "");
    const fh = fpx + Math.max(BOX_PAD, fpx * 0.9) * 1.2;
    const fy = H - M - fh;

    // content area
    const colW = wide ? W * 0.6 - M : W - M * 2;
    const titleTop = M + logoH + Math.round((tall ? 120 : 40) * s);
    let bottom = fy - Math.round(28 * s);

    // details chips (date, time, where)
    const det = [];
    if (f.date) det.push(fmtDate(f.date));
    if (f.time) det.push(timeLine(f));
    if (f.where && !/fb|youtube|zoom|discord/i.test(f.where)) det.push(f.where.toUpperCase());
    else if (f.where && wide) det.push(f.where.toUpperCase());
    const dpx = Math.round((wide ? 22 : 28) * s);
    const dh = dpx + Math.max(BOX_PAD, dpx * 0.75) * 1.4;
    // lay chips in rows within colW
    ctx.font = font(700, dpx, BODY);
    const rows = []; let row = [], rw = 0;
    for (const d of det) {
      ctx.letterSpacing = 0.04 * dpx + "px";
      const w = ctx.measureText(d).width + Math.max(BOX_PAD, dpx * 0.75) * 2;
      if (row.length && rw + w + 12 * s > colW) { rows.push(row); row = []; rw = 0; }
      row.push(d); rw += w + 12 * s;
    }
    if (row.length) rows.push(row);
    const chipsH = rows.length ? rows.length * dh + (rows.length - 1) * 12 * s : 0;
    let y = bottom - chipsH;
    for (const rw2 of rows) {
      let x = M;
      for (const d of rw2) { const c = chip(ctx, x, y, d, dpx, th, s, { bg: th.chipBg, ink: th.chipInk || th.ink, line: th.chipLine }); x += c.w + 12 * s; }
      y += dh + 12 * s;
    }
    bottom = bottom - chipsH - (chipsH ? 28 * s : 0);

    // host block (+ partner)
    const hasHost = !!(f.hostName || f.photo);
    const partnerImg = f.partnerImg;
    if (wide) {
      // right column: big host photo or partner
      const R = H * 0.26;
      const cx = W - M - R - 10 * s, cy = H * 0.56;
      if (hasHost) {
        hostPhoto(ctx, cx, cy, R, f, th, s);
        ctx.textAlign = "center"; ctx.fillStyle = th.ink; ctx.font = font(800, 26 * s, DISPLAY); ctx.letterSpacing = "0px";
        const nm = fit(ctx, (f.hostRole ? "with " : "") + f.hostName, DISPLAY, 800, R * 2.6, 26 * s, 16 * s, 1);
        ctx.font = font(800, nm.px, DISPLAY); ctx.fillText(nm.lines[0] || "", cx, cy + R + 40 * s);
        ctx.textAlign = "left";
      } else if (partnerImg) {
        containImg(ctx, partnerImg, cx - R, cy - R * 0.5, R * 2, R);
      }
      if (hasHost && partnerImg) { const ph = 44 * s; containImg(ctx, partnerImg, M, M + logoH + 20 * s, 220 * s, ph, "left"); }
    } else {
      const R = Math.round((th.bigHost ? 92 : 70) * s);
      let rowH = 0;
      if (hasHost) {
        rowH = R * 2;
        const cy = bottom - R;
        hostPhoto(ctx, M + R, cy, R, f, th, s);
        const tx = M + R * 2 + 24 * s, maxW = W - M - tx - (partnerImg ? 240 * s : 0);
        ctx.fillStyle = th.sub; ctx.font = font(600, 24 * s, BODY); ctx.letterSpacing = 0.08 * 24 * s + "px";
        ctx.fillText(f.hostRole ? ("WITH " + f.hostRole).toUpperCase() : "WITH", tx, cy - 6 * s);
        const nm = fit(ctx, f.hostName || "", DISPLAY, 800, maxW, 40 * s, 22 * s, 1);
        ctx.fillStyle = th.ink; ctx.font = font(800, nm.px, DISPLAY); ctx.letterSpacing = "0px";
        ctx.fillText(nm.lines[0] || "", tx, cy + nm.px * 0.95);
      }
      if (partnerImg) {
        const pw = 220 * s, ph = 64 * s;
        const py = hasHost ? bottom - R - ph / 2 : bottom - ph;
        const px0 = hasHost ? W - M - pw : M;
        ctx.fillStyle = th.sub; ctx.font = font(600, 20 * s, BODY); ctx.letterSpacing = 0.1 * 20 * s + "px";
        ctx.textAlign = hasHost ? "right" : "left";
        ctx.fillText("IN PARTNERSHIP WITH", hasHost ? W - M : M, py - 14 * s);
        ctx.textAlign = "left";
        containImg(ctx, partnerImg, px0, py, pw, ph, hasHost ? "right" : "left");
        if (!hasHost) rowH = ph + 34 * s;
      }
      bottom -= rowH + (rowH ? 36 * s : 0);
    }

    // CTA line
    if (f.cta) {
      const cpx = Math.round((wide ? 22 : 28) * s);
      ctx.font = font(700, cpx, BODY); ctx.letterSpacing = "0px"; ctx.fillStyle = th.accent;
      const c = fit(ctx, f.cta, BODY, 700, colW, cpx, 16 * s, 1);
      ctx.font = font(700, c.px, BODY); ctx.fillText(c.lines[0], M, bottom);
      bottom -= c.px + 26 * s;
    }

    // topic
    const space = bottom - titleTop;
    if (f.topic) {
      const tpx = Math.round((wide ? 26 : tall ? 40 : 32) * s);
      const tp = fit(ctx, f.topic, BODY, 500, colW, tpx, 18 * s, wide ? 2 : 3);
      ctx.font = font(500, tp.px, BODY); ctx.letterSpacing = "0px"; ctx.fillStyle = th.sub;
      const lh = tp.px * 1.3;
      let ty = bottom - (tp.lines.length - 1) * lh;
      for (const l of tp.lines) { ctx.fillText(l, M, ty); ty += lh; }
      bottom -= tp.lines.length * lh + 22 * s;
    }

    // title (+ kicker)
    const kpx = Math.round((wide ? 22 : 26) * s);
    const avail = bottom - titleTop - (f.kicker ? kpx * 1.8 : 0);
    const T0 = th.title;
    const ttl = T0.upper ? (f.title || "").toUpperCase() : f.title || "";
    let tl;
    if (T0.script && /meet/i.test(ttl)) {
      // two-part: big condensed word + gold script
      const parts = ttl.split(/\s+/);
      const first = parts[0], rest = (f.title || "").split(/\s+/).slice(1).join(" ");
      const a = fit(ctx, first, T0.fam, T0.w, colW, Math.min(260 * s, avail * 0.55), 40 * s, 1, T0.ls);
      const b = fit(ctx, rest || "", MARKER, 400, colW * 0.95, Math.min(170 * s, avail * 0.4), 30 * s, 1, 0);
      const total = a.px * 0.95 + b.px * 1.05;
      let yy = bottom - total;
      ctx.fillStyle = th.ink; ctx.font = font(T0.w, a.px, T0.fam); ctx.letterSpacing = T0.ls * a.px + "px";
      ctx.fillText(a.lines[0] || "", M, yy + a.px * 0.9);
      ctx.save(); ctx.translate(M + 10 * s, yy + a.px * 0.95 + b.px * 0.85); ctx.rotate(-0.06);
      ctx.fillStyle = th.accent; ctx.font = font(400, b.px, MARKER); ctx.letterSpacing = "0px"; ctx.fillText(b.lines[0] || "", 0, 0); ctx.restore();
      tl = { top: yy };
    } else {
      const maxPx = Math.min((wide ? 110 : tall ? 170 : 150) * s, avail);
      const t = fit(ctx, ttl, T0.fam, T0.w, colW, maxPx, 34 * s, wide ? 2 : 3, T0.ls);
      const lh = t.px * (T0.fam === ANTON ? 1.0 : 1.02);
      let yy = bottom - (t.lines.length - 1) * lh;
      ctx.font = font(T0.w, t.px, T0.fam); ctx.letterSpacing = T0.ls * t.px + "px";
      const top = yy - t.px * (T0.fam === ANTON ? 0.98 : 0.8);
      t.lines.forEach((l, i) => {
        if (th.goldWord && i === t.lines.length - 1) {
          const words = l.split(" "); const last = words.pop(); const head = words.length ? words.join(" ") + " " : "";
          ctx.fillStyle = th.ink; ctx.fillText(head, M, yy);
          ctx.fillStyle = th.accent; ctx.fillText(last, M + ctx.measureText(head).width, yy);
        } else { ctx.fillStyle = th.ink; ctx.fillText(l, M, yy); }
        yy += lh;
      });
      tl = { top };
    }
    if (f.kicker) {
      ctx.font = font(700, kpx, BODY); ctx.letterSpacing = 0.14 * kpx + "px"; ctx.fillStyle = th.accent;
      const k = fit(ctx, f.kicker.toUpperCase(), BODY, 700, colW, kpx, 14 * s, 1, 0.14);
      ctx.font = font(700, k.px, BODY); ctx.letterSpacing = 0.14 * k.px + "px";
      ctx.fillText(k.lines[0], M, tl.top - kpx * 0.9);
    }

    footerPill(ctx, canvas, wide ? M : W / 2, fy, footText.toUpperCase(), fpx, wide ? "left" : "center");
    ctx.letterSpacing = "0px";
    return canvas;
  }

  async function loadAssets(map) {
    await Promise.all(Object.entries(map).map(([k, v]) => loadImg(k, v)));
  }
  function loadImg(key, src) {
    return new Promise((res) => { const i = new Image(); i.onload = () => { IMG[key] = i; res(i); }; i.onerror = () => res(null); i.src = src; });
  }
  async function loadFonts() {
    const want = ['800 40px "Plus Jakarta Sans"', '700 40px "Plus Jakarta Sans"', '500 40px "DM Sans"', '700 40px "DM Sans"', '600 40px "DM Sans"', '800 40px "DM Sans"', '400 40px Anton', '400 40px "Archivo Black"', '400 40px "Permanent Marker"'];
    try { await Promise.all(want.map((f) => document.fonts.load(f))); } catch (e) {}
  }

  window.TRPoster = { render, TEMPLATES: T, SIZES, LOOKS, loadAssets, loadFonts, IMG, fmtDate, timeLine };
})();
