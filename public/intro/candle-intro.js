/* Trading Republic welcome intro: tap the candle (George's picks, 10 Nov 2026, from the Candle Intro Studio).
   Comic Book art · candle with dot eyes · cracked concrete · charcoal glow · bobbing arrow + text · Ink Splash transition.
   Shows once a day per browser (?intro=1 always shows it), never to crawlers. People who prefer reduced motion get a short fade.
   Drawn in canvas: no images or video to download. */
(() => {
  const root = document.documentElement, screen = document.getElementById('tr-intro')
  if (!screen || !root.classList.contains('intro-on')) return
  /* ───────── Drawing engine ───────── */
  const ART = {
    A: { wobble: 1.6, ink: '#0b0b0b', inkW: 4, glow: false, font: "'Lilita One'", candle: '#3ddc84', hi: '#8ff0b8' },
    B: { wobble: 0, ink: '#06210f', inkW: 2, glow: true, font: "'Plus Jakarta Sans'", candle: '#22c55e', hi: '#86efac' },
    C: { wobble: 1.1, ink: '#0b0b0b', inkW: 5, glow: false, comic: true, font: "'Lilita One'", candle: '#36e57f', hi: '#d6ffe6' },
  }
  const GROUND = { A: ['#4a4a4f', '#2c2c30'], B: ['#121418', '#0a0b0d'], C: ['#2a2a2e', '#151517'] }
  const WARP = { A: ['#F9A825', '#3ddc84', '#fff3c4'], B: ['#ffffff', '#d1fae5', '#86efac'], C: ['#22c55e', '#ef4444', '#F9A825'] }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const rnd = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647)
  const ease = { in: (t) => t * t * t, out: (t) => 1 - Math.pow(1 - t, 3), io: (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) }
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
  const heroHTML = '<div class="hero" aria-hidden="true"><div class="hero-nav">TRADING REPUBLIC<b>Join free</b></div><h3>The New Generation of <span>Wealth Builders.</span></h3><p>A community of traders and investors learning stocks, crypto and forex together.</p><div class="hero-btns"><span>Join free on Discord</span><span>Trader or investor? 3-min assessment</span></div></div>'

  function Intro(screen, getCfg, opt = {}) {
    const cv = document.createElement('canvas'), ctx = cv.getContext('2d')
    cv.tabIndex = opt.inCard ? -1 : 0; cv.setAttribute('role', 'button'); cv.setAttribute('aria-label', 'Enter Trading Republic: tap the candle')
    screen.appendChild(cv)
    const skip = { addEventListener() {} }
    const touch = !!opt.phone
    let W = 0, H = 0, dpr = 1, phase = 'idle', t0 = 0, visible = true, raf = 0, wig = 0, alive = true, idleSince = performance.now(), doneAt = 0
    let cracks = [], specks = [], debris = [], stars = [], dust = []
    const C = () => { const c = getCfg(); return { c, a: ART[c.art] } }
    const geo = () => { const s = Math.min(W * 1.15, H * .85); return { s, cx: W / 2, gy: H * (W > H ? .7 : .62), bw: s * .16, bh: s * .38, wick: s * .1 } }
    function build() {
      const R = rnd(7919), g = geo(); cracks = []
      for (let i = 0; i < 9; i++) { const pts = [[0, 0]]; let x = 0, y = 0, ang = (i / 9) * Math.PI * 2 + R() * .5; for (let k = 0; k < 6; k++) { ang += (R() - .5) * .9; const len = g.s * (.05 + R() * .07); x += Math.cos(ang) * len; y += Math.sin(ang) * len * .38; pts.push([x, y]) } cracks.push({ pts, base: .25 + R() * .25 }) }
      specks = Array.from({ length: 160 }, () => [R(), R(), R()])
      dust = Array.from({ length: 50 }, () => ({ x: R(), y: R(), s: R(), v: .02 + R() * .05 }))
      stars = Array.from({ length: 220 }, () => ({ a: R() * Math.PI * 2, z: R(), sp: .4 + R() * .9, k: Math.floor(R() * 3), red: R() < .4 }))
    }
    function size() { const r = screen.getBoundingClientRect(); if (!r.width) return; dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; build() }
    let A
    const wob = (v, t, f = 1) => (A.wobble ? v + Math.sin(t * 7 * f + v) * A.wobble * .6 : v)
    function inkPath(points, t, close) { ctx.beginPath(); points.forEach(([x, y], i) => { const X = wob(x, t, 1 + i * .13), Y = wob(y, t, 1.3 + i * .11); i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y) }); if (close) ctx.closePath() }
    function drawBg(c, t) {
      const g = geo(), hz = g.gy - g.s * .06
      const bg = ctx.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .45, Math.max(W, H) * .75)
      bg.addColorStop(0, c.bg === 'B' ? '#141210' : '#28282c'); bg.addColorStop(1, '#040405'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
      if (c.bg === 'C') { ctx.fillStyle = 'rgba(255,255,255,.055)'; const st = Math.max(7, W / 70); for (let y = 0; y < hz; y += st) for (let x = (y / st) % 2 ? st / 2 : 0; x < W; x += st) { ctx.beginPath(); ctx.arc(x, y, st * .2 * (1 - y / hz) + .3, 0, 7); ctx.fill() } }
      if (c.bg === 'B') for (const d of dust) { const y = ((d.y - t * d.v) % 1 + 1) % 1; ctx.fillStyle = `rgba(249,168,37,${.25 + d.s * .55})`; ctx.beginPath(); ctx.arc(d.x * W, y * hz, .6 + d.s * 1.8, 0, 7); ctx.fill() }
      const [g0, g1] = GROUND[c.ground]; const gr = ctx.createLinearGradient(0, hz, 0, H); gr.addColorStop(0, g0); gr.addColorStop(1, g1)
      ctx.fillStyle = gr; ctx.fillRect(0, hz, W, H - hz)
      if (c.ground === 'B') { ctx.strokeStyle = 'rgba(34,197,94,.2)'; ctx.lineWidth = 1; for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * g.s * .03, hz); ctx.lineTo(W / 2 + i * g.s * .22, H); ctx.stroke() } for (let k = 1; k < 8; k++) { const y = hz + Math.pow(k / 8, 1.8) * (H - hz); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() } }
      else for (const [x, y, s] of specks) { ctx.fillStyle = s > .5 ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.25)'; ctx.fillRect(x * W, hz + y * (H - hz), 1.2 + s * 2, 1.2 + s * 2) }
      if (c.ground === 'C') { ctx.fillStyle = '#F9A825'; for (let k = 0; k < 7; k++) { const p0 = Math.pow(k / 7, 1.7), p1 = Math.pow((k + .45) / 7, 1.7); const y0 = hz + p0 * (H - hz) + g.s * .05, y1 = hz + p1 * (H - hz) + g.s * .05; if (y0 > H) break; const w0 = 1 + p0 * g.s * .03, w1 = 1 + p1 * g.s * .03; ctx.beginPath(); ctx.moveTo(W / 2 - w0, y0); ctx.lineTo(W / 2 + w0, y0); ctx.lineTo(W / 2 + w1, y1); ctx.lineTo(W / 2 - w1, y1); ctx.fill() } }
      if (A.wobble) { ctx.strokeStyle = A.ink; ctx.lineWidth = A.inkW * .8; inkPath([[-10, hz], [W * .3, hz - 1], [W * .7, hz + 1], [W + 10, hz]], t); ctx.stroke() }
    }
    function drawCracks(c, t, p) {
      const g = geo(), gold = A.glow || c.ground === 'B'; ctx.save(); ctx.translate(g.cx, g.gy)
      ctx.strokeStyle = gold ? '#F9A825' : A.ink; ctx.lineWidth = gold ? 2 : A.inkW * .8; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      if (gold) { ctx.shadowColor = '#F9A825'; ctx.shadowBlur = 8 }
      for (const k of cracks) { const n = Math.max(2, Math.round(k.pts.length * clamp(k.base + p * (1 - k.base)))); inkPath(k.pts.slice(0, n), t); ctx.stroke() }
      ctx.restore()
    }
    function drawCandle(c, t, x, y, sc, rot, squash, blink) {
      const g = geo(), bw = g.bw * sc, bh = g.bh * sc * squash, wk = g.wick * sc
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot)
      ctx.lineCap = 'round'
      if (c.candle === 'C') { ctx.shadowColor = '#F9A825'; ctx.shadowBlur = 16 * sc; ctx.strokeStyle = '#F9A825'; ctx.lineWidth = Math.max(3, A.inkW * 1.2 * sc) }
      else { if (A.glow) { ctx.shadowColor = A.candle; ctx.shadowBlur = 20 * sc } ctx.strokeStyle = A.glow ? A.hi : A.ink; ctx.lineWidth = Math.max(2, (A.glow ? 3 : A.inkW) * sc) }
      ctx.beginPath(); ctx.moveTo(wob(0, t), -bh - wk); ctx.lineTo(wob(0, t, 1.4), -bh); ctx.stroke(); ctx.shadowBlur = 0
      const w2 = bw / 2 * (2 - squash)
      if (A.glow) { ctx.shadowColor = A.candle; ctx.shadowBlur = 24 * sc }
      if (A.comic) { ctx.fillStyle = '#0b0b0b'; inkPath([[-w2 + bw * .14, -bh + bw * .1], [w2 + bw * .14, -bh + bw * .1], [w2 + bw * .14, 0], [-w2 + bw * .14, 0]], t, true); ctx.fill() }
      ctx.fillStyle = A.candle; inkPath([[-w2, -bh], [w2, -bh], [w2, 0], [-w2, 0]], t, true); ctx.fill(); ctx.shadowBlur = 0
      if (A.comic) { ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(0,60,25,.35)'; const st = Math.max(3, bw * .14); for (let yy = -bh; yy < 0; yy += st) for (let xx = 0; xx < w2; xx += st) { ctx.beginPath(); ctx.arc(xx + (yy / st % 2 ? st / 2 : 0), yy, st * .28 * (xx / w2 + .2), 0, 7); ctx.fill() } ctx.restore(); inkPath([[-w2, -bh], [w2, -bh], [w2, 0], [-w2, 0]], t, true) }
      ctx.strokeStyle = A.ink; ctx.lineWidth = Math.max(2, A.inkW * sc); ctx.stroke()
      ctx.fillStyle = A.hi; ctx.globalAlpha = .55; ctx.fillRect(-w2 + bw * .14, -bh + bh * .08, bw * .12, bh * .62); ctx.globalAlpha = 1
      if (c.candle === 'A') { ctx.fillStyle = A.glow ? '#04140a' : A.ink; const ey = -bh * .66, eh = Math.max(1.2, bw * .11 * (blink ? .15 : 1)); for (const ex of [-bw * .17, bw * .17]) { ctx.beginPath(); ctx.ellipse(ex, ey, bw * .085, eh, 0, 0, 7); ctx.fill() } }
      ctx.restore()
    }
    function drawRim(c, t, open) {
      const g = geo(), rw = g.bw * 1.15 + open * g.s * .5, rh = g.s * .045 + open * g.s * .14, rim = c.warp === 'B' ? '#d1fae5' : '#F9A825'
      ctx.save(); ctx.translate(g.cx, g.gy)
      if (open > 0) { ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 0, rw, rh, 0, 0, 7); ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = 3; ctx.shadowColor = rim; ctx.shadowBlur = 18; ctx.stroke(); ctx.shadowBlur = 0 }
      else { ctx.fillStyle = GROUND[c.ground][0]; ctx.beginPath(); ctx.ellipse(0, 0, rw, rh, 0, 0, Math.PI); ctx.fill(); ctx.strokeStyle = A.glow ? '#F9A825' : A.ink; ctx.lineWidth = A.glow ? 1.5 : A.inkW * .8; ctx.beginPath(); ctx.ellipse(wob(0, t), 0, rw, rh, 0, 0, Math.PI); ctx.stroke() }
      ctx.restore()
    }
    function label(c) { return c.prompt === 'C' ? 'TAP!' : (touch ? 'Tap the candle' : 'Click the candle') }
    function text(str, x, y, size, c) {
      ctx.save(); ctx.font = `${A.glow ? '800 ' : ''}${size}px ${A.font}, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      if (A.glow) { ctx.shadowColor = '#22c55e'; ctx.shadowBlur = 14; ctx.fillStyle = '#d1fae5' } else { ctx.lineWidth = Math.max(3, size * .22); ctx.lineJoin = 'round'; ctx.strokeStyle = A.ink; ctx.strokeText(str, x, y); ctx.fillStyle = '#fff3c4' }
      ctx.fillText(str, x, y); ctx.restore()
    }
    function drawPrompt(c, t) {
      const g = geo(), top = g.gy - g.bh - g.wick, fs = Math.max(10, g.s * .05), ty = Math.min(H - fs, g.gy + g.s * .2)
      if (c.prompt === 'A') {
        const y = top - g.s * .08 + Math.sin(t * 4) * g.s * .02, a = g.s * .04
        ctx.save(); ctx.translate(g.cx, y); ctx.fillStyle = A.glow ? A.hi : '#F9A825'; ctx.strokeStyle = A.ink; ctx.lineWidth = 3
        inkPath([[-a * .45, -a * 1.6], [a * .45, -a * 1.6], [a * .45, -a * .5], [a, -a * .5], [0, a * .4], [-a, -a * .5], [-a * .45, -a * .5]], t, true); ctx.fill(); if (!A.glow) ctx.stroke(); ctx.restore()
        text(label(c), W / 2, ty, fs, c)
      } else if (c.prompt === 'B') {
        for (let i = 0; i < 3; i++) { const k = ((t * .7 + i / 3) % 1); ctx.strokeStyle = `rgba(249,168,37,${(1 - k) * .8})`; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(g.cx, g.gy - g.bh * .45, g.bw * (1 + k * 2.2), g.bh * (.6 + k * 1.1), 0, 0, 7); ctx.stroke() }
        text(touch ? 'Tap to enter' : 'Click to enter', W / 2, ty, fs * .9, c)
      } else {
        ctx.save(); ctx.translate(g.cx + g.bw * 1.5, top + Math.sin(t * 5) * g.s * .015); ctx.rotate(-.12 + Math.sin(t * 5) * .06); const r = g.s * .085
        ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, rr = i % 2 ? r * .72 : r; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) } ctx.closePath()
        ctx.fillStyle = '#F9A825'; ctx.fill(); ctx.strokeStyle = '#0b0b0b'; ctx.lineWidth = 3.5; ctx.stroke()
        ctx.fillStyle = '#0b0b0b'; ctx.font = `${r * .55}px 'Lilita One', sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('TAP!', 0, 2); ctx.restore()
      }
    }
    function burst(c) {
      const g = geo(); debris = []
      for (let i = 0; i < 26; i++) { const a = Math.PI + Math.random() * Math.PI, sp = g.s * (1.2 + Math.random() * 2.2) * (c.impact === 'C' ? 1.3 : 1), sz = g.s * (.012 + Math.random() * .03); debris.push({ x: g.cx + (Math.random() - .5) * g.bw * 2, y: g.gy, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 1.2, r: 0, vr: (Math.random() - .5) * 12, col: c.impact === 'B' ? (Math.random() < .5 ? '#F9A825' : '#86efac') : (Math.random() < .5 ? GROUND[c.ground][0] : '#6b6b70'), p: Array.from({ length: 5 }, (_, k) => [Math.cos(k / 5 * 7) * sz * (0.6 + Math.random() * .6), Math.sin(k / 5 * 7) * sz * (0.6 + Math.random() * .6)]) }) }
    }
    function drawDebris(dt) { for (const d of debris) { d.vy += 900 * dt; d.x += d.vx * dt; d.y += d.vy * dt; d.r += d.vr * dt; ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(d.r); ctx.fillStyle = d.col; ctx.strokeStyle = '#0b0b0b'; ctx.lineWidth = 2; ctx.beginPath(); d.p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.fill(); if (!A.glow) ctx.stroke(); ctx.restore() } }
    function drawWarp(c, p) {
      const cx = W / 2, cy = H * .5, maxR = Math.hypot(W, H) * .6, cols = WARP[c.warp]
      ctx.fillStyle = `rgba(0,0,0,${.35 + p * .45})`; ctx.fillRect(0, 0, W, H)
      for (const s of stars) {
        s.z = (s.z + s.sp * (0.004 + p * p * .06)) % 1
        const r1 = Math.pow(s.z, 2.2) * maxR, r2 = r1 + (8 + p * p * maxR * .35) * s.z
        const x1 = cx + Math.cos(s.a) * r1, y1 = cy + Math.sin(s.a) * r1, x2 = cx + Math.cos(s.a) * r2, y2 = cy + Math.sin(s.a) * r2
        if (c.warp === 'C') { ctx.save(); ctx.translate(x1, y1); ctx.rotate(s.a - Math.PI / 2); const w = 2 + s.z * 9, h = (r2 - r1) + 6; ctx.fillStyle = s.red ? '#ef4444' : '#22c55e'; ctx.fillRect(-w / 2, 0, w, h); ctx.fillRect(-.8, -h * .3, 1.6, h * 1.6); ctx.restore() }
        else { ctx.strokeStyle = cols[s.k]; ctx.globalAlpha = clamp(s.z * 1.6); ctx.lineWidth = (c.warp === 'B' ? .8 : 1) + s.z * 2.5; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.globalAlpha = 1 }
      }
      const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * .25 * (1 + p)), cc = c.warp === 'B' ? '230,255,240' : '255,243,196'
      core.addColorStop(0, `rgba(${cc},${p * .9})`); core.addColorStop(1, `rgba(${cc},0)`); ctx.fillStyle = core; ctx.fillRect(0, 0, W, H)
    }
    /* ── the eight transitions (A lives in frame(); B–H here) ── */
    let snap = null, shards = null, blocks = null
    function scene(c, t, o = {}) {
      const g = geo(); ctx.save(); if (o.ty) ctx.translate(0, o.ty)
      drawBg(c, t); drawCracks(c, t, o.crack || 0); drawRim(c, t, o.open || 0)
      if (o.candle !== false) {
        const y = g.gy + g.bh * .12 + (o.dy || 0)
        ctx.save(); ctx.beginPath()
        if (o.free) ctx.rect(0, -H * 3, W, H * 4); else { ctx.rect(0, 0, W, g.gy + g.s * .012); if (o.open) ctx.ellipse(g.cx, g.gy, g.bw * 1.15 + o.open * g.s * .5, g.s * .045 + o.open * g.s * .14, 0, 0, 7) }
        ctx.clip()
        if (o.clipTop) { const top = y - g.bh - g.wick; ctx.beginPath(); ctx.rect(0, top + o.clipTop * (g.bh + g.wick), W, H * 2); ctx.clip() }
        if (o.glowWhite) { ctx.shadowColor = '#fff3c4'; ctx.shadowBlur = 30 }
        drawCandle(c, t, g.cx + (o.dx || 0), y, o.sc || 1, o.rot || 0, o.squash || 1, false); ctx.restore()
      }
      ctx.restore()
    }
    function takeSnap() { snap = document.createElement('canvas'); snap.width = cv.width; snap.height = cv.height; snap.getContext('2d').drawImage(cv, 0, 0) }
    const putSnap = (sx, sy, sw, sh, dx, dy) => ctx.drawImage(snap, sx * dpr, sy * dpr, sw * dpr, sh * dpr, dx, dy, sw, sh)
    const flash = (a, col = '255,243,196') => { ctx.fillStyle = 'rgba(' + col + ',' + clamp(a) + ')'; ctx.fillRect(0, 0, W, H) }
    function windup(e) { return Math.sin(clamp(e / .22) * Math.PI) }
    function runTrans(c, t, e, dt, g) {
      const maxR = Math.hypot(W, H)
      if (c.trans === 'B') { // Beam Down
        const dis = clamp((e - .35) / .65)
        scene(c, t, { clipTop: dis, candle: e < 1.0, glowWhite: e > .2, crack: clamp((e - .3) / .6) * .6 })
        const bwid = g.bw * 1.7 + ease.in(clamp((e - 1.0) / .6)) * W * 1.3, a = clamp(e / .25)
        const gr = ctx.createLinearGradient(g.cx - bwid / 2, 0, g.cx + bwid / 2, 0)
        gr.addColorStop(0, 'rgba(255,243,196,0)'); gr.addColorStop(.5, 'rgba(255,243,196,' + (.75 * a) + ')'); gr.addColorStop(1, 'rgba(255,243,196,0)')
        ctx.fillStyle = gr; ctx.fillRect(g.cx - bwid / 2, 0, bwid, e > 1.0 ? H : g.gy)
        for (let i = 0; i < 3; i++) { const k = ((e * 1.4 + i / 3) % 1); if (e > .3) { ctx.strokeStyle = 'rgba(249,168,37,' + (1 - k) + ')'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(g.cx, g.gy, g.bw * (.8 + k * 2.6), g.s * (.03 + k * .06), 0, 0, 7); ctx.stroke() } }
        for (let i = 0; i < 26; i++) { const yy = ((i * 37.3 + e * g.s * 2.2) % g.gy); ctx.fillStyle = 'rgba(255,255,255,' + (.6 * a) + ')'; ctx.fillRect(g.cx + Math.sin(i * 12.9) * bwid * .3, yy, 2, 6) }
        if (e > 1.35) flash((e - 1.35) / .3)
        if (e > 1.75) finish()
      } else if (c.trans === 'C') { // Sinkhole spiral
        const p = clamp((e - .3) / 1.0), R = ease.in(p) * maxR * 1.05
        scene(c, t, { candle: e < .3, squash: 1 - windup(e) * .12, crack: clamp(e / .3) })
        ctx.save(); ctx.translate(g.cx, g.gy)
        ctx.fillStyle = '#050506'; ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fill()
        for (let k = 0; k < 7; k++) { ctx.beginPath(); for (let r = 0; r <= R; r += 6) { const a = k * Math.PI * 2 / 7 + (r / Math.max(1, R)) * 5 - e * 7; ctx[r ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r * .55) } ctx.strokeStyle = k % 2 ? 'rgba(249,168,37,.55)' : 'rgba(61,220,132,.45)'; ctx.lineWidth = 3; ctx.stroke() }
        ctx.restore()
        if (e > .3 && p < 1) { const a = (e - .3) * 9, rr = (1 - p) * g.s * .2; ctx.save(); ctx.globalAlpha = 1 - clamp((p - .7) / .3); drawCandle(c, t, g.cx + Math.cos(a) * rr, g.gy + Math.sin(a) * rr * .5, 1 - p * .85, a, 1, false); ctx.restore() }
        if (e > 1.25) { const k = ease.io(clamp((e - 1.25) / .6)); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(g.cx, g.gy, k * maxR, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = '#F9A825'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(g.cx, g.gy, k * maxR, 0, 7); ctx.stroke() }
        if (e > 1.9) finish()
      } else if (c.trans === 'D') { // Glass shatter
        if (!snap) {
          const slam = clamp((e - .22) / .2)
          ctx.save(); if (e > .22 && e < .7) ctx.translate((Math.random() - .5) * g.s * .03, (Math.random() - .5) * g.s * .03)
          scene(c, t, { dy: ease.in(slam) * g.bh * .4 - windup(e) * g.s * .03, squash: 1 - windup(e) * .12, crack: slam })
          const rays = clamp((e - .3) / .3)
          if (e > .3) { ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1.6; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2 + Math.sin(i * 3.1) * .2; ctx.beginPath(); ctx.moveTo(g.cx, g.gy - g.bh * .5); ctx.lineTo(g.cx + Math.cos(a) * maxR * rays, g.gy - g.bh * .5 + Math.sin(a) * maxR * rays); ctx.stroke() } for (const rr of [.12, .3, .55]) { if (rays > rr) { ctx.beginPath(); for (let i = 0; i <= 14; i++) { const a = i / 14 * Math.PI * 2 + Math.sin(i * 3.1) * .2; ctx.lineTo(g.cx + Math.cos(a) * maxR * rr, g.gy - g.bh * .5 + Math.sin(a) * maxR * rr) } ctx.stroke() } } }
          ctx.restore()
          if (e > .7) {
            takeSnap(); shards = []; const cx = g.cx, cy = g.gy - g.bh * .5, rings = [0, .12, .3, .55, 1.3]
            const angs = Array.from({ length: 15 }, (_, i) => (i % 14) / 14 * Math.PI * 2 + Math.sin((i % 14) * 3.1) * .2 + (i === 14 ? Math.PI * 2 : 0))
            for (let r = 0; r < 4; r++) for (let i = 0; i < 14; i++) {
              const pts = [[angs[i], rings[r]], [angs[i + 1], rings[r]], [angs[i + 1], rings[r + 1]], [angs[i], rings[r + 1]]].map(([a, k]) => [cx + Math.cos(a) * maxR * k, cy + Math.sin(a) * maxR * k])
              const mx = pts.reduce((s, p) => s + p[0], 0) / 4, my = pts.reduce((s, p) => s + p[1], 0) / 4
              shards.push({ pts, mx, my, vx: (mx - cx) * (1.2 + Math.random()), vy: (my - cy) * .6 - g.s * (.5 + Math.random()), vr: (Math.random() - .5) * 5, delay: (3 - r) * .05 + Math.random() * .08, x: 0, y: 0, r: 0 })
            }
          }
        } else {
          const k = e - .78
          for (const sh of shards) {
            const tt = Math.max(0, k - sh.delay); sh.x = sh.vx * tt; sh.y = sh.vy * tt + 1400 * tt * tt; sh.r = sh.vr * tt
            ctx.save(); ctx.translate(sh.mx + sh.x, sh.my + sh.y); ctx.rotate(sh.r); ctx.translate(-sh.mx, -sh.my)
            ctx.beginPath(); sh.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.save(); ctx.clip(); ctx.drawImage(snap, 0, 0, W, H); ctx.restore()
            ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore()
          }
          if (k > 1.25) finish()
        }
      } else if (c.trans === 'E') { // Ink splash
        const stretch = clamp(e / .25)
        scene(c, t, { squash: 1 + Math.sin(stretch * Math.PI) * .25, candle: e < .45 })
        const inkC = A.glow ? '#04140a' : '#0b0b0b'
        if (e > .2) {
          const p = ease.io(clamp((e - .25) / .85)), R = p * maxR * .78, cx = g.cx, cy = g.gy - g.bh * .5
          const drain = ease.in(clamp((e - 1.2) / .8)) * (H + g.s * .4)
          ctx.save()
          ctx.beginPath(); ctx.rect(0, drain - g.s * .2, W, H * 2); ctx.clip()
          ctx.fillStyle = inkC; ctx.beginPath()
          for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2, rr = R * (1 + .09 * Math.sin(a * 7 + e * 8) + .05 * Math.sin(a * 13)); ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) }
          ctx.fill()
          for (let i = 0; i < 18; i++) { const a = i * 2.39, rr = R * (1.05 + (i % 5) * .06); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, g.s * (.01 + (i % 4) * .008) * (1 + p), 0, 7); ctx.fill() }
          if (drain > 0) { ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.moveTo(0, drain); for (let x = 0; x <= W; x += 8) ctx.lineTo(x, drain + Math.sin(x * .05 + e * 6) * g.s * .03 + (Math.sin(x * .013) > .7 ? g.s * .12 : 0)); ctx.lineTo(W, -10); ctx.lineTo(0, -10); ctx.fill(); ctx.globalCompositeOperation = 'source-over' }
          ctx.restore()
          if (drain > 0) { ctx.save(); ctx.globalCompositeOperation = 'destination-out'; ctx.fillRect(0, 0, W, Math.max(0, drain - g.s * .2)); ctx.restore() }
        }
        if (e > 2.05) finish()
      } else if (c.trans === 'F') { // Elevator drop
        if (e < .85) {
          const slam = clamp((e - .22) / .28), drop = clamp((e - .5) / .35)
          ctx.save(); if (e > .22 && e < .7) ctx.translate((Math.random() - .5) * g.s * .03, (Math.random() - .5) * g.s * .03)
          scene(c, t, { dy: -windup(e) * g.s * .03 + ease.in(slam) * g.bh * .5 + ease.in(drop) * g.s * .3, squash: 1 - windup(e) * .12, crack: ease.out(slam), open: ease.io(drop), sc: 1 - drop * .5 }); ctx.restore()
        } else {
          const k = e - .85; ctx.fillStyle = '#030303'; ctx.fillRect(0, 0, W, H)
          const [g0] = GROUND[c.ground]
          for (let i = 5; i >= 0; i--) {
            const z = ((k * 1.5 + i / 6) % 1), sc = .15 + Math.pow(z, 3) * 9, hole = sc * g.s * .22, last = k > 1.0 && i === 0
            if (hole > maxR) continue
            ctx.save(); ctx.globalAlpha = clamp(z * 3)
            ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.ellipse(W / 2, H / 2, hole, hole * .55, 0, 0, 7); ctx.fillStyle = g0; ctx.fill('evenodd')
            ctx.strokeStyle = A.glow ? '#F9A825' : A.ink; ctx.lineWidth = 2 + sc; ctx.beginPath(); ctx.ellipse(W / 2, H / 2, hole, hole * .55, 0, 0, 7); ctx.stroke()
            ctx.fillStyle = 'rgba(0,0,0,' + (1 - z) * .7 + ')'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.ellipse(W / 2, H / 2, hole, hole * .55, 0, 0, 7); ctx.fill('evenodd')
            ctx.restore()
          }
          ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1; for (let i = 0; i < 20; i++) { const x = (i * 97.3) % W, y = ((i * 53.1 - k * H * 3) % H + H) % H; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + g.s * .15); ctx.stroke() }
          drawCandle(c, t, W / 2, H / 2 + g.s * .05, .3, k * 3, 1, false)
          const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, g.s * .3); glow.addColorStop(0, 'rgba(255,243,196,' + clamp((k - .6) / .5) + ')'); glow.addColorStop(1, 'rgba(255,243,196,0)'); ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H)
          if (k > 1.05) flash((k - 1.05) / .3)
          if (k > 1.4) finish()
        }
      } else if (c.trans === 'G') { // Glitch dissolve
        if (!snap) { scene(c, t, {}); takeSnap() }
        const p = clamp(e / 1.0), bands = 18
        for (let i = 0; i < bands; i++) {
          const y = i * H / bands, h = H / bands + 1, dx = (Math.sin(i * 7.7 + Math.floor(e * 24) * 3.3) * p * p) * W * .18
          putSnap(0, y, W, h, dx, y)
          if (Math.sin(i * 3.1 + Math.floor(e * 30)) > .6 && e > .15) { ctx.fillStyle = i % 2 ? 'rgba(34,197,94,.35)' : 'rgba(249,168,37,.3)'; ctx.fillRect(dx * .6, y, W, h * .35) }
        }
        ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1)
        if (e > .75) {
          const bs = Math.max(8, Math.round(g.s * .05)); if (!blocks) { blocks = []; for (let y = 0; y < H; y += bs) for (let x = 0; x < W; x += bs) blocks.push([x, y, Math.random()]) }
          const k = clamp((e - .75) / .7); ctx.save(); ctx.globalCompositeOperation = 'destination-out'; for (const [x, y, r] of blocks) if (r < k) ctx.fillRect(x, y, bs, bs); ctx.restore()
          ctx.fillStyle = 'rgba(134,239,172,.6)'; for (const [x, y, r] of blocks) if (r > k && r < k + .04) ctx.fillRect(x, y, bs, bs)
        }
        if (e > 1.5) finish()
      } else if (c.trans === 'H') { // Candle pump
        const rumble = e < .35 ? (Math.random() - .5) * g.s * .012 : 0
        const rise = ease.in(clamp((e - .35) / 1.0)), scroll = rise * H * .9
        ctx.save(); ctx.translate(rumble, 0)
        scene(c, t, { candle: false, crack: clamp(e / .35), ty: scroll })
        const cy = g.gy + g.bh * .12 - rise * (g.gy + g.bh * 1.6) + scroll * .2
        ctx.strokeStyle = '#3ddc84'; ctx.lineWidth = 3; ctx.shadowColor = '#3ddc84'; ctx.shadowBlur = 10; ctx.beginPath()
        for (let i = 0; i <= 30; i++) { const x = W * .08 + i / 30 * W * .84, yy = H * .9 - Math.pow(i / 30, 2.2) * H * .8 * rise - Math.sin(i * 1.7) * g.s * .02; ctx[i ? 'lineTo' : 'moveTo'](x, yy + scroll * .3) }
        ctx.stroke(); ctx.shadowBlur = 0
        if (e > .35) { const fl = g.bh * (.5 + Math.random() * .3) * clamp((e - .35) * 4); const tr = ctx.createLinearGradient(0, cy, 0, cy + fl); tr.addColorStop(0, 'rgba(249,168,37,.95)'); tr.addColorStop(1, 'rgba(61,220,132,0)'); ctx.fillStyle = tr; ctx.beginPath(); ctx.moveTo(g.cx - g.bw * .45, cy); ctx.lineTo(g.cx + g.bw * .45, cy); ctx.lineTo(g.cx, cy + fl); ctx.fill() }
        ctx.save(); ctx.beginPath(); ctx.rect(0, -H * 3, W, e < .35 ? g.gy + g.s * .012 + 3 * H : H * 5); ctx.clip(); drawCandle(c, t, g.cx, cy, 1, Math.sin(e * 20) * .03, e > .35 ? 1.12 : 1, false); ctx.restore()
        ctx.strokeStyle = 'rgba(255,255,255,.25)'; ctx.lineWidth = 1.2; if (e > .4) for (let i = 0; i < 18; i++) { const x = (i * 83.7) % W, y = ((i * 41.3 + e * H * 2.5) % H); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + g.s * .12); ctx.stroke() }
        ctx.restore()
        if (e > .38 && !debris.done) { burst(c); debris.done = true; debris.forEach((d) => (d.vy -= g.s * 1.5)) }
        drawDebris(dt)
        if (e > 1.2) flash((e - 1.2) / .3)
        if (e > 1.55) finish()
      }
    }
    let last = 0
    function frame(now) {
      raf = 0; if (!alive) return
      if (!visible && phase === 'idle') return
      const { c, a } = C(); A = a; screen.dataset.reveal = c.trans === 'A' ? { A: 'flash', B: 'iris', C: 'fade' }[c.reveal] : ({ B: 'flash', F: 'flash', H: 'flash' }[c.trans] || 'iris'); screen.classList.toggle('noskip', c.skip === 'B')
      const t = now / 1000, dt = Math.min(.05, (now - (last || now)) / 1000); last = now
      if (opt.auto && phase === 'idle' && now - idleSince > 1300) go()
      if (opt.auto && phase === 'done' && now - doneAt > 1500) { reset(); }
      const g = geo(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const e = phase === 'run' ? (now - t0) / 1000 : 0
      // timeline: 0–.22 wind-up · .22–.5 slam · .5–1.25 drop into the void · 1.25–2.35 warp · then reveal
      let shake = 0
      if (phase === 'run' && c.trans === 'A' && e > .22 && e < .95) shake = (1 - clamp((e - .22) / .73)) * g.s * { A: .03, B: .012, C: .055 }[c.impact]
      ctx.save(); if (shake) ctx.translate((Math.random() - .5) * shake, (Math.random() - .5) * shake)
      if (phase === 'done') { ctx.clearRect(-50, -50, W + 100, H + 100) }
      else if (phase === 'run' && c.trans !== 'A') { ctx.clearRect(-50, -50, W + 100, H + 100); runTrans(c, t, e, dt, g) }
      else if (phase === 'idle' || e < 1.25) {
        drawBg(c, t)
        const slam = clamp((e - .22) / .28), drop = clamp((e - .5) / .75)
        drawCracks(c, t, phase === 'idle' ? 0 : ease.out(slam))
        drawRim(c, t, phase === 'idle' ? 0 : ease.io(drop))
        const blink = phase === 'idle' && (t % 3.2) < .12
        const windup = phase === 'run' ? Math.sin(clamp(e / .22) * Math.PI) : 0
        const idleBob = phase === 'idle' ? Math.sin(t * 2.2) * g.s * .004 : 0
        const y = g.gy + g.bh * .12 - windup * g.s * .03 + idleBob + ease.in(slam) * g.bh * .55 + ease.in(drop) * g.s * .25
        const squash = phase === 'idle' ? 1 + Math.sin(t * 2.2) * .015 + (wig > 0 ? Math.sin(wig * 40) * .06 : 0) : 1 - windup * .12 + (slam > 0 && slam < 1 ? .2 * Math.sin(slam * Math.PI) : 0)
        const sc = 1 - ease.in(drop) * .85, rot = ease.in(drop) * 1.4
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, g.gy + g.s * .012); if (e > .5) ctx.ellipse(g.cx, g.gy, g.bw * 1.15 + ease.io(drop) * g.s * .5, g.s * .045 + ease.io(drop) * g.s * .14, 0, 0, 7); ctx.clip()
        drawCandle(c, t, g.cx, y, sc, rot, squash, blink); ctx.restore()
        if (phase === 'idle') drawPrompt(c, t)
        if (phase === 'run') {
          if (e > .5 && !debris.done) { burst(c); debris.done = true }
          drawDebris(dt)
          if (c.impact === 'C' && e > .45 && e < 1.1) { const k = clamp((e - .45) / .2), s = g.s * .16 * (0.6 + k * .5); ctx.save(); ctx.translate(g.cx, g.gy - g.s * .28); ctx.rotate(-.15); ctx.font = `${s}px 'Lilita One', sans-serif`; ctx.textAlign = 'center'; ctx.lineWidth = Math.max(4, s * .14); ctx.lineJoin = 'round'; ctx.strokeStyle = '#0b0b0b'; ctx.globalAlpha = 1 - clamp((e - .85) / .25); ctx.strokeText('BOOM!', 0, 0); ctx.fillStyle = '#F9A825'; ctx.fillText('BOOM!', 0, 0); ctx.restore() }
          if (c.impact === 'B' && e > .45 && e < 1.05) { const k = clamp((e - .45) / .6); ctx.strokeStyle = `rgba(253,230,138,${1 - k})`; ctx.lineWidth = 4; ctx.shadowColor = '#F9A825'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.ellipse(g.cx, g.gy, k * W * .6, k * W * .14, 0, 0, 7); ctx.stroke(); ctx.shadowBlur = 0 }
          if (e > .95) drawWarp(c, clamp((e - .95) / 1.4) * .6)
        }
      } else {
        const p = clamp((e - 1.25) / 1.1); drawWarp(c, .35 + p * .65)
        if (c.reveal === 'A' && e > 2.15) { ctx.fillStyle = `rgba(255,243,196,${clamp((e - 2.15) / .2)})`; ctx.fillRect(-20, -20, W + 40, H + 40) }
        if (c.reveal === 'C' && e > 1.95) { ctx.fillStyle = `rgba(0,0,0,${clamp((e - 1.95) / .4)})`; ctx.fillRect(-20, -20, W + 40, H + 40) }
        if (c.reveal === 'B' && e > 2.0) { const k = ease.io(clamp((e - 2.0) / .6)); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(W / 2, H / 2, k * Math.hypot(W, H) * .55, 0, 7); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = '#F9A825'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2, k * Math.hypot(W, H) * .55, 0, 7); ctx.stroke() }
        const end = c.reveal === 'B' ? 2.62 : 2.35
        if (e > end) finish()
      }
      ctx.restore()
      if (wig > 0) wig -= dt
      raf = requestAnimationFrame(frame)
    }
    function finish() { if (phase === 'done') return; phase = 'done'; doneAt = performance.now(); screen.classList.add('done'); if (opt.onDone) opt.onDone() }
    function hit(ev) {
      if (opt.inCard) return
      if (phase !== 'idle') return
      const g = geo(), r = cv.getBoundingClientRect()
      if (ev && ev.detail !== 0) { const x = ev.clientX - r.left, y = ev.clientY - r.top; if (!(Math.abs(x - g.cx) < g.bw * 1.6 && y > g.gy - g.bh - g.wick - g.s * .18 && y < g.gy + g.s * .1)) { wig = .35; return } }
      go()
    }
    function go() { if (reduce && !opt.auto) { finish(); return } phase = 'run'; t0 = performance.now(); debris = []; snap = null; shards = null; blocks = null; stars.forEach((s) => (s.z = Math.random())) }
    function reset() { screen.classList.remove('done'); phase = 'idle'; idleSince = performance.now(); debris = [] }
    cv.addEventListener('click', hit)
    cv.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (phase === 'idle') go() } })
    skip.addEventListener('click', (e) => { e.stopPropagation(); finish() })
    const ro = new ResizeObserver(() => size()); ro.observe(screen)
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame) }); io.observe(screen)
    size(); raf = requestAnimationFrame(frame)
    this.replay = reset
    this.play = () => { reset(); go() }
    this.destroy = () => { alive = false; ro.disconnect(); io.disconnect(); if (raf) cancelAnimationFrame(raf) }
  }


  const CFG = { art: 'C', candle: 'A', ground: 'A', bg: 'A', prompt: 'A', trans: 'E', impact: 'A', warp: 'B', reveal: 'A', skip: 'B', when: 'B', sound: 'A' }
  const coarse = matchMedia('(pointer: coarse)').matches || innerWidth < 700
  const done = () => {
    try { localStorage.setItem('tr-intro-day', new Date().toDateString()) } catch (e) {}
    screen.classList.add('bye')
    setTimeout(() => { root.classList.remove('intro-on'); screen.remove() }, reduce ? 300 : 120)
  }
  const start = () => { const it = new Intro(screen, () => CFG, { phone: coarse, onDone: done }); const cv = screen.querySelector('canvas'); screen.style.background = 'transparent'; if (cv) cv.focus({ preventScroll: true }) }
  const fonts = document.fonts && document.fonts.load ? document.fonts.load("40px 'Lilita One'").catch(() => {}) : Promise.resolve()
  Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))]).then(start)
})()
