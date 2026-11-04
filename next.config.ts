import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // The yield tracker loads its own files by relative path (logos/…), which
  // only resolve correctly while its URL ends in a slash. Without this, Next
  // strips the slash and the tracker fetches /logos/… — the homepage's logos.
  trailingSlash: true,

  async redirects() {
    // The static site lived at /index.html, and the tracker still links to
    // ../index.html.
    return [{ source: '/index.html', destination: '/', permanent: true }]
  },

  async rewrites() {
    return [{ source: '/yield-tracker/', destination: '/yield-tracker/index.html' }]
  },
}

export default nextConfig
