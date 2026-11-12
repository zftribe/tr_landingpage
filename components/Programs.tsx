import { fetchPackages, fetchCurriculum, checkoutUrl } from '@/lib/lms'
import { lineup } from '@/lib/lineup'
import { PROMOS } from '@/lib/promos'
import { DISCORD_INVITE } from '@/lib/fill'
import { ProductRail, type ExtraCard } from './ProductRail'
import { Assessment } from './Assessment'

const BLUEPRINT_PLAYLIST = 'https://www.youtube.com/playlist?list=PL033hJEN0tRsgTDmsylZus4BONq8zeHjN'

/** Free first, so a new visitor sees a no-cost way in before any price. */
const BEFORE: ExtraCard[] = [
  {
    key: 'blueprint',
    tag: 'Free course',
    name: 'Trading Republic Blueprint',
    price: 'Free',
    priceNote: 'on YouTube',
    lines: ['Reading charts: support, resistance, trends', 'Your first trade plan and trading psychology'],
    logos: [{ alt: 'Blueprint', src: '/logos/programs/blueprint.png' }],
    cta: { label: 'Watch free on YouTube', href: BLUEPRINT_PLAYLIST, external: true },
    free: true,
  },
]

/** Not sold in the online shop yet: prices as published, joining is through Discord. */
const AFTER: ExtraCard[] = [
  {
    key: 'eternals',
    tag: 'Lifetime Citizen',
    name: 'The Eternals',
    price: '₱60,000',
    priceNote: 'one-time',
    lines: [
      'Citizen for life, no future price increases',
      'The Vault: 300+ webinar videos since 2020',
    ],
    logos: [{ alt: 'The Eternals', src: '/logos/programs/eternal.svg' }],
    cta: { label: 'Ask us on Discord', href: DISCORD_INVITE, external: true },
  },
  {
    key: 'pathfinders',
    tag: 'Mentorship',
    name: 'ZFT Masterclass: Pathfinders',
    price: 'Masterclass',
    lines: ['Bear markets hold big opportunities; learn to position early', 'Find your approach as a trader, investor, or both'],
    logos: [{ alt: 'ZFT Masterclass', src: '/logos/programs/masterclass.png' }],
    cta: { label: 'Full details', href: 'https://zeefreaks.gitbook.io/zft-masterclass-pathfinders/', external: true },
  },
]

export async function Programs() {
  const [packages, curriculum] = await Promise.all([fetchPackages(), fetchCurriculum()])
  const products = lineup(packages).map((p) => ({ ...p, checkout: checkoutUrl(p.id), promo: PROMOS[p.id] ?? null }))

  return (
    <section className="section" id="programs">
      <div className="container">
        <div className="text-center mb-40">

          <h2 className="heading-lg reveal">
            Pick your <span className="gold">path.</span>
          </h2>
        </div>

        {/* Cards run cheapest to dearest (George, 11 Nov); equal prices keep their lineup order. */}
        <ProductRail products={[...products].sort((a, b) => a.price - b.price)} curriculum={curriculum} before={BEFORE} after={AFTER} />
        {/* Target of the hero's "3-min assessment" link, so it scrolls here even before scripts run; Assessment then opens itself. */}
        <div id="assessment" className="fx-anchor" aria-hidden="true" />
        <Assessment products={products} />
      </div>
    </section>
  )
}
