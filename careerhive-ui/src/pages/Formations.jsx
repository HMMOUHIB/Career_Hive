import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Cover, { TechBadge } from '../components/Cover'
import CourseContent from '../components/CourseContent'
import Drawer from '../components/Drawer'
import { iconValue, PICKER, resolveIcon } from '../data/techIcons'
import { SkillChip } from '../components/SkillChip'
import { Bar, CardHead, Icon, Page, rise, Ring, Tabs, Reveal } from '../components/ui'
import { fmtDate, useDerived, useStore } from '../store/store'
import { Empty } from './Dashboard'

const LEVELS = ['Débutant', 'Intermédiaire', 'Avancé']
const reqChip = { pending: ['warn', 'HR review'], 'on-hold': ['accent', 'Manager'], approved: ['good', 'Approved'], rejected: ['lock', 'Rejected'] }

function ProgressControl({ row }) {
  const { actions } = useStore()
  const [v, setV] = useState(row.progress)
  const commit = (p) => { setV(p); if (p !== row.progress) actions.setProgress(row.id, p).catch(() => setV(row.progress)) }
  return (
    <div className="card" style={{ display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        <Ring value={v / 100} size={92} stroke={9}><b style={{ fontSize: 20 }}>{v}%</b></Ring>
        <div>
          <b style={{ fontSize: 15 }}>{v >= 100 ? 'Completed' : 'Your progress'}</b>
          <div style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 4 }}>Saved to your record · status “{v >= 100 ? 'Terminée' : 'En cours'}”</div>
        </div>
      </div>
      <input type="range" min="0" max="100" step="5" value={v} className="range" style={{ '--v': `${v}%` }}
        onChange={(e) => setV(+e.target.value)} onPointerUp={(e) => commit(+e.currentTarget.value)} onKeyUp={(e) => commit(+e.currentTarget.value)} aria-label="Progress" />
      <div className="milestones">
        {[25, 50, 75, 100].map((m) => (
          <motion.button key={m} whileTap={{ scale: 0.92 }} className={`ms ${v >= m ? 'on' : ''}`} onClick={() => commit(m)}>
            <Icon name={v >= m ? 'Check' : m === 100 ? 'Trophy' : 'CircleDot'} size={15} />{m === 100 ? 'Finish' : `${m}%`}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

function FormationDrawer({ id, onClose }) {
  const { state, actions } = useStore()
  const d = useDerived()
  const f = state.formations.find((x) => x.id === id)
  const row = d.mine.find((m) => m.formationId === id)
  const request = (state.dashboard?.me?.formationRequests ?? []).find((r) => r.title === f?.title && r.status !== 'rejected')
  const [motivation, setMotivation] = useState('')
  const [assignee, setAssignee] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const hasContent = (state.resources[id]?.length ?? 0) > 0
  if (!f) return null

  const ask = async (e) => {
    e.preventDefault(); setBusy(true)
    try { await actions.requestFormation(f.id, motivation); setMotivation('') } catch { /* toast */ } finally { setBusy(false) }
  }
  const remove = async () => {
    setBusy(true)
    try { await actions.deleteFormation(f.id); onClose() } catch { setBusy(false) }
  }
  return (
    <Drawer open wide onClose={onClose} art={<Cover item={f} variant="drawer" />} title={f.title} eyebrow={`${f.category || 'Formation'} · ${f.level}`}>
      <div className="facts">
        <div><Icon name="Clock" size={15} />{f.duration || '—'}</div>
        <div><Icon name="User" size={15} />{f.instructor || '—'}</div>
        <div><Icon name="Gauge" size={15} />{f.level}</div>
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--muted)', lineHeight: 1.7 }}>{f.description}</p>
      {!!f.skills.length && <div className="tags">{f.skills.map((s) => <SkillChip key={s} name={s} />)}</div>}

      {d.isStaff ? null : row ? ( // HR and managers run the catalog; only employees enroll
        <>
          <div className="eyebrow" style={{ marginTop: 8 }}>Enrolled {fmtDate(row.startedAt)}</div>
          {hasContent ? (
            <div className="card auto-progress">
              <Ring value={row.progress / 100} size={72} stroke={8}><b style={{ fontSize: 16 }}>{row.progress}%</b></Ring>
              <div><b style={{ fontSize: 14.5 }}>{row.progress >= 100 ? 'Completed' : 'Your progress'}</b>
                <div style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 4 }}>Updates as you finish videos and files below.</div></div>
            </div>
          ) : <ProgressControl key={row.id} row={row} />}
        </>
      ) : request ? (
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 10 }}>Enrollment request</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13.5 }}>Sent {fmtDate(request.requestedAt)}</span>
            <span className={`chip ${reqChip[request.status]?.[0]}`}>{reqChip[request.status]?.[1]}</span>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--dim)', marginTop: 10 }}>HR reviews first, then your manager confirms and the formation appears in “My formations”.</p>
        </div>
      ) : (
        <form className="card" onSubmit={ask} style={{ display: 'grid', gap: 12 }}>
          <div className="eyebrow">Request enrollment</div>
          <textarea className="input" rows={3} required value={motivation} onChange={(e) => setMotivation(e.target.value)} placeholder="Why this formation, and how it helps your role…" />
          <button className="btn" disabled={busy || !motivation.trim()} style={{ justifySelf: 'start' }}>{busy ? 'Sending…' : 'Send request'} <Icon name="Send" size={15} /></button>
        </form>
      )}

      <CourseContent fid={f.id} enrolled={!!row} />

      {d.isStaff && (
        <div className="card" style={{ display: 'grid', gap: 12 }}>
          <CardHead icon="Settings2" tone="accent2" title="Manage" sub="Assign it to an employee, or remove it from the catalog" />
          <div style={{ display: 'flex', gap: 8 }}>
            <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Assign to an employee…</option>
              {state.employees.map((e) => <option key={e.id} value={e.id}>{e.name} — {e.currentPosition}</option>)}
            </select>
            <button className="btn" disabled={!assignee} onClick={() => actions.assignFormation(f.id, +assignee).then(() => setAssignee('')).catch(() => {})}><Icon name="UserPlus" size={15} />Assign</button>
          </div>
          {confirmDelete ? (
            <div className="danger-confirm">
              <Icon name="TriangleAlert" size={17} />
              <span>Remove “{f.title}”? Its course content and every employee's progress in it are deleted too.</span>
              <button className="btn ghost" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button className="btn danger" disabled={busy} onClick={remove}><Icon name="Trash2" size={15} />{busy ? 'Removing…' : 'Remove'}</button>
            </div>
          ) : (
            <button className="btn ghost" style={{ justifySelf: 'start' }} onClick={() => setConfirmDelete(true)}><Icon name="Trash2" size={15} />Remove formation</button>
          )}
        </div>
      )}
    </Drawer>
  )
}

function NewFormation({ open, onClose }) {
  const { actions } = useStore()
  const blank = { title: '', description: '', duration: '', instructor: '', level: 'Intermédiaire', category: '', skills: '', iconUrl: '' }
  const [f, setF] = useState(blank)
  const on = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const save = async (e) => {
    e.preventDefault()
    try { await actions.createFormation({ ...f, skills: f.skills.split(',').map((s) => s.trim()).filter(Boolean) }); setF(blank); onClose() } catch { /* toast */ }
  }
  return (
    <Drawer open={open} onClose={onClose} title="New formation" eyebrow="Catalog"
      footer={<><button className="btn ghost" onClick={onClose}>Cancel</button><button className="btn" form="new-f">Create</button></>}>
      <form id="new-f" onSubmit={save} style={{ display: 'grid', gap: 12 }}>
        <div className="field"><label>Title *</label><input className="input" required value={f.title} onChange={on('title')} /></div>
        <div className="field"><label>Description</label><textarea className="input" rows={3} value={f.description} onChange={on('description')} /></div>
        <div className="form-2">
          <div className="field"><label>Duration</label><input className="input" value={f.duration} onChange={on('duration')} placeholder="12h" /></div>
          <div className="field"><label>Instructor</label><input className="input" value={f.instructor} onChange={on('instructor')} /></div>
          <div className="field"><label>Level</label><select className="input" value={f.level} onChange={on('level')}>{LEVELS.map((l) => <option key={l}>{l}</option>)}</select></div>
          <div className="field"><label>Category</label><input className="input" value={f.category} onChange={on('category')} placeholder="Cloud" /></div>
        </div>
        <div className="field"><label>Skills (comma separated)</label><input className="input" value={f.skills} onChange={on('skills')} placeholder="AWS, Terraform" /></div>
        <div className="field">
          <label>Icon — {f.iconUrl ? resolveIcon(f).title : `auto (${resolveIcon(f).title})`}</label>
          <div className="icon-picker">
            {PICKER.map((i) => (
              <button type="button" key={i.title} title={i.title} className={f.iconUrl === iconValue(i) ? 'on' : ''} onClick={() => setF({ ...f, iconUrl: f.iconUrl === iconValue(i) ? '' : iconValue(i) })}>
                <TechBadge item={{ iconUrl: iconValue(i), title: i.title }} size={38} radius={11} />
              </button>
            ))}
          </div>
          <input className="input" value={f.iconUrl.startsWith('mark:') ? '' : f.iconUrl} onChange={on('iconUrl')} placeholder="…or paste an image URL" />
        </div>
        <Cover item={{ ...f, id: f.title || 'new' }} variant="card" style={{ borderRadius: 18 }}><span className="chip glass">Preview</span></Cover>
      </form>
    </Drawer>
  )
}

export default function Formations() {
  const { state } = useStore()
  const d = useDerived()
  const [params, setParams] = useSearchParams()
  const tab = d.isStaff ? 'catalog' : params.get('tab') ?? 'mine' // HR and managers only manage the catalog
  const q = (params.get('q') ?? '').toLowerCase()
  const open = params.get('open')
  const [creating, setCreating] = useState(false)
  const setParam = (k, v) => { const p = new URLSearchParams(params); v == null || v === '' ? p.delete(k) : p.set(k, v); setParams(p, { replace: true }) }

  const list = useMemo(() => {
    const match = (f) => !q || `${f.title} ${f.category ?? ''} ${f.instructor ?? ''} ${(f.skills ?? []).join(' ')}`.toLowerCase().includes(q)
    if (tab === 'mine') return d.mine.filter(match).map((m) => ({ ...m, key: m.id, fid: m.formationId, mine: true }))
    return state.formations.filter((f) => f.available || d.isStaff).filter(match).map((f) => ({ ...f, key: f.id, fid: f.id, mine: d.mine.find((m) => m.formationId === f.id) }))
  }, [tab, q, d.mine, d.isStaff, state.formations])
  const requests = state.dashboard?.me?.formationRequests ?? []

  return (
    <Page>
      <motion.div variants={rise} className="page-head">
        <div><div className="eyebrow">{d.isStaff ? 'Manage · Formations' : 'Career · Formations'}</div><Reveal text="Formations" /><p>{d.isStaff ? `${state.formations.length} in the catalog · add, assign or remove formations` : `${d.mine.length} enrolled · ${d.completed.length} completed · average progress ${d.avgProgress}%`}</p></div>
        {d.isStaff && <button className="btn" onClick={() => setCreating(true)}><Icon name="Plus" size={16} />New formation</button>}
      </motion.div>

      <motion.div variants={rise} className="toolbar">
        {!d.isStaff && <Tabs id="form" value={tab} onChange={(v) => setParam('tab', v)} items={[{ value: 'mine', label: `My formations` }, { value: 'catalog', label: 'Catalog' }, { value: 'requests', label: `Requests${requests.length ? ` (${requests.length})` : ''}` }]} />}
        <label className="search" style={{ marginLeft: 'auto' }}>
          <Icon name="Search" size={17} />
          <input value={params.get('q') ?? ''} onChange={(e) => setParam('q', e.target.value)} placeholder="Filter by title, skill, instructor…" />
        </label>
      </motion.div>

      {tab === 'requests' ? (
        <motion.div variants={rise} className="card">
          {!requests.length && <Empty icon="Send" title="No enrollment requests" text="Open a formation from the catalog to request it." />}
          {requests.map((r) => (
            <div key={r.id} className="hist">
              <TechBadge item={{ title: r.title, iconUrl: state.formations.find((x) => x.title === r.title)?.iconUrl }} size={44} radius={13} />
              <div style={{ flex: 1 }}><div style={{ fontWeight: 600, fontSize: 14 }}>{r.title}</div><div style={{ fontSize: 12, color: 'var(--dim)' }}>Requested {fmtDate(r.requestedAt)}</div></div>
              <span className={`chip ${reqChip[r.status]?.[0]}`}>{reqChip[r.status]?.[1] ?? r.status}</span>
            </div>
          ))}
        </motion.div>
      ) : (
        <motion.div layout className="form-grid">
          <AnimatePresence mode="popLayout">
            {list.map((f, i) => {
              const progress = tab === 'mine' ? f.progress : f.mine?.progress
              return (
                <motion.article layout key={`${tab}-${f.key}`} className="form-card" onClick={() => setParam('open', f.fid)}
                  initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.04, ease: [0.16, 1, 0.3, 1], duration: 0.5 } }} exit={{ opacity: 0, scale: 0.95 }}
                  whileHover={{ y: -6 }}>
                  <Cover item={{ ...f, id: f.fid }} variant="card">
                    <span className="chip glass">{resolveIcon(f).title}</span>
                    {progress != null ? (
                      <span className="chip" style={{ background: '#fff', color: '#1b0a0c' }}>{progress >= 100 ? <><Icon name="Check" size={12} />Done</> : `${progress}%`}</span>
                    ) : <span className="round white" style={{ width: 32, height: 32 }}><Icon name="Plus" size={15} /></span>}
                  </Cover>
                  <div className="form-body">
                    <h3>{f.title}</h3>
                    <div className="meta"><span><Icon name="Clock" size={13} />{f.duration || '—'}</span><span><Icon name="User" size={13} />{f.instructor || '—'}</span></div>
                    {progress != null ? <Bar value={progress / 100} /> : <p style={{ fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.55 }}>{f.description?.slice(0, 90)}</p>}
                    <div className="tags" style={{ minHeight: 0, marginTop: 'auto' }}>{(f.skills ?? []).slice(0, 3).map((s) => <SkillChip key={s} name={s} plain />)}</div>
                  </div>
                </motion.article>
              )
            })}
          </AnimatePresence>
          {!list.length && <div className="card" style={{ gridColumn: '1/-1' }}><Empty icon="GraduationCap" title={q ? 'No match' : tab === 'mine' ? 'No formations yet' : 'Catalog is empty'} text={tab === 'mine' ? 'Browse the catalog and request one.' : undefined} /></div>}
        </motion.div>
      )}

      {open && <FormationDrawer key={open} id={+open} onClose={() => setParam('open', null)} />}
      <NewFormation open={creating} onClose={() => setCreating(false)} />
    </Page>
  )
}
