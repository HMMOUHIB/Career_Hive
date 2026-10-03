import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Tracker from '../components/Tracker'
import { Bar, Icon, Page, rise, Ring, Reveal } from '../components/ui'
import { fmtDate, useDerived, useStore } from '../store/store'

const statusChip = { pending: ['warn', 'HR review'], 'on-hold': ['accent', 'Manager decision'], approved: ['good', 'Approved'], rejected: ['lock', 'Rejected'] }

function Burst() {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 6 }}>
      {Array.from({ length: 28 }).map((_, i) => (
        <motion.i key={i} style={{ position: 'absolute', left: '50%', top: '55%', width: 8, height: 14, borderRadius: 3, background: ['var(--accent)', 'var(--pill)', 'var(--accent-2)', '#fff'][i % 4] }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
          animate={{ x: Math.cos(i) * (140 + (i % 5) * 40), y: Math.sin(i * 1.7) * 160 - 60, opacity: 0, rotate: 360 + i * 20 }}
          transition={{ duration: 1.3, ease: 'easeOut' }} />
      ))}
    </div>
  )
}

export default function Promotion() {
  const { state, actions } = useStore()
  const d = useDerived()
  const u = state.user
  const [form, setForm] = useState({ requestedPosition: '', currentSalary: '', requestedSalary: '', justification: '', achievements: '', timeline: 'Next review cycle', skills: state.skills.map((s) => s.name) })
  const [busy, setBusy] = useState(false)
  const [burst, setBurst] = useState(0)
  const on = (k) => (e) => setForm({ ...form, [k]: e.target.value })
  const toggleSkill = (n) => setForm({ ...form, skills: form.skills.includes(n) ? form.skills.filter((x) => x !== n) : [...form.skills, n] })

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    try {
      await actions.requestPromotion({
        currentPosition: u.position, requestedPosition: form.requestedPosition, department: u.department,
        currentSalary: +form.currentSalary || 0, requestedSalary: +form.requestedSalary || 0,
        justification: form.justification,
        achievements: [form.achievements, ...state.certificates.map((c) => `Certificate: ${c.name}`), ...d.completed.map((f) => `Completed formation: ${f.title}`)].filter(Boolean).join('\n'),
        timeline: form.timeline, skills: form.skills,
      })
      setBurst((b) => b + 1)
      setForm({ ...form, requestedPosition: '', justification: '', achievements: '' })
    } catch { /* toast */ } finally { setBusy(false) }
  }

  const locked = !d.eligible
  const history = d.myPromotions

  return (
    <Page>
      <motion.div variants={rise} className="page-head">
        <div><div className="eyebrow">Career · Promotion</div><Reveal text="Request a promotion" /><p>Complete your formations and certificates, then send your request. HR reviews it first, then your manager makes the final call.</p></div>
      </motion.div>

      <div className="promo-grid">
        <div style={{ display: 'grid', gap: 18, alignContent: 'start', minWidth: 0 }}>
          <motion.div variants={rise} className={`card ${d.eligible ? 'glow-border' : ''}`}>
            <div className="gate">
              <Ring value={d.doneCount / d.requirements.length} size={112} stroke={10}>
                <div><b style={{ fontSize: 26 }}>{d.doneCount}/{d.requirements.length}</b><div style={{ fontSize: 11, color: 'var(--dim)' }}>unlocked</div></div>
              </Ring>
              <div style={{ minWidth: 0 }}>
                <span className={`chip ${d.eligible ? 'good' : d.openRequest ? 'warn' : 'lock'}`}>
                  <Icon name={d.eligible ? 'CircleCheck' : d.openRequest ? 'Hourglass' : 'Lock'} size={13} />
                  {d.eligible ? 'Eligible now' : d.openRequest ? 'Request in review' : 'Locked'}
                </span>
                <h3 style={{ fontSize: 20, margin: '10px 0 6px', letterSpacing: '-0.02em' }}>{d.eligible ? 'You are ready for the next step' : d.openRequest ? `${d.openRequest.requestedPosition} — in review` : 'Finish these to unlock your request'}</h3>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>Your completed formations and certificates are attached to the request automatically.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 10, marginTop: 20 }}>
              {d.requirements.map((r, i) => (
                <motion.div key={r.key} className={`req ${r.done ? 'ok' : ''}`} initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                  <div className="ck"><Icon name={r.done ? 'Check' : 'Lock'} size={16} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="t">{r.label}</div>
                    <div className="s">{r.kind} · {r.detail}</div>
                    {!r.done && <div style={{ marginTop: 8, maxWidth: 260 }}><Bar value={r.value} /></div>}
                  </div>
                  {!r.done && <Link to={r.to} className="btn ghost" style={{ padding: '8px 12px', fontSize: 12.5 }}>Go <Icon name="ArrowRight" size={14} /></Link>}
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={rise} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence>{burst > 0 && <Burst key={burst} />}</AnimatePresence>
            {locked && (
              <div className="lock-overlay">
                <div>
                  <div className="lk"><Icon name={d.openRequest ? 'Hourglass' : 'Lock'} size={28} /></div>
                  <h3 style={{ fontSize: 18 }}>{d.openRequest ? 'You already have a request in review' : 'Request form locked'}</h3>
                  <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 6, maxWidth: 320 }}>
                    {d.openRequest ? 'Track it on the right. You can send a new one once it is decided.' : `${d.requirements.length - d.doneCount} requirement${d.requirements.length - d.doneCount > 1 ? 's' : ''} left. Each one you finish unlocks part of the gate.`}
                  </p>
                </div>
              </div>
            )}
            <div className="eyebrow" style={{ marginBottom: 16 }}>Your request</div>
            <form onSubmit={submit} style={{ display: 'grid', gap: 14 }} aria-disabled={locked}>
              <div className="form-2">
                <div className="field"><label>Current position</label><input className="input" value={u.position ?? ''} disabled /></div>
                <div className="field"><label>Requested position *</label><input className="input" required value={form.requestedPosition} onChange={on('requestedPosition')} placeholder="Senior Cloud Engineer" /></div>
                <div className="field"><label>Current salary</label><input className="input" type="number" min="0" value={form.currentSalary} onChange={on('currentSalary')} placeholder="0" /></div>
                <div className="field"><label>Requested salary</label><input className="input" type="number" min="0" value={form.requestedSalary} onChange={on('requestedSalary')} placeholder="0" /></div>
              </div>
              <div className="field"><label>Why now? *</label><textarea className="input" rows={4} required value={form.justification} onChange={on('justification')} placeholder="What you have delivered and the scope you are ready to own…" /></div>
              <div className="field"><label>Key achievements (one per line)</label><textarea className="input" rows={3} value={form.achievements} onChange={on('achievements')} placeholder={'Led the cluster migration\nCut infra cost by 18%'} /></div>
              <div className="form-2">
                <div className="field"><label>Timeline</label>
                  <select className="input" value={form.timeline} onChange={on('timeline')}><option>Immediately</option><option>Next review cycle</option><option>Within 3 months</option><option>Within 6 months</option></select>
                </div>
                <div className="field"><label>Attached automatically</label>
                  <div className="input" style={{ display: 'flex', gap: 12, color: 'var(--muted)' }}><span><Icon name="Award" size={14} /> {state.certificates.length} certs</span><span><Icon name="GraduationCap" size={14} /> {d.completed.length} formations</span></div>
                </div>
              </div>
              <div className="field"><label>Skills to highlight</label>
                <div className="tags">
                  {state.skills.map((s) => (
                    <button type="button" key={s.id} className={`chip ${form.skills.includes(s.name) ? 'accent' : ''}`} onClick={() => toggleSkill(s.name)}>
                      <Icon name={form.skills.includes(s.name) ? 'Check' : 'Plus'} size={12} />{s.name}
                    </button>
                  ))}
                </div>
              </div>
              <button className="btn" disabled={locked || busy} style={{ justifySelf: 'start', padding: '13px 22px' }}>
                {busy ? 'Sending…' : 'Send to HR'} <Icon name="Send" size={15} />
              </button>
            </form>
          </motion.div>
        </div>

        <div style={{ display: 'grid', gap: 18, alignContent: 'start', minWidth: 0 }}>
          {d.openRequest && (
            <motion.div variants={rise} className="card">
              <div className="eyebrow" style={{ marginBottom: 6 }}>Live status</div>
              <h3 style={{ fontSize: 17, marginBottom: 18 }}>{d.openRequest.currentPosition} → {d.openRequest.requestedPosition}</h3>
              <Tracker req={d.openRequest} />
              {d.openRequest.hrApproval?.comments && (
                <div className="note"><Icon name="MessagesSquare" size={15} /><div><b>HR:</b> {d.openRequest.hrApproval.comments}</div></div>
              )}
            </motion.div>
          )}
          <motion.div variants={rise} className="card">
            <div className="eyebrow" style={{ marginBottom: 6 }}>History</div>
            {!history.length && <div style={{ fontSize: 13, color: 'var(--muted)', padding: '14px 0' }}>No promotion requests yet.</div>}
            {history.map((p) => (
              <div key={p.id} className="hist" style={{ alignItems: 'flex-start' }}>
                <div className="thumb" style={{ width: 42, height: 42, borderRadius: 13, background: p.status === 'approved' ? 'var(--good)' : p.status === 'rejected' ? 'var(--dim)' : 'var(--accent)' }}>
                  <Icon name={p.status === 'approved' ? 'Trophy' : p.status === 'rejected' ? 'X' : 'Hourglass'} size={18} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.requestedPosition}</div>
                  <div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 2 }}>Submitted {fmtDate(p.submittedDate)}</div>
                  {p.status === 'approved' && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Approved as <b>{p.approvedPosition}</b>{p.approvedSalary ? ` · ${p.approvedSalary.toLocaleString()} ` : ''}{p.approvedRating ? ` · ★ ${p.approvedRating}` : ''}</div>}
                  {(p.managerApproval?.comments || p.hrApproval?.comments) && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>“{p.managerApproval?.comments || p.hrApproval?.comments}”</div>}
                </div>
                <span className={`chip ${statusChip[p.status]?.[0]}`}>{statusChip[p.status]?.[1] ?? p.status}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </Page>
  )
}
