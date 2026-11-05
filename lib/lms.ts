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

export type CurriculumCourse = {
  id: string
  title: string
  lessons: { order: number; title: string; durationMinutes: number | null }[]
}

/**
 * Lesson lists per course (LMS /api/curriculum). Optional: an LMS that does
 * not serve it yet, or a failed request, yields none, and the page simply has
 * no curriculum buttons rather than failing to build.
 */
export async function fetchCurriculum(): Promise<CurriculumCourse[]> {
  try {
    const res = await fetch(`${LMS_URL}/api/curriculum`, { next: { revalidate: 300 } })
    if (!res.ok) return []
    const json = await res.json()
    return Array.isArray(json.data) ? (json.data as CurriculumCourse[]) : []
  } catch {
    return []
  }
}

export const checkoutUrl = (packageId: string) =>
  `${LMS_URL}/student/checkout?type=package&id=${encodeURIComponent(packageId)}`
