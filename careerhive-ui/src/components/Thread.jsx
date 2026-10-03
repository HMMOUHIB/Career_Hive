import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { colorFor, useStore } from '../store/store'
import { Avatar, Icon } from './ui'

/* Messenger-style building blocks shared by the hub and the floating chat windows. */

export const CHAT_THEMES = [
  { id: 'default', label: 'CareerHive', bubble: 'var(--accent)' },
  { id: 'ocean', label: 'Ocean', bubble: 'linear-gradient(160deg, #3aa0ff, #0a6cff)' },
  { id: 'berry', label: 'Berry', bubble: 'linear-gradient(160deg, #ff5ca8, #c2185b)' },
  { id: 'grape', label: 'Grape', bubble: 'linear-gradient(160deg, #a67cff, #6a3df0)' },
  { id: 'citrus', label: 'Citrus', bubble: 'linear-gradient(160deg, #ffb341, #ff6a1f)' },
  { id: 'mint', label: 'Mint', bubble: 'linear-gradient(160deg, #34d399, #0f9f6e)' },
  { id: 'night', label: 'Night', bubble: 'linear-gradient(160deg, #4b5563, #111827)' },
]
export const QUICK_EMOJIS = ['👍', '❤️', '🔥', '🚀', '✅', '👏', '😂', '🙏']
const REACTIONS = ['❤️', '😆', '😮', '😢', '😠', '👍']
const EMOJIS = '😀 😃 😄 😁 😆 😅 😂 🙂 😉 😊 😍 🤩 😘 😎 🤓 🤔 🤨 😐 😴 😮 😢 😭 😤 😡 🤯 🥳 👍 👎 👏 🙌 🙏 💪 👀 🔥 ✨ 🎉 🚀 ✅ ❌ ❤️ 💯 ☕ 🍕 💻 📌 📅 🏆'.split(' ')

export const STATUS_LABEL = { online: 'Active now', busy: 'Busy', away: 'Away', off: 'Offline' }
export const bubbleFor = (prefs) => CHAT_THEMES.find((t) => t.id === prefs?.theme)?.bubble ?? 'var(--accent)'

const isEmojiOnly = (t) => /^(\p{Extended_Pictographic}|\p{Emoji_Component}|\s|‍|️){1,8}$/u.test(t) && !/[0-9#*]/.test(t)
const mins = (t) => { const m = /^(\d{1,2}):(\d{2})/.exec(t ?? ''); return m ? +m[1] * 60 + +m[2] : null }

/** Group consecutive messages by sender; insert a time divider when there's a gap. */
function useGroups(msgs) {
  return useMemo(() => {
    const out = []
    msgs.forEach((m, i) => {
      const prev = msgs[i - 1]
      const a = mins(prev?.time), b = mins(m.time)
      const gap = !prev || a == null || b == null ? prev?.time !== m.time && (a == null || b == null) : Math.abs(b - a) >= 20
      if (gap) out.push({ divider: m.time, key: `d${m.id}` })
      const last = out[out.length - 1]
      if (last && !last.divider && last.sender === m.sender) last.items.push(m)
      else out.push({ sender: m.sender, items: [m], key: `g${m.id}` })
    })
    return out
  }, [msgs])
}

function Bubble({ m, pos, contact, cid, onReply, mine }) {
  const { state, actions } = useStore()
  const [picker, setPicker] = useState(false)
  const reaction = state.reactions[`${cid}:${m.id}`]
  const emoji = isEmojiOnly(m.text)
  return (
    <div className={`mrow ${mine ? 'me' : ''}`} onMouseLeave={() => setPicker(false)}>
      <div className="mstack">
        {m.replyTo && (
          <div className="mreply-quote">
            <small><Icon name="Reply" size={11} draw={false} /> {mine ? 'You' : contact.name.split(' ')[0]} replied to {m.replyTo.sender === 'me' ? 'yourself' : contact.name.split(' ')[0]}</small>
            <span>{m.replyTo.text}</span>
          </div>
        )}
        <div className="mline">
          <motion.div className={`mbubble ${emoji ? 'emoji' : ''} ${pos}`} layout="position"
            initial={{ opacity: 0, scale: 0.85, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            title={m.time}>
            {m.text}
            <AnimatePresence>
              {reaction && (
                <motion.button className="mreaction" onClick={() => actions.react(cid, m.id, reaction)} initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} aria-label="Remove reaction">
                  {reaction}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="mactions">
            <button onClick={() => setPicker((p) => !p)} aria-label="React"><Icon name="Smile" size={16} draw={false} /></button>
            <button onClick={() => onReply(m)} aria-label="Reply"><Icon name="Reply" size={16} draw={false} /></button>
            <AnimatePresence>
              {picker && (
                <motion.div className="mreact-bar" initial={{ opacity: 0, y: 8, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.8 }}>
                  {REACTIONS.map((e, i) => (
                    <motion.button key={e} initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { delay: i * 0.03 } }} whileHover={{ scale: 1.35, y: -4 }}
                      onClick={() => { actions.react(cid, m.id, e); setPicker(false) }}>{e}</motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Thread({ contact, compact, onReply }) {
  const { state } = useStore()
  const cid = String(contact.id)
  const msgs = state.chat[cid] ?? state.chat[contact.id] ?? []
  const groups = useGroups(msgs)
  const typing = state.typing === cid
  const body = useRef(null)
  const lastMine = [...msgs].reverse().find((m) => m.sender === 'me')
  const answered = lastMine && msgs.indexOf(lastMine) < msgs.length - 1

  useEffect(() => { body.current?.scrollTo({ top: body.current.scrollHeight, behavior: 'smooth' }) }, [msgs.length, typing, cid])

  return (
    <div className={`mthread ${compact ? 'compact' : ''}`} ref={body} style={{ '--bubble': bubbleFor(state.chatPrefs[cid]) }}>
      <div className="mintro">
        <Avatar name={contact.name} src={contact.avatar} color={colorFor(contact.name)} size={compact ? 60 : 84} status={contact.status} />
        <b>{contact.name}</b>
        <small>{contact.role ?? 'Teammate'}{contact.team ? ` · ${contact.team}` : ''}</small>
        {!compact && <small className="mintro-note">You're both in {contact.team ?? 'the same team'}</small>}
      </div>
      {groups.map((g) => g.divider !== undefined ? (
        <div className="mtime" key={g.key}>{g.divider}</div>
      ) : (
        <div key={g.key} className={`mgroup ${g.sender === 'me' ? 'me' : ''}`}>
          {g.sender !== 'me' && <div className="mgroup-ava"><Avatar name={contact.name} src={contact.avatar} color={colorFor(contact.name)} size={compact ? 26 : 30} /></div>}
          <div className="mgroup-col">
            {g.items.map((m, i) => (
              <Bubble key={m.id} m={m} cid={cid} contact={contact} onReply={onReply} mine={g.sender === 'me'}
                pos={g.items.length === 1 ? 'solo' : i === 0 ? 'first' : i === g.items.length - 1 ? 'last' : 'mid'} />
            ))}
          </div>
        </div>
      ))}
      {lastMine && (
        <div className="mseen">
          {answered
            ? <><Avatar name={contact.name} src={contact.avatar} color={colorFor(contact.name)} size={14} /> Seen</>
            : <><Icon name="CircleCheck" size={13} draw={false} /> Sent</>}
        </div>
      )}
      <AnimatePresence>
        {typing && (
          <motion.div className="mgroup" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <div className="mgroup-ava"><Avatar name={contact.name} src={contact.avatar} color={colorFor(contact.name)} size={compact ? 26 : 30} /></div>
            <div className="mbubble solo typing"><i /><i /><i /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Composer({ contact, replyTo, onCancelReply, compact }) {
  const { state, actions } = useStore()
  const [text, setText] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const input = useRef(null)
  const cid = String(contact.id)
  const quick = state.chatPrefs[cid]?.emoji ?? '👍'

  useEffect(() => { input.current?.focus() }, [cid, replyTo])

  const send = (t) => {
    const v = (t ?? text).trim()
    if (!v) return
    if (t == null) setText('')
    setEmojiOpen(false)
    const reply = replyTo ? { id: replyTo.id, text: replyTo.text, sender: replyTo.sender } : undefined
    onCancelReply?.()
    actions.sendChat(contact.id, v, reply).catch(() => t == null && setText(v))
  }

  return (
    <div className={`mcomposer-wrap ${compact ? 'compact' : ''}`} style={{ '--bubble': bubbleFor(state.chatPrefs[cid]) }}>
      <AnimatePresence>
        {replyTo && (
          <motion.div className="mreplying" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div>
              <b>Replying to {replyTo.sender === 'me' ? 'yourself' : contact.name.split(' ')[0]}</b>
              <span>{replyTo.text}</span>
            </div>
            <button onClick={onCancelReply} aria-label="Cancel reply"><Icon name="X" size={16} draw={false} /></button>
          </motion.div>
        )}
      </AnimatePresence>
      <form className="mcomposer" onSubmit={(e) => { e.preventDefault(); send() }}>
        {!compact && (
          <div className="mtools">
            <button type="button" aria-label="Quick replies" onClick={() => setText((t) => t || 'Can we sync on this today?')}><Icon name="CirclePlus" size={20} draw={false} /></button>
            <button type="button" aria-label="Share a formation link" onClick={() => setText((t) => `${t}${t ? ' ' : ''}📚 `)}><Icon name="BookOpen" size={20} draw={false} /></button>
          </div>
        )}
        <div className="minput">
          <input ref={input} value={text} onChange={(e) => setText(e.target.value)} placeholder="Aa" aria-label={`Message ${contact.name}`} />
          <button type="button" className="memoji-btn" onClick={() => setEmojiOpen((o) => !o)} aria-label="Emoji"><Icon name="Smile" size={19} draw={false} /></button>
          <AnimatePresence>
            {emojiOpen && (
              <motion.div className="memoji-pop" initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }}>
                {EMOJIS.map((e) => <button type="button" key={e} onClick={() => { setText((t) => t + e); input.current?.focus() }}>{e}</button>)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          {text.trim() ? (
            <motion.button key="send" className="msend" initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0 }} aria-label="Send">
              <Icon name="SendHorizontal" size={20} draw={false} />
            </motion.button>
          ) : (
            <motion.button key="quick" type="button" className="msend quick" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} whileTap={{ scale: 1.6 }}
              onClick={() => send(quick)} aria-label={`Send ${quick}`}>
              <span>{quick}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </form>
    </div>
  )
}

/** Right-hand "conversation info" panel. */
export function ChatInfo({ contact, onClose }) {
  const { state, actions } = useStore()
  const cid = String(contact.id)
  const prefs = state.chatPrefs[cid] ?? {}
  const [open, setOpen] = useState({ custom: true, info: true, media: false })
  const msgs = state.chat[cid] ?? []
  const links = msgs.filter((m) => /https?:\/\/|📚/.test(m.text))
  const section = (key, title, children) => (
    <div className="minfo-sec">
      <button className="minfo-sec-head" onClick={() => setOpen({ ...open, [key]: !open[key] })}>
        {title}<Icon name="ChevronDown" size={18} draw={false} style={{ transform: open[key] ? 'rotate(180deg)' : 'none', transition: 'transform .3s' }} />
      </button>
      <AnimatePresence initial={false}>
        {open[key] && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}><div className="minfo-sec-body">{children}</div></motion.div>}
      </AnimatePresence>
    </div>
  )
  return (
    <aside className="minfo">
      {onClose && <button className="minfo-close" onClick={onClose} aria-label="Close info"><Icon name="X" size={18} draw={false} /></button>}
      <div className="mintro" style={{ paddingTop: 10 }}>
        <Avatar name={contact.name} src={contact.avatar} color={colorFor(contact.name)} size={80} status={contact.status} />
        <b style={{ fontSize: 17 }}>{contact.name}</b>
        <small>{contact.tag ?? STATUS_LABEL[contact.status] ?? contact.role}</small>
      </div>
      <div className="minfo-actions">
        <div><button onClick={() => actions.setChatPref(cid, { muted: !prefs.muted })} className={prefs.muted ? 'on' : ''}><Icon name={prefs.muted ? 'BellOff' : 'Bell'} size={18} /></button><small>{prefs.muted ? 'Unmute' : 'Mute'}</small></div>
        <div><button onClick={() => document.querySelector('.minput input')?.focus()}><Icon name="MessageCircle" size={18} /></button><small>Message</small></div>
        <div><button onClick={() => actions.setChatPref(cid, { pinned: !prefs.pinned })} className={prefs.pinned ? 'on' : ''}><Icon name="Pin" size={18} /></button><small>{prefs.pinned ? 'Unpin' : 'Pin'}</small></div>
      </div>
      {section('info', 'Chat info', (
        <div className="minfo-list">
          <div><Icon name="Briefcase" size={17} draw={false} /><span>{contact.role ?? '—'}</span></div>
          <div><Icon name="Users" size={17} draw={false} /><span>{contact.team ?? '—'}</span></div>
          <div><Icon name="GraduationCap" size={17} draw={false} /><span>{contact.completedTrainings ?? 0} trainings completed</span></div>
          {!!contact.skills?.length && <div className="tags" style={{ minHeight: 0, paddingTop: 6 }}>{contact.skills.map((s) => <span key={s} className="chip">{s}</span>)}</div>}
        </div>
      ))}
      {section('custom', 'Customize chat', (
        <>
          <div className="minfo-label">Theme</div>
          <div className="mthemes">
            {CHAT_THEMES.map((t) => (
              <button key={t.id} title={t.label} className={(prefs.theme ?? 'default') === t.id ? 'on' : ''} onClick={() => actions.setChatPref(cid, { theme: t.id })} style={{ background: t.bubble }} aria-label={`${t.label} theme`} />
            ))}
          </div>
          <div className="minfo-label">Quick reaction</div>
          <div className="mquick">
            {QUICK_EMOJIS.map((e) => <button key={e} className={(prefs.emoji ?? '👍') === e ? 'on' : ''} onClick={() => actions.setChatPref(cid, { emoji: e })}>{e}</button>)}
          </div>
        </>
      ))}
      {section('media', 'Shared links & files', links.length
        ? <div className="minfo-list">{links.map((m) => <div key={m.id}><Icon name="Link" size={16} draw={false} /><span>{m.text}</span></div>)}</div>
        : <div style={{ fontSize: 12.5, color: 'var(--dim)' }}>Nothing shared yet.</div>)}
    </aside>
  )
}

