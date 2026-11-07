import { fetchPackages, fetchCurriculum, checkoutUrl } from '@/lib/lms'
import { lineup } from '@/lib/lineup'
import { PROMOS } from '@/lib/promos'
import { DISCORD_INVITE } from '@/lib/fill'
import { ProductRail, type ExtraCard } from './ProductRail'
import { Quiz } from './Quiz'

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
    price: '₱88,000',
    priceNote: 'one-time',
    lines: [
      'Citizen for life, no future price increases',
      'The Vault: 300+ webinar videos since 2020',
      '₱59,999 if you own Wealth Builder · ₱69,999 with TI or WEB3',
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
          <div className="eyebrow reveal" style={{ justifyContent: 'center' }}>Courses &amp; memberships</div>
          <h2 className="heading-lg reveal">
            Start free. <span className="gold">Go as deep as you want.</span>
          </h2>
        </div>

        <ProductRail products={products} curriculum={curriculum} before={BEFORE} after={AFTER} />
        <Quiz products={products} />
      </div>
    </section>
  )
}
