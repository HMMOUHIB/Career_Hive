import { useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Cover, { TechBadge } from '../../components/Cover'
import { Bar, EmptyState, Icon, SectionHead, Tilt } from '../../components/ui'
import { fmtDate, useDerived, useStore } from '../../store/store'

const hoursLeft = (f) => Math.max(0, Math.round((parseFloat(f.duration) || 0) * (1 - f.progress / 100) * 10) / 10)

/** The formation you're furthest along in, then the others still in progress. */
export function ContinueLearning() {
  const { actions } = useStore()
  const d = useDerived()
  const navigate = useNavigate()
  const active = d.active.slice().sort((a, b) => b.progress - a.progress)
  const [focus, ...rest] = active

  return (
    <section className="card learning" aria-labelledby="learn-title" data-reveal>
      <div className="card-head">
        <div className="ch-text">
          <span className="eyebrow">Continue learning</span>
          <h2 id="learn-title" className="ch-title">{focus ? 'Pick up where you left off' : 'Nothing in progress'}</h2>
        </div>
        <Link to="/formations" className="more">All formations <Icon name="ChevronRight" size={14} /></Link>
      </div>

      {focus ? (
        <>
          <div className="focus">
            <TechBadge item={{ ...focus, id: focus.formationId }} size={64} radius={14} />
            <div className="focus-main">
              <h3 className="t-h3">{focus.title}</h3>
              <p className="t-caption">{[focus.level, focus.instructor, `started ${fmtDate(focus.startedAt)}`].filter(Boolean).join(' · ')}</p>
              <div className="focus-progress">
                <Bar value={focus.progress / 100} label={`${focus.title} progress`} />
                <span className="t-data"><b>{focus.progress}%</b> · {hoursLeft(focus)}h left</span>
              </div>
            </div>
            <div className="focus-actions">
              <button type="button" className="btn ghost sm" onClick={() => actions.setProgress(focus.id, Math.min(100, focus.progress + 10))} title="Log 10% more progress">
                <Icon name="Plus" size={14} />10%
              </button>
              <button type="button" className="btn sm" onClick={() => navigate(`/formations?open=${focus.formationId}`)}>
                Resume <Icon name="ArrowUpRight" size={14} />
              </button>
            </div>
          </div>
          {rest.length > 0 && (
            <ul className="queue" role="list" aria-label="Also in progress">
              {rest.slice(0, 3).map((f) => (
                <li key={f.id}>
                  <Link to={`/formations?open=${f.formationId}`} className="queue-row">
                    <TechBadge item={{ ...f, id: f.formationId }} size={32} radius={8} />
                    <span className="queue-title">{f.title}</span>
                    <Bar value={f.progress / 100} label={`${f.title} progress`} />
                    <span className="t-data queue-pct">{f.progress}%</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : d.mine.length ? (
        <EmptyState icon="PartyPopper" title="All caught up" text="Every formation you started is complete. Pick the next one from the catalog." compact>
          <Link to="/formations?tab=catalog" className="btn ghost sm">Browse catalog</Link>
        </EmptyState>
      ) : (
        <EmptyState icon="BookOpen" title="No formations yet" text="Request one from the catalog; once it's approved, your progress shows up here." compact>
          <Link to="/formations?tab=catalog" className="btn sm">Browse catalog</Link>
        </EmptyState>
      )}
    </section>
  )
}

/** Every formation you're enrolled in, as covers you can scroll through. */
export function FormationShelf() {
  const d = useDerived()
  const navigate = useNavigate()
  const track = useRef(null)
  if (!d.mine.length) return null
  const list = d.mine.slice().sort((a, b) => (a.progress >= 100) - (b.progress >= 100))
  const step = (dir) => {
    const el = track.current
    const card = el?.firstElementChild
    el?.scrollBy({ left: dir * ((card?.offsetWidth ?? 240) + 16), behavior: 'smooth' })
  }

  return (
    <section className="shelf" aria-labelledby="shelf-title" data-reveal>
      <SectionHead id="shelf-title" kicker={`${list.length} enrolled`} title="My formations">
        <div className="shelf-nav">
          <button type="button" className="icon-btn" onClick={() => step(-1)} aria-label="Scroll back"><Icon name="ChevronLeft" size={17} /></button>
          <button type="button" className="icon-btn" onClick={() => step(1)} aria-label="Scroll forward"><Icon name="ChevronRight" size={17} /></button>
        </div>
      </SectionHead>
      <div className="shelf-track" ref={track} role="list">
        {list.map((f) => (
          <div role="listitem" key={f.id} className="shelf-item">
            <Tilt className="f-card" onClick={() => navigate(`/formations?open=${f.formationId}`)} label={`${f.title}, ${f.progress}% complete`}>
              <Cover item={{ ...f, id: f.formationId }} variant="tile" className="art" />
              <div className="shade" />
              <div className="top">
                <span className={`chip glass`}>{f.progress >= 100 ? <><Icon name="Check" size={12} />Done</> : `${f.progress}%`}</span>
              </div>
              <h3>{f.title}</h3>
              <p>{[f.instructor, f.duration].filter(Boolean).join(' · ')}</p>
              <div className="f-bar"><i style={{ transform: `scaleX(${f.progress / 100})` }} /></div>
            </Tilt>
          </div>
        ))}
      </div>
    </section>
  )
}
