/**
 * Social pieces shared by the Feed, public profiles and your own profile: the composer (text + one image), post cards
 * with likes and comments, the follow button, person rows, and usePosts() for a paged list of posts.
 * Lists from the API are { posts, people, more }: a post carries authorId and `people` holds each author once.
 */
import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, fileUrl, imageToBase64 } from '../api/client'
import { colorFor, fmtDate, fullName, roleLabel, useStore } from '../store/store'
import { Avatar, Icon, IconTile } from './ui'

const MAX_GIF = 6 * 1024 * 1024
const readAsDataUrl = (f) => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = reject; r.readAsDataURL(f) })

/** "just now", "5m", "3h", "2d", then the date. */
export function timeAgo(iso) {
  const s = (Date.now() - Date.parse(iso)) / 1000
  if (!(s >= 0)) return fmtDate(iso)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m`
  if (s < 86400) return `${Math.floor(s / 3600)}h`
  if (s < 7 * 86400) return `${Math.floor(s / 86400)}d`
  return fmtDate(iso)
}

/** Text with its http(s) links made clickable; everything else stays plain text. */
function Linkified({ text }) {
  return text.split(/(https?:\/\/[^\s<]+)/g).map((part, i) =>
    i % 2 ? <a key={i} href={part} target="_blank" rel="noopener noreferrer">{part}</a> : part)
}

/** A paged list of posts. `load(before?)` returns { posts, people, more }; keep it stable (useCallback). */
export function usePosts(load) {
  const [s, setS] = useState({ posts: [], people: {}, more: false, loading: true })
  const reload = useCallback(async () => {
    setS((x) => ({ ...x, loading: true }))
    try { const p = await load(); setS({ posts: p.posts, people: p.people, more: p.more, loading: false }) } catch { setS((x) => ({ ...x, loading: false })) }
  }, [load])
  useEffect(() => { reload() }, [reload])
  const loadMore = async () => {
    const last = s.posts.at(-1)
    if (!last) return
    const p = await load(last.id)
    setS((x) => ({ posts: [...x.posts, ...p.posts], people: { ...x.people, ...p.people }, more: p.more, loading: false }))
  }
  const add = (p) => setS((x) => ({ ...x, posts: [...p.posts, ...x.posts], people: { ...x.people, ...p.people } }))
  const remove = (id) => setS((x) => ({ ...x, posts: x.posts.filter((p) => p.id !== id) }))
  const patch = (id, v) => setS((x) => ({ ...x, posts: x.posts.map((p) => (p.id === id ? { ...p, ...v } : p)) }))
  return { ...s, reload, loadMore, add, remove, patch }
}

/** Write a post: text and/or one photo (resized in the browser; GIFs are sent as they are). */
export function Composer({ onPosted, placeholder = 'Share an update, a win, something you learned…' }) {
  const { state, actions } = useStore()
  const me = state.user
  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [busy, setBusy] = useState(false)
  const input = useRef(null)
  const pick = async (e) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) return actions.toast('Choose a JPEG, PNG, WebP or GIF image.', 'bad')
    if (f.type === 'image/gif' && f.size > MAX_GIF) return actions.toast('GIFs must be at most 6 MB.', 'bad')
    try { setImage(f.type === 'image/gif' ? await readAsDataUrl(f) : await imageToBase64(f, 1600, 0.86)) } catch { actions.toast('That image could not be read.', 'bad') }
  }
  const submit = async (e) => {
    e.preventDefault()
    if (busy || (!text.trim() && !image)) return
    setBusy(true)
    try {
      onPosted?.(await api.createPost({ body: text.trim(), image }))
      setText(''); setImage(null)
      actions.toast('Posted')
    } catch (err) { actions.toast(err.message, 'bad') } finally { setBusy(false) }
  }
  return (
    <form className="card composer" onSubmit={submit}>
      <div className="composer-row">
        <Avatar name={fullName(me)} src={me.profilePhoto} color={colorFor(fullName(me))} size={44} />
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={text.length > 120 || text.includes('\n') ? 4 : 2} maxLength={3000} placeholder={placeholder}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(e) }} />
      </div>
      <AnimatePresence>
        {image && (
          <motion.div className="composer-img" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}>
            <img src={image} alt="Selected" />
            <button type="button" className="round white" onClick={() => setImage(null)} aria-label="Remove the photo"><Icon name="X" size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="composer-bar">
        <button type="button" className="composer-tool" onClick={() => input.current.click()}><Icon name="ImagePlus" size={18} />Photo</button>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={pick} />
        {text.length > 2500 && <span className="composer-count">{3000 - text.length} left</span>}
        <button className="btn" disabled={busy || (!text.trim() && !image)}><Icon name="Send" size={15} />{busy ? 'Posting…' : 'Post'}</button>
      </div>
    </form>
  )
}

/** Follow / Following toggle. */
export function FollowButton({ userId, following, onChange, small }) {
  const { actions } = useStore()
  const [busy, setBusy] = useState(false)
  const toggle = async () => {
    setBusy(true)
    try { onChange?.((await (following ? api.unfollow(userId) : api.follow(userId))).following) } catch (e) { actions.toast(e.message, 'bad') } finally { setBusy(false) }
  }
  return (
    <button type="button" className={`btn follow-btn ${following ? 'ghost' : ''} ${small ? 'sm' : ''}`} disabled={busy} onClick={toggle} title={following ? 'Unfollow' : undefined}>
      <Icon name={following ? 'UserCheck' : 'UserPlus'} size={small ? 14 : 15} />{following ? 'Following' : 'Follow'}
    </button>
  )
}

/** Avatar, name and a line under it, linking to the person's profile; `children` go on the right. */
export function PersonRow({ person, sub, children }) {
  return (
    <div className="person-row">
      <Link to={`/u/${person.id}`} className="person-link">
        <Avatar name={person.name} src={person.avatar} color={colorFor(person.name)} size={40} />
        <span><b>{person.name}</b><small>{sub ?? (person.position || roleLabel[person.role])}</small></span>
      </Link>
      {children}
    </div>
  )
}

function Comments({ post, onCount }) {
  const { state, actions } = useStore()
  const me = state.user
  const [list, setList] = useState(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    let live = true
    api.comments(post.id).then((r) => live && setList(r.comments)).catch(() => live && setList([]))
    return () => { live = false }
  }, [post.id])
  const send = async (e) => {
    e.preventDefault()
    const body = text.trim()
    if (!body || busy) return
    setBusy(true)
    try {
      const { comment } = await api.addComment(post.id, body)
      const next = [...(list ?? []), comment]
      setList(next); onCount(next.length); setText('')
    } catch (err) { actions.toast(err.message, 'bad') } finally { setBusy(false) }
  }
  const remove = async (c) => {
    try {
      await api.deleteComment(c.id)
      const next = list.filter((x) => x.id !== c.id)
      setList(next); onCount(next.length)
    } catch (err) { actions.toast(err.message, 'bad') }
  }
  return (
    <div className="comments">
      {list === null && <div className="comments-loading">Loading comments…</div>}
      {list?.map((c) => (
        <div key={c.id} className="comment">
          <Link to={`/u/${c.author.id}`}><Avatar name={c.author.name} src={c.author.avatar} color={colorFor(c.author.name)} size={32} /></Link>
          <div className="comment-bubble">
            <div className="comment-head"><Link to={`/u/${c.author.id}`}>{c.author.name}</Link><small>{timeAgo(c.createdAt)}</small>
              {c.canDelete && <button type="button" onClick={() => remove(c)} aria-label="Delete comment" title="Delete"><Icon name="Trash2" size={13} /></button>}</div>
            <p><Linkified text={c.body} /></p>
          </div>
        </div>
      ))}
      <form className="comment-new" onSubmit={send}>
        <Avatar name={fullName(me)} src={me.profilePhoto} color={colorFor(fullName(me))} size={32} />
        <input className="input" value={text} onChange={(e) => setText(e.target.value)} maxLength={1500} placeholder="Add a comment…" />
        <button className="round" disabled={busy || !text.trim()} aria-label="Send comment"><Icon name="Send" size={15} /></button>
      </form>
    </div>
  )
}

/** One post: author, text, photo, likes and comments. */
export function PostCard({ post, author, onRemove, onPatch }) {
  const { actions } = useStore()
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const name = author?.name ?? 'Someone'
  const toggleLike = async () => {
    const was = { liked: post.liked, likes: post.likes }
    onPatch(post.id, { liked: !was.liked, likes: was.likes + (was.liked ? -1 : 1) }) // optimistic
    try { onPatch(post.id, await (was.liked ? api.unlike(post.id) : api.like(post.id))) } catch (e) { onPatch(post.id, was); actions.toast(e.message, 'bad') }
  }
  const remove = async () => {
    try { await api.deletePost(post.id); onRemove(post.id); actions.toast('Post deleted') } catch (e) { actions.toast(e.message, 'bad') }
  }
  return (
    <motion.article layout className="card post" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}>
      <header className="post-head">
        <Link to={`/u/${post.authorId}`}><Avatar name={name} src={author?.avatar} color={colorFor(name)} size={46} /></Link>
        <div className="post-who">
          <Link to={`/u/${post.authorId}`} className="post-name">{name}</Link>
          <small>{author?.position || roleLabel[author?.role] || ''}</small>
          <small className="post-time"><Icon name="Clock" size={11} />{timeAgo(post.createdAt)}</small>
        </div>
        {post.canDelete && (confirm ? (
          <div className="post-confirm">
            <button type="button" className="btn ghost sm" onClick={() => setConfirm(false)}>Cancel</button>
            <button type="button" className="btn danger sm" onClick={remove}><Icon name="Trash2" size={14} />Delete</button>
          </div>
        ) : <button type="button" className="icon-btn post-menu" onClick={() => setConfirm(true)} aria-label="Delete post" title="Delete post"><Icon name="Trash2" size={16} /></button>)}
      </header>
      {post.body && <p className="post-body"><Linkified text={post.body} /></p>}
      {post.image && <a className="post-img" href={fileUrl(post.image)} target="_blank" rel="noreferrer"><img src={fileUrl(post.image)} alt={`Photo shared by ${name}`} loading="lazy" /></a>}
      {(post.likes > 0 || post.comments > 0) && (
        <div className="post-stats">
          {post.likes > 0 && <span><i className="like-dot"><Icon name="Heart" size={10} fill="currentColor" draw={false} /></i>{post.likes}</span>}
          {post.comments > 0 && <button type="button" onClick={() => setOpen(true)}>{post.comments} comment{post.comments === 1 ? '' : 's'}</button>}
        </div>
      )}
      <div className="post-actions">
        <button type="button" className={`post-act ${post.liked ? 'on' : ''}`} onClick={toggleLike} aria-pressed={post.liked}><Icon name="Heart" size={18} fill={post.liked ? 'currentColor' : 'none'} />Like</button>
        <button type="button" className={`post-act ${open ? 'open' : ''}`} onClick={() => setOpen((o) => !o)}><Icon name="MessageCircle" size={18} />Comment</button>
      </div>
      {open && <Comments post={post} onCount={(n) => onPatch(post.id, { comments: n })} />}
    </motion.article>
  )
}

/** A list of posts with loading, empty state and "load more". */
export function PostList({ feed, empty }) {
  return (
    <>
      <AnimatePresence initial={false}>
        {feed.posts.map((p) => <PostCard key={p.id} post={p} author={feed.people[p.authorId]} onRemove={feed.remove} onPatch={feed.patch} />)}
      </AnimatePresence>
      {feed.loading && !feed.posts.length && <div className="card post-skeleton"><i /><i /><i /></div>}
      {!feed.loading && !feed.posts.length && empty}
      {feed.more && <button type="button" className="btn ghost load-more" onClick={feed.loadMore}>Show older posts <Icon name="ChevronDown" size={15} /></button>}
    </>
  )
}

/** A person's posts, with the composer when they are yours (profile pages). */
export function ProfilePosts({ userId, mine }) {
  const load = useCallback((before) => api.profilePosts(userId, before), [userId])
  const feed = usePosts(load)
  return (
    <div className="post-stack">
      {mine && <Composer onPosted={feed.add} />}
      <PostList feed={feed} empty={(
        <div className="card empty-card">
          <IconTile icon="Newspaper" size={46} />
          <div><b>No posts yet</b><p>{mine ? 'Share your first update: a win, a certificate, something you learned.' : 'When they post, it shows up here.'}</p></div>
        </div>
      )} />
    </div>
  )
}
