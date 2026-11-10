'use client'

import { useEffect, useRef, useState } from 'react'
import { peso, type Product } from '@/lib/lineup'
import type { CurriculumCourse } from '@/lib/lms'
import { CurriculumDialog } from './CurriculumDialog'
import { Panel } from './Panel'

type Item = Product & { checkout: string; promo: string | null }

/** A card that is not an LMS package: the free Blueprint course, The Eternals, Pathfinders. */
export type ExtraCard = {
  key: string
  tag: string
  name: string
  price: string
  priceNote?: string
  lines: string[]
  logos: Logo[]
  cta: { label: string; href: string; external?: boolean }
  free?: boolean
}

/** Program marks. `src` is a file in public/logos/programs; `text` is a stand-in until a logo exists. */
export type Logo = { alt: string; src?: string; text?: string; coin?: string }

const MAX_COMPARE = 3
const L = {
  ti: { alt: 'Technical Intensive', src: '/logos/programs/technical-intensive.png' },
  // George picked the classic W3 coin (C1, 8 Nov); drawn in CSS so it uses the site's own font.
  web3: { alt: 'WEB3 Masterclass', coin: 'W3' },
  // "Range bins" mark, A1 Classic (George picked 9 Nov): liquidity bins inside a price range.
  lp: { alt: 'Liquidity Provider Masterclass', src: '/logos/programs/lp-masterclass.svg' },
  // TR rank set "Market candles" (George picked O1, 8 Nov). Source files: Dropbox ZFT Agent Pack/Logos/TR Ranks.
  citizen: { alt: 'Citizen membership', src: '/logos/programs/citizen.svg' },
} satisfies Record<string, Logo>

const logosOf = (p: Product): Logo[] => [
  ...(p.hasTI ? [L.ti] : []),
  ...(p.hasWeb3 ? [L.web3] : p.hasLP && !p.hasTI ? [L.lp] : []),
  ...(p.months ? [L.citizen] : []),
]

function Badges({ logos }: { logos: Logo[] }) {
  return (
    <div className="pc-logos" aria-hidden="true">
      {logos.map((l) =>
        l.src ? (
          <span key={l.alt} className="pc-logo"><img src={l.src} alt="" width="40" height="40" loading="lazy" decoding="async" /></span>
        ) : l.coin ? (
          <span key={l.alt} className="pc-logo"><span className="pc-coin">{l.coin}</span></span>
        ) : (
          <span key={l.alt} className="pc-logo pc-logo-text">{l.text}</span>
        ),
      )}
    </div>
  )
}

export function ProductRail({ products, curriculum, before = [], after = [] }: {
  products: Item[]
  curriculum: CurriculumCourse[]
  before?: ExtraCard[]
  after?: ExtraCard[]
}) {
  const [picked, setPicked] = useState<string[]>([])
  const [reading, setReading] = useState<Item | null>(null)
  const [watching, setWatching] = useState<Item | null>(null)
  const [notice, setNotice] = useState('')
  const rail = useRef<HTMLDivElement>(null)
  const coursesOf = (p: Item) =>
    p.courseIds.map((id) => curriculum.find((c) => c.id === id)).filter((c): c is CurriculumCourse => !!c)

  const toggle = (id: string) => {
    setNotice('')
    setPicked((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id)
      if (cur.length >= MAX_COMPARE) {
        setNotice(`Compare up to ${MAX_COMPARE} at a time — remove one first.`)
        return cur
      }
      return [...cur, id]
    })
  }

  /** Move the carousel by about one screen of cards. */
  const page = (dir: 1 | -1) => {
    const el = rail.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: reduce ? 'auto' : 'smooth' })
  }

  // Phone page dots: which card the rail is resting on.
  const [at, setAt] = useState(0)
  useEffect(() => {
    const el = rail.current
    if (!el) return
    const sync = () => {
      const first = el.querySelector<HTMLElement>('.pc-card')
      const step = first ? first.offsetWidth + 14 : el.clientWidth
      setAt(Math.round(el.scrollLeft / step))
    }
    el.addEventListener('scroll', sync, { passive: true })
    return () => el.removeEventListener('scroll', sync)
  }, [])

  const compared = picked.map((id) => products.find((p) => p.id === id)!).filter(Boolean)
  const total = before.length + products.length + after.length

  const extra = (c: ExtraCard) => (
    <article key={c.key} id={`card-${c.key}`} className={`pc-card${c.free ? ' pc-free' : ''}`} role="listitem">
      <div className="pc-top">
        <Badges logos={c.logos} />
        <div className="program-tag">{c.tag}</div>
      </div>
      <h3 className="pc-name">{c.name}</h3>
      <div className="program-price pc-price">
        <span className="now">{c.price}</span>
        {c.priceNote && <span className="pc-price-note">{c.priceNote}</span>}
      </div>
      <ul className="pc-includes">
        {c.lines.map((l) => <li key={l}>{l}</li>)}
      </ul>
      <div className="pc-actions">
        <a
          href={c.cta.href}
          className={`btn ${c.free ? 'btn-gold' : 'btn-outline'}`}
          {...(c.cta.external ? { target: '_blank', rel: 'noopener' } : {})}
        >
          {c.cta.label}
        </a>
      </div>
    </article>
  )

  return (
    <div className="pc">
      <div className="pc-bar">
        <p className="pc-hint">
          Start free with the Blueprint. Go deeper when you&apos;re ready.{' '}
          <span className="pc-hint-sub">Tap Compare on up to three.</span>
        </p>
        <div className="pc-arrows">
          <button type="button" className="carousel-btn" onClick={() => page(-1)} aria-label="Previous programs">&#8592;</button>
          <button type="button" className="carousel-btn" onClick={() => page(1)} aria-label="More programs">&#8594;</button>
        </div>
      </div>

      <div
        className="pc-rail"
        role="list"
        aria-label="Programs"
        ref={rail}
        // Keyboard users: bring the whole card holding the focused button into view (snapping is paused while focus is inside).
        onFocus={(e) => (e.target as HTMLElement).closest('.pc-card')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })}
      >
        {before.map(extra)}
        {products.map((p) => {
          const on = picked.includes(p.id)
          const courses = coursesOf(p)
          return (
            <article key={p.id} id={`product-${p.id}`} className={`pc-card${on ? ' pc-on' : ''}`} role="listitem">
              <div className="pc-top">
                <Badges logos={logosOf(p)} />
                <div className="program-tag">{p.tag}</div>
              </div>
              <h3 className="pc-name">{p.name}</h3>

              <div className="program-price pc-price">
                <span className="now">{peso(p.price)}</span>
                {p.discount > 0 && (
                  <>
                    <span className="was">{peso(p.subtotal)}</span>
                    <span className="save">Save {peso(p.discount)}</span>
                  </>
                )}
              </div>

              <ul className="pc-includes">
                {/* A single course already names itself in the title, so its card says what you get instead. */}
                {p.hasLP && !p.hasWeb3 && !p.hasTI ? (
                  <>
                    <li>Liquidity Provider Masterclass course</li>
                    <li>Market Makers role in Discord (yours for life)</li>
                  </>
                ) : !p.months && p.hasTI !== p.hasWeb3 ? (
                  <li>Full recorded course, yours to keep</li>
                ) : (
                  <>
                    {p.hasTI && <li>Technical Intensive course</li>}
                    {p.hasWeb3 && <li>WEB3 Masterclass course</li>}
                  </>
                )}
                {p.months && <li>{p.months} months as a Citizen: live sessions, support groups, every channel</li>}
                {p.hasWeb3 && <li className="pc-incl-note">Includes the Liquidity Provider Masterclass</li>}
              </ul>

              {/* George, 8 Nov: Curriculum and Watch intro sit as pills above Buy now / Compare. */}
              {(p.promo || courses.length > 0) && (
                <div className="pc-links">
                  {p.promo && (
                    <button type="button" className="pc-curriculum" aria-haspopup="dialog" onClick={() => setWatching(p)}>▶ Watch intro</button>
                  )}
                  {courses.length > 0 && (
                    <button type="button" className="pc-curriculum" aria-haspopup="dialog" onClick={() => setReading(p)}>Curriculum</button>
                  )}
                </div>
              )}
              <div className="pc-actions">
                {p.placeholder
                  ? <span className="btn btn-gold pc-soon" aria-disabled="true">Coming soon</span>
                  : <a href={p.checkout} className="btn btn-gold">Buy now</a>}
                <button type="button" className="btn btn-outline pc-compare" aria-pressed={on} onClick={() => toggle(p.id)}>
                  {on ? '✓ Comparing' : 'Compare'}
                </button>
              </div>
            </article>
          )
        })}
        {after.map(extra)}
      </div>
      <div className="pc-dots" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => <i key={i} className={i === Math.min(at, total - 1) ? 'on' : undefined} />)}
      </div>

      <p className="pc-notice" role="status">{notice}</p>

      {watching?.promo && (
        <Panel eyebrow="Intro" title={watching.name} onClose={() => setWatching(null)}>
          <div className="pv">
            {/* Loaded only once opened, so the page makes no YouTube request for it before then. */}
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(watching.promo)}?autoplay=1&rel=0&playsinline=1`}
              title={`${watching.name} — intro video`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </Panel>
      )}

      {reading && <CurriculumDialog name={reading.name} courses={coursesOf(reading)} onClose={() => setReading(null)} />}

      {compared.length >= 2 && (
        <div className="pc-table-wrap" aria-label="Comparison">
          <table className="pc-table">
            <thead>
              <tr>
                <th scope="col"><span className="pc-sr">Feature</span></th>
                {compared.map((p) => <th key={p.id} scope="col">{p.name}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr><th scope="row">Technical Intensive</th>{compared.map((p) => <td key={p.id}>{p.hasTI ? '✓' : '—'}</td>)}</tr>
              <tr><th scope="row">WEB3 Masterclass</th>{compared.map((p) => <td key={p.id}>{p.hasWeb3 ? '✓' : '—'}</td>)}</tr>
              <tr><th scope="row">Liquidity Provider Masterclass</th>{compared.map((p) => <td key={p.id}>{p.hasLP ? '✓' : '—'}</td>)}</tr>
              <tr><th scope="row">Membership</th>{compared.map((p) => <td key={p.id}>{p.months ? `${p.months} months` : '—'}</td>)}</tr>
              <tr><th scope="row">Price</th>{compared.map((p) => <td key={p.id} className="pc-strong">{peso(p.price)}</td>)}</tr>
              <tr><th scope="row">You save</th>{compared.map((p) => <td key={p.id}>{p.discount > 0 ? peso(p.discount) : '—'}</td>)}</tr>
              <tr><th scope="row"><span className="pc-sr">Buy</span></th>{compared.map((p) => <td key={p.id}><a href={p.checkout} className="btn btn-gold pc-small">Buy →</a></td>)}</tr>
            </tbody>
          </table>
          <button type="button" className="pc-clear" onClick={() => setPicked([])}>Clear comparison</button>
        </div>
      )}
    </div>
  )
}
