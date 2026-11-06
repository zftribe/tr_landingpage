import { readFileSync } from 'node:fs'
import path from 'node:path'
import { ImageResponse } from 'next/og'

/** The share picture for Facebook, Discord, X and search: the TR mark and the page's own headline. */
export const alt = 'Trading Republic by ZFT: The New Generation of Wealth Builders'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  const logo = readFileSync(path.join(process.cwd(), 'public/TR no BG.png')).toString('base64')
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0a0a0a 0%, #1c1607 100%)',
          color: '#ffffff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`data:image/png;base64,${logo}`} width={190} height={190} alt="" />
        <div style={{ marginTop: 28, fontSize: 30, letterSpacing: 8, color: '#d4af37', fontWeight: 700 }}>
          TRADING REPUBLIC · BY ZFT
        </div>
        <div style={{ marginTop: 18, fontSize: 56, fontWeight: 800 }}>The New Generation of Wealth Builders.</div>
        <div style={{ marginTop: 22, fontSize: 28, color: '#c9c9c9' }}>
          Stocks · Forex · Crypto · Indices · Commodities
        </div>
      </div>
    ),
    size,
  )
}
