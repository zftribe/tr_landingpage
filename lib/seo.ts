import { readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * Search and AI-search facts for the homepage. Every sentence here comes from
 * text already on the page (content/legacy-*.html) or from George Asibal's own
 * site, so nothing is claimed that the page does not already say.
 *
 * SITE_URL is the canonical origin for metadata, sitemap, robots and JSON-LD.
 * Override it with NEXT_PUBLIC_SITE_URL; a trailing slash is removed.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.tradingrepublic.io').replace(/\/+$/, '')
export const SITE_NAME = 'Trading Republic by ZFT'
export const TITLE = 'Trading Republic by ZFT · Trading Community, Courses & Webinars'
export const DESCRIPTION =
  'Learn to trade and invest in stocks, forex, crypto, indices and commodities. Free Blueprint course, weekly webinars with Boss Zeefreaks, and programs like Technical Intensive.'

export const SAME_AS = [
  'https://discord.gg/SXEEhgmeTn',
  'https://www.youtube.com/@tradingrepubliczft',
  'https://www.tiktok.com/@tradingrepublic.zft',
  'https://www.facebook.com/thetradingrepublic',
]

const decode = (s: string) =>
  s
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&#8212;|&mdash;/g, '—')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

/** The FAQ exactly as shown on the page, read from its markup so the two never disagree. */
export function readFaq(html = readFileSync(path.join(process.cwd(), 'content/legacy-after-programs.html'), 'utf8')): { q: string; a: string }[] {
  const items: { q: string; a: string }[] = []
  const re = /<button[^>]*class="faq-q"[^>]*>([\s\S]*?)<\/button>\s*<div class="faq-a"[^>]*>([\s\S]*?)<\/div>/g
  // The gold "next step" links (class faq-go) are page navigation, not part of the answer.
  for (let m = re.exec(html); m; m = re.exec(html)) items.push({ q: decode(m[1]), a: decode(m[2].replace(/<a class="faq-go"[\s\S]*?<\/a>/g, '')) })
  return items
}

/** `pageHtml` is the filled lower half of the page, so FAQ prices match what visitors see. */
export function structuredData(pageHtml?: string) {
  const faq = readFaq(pageHtml)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#org`,
        name: 'Trading Republic',
        alternateName: ['Trading Republic by ZFT', 'TR'],
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icon-512.png`,
        description:
          'A trading community and education program by ZFT. Members learn to trade and invest in stocks, forex, commodities, indices and crypto through courses, weekly webinars and a Discord community.',
        parentOrganization: { '@type': 'Organization', name: 'ZFT' },
        founder: {
          '@type': 'Person',
          '@id': 'https://georgeasibal.com/#george',
          name: 'George Asibal',
          alternateName: 'Zeefreaks',
          url: 'https://georgeasibal.com/',
        },
        sameAs: SAME_AS,
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#site`,
        url: `${SITE_URL}/`,
        name: SITE_NAME,
        inLanguage: 'en',
        publisher: { '@id': `${SITE_URL}/#org` },
      },
      ...(faq.length
        ? [
            {
              '@type': 'FAQPage',
              '@id': `${SITE_URL}/#faq`,
              mainEntity: faq.map(({ q, a }) => ({
                '@type': 'Question',
                name: q,
                acceptedAnswer: { '@type': 'Answer', text: a },
              })),
            },
          ]
        : []),
    ],
  }
}
