import { readFileSync } from 'node:fs'
import path from 'node:path'
import Script from 'next/script'

/**
 * The homepage, served exactly as the original static site rendered it.
 *
 * content/legacy-body.html is the old index.html's <body>; app/legacy.css and
 * public/legacy.js are its <style> and <script>. Markup and behaviour are
 * unchanged — the inline onclick handlers call functions legacy.js defines.
 * The redesign replaces this one section at a time with real components,
 * deleting the matching markup from the file as it goes.
 *
 * Read at build time; the page is static.
 */
const legacyBody = readFileSync(path.join(process.cwd(), 'content/legacy-body.html'), 'utf8')

export default function Home() {
  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: legacyBody }} />
      <Script src="/legacy.js" strategy="afterInteractive" />
    </>
  )
}
