import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { imageToBase64 } from '../api/client'
import { TechBadge } from '../components/Cover'
import CvCoach from '../components/CvCoach'
import Drawer from '../components/Drawer'
import { SkillChip, SkillIcon } from '../components/SkillChip'
import { ProfilePosts } from '../components/Social'
import { Avatar, Icon, IconTile, Page, rise, Ring, Reveal } from '../components/ui'
import { fmtDate, fullName, roleLabel, useDerived, useStore } from '../store/store'

const ACT = {
  enrollment: (a) => ({ icon: a.status === 'Terminée' ? 'GraduationCap' : 'BookOpen', title: `${a.status === 'Terminée' ? 'Completed' : 'Started'} ${a.subject}`, text: 'Formation' }),
  certificate: (a) => ({ icon: 'Award', title: a.subject, text: 'Certificate earned' }),
  promotion: (a) => ({ icon: a.status === 'approved' ? 'Trophy' : 'TrendingUp', title: `Promotion — ${a.subject}`, text: a.status === 'approved' ? 'Approved' : a.status === 'rejected' ? 'Not approved' : 'In review' }),
  formation_request: (a) => ({ icon: 'Send', title: `Requested ${a.subject}`, text: `Enrollment request · ${a.status}` }),
}

function Journey() {
  const { state } = useStore()
  const { openRequest, eligible } = useDerived()
  const u = state.user
  const steps = useMemo(() => {
    const past = (state.dashboard?.me?.activity ?? []).slice().reverse().map((a) => ({ id: a.id, when: fmtDate(a.at), state: 'done', ...ACT[a.type]?.(a) }))
    return [
      ...past,
      { id: 'now', when: 'Now', state: 'current', icon: 'Target', title: u.position || 'Current role', text: openRequest ? `Promotion to ${openRequest.requestedPosition} in review` : eligible ? 'All requirements met — you can request a promotion' : 'Complete your formations & certificates to unlock the next step' },
      { id: 'next', when: 'Next', state: 'locked', icon: 'Crown', title: openRequest?.requestedPosition ?? 'Your next role', text: 'Unlocked after HR review and manager approval' },
    ]
  }, [state.dashboard, u.position, openRequest, eligible])
  const doneRatio = steps.filter((s) => s.state === 'done').length / Math.max(1, steps.length - 1)

  return (
    <div className="journey">
      <svg className="journey-svg" preserveAspectRatio="none" viewBox="0 0 4 100">
        <line x1="2" y1="2" x2="2" y2="98" stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
        <motion.line x1="2" y1="2" x2="2" y2="98" stroke="var(--accent)" strokeWidth="3" vectorEffect="non-scaling-stroke"
          initial={{ pathLength: 0 }} animate={{ pathLength: doneRatio }} transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: 0.3 }} />
      </svg>
      {steps.map((s, i) => (
        <motion.div key={s.id} className="step" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.08, ease: [0.16, 1, 0.3, 1], duration: 0.6 }}>
          <div className={`node ${s.state}`}><Icon name={s.state === 'locked' ? 'Lock' : s.icon} size={22} /></div>
          <div className="step-body" style={s.state === 'locked' ? { opacity: 0.6 } : undefined}>
            <div className="when">{s.when}</div>
            <h4>{s.title}</h4>
            <p>{s.text}</p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function TagEditor({ items, onAdd, onDelete, placeholder, icon, tone }) {
  const [v, setV] = useState('')
  const [busy, setBusy] = useState(false)
  const add = async (e) => {
    e.preventDefault()
    if (!v.trim()) return
    setBusy(true)
    try { await onAdd(v.trim()); setV('') } catch { /* toast shown */ } finally { setBusy(false) }
  }
  return (
    <>
      <div className="tags">
        {items.map((it) => (
          <motion.span layout key={it.id} className={`tag-item ${tone ?? ''}`} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <SkillIcon name={it.name} fallback={icon} />{it.name}
            <button onClick={() => onDelete(it.id)} aria-label={`Remove ${it.name}`}><Icon name="X" size={12} /></button>
          </motion.span>
        ))}
        {!items.length && <span style={{ fontSize: 13, color: 'var(--dim)' }}>Nothing yet.</span>}
      </div>
      <form onSubmit={add} className="tag-add">
        <input className="input" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} />
        <button className="btn" disabled={busy || !v.trim()}><Icon name="Plus" size={16} />Add</button>
      </form>
    </>
  )
}

const FIELDS = [
  ['firstName', 'First name'], ['lastName', 'Last name'], ['position', 'Position'], ['department', 'Department'],
  ['location', 'Location'], ['phone', 'Phone'], ['education', 'Education'],
]

export default function Profile() {
  const { state, actions } = useStore()
  const d = useDerived()
  const u = state.user
  const [edit, setEdit] = useState(false)
  const [form, setForm] = useState(u)
  const [saving, setSaving] = useState(false)
  const photoIn = useRef(null)
  const coverIn = useRef(null)
  const { hash } = useLocation()

  useEffect(() => { if (hash) document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [hash])

  const pick = async (e, key) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const data = await imageToBase64(f, key === 'coverPhoto' ? 1400 : 512)
    await actions.updateProfile({ [key]: data }).catch(() => {})
  }
  const save = async (e) => {
    e.preventDefault()
    setSaving(true)
    try { await actions.updateProfile(form); setEdit(false) } catch { /* toast */ } finally { setSaving(false) }
  }
  const complete = ['position', 'department', 'bio', 'location', 'phone', 'education', 'profilePhoto'].filter((k) => u[k]).length / 7

  return (
    <Page>
      <motion.div variants={rise} className="page-head">
        <div><div className="eyebrow">Career · Profile</div><Reveal text="Your parcours" /><p>Where you started, what you have earned, and what unlocks next.</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/u/${u.id}`} className="btn ghost"><Icon name="Eye" size={15} />View public profile</Link>
          <button className="btn" onClick={() => { setForm(u); setEdit(true) }}><Icon name="Pencil" size={15} />Edit profile</button>
        </div>
      </motion.div>

      <div className="prof-grid">
        <motion.div variants={rise} className="id-card">
          <div className="id-top" style={u.coverPhoto ? { background: `center/cover url(${u.coverPhoto})` } : undefined}>
            <span className="glyph">志</span>
            <button className="round white" style={{ position: 'absolute', right: 14, top: 14, width: 34, height: 34 }} onClick={() => coverIn.current.click()} title="Change cover"><Icon name="ImagePlus" size={15} /></button>
            <input ref={coverIn} type="file" accept="image/*" hidden onChange={(e) => pick(e, 'coverPhoto')} />
          </div>
          <div className="id-body">
            <div style={{ position: 'relative', width: 96 }}>
              <div className="id-ava" style={u.profilePhoto ? { background: `center/cover url(${u.profilePhoto})` } : undefined}>{!u.profilePhoto && (u.firstName?.[0] ?? '') + (u.lastName?.[0] ?? '')}</div>
              <button className="round" style={{ position: 'absolute', right: -6, bottom: -4, width: 32, height: 32 }} onClick={() => photoIn.current.click()} title="Change photo"><Icon name="Camera" size={14} /></button>
              <input ref={photoIn} type="file" accept="image/*" hidden onChange={(e) => pick(e, 'profilePhoto')} />
            </div>
            <h2>{fullName(u)}</h2>
            <div className="role">{u.position || 'No position yet'} <span className="chip accent" style={{ marginLeft: 6 }}>{roleLabel[u.role]}</span></div>
            {u.bio && <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginTop: 12 }}>{u.bio}</p>}
            <div className="kv">
              <div><small>Department</small><b>{u.department || '—'}</b></div>
              <div><small>Location</small><b>{u.location || '—'}</b></div>
              <div style={{ gridColumn: 'span 2' }}><small>Email</small><b style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{u.email}</b></div>
              {u.education && <div style={{ gridColumn: 'span 2' }}><small>Education</small><b>{u.education}</b></div>}
            </div>
            <div className="level-ring">
              <Ring value={complete} size={64} stroke={7}><b style={{ fontSize: 14 }}>{Math.round(complete * 100)}%</b></Ring>
              <div><b style={{ fontSize: 14 }}>Profile strength</b><div style={{ fontSize: 12, color: 'var(--dim)', marginTop: 3 }}>{complete < 1 ? 'Add the missing details — reviewers read this.' : 'Complete. Nice.'}</div></div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={rise} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div className="eyebrow">Timeline</div>
            <Link to="/promotion" className="chip accent"><Icon name="TrendingUp" size={13} />{d.doneCount}/{d.requirements.length} to promotion</Link>
          </div>
          <Journey />
        </motion.div>
      </div>

      <CvCoach />

      <div className="two-col" id="certificates">
        <motion.div variants={rise} className="card">
          <div className="h-row" style={{ margin: '0 0 14px' }}><h2>Skills</h2><Link to="/skills" className="more">Evolution <Icon name="ChevronRight" size={14} /></Link></div>
          <TagEditor items={state.skills} onAdd={actions.addSkill} onDelete={actions.deleteSkill} placeholder="Add a skill, e.g. Kubernetes" icon="Sparkles" />
        </motion.div>
        <motion.div variants={rise} className="card">
          <div className="h-row" style={{ margin: '0 0 14px' }}><h2>Certificates earned</h2><span className="chip good">{state.certificates.length}</span></div>
          <TagEditor items={state.certificates} onAdd={actions.addCertificate} onDelete={actions.deleteCertificate} placeholder="Certificate name" icon="BadgeCheck" tone="good" />
        </motion.div>
      </div>

      <div className="h-row"><h2>Available certification paths</h2><Link to="/formations?tab=catalog" className="more">Full catalog <Icon name="ChevronRight" size={14} /></Link></div>
      <motion.div variants={rise} className="cert-grid">
        {[...d.active.map((f) => ({ key: 'a' + f.id, fid: f.formationId, title: f.title, sub: f.instructor, skills: f.skills, status: 'progress', progress: f.progress, cat: f.category, iconUrl: f.iconUrl })),
          ...d.available.map((f) => ({ key: 'v' + f.id, fid: f.id, title: f.title, sub: `${f.level} · ${f.duration}`, skills: f.skills, status: 'available', cat: f.category, iconUrl: f.iconUrl }))].map((c) => (
          <Link to={`/formations?open=${c.fid}`} key={c.key} className="cert">
            <div className="shine" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <TechBadge item={{ id: c.fid, title: c.title, iconUrl: c.iconUrl, skills: c.skills, category: c.cat }} size={52} />
              <span className={`chip ${c.status === 'progress' ? 'warn' : 'accent'}`}><Icon name={c.status === 'progress' ? 'Clock' : 'Sparkles'} size={12} />{c.status === 'progress' ? `${c.progress}%` : 'Available'}</span>
            </div>
            <h4>{c.title}</h4>
            <div className="meta">{c.sub}</div>
            <div className="foot">
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>{c.skills.slice(0, 3).map((s) => <SkillChip key={s} name={s} plain />)}</div>
              <Icon name="ArrowUpRight" size={18} style={{ color: 'var(--accent)', flex: 'none' }} />
            </div>
          </Link>
        ))}
      </motion.div>

      <div className="h-row"><h2><IconTile icon="Newspaper" size={30} />Your posts</h2><Link to="/feed" className="more">Open the feed <Icon name="ChevronRight" size={14} /></Link></div>
      <motion.div variants={rise} className="profile-posts"><ProfilePosts userId={u.id} mine /></motion.div>

      <Drawer open={edit} onClose={() => setEdit(false)} title="Edit profile" eyebrow="Profile"
        footer={<><button className="btn ghost" onClick={() => setEdit(false)}>Cancel</button><button className="btn" form="profile-form" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></>}>
        <form id="profile-form" onSubmit={save} style={{ display: 'grid', gap: 14 }}>
          <div className="form-2">
            {FIELDS.map(([k, label]) => (
              <div className="field" key={k} style={k === 'education' ? { gridColumn: 'span 2' } : undefined}>
                <label>{label}</label>
                <input className="input" value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} required={k === 'firstName'} />
              </div>
            ))}
          </div>
          <div className="field"><label>Bio</label><textarea className="input" rows={4} value={form.bio ?? ''} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <Avatar name={fullName(form)} src={form.profilePhoto} size={44} />
            <span style={{ fontSize: 12.5, color: 'var(--dim)' }}>Photos are resized and saved as base64, like before.</span>
          </div>
        </form>
      </Drawer>
    </Page>
  )
}
