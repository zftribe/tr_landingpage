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
  // Direction B: the hero headline is split into word masks on the server, so it can rise without moving the layout.
  const top = fill(before, packages).replace(
    '<h1 class="heading-xl">The New Generation of <span class="gradient-text-animated">Wealth Builders.</span></h1>',
    '<h1 class="heading-xl m-split" aria-label="The New Generation of Wealth Builders."><span class="m-w"><span style="--m-i:0">The</span></span> <span class="m-w"><span style="--m-i:1">New</span></span> <span class="m-w"><span style="--m-i:2">Generation</span></span> <span class="m-w"><span style="--m-i:3">of</span></span> <span class="m-w"><span class="gradient-text-animated" style="--m-i:4">Wealth Builders.</span></span></h1>',
  )
  const bottom = fill(after, packages)
  return (
    <>
      {/* Tap-the-candle intro (George, 10 Nov): decided before first paint; once a day, never for crawlers. */}
      <script dangerouslySetInnerHTML={{ __html: "(function(){try{var d=document.documentElement,q=/[?&]intro=1/.test(location.search),bot=/bot|crawl|spider|slurp|lighthouse|headless|facebookexternalhit|embedly|preview/i.test(navigator.userAgent),seen=null;try{seen=localStorage.getItem('tr-intro-day')}catch(e){}if(q||(!bot&&seen!==new Date().toDateString()))d.classList.add('intro-on')}catch(e){}})()" }} />
      {/* Motion direction B (matched to georgeasibal.com): decided before first paint; nothing moves for prefers-reduced-motion. */}
      <script dangerouslySetInnerHTML={{ __html: "(function(){try{var d=document.documentElement;if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;d.classList.add('m-on');setTimeout(function(){if(!d.classList.contains('m-ready'))d.classList.remove('m-on')},5000)}catch(e){}})()" }} />
      <div id="tr-intro" aria-label="Welcome intro" />
      <Script src="/intro/candle-intro.js" strategy="afterInteractive" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData(bottom)).replace(/</g, '\\u003c') }}
      />
      <div dangerouslySetInnerHTML={{ __html: top }} />
      <Programs />
      <div dangerouslySetInnerHTML={{ __html: bottom }} />
      <Script src="/legacy.js" strategy="afterInteractive" />
      <Script src="/motion/motion.js" strategy="afterInteractive" />
    </>
  )
}
