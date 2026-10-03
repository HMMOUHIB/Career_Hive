/**
 * Career compass (CV coach), on the profile: upload a CV, watch it being analysed (the section's own 3D mark — a CV and
 * a compass, three/CvCompass.jsx — scans inside a ring while each step completes and the skills it finds light up), then get a plan — skills found, skills to level
 * up, the best formations and the best manager to learn from, and quick wins for the CV. Matching runs on the server
 * against the real catalog and teams; the file itself isn't stored. Styles: .cvc / .cvx in index.css.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { colorFor, fmtDate, useDerived, useStore } from '../store/store'
import { TechBadge } from './Cover'
import CvMark from './CvMark'
import { SkillBadge, SkillChip, SkillIcon } from './SkillChip'
import { Avatar, CardHead, Counter, Icon, IconTile, Ring } from './ui'

const CvCompass = lazy(() => import('../three/CvCompass'))
/** The 3D mark, loaded on demand; an empty slot of the same size holds its place. */
const Mark3D = ({ className, ...p }) => <Suspense fallback={<span className={className} aria-hidden="true" />}><CvCompass className={className} {...p} /></Suspense>

const STEPS = ['Reading your document', 'Extracting skills and experience', 'Matching formations in the catalog', 'Finding the manager who fits you', 'Building your level-up plan']
const STEP_MS = 720
const MAX = 8 * 1024 * 1024
const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } } }

/** The full-screen analysis: steps at a readable pace while the server works; the last step waits for the answer. */
function Analyser({ file, theme, onDone, onClose }) {
  const [step, setStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const finished = step >= STEPS.length
  useEffect(() => {
    let live = true
    api.analyzeCv(file).then((r) => live && setResult(r)).catch((e) => live && setError(e.message))
    return () => { live = false }
  }, [file])
  useEffect(() => {
    if (error || finished || (step === STEPS.length - 1 && !result)) return
    const id = setTimeout(() => setStep((s) => s + 1), STEP_MS)
    return () => clearTimeout(id)
  }, [step, result, error, finished])
  useEffect(() => {
    if (!finished) return
    const id = setTimeout(() => onDone(result), 1400)
    return () => clearTimeout(id)
  }, [finished, result, onDone])
  const pct = finished ? 100 : Math.round(((step + 0.5) / STEPS.length) * 100)
  const blips = (step >= 2 ? result?.skills ?? [] : []).slice(0, 6)

  return createPortal(
    <motion.div className="cvx" role="dialog" aria-modal="true" aria-label="Analysing your CV" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
      <motion.div className="cvx-card" initial={{ y: 30, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.97 }} transition={{ type: 'spring', stiffness: 220, damping: 24 }}>
        <div className={`cvx-orbit ${finished ? 'done' : ''} ${error ? 'failed' : ''}`}>
          <span className="cvx-halo" />
          <span className="cvx-ring r1" /><span className="cvx-ring r2" />
          {!finished && !error && <span className="cvx-sweep" />}
          {blips.map((s, i) => (
            <span key={s.name} className="cvx-blip-at" style={{ '--a': `${i * 60 - 60}deg` }}>
              <motion.span className="cvx-blip" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.14, type: 'spring', stiffness: 420, damping: 18 }}><SkillIcon name={s.name} size={13} />{s.name}</motion.span>
            </span>
          ))}
          <Mark3D theme={theme} mode={error ? 'error' : finished ? 'done' : 'scan'} className="cvx-3d" />
          <AnimatePresence>{finished && <motion.span className="cvx-check" initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 480, damping: 16 }}><Icon name="Check" size={22} strokeWidth={3} /></motion.span>}</AnimatePresence>
        </div>
        <h3>{error ? 'We couldn’t analyse this file' : finished ? 'Your plan is ready' : 'Analysing your CV'}</h3>
        <div className="cvx-file"><Icon name="FileText" size={14} />{file.name}</div>
        {error ? (
          <>
            <p className="cvx-error">{error}</p>
            <button type="button" className="btn ghost" onClick={onClose}>Close</button>
          </>
        ) : (
          <>
            <ul className="cvx-steps">
              {STEPS.map((s, i) => (
                <li key={s} className={i < step ? 'done' : i === step ? 'on' : ''}>
                  <span className="cvx-dot">{i < step ? <Icon name="Check" size={12} strokeWidth={3} draw={false} /> : i === step ? <span className="cvx-spin" /> : i + 1}</span>{s}
                </li>
              ))}
            </ul>
            <div className="cvx-bar"><i style={{ width: `${pct}%` }} /></div>
          </>
        )}
      </motion.div>
    </motion.div>,
    document.body,
  )
}

const lines = { show: { transition: { staggerChildren: 0.08, delayChildren: 0.15 } } }

function Dropzone({ onPick, busy, theme }) {
  const [drag, setDrag] = useState(false)
  return (
    <motion.div variants={item} className={`card cvc-drop ${drag ? 'drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onPick(e.dataTransfer.files?.[0]) }}>
      <span className="cvc-aura" aria-hidden="true"><i /><i /><i /></span>
      <div className="cvc-drop-art" aria-hidden="true">
        <span className="cvc-drop-ring" /><span className="cvc-drop-ring two" />
        <Mark3D theme={theme} mode={drag ? 'drag' : 'idle'} paused={busy} className="cvc-3d" />
        {[['PDF', 'FileText'], ['DOCX', 'FileType'], ['TXT', 'File']].map(([t, ic], i) => <span key={t} className={`cvc-ft f${i}`}><Icon name={ic} size={12} />{t}</span>)}
      </div>
      <motion.div className="cvc-drop-text" variants={lines}>
        <motion.div variants={item} className="eyebrow cvc-eyebrow"><CvMark size={22} />CV coach</motion.div>
        <motion.h3 variants={item}>Let your CV find your <span className="cvc-grad">next step.</span></motion.h3>
        <motion.p variants={item}>Upload your CV. We read your skills and experience, match them with this company’s formations and managers, and show you where to go next.</motion.p>
        <motion.div className="cvc-points" variants={lines}>
          {[['GraduationCap', 'Best formations for you', ''], ['UserCheck', 'The manager who fits', 'good'], ['Target', 'Skills to level up', 'violet'], ['ListChecks', 'Quick wins for your CV', 'warn']].map(([ic, t, tone]) => (
            <motion.span variants={item} key={t}><IconTile icon={ic} tone={tone} size={30} soft />{t}</motion.span>
          ))}
        </motion.div>
        <motion.div variants={item} className="cvc-drop-actions">
          <motion.button type="button" className="btn cvc-cta" disabled={busy} onClick={() => onPick('choose')} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}><Icon name="FileUp" size={16} />Choose your CV</motion.button>
          <span className="cvc-hint">or drop it here · PDF, Word, TXT · 8 MB max</span>
        </motion.div>
        <motion.div variants={item} className="cvc-privacy"><Icon name="ShieldCheck" size={15} />Read on the server and never stored — only your results are kept, and only you can see them.</motion.div>
      </motion.div>
      <AnimatePresence>
        {drag && <motion.div className="cvc-drop-over" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><motion.span initial={{ y: 10, scale: 0.9 }} animate={{ y: 0, scale: 1 }}><Icon name="FileDown" size={22} />Drop to analyse</motion.span></motion.div>}
      </AnimatePresence>
    </motion.div>
  )
}

function Results({ a, onAgain, onRemove }) {
  const { state, actions } = useStore()
  const { contacts } = useDerived()
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(false)
  const toAdd = a.newSkills.filter((s) => !state.skills.some((x) => x.name.toLowerCase() === s.toLowerCase()))
  const addAll = async () => {
    setAdding(true)
    let n = 0
    for (const s of toAdd) { try { await api.addSkill(s); n++ } catch { /* already there */ } }
    await actions.refresh('skills', 'dashboard')
    actions.toast(`${n} skill${n === 1 ? '' : 's'} added to your profile`)
    setAdding(false)
  }
  const m = a.manager
  const contact = m && contacts.find((c) => Number(c.userId ?? c.id) === m.id)
  const score = a.strength.score

  return (
    <motion.div className="cvc-results" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
      <motion.div variants={item} className="cvc-hero">
        <div className="cvc-hero-text">
          <div className="cvc-hero-badge"><CvMark size={26} glass />Career compass</div>
          <div className="eyebrow">From {a.fileName}{a.demo ? ' · demo data' : ''} · {fmtDate(a.analyzedAt)}</div>
          <h3>{a.title ?? 'Your profile'}</h3>
          <div className="cvc-facts">
            <span className="chip glass"><Icon name="Gauge" size={13} />{a.seniority}</span>
            <span className="chip glass"><Icon name="CalendarDays" size={13} />{a.years ? `${a.years} yr${a.years === 1 ? '' : 's'} of experience` : 'Experience not dated'}</span>
            <span className="chip glass"><Icon name="Compass" size={13} />{a.trackLabel}</span>
          </div>
          {a.nextRole && <Link to="/promotion" className="cvc-next"><span>Your next step</span><b>{a.nextRole}</b><Icon name="ArrowRight" size={18} /></Link>}
        </div>
        <div className="cvc-score">
          <Ring value={score / 100} size={148} stroke={12} color="#fff"><div className="cvc-score-in"><b><Counter value={score} /></b><small>CV strength</small></div></Ring>
        </div>
      </motion.div>

      <div className="cvc-grid">
        <motion.div variants={item} className="card">
          <CardHead icon="ScanSearch" title="Skills we found" sub={`${a.skills.length} in your CV`} />
          <div className="tags">{a.skills.map((s, i) => <motion.span key={s.name} className="cvc-pop" initial={{ opacity: 0, scale: 0.6, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.045, type: 'spring', stiffness: 380, damping: 20 }}><SkillChip name={s.name} /></motion.span>)}</div>
          {!a.skills.length && <p className="cvc-muted">No known tools yet — name the technologies you use.</p>}
          <div className="cvc-row-end">
            {toAdd.length
              ? <button type="button" className="btn sm" disabled={adding} onClick={addAll}><Icon name="Plus" size={14} />{adding ? 'Adding…' : `Add ${toAdd.length} to my profile`}</button>
              : <span className="cvc-ok"><Icon name="CheckCheck" size={15} />All on your profile</span>}
          </div>
        </motion.div>
        <motion.div variants={item} className="card">
          <CardHead icon="Target" tone="violet" title="Skills to level up" sub={`For ${a.trackLabel.toLowerCase()}`} />
          {a.gaps.map((g, i) => (
            <div className="cvc-gap" key={g.name}>
              <SkillBadge name={g.name} size={34} />
              <div className="cvc-gap-name"><b>{g.name}</b><small>{g.taught ? 'Taught in the catalog' : 'Learn it on the job'}</small></div>
              <div className="cvc-gap-bar" title={`Priority ${g.priority}`}><motion.i initial={{ width: 0 }} animate={{ width: `${g.priority}%` }} transition={{ delay: 0.3 + i * 0.08, duration: 0.8, ease: [0.16, 1, 0.3, 1] }} /></div>
            </div>
          ))}
          {!a.gaps.length && <p className="cvc-muted">Your CV already covers the core skills of your track.</p>}
        </motion.div>
      </div>

      {!!a.formations.length && (
        <>
          <motion.div variants={item} className="cvc-sub"><h4><IconTile icon="GraduationCap" size={28} />Best formations for you</h4><Link to="/formations?tab=catalog" className="more">Catalog <Icon name="ChevronRight" size={14} /></Link></motion.div>
          <div className="cvc-forms">
            {a.formations.map((f, i) => (
              <motion.div variants={item} key={f.id} className="card cvc-form" whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}>
                <div className="cvc-form-top">
                  <TechBadge item={{ id: f.id, title: f.title, iconUrl: f.iconUrl, skills: f.skills, category: f.category }} size={56} radius={16} />
                  <span className="cvc-rank">#{i + 1}</span>
                  <div className="cvc-match"><b><Counter value={f.match} suffix="%" /></b><small>match</small></div>
                </div>
                <h5>{f.title}</h5>
                <div className="cvc-meta">{[f.level, f.duration, f.instructor].filter(Boolean).join(' · ')}</div>
                <div className="cvc-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${f.match}%` }} transition={{ delay: 0.4 + i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }} /></div>
                <ul className="cvc-reasons">{f.reasons.map((r) => <li key={r}><Icon name="Sparkles" size={13} />{r}</li>)}</ul>
                <Link className="btn sm cvc-form-btn" to={`/formations?tab=${f.enrolled ? 'mine' : 'catalog'}&open=${f.id}`}>{f.enrolled ? 'Continue' : 'View formation'} <Icon name="ArrowRight" size={14} /></Link>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {m && (
        <motion.div variants={item} className="card cvc-manager">
          <div className="cvc-man-id">
            <Link to={`/u/${m.id}`}><Avatar name={m.name} src={m.avatar} color={colorFor(m.name)} size={84} /></Link>
            <div>
              <div className="eyebrow">Best manager for you</div>
              <Link to={`/u/${m.id}`} className="cvc-man-name">{m.name}</Link>
              <div className="cvc-meta">{[m.position, m.department].filter(Boolean).join(' · ')}</div>
              {!!m.teaches.length && <div className="tags" style={{ marginTop: 10 }}>{m.teaches.map((s) => <SkillChip key={s} name={s} plain />)}</div>}
            </div>
          </div>
          <ul className="cvc-reasons">{m.reasons.map((r) => <li key={r}><Icon name="Sparkles" size={13} />{r}</li>)}</ul>
          <div className="cvc-man-end">
            <Ring value={m.match / 100} size={92} stroke={8}><b className="cvc-ring-num">{m.match}%</b></Ring>
            <div className="cvc-man-actions">
              <Link to={`/u/${m.id}`} className="btn sm ghost"><Icon name="User" size={14} />Profile</Link>
              {contact && <button type="button" className="btn sm" onClick={() => actions.openChat(contact.id)}><Icon name="MessageCircle" size={14} />Message</button>}
            </div>
          </div>
        </motion.div>
      )}

      <motion.div variants={item} className="card cvc-tips">
        <CardHead icon="ListChecks" tone="warn" title="Quick wins for your CV" sub={`Scored ${score} / 100 on what reviewers look for`} />
        <div className="cvc-checks">{a.strength.checks.map((c) => <span key={c.label} className={c.ok ? 'ok' : ''}><Icon name={c.ok ? 'CircleCheck' : 'CircleDashed'} size={15} />{c.label}</span>)}</div>
        {!!a.strength.tips.length && <ul className="cvc-reasons tips">{a.strength.tips.map((t) => <li key={t}><Icon name="ArrowRight" size={13} />{t}</li>)}</ul>}
      </motion.div>

      <motion.div variants={item} className="cvc-actions">
        <button type="button" className="btn ghost" onClick={onAgain}><Icon name="RefreshCw" size={15} />Analyse another CV</button>
        <button type="button" className={`btn ${removing ? 'danger' : 'ghost'}`} onClick={() => (removing ? onRemove() : setRemoving(true))}><Icon name="Trash2" size={15} />{removing ? 'Click again to remove' : 'Remove this analysis'}</button>
      </motion.div>
    </motion.div>
  )
}

export default function CvCoach() {
  const { state, actions } = useStore()
  const [analysis, setAnalysis] = useState(undefined) // undefined while loading, null when there is none
  const [file, setFile] = useState(null)
  const input = useRef(null)
  useEffect(() => {
    let live = true
    api.cvAnalysis().then((r) => live && setAnalysis(r.analysis)).catch(() => live && setAnalysis(null))
    return () => { live = false }
  }, [])
  const pick = (f) => {
    if (f === 'choose') return input.current?.click()
    if (!f) return
    if (!/\.(pdf|docx|txt|md)$/i.test(f.name)) return actions.toast('Upload a PDF, a Word (.docx) or a text file.', 'bad')
    if (f.size > MAX) return actions.toast('Your CV must be 8 MB or smaller.', 'bad')
    setFile(f)
  }
  const done = useCallback((r) => { setFile(null); if (r) setAnalysis(r) }, [])
  const remove = async () => {
    try { await api.deleteCvAnalysis(); setAnalysis(null); actions.toast('Analysis removed') } catch (e) { actions.toast(e.message, 'bad') }
  }

  return (
    <section className="cvc" id="career-compass">
      <div className="h-row"><h2><CvMark size={36} />Career compass</h2>{analysis && <span className="more">From your CV</span>}</div>
      {analysis === undefined
        ? <div className="card cvc-loading" />
        : analysis
          ? <Results key={analysis.analyzedAt} a={analysis} onAgain={() => pick('choose')} onRemove={remove} />
          : <motion.div initial="hidden" animate="show"><Dropzone onPick={pick} busy={!!file} theme={state.theme} /></motion.div>}
      <input ref={input} type="file" accept=".pdf,.docx,.txt,.md" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
      <AnimatePresence>{file && <Analyser key={`${file.name}${file.size}${file.lastModified}`} file={file} theme={state.theme} onDone={done} onClose={() => setFile(null)} />}</AnimatePresence>
    </section>
  )
}
