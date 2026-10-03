import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import Tracker from '../components/Tracker'
import { Avatar, Icon, Page, rise, Tabs, Reveal } from '../components/ui'
import { colorFor, fmtDate, useStore } from '../store/store'
import { Empty } from './Dashboard'

// HR reviews pending requests; managers (and admins) have the final say at either stage
const canAct = (role, status) =>
  (status === 'pending' && ['hr', 'manager', 'admin'].includes(role)) || (status === 'on-hold' && ['manager', 'admin'].includes(role))
const hrStep = (role, status) => role === 'hr' && status === 'pending' // HR approves and passes it on; others decide
const chip = { pending: ['warn', 'HR review'], 'on-hold': ['accent', 'Manager decision'], approved: ['good', 'Approved'], rejected: ['lock', 'Rejected'] }

function PromotionCard({ p, role, employee }) {
  const { actions } = useStore()
  const [open, setOpen] = useState(canAct(role, p.status))
  const [comments, setComments] = useState('')
  const [fin, setFin] = useState({ approvedPosition: p.requestedPosition, approvedSalary: p.requestedSalary || '', approvedRating: 4 })
  const [busy, setBusy] = useState(false)
  const act = async (fn) => { setBusy(true); try { await fn() } catch { /* toast */ } finally { setBusy(false) } }
  const name = employee?.name ?? `Employee #${p.employeeId}`

  return (
    <motion.div layout className="card review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
      <button className="review-head" onClick={() => setOpen(!open)}>
        <Avatar name={name} src={employee?.avatar} color={colorFor(name)} size={46} />
        <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
          <div style={{ fontWeight: 600 }}>{name} <span style={{ color: 'var(--dim)', fontWeight: 400, fontSize: 12.5 }}>· {employee?.department ?? '—'}</span></div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{p.currentPosition || '—'} <Icon name="ArrowRight" size={12} /> <b style={{ color: 'var(--text)' }}>{p.requestedPosition}</b></div>
        </div>
        <span className={`chip ${chip[p.status]?.[0]}`}>{chip[p.status]?.[1]}</span>
        <Icon name="ChevronRight" size={18} style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .3s', color: 'var(--dim)' }} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ paddingTop: 18, display: 'grid', gap: 16 }}>
              <Tracker req={p} compact />
              <div className="facts" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
                <div><Icon name="Calendar" size={15} />{fmtDate(p.submittedDate)}</div>
                <div><Icon name="Briefcase" size={15} />{(p.currentSalary || 0).toLocaleString()} → {(p.requestedSalary || 0).toLocaleString()}</div>
                <div><Icon name="Star" size={15} />{employee?.performance ? `★ ${employee.performance}` : 'No rating'}</div>
              </div>
              <p style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--muted)' }}>“{p.reason}”</p>
              {!!p.achievements.length && (
                <ul className="ach">{p.achievements.map((a, i) => <li key={i}><Icon name="Check" size={13} />{a}</li>)}</ul>
              )}
              {!!p.skills.length && <div className="tags">{p.skills.map((s) => <span key={s} className="chip accent">{s}</span>)}</div>}
              {p.hrApproval?.comments && <div className="note" style={{ marginTop: 0 }}><Icon name="ClipboardCheck" size={15} /><div><b>HR:</b> {p.hrApproval.comments}</div></div>}

              {canAct(role, p.status) && (
                <div className="decide">
                  {!hrStep(role, p.status) && (
                    <div className="form-2" style={{ gridTemplateColumns: '1.4fr 1fr 1fr' }}>
                      <div className="field"><label>Approved position</label><input className="input" value={fin.approvedPosition} onChange={(e) => setFin({ ...fin, approvedPosition: e.target.value })} /></div>
                      <div className="field"><label>Approved salary</label><input className="input" type="number" value={fin.approvedSalary} onChange={(e) => setFin({ ...fin, approvedSalary: e.target.value })} /></div>
                      <div className="field"><label>Rating ({fin.approvedRating})</label><input type="range" min="1" max="5" step="0.5" className="range" style={{ '--v': `${((fin.approvedRating - 1) / 4) * 100}%`, marginTop: 14 }} value={fin.approvedRating} onChange={(e) => setFin({ ...fin, approvedRating: +e.target.value })} /></div>
                    </div>
                  )}
                  <textarea className="input" rows={2} placeholder="Comments for the employee (optional)" value={comments} onChange={(e) => setComments(e.target.value)} />
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn ghost" disabled={busy} onClick={() => act(() => actions.rejectPromotion(p.id, comments))}><Icon name="X" size={15} />Reject</button>
                    {hrStep(role, p.status)
                      ? <button className="btn" disabled={busy} onClick={() => act(() => actions.hrReview(p.id, comments))}><Icon name="Check" size={15} />Approve & send to manager</button>
                      : <button className="btn" disabled={busy || !fin.approvedPosition} onClick={() => act(() => actions.managerApprove(p.id, { ...fin, approvedSalary: +fin.approvedSalary || 0, comments }))}><Icon name="Trophy" size={15} />Final approve</button>}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function FormationRow({ r, role }) {
  const { actions } = useStore()
  const [busy, setBusy] = useState(false)
  const act = async (fn) => { setBusy(true); try { await fn() } catch { /* toast */ } finally { setBusy(false) } }
  return (
    <motion.div layout className="card review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div className="review-head" style={{ cursor: 'var(--cursor)' }}>
        <Avatar name={r.employeeName} src={r.employeeAvatar} color={colorFor(r.employeeName)} size={46} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontWeight: 600 }}>{r.employeeName} <span style={{ color: 'var(--dim)', fontWeight: 400, fontSize: 12.5 }}>· {fmtDate(r.requestedAt)}</span></div>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>wants to join <b style={{ color: 'var(--text)' }}>{r.formationTitle}</b></div>
          <div style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 6 }}>“{r.motivation}”</div>
        </div>
        {canAct(role, r.status) ? (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn ghost" disabled={busy} onClick={() => act(() => actions.rejectFormation(r.id))} aria-label="Reject"><Icon name="X" size={15} /></button>
            <button className="btn" disabled={busy} onClick={() => act(() => (hrStep(role, r.status) ? actions.formationHrReview(r.id) : actions.formationManagerConfirm(r.id)))}>
              <Icon name="Check" size={15} />{hrStep(role, r.status) ? 'Forward' : 'Confirm'}
            </button>
          </div>
        ) : <span className={`chip ${chip[r.status]?.[0]}`}>{chip[r.status]?.[1]}</span>}
      </div>
    </motion.div>
  )
}

export default function Reviews() {
  const { state } = useStore()
  const role = state.user.role
  const [tab, setTab] = useState('promotions')
  const [scope, setScope] = useState('mine')
  const emp = new Map(state.employees.map((e) => [e.id, e]))
  const promos = state.promotions.filter((p) => scope === 'all' || canAct(role, p.status))
  const forms = state.formationRequests.filter((r) => scope === 'all' || canAct(role, r.status))
  const waitingP = state.promotions.filter((p) => canAct(role, p.status)).length
  const waitingF = state.formationRequests.filter((r) => canAct(role, r.status)).length

  return (
    <Page>
      <motion.div variants={rise} className="page-head">
        <div><div className="eyebrow">Manage · Reviews</div><Reveal text="Review queue" /><p>{role === 'hr' ? 'You review first — approved requests go to the manager for the final decision.' : role === 'manager' ? 'HR has already reviewed these. Your approval is final and updates the employee record.' : 'You can act on both stages.'}</p></div>
      </motion.div>
      <motion.div variants={rise} className="toolbar">
        <Tabs id="rv" value={tab} onChange={setTab} items={[{ value: 'promotions', label: `Promotions (${waitingP})` }, { value: 'formations', label: `Formations (${waitingF})` }]} />
        <div style={{ marginLeft: 'auto' }}><Tabs id="scope" value={scope} onChange={setScope} items={[{ value: 'mine', label: 'Needs my action' }, { value: 'all', label: 'All' }]} /></div>
      </motion.div>
      <div style={{ display: 'grid', gap: 12 }}>
        <AnimatePresence mode="popLayout">
          {tab === 'promotions'
            ? promos.map((p) => <PromotionCard key={p.id} p={p} role={role} employee={emp.get(p.employeeId)} />)
            : forms.map((r) => <FormationRow key={r.id} r={r} role={role} />)}
        </AnimatePresence>
        {(tab === 'promotions' ? promos : forms).length === 0 && <div className="card"><Empty icon="ClipboardCheck" title="All clear" text="Nothing is waiting on you right now." /></div>}
      </div>
    </Page>
  )
}
