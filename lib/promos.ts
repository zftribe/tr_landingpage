/**
 * Short product promo videos, 30 seconds at most: LMS package id → YouTube
 * video id (the part after `v=` or `youtu.be/`). A product with no entry shows
 * no "Watch intro" button. None are recorded yet; add a line per product as
 * they are uploaded, e.g.
 *   'f9601ac9-f916-4bf4-b200-68c8457cef09': 'dQw4w9WgXcQ', // TI
 */
export const PROMOS: Record<string, string> = {}
