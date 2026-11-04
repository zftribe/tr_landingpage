'use client'

import { useState } from 'react'
import { peso, type Product } from '@/lib/lineup'

type Item = Product & { checkout: string }

const MAX_COMPARE = 3

export function ProductRail({ products }: { products: Item[] }) {
  const [picked, setPicked] = useState<string[]>([])
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
              </div>
            </article>
          )
        })}
      </div>

      <p className="pc-notice" role="status">{notice}</p>

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
