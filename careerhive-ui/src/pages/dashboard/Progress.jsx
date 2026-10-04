import { Link } from 'react-router-dom'
import { SkillBadge } from '../../components/SkillChip'
import Tracker from '../../components/Tracker'
import { Bar, EmptyState, Icon } from '../../components/ui'
import { skillLabel } from '../../data/techIcons'
import { useDerived, useStore } from '../../store/store'

/** Your promotion request's progress through review, or the requirements still between you and one. */
export function NextSteps() {
  const { state } = useStore()
  const d = useDerived()
  const promo = state.dashboard?.me?.promotion

  return (
    <section className="card next-steps" aria-labelledby="next-title" data-reveal>
      <div className="card-head">
        <div className="ch-text">
          <span className="eyebrow">{promo ? 'Promotion request' : 'Next steps'}</span>
          <h2 id="next-title" className="ch-title">
            {promo ? <>{promo.currentPosition} <Icon name="ArrowRight" size={14} className="inline-ic" /> {promo.requestedPosition}</> : d.eligible ? 'You’re ready to apply' : 'Toward your next role'}
          </h2>
        </div>
        <Link to="/promotion" className="more">Details <Icon name="ChevronRight" size={14} /></Link>
      </div>

      {promo && <div className="next-track"><Tracker req={promo} compact /></div>}
      {promo && <div className="eyebrow next-sub">Requirements for the next step</div>}
      <ul className="reqs" role="list">
        {d.requirements.map((r) => (
          <li key={r.key} className={r.done ? 'done' : ''}>
            <Link to={r.to} className="req-row">
              <span className="req-mark" aria-hidden="true"><Icon name={r.done ? 'Check' : 'Minus'} size={13} strokeWidth={2.4} /></span>
              <span className="req-text">
                <b>{r.label}</b>
                <small>{r.detail}</small>
              </span>
              <span className="sr-only">{r.done ? 'Done' : 'Not done yet'}</span>
              <Bar value={r.value} tone={r.done ? 'good' : undefined} label={r.label} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** Your strongest skills by mastery: declared on your profile, plus formation progress and certificates. */
export function SkillSignal() {
  const d = useDerived()
  const top = d.mastery.slice(0, 5)
  return (
    <section className="card skill-signal" aria-labelledby="skills-title" data-reveal>
      <div className="card-head">
        <div className="ch-text">
          <span className="eyebrow">Skill mastery</span>
          <h2 id="skills-title" className="ch-title">Where you’re strongest</h2>
        </div>
        <Link to="/skills" className="more">Skills <Icon name="ChevronRight" size={14} /></Link>
      </div>
      {top.length ? (
        <ul className="mastery" role="list">
          {top.map((s) => (
            <li key={s.name}>
              <SkillBadge name={s.name} size={28} />
              <span className="mastery-name">{skillLabel(s.name)}{s.certified && <Icon name="BadgeCheck" size={14} className="mastery-cert" label="Certified" />}</span>
              <Bar value={s.score / 100} label={`${skillLabel(s.name)} mastery`} />
              <span className="t-data mastery-score">{s.score}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState icon="Sparkles" title="No skills yet" text="Add skills on your profile or start a formation; mastery builds from both." compact>
          <Link to="/profile" className="btn ghost sm">Add skills</Link>
        </EmptyState>
      )}
      {top.length > 0 && <p className="t-caption mastery-note">Score out of 100: declared skill, formation progress and certificates.</p>}
    </section>
  )
}
