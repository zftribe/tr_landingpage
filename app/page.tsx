import { readFileSync } from 'node:fs'
import path from 'node:path'
import Script from 'next/script'
import { Programs } from '@/components/Programs'
import { structuredData } from '@/lib/seo'

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

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()).replace(/</g, '\\u003c') }}
      />
      <div dangerouslySetInnerHTML={{ __html: before }} />
      <Programs />
      <div dangerouslySetInnerHTML={{ __html: after }} />
      <Script src="/legacy.js" strategy="afterInteractive" />
    </>
  )
}
