import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fetchPackages, fetchCurriculum, checkoutUrl } from '@/lib/lms'
import { lineup } from '@/lib/lineup'
import { ProductRail } from './ProductRail'
import { Quiz } from './Quiz'

// TR4Ever and Pathfinders stay as the original markup until the section is
// restructured into free / paid / memberships / guidance.
const kept = readFileSync(path.join(process.cwd(), 'content/legacy-programs-kept.html'), 'utf8')

export async function Programs() {
  const [packages, curriculum] = await Promise.all([fetchPackages(), fetchCurriculum()])
  const products = lineup(packages).map((p) => ({ ...p, checkout: checkoutUrl(p.id) }))

  return (
    <section className="section" id="programs">
      <div className="container">
        <div className="text-center mb-56">
          <div className="eyebrow reveal" style={{ justifyContent: 'center' }}>ZFT Products</div>
          <h2 className="heading-lg reveal">
            Programs built for <span className="gold">every trader.</span>
          </h2>
          <p className="text-body max-w-500 mx-auto reveal mt-24">
            From aftercare communities to intensive masterclasses — find the right path for you.
          </p>
        </div>

        <Quiz products={products} />
        <ProductRail products={products} curriculum={curriculum} />

        <div dangerouslySetInnerHTML={{ __html: kept }} />
      </div>
    </section>
  )
}
