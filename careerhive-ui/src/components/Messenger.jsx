import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { colorFor, useDerived, useStore } from '../store/store'
import { Composer, STATUS_LABEL, Thread } from './Thread'
import { Avatar, Icon } from './ui'

const rank = { online: 0, busy: 1, away: 2, undefined: 3, off: 4 }
const first = (n) => n.split(' ')[0]

/** Messenger-style "Active now" strip for the sidebar. */
export function ActiveNow() {
  const { state, actions } = useStore()
  const { contacts } = useDerived()
  if (!contacts.length) return null
  const people = contacts.slice().sort((a, b) => rank[a.status] - rank[b.status])
  const online = people.filter((p) => p.status === 'online').length
  return (
    <div className="active-now">
      <div className="nav-label" style={{ padding: '0 12px 10px' }}>
        <i>友</i>{online ? 'Active now' : 'Your team'}
        {online > 0 && <span className="live-dot" aria-label={`${online} online`}>{online}</span>}
      </div>
      <div className="active-row">
        {people.map((p, i) => {
          const unread = state.unread[String(p.id)] ?? 0
          return (
            <motion.button key={p.id} className="active-person" onClick={() => actions.openChat(p.id)} title={`${p.name} · ${STATUS_LABEL[p.status] ?? p.role ?? ''}`}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }} whileHover={{ y: -3 }} whileTap={{ scale: 0.92 }}>
              <span className={`ring ${p.status === 'online' ? 'on' : ''}`}>
                <Avatar name={p.name} src={p.avatar} color={colorFor(p.name)} size={40} status={p.status} />
                {unread > 0 && <b className="bubble-count">{unread}</b>}
              </span>
              <small>{first(p.name)}</small>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

function ChatWindow({ contact, index }) {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const [replyTo, setReplyTo] = useState(null)
  const cid = String(contact.id)
  const min = !!state.minimized[cid]
  const typing = state.typing === cid
  const unread = state.unread[cid] ?? 0

  return (
    <motion.section className={`chat-win ${min ? 'min' : ''}`} layout
      initial={{ opacity: 0, y: 40, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }} style={{ zIndex: 70 - index }} aria-label={`Chat with ${contact.name}`}>
      <header className="chat-win-head" onClick={() => actions.minimizeChat(cid, !min)}>
        <Avatar name={contact.name} src={contact.avatar} color={colorFor(contact.name)} size={34} status={contact.status} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <b>{contact.name}</b>
          <small>{typing ? 'typing…' : contact.tag ?? STATUS_LABEL[contact.status] ?? contact.role}</small>
        </div>
        {min && unread > 0 && <span className="bubble-count" style={{ position: 'static' }}>{unread}</span>}
        <button onClick={(e) => { e.stopPropagation(); actions.closeChat(cid); navigate(`/team?c=${cid}`) }} aria-label="Open in hub"><Icon name="Maximize2" size={15} draw={false} /></button>
        <button onClick={(e) => { e.stopPropagation(); actions.minimizeChat(cid, !min) }} aria-label={min ? 'Expand' : 'Minimize'}><Icon name={min ? 'ChevronUp' : 'Minus'} size={16} draw={false} /></button>
        <button onClick={(e) => { e.stopPropagation(); actions.closeChat(cid) }} aria-label="Close"><Icon name="X" size={16} draw={false} /></button>
      </header>
      {!min && (
        <>
          <Thread contact={contact} compact onReply={setReplyTo} />
          <Composer contact={contact} compact replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
        </>
      )}
    </motion.section>
  )
}

/** Floating chat windows docked bottom-right, available on every page except the hub. */
export function ChatDock() {
  const { state } = useStore()
  const { contacts } = useDerived()
  const { pathname } = useLocation()
  if (pathname === '/team') return null
  const open = state.dock.map((id) => contacts.find((c) => String(c.id) === id)).filter(Boolean)
  return (
    <div className="chat-dock">
      <AnimatePresence>
        {open.map((c, i) => <ChatWindow key={c.id} contact={c} index={i} />)}
      </AnimatePresence>
    </div>
  )
}
