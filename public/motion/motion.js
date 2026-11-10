// Motion · Direction C (cinematic chapters). No library. Off for prefers-reduced-motion
// (the inline gate never sets html.m-on then). Regulars get the plain page from visit two.
(() => {
  const root = document.documentElement
  if (!root.classList.contains('m-on')) return
  root.classList.add('m-ready')
  const vh = innerHeight

  // Curtain, then the hero blurs into focus.
  const hero = () => requestAnimationFrame(() => {
    if (root.classList.contains('m-curtain')) {
      root.classList.add('m-open')
      setTimeout(() => root.classList.remove('m-curtain', 'm-open'), 1300)
      setTimeout(() => root.classList.add('m-hero'), 350)
    } else root.classList.add('m-hero')
  })
  if (root.classList.contains('intro-on')) {
    const mo = new MutationObserver(() => { if (!root.classList.contains('intro-on')) { mo.disconnect(); setTimeout(hero, 150) } })
    mo.observe(root, { attributes: true, attributeFilter: ['class'] })
  } else setTimeout(hero, 120)

  // Parallax in the hero while it is on screen.
  const home = document.getElementById('home')
  let tick = false
  const onScroll = () => {
    tick = false
    if (home && scrollY < home.offsetHeight * 1.2) home.style.setProperty('--m-y', String(Math.round(scrollY)))
    chapters()
  }
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(onScroll) } }, { passive: true })

  // Reveals.
  const legacy = '.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children'
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      io.unobserve(e.target); e.target.classList.add('m-in')
      setTimeout(() => { e.target.removeAttribute('data-m'); e.target.removeAttribute('data-mb'); e.target.style.removeProperty('--m-i') }, 1600)
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 })
  const tag = (sel, attr, skip) => document.querySelectorAll(sel).forEach((el, i) => {
    if (el.getBoundingClientRect().top < vh || el.closest(legacy) || (skip && el.closest(skip))) return
    el.setAttribute(attr, ''); el.style.setProperty('--m-i', String(i % 4)); io.observe(el)
  })
  const pinned = root.classList.contains('m-chap') ? '#how' : null
  tag('section h2.heading-lg', 'data-mb', pinned)
  tag('#republic .text-center > p, .fx-pillars > article, .fx-founder, .as-card, .yt-card, .wxA-card, .wb-cta, #exchanges .sxA2, #exchanges .tk-list > .tk, .faq-tabs, #join .container > :not(h2), .link-pill' + (pinned ? '' : ', .hwB > li'), 'data-m')

  // Chapters.
  const how = document.getElementById('how')
  const steps = how ? [...how.querySelectorAll('.hwB > li')] : []
  let rail = null
  if (pinned && how && steps.length) {
    root.classList.add('m-chap-js')
    rail = document.createElement('div'); rail.className = 'm-rail'
    rail.innerHTML = '<b>CHAPTER <span>01</span> / 0' + steps.length + '</b><i aria-hidden="true"></i><button type="button">Skip the story ↓</button>'
    how.querySelector('.hwB')?.before(rail)
    rail.querySelector('button').addEventListener('click', () => {
      try { localStorage.setItem('tr-c-visits', '9') } catch (e) {}
      document.getElementById('programs')?.scrollIntoView({ behavior: 'auto', block: 'start' })
    })
    // Keyboard users who tab into a hidden chapter get it brought forward.
    steps.forEach((li, i) => li.addEventListener('focusin', () => {
      const r = how.getBoundingClientRect(), span = how.offsetHeight - innerHeight
      scrollTo({ top: scrollY + r.top + span * ((i + 0.5) / steps.length), behavior: 'auto' })
    }))
  }
  let last = -1
  function chapters() {
    if (!rail) return
    const r = how.getBoundingClientRect(), span = how.offsetHeight - innerHeight
    const p = Math.min(1, Math.max(0, -r.top / span))
    rail.style.setProperty('--m-p', p.toFixed(3))
    const k = Math.min(steps.length - 1, Math.floor(p * steps.length))
    if (k === last) return
    last = k
    steps.forEach((li, i) => { li.classList.toggle('m-cur', i === k); li.classList.toggle('m-past', i < k) })
    rail.querySelector('span').textContent = String(k + 1).padStart(2, '0')
  }
  onScroll()
})()
