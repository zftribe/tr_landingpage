import { readFileSync } from 'node:fs'
import path from 'node:path'
import Script from 'next/script'
import { Programs } from '@/components/Programs'
import { structuredData } from '@/lib/seo'
import { fetchPackages } from '@/lib/lms'
import { fill } from '@/lib/fill'

/**
 * The homepage: the original static site, with rebuilt sections in between.
 *
 * content/legacy-*.html is the old index.html's <body>, cut where a section has
 * been rebuilt as a component; app/legacy.css and public/legacy.js are its
 * <style> and <script>. The legacy markup is unchanged — its inline onclick
 * handlers call functions legacy.js defines. The redesign replaces one
 * section at a time, deleting the matching markup as it goes.
 *
 * Rebuilt every five minutes, so LMS prices stay current.
 */
const legacy = (name: string) => readFileSync(path.join(process.cwd(), `content/${name}.html`), 'utf8')
const before = legacy('legacy-before-programs')
const after = legacy('legacy-after-programs')

export const revalidate = 300

export default async function Home() {
  // Prices in the copy come from the shop; if the LMS is down, they read "see the shop".
  const packages = await fetchPackages().catch(() => [])
  const top = fill(before, packages)
  const bottom = fill(after, packages)
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(bottom)).replace(/</g, '\\u003c') }}
      />
      <div dangerouslySetInnerHTML={{ __html: top }} />
      <Programs />
      <div dangerouslySetInnerHTML={{ __html: bottom }} />
      <Script src="/legacy.js" strategy="afterInteractive" />
    </>
  )
}
