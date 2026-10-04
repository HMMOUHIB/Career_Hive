import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Counter, Icon, Reveal } from '../../components/ui'
import { DUR, EASE, gsap, reducedMotion, useGSAP } from '../../motion/gsap'
import { roleLabel, useDerived, useStore } from '../../store/store'
import MascotStage from './MascotStage'

const POSE = { student: 'laptop', hr: 'clipboard', manager: 'manager', admin: 'manager' }
const MODEL = { hr: 'mouhib', manager: 'mouhib', admin: 'mouhib' } // Rick for staff; employees get the Rick & Morty emblem

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening' }
const today = () => new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`

/**
 * The command area: who you are here, the one signal that matters most for your role, and the action it calls for.
 * Employees: promotion readiness (the real requirement checks, each with its partial progress).
 * HR / managers: the requests waiting on them.
 *
 * Motion — Purpose: the signal fills after the title has landed, so it reads as the conclusion.
 * Trigger: mount. Segments fill left to right (DUR.slow, EASE.out, .08s apart, after .45s).
 * The mascot stage drifts up slightly as the page scrolls (desktop, scrub). Reduced motion: static.
 */
export default function Command() {
  const { state } = useStore()
  const d = useDerived()
  const u = state.user
  const ref = useRef(null)
  const title = u.position || roleLabel[u.role] || 'Employee' // without a job title, the title is the role

  useGSAP(() => {
    if (reducedMotion()) return
    gsap.fromTo('.seg > i', { scaleX: 0 }, { scaleX: (_, el) => Number(el.dataset.v) || 0, duration: DUR.slow, ease: EASE.out, stagger: 0.08, delay: 0.45 })
    gsap.from('.command-stage', { autoAlpha: 0, scale: 0.96, duration: DUR.slow + 0.3, ease: EASE.out, delay: 0.1 })
    const mm = gsap.matchMedia()
    mm.add('(min-width: 821px)', () => {
      gsap.to('.command-stage', { yPercent: -10, ease: 'none', scrollTrigger: { trigger: ref.current, start: 'top top', end: 'bottom top', scrub: 0.6 } })
    })
  }, { scope: ref, dependencies: [d.doneCount] })

  return (
    <section ref={ref} className="command" aria-labelledby="command-title" data-reveal>
      <div className="command-copy">
        <div className="eyebrow">{greeting()}, {u.firstName} · {today()}</div>
        <Reveal key={title} as="h1" text={title} className="command-title" delay={0.15} />
        <p className="command-sub">
          {[u.department, d.myTeam?.name, roleLabel[u.role]].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' · ')}
        </p>
        <span id="command-title" className="sr-only">Your dashboard</span>
        {d.isStaff ? <StaffSignal /> : <ReadinessSignal />}
      </div>
      <MascotStage className="command-stage" model={MODEL[u.role] ?? 'hamzaoui'} variant={POSE[u.role] ?? 'laptop'} />
      <span className="glyph command-glyph" aria-hidden="true">道</span>
    </section>
  )
}

function ReadinessSignal() {
  const d = useDerived()
  const left = d.requirements.length - d.doneCount
  const status = d.openRequest
    ? `Your request for ${d.openRequest.requestedPosition} is in review.`
    : d.eligible ? 'Every requirement is met. You can request your next role now.'
    : `${plural(left, 'requirement')} left before you can request your next role.`
  const cta = d.openRequest ? { label: 'Track my request', icon: 'Hourglass' } : d.eligible ? { label: 'Request promotion', icon: 'TrendingUp' } : { label: 'See what’s left', icon: 'ListChecks' }
  return (
    <div className="signal" aria-label="Promotion readiness">
      <div className="signal-head">
        <span className="t-label">Promotion readiness</span>
        <span className={`signal-state ${d.openRequest ? 'review' : d.eligible ? 'ready' : ''}`}>
          {d.openRequest ? 'In review' : d.eligible ? 'Ready' : 'Building'}
        </span>
      </div>
      <div className="signal-figure" aria-label={`${d.doneCount} of ${d.requirements.length} requirements met`}>
        <b><Counter value={d.doneCount} /></b><span>/ {d.requirements.length}</span>
        <small>requirements met</small>
      </div>
      <ol className="signal-steps" role="list">
        {d.requirements.map((r) => (
          <li key={r.key} className={r.done ? 'done' : ''}>
            <span className="seg"><i data-v={r.value} style={{ transform: `scaleX(${r.value})` }} /></span>
            <Link to={r.to} className="seg-label" title={r.detail}>
              <Icon name={r.done ? 'Check' : 'Circle'} size={12} strokeWidth={2.4} />{r.kind}
            </Link>
          </li>
        ))}
      </ol>
      <p className="signal-text">{status}</p>
      <div className="signal-actions">
        <Link to="/promotion" className="btn"><Icon name={cta.icon} size={16} />{cta.label}</Link>
        <Link to="/formations" className="btn quiet">My formations <Icon name="ArrowRight" size={15} /></Link>
      </div>
    </div>
  )
}

function StaffSignal() {
  const { state } = useStore()
  const org = state.dashboard?.org
  const promos = org?.queue?.promotions?.length ?? 0
  const forms = org?.queue?.formations?.length ?? 0
  const waiting = promos + forms
  return (
    <div className="signal" aria-label="Requests waiting on you">
      <div className="signal-head">
        <span className="t-label">Waiting on you</span>
        <span className={`signal-state ${waiting ? 'review' : 'ready'}`}>{waiting ? 'Needs a decision' : 'Inbox zero'}</span>
      </div>
      <div className="signal-figure">
        <b><Counter value={waiting} /></b>
        <small>{waiting === 1 ? 'request' : 'requests'} to review</small>
      </div>
      <ul className="signal-split" role="list">
        <li><Icon name="TrendingUp" size={15} /><b className="t-data">{promos}</b> {promos === 1 ? 'promotion' : 'promotions'}</li>
        <li><Icon name="GraduationCap" size={15} /><b className="t-data">{forms}</b> {forms === 1 ? 'formation request' : 'formation requests'}</li>
        <li><Icon name="Library" size={15} /><b className="t-data">{state.formations.length}</b> in the catalog</li>
      </ul>
      <div className="signal-actions">
        <Link to="/reviews" className="btn"><Icon name="ClipboardCheck" size={16} />Open review queue</Link>
        <Link to="/formations" className="btn quiet">Manage catalog <Icon name="ArrowRight" size={15} /></Link>
      </div>
    </div>
  )
}
