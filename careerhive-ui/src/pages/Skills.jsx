import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MasteryRadar, WeeklyBars } from '../components/Charts'
import { SkillIcon } from '../components/SkillChip'
import { Bar, Counter, Icon, Page, rise, Reveal } from '../components/ui'
import { useDerived, useStore, weekLabels } from '../store/store'
import { Empty } from './Dashboard'

const TARGET = 70

export default function Skills() {
  const { state, actions } = useStore()
  const d = useDerived()
  const [sel, setSel] = useState(null)
  const [adding, setAdding] = useState('')
  const skills = d.mastery
  const active = skills.find((s) => s.name === sel) ?? skills[0]
  const avg = skills.length ? Math.round(skills.reduce((s, x) => s + x.score, 0) / skills.length) : 0
  const trends = state.dashboard?.me?.trends ?? {}
  const weekly = weekLabels(8).map((label, i) => ({ label, enrollments: trends.enrollments?.[i] ?? 0, certificates: trends.certificates?.[i] ?? 0 }))
  const radar = skills.slice(0, 8).map((s) => ({ name: s.name, score: s.score, target: TARGET }))

  const add = async (e) => {
    e.preventDefault()
    if (!adding.trim()) return
    try { await actions.addSkill(adding.trim()); setAdding('') } catch { /* toast */ }
  }

  return (
    <Page>
      <motion.div variants={rise} className="page-head">
        <div><div className="eyebrow">Career · Skills</div><Reveal text="Skills evolution" /><p>Mastery grows as you progress through formations and earn certificates. Aim for {TARGET}+ on the skills your next role needs.</p></div>
        <form onSubmit={add} className="tag-add" style={{ marginTop: 0 }}>
          <input className="input" value={adding} onChange={(e) => setAdding(e.target.value)} placeholder="Track a new skill" />
          <button className="btn" disabled={!adding.trim()}><Icon name="Plus" size={16} />Add</button>
        </form>
      </motion.div>

      <motion.div variants={rise} className="kpis">
        <div className="kpi"><small>Skills tracked</small><b><Counter value={skills.length} /></b><span className="d" style={{ color: 'var(--dim)' }}>{state.skills.length} declared by you</span></div>
        <div className="kpi"><small>Average mastery</small><b><Counter value={avg} suffix="%" /></b><span className="d" style={{ color: avg >= TARGET ? 'var(--good)' : 'var(--warn)' }}><Icon name={avg >= TARGET ? 'TrendingUp' : 'Target'} size={13} />target {TARGET}%</span></div>
        <div className="kpi"><small>Above target</small><b><Counter value={skills.filter((s) => s.score >= TARGET).length} /></b><span className="d" style={{ color: 'var(--dim)' }}>of {skills.length}</span></div>
        <div className="kpi"><small>Backed by a certificate</small><b><Counter value={skills.filter((s) => s.certified).length} /></b><span className="d" style={{ color: 'var(--dim)' }}>{state.certificates.length} certificates</span></div>
      </motion.div>

      {!skills.length ? (
        <div className="card"><Empty icon="Sparkles" title="No skills yet" text="Add a skill above or enroll in a formation — its skills are tracked automatically." /></div>
      ) : (
        <div className="skills-grid">
          <motion.div variants={rise} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className="eyebrow">Mastery map</div>
              <div className="legend"><span><i style={{ background: 'var(--chart-a)' }} />Mastery</span><span><i className="dash" style={{ background: 'var(--dim)' }} />Target {TARGET}</span></div>
            </div>
            <MasteryRadar data={radar} />
          </motion.div>

          <motion.div variants={rise} className="card">
            <div className="eyebrow" style={{ marginBottom: 12 }}>Your learning momentum · last 8 weeks</div>
            <WeeklyBars data={weekly} series={[{ key: 'enrollments', name: 'Formations started' }, { key: 'certificates', name: 'Certificates earned' }]} height={250} />
          </motion.div>
        </div>
      )}

      {!!skills.length && (
        <div className="skills-grid" style={{ marginTop: 18, gridTemplateColumns: 'minmax(0,1.3fr) minmax(0,1fr)' }}>
          <motion.div variants={rise} className="card" style={{ padding: 12 }}>
            {skills.map((s, i) => (
              <motion.div key={s.name} className={`skill-row ${active?.name === s.name ? 'sel' : ''}`} onClick={() => setSel(s.name)}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                <span className="n" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><SkillIcon name={s.name} size={16} />{s.name} {s.certified && <Icon name="BadgeCheck" size={14} style={{ color: 'var(--good)', verticalAlign: -2 }} />}</span>
                <div style={{ position: 'relative' }}>
                  <Bar value={s.score / 100} />
                  <i style={{ position: 'absolute', left: `${TARGET}%`, top: -3, bottom: -3, width: 2, borderRadius: 2, background: 'var(--dim)' }} />
                </div>
                <span className="v">{s.score}</span>
                <span className="dl">
                  <span className={`chip ${s.score >= TARGET ? 'good' : 'warn'}`} style={{ padding: '3px 8px' }}>{s.score >= TARGET ? 'On target' : `+${TARGET - s.score}`}</span>
                </span>
              </motion.div>
            ))}
          </motion.div>

          <AnimatePresence mode="wait">
            {active && (
              <motion.div key={active.name} className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <div className="eyebrow">Breakdown</div>
                <h3 style={{ fontSize: 24, letterSpacing: '-0.02em', margin: '6px 0 16px' }}>{active.name} <span style={{ color: 'var(--accent)' }}>{active.score}</span></h3>
                <div className="breakdown">
                  <div><span><Icon name="User" size={14} />Declared on your profile</span><b>{active.declared ? '+30' : '—'}</b></div>
                  {active.sources.map((src) => (
                    <div key={src.title}><span><Icon name="GraduationCap" size={14} />{src.title} <em>{src.progress}%</em></span><b>+{Math.round(src.progress * 0.6)}</b></div>
                  ))}
                  <div><span><Icon name="Award" size={14} />Matching certificate</span><b>{active.certified ? '+15' : '—'}</b></div>
                </div>
                <div className="note">
                  <Icon name="Info" size={15} />
                  <div>{active.score >= TARGET ? 'You are above target on this skill.' : active.sources.some((x) => x.progress < 100) ? 'Keep going on the formation above to raise it.' : 'Enroll in a formation that covers this skill to raise it.'}{' '}
                    <Link to={`/formations?tab=catalog&q=${encodeURIComponent(active.name)}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>Find formations →</Link></div>
                </div>
                {active.declared && active.id && (
                  <button className="btn ghost" style={{ marginTop: 14 }} onClick={() => actions.deleteSkill(active.id)}><Icon name="Trash2" size={14} />Remove from profile</button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Page>
  )
}
