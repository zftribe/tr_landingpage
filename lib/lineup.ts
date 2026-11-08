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

// "Web3" on this site is two LMS courses sold together.
const TI_COURSE = 'a5ca076e-7229-4688-afc0-dedf3862cf14'
const WEB3_COURSES = ['ae5421d7-eb88-480d-b1c9-7ac1ef6918a0', '35f09182-1aaa-4084-92e4-6484eadf35af']

export type Product = {
  id: string
  name: string
  tag: string
  hasTI: boolean
  hasWeb3: boolean
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
  const membership = p.items.find((i) => i.itemType === 'discord')
  const hasTI = courses.includes(TI_COURSE)
  const hasWeb3 = WEB3_COURSES.some((id) => courses.includes(id))
  const months = membership?.durationDays ? Math.round(membership.durationDays / 30) : null

  const parts = [hasTI && 'Technical Intensive', hasWeb3 && 'WEB3 Masterclass'].filter(Boolean) as string[]
  const name = parts.length
    ? parts.join(' + ') + (months ? ` + ${months}-month membership` : '')
    : `${months}-month membership`
  const tag = parts.length === 2 ? 'Bundle' : parts.length === 1 ? (months ? 'Course + membership' : 'Course') : 'Membership'

  return { id: p.id, name, tag, hasTI, hasWeb3, courseIds: courses, months, price: p.price, subtotal: p.subtotal, discount: p.discount }
}

export function lineup(packages: LmsPackage[]): Product[] {
  const byId = new Map(packages.map((p) => [p.id, p]))
  return LINEUP.flatMap((id) => {
    const p = byId.get(id)
    return p ? [toProduct(p)] : []
  })
}

export const peso = (n: number) => `₱${Math.round(n).toLocaleString('en-PH')}`
