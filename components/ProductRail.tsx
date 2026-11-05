'use client'

import { useState } from 'react'
import { peso, type Product } from '@/lib/lineup'
import type { CurriculumCourse } from '@/lib/lms'
import { CurriculumDialog } from './CurriculumDialog'
import { Panel } from './Panel'

type Item = Product & { checkout: string; promo: string | null }

const MAX_COMPARE = 3

export function ProductRail({ products, curriculum }: { products: Item[]; curriculum: CurriculumCourse[] }) {
  const [picked, setPicked] = useState<string[]>([])
  const [reading, setReading] = useState<Item | null>(null)
  const [watching, setWatching] = useState<Item | null>(null)
  const coursesOf = (p: Item) =>
    p.courseIds.map((id) => curriculum.find((c) => c.id === id)).filter((c): c is CurriculumCourse => !!c)
  const [notice, setNotice] = useState('')

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

  const compared = picked.map((id) => products.find((p) => p.id === id)!).filter(Boolean)

  return (
    <div className="pc">
      <p className="pc-hint">
        {products.length} programs · <span className="pc-hint-swipe">swipe to see them all · </span>
        pick two or three to compare
      </p>

      <div className="pc-rail" role="list" aria-label="Programs">
        {products.map((p) => {
          const on = picked.includes(p.id)
          return (
            <article key={p.id} id={`product-${p.id}`} className={`pc-card${on ? ' pc-on' : ''}`} role="listitem">
              <div className="program-tag">{p.tag}</div>
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
                {p.hasTI && <li>Technical Intensive — recorded course</li>}
                {p.hasWeb3 && <li>WEB3 Masterclass — recorded course</li>}
                {p.months && <li>{p.months} months of membership — live sessions with mentors and the community</li>}
              </ul>

              {(p.hasTI || p.hasWeb3) && (
                <p className="pc-note">Recorded lessons are yours to keep, with or without a membership.</p>
              )}

              <div className="pc-actions">
                <a href={p.checkout} className="btn btn-gold">Buy now →</a>
                <button type="button" className="btn btn-outline pc-compare" aria-pressed={on} onClick={() => toggle(p.id)}>
                  {on ? '✓ Comparing' : 'Compare'}
                </button>
                {p.promo && (
                  <button type="button" className="pc-curriculum" aria-haspopup="dialog" onClick={() => setWatching(p)}>
                    ▶ Watch intro
                  </button>
                )}
                {coursesOf(p).length > 0 && (
                  <button type="button" className="pc-curriculum" aria-haspopup="dialog" onClick={() => setReading(p)}>
                    Curriculum
                  </button>
                )}
              </div>
            </article>
          )
        })}
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
