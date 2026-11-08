// ── WEBINAR CAROUSEL ──
  let currentSlide = 0;
  const totalSlides = 5;
  const track = document.getElementById('webinarCarousel');
  const dots = document.querySelectorAll('#carouselDots .carousel-dot');

  function goToSlide(n) {
    if (!track) return; // the slideshow was replaced by the weekly-sessions cards (8 Nov)
    currentSlide = n;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === currentSlide));
  }

  function moveCarousel(dir) {
    goToSlide((currentSlide + dir + totalSlides) % totalSlides);
  }

  // Auto-advance every 6 seconds, unless the visitor prefers less motion or pressed Pause.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let carouselTimer = null, carouselPaused = reduceMotion;
  const startCarousel = () => { clearInterval(carouselTimer); if (!carouselPaused) carouselTimer = setInterval(() => moveCarousel(1), 6000); };
  const pauseBtn = document.querySelector('.carousel-pause');
  const syncPause = () => { if (!pauseBtn) return; pauseBtn.setAttribute('aria-pressed', String(carouselPaused)); pauseBtn.setAttribute('aria-label', carouselPaused ? 'Play slideshow' : 'Pause slideshow'); pauseBtn.textContent = carouselPaused ? '▶' : '❚❚'; };
  pauseBtn?.addEventListener('click', () => { carouselPaused = !carouselPaused; syncPause(); startCarousel(); });
  syncPause(); startCarousel();
  const carouselWrap = document.querySelector('.carousel-wrap');
  if (carouselWrap) {
    carouselWrap.addEventListener('mouseenter', () => clearInterval(carouselTimer));
    carouselWrap.addEventListener('mouseleave', startCarousel);
  }

  // ── SCROLL REVEAL (all reveal types) ──
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children').forEach(el => revealObs.observe(el));

  // Fallback
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible), .reveal-left:not(.visible), .reveal-right:not(.visible), .reveal-scale:not(.visible), .stagger-children:not(.visible)')
      .forEach(el => el.classList.add('visible'));
  }, 3000);

  // ── SCROLL PROGRESS BAR ──
  const progressBar = document.getElementById('scrollProgress');
  window.addEventListener('scroll', () => {
    const h = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (scrollY / h * 100) + '%';
  }, { passive: true });

  // ── NAV SCROLL STATE ──
  const nav = document.querySelector('.nav');
  const sects = document.querySelectorAll('section[id]');
  const navAs = document.querySelectorAll('.nav-menu a');

  window.addEventListener('scroll', () => {
    // Compact nav
    nav.classList.toggle('scrolled', scrollY > 60);

    // Active link highlight
    let cur = '';
    sects.forEach(s => { if (scrollY >= s.offsetTop - 120) cur = s.id; });
    navAs.forEach(a => a.style.color = a.getAttribute('href') === '#' + cur ? 'var(--white)' : '');
  }, { passive: true });

  // ── 3D TILT ON HOVER ──
  document.querySelectorAll('.tilt-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)`;
      card.style.boxShadow = `${-x * 20}px ${y * 20}px 40px rgba(0,0,0,0.3), 0 0 20px rgba(249,168,37,0.05)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.boxShadow = '';
    });
  });

  // ── PARALLAX ON SCROLL (feature visuals) ──
  const parallaxEls = document.querySelectorAll('.feature-visual');
  window.addEventListener('scroll', () => {
    parallaxEls.forEach(el => {
      const rect = el.getBoundingClientRect();
      const speed = 0.04;
      const y = (rect.top - window.innerHeight / 2) * speed;
      el.style.transform = `translateY(${y}px)`;
    });
  }, { passive: true });

  // ── ANIMATED COUNTERS ──
  const counterObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseFloat(el.dataset.target);
        const suffix = el.dataset.suffix || '';
        const prefix = el.dataset.prefix || '';
        const duration = 1500;
        const start = performance.now();
        const animate = (now) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
          const current = Math.floor(eased * target);
          el.textContent = prefix + current.toLocaleString() + suffix;
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
        counterObs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.counter').forEach(el => counterObs.observe(el));

  // ── SMOOTH HOVER LIFT ON ALL CARDS ──
  document.querySelectorAll('.program-card, .value-card, .drive-card, .support-card, .link-pill, .module-chip, .tier-row').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.35s cubic-bezier(0.16,1,0.3,1), border-color 0.35s, box-shadow 0.35s';
    });
  });

// Trusted partners: static, readable cards without JS; with JS the two rows drift
// (paused on hover or keyboard focus, still for visitors who turn motion off).
const partnerStrip = document.querySelector('.partners-strip');
if (partnerStrip) partnerStrip.dataset.motion = 'ready';

// Hero video: show the thumbnail first, load the YouTube player only on tap.
document.querySelectorAll('.fx-yt[data-yt]').forEach((btn) => {
  btn.addEventListener('click', () => {
    const f = document.createElement('iframe');
    f.src = `https://www.youtube.com/embed/${btn.dataset.yt}?autoplay=1`;
    f.title = btn.getAttribute('aria-label') || 'Video';
    f.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
    f.allowFullscreen = true;
    btn.replaceWith(f);
  }, { once: true });
});

// Tell screen readers whether the FAQ answers and the phone menu are open (the inline handlers toggle the classes first).
document.addEventListener('click', (e) => {
  const q = e.target.closest('.faq-q');
  if (q) q.setAttribute('aria-expanded', String(q.parentElement.classList.contains('open')));
  const menu = document.querySelector('.mobile-menu');
  const toggle = document.querySelector('.mobile-toggle');
  if (menu && toggle) toggle.setAttribute('aria-expanded', String(menu.classList.contains('open')));
});

// Exchange tickets: "Tear & claim" copies the referral code, tears the coupon stub off with a small gold pop,
// and the link itself opens the sign-up in a new tab (a real link, so it still works without this script).
document.addEventListener('click', (e) => {
  const claim = e.target.closest('.tk-claim');
  if (!claim) return;
  const tk = claim.closest('.tk'), code = claim.dataset.code;
  const msg = tk?.querySelector('.tk-msg');
  const copied = navigator.clipboard?.writeText ? navigator.clipboard.writeText(code) : Promise.reject(new Error('no clipboard'));
  copied.then(() => { if (msg) msg.textContent = 'Code ' + code + ' copied'; })
    .catch(() => { if (msg) msg.textContent = 'Use code ' + code + ' when you sign up'; });
  if (!tk) return;
  tk.classList.add('torn');
  // The torn stub leaves the tab order and the accessibility tree; focus moves to "Open it again".
  const stub = tk.querySelector('.tk-stub');
  stub?.setAttribute('aria-hidden', 'true');
  claim.setAttribute('tabindex', '-1');
  const again = tk.querySelector('.tk-claimed a');
  setTimeout(() => again?.focus({ preventScroll: true }), 50);
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = claim.getBoundingClientRect(), b = document.createElement('div');
  b.className = 'tk-burst'; b.style.left = (r.left + r.width / 2) + 'px'; b.style.top = r.top + 'px';
  const colours = ['#FFD36A', '#F9A825', '#fff3c4', '#3fcf80'];
  for (let i = 0; i < 18; i++) {
    const a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 60, s = document.createElement('i');
    s.style.cssText = '--x:' + Math.cos(a) * d + 'px;--y:' + (Math.sin(a) * d - 20) + 'px;--r:' + Math.random() * 360 + 'deg;background:' + colours[i % 4];
    b.appendChild(s);
  }
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 1000);
});

// Exchanges: the first four tickets show; the button opens the rest. Without this script all of them stay visible.
(() => {
  const more = document.getElementById('tk-more'), btn = document.querySelector('.tk-morebtn');
  if (!more || !btn) return;
  const n = more.querySelectorAll('.tk').length, label = 'See ' + n + ' more exchanges ▾';
  more.hidden = true; btn.hidden = false;
  btn.addEventListener('click', () => {
    const open = more.hidden;
    more.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Show fewer ▴' : label;
    if (open) more.querySelector('.tk-title h3')?.closest('.tk')?.scrollIntoView({ block: 'nearest' });
    else document.getElementById('exchanges')?.querySelector('.tk-list')?.scrollIntoView({ block: 'start' });
  });
})();

// Free on YouTube: arrows page the playlist row on web (swipe works on its own); each arrow hides at its end.
(() => {
  const rail = document.querySelector('.yt-rail'), prev = document.querySelector('.yt-prev'), next = document.querySelector('.yt-next');
  if (!rail || !prev || !next) return;
  const step = (d) => rail.scrollBy({ left: d * rail.clientWidth * 0.8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  const sync = () => { prev.hidden = rail.scrollLeft < 8; next.hidden = rail.scrollLeft + rail.clientWidth > rail.scrollWidth - 8; };
  prev.addEventListener('click', () => step(-1)); next.addEventListener('click', () => step(1));
  rail.addEventListener('scroll', sync, { passive: true }); addEventListener('resize', sync); sync();
})();

// Membership: leadership and lifetime tiers open with one button. Without this script they all stay visible.
(() => {
  const more = document.getElementById('tier-more'), btn = document.querySelector('.tier-morebtn');
  if (!more || !btn) return;
  const label = btn.textContent;
  more.hidden = true; btn.hidden = false;
  btn.addEventListener('click', () => {
    const open = more.hidden;
    more.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Show fewer ▴' : label;
  });
})();

// TR Score: How we score opens a panel under the seal header (closed by default; open without this script).
(() => { const b = document.querySelector('.sxA2-pill'), p = document.getElementById('sx-how-panel'); if (!b || !p) return;
  p.hidden = true; b.hidden = false;
  b.addEventListener('click', () => { const o = p.hidden; p.hidden = !o; b.setAttribute('aria-expanded', String(o)); }); })();

// FAQ topic tabs: one topic shows at a time (all are in the page).
(() => { document.querySelectorAll('.faq-tab').forEach((t) => t.addEventListener('click', () => { document.querySelectorAll('.faq-tab').forEach((x) => { const on = x === t; x.setAttribute('aria-selected', String(on)); document.getElementById(x.getAttribute('aria-controls')).hidden = !on; }); })); })();
