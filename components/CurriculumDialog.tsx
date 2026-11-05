import type { CurriculumCourse } from '@/lib/lms'
import { Panel } from './Panel'

const hours = (mins: number) => (mins >= 60 ? `${Math.round((mins / 60) * 10) / 10} hours` : `${mins} minutes`)

/** A product's lessons, course by course. */
export function CurriculumDialog({ name, courses, onClose }: { name: string; courses: CurriculumCourse[]; onClose: () => void }) {
  return (
    <Panel eyebrow="Curriculum" title={name} onClose={onClose}>
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
    </Panel>
  )
}
