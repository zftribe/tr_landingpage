import type { LmsPackage } from './lms'

/**
 * The eight products Welcome sells, in display order — every combination of
 * Technical Intensive, WEB3 Masterclass and a 6- or 12-month membership that
 * was agreed. Ids are the LMS package ids. A package the LMS has not published
 * (or has unpublished) is simply not shown.
 */
export const LINEUP = [
  'f9601ac9-f916-4bf4-b200-68c8457cef09', // TI
  'ae67d608-901a-40a7-ace3-9ed3950d5dc6', // Web3
  '01cee606-d6ea-4694-a935-d16a07f3eafa', // TI + 12 months
  '6d2f2b79-fd93-4ba7-aa96-0138802345f5', // Web3 + 12 months
  'c48fb1a4-c746-4aff-b725-9aa8605d4a16', // TI + Web3 (ZFT Wealth Builder)
  '253e056c-58a8-4727-a00b-05a65a3b596e', // TI + Web3 + 24 months (ZFT Wealth Builder MAX)
  'c8aa3cd1-77e6-4169-94c5-1e06ec20fc8c', // TI + Web3 + 6 months (LMS #21, draft)
  'f31f93a6-9d3c-4267-ac9d-67a1ce08edf3', // TI + Web3 + 12 months (LMS #21, draft)
  '38f59cd9-f07d-486a-b34d-c238a95b95ee', // 12 months
]

// "WEB3 Masterclass" on this site = the Web3 Masterclass course; its packages also include the
// Liquidity Provider (LP) Masterclass course, which is now sold on its own too (George, 9 Nov).
const TI_COURSE = 'a5ca076e-7229-4688-afc0-dedf3862cf14'
const WEB3_COURSE = '35f09182-1aaa-4084-92e4-6484eadf35af'
export const LP_COURSE = 'ae5421d7-eb88-480d-b1c9-7ac1ef6918a0'

export type Product = {
  id: string
  name: string
  tag: string
  hasTI: boolean
  hasWeb3: boolean
  /** Includes the Liquidity Provider Masterclass course (all WEB3 packages do). */
  hasLP: boolean
  /** Sold without a checkout yet (preview placeholder). */
  placeholder?: boolean
  /** LMS course ids in this product, in package order. */
  courseIds: string[]
  /** Membership length, or null when none is included. */
  months: number | null
  price: number
  subtotal: number
  discount: number
}

/**
 * Describe a package by what is in it, not by its LMS title, so the name can
 * never disagree with the contents.
 */
export function toProduct(p: LmsPackage): Product {
  const courses = p.items.filter((i) => i.itemType === 'course').map((i) => i.itemId)
  // Membership time = the first Discord item with a numeric duration. Course keys (Titans, Digital Walkers,
  // Market Makers…) are ₱0 Discord items with no duration: they are lifetime keys, not membership (LMS, 9 Nov).
  const membership = p.items.find((i) => i.itemType === 'discord' && typeof i.durationDays === 'number')
  const hasTI = courses.includes(TI_COURSE)
  const hasWeb3 = courses.includes(WEB3_COURSE)
  const hasLP = courses.includes(LP_COURSE)
  const lpOnly = hasLP && !hasWeb3 && !hasTI
  const months = membership?.durationDays ? Math.round(membership.durationDays / 30) : null

  const parts = [hasTI && 'Technical Intensive', hasWeb3 && 'WEB3 Masterclass', lpOnly && 'Liquidity Provider Masterclass'].filter(Boolean) as string[]
  const name = parts.length
    ? parts.join(' + ') + (months ? ` + ${months}-month membership` : '')
    : `${months}-month membership`
  const tag = parts.length === 2 ? 'Bundle' : parts.length === 1 ? (months ? 'Course + membership' : 'Course') : 'Membership'

  return { id: p.id, name, tag, hasTI, hasWeb3, hasLP, courseIds: courses, months, price: p.price, subtotal: p.subtotal, discount: p.discount }
}

/** A published package that is just the LP Masterclass course: its only course is LP, and any Discord
 *  items are lifetime keys (no duration), e.g. the Market Makers key. */
const isLpOnly = (p: LmsPackage) => {
  const courses = p.items.filter((i) => i.itemType === 'course')
  const discord = p.items.filter((i) => i.itemType === 'discord')
  return courses.length === 1 && courses[0].itemId === LP_COURSE && discord.every((i) => i.durationDays == null)
}

export function lineup(packages: LmsPackage[]): Product[] {
  const byId = new Map(packages.map((p) => [p.id, p]))
  const list = LINEUP.flatMap((id) => {
    const p = byId.get(id)
    return p ? [toProduct(p)] : []
  })
  // The LP Masterclass sits right after the WEB3 Masterclass. It shows as soon as the LMS publishes
  // an LP-only package; the preview can show a placeholder before that (PREVIEW_LP_PLACEHOLDER=1).
  const lpPkg = packages.find(isLpOnly)
  const lp: Product | null = lpPkg
    ? toProduct(lpPkg)
    : process.env.PREVIEW_LP_PLACEHOLDER === '1'
      ? { id: 'lp-preview', name: 'Liquidity Provider Masterclass', tag: 'Course', hasTI: false, hasWeb3: false, hasLP: true, placeholder: true, courseIds: [LP_COURSE], months: null, price: 7499, subtotal: 7499, discount: 0 }
      : null
  if (lp) {
    const at = list.findIndex((p) => p.hasWeb3 && !p.hasTI && !p.months)
    list.splice(at >= 0 ? at + 1 : list.length, 0, lp)
  }
  return list
}

export const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`
