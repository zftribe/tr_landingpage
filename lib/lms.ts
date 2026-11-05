/**
 * Read-only access to the LMS's public catalogue. The LMS owns prices and
 * contents; this site only displays them, so the two cannot disagree.
 */

export const LMS_URL = (process.env.LMS_URL || 'https://app.tradingrepublic.io').replace(/\/+$/, '')

export type LmsPackageItem = {
  itemType: 'course' | 'discord'
  itemId: string
  name: string | null
  price: number
  durationDays?: number | null
}

export type LmsPackage = {
  id: string
  title: string
  items: LmsPackageItem[]
  subtotal: number
  discount: number
  price: number
}

/** Published packages. Cached for five minutes, so a price change shows up quickly. */
export async function fetchPackages(): Promise<LmsPackage[]> {
  const res = await fetch(`${LMS_URL}/api/packages`, { next: { revalidate: 300 } })
  if (!res.ok) throw new Error(`LMS /api/packages returned ${res.status}`)
  const json = await res.json()
  return json.data as LmsPackage[]
}

export const checkoutUrl = (packageId: string) =>
  `${LMS_URL}/student/checkout?type=package&id=${encodeURIComponent(packageId)}`
