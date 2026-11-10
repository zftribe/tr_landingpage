import type { Metadata, Viewport } from 'next'
import { DM_Sans, Plus_Jakarta_Sans } from 'next/font/google'
import './legacy.css'
import './programs.css'
import './motion.css'
import { DESCRIPTION, SITE_NAME, SITE_URL, TITLE } from '@/lib/seo'

// Self-hosted at build time with size-matched fallbacks, so the hero no longer
// jumps when the web fonts arrive (audit 10 Nov: CLS 0.17 to 0.19 on desktop).
// legacy.css reads them through --font-display and --font-body.
const display = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--tr-font-display', display: 'swap' })
const body = DM_Sans({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--tr-font-body', display: 'swap' })

const SHARE_IMAGE = {
  url: '/og-image.png',
  width: 1200,
  height: 630,
  alt: 'Trading Republic by ZFT: The New Generation of Wealth Builders',
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  // A static file, so link previews get a 200 straight away (the generated
  // /opengraph-image route answered 308 because of trailingSlash).
  openGraph: {
    type: 'website',
    url: '/',
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    locale: 'en_PH',
    images: [SHARE_IMAGE],
  },
  twitter: { card: 'summary_large_image', title: TITLE, description: DESCRIPTION, images: [SHARE_IMAGE.url] },
  appleWebApp: { capable: true, title: 'TR', statusBarStyle: 'black-translucent' },
  icons: {
    icon: [
      { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: { url: '/apple-touch-icon.png', sizes: '180x180' },
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#0b0b0f',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
