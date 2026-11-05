'use client'

import { useEffect, useRef } from 'react'
import type { CurriculumCourse } from '@/lib/lms'

const hours = (mins: number) => (mins >= 60 ? `${Math.round((mins / 60) * 10) / 10} hours` : `${mins} minutes`)

/**
 * A product's lessons, course by course. A native <dialog>: the browser
 * handles Esc, focus trapping and returning focus to the button that opened it.
 */
export function CurriculumDialog({ name, courses, onClose }: { name: string; courses: CurriculumCourse[]; onClose: () => void }) {
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
          <p className="qz-eyebrow">Curriculum</p>
          <h3 id="cd-title">{name}</h3>
        </div>
        <button type="button" className="cd-close" onClick={onClose} aria-label="Close curriculum">✕</button>
      </div>
      {courses.map((c) => {
        const total = c.lessons.reduce((n, l) => n + (l.durationMinutes || 0), 0)
        return (
          <section key={c.id} className="cd-course">
            <h4>{c.title}</h4>
            <p className="cd-meta">
              {c.lessons.length} lessons{total > 0 && ` · about ${hours(total)}`} · recorded, yours to keep
            </p>
            <ol className="cd-lessons">
              {c.lessons.map((l) => (
                <li key={l.order}>
                  <span>{l.title}</span>
                  {l.durationMinutes ? <span className="cd-dur">{l.durationMinutes} min</span> : null}
                </li>
              ))}
            </ol>
          </section>
        )
      })}
    </dialog>
  )
}
