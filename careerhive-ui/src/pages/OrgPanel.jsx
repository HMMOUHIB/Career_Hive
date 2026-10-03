import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { weekLabels, WeeklyBars } from '../components/Charts'
import { SkillBadge } from '../components/SkillChip'
import { Avatar, CardHead, Counter, Icon, IconTile, rise } from '../components/ui'
import { skillLabel } from '../data/techIcons'
import { colorFor, fmtDate } from '../store/store'

// each status keeps its colour and an icon, so it never reads by colour alone
const STATUS = [
  { key: 'pending', label: 'HR review', color: 'var(--warn)', icon: 'Clock' },
  { key: 'on-hold', label: 'Manager', color: 'var(--accent-2)', icon: 'UserCheck' },
  { key: 'approved', label: 'Approved', color: 'var(--good)', icon: 'CircleCheck' },
  { key: 'rejected', label: 'Rejected', color: 'var(--bad)', icon: 'CircleX' },
]

function Pipeline({ title, icon, counts }) {
  const total = STATUS.reduce((s, x) => s + (counts[x.key] ?? 0), 0)
  return (
    <div className="pipeline">
      <div className="pipe-head">
        <IconTile icon={icon} size={30} soft />
        <b>{title}</b>
        <span className="pipe-total">{total ? `${total} total` : 'None yet'}</span>
      </div>
      <div className="pipe">
        {STATUS.map((s) => counts[s.key] ? (
          <motion.div key={s.key} initial={{ flexGrow: 0 }} animate={{ flexGrow: counts[s.key] / total }} transition={{ duration: 1 }} style={{ background: s.color }} title={`${s.label}: ${counts[s.key]}`} />
        ) : null)}
      </div>
      <div className="pipe-legend">
        {STATUS.map((s) => <span key={s.key}><Icon name={s.icon} size={13} style={{ color: s.color }} />{s.label} <b>{counts[s.key] ?? 0}</b></span>)}
      </div>
    </div>
  )
}

export default function OrgPanel({ org, role }) {
  const t = org.totals
  const rate = t.enrollments ? Math.round((t.completedEnrollments / t.enrollments) * 100) : 0
  const trend = weekLabels(8).map((label, i) => ({ label, enrollments: org.trends.enrollments?.[i] ?? 0, certificates: org.trends.certificates?.[i] ?? 0 }))
  const maxSkill = Math.max(1, ...org.topSkills.map((s) => s.count))
  const queue = [...org.queue.promotions.map((q) => ({ ...q, kind: 'Promotion', what: `${q.currentPosition} → ${q.requestedPosition}` })), ...org.queue.formations.map((q) => ({ ...q, kind: 'Formation', what: q.formation }))]

  return (
    <>
      <div className="h-row" style={{ marginTop: 34 }}>
        <h2><IconTile icon="Building2" size={30} />Organisation</h2>
        <Link to="/reviews" className="more">Review queue <Icon name="ChevronRight" size={14} /></Link>
      </div>
      <motion.div variants={rise} className="kpis">
        <div className="kpi"><div className="kpi-top"><small>Employees</small><IconTile icon="Users" size={34} /></div><b><Counter value={t.employees} /></b><span className="d" style={{ color: 'var(--dim)' }}>{t.teams} teams · {t.users} accounts</span></div>
        <div className="kpi"><div className="kpi-top"><small>Enrollments</small><IconTile icon="GraduationCap" tone="b" size={34} /></div><b><Counter value={t.enrollments} /></b><span className="d">{rate}% completed</span></div>
        <div className="kpi"><div className="kpi-top"><small>Certificates</small><IconTile icon="Award" tone="warn" size={34} /></div><b><Counter value={t.certificates} /></b><span className="d" style={{ color: 'var(--dim)' }}>{t.catalog} formations in catalog</span></div>
        <div className="kpi"><div className="kpi-top"><small>Avg team rating</small><IconTile icon="Star" tone="violet" size={34} /></div><b>{t.avgRating ?? '—'}</b><span className="d" style={{ color: 'var(--dim)' }}>avg progress {t.avgProgress}%</span></div>
      </motion.div>

      <div className="org-grid">
        <motion.div variants={rise} className="card">
          <CardHead icon="ChartColumn" title="Weekly activity" sub="Enrollments and certificates, last 8 weeks" />
          <WeeklyBars data={trend} series={[{ key: 'enrollments', name: 'Enrollments' }, { key: 'certificates', name: 'Certificates' }]} />
        </motion.div>

        <motion.div variants={rise} className="card">
          <CardHead icon="Workflow" tone="accent2" title="Requests pipeline" sub="Where every request stands" />
          <div style={{ display: 'grid', gap: 20 }}>
            <Pipeline title="Promotion requests" icon="TrendingUp" counts={org.promotionPipeline} />
            <Pipeline title="Formation requests" icon="GraduationCap" counts={org.formationPipeline} />
          </div>
        </motion.div>

        <motion.div variants={rise} className="card">
          <CardHead icon="Inbox" tone="accent2" title={`Waiting on ${role === 'hr' ? 'HR' : role === 'manager' ? 'you' : 'review'}`} sub="Requests that need a decision">
            <span className="chip accent">{queue.length}</span>
          </CardHead>
          {queue.length === 0 && (
            <div className="mini-empty"><IconTile icon="CheckCheck" tone="good" size={34} soft /><div><b>Inbox zero</b><small>Nothing is waiting for your decision.</small></div></div>
          )}
          {queue.slice(0, 5).map((q) => (
            <Link to="/reviews" key={q.kind + q.id} className="hist">
              <Avatar name={q.employee} src={q.photo} color={colorFor(q.employee)} size={38} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{q.employee}</div>
                <div className="q-what"><span className="q-kind"><Icon name={q.kind === 'Promotion' ? 'TrendingUp' : 'GraduationCap'} size={12} />{q.kind}</span> · {q.what}</div>
              </div>
              <small className="q-date"><Icon name="Clock" size={11} />{fmtDate(q.date)}</small>
            </Link>
          ))}
        </motion.div>

        <motion.div variants={rise} className="card">
          <CardHead icon="Sparkles" tone="violet" title="Top skills" sub="Across the company" />
          {org.topSkills.map((s) => (
            <div key={s.name} className="hbar with-icon">
              <span className="hbar-name"><SkillBadge name={s.name} size={28} /><em>{skillLabel(s.name)}</em></span>
              <div className="bar"><motion.div initial={{ width: 0 }} animate={{ width: `${(s.count / maxSkill) * 100}%` }} transition={{ duration: 1 }} /></div>
              <b>{s.count}</b>
            </div>
          ))}
          <div style={{ height: 22 }} />
          <CardHead icon="Building2" tone="b" title="Employees by department" sub="Headcount per department" />
          {org.departments.map((s) => (
            <div key={s.name} className="hbar b">
              <span>{s.name}</span>
              <div className="bar"><motion.div initial={{ width: 0 }} animate={{ width: `${(s.count / Math.max(...org.departments.map((x) => x.count))) * 100}%` }} transition={{ duration: 1 }} /></div>
              <b>{s.count}</b>
            </div>
          ))}
        </motion.div>
      </div>
    </>
  )
}
