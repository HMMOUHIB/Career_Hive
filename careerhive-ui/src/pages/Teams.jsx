import { motion } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import Drawer from '../components/Drawer'
import { Avatar, Icon, Page, rise, Reveal } from '../components/ui'
import { colorFor, gradientFor, useStore } from '../store/store'

function Stars({ value }) {
  if (value == null) return <span style={{ fontSize: 12, color: 'var(--dim)' }}>Not rated</span>
  return (
    <span className="stars" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((i) => <Icon key={i} name="Star" size={13} fill={value >= i - 0.25 ? 'currentColor' : 'none'} />)}
      <b>{value.toFixed(1)}</b>
    </span>
  )
}

function MemberPicker({ team, value, onPick, onManual }) {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const inTeam = new Set(team.employees.flatMap((e) => [e.userId, e.name]))
  const list = state.employees
    .filter((e) => `${e.name} ${e.currentPosition} ${e.department}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (inTeam.has(a.id) || inTeam.has(a.name) ? 1 : 0) - (inTeam.has(b.id) || inTeam.has(b.name) ? 1 : 0))
  return (
    <div className="field">
      <label>Choose an employee *</label>
      <label className="mlist-search" style={{ margin: 0 }}><Icon name="Search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, position or department" autoFocus /></label>
      <div className="picker">
        {list.map((e) => {
          const taken = inTeam.has(e.id) || inTeam.has(e.name)
          return (
            <button type="button" key={e.id} disabled={taken} className={`pick ${value === e.id ? 'on' : ''}`} onClick={() => onPick(e)}>
              <Avatar name={e.name} src={e.avatar} color={colorFor(e.name)} size={38} />
              <div style={{ minWidth: 0, flex: 1, textAlign: 'left' }}>
                <b>{e.name}</b>
                <small>{e.currentPosition} · {e.department}</small>
              </div>
              {taken ? <span className="chip">In team</span> : value === e.id ? <Icon name="CircleCheck" size={18} style={{ color: 'var(--accent)' }} /> : null}
            </button>
          )
        })}
        {!list.length && <div style={{ padding: 14, fontSize: 13, color: 'var(--dim)' }}>No employee matches.</div>}
      </div>
      <button type="button" className="nlink" style={{ justifySelf: 'start' }} onClick={onManual}>Someone without an account? Add by name</button>
    </div>
  )
}

export default function Teams() {
  const { state, actions } = useStore()
  const [drawer, setDrawer] = useState(null) // {kind:'team'} | {kind:'member', team} | {kind:'feedback', member}
  const [f, setF] = useState({})
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const openD = (d, init = {}) => { setF(init); setDrawer(d) }
  const close = () => setDrawer(null)

  const save = async (e) => {
    e.preventDefault()
    if (drawer.kind === 'member' && !f.manual && !f.userId) return actions.toast('Choose an employee first', 'bad')
    try {
      if (drawer.kind === 'team') await actions.createTeam({ name: f.name, managerName: f.managerName, managerRole: f.managerRole })
      if (drawer.kind === 'member') await actions.addMember(drawer.team.id, { userId: f.userId || undefined, name: f.name, role: f.role, rating: f.rating ? +f.rating : null, completedTrainings: +f.completedTrainings || 0, skills: (f.skills ?? '').split(',').map((s) => s.trim()).filter(Boolean) })
      if (drawer.kind === 'feedback') await actions.memberFeedback(drawer.member.id, +f.rating, f.feedback)
      close()
    } catch { /* toast */ }
  }

  return (
    <Page>
      <motion.div variants={rise} className="page-head">
        <div><div className="eyebrow">Manage · Teams</div><Reveal text="Teams" /><p>{state.teams.length} teams · {state.teams.reduce((n, t) => n + t.employees.length, 0)} members</p></div>
        <button className="btn" onClick={() => openD({ kind: 'team' }, { managerRole: 'Manager' })}><Icon name="Plus" size={16} />New team</button>
      </motion.div>

      <div style={{ display: 'grid', gap: 18 }}>
        {state.teams.map((t) => {
          const rated = t.employees.filter((e) => e.rating != null)
          const avg = rated.length ? rated.reduce((s, e) => s + e.rating, 0) / rated.length : null
          return (
            <motion.section variants={rise} key={t.id} className="card team-card">
              <div className="team-head" style={{ background: gradientFor(t.id) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Avatar name={t.manager.name} src={t.manager.avatar} color="rgba(0,0,0,.25)" size={52} />
                  <div>
                    <h2 style={{ fontSize: 22, letterSpacing: '-0.02em' }}>{t.name}</h2>
                    <div style={{ fontSize: 13, opacity: 0.9 }}>{t.manager.name} · {t.manager.role}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span className="chip" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}><Icon name="Users" size={12} />{t.employees.length}</span>
                  {avg != null && <span className="chip" style={{ background: 'rgba(255,255,255,.2)', color: '#fff' }}><Icon name="Star" size={12} />{avg.toFixed(1)}</span>}
                  <button className="btn light" onClick={() => openD({ kind: 'member', team: t })}><Icon name="UserPlus" size={15} />Add member</button>
                </div>
              </div>
              <div className="member-grid">
                {t.employees.map((m, i) => (
                  <motion.div key={m.id} className="member" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} whileHover={{ y: -4 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <Avatar name={m.name} src={m.avatar} color={colorFor(m.name)} size={44} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--dim)' }}>{m.role ?? '—'}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Stars value={m.rating} />
                      <span className="chip"><Icon name="GraduationCap" size={12} />{m.completedTrainings}</span>
                    </div>
                    {m.feedback && <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.5 }}>“{m.feedback}”</p>}
                    <div className="tags" style={{ minHeight: 0 }}>{m.skills.slice(0, 4).map((s) => <span key={s} className="chip">{s}</span>)}</div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                      <button className="btn ghost" style={{ flex: 1, padding: 9, fontSize: 12.5 }} onClick={() => openD({ kind: 'feedback', member: m }, { rating: m.rating ?? 4, feedback: m.feedback ?? '' })}><Icon name="Pencil" size={13} />Feedback</button>
                      <Link to={`/team?c=${m.id}`} className="btn ghost" style={{ padding: 9 }} aria-label="Message"><Icon name="MessagesSquare" size={14} /></Link>
                    </div>
                  </motion.div>
                ))}
                {!t.employees.length && <div style={{ fontSize: 13, color: 'var(--dim)', padding: 8 }}>No members yet.</div>}
              </div>
            </motion.section>
          )
        })}
      </div>

      <Drawer open={!!drawer} onClose={close} eyebrow="Teams"
        title={drawer?.kind === 'team' ? 'New team' : drawer?.kind === 'member' ? `Add to ${drawer.team.name}` : `Feedback — ${drawer?.member?.name ?? ''}`}
        footer={<><button className="btn ghost" onClick={close}>Cancel</button><button className="btn" form="team-form">Save</button></>}>
        <form id="team-form" onSubmit={save} style={{ display: 'grid', gap: 12 }}>
          {drawer?.kind === 'team' && <>
            <div className="field"><label>Team name *</label><input className="input" required value={f.name ?? ''} onChange={on('name')} /></div>
            <div className="field"><label>Manager name *</label><input className="input" required value={f.managerName ?? ''} onChange={on('managerName')} /></div>
            <div className="field"><label>Manager role</label><input className="input" value={f.managerRole ?? ''} onChange={on('managerRole')} /></div>
          </>}
          {drawer?.kind === 'member' && !f.manual && (
            <MemberPicker team={drawer.team} value={f.userId} onPick={(e) => setF({ ...f, userId: e.id, name: e.name, role: e.currentPosition })} onManual={() => setF({ ...f, manual: true, userId: null, name: '' })} />
          )}
          {drawer?.kind === 'member' && f.manual && <>
            <button type="button" className="nlink" style={{ justifySelf: 'start' }} onClick={() => setF({ ...f, manual: false })}><Icon name="ArrowLeft" size={14} draw={false} />Pick from employee accounts</button>
            <div className="note" style={{ marginTop: 0 }}><Icon name="Info" size={15} /><div>People added by name only can't log in, chat or get notifications.</div></div>
            <div className="field"><label>Name *</label><input className="input" required value={f.name ?? ''} onChange={on('name')} /></div>
            <div className="form-2">
              <div className="field"><label>Role</label><input className="input" value={f.role ?? ''} onChange={on('role')} /></div>
              <div className="field"><label>Completed trainings</label><input className="input" type="number" min="0" value={f.completedTrainings ?? ''} onChange={on('completedTrainings')} /></div>
            </div>
            <div className="field"><label>Skills (comma separated)</label><input className="input" value={f.skills ?? ''} onChange={on('skills')} /></div>
          </>}
          {drawer?.kind === 'member' && !f.manual && f.userId && (
            <div className="field"><label>Skills (comma separated, optional)</label><input className="input" value={f.skills ?? ''} onChange={on('skills')} /></div>
          )}
          {drawer?.kind === 'feedback' && <>
            <div className="field"><label>Rating — {f.rating}</label><input type="range" min="1" max="5" step="0.5" className="range" style={{ '--v': `${((f.rating - 1) / 4) * 100}%` }} value={f.rating} onChange={on('rating')} /></div>
            <div className="field"><label>Feedback</label><textarea className="input" rows={4} value={f.feedback ?? ''} onChange={on('feedback')} /></div>
          </>}
        </form>
      </Drawer>
    </Page>
  )
}
