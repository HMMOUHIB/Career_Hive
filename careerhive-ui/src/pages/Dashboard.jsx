import { motion } from 'framer-motion'
import { lazy, Suspense, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AccountsPanel } from '../components/Accounts'
import Blob from '../components/Blob'
import Cover, { TechBadge } from '../components/Cover'
import Tracker from '../components/Tracker'
import { Avatar, Counter, Icon, IconTile, Page, Reveal, rise, Tilt } from '../components/ui'
import { colorFor, fmtDate, roleLabel, useDerived, useStore } from '../store/store'
import OrgPanel from './OrgPanel'

const Mascot = lazy(() => import('../three/Mascot'))
const POSE = { student: 'laptop', hr: 'clipboard', manager: 'manager', admin: 'manager' }
const MODEL = { hr: 'mouhib', manager: 'mouhib', admin: 'mouhib' } // Rick for staff; employees get the Rick & Morty emblem

export default function Dashboard() {
  const { state, actions } = useStore()
  const d = useDerived()
  const navigate = useNavigate()
  const car = useRef(null)
  const me = state.dashboard?.me
  const u = state.user
  const focus = d.active.slice().sort((a, b) => b.progress - a.progress)[0]
  const promo = me?.promotion
  const picks = d.isStaff ? state.formations.slice(0, 3) : (me?.recommended ?? []).slice(0, 3)
  const org = state.dashboard?.org
  const waiting = (org?.queue?.promotions?.length ?? 0) + (org?.queue?.formations?.length ?? 0)

  return (
    <Page>
      <div className="dash-top">
        <motion.section variants={rise} className="hero">
          <div className="hero-canvas mascot-stage"><Suspense fallback={null}><Mascot model={MODEL[u.role] ?? 'hamzaoui'} variant={POSE[u.role] ?? 'laptop'} distance={8.2} vortex={state.theme === 'frost' ? ['#8fe3ff', '#5b7cff'] : ['#ffd166', '#ff5e8a']} accent={state.theme === 'frost' ? '#2f7bf6' : '#e8453c'} shadow={false} /></Suspense></div>
          <span className="glyph">道</span>
          <div className="hero-dots"><i className="on" /><i /><i /></div>
          <div className="hero-content">
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="pill"><Icon name="Flame" size={14} className="live" />{d.eligible ? 'Promotion ready' : 'Career path'}</span>
              <span className="round white" style={{ width: 32, height: 32 }}><Icon name="Briefcase" size={15} /></span>
              <span className="round white" style={{ width: 32, height: 32 }}><Icon name="Award" size={15} /></span>
            </div>
            {/* staff without a job title show their role; employees are asked for a position (it counts toward promotion) */}
            <Reveal key={u.position || u.role} text={u.position || (d.isStaff ? roleLabel[u.role] : 'Set your position')} delay={0.35} />
            {d.isStaff ? ( // HR and managers run formations and reviews; they don't follow the employee path
              <p>{u.department ? `${u.department} · ` : ''}{state.formations.length} formation{state.formations.length === 1 ? '' : 's'} in the catalog · {waiting} request{waiting === 1 ? '' : 's'} waiting on you.</p>
            ) : (
              <p>
                {u.department ? `${u.department} · ` : ''}{d.doneCount}/{d.requirements.length} promotion requirements met.{' '}
                {d.openRequest ? `Your request for ${d.openRequest.requestedPosition} is in review.` : d.eligible ? 'You can request your next role now.' : 'Finish your formations and certificates to unlock the next step.'}
              </p>
            )}
            <div className="hero-meta">
              <div className="stack">
                {d.contacts.slice(0, 3).map((c) => <Avatar key={c.id} name={c.name} src={c.avatar} color={colorFor(c.name)} size={34} />)}
              </div>
              {d.isStaff ? (
                <button className="btn light" onClick={() => navigate('/reviews')} style={{ padding: '9px 16px', borderRadius: 99 }}><Icon name="ClipboardCheck" size={15} />Review queue</button>
              ) : (
                <button className="btn light" onClick={() => navigate('/promotion')} style={{ padding: '9px 16px', borderRadius: 99 }}>
                  <Icon name={d.openRequest ? 'Hourglass' : d.eligible ? 'TrendingUp' : 'Lock'} size={15} />{d.openRequest ? 'Track my request' : d.eligible ? 'Request promotion' : `${d.requirements.length - d.doneCount} step${d.requirements.length - d.doneCount > 1 ? 's' : ''} left`}
                </button>
              )}
            </div>
          </div>
        </motion.section>

        <motion.div variants={rise} className="upnext">
          <div className="h-row" style={{ margin: '0 2px 2px' }}><h2 style={{ fontSize: 16 }}>{d.isStaff ? 'Latest in the catalog' : 'Recommended for you'}</h2><Link to={d.isStaff ? '/formations' : '/formations?tab=catalog'} className="more">{d.isStaff ? 'Manage' : 'Catalog'} <Icon name="ChevronRight" size={14} /></Link></div>
          {picks.map((f) => (
            <Link to={`/formations?open=${f.id}`} key={f.id} className="row-card">
              <TechBadge item={f} size={54} radius={15} />
              <div style={{ minWidth: 0 }}>
                <div className="t">{f.title}</div>
                <div className="s">{f.level} · {d.isStaff ? (f.duration || f.category || 'Formation') : `${f.enrolled} enrolled`}</div>
              </div>
              <Icon name="ChevronRight" size={18} style={{ marginLeft: 'auto', color: 'var(--dim)' }} />
            </Link>
          ))}
          {!picks.length && <div className="card" style={{ color: 'var(--muted)', fontSize: 13 }}>{d.isStaff ? 'The catalog is empty — add a formation from the Formations page.' : 'You are enrolled in every available formation.'}</div>}
        </motion.div>
      </div>

      {!d.isStaff && ( // my formations, learning and my stats are the employee's side
      <div className="dash-mid">
        <div style={{ minWidth: 0 }}>
          <div className="h-row"><h2><IconTile icon="Library" size={30} />My formations</h2><Link to="/formations" className="more">See more <Icon name="ChevronRight" size={14} /></Link></div>
          {!d.mine.length ? (
            <motion.div variants={rise} className="card empty-card">
              <IconTile icon="BookOpen" size={46} />
              <div><b>No formations yet</b><p>Request one from the catalog and it will show up here.</p></div>
              <Link to="/formations?tab=catalog" className="btn">Browse catalog <Icon name="ArrowRight" size={15} /></Link>
            </motion.div>
          ) : (
          <motion.div variants={rise} style={{ position: 'relative' }}>
            <div className="carousel" ref={car} style={{ overflowX: 'auto', scrollbarWidth: 'none' }}>
              {d.mine.slice().sort((a, b) => (a.progress >= 100) - (b.progress >= 100)).map((f, i) => (
                <Tilt key={f.id} className="f-card" onClick={() => navigate(`/formations?open=${f.formationId}`)} style={{ rotate: i === 0 ? -3 : 0 }}>
                  <Cover item={{ ...f, id: f.formationId }} variant="tile" className="art" />
                  <div className="shade" />
                  <div className="top">
                    <span className="round" style={{ width: 34, height: 34 }}><Icon name={f.progress >= 100 ? 'Check' : 'Play'} size={15} /></span>
                    <span className="chip" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}>{f.progress}%</span>
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.instructor} · {f.duration}</p>
                  <div className="bar" style={{ marginTop: 10, background: 'rgba(255,255,255,.25)' }}><div style={{ width: `${f.progress}%`, background: '#fff' }} /></div>
                </Tilt>
              ))}
            </div>
            {d.mine.length > 2 && <div className="car-fade" />}
            {d.mine.length > 3 && (
              <button className="round white car-next" onClick={() => car.current?.scrollBy({ left: 240, behavior: 'smooth' })} aria-label="Scroll"><Icon name="ChevronRight" size={18} /></button>
            )}
          </motion.div>
          )}

          <div className="h-row"><h2><IconTile icon="Rocket" tone="accent2" size={30} />Continue learning</h2><Link to="/formations" className="more">All formations <Icon name="ChevronRight" size={14} /></Link></div>
          {focus ? (
            <motion.div variants={rise} className="activity">
              <TechBadge item={{ ...focus, id: focus.formationId }} size={76} radius={18} />
              <div style={{ minWidth: 0 }}>
                <h4>{focus.title}</h4>
                <span className="tag">{focus.level} · started {fmtDate(focus.startedAt)}</span>
              </div>
              <div className="time">{focus.progress}% done<small>{Math.max(0, Math.round((parseFloat(focus.duration) || 0) * (1 - focus.progress / 100) * 10) / 10)}h left</small></div>
              <div className="acts" style={{ display: 'flex', gap: 8 }}>
                <motion.button whileTap={{ scale: 0.9 }} className="round" title="+10% progress" onClick={() => actions.setProgress(focus.id, Math.min(100, focus.progress + 10))}><Icon name="Plus" size={16} /></motion.button>
                <button className="round white" title="Open" onClick={() => navigate(`/formations?open=${focus.formationId}`)}><Icon name="ArrowUpRight" size={16} /></button>
              </div>
            </motion.div>
          ) : (
            <motion.div variants={rise} className="card empty-card">
              {d.mine.length
                ? <><IconTile icon="PartyPopper" tone="good" size={46} /><div><b>All caught up</b><p>Every formation you started is complete.</p></div></>
                : <><IconTile icon="Hourglass" tone="accent2" size={46} /><div><b>Nothing in progress</b><p>Start a formation and your progress will show up here.</p></div></>}
              <Link to="/formations?tab=catalog" className="btn ghost">Find a formation <Icon name="ArrowRight" size={15} /></Link>
            </motion.div>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div className="h-row"><h2><IconTile icon="Gauge" tone="violet" size={30} />Your statistics</h2><Link to="/skills" className="more"><Icon name="ArrowRight" size={18} /></Link></div>
          <motion.div variants={rise} className="stat-card glow-border">
            <div className="blob-wrap">
              <Blob />
              <div className="blob-center"><div><small>Learning hours</small><b><Counter value={d.hours} decimals={1} />h</b></div></div>
            </div>
            <div className="stat-trio">
              <div><div className="st-ic" style={{ background: 'var(--accent)' }}><Icon name="Sparkles" size={20} /></div><b><Counter value={me?.skills ?? 0} /></b><small>Skills</small></div>
              <div><div className="st-ic" style={{ background: 'var(--pill)', color: 'var(--pill-ink)' }}><Icon name="Award" size={20} /></div><b><Counter value={me?.certificates ?? 0} /></b><small>Certificates</small></div>
              <div><div className="st-ic" style={{ background: '#7b5cff' }}><Icon name="GraduationCap" size={20} /></div><b><Counter value={me?.learning?.completed ?? 0} /></b><small>Completed</small></div>
            </div>
          </motion.div>

          {promo && (
            <>
              <div className="h-row"><h2><IconTile icon="TrendingUp" tone="good" size={30} />Promotion request</h2><Link to="/promotion" className="more">Details <Icon name="ChevronRight" size={14} /></Link></div>
              <motion.div variants={rise} className="card">
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 14 }}>{promo.currentPosition} → <b style={{ color: 'var(--text)' }}>{promo.requestedPosition}</b></div>
                <Tracker req={promo} compact />
              </motion.div>
            </>
          )}
        </div>
      </div>
      )}

      {me?.team && (
        <motion.div variants={rise} className="card team-strip">
          <Avatar name={me.team.manager.name} src={me.team.manager.avatar} color={colorFor(me.team.manager.name)} size={48} />
          <div style={{ minWidth: 0 }}>
            <div className="eyebrow">{me.team.name} · {me.team.members} members</div>
            <div style={{ fontWeight: 600, marginTop: 4 }}>{me.team.manager.name} <span style={{ color: 'var(--dim)', fontWeight: 400 }}>· {me.team.manager.role}</span></div>
            {me.team.feedback && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>“{me.team.feedback}”</div>}
          </div>
          {me.team.rating != null && <div className="rating"><Icon name="Star" size={16} fill="currentColor" />{me.team.rating.toFixed(1)}</div>}
          <Link className="btn ghost" to="/team">Message team <Icon name="MessagesSquare" size={15} /></Link>
        </motion.div>
      )}

      {state.user.isOwner && <AccountsPanel />}
      {d.isStaff && state.dashboard?.org && <OrgPanel org={state.dashboard.org} role={state.user.role} />}
    </Page>
  )
}

export function Empty({ icon = 'Sparkles', title, text, children }) {
  return (
    <div className="empty">
      <div className="lk"><Icon name={icon} size={26} /></div>
      <b>{title}</b>
      {text && <p>{text}</p>}
      {children}
    </div>
  )
}
