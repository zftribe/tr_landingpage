// Motion · same family as Welcome direction B. No library, one easing.
// Off for prefers-reduced-motion: the inline gate never sets html.m-on, so this returns at once.
(() => {
  const root = document.documentElement
  const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduce() || !root.classList.contains('m-on')) return
  root.classList.add('m-ready')
  const ease = (t) => 1 - Math.pow(1 - t, 3)
  const COUNT_SEL = '#resBalance, #resProfit, #resMonth, #resYear, #resRate, #calcGross, #calcTax, #calcInflation, #calcReal, #simGross, #simTaxAmt, #simInflAmt, #simReal, .fx-tiles b'

  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    if (!e.matches) return
    root.classList.remove('m-on', 'm-hero', 'm-ready')
    document.querySelectorAll('[data-m], #rates > *, .spark, .infl-spark, .sim-bar').forEach((el) => el.classList.add('m-in'))
    document.querySelectorAll('[data-m-final]').forEach((el) => { el.innerHTML = el.getAttribute('data-m-final') })
  })

  // Headline words rise out of masks. Space is reserved (padding on the mask), so no layout shift.
  const h1 = document.querySelector('.hero h1')
  if (h1 && !h1.classList.contains('m-split')) {
    const wrap = document.createElement('span')
    let i = 0
    const word = (text, cls) => {
      const w = document.createElement('span')
      w.className = 'm-w'
      w.style.setProperty('--m-i', String(i++))
      const s = document.createElement('span')
      if (cls) s.className = cls
      s.textContent = text
      w.append(s)
      return w
    }
    ;[...h1.childNodes].forEach((node) => {
      if (node.nodeType === 3) {
        node.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return
          if (/^\s+$/.test(part)) wrap.append(document.createTextNode(part))
          else wrap.append(word(part))
        })
      } else if (node.nodeType === 1) wrap.append(word(node.textContent, node.className))
    })
    h1.replaceChildren(wrap)
    h1.classList.add('m-split')
  }

  const playHero = () => requestAnimationFrame(() => {
    root.classList.add('m-hero')
    setTimeout(() => root.classList.add('m-glow-live'), 2400)
    setTimeout(onStats, 450)
  })
  playHero()

  // Slight parallax on the glow only (transform via --m-par). Capped so it stays subtle.
  let queued = false
  const shift = () => {
    queued = false
    const y = Math.min(28, Math.max(0, scrollY * 0.08))
    const hero = document.querySelector('.hero')
    if (hero) hero.style.setProperty('--m-par', y + 'px')
  }
  addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(shift) } }, { passive: true })

  function usable(el) {
    const t = (el && el.textContent) || ''
    return t && t !== '—' && !/not available/i.test(t) && /-?[\d,]+(?:\.\d+)?/.test(t)
  }

  // Lock width first, tween, and always finish on the exact original string — never a rounded stand-in.
  function countEl(el, ms) {
    if (!el || reduce() || !root.classList.contains('m-on')) return
    const final = el.getAttribute('data-m-final')
    if (final == null || !usable({ textContent: final.replace(/<[^>]+>/g, '') })) { if (final != null) el.innerHTML = final; return }
    const probe = document.createElement('span')
    probe.innerHTML = final
    const text = probe.textContent
    const m = text.match(/-?[\d,]+(?:\.\d+)?/)
    if (!m) { el.innerHTML = final; return }
    const to = Number(m[0].replace(/,/g, ''))
    if (!isFinite(to)) { el.innerHTML = final; return }
    const dec = (m[0].replace(/,/g, '').split('.')[1] || '').length
    const pre = text.slice(0, m.index)
    const post = text.slice(m.index + m[0].length)
    const from = el._mVal != null && isFinite(el._mVal) ? el._mVal : 0
    el.style.minWidth = Math.ceil(el.getBoundingClientRect().width) + 'px'
    const dur = ms || (from === 0 ? 1400 : 700)
    const t0 = performance.now()
    const gen = (el._mGen = (el._mGen || 0) + 1)
    el._mAnimating = true
    const fmt = (n) => dec ? n.toFixed(dec) : Math.round(n).toLocaleString('en-PH')
    const step = (now) => {
      if (el._mGen !== gen) return
      const p = Math.min(1, (now - t0) / dur)
      if (p >= 1) { el._mVal = to; el._mAnimating = false; el.innerHTML = final; return }
      el._mVal = from + (to - from) * ease(p)
      el.textContent = pre + fmt(el._mVal) + post
      requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }

  function playCount(el) {
    if (!el || !usable(el)) return
    if (el.getAttribute('data-m-final') == null) el.setAttribute('data-m-final', el.innerHTML)
    if (el._mSeen) return
    el._mSeen = true
    countEl(el, 1400)
  }

  function updateCount(el) {
    if (!el || el._mAnimating || !usable(el)) return
    const final = el.innerHTML
    if (el.getAttribute('data-m-final') === final) return
    el.setAttribute('data-m-final', final)
    if (el._mSeen) { el.innerHTML = final; el._mVal = null; return } // later updates snap to the exact figure
    const r = el.getBoundingClientRect()
    if (r.top < innerHeight * 0.92 && r.bottom > 0) playCount(el)
    else io.observe(el)
  }

  let lastStats = ''
  function onStats() {
    const row = document.getElementById('statsRow')
    if (!row) return
    const items = [...row.querySelectorAll('.stat-value')]
    if (items.some((el) => el._mAnimating)) return
    const sig = items.map((el) => el.innerHTML).join('|')
    if (!sig || sig === lastStats) { items.forEach((el) => { el._mSeen = true; if (!el.getAttribute('data-m-final')) el.setAttribute('data-m-final', el.innerHTML) }); return }
    lastStats = sig
    items.forEach((el) => {
      el.setAttribute('data-m-final', el.innerHTML)
      el._mSeen = false
      el._mVal = 0
      playCount(el)
    })
  }

  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue
      const el = e.target
      // Don't unobserve count targets that still show a placeholder — wait for real figures.
      if ((el.matches(COUNT_SEL) || el.classList.contains('stat-value')) && !usable(el)) continue
      io.unobserve(el)
      el.classList.add('m-in')
      afterIn(el)
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 })

  function afterIn(el) {
    if (el.matches('.stat-value') || el.matches(COUNT_SEL)) playCount(el)
    el.querySelectorAll(COUNT_SEL).forEach(playCount)
    el.querySelectorAll('.spark, .infl-spark').forEach((s) => s.classList.add('m-in'))
    if (el.id === 'simBar' || el.classList.contains('sim-bar')) el.classList.add('m-in')
  }

  function landInView(el) {
    if (!el) return
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) { io.observe(el); return }
    if (r.top < innerHeight * 0.92 && r.bottom > 0) requestAnimationFrame(() => { el.classList.add('m-in'); afterIn(el) })
    else io.observe(el)
  }

  function tag(el, i) {
    if (!el || el.hasAttribute('data-m')) return
    el.setAttribute('data-m', '')
    el.style.setProperty('--m-i', String(i % 4))
    landInView(el)
  }

  function armStatic() {
    [
      document.getElementById('controls'),
      ...document.querySelectorAll('.sec-head, #filters, #tree, #treeResult, .calc-panel, .fx-card, .sim-explain, .sim-box, .next-card, .method-fold, #jrCard, .footer-brand, .footnotes, .legal')
    ].forEach((el, i) => tag(el, i))
    document.querySelectorAll('.infl-spark, .spark').forEach(landInView)
    landInView(document.getElementById('simBar'))
    document.querySelectorAll(COUNT_SEL).forEach((el) => { if (!el._mSeen) io.observe(el) })
  }
  armStatic()

  function armRates() {
    const box = document.getElementById('rates')
    if (!box) return
    const items = [...box.children].filter((el) => el.matches('.est-note, .rgroup-title, .rgroup-note, .rate-columns, .prov-card, .no-picks'))
    items.forEach((el, i) => {
      el.style.setProperty('--m-i', String(Math.min(i, 8)))
      el.classList.remove('m-in')
    })
    requestAnimationFrame(() => items.forEach(landInView))
    box.querySelectorAll('.spark').forEach(landInView)
  }

  function syncDefi() {
    const el = document.getElementById('defiStatus')
    if (el) el.classList.toggle('m-loading', /^\s*Loading/i.test(el.textContent || ''))
  }

  const mo = new MutationObserver((muts) => {
    let stats = false, rates = false, defi = false
    for (const m of muts) {
      if (m.target.id === 'statsRow' || (m.target.closest && m.target.closest('#statsRow'))) stats = true
      if (m.target.id === 'rates') rates = true
      if (m.target.id === 'defiStatus') defi = true
      if (m.target.id === 'simBar') { if (!m.target.classList.contains('m-in')) landInView(m.target) }
      if (m.target.id === 'fxOut' || m.target.id === 'simChart' || m.target.id === 'cmpBody' || m.target.id === 'inflPanel') {
        m.target.querySelectorAll('.infl-spark, .spark').forEach(landInView)
        m.target.querySelectorAll(COUNT_SEL).forEach((el) => { if (!el._mSeen) io.observe(el); else updateCount(el); playCount(el) })
        if (m.target.id === 'cmpBody') [...m.target.querySelectorAll(':scope > *')].forEach((el, i) => tag(el, i))
      }
    }
    if (stats) onStats()
    if (rates) armRates()
    if (defi) syncDefi()
    document.querySelectorAll(COUNT_SEL).forEach(updateCount)
  })
  const watch = (sel, opts) => { const el = document.querySelector(sel); if (el) mo.observe(el, opts || { childList: true, subtree: true, characterData: true }) }
  watch('#statsRow', { childList: true })
  watch('#rates', { childList: true })
  watch('#simBar')
  watch('#defiStatus', { childList: true, characterData: true, subtree: true })
  watch('#fxOut')
  watch('#simChart')
  watch('#cmpBody')
  watch('#inflPanel')
  watch('#calculator', { childList: true, subtree: true, characterData: true })
  watch('#inflation-check', { childList: true, subtree: true, characterData: true })
  armRates()
  syncDefi()
})()
