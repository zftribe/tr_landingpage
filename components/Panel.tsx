'use client'

import { useEffect, useRef } from 'react'

/**
 * A modal panel on the native <dialog>: the browser handles Esc, focus
 * trapping and returning focus to whatever opened it. Closing removes it, so
 * anything inside (a playing video) stops.
 */
export function Panel({ eyebrow, title, onClose, children }: {
  eyebrow: string
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = ref.current
    d?.showModal()
    return () => d?.close()
  }, [])

  // A click on the backdrop lands outside the dialog's box.
  const closeOutside = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect()
    if (r && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) onClose()
  }

  return (
    <dialog ref={ref} className="cd" aria-labelledby="cd-title" onClose={onClose} onClick={closeOutside}>
      <div className="cd-head">
        <div>
          <p className="qz-eyebrow">{eyebrow}</p>
          <h3 id="cd-title">{title}</h3>
        </div>
        <button type="button" className="cd-close" onClick={onClose} aria-label={`Close ${eyebrow.toLowerCase()}`}>✕</button>
      </div>
      {children}
    </dialog>
  )
}
