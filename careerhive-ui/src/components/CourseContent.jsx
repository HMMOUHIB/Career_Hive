import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DEMO, fileUrl } from '../api/client'
import { useDerived, useStore } from '../store/store'
import { Icon } from './ui'

/* ---------- file type badges ---------- */
const TYPES = [
  [/^(pdf)$/, '#e5484d', 'FileText'],
  [/^(docx?|odt|rtf|txt|md)$/, '#2f7bf6', 'FileText'],
  [/^(pptx?|odp|key)$/, '#f07b2e', 'Presentation'],
  [/^(xlsx?|csv|ods|numbers)$/, '#1f9d55', 'Sheet'],
  [/^(zip|rar|7z|tar|gz|tgz)$/, '#8b5cf6', 'FileArchive'],
  [/^(png|jpe?g|gif|webp|svg|bmp|heic)$/, '#0ea5a4', 'Image'],
  [/^(mp3|wav|ogg|m4a|flac)$/, '#e0529c', 'Music'],
  [/^(js|ts|jsx|tsx|py|java|go|rb|php|json|ya?ml|sql|sh|tf|html|css|xml)$/, '#d4a017', 'FileCode'],
]
export const extOf = (r) => (r.fileName?.split('.').pop() ?? '').toLowerCase()
export function typeOf(r) {
  if (r.kind === 'video') return { color: '#c2253a', icon: 'Play', label: 'VIDEO' }
  if (r.kind === 'link') return { color: '#5b6b8c', icon: 'Link', label: 'LINK' }
  const ext = extOf(r)
  const hit = TYPES.find(([re]) => re.test(ext))
  return { color: hit?.[1] ?? '#6b7280', icon: hit?.[2] ?? 'File', label: (ext || 'FILE').toUpperCase().slice(0, 5) }
}
export const fmtSize = (b) => (b == null ? '' : b < 1024 ? `${b} B` : b < 1024 ** 2 ? `${(b / 1024).toFixed(0)} KB` : b < 1024 ** 3 ? `${(b / 1024 ** 2).toFixed(1)} MB` : `${(b / 1024 ** 3).toFixed(2)} GB`)
const isInline = (r) => r.kind === 'video' || /^(pdf|png|jpe?g|gif|webp|mp3|wav)$/.test(extOf(r))

/* ---------- video player (portal) ---------- */
export function VideoPlayer({ fid, startId, onClose, canTrack }) {
  const { state, actions } = useStore()
  const videos = (state.resources[fid] ?? []).filter((r) => r.kind === 'video')
  const [cur, setCur] = useState(startId)
  const [ended, setEnded] = useState(false)
  const [failed, setFailed] = useState(false)
  const video = videos.find((v) => v.id === cur) ?? videos[0]
  const idx = videos.indexOf(video)
  const next = videos[idx + 1]

  useEffect(() => {
    // capture phase + stop: Escape closes only the player, not the formation panel underneath
    const k = (e) => { if (e.key === 'Escape') { e.stopImmediatePropagation(); onClose() } }
    window.addEventListener('keydown', k, true)
    return () => window.removeEventListener('keydown', k, true)
  }, [onClose])
  useEffect(() => { setEnded(false); setFailed(false) }, [cur])
  if (!video) return null

  const onEnded = () => {
    setEnded(true)
    if (canTrack && !video.done) actions.completeResource(fid, video.id, true)
  }

  return createPortal(
    <motion.div className="vp-back" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div className="vp" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={video.title}
        initial={{ scale: 0.92, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}>
        <div className="vp-stage">
          <video key={video.id} src={fileUrl(video.url)} controls autoPlay playsInline onEnded={onEnded} onError={() => setFailed(true)} />
          {failed && (
            <div className="vp-ended">
              <div className="vp-ended-ic" style={{ background: 'var(--warn)' }}><Icon name="CircleAlert" size={30} /></div>
              <b>This browser can't play this video</b>
              <span style={{ fontSize: 13, opacity: 0.8, maxWidth: 360 }}>MP4 (H.264) plays in Chrome, Edge, Safari and Firefox. You can also open the file directly.</span>
              <a className="btn" href={fileUrl(video.url)} target="_blank" rel="noopener noreferrer"><Icon name="Download" size={15} />Open the video file</a>
            </div>
          )}
          <AnimatePresence>
            {ended && (
              <motion.div className="vp-ended" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="vp-ended-ic"><Icon name="CircleCheck" size={34} /></div>
                <b>{canTrack ? 'Lesson completed' : 'End of video'}</b>
                {next
                  ? <button className="btn" onClick={() => setCur(next.id)}>Next · {next.title} <Icon name="ArrowRight" size={15} /></button>
                  : <button className="btn ghost" onClick={onClose}>Back to the formation</button>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <aside className="vp-side">
          <header>
            <div style={{ minWidth: 0 }}>
              <div className="eyebrow">Lesson {idx + 1} of {videos.length}</div>
              <h3>{video.title}</h3>
            </div>
            <button className="round white" onClick={onClose} aria-label="Close player"><Icon name="X" size={16} /></button>
          </header>
          {canTrack && (
            <button className={`vp-done ${video.done ? 'on' : ''}`} onClick={() => actions.completeResource(fid, video.id, !video.done)}>
              <Icon name={video.done ? 'CircleCheck' : 'Circle'} size={17} />{video.done ? 'Completed' : 'Mark as completed'}
            </button>
          )}
          <div className="vp-list">
            {videos.map((v, i) => (
              <button key={v.id} className={`vp-item ${v.id === video.id ? 'on' : ''}`} onClick={() => setCur(v.id)}>
                <span className="vp-num">{v.done ? <Icon name="Check" size={13} draw={false} /> : i + 1}</span>
                <span className="vp-title">{v.title}</span>
                {v.id === video.id && <span className="vp-eq" aria-hidden><i /><i /><i /></span>}
              </button>
            ))}
          </div>
        </aside>
      </motion.div>
    </motion.div>,
    document.body,
  )
}

/* ---------- staff: upload area ---------- */
function Uploader({ fid }) {
  const { actions } = useStore()
  const [drag, setDrag] = useState(false)
  const [queue, setQueue] = useState([]) // {key,name,size,progress,error}
  const [link, setLink] = useState({ title: '', url: '' })
  const input = useRef(null)

  const send = async (fileList) => {
    const files = [...fileList] // copy now: clearing the <input> empties its live FileList
    if (!files.length) return
    const key = Date.now()
    const item = { key, name: files.length === 1 ? files[0].name : `${files.length} files`, size: [...files].reduce((s, f) => s + f.size, 0), progress: 0 }
    setQueue((q) => [item, ...q])
    try {
      await actions.uploadResources(fid, files, (p) => setQueue((q) => q.map((x) => (x.key === key ? { ...x, progress: p } : x))))
      setQueue((q) => q.map((x) => (x.key === key ? { ...x, progress: 1, done: true } : x)))
      setTimeout(() => setQueue((q) => q.filter((x) => x.key !== key)), 1800)
    } catch (e) {
      setQueue((q) => q.map((x) => (x.key === key ? { ...x, error: e.message } : x)))
    }
  }

  return (
    <div className="uploader">
      <div className={`dropzone ${drag ? 'drag' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); send(e.dataTransfer.files) }}
        onClick={() => input.current.click()} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && input.current.click()}>
        <motion.div className="dz-ic" animate={drag ? { y: -6, scale: 1.1 } : { y: 0, scale: 1 }}><Icon name="CloudUpload" size={26} /></motion.div>
        <b>{drag ? 'Drop to upload' : 'Drop videos or files here'}</b>
        <span>MP4 videos and any file type — PDF, Word, PowerPoint, Excel, ZIP… · click to browse</span>
        <input ref={input} type="file" multiple hidden onChange={(e) => { send(e.target.files); e.target.value = '' }} />
      </div>
      <AnimatePresence initial={false}>
        {queue.map((q) => (
          <motion.div key={q.key} className={`upq ${q.error ? 'err' : ''}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Icon name={q.error ? 'CircleX' : q.done ? 'CircleCheck' : 'Upload'} size={16} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="upq-row"><span>{q.name}</span><small>{q.error ?? (q.done ? 'Uploaded' : `${Math.round(q.progress * 100)}% · ${fmtSize(q.size)}`)}</small></div>
              {!q.error && <div className="bar"><motion.div animate={{ width: `${q.progress * 100}%` }} transition={{ ease: 'easeOut' }} /></div>}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <form className="link-add" onSubmit={(e) => { e.preventDefault(); actions.addResourceLink(fid, link.title, link.url).then(() => setLink({ title: '', url: '' })).catch(() => {}) }}>
        <Icon name="Link" size={16} />
        <input className="input" placeholder="Link title (optional)" value={link.title} onChange={(e) => setLink({ ...link, title: e.target.value })} />
        <input className="input" type="url" required placeholder="https://…" value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} />
        <button className="btn" disabled={!link.url}>Add</button>
      </form>
    </div>
  )
}

/* ---------- one row ---------- */
function Row({ r, fid, enrolled, access, staff, onPlay, i }) {
  const { actions } = useStore()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(r.title)
  const [confirm, setConfirm] = useState(false)
  const t = typeOf(r)
  const locked = !access
  const open = () => {
    if (locked) return
    if (r.kind === 'video') return onPlay(r.id)
    if (DEMO && r.url === '#demo') return actions.toast('Sample file — real uploads open or download here', 'good')
    window.open(fileUrl(r.url), '_blank', 'noopener')
  }
  return (
    <motion.li layout className={`res ${r.done ? 'done' : ''} ${locked ? 'locked' : ''}`}
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.03 } }} exit={{ opacity: 0, x: 20 }}>
      {enrolled && (
        <button className={`res-check ${r.done ? 'on' : ''}`} onClick={() => actions.completeResource(fid, r.id, !r.done)} aria-label={r.done ? 'Mark as not done' : 'Mark as done'}>
          <Icon name="Check" size={13} draw={false} />
        </button>
      )}
      <button className="res-badge" style={{ '--c': t.color }} onClick={open} aria-label={r.kind === 'video' ? `Play ${r.title}` : `Open ${r.title}`}>
        <Icon name={t.icon} size={18} draw={false} fill={r.kind === 'video' ? 'currentColor' : 'none'} />
        <small>{t.label}</small>
      </button>
      <div className="res-main">
        {editing ? (
          <form onSubmit={(e) => { e.preventDefault(); actions.renameResource(fid, r.id, title); setEditing(false) }}>
            <input className="input" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => setEditing(false)} />
          </form>
        ) : (
          <button className="res-title" onClick={open}>{r.title}</button>
        )}
        <small>{[r.kind === 'link' ? (() => { try { return new URL(r.url).hostname } catch { return 'link' } })() : r.fileName, fmtSize(r.size)].filter(Boolean).join(' · ')}</small>
      </div>
      <div className="res-actions">
        {locked ? <Icon name="Lock" size={15} draw={false} /> : (
          <button className="res-go" onClick={open} aria-label="Open">
            <Icon name={r.kind === 'video' ? 'Play' : r.kind === 'link' ? 'ExternalLink' : isInline(r) ? 'Eye' : 'Download'} size={16} />
          </button>
        )}
        {staff && !confirm && <>
          <button className="res-tool" onClick={() => setEditing(true)} aria-label="Rename"><Icon name="Pencil" size={14} draw={false} /></button>
          <button className="res-tool" onClick={() => setConfirm(true)} aria-label="Delete"><Icon name="Trash2" size={14} draw={false} /></button>
        </>}
        {staff && confirm && <>
          <button className="res-del" onClick={() => actions.deleteResource(fid, r.id)}>Delete</button>
          <button className="res-tool" onClick={() => setConfirm(false)} aria-label="Cancel"><Icon name="X" size={14} draw={false} /></button>
        </>}
      </div>
    </motion.li>
  )
}

/* ---------- section used inside the formation drawer ---------- */
export default function CourseContent({ fid, enrolled }) {
  const { state, actions } = useStore()
  const { isStaff } = useDerived()
  const [manage, setManage] = useState(false)
  const [playing, setPlaying] = useState(null)
  const list = state.resources[fid]

  useEffect(() => { actions.loadResources(fid) }, [fid]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!state.contentAvailable) {
    return isStaff
      ? <div className="note" style={{ marginTop: 0 }}><Icon name="Info" size={15} /><div>Course content needs the <b>formation-content</b> backend module (see backend README).</div></div>
      : null
  }
  if (!list) return <div className="res-skeleton"><i /><i /><i /></div>

  const videos = list.filter((r) => r.kind === 'video').length
  const files = list.filter((r) => r.kind === 'file').length
  const links = list.filter((r) => r.kind === 'link').length
  const done = list.filter((r) => r.done).length

  return (
    <section className="course">
      <header className="course-head">
        <div>
          <div className="eyebrow">Course content</div>
          <b>{[videos && `${videos} video${videos > 1 ? 's' : ''}`, files && `${files} file${files > 1 ? 's' : ''}`, links && `${links} link${links > 1 ? 's' : ''}`].filter(Boolean).join(' · ') || 'No content yet'}</b>
        </div>
        {enrolled && list.length > 0 && <span className="chip good">{done}/{list.length} done</span>}
        {isStaff && <button className={`btn ${manage ? '' : 'ghost'}`} style={{ padding: '8px 12px', fontSize: 12.5 }} onClick={() => setManage((m) => !m)}><Icon name={manage ? 'Check' : 'CloudUpload'} size={15} />{manage ? 'Done' : 'Manage'}</button>}
      </header>

      <AnimatePresence initial={false}>
        {manage && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
            <Uploader fid={fid} />
          </motion.div>
        )}
      </AnimatePresence>

      {!enrolled && !isStaff && list.length > 0 && (
        <div className="note" style={{ marginTop: 0 }}><Icon name="Lock" size={15} /><div>Enroll in this formation to watch the videos and open the files.</div></div>
      )}
      {list.length === 0 && !manage && (
        <div className="res-empty">{isStaff ? 'No content yet — click Manage to upload videos and files.' : 'Your HR team hasn’t added content yet.'}</div>
      )}
      <ul className="res-list">
        <AnimatePresence initial={false}>
          {list.map((r, i) => <Row key={r.id} r={r} i={i} fid={fid} enrolled={enrolled} access={enrolled || isStaff} staff={isStaff && manage} onPlay={setPlaying} />)}
        </AnimatePresence>
      </ul>

      <AnimatePresence>
        {playing && <VideoPlayer fid={fid} startId={playing} canTrack={enrolled} onClose={() => setPlaying(null)} />}
      </AnimatePresence>
    </section>
  )
}
