'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { peso, type Product } from '@/lib/lineup'
import { trial, trialClass, FACETS, type Answer, type Card } from '@/lib/assessment-model'

type Item = Product & { checkout: string }

const BLUEPRINT = 'https://www.youtube.com/playlist?list=PL033hJEN0tRsgTDmsylZus4BONq8zeHjN'
const PATHFINDERS = 'https://zeefreaks.gitbook.io/zft-masterclass-pathfinders/'
const TYPICAL = 14

const TOPIC: Record<Card['stage'], string> = {
  fork: 'Trader or investor', style: 'Your style', life: 'Your time and money', exp: 'Your experience',
  facet: 'How you decide', replay: 'A quick chart', deeper: 'More about you',
}

// Simple line icons, drawn on a 24px grid. Anything not listed falls back to a dot.
const ICON: Record<string, string> = {
  chart: 'M4 19h16M6 15l4-4 3 3 5-6', candle: 'M8 4v16M16 4v16M6 8h4v7H6zM14 6h4v8h-4z', bars: 'M5 19V9M10 19V5M15 19v-8M20 19v-4',
  tick: 'M3 12h4l2-5 3 10 2-5h7', book: 'M4 5h6a2 2 0 0 1 2 2v12a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v12a2 2 0 0 1 2-2h6z',
  scroll: 'M7 4h11v13a3 3 0 0 1-3 3H6a3 3 0 0 1 0-6h1zM10 8h5M10 11h5', journal: 'M6 3h11a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6zM9 7h6M9 11h6',
  bolt: 'M13 3 5 14h6l-1 7 8-11h-6z', clock: 'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', stopwatch: 'M12 9v4l2 2M10 3h4M19 14a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  hourglass: 'M7 3h10M7 21h10M8 3c0 5 8 6 8 9s-8 4-8 9M16 3c0 5-8 6-8 9s8 4 8 9', calendar: 'M4 6h16v14H4zM4 10h16M9 3v4M15 3v4',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8M12 2v2M12 20v2M2 12h2M20 12h2', moon: 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10', moonoff: 'M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10M3 3l18 18',
  arrowup: 'M4 18 10 12l4 4 6-8M15 8h5v5', zigzag: 'M3 16l4-8 4 8 4-8 4 8', door: 'M6 21V4h10v17M16 12h-2M4 21h16', house: 'M4 11l8-7 8 7v9H4zM10 20v-6h4v6',
  coins: 'M8 8a5 2.5 0 1 0 10 0 5 2.5 0 1 0-10 0M8 8v4c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5V8M6 13v4c0 1.4 2.2 2.5 5 2.5', gem: 'M6 4h12l3 5-9 11L3 9zM3 9h18',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8', seed: 'M12 20v-8M12 12c0-4 3-7 7-7 0 4-3 7-7 7M12 14c0-3-2-5-6-5 0 3 2 5 6 5',
  ruler: 'M3 17 17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2', eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',
  gears: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2', tag: 'M3 12V4h8l10 10-8 8zM7 8h.01',
  drop: 'M12 3s7 7 7 12a7 7 0 0 1-14 0c0-5 7-12 7-12', rocket: 'M12 2c4 3 5 8 4 13H8C7 10 8 5 12 2M8 15l-3 4h4M16 15l3 4h-4M12 9h.01',
  globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18', compass: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M15 9l-2 5-5 2 2-5z',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z', flame: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 2 1 3 2 3 4',
  check: 'M4 12l5 5L20 6', question: 'M9 9a3 3 0 1 1 4 2.8c-.8.4-1 1-1 2.2M12 18h.01', purse: 'M4 8h16v12H4zM8 8V6a4 4 0 0 1 8 0v2',
  scale: 'M12 3v18M5 7h14M5 7l-3 7h6zM19 7l-3 7h6z', people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6M3 20a6 6 0 0 1 12 0M17 11a3 3 0 1 0 0-6M21 20a6 6 0 0 0-4-5.7',
  bell: 'M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20h4', lamp: 'M9 21h6M10 17h4M12 3a6 6 0 0 0-3 11v3h6v-3a6 6 0 0 0-3-11',
  mountain: 'M3 20l6-11 4 6 3-4 5 9z', trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M10 20h4M12 13v7',
}
const Icon = ({ name }: { name: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d={ICON[name] || 'M12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2'} /></svg>
)

/** The two chart questions: a static candle chart, drawn here so it needs no files. */
function Chart({ kind }: { kind: string }) {
  const dip = kind === 'replay:dip'
  // [open, close] per candle; volume below.
  const c: [number, number][] = dip
    ? [[60, 62], [62, 59], [59, 61], [61, 58], [58, 60], [60, 57], [57, 58], [58, 55], [55, 52], [52, 38], [38, 30], [30, 27], [27, 32], [32, 36], [36, 35], [35, 38]]
    : [[50, 52], [52, 50], [50, 51], [51, 49], [49, 51], [51, 50], [50, 52], [52, 50], [50, 51], [51, 49], [49, 51], [51, 53], [53, 62], [62, 71], [71, 78], [78, 76]]
  const vol = dip ? [3, 3, 2, 3, 2, 3, 2, 3, 4, 9, 8, 6, 5, 4, 3, 3] : [2, 2, 3, 2, 2, 3, 2, 2, 3, 2, 2, 3, 8, 9, 7, 4]
  const lo = Math.min(...c.flat()) - 4, hi = Math.max(...c.flat()) + 4
  const x = (i: number) => 18 + i * 18.5, y = (v: number) => 12 + ((hi - v) / (hi - lo)) * 96
  return (
    <svg className="as-chart" viewBox="0 0 310 150" role="img" aria-label={dip ? 'Price falls sharply, then bounces a little' : 'Price moves sideways for weeks, then breaks out upward on high volume'}>
      {[30, 60, 90].map((g) => <line key={g} x1="8" x2="302" y1={g} y2={g} className="grid" />)}
      {c.map(([o, cl], i) => {
        const up = cl >= o, top = y(Math.max(o, cl)), bot = y(Math.min(o, cl))
        return (
          <g key={i} className={up ? 'up' : 'down'}>
            <line x1={x(i)} x2={x(i)} y1={top - 4} y2={bot + 4} />
            <rect x={x(i) - 5} width="10" y={top} height={Math.max(3, bot - top)} rx="1" />
          </g>
        )
      })}
      {vol.map((v, i) => <rect key={'v' + i} x={x(i) - 5} width="10" y={146 - v * 3} height={v * 3} className="vol" />)}
    </svg>
  )
}

export function Assessment({ products }: { products: Item[] }) {
  const [open, setOpen] = useState(false)
  const [answers, setAnswers] = useState<Answer[]>([])
  const dlg = useRef<HTMLDialogElement>(null)

  const t = useMemo(() => trial({ answers, deeper: false }), [answers])
  const v = t.verdict()
  const next = v.finished ? null : t.nextCard()

  const start = useCallback(() => { setAnswers([]); setOpen(true) }, [])
  useEffect(() => {
    const fromHash = () => { if (location.hash === '#assessment') { history.replaceState(null, '', '#start'); document.getElementById('start')?.scrollIntoView({ block: 'center' }); start() } }
    fromHash()
    window.addEventListener('hashchange', fromHash)
    return () => window.removeEventListener('hashchange', fromHash)
  }, [start])
  useEffect(() => { const d = dlg.current; if (!d) return; if (open && !d.open) d.showModal(); if (!open && d.open) d.close() }, [open])
  useEffect(() => { dlg.current?.querySelector<HTMLElement>('.as-body')?.scrollTo(0, 0); dlg.current?.querySelector<HTMLElement>('.as-q, .as-res h3')?.focus() }, [answers.length, open])

  const pick = (c: Card, o: number) => setAnswers((a) => [...a, { id: c.id, o }])
  const back = () => setAnswers((a) => a.slice(0, -1))

  const showCard = (id: string) => {
    setOpen(false)
    const card = document.getElementById(`product-${id}`) || document.getElementById(`card-${id}`)
    if (!card) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    setTimeout(() => {
      card.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center', inline: 'center' })
      card.querySelector<HTMLElement>('a, button')?.focus({ preventScroll: true })
      card.classList.add('pc-flash'); setTimeout(() => card.classList.remove('pc-flash'), 1600)
    }, 60)
  }

  return (
    <div className="as-card" id="start">
      <div>
        <p className="qz-eyebrow">Assessment · about 3 minutes</p>
        <h3 className="as-card-title">Are you a trader, an investor, or not ready yet?</h3>
        <ul className="as-points">
          <li>12 to 16 questions on your time, goals and risk</li>
          <li>An honest readiness check, including &ldquo;not yet&rdquo;</li>
          <li>Matched to the program that fits, or to the free course</li>
        </ul>
        <button type="button" className="btn btn-gold" onClick={start}>Start the assessment →</button>
        <p className="as-honest">Honest by design: if it isn&apos;t for you yet, we&apos;ll tell you.</p>
      </div>
      <div className="as-dial" aria-hidden="true">
        <div className="as-lbl"><span>Trader</span><span>Investor</span></div>
        <div className="as-bar"><i style={{ width: '62%' }} /></div>
        <div className="as-lbl"><span>Readiness</span><span className="as-green">Ready to learn</span></div>
        <div className="as-bar"><i className="as-ok" style={{ width: '78%' }} /></div>
        <p className="as-small">Example result. Your answers stay in your browser; nothing is stored or sent.</p>
      </div>

      <dialog ref={dlg} className="as-dlg" aria-label="Trader or investor assessment" onClose={() => setOpen(false)}>
        {open && (
          <>
            <div className="as-top">
              <span className="as-brand">TR ASSESSMENT</span>
              <div className="as-prog" aria-hidden="true"><i style={{ width: `${v.finished ? 100 : Math.min(95, (answers.length / Math.max(TYPICAL, answers.length + 2)) * 100)}%` }} /></div>
              <span className="as-count">{v.finished ? 'Your result' : `Question ${answers.length + 1} of about ${Math.max(TYPICAL, answers.length + 2)}`}</span>
              <button type="button" className="btn btn-outline as-exit" onClick={() => setOpen(false)}>Exit</button>
            </div>
            <div className="as-body">
              {next ? <Question c={next} n={answers.length} onPick={pick} onBack={back} /> : <Result v={v} answers={answers} products={products} onRetake={start} onShow={showCard} />}
            </div>
          </>
        )}
      </dialog>
    </div>
  )
}

function Question({ c, n, onPick, onBack }: { c: Card; n: number; onPick: (c: Card, o: number) => void; onBack: () => void }) {
  return (
    <div className="as-qwrap">
      <p className="as-topic">{TOPIC[c.stage]}</p>
      <h3 className="as-q" tabIndex={-1}>{c.q}</h3>
      {c.sub && <p className="as-sub">{c.sub}</p>}
      {c.scene.startsWith('replay:') && <Chart kind={c.scene} />}
      <div className="as-opts" role="group" aria-label="Answers">
        {c.opts.map((o, i) => (
          <button key={i} type="button" className="as-opt" onClick={() => onPick(c, i)}>
            <span className="as-ic"><Icon name={o.i} /></span>
            <span className="as-ol">{o.l}</span>
          </button>
        ))}
      </div>
      <div className="as-nav">
        {n > 0 ? <button type="button" className="as-back" onClick={onBack}>← Back</button> : <span />}
        <span className="as-small">Answers stay in your browser. Education only, not financial advice.</span>
      </div>
    </div>
  )
}

type V = ReturnType<ReturnType<typeof trial>['verdict']>

function Result({ v, answers, products, onRetake, onShow }: { v: V; answers: Answer[]; products: Item[]; onRetake: () => void; onShow: (id: string) => void }) {
  const has = (id: string, o: number) => answers.some((a) => a.id === id && a.o === o)
  const lead = trialClass(v.r[0].c)
  // The split comes from the trader-or-investor questions, smoothed so one-sided answers read 80/20, not 100/0.
  const fv = v.forkVotes, traderPct = Math.min(95, Math.max(5, Math.round(((fv.t + 1) / (fv.t + fv.i + 2)) * 100)))
  const notYet = has('L3', 0) || has('L4', 2)
  const facet = (k: 'decide' | 'risk') => { const f = v.fs[k]; return f.top ? FACETS[k].values[f.top] : '—' }
  const newcomer = v.fs.stage.top === 'newcomer'
  const watch = [...v.flags, ...(newcomer && !notYet ? ['You are just starting: practise on paper before you use real money.'] : [])].slice(0, 2)

  const ti = products.find((p) => p.hasTI && !p.hasWeb3 && !p.months)
  const web3 = products.find((p) => p.hasWeb3 && !p.hasTI && !p.months)
  const paid = (p: Item | undefined, tag: string, line: string) => p ? (
    <div className="as-rec" key={p.id}>
      <span className="as-pill">{tag}</span><b>{p.name}</b><small>{line}</small>
      <div className="as-rec-cta"><a className="btn btn-gold" href={p.checkout}>Buy now · {peso(p.price)}</a><button type="button" className="btn btn-outline" onClick={() => onShow(p.id)}>See the card</button></div>
    </div>
  ) : null
  const blueprint = (tag: string, best = false) => (
    <div className="as-rec" key="bp">
      <span className="as-pill as-free">{tag}</span><b>Trading Republic Blueprint</b><small>Free on YouTube: charts, support and resistance, trends, and your first trade plan.</small>
      <div className="as-rec-cta"><a className={`btn ${best ? 'btn-gold' : 'btn-outline'}`} href={BLUEPRINT} target="_blank" rel="noopener noreferrer">Start free</a></div>
    </div>
  )
  const pathfinders = (
    <div className="as-rec" key="pf">
      <span className="as-pill as-alt">WANT GUIDANCE?</span><b>ZFT Masterclass: Pathfinders</b><small>Mentorship to find your approach as a trader, investor, or both.</small>
      <div className="as-rec-cta"><a className="btn btn-outline" href={PATHFINDERS} target="_blank" rel="noopener noreferrer">Full details</a></div>
    </div>
  )
  const recs = notYet ? [
    blueprint('FREE', true),
    <div className="as-rec" key="yt"><span className="as-pill as-alt">TOOL</span><b>TR Yield Tracker</b><small>Find a good insured savings rate for your emergency fund.</small><div className="as-rec-cta"><a className="btn btn-outline" href="/yield-tracker/">Compare rates</a></div></div>,
    <div className="as-rec" key="rt"><span className="as-pill as-alt">LATER</span><b>Retake in a few months</b><small>Your answers change as your safety net grows.</small><div className="as-rec-cta"><button type="button" className="btn btn-outline" onClick={onRetake}>Retake now</button></div></div>,
  ] : lead.side === 'trader' ? [
    paid(ti, 'BEST FIT', 'The ZFT trading system step by step: reading charts, planning entries and exits, managing risk.') ?? blueprint('BEST FIT', true),
    ti ? blueprint('FREE') : null, pathfinders,
  ] : lead.id === 'cartographer' ? [
    blueprint('BEST FIT', true),
    paid(web3, 'IF YOU ALSO WANT CRYPTO', 'Web3, DeFi and liquidity strategies, and how to judge the risk.'),
    pathfinders,
  ] : [
    paid(web3, 'BEST FIT', lead.id === 'scout' ? 'Web3, DeFi and liquidity strategies, and how to judge the risk. Includes the Liquidity Provider Masterclass.' : 'Investing in crypto and Web3 without trading every day, and how to judge the risk.') ?? blueprint('BEST FIT', true),
    web3 ? blueprint('FREE') : null, pathfinders,
  ]

  return (
    <div className="as-res">
      <p className="qz-eyebrow">Your result</p>
      <div className="as-res-top">
        <div className={`as-box ${notYet ? 'as-box-amber' : 'as-box-gold'}`}>
          {notYet ? (
            <>
              <p className="as-lean">Our honest answer</p>
              <h3 tabIndex={-1}>Not yet, <span className="as-amber">and that&apos;s fine</span></h3>
              <p className="as-about">You lean {lead.side} ({lead.name.toLowerCase()}), but your answers say money for trading or investing should wait.</p>
              <p className="as-honesty">Courses are how Trading Republic earns, but we value an honest assessment more. We don&apos;t want to sell you something that doesn&apos;t match your needs.</p>
            </>
          ) : (
            <>
              <p className="as-lean">You lean</p>
              <h3 tabIndex={-1}>{lead.side === 'trader' ? 'Trader' : 'Investor'} · <span className="gold">{lead.name}</span></h3>
              <p className="as-about">{lead.about}</p>
            </>
          )}
          <div className="as-split">
            <div className="as-lbl"><span>Trader {traderPct}%</span><span>Investor {100 - traderPct}%</span></div>
            <div className="as-bar as-two"><i style={{ width: `${traderPct}%` }} /><u style={{ width: `${100 - traderPct}%` }} /></div>
          </div>
          {v.reasons.length > 0 && (<><b className="as-why-h">Why, from your answers</b><ul className="as-why">{v.reasons.slice(0, 3).map((r) => <li key={r}>{r[0].toUpperCase() + r.slice(1)}</li>)}</ul></>)}
          <div className="as-facts">
            <div><small>Holds</small><b>{lead.time[0].toUpperCase() + lead.time.slice(1)}</b></div>
            <div><small>Decisions</small><b>{facet('decide')}</b></div>
            <div><small>Risk</small><b>{facet('risk')}</b></div>
          </div>
        </div>
        <div className="as-box">
          <p className="qz-eyebrow">Readiness check</p>
          {notYet ? (
            <>
              <div className="as-ready"><span className="as-dot as-red" /><div><b>Build your safety net first</b><p>{has('L3', 0) ? 'You said losing this money would hurt your bills. ' : ''}{has('L4', 2) ? 'You don’t have emergency savings yet. ' : ''}Aim for about three months of expenses in an insured savings account first.</p></div></div>
              <div className="as-ready"><span className="as-dot as-ok" /><div><b>Learning costs nothing</b><p>Start the free course now and come back when your base is ready.</p></div></div>
            </>
          ) : (
            <>
              <div className="as-ready"><span className="as-dot as-ok" /><div><b>Ready to learn</b><p>Losing money you set aside would not hurt your bills{has('L4', 0) ? ', and you have emergency savings' : ''}.</p></div></div>
              {watch.map((w) => <div className="as-ready" key={w}><span className="as-dot as-warn" /><div><b>One thing to watch</b><p>{w}</p></div></div>)}
            </>
          )}
          <p className="as-book">In the Trading Republic book, this style is the <b>{lead.book}</b> class.</p>
          <p className="as-demand-h">What it asks of you</p>
          <ul className="as-demand">{lead.demand.map((d) => <li key={d}>{d}</li>)}</ul>
        </div>
      </div>
      <h4 className="as-recs-h">{notYet ? 'What to do now' : 'Where to start'}</h4>
      <div className="as-recs">{recs}</div>
      <p className="as-disc">This assessment is for education only and is not financial advice. It describes a learning style from your own answers; it does not judge whether any investment suits you. Trading and investing carry risk, including the loss of your money. Adults (18+) only.</p>
      <div className="as-end"><button type="button" className="btn btn-outline" onClick={onRetake}>Retake</button></div>
    </div>
  )
}
