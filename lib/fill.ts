import type { LmsPackage } from './lms'
import { peso } from './lineup'

/**
 * The one Discord invite every Join button uses. Set DISCORD_INVITE in Vercel
 * to swap it everywhere at once (discord.gg/tradingrepublic stopped working in Nov 2026; this invite never expires).
 */
export const DISCORD_INVITE = (process.env.DISCORD_INVITE || 'https://discord.gg/SXEEhgmeTn').trim()

/**
 * Fill the page's placeholders:
 *   {{discord}}        the Discord invite above
 *   {{price:<id>}}     that LMS package's current price, so the FAQ and
 *                      membership text always match the shop
 * A package the shop no longer sells reads "see the shop" instead of a stale number.
 */
export function fill(html: string, packages: LmsPackage[]): string {
  const prices = new Map(packages.map((p) => [p.id, p.price]))
  return html
    .split('{{discord}}').join(DISCORD_INVITE)
    .replace(/\{\{price:([0-9a-f-]{36})\}\}/g, (_, id: string) => {
      const price = prices.get(id)
      return price === undefined ? 'see the shop' : peso(price)
    })
}
