// Motion · Direction B (georgeasibal.com family). No library, about 3 KB, one easing.
// Off for prefers-reduced-motion: the inline gate never sets html.m-on, so this returns at once.
(() => {
  const root = document.documentElement
  if (!root.classList.contains('m-on')) return
  root.classList.add('m-ready')
  const vh = innerHeight

  // Member mosaic behind the hero (34 member avatars, repeated). Absolutely placed, so no layout shift.
  const home = document.getElementById('home')
  if (home) {
    const wrap = document.createElement('div'), drift = document.createElement('div'), grid = document.createElement('div')
    wrap.className = 'm-mosaic'; wrap.setAttribute('aria-hidden', 'true'); drift.className = 'm-mosaic-drift'; grid.className = 'm-mosaic-grid'
    const n = Math.ceil((home.offsetWidth / 64) * (home.offsetHeight / 64) * 1.25)
    for (let i = 0; i < Math.min(n, 320); i++) {
      const t = document.createElement('i')
      t.style.backgroundImage = `url(/students/s${String((i * 7) % 34 + 1).padStart(2, '0')}.webp)`
      grid.appendChild(t)
    }
    drift.appendChild(grid); wrap.appendChild(drift)
    home.prepend(wrap)
  }

  // Count-up for the hero numbers and the TR Score rings. Width is fixed first, so nothing moves.
  const ease = (t) => 1 - Math.pow(1 - t, 3)
  const countUp = (el, to, dec, fmt, ms = 1400, ring) => {
    el.style.minWidth = el.getBoundingClientRect().width + 'px'
    const t0 = performance.now()
    const step = (now) => {
      const p = Math.min(1, (now - t0) / ms), v = to * ease(p)
      el.firstChild.nodeValue = fmt(v.toFixed(dec))
      if (ring) ring.style.setProperty('--v', String(Math.round(ring.dataset.v * ease(p))))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }
  const heroNums = () => document.querySelectorAll('#home .fx-proof b').forEach((b) => {
    const m = b.textContent.match(/^([\d,]+)(\+?)$/)
    if (!m) return
    const to = Number(m[1].replace(/,/g, '')), plus = m[2]
    countUp(b, to, 0, (v) => Number(v).toLocaleString('en-US') + plus, 1600)
  })

  // Hero: plays once the candle intro (if any) has drained away.
  const hero = () => requestAnimationFrame(() => { root.classList.add('m-hero'); setTimeout(heroNums, 450) })
  if (root.classList.contains('intro-on')) {
    const mo = new MutationObserver(() => { if (!root.classList.contains('intro-on')) { mo.disconnect(); setTimeout(hero, 150) } })
    mo.observe(root, { attributes: true, attributeFilter: ['class'] })
  } else hero()

  const legacy = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children'
  const below = (el) => el.getBoundingClientRect().top >= vh && !el.closest(legacy)
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      const el = e.target
      io.unobserve(el)
      el.classList.add('m-in')
      afterIn(el)
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 })
  function afterIn(el) {
      if (el.matches('.tk')) { const r = el.querySelector('.ring'), s = r?.querySelector('span'); if (r && s) { const to = parseFloat(s.firstChild.nodeValue); r.dataset.v = r.style.getPropertyValue('--v'); countUp(s, to, 1, (v) => v, 1200, r) } }
      setTimeout(() => { el.removeAttribute('data-m'); el.removeAttribute('data-mw'); el.style.removeProperty('--m-i') }, 1900)
  }
  // Wiping cards start fully clipped, which IntersectionObserver reads as zero area, so they are
  // watched by position instead (page scroll and the sideways rails).
  const pending = new Set()
  const land = (el) => { pending.delete(el); el.classList.add('m-in'); afterIn(el) }
  let queued = false
  const check = () => {
    queued = false
    for (const el of pending) {
      const r = el.getBoundingClientRect()
      if (r.top < innerHeight * 0.92 && r.bottom > 0 && r.left < innerWidth && r.right > 0 && r.width > 0) land(el)
    }
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(check) } }, { passive: true, capture: true })
  addEventListener('resize', check)
  const tag = (sel, attr) => document.querySelectorAll(sel).forEach((el, i) => {
    if (!below(el) || el.hasAttribute('data-m') || el.hasAttribute('data-mw')) return
    el.setAttribute(attr, ''); el.style.setProperty('--m-i', String(i % 4))
    if (attr === 'data-mw') pending.add(el); else io.observe(el)
  })

  // Section headings rise out of a mask.
  document.querySelectorAll('section h2.heading-lg').forEach((h) => {
    if (!below(h)) return
    const line = document.createElement('span'); line.className = 'm-line'
    while (h.firstChild) line.appendChild(h.firstChild)
    h.appendChild(line); h.classList.add('m-mask'); io.observe(h)
  })
  tag('#republic .text-center > p, #how .text-center > p, #webinars .text-center > p, #youtube .text-center > p, .fx-founder, .hw-cta, .wb-cta, .faq-tabs, #join .container > :not(h2), #students .rv-score, .link-pill', 'data-m')
  tag('.fx-pillars > article, .hwB > li, .as-card, .yt-card, .wxA-card, #exchanges .sxA2, #exchanges .tk-list > .tk', 'data-mw')
  // Exchange tickets that start hidden behind "See all 6" count up when opened.
  document.querySelectorAll('#tk-more .tk').forEach((el) => { if (!el.hasAttribute('data-mw')) { el.setAttribute('data-mw', ''); pending.add(el) } })
  document.querySelector('.tk-morebtn')?.addEventListener('click', () => setTimeout(check, 50))
  check()

  // Republic line: words light up as the paragraph moves up through the screen.
  const para = document.querySelector('#republic .text-center > p')
  if (para) {
    para.classList.add('m-read')
    const words = para.textContent.trim().split(/\s+/)
    para.textContent = ''
    const spans = words.map((w, i) => { const s = document.createElement('span'); s.className = 'm-word'; s.textContent = w; para.append(s); if (i < words.length - 1) para.append(' '); return s })
    let ticking = false
    const light = () => {
      ticking = false
      const r = para.getBoundingClientRect(), p = Math.min(1, Math.max(0, (innerHeight * 0.88 - r.top) / (innerHeight * 0.45)))
      const k = Math.round(p * spans.length)
      spans.forEach((s, i) => s.classList.toggle('lit', i < k))
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(light) } }, { passive: true })
    light()
  }
})()
