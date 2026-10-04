import { Counter, Ring } from '../../components/ui'
import { useDerived, useStore } from '../../store/store'

/** The employee's own numbers, straight from their formations, certificates and skills. Nothing estimated. */
export default function Figures() {
  const { state } = useStore()
  const d = useDerived()
  const me = state.dashboard?.me
  const completed = me?.learning?.completed ?? d.completed.length
  const certificates = me?.certificates ?? state.certificates.length
  const skills = me?.skills ?? state.skills.length

  return (
    <section className="figures" aria-label="Your figures" data-reveal>
      <Figure label="Learning hours" value={<Counter value={d.hours} decimals={1} />} unit="h"
        note={d.mine.length ? `across ${d.mine.length} formation${d.mine.length === 1 ? '' : 's'}` : 'start a formation to log hours'} />
      <Figure label="Average progress" value={<Counter value={d.avgProgress} />} unit="%"
        note={`${d.active.length} in progress`}
        aside={<Ring value={d.avgProgress / 100} size={44} stroke={5} label={`${d.avgProgress}% average progress`} />} />
      <Figure label="Completed" value={<Counter value={completed} />} note={completed === 1 ? 'formation finished' : 'formations finished'} />
      <Figure label="Certificates" value={<Counter value={certificates} />} note={`${skills} skill${skills === 1 ? '' : 's'} on your profile`} />
    </section>
  )
}

function Figure({ label, value, unit, note, aside }) {
  return (
    <div className="figure">
      <div className="figure-top">
        <span className="t-label">{label}</span>
        {aside}
      </div>
      <div className="figure-value">{value}{unit && <span className="figure-unit">{unit}</span>}</div>
      <div className="figure-note">{note}</div>
    </div>
  )
}
