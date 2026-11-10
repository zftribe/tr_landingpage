// Motion · Direction A (subtle polish). No library; one easing. Off for prefers-reduced-motion
// (the page's inline gate never sets html.m-on then, and this file returns straight away).
(() => {
  const root = document.documentElement
  if (!root.classList.contains('m-on')) return
  root.classList.add('m-ready')

  // Hero: plays once the candle intro (if any) has drained away.
  const hero = () => requestAnimationFrame(() => root.classList.add('m-hero'))
  if (root.classList.contains('intro-on')) {
    const mo = new MutationObserver(() => { if (!root.classList.contains('intro-on')) { mo.disconnect(); setTimeout(hero, 150) } })
    mo.observe(root, { attributes: true, attributeFilter: ['class'] })
  } else hero()

  // Sections and cards: stagger up as they arrive. Anything already on screen is left alone.
  const groups = [
    '#republic .text-center > *', '.fx-pillars > article', '.fx-founder',
    '#how .text-center > *', '.hwB > li', '.hw-cta',
    '#programs .text-center > *', '.as-card',
    '#students .rv-head > *',
    '#youtube .text-center > *', '.yt-card', '#webinars .text-center > *', '.wxA-card', '.wb-cta',
    '#membership .text-center > *', '#exchanges .sxA2, #exchanges .tk-list > .tk',
    '#faq .text-center > *', '.faq-tabs', '#join .container > *', '.link-pill',
  ]
  const vh = innerHeight
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      const el = e.target
      io.unobserve(el)
      el.classList.add('m-in')
      // Hand the element back to its own hover transitions once it has landed.
      setTimeout(() => { el.removeAttribute('data-m'); el.classList.remove('m-in'); el.style.removeProperty('--m-i') }, 1400)
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 })
  for (const sel of groups) {
    const els = [...document.querySelectorAll(sel)]
    els.forEach((el, i) => {
      // Skip anything already on screen, and the old site's own reveal classes (legacy.js animates those).
      if (el.hasAttribute('data-m') || el.getBoundingClientRect().top < vh || el.closest('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children')) return
      el.setAttribute('data-m', '')
      el.style.setProperty('--m-i', String(Math.min(i, 6)))
      io.observe(el)
    })
  }
})()
