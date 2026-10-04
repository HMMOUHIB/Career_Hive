import { Link } from 'react-router-dom'
import { TechBadge } from '../../components/Cover'
import { Avatar, EmptyState, Icon } from '../../components/ui'
import { colorFor, useDerived, useStore } from '../../store/store'

/** Employees: formations recommended for them. Staff: the newest formations in the catalog. */
export function Recommended() {
  const { state } = useStore()
  const d = useDerived()
  const picks = d.isStaff ? state.formations.slice(0, 4) : (state.dashboard?.me?.recommended ?? []).slice(0, 4)
  return (
    <section className="card picks" aria-labelledby="picks-title" data-reveal>
      <div className="card-head">
        <div className="ch-text">
          <span className="eyebrow">{d.isStaff ? 'Catalog' : 'Recommended'}</span>
          <h2 id="picks-title" className="ch-title">{d.isStaff ? 'Latest formations' : 'Formations picked for you'}</h2>
        </div>
        <Link to={d.isStaff ? '/formations' : '/formations?tab=catalog'} className="more">{d.isStaff ? 'Manage' : 'Catalog'} <Icon name="ChevronRight" size={14} /></Link>
      </div>
      {picks.length ? (
        <ul className="pick-list" role="list">
          {picks.map((f) => (
            <li key={f.id}>
              <Link to={`/formations?open=${f.id}`} className="pick-row">
                <TechBadge item={f} size={40} radius={10} />
                <span className="pick-text">
                  <b>{f.title}</b>
                  <small>{[f.level, d.isStaff ? (f.duration || f.category) : f.enrolled != null ? `${f.enrolled} enrolled` : f.duration].filter(Boolean).join(' · ')}</small>
                </span>
                <Icon name="ArrowUpRight" size={16} className="pick-go" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon={d.isStaff ? 'Library' : 'CircleCheck'} compact
          title={d.isStaff ? 'The catalog is empty' : 'You’re enrolled in everything available'}
          text={d.isStaff ? 'Add a formation from the Formations page and it will appear here.' : 'New formations will show up here as they are added.'}>
          {d.isStaff && <Link to="/formations" className="btn sm">Add a formation</Link>}
        </EmptyState>
      )}
    </section>
  )
}

/** Your team, its manager and their latest word on you. */
export function TeamStrip() {
  const { state } = useStore()
  const team = state.dashboard?.me?.team
  if (!team) return null
  return (
    <section className="team-strip" aria-label="Your team" data-reveal>
      <Avatar name={team.manager.name} src={team.manager.avatar} color={colorFor(team.manager.name)} size={44} />
      <div className="team-text">
        <span className="eyebrow">{team.name} · {team.members} members</span>
        <b>{team.manager.name} <span className="t-muted">· {team.manager.role}</span></b>
        {team.feedback && <q>{team.feedback}</q>}
      </div>
      {team.rating != null && <div className="rating" aria-label={`Rated ${team.rating.toFixed(1)} out of 5`}><Icon name="Star" size={15} fill="currentColor" />{team.rating.toFixed(1)}</div>}
      <Link className="btn ghost" to="/team"><Icon name="MessagesSquare" size={15} />Message team</Link>
    </section>
  )
}
