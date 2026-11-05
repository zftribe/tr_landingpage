'use client'

import { useState } from 'react'
import { peso, type Product } from '@/lib/lineup'

type Item = Product & { checkout: string }
type Goal = 'trading' | 'investing' | 'both'
type Support = 'self' | 'mentor'

const PATHFINDERS_URL = 'https://georgeasibal.com/'

const GOALS: { value: Goal; label: string; hint: string }[] = [
  { value: 'trading', label: 'Active trading', hint: 'Reading charts, planning trades and managing risk.' },
  { value: 'investing', label: 'Crypto and investing', hint: 'Understanding Web3 and investing without trading every day.' },
  { value: 'both', label: 'Both', hint: 'Trading skills and a wider view of crypto.' },
]

const SUPPORT: { value: Support; label: string; hint: string }[] = [
  { value: 'self', label: 'A course I can follow', hint: 'Recorded lessons, with live sessions if I add a membership.' },
  { value: 'mentor', label: 'Close, personal guidance', hint: 'A year of mentorship and direct feedback.' },
]

// Why each recommendation fits, in the visitor's own terms.
const WHY: Record<Goal, string> = {
  trading:
    'You want to trade actively. Technical Intensive teaches the ZFT trading system step by step: reading charts, planning entries and exits, and managing risk.',
  investing:
    'You want to understand crypto and invest without trading every day. WEB3 Masterclass covers Web3, DeFi and liquidity strategies, and how to judge the risk.',
  both:
    'You want both. Technical Intensive gives you the trading system, and WEB3 Masterclass gives you the wider crypto picture — together for less than buying them separately.',
}

const pick = (products: Item[], goal: Goal) =>
  products.find((p) => p.months === null && p.hasTI === (goal !== 'investing') && p.hasWeb3 === (goal !== 'trading'))

/** "Not sure where to start?" — two questions, one recommendation, and why. */
export function Quiz({ products }: { products: Item[] }) {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [support, setSupport] = useState<Support | null>(null)

  const product = goal && support === 'self' ? pick(products, goal) : undefined

  const show = (id: string) => {
    const card = document.getElementById(`product-${id}`)
    if (!card) return
    card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
    card.classList.add('pc-flash')
    setTimeout(() => card.classList.remove('pc-flash'), 1600)
  }

  return (
    <div className="qz" id="start">
      <h3 className="qz-title">Not sure where to start?</h3>
      <p className="qz-sub">Two quick questions, and we&apos;ll point you to the program that fits.</p>

      <div className="qz-questions">
        <fieldset className="qz-q">
          <legend>1. What do you want to get better at?</legend>
          {GOALS.map((o) => (
            <label key={o.value} className={`qz-opt${goal === o.value ? ' qz-on' : ''}`}>
              <input type="radio" name="qz-goal" value={o.value} checked={goal === o.value} onChange={() => setGoal(o.value)} />
              <span><strong>{o.label}</strong><small>{o.hint}</small></span>
            </label>
          ))}
        </fieldset>

        <fieldset className="qz-q">
          <legend>2. How much guidance do you want?</legend>
          {SUPPORT.map((o) => (
            <label key={o.value} className={`qz-opt${support === o.value ? ' qz-on' : ''}`}>
              <input type="radio" name="qz-support" value={o.value} checked={support === o.value} onChange={() => setSupport(o.value)} />
              <span><strong>{o.label}</strong><small>{o.hint}</small></span>
            </label>
          ))}
        </fieldset>
      </div>

      <div className="qz-result" role="status" aria-live="polite">
        {support === 'mentor' && (
          <>
            <p className="qz-eyebrow">We recommend</p>
            <h4>ZFT Masterclass: Pathfinders</h4>
            <p>
              You want closer, personal guidance. Pathfinders is a year of live mentorship with George — a structured
              process, deeper market judgment and direct feedback, whatever you trade.
            </p>
            <div className="qz-actions">
              <a href={PATHFINDERS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-gold">
                Explore Pathfinders →
              </a>
            </div>
          </>
        )}
        {product && goal && (
          <>
            <p className="qz-eyebrow">We recommend</p>
            <h4>{product.name}</h4>
            <p>{WHY[goal]}</p>
            <p className="qz-price">
              {peso(product.price)}
              {product.discount > 0 && <span> · save {peso(product.discount)}</span>}
            </p>
            <p className="qz-note">Want live sessions with mentors too? Each course also comes with a membership — see the options below.</p>
            <div className="qz-actions">
              <a href={product.checkout} className="btn btn-gold">Buy now →</a>
              <button type="button" className="btn btn-outline" onClick={() => show(product.id)}>See it below</button>
            </div>
          </>
        )}
        {goal && support === 'self' && !product && (
          <p>That program isn&apos;t on sale right now — see everything that is below.</p>
        )}
        {!(goal && support) && <p className="qz-wait">Answer both to see your recommendation.</p>}
      </div>
    </div>
  )
}
