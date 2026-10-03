import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ChatInfo, Composer, STATUS_LABEL, Thread } from '../components/Thread'
import { Avatar, Icon } from '../components/ui'
import { colorFor, useDerived, useStore } from '../store/store'
import { Empty } from './Dashboard'

const first = (n) => n.split(' ')[0]

export default function TeamHub() {
  const { state, actions } = useStore()
  const { contacts } = useDerived()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [info, setInfo] = useState(() => window.innerWidth > 1280)
  const [replyTo, setReplyTo] = useState(null)

  const rows = useMemo(() => contacts
    .map((c) => {
      const list = state.chat[String(c.id)] ?? state.chat[c.id] ?? []
      return { ...c, last: list.at(-1), count: list.length, unread: state.unread[String(c.id)] ?? 0, prefs: state.chatPrefs[String(c.id)] ?? {} }
    })
    .filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    .filter((c) => filter === 'all' || (filter === 'unread' ? c.unread > 0 : c.status === 'online'))
    .sort((a, b) => (b.prefs.pinned ? 1 : 0) - (a.prefs.pinned ? 1 : 0) || (b.last ? 1 : 0) - (a.last ? 1 : 0) || b.count - a.count),
  [contacts, q, filter, state.chat, state.unread, state.chatPrefs])

  const cid = params.get('c')
  const contact = contacts.find((c) => String(c.id) === cid) ?? (window.innerWidth > 820 ? rows[0] : null)
  const active = contacts.filter((c) => c.status === 'online')

  useEffect(() => { if (contact) actions.setHubOpen(contact.id); return () => actions.setHubOpen(null) }, [contact?.id]) 
  useEffect(() => setReplyTo(null), [contact?.id])
  const open = (id) => setParams({ c: id }, { replace: true })

  return (
    <div className={`messenger ${info && contact ? 'with-info' : ''} ${contact ? 'has-thread' : ''}`}>
      {/* ---------------- chat list ---------------- */}
      <motion.section className="mlist" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <header className="mlist-head">
          <h2>Chats</h2>
          <button className="mround" aria-label="New message" onClick={() => document.querySelector('.mlist-search input')?.focus()}><Icon name="SquarePen" size={18} /></button>
        </header>
        <label className="mlist-search"><Icon name="Search" size={16} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search teammates" /></label>
        <div className="mfilters">
          {[['all', 'All'], ['unread', 'Unread'], ['online', 'Active']].map(([k, l]) => (
            <button key={k} className={filter === k ? 'on' : ''} onClick={() => setFilter(k)}>{l}</button>
          ))}
        </div>

        {active.length > 0 && filter === 'all' && !q && (
          <div className="mstories">
            {active.map((c) => (
              <button key={c.id} onClick={() => open(c.id)}>
                <Avatar name={c.name} src={c.avatar} color={colorFor(c.name)} size={52} status="online" />
                <small>{first(c.name)}</small>
              </button>
            ))}
          </div>
        )}

        <div className="mconvs">
          <AnimatePresence initial={false}>
            {rows.map((c) => (
              <motion.button layout key={c.id} className={`mconv ${String(c.id) === String(contact?.id) ? 'on' : ''} ${c.unread ? 'unread' : ''}`} onClick={() => open(c.id)}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Avatar name={c.name} src={c.avatar} color={colorFor(c.name)} size={54} status={c.status} />
                <div className="mconv-text">
                  <b>{c.name}{c.prefs.pinned && <Icon name="Pin" size={12} draw={false} className="mpin" />}</b>
                  <span>
                    {state.typing === String(c.id)
                      ? <em>typing…</em>
                      : c.last ? <><span className="mprev">{c.last.sender === 'me' ? 'You: ' : ''}{c.last.text}</span><span className="mdot">·</span>{c.last.time}</> : <span className="mprev">{c.tag ?? c.role}</span>}
                  </span>
                </div>
                <div className="mconv-end">
                  {c.prefs.muted && <Icon name="BellOff" size={14} draw={false} />}
                  {c.unread > 0 && <i className="munread" aria-label={`${c.unread} unread`} />}
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
          {!rows.length && <div style={{ padding: 20, color: 'var(--dim)', fontSize: 13 }}>{q ? 'No teammates match.' : 'No chats here.'}</div>}
        </div>
      </motion.section>

      {/* ---------------- conversation ---------------- */}
      <motion.section className="mconvo" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {!contact ? (
          <div style={{ margin: 'auto' }}><Empty icon="MessagesSquare" title="Select a chat" text="Pick a teammate to start talking." /></div>
        ) : (
          <>
            <header className="mconvo-head">
              <button className="mback" onClick={() => setParams({}, { replace: true })} aria-label="Back to chats"><Icon name="ArrowLeft" size={20} /></button>
              <Avatar name={contact.name} src={contact.avatar} color={colorFor(contact.name)} size={42} status={contact.status} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <b>{contact.name}</b>
                <small>{state.typing === String(contact.id) ? 'typing…' : contact.tag ?? STATUS_LABEL[contact.status] ?? contact.role}</small>
              </div>
              <button className={`mround accent ${info ? 'on' : ''}`} onClick={() => setInfo((v) => !v)} aria-label="Conversation info"><Icon name="Info" size={20} /></button>
            </header>
            <Thread key={contact.id} contact={contact} onReply={setReplyTo} />
            <Composer contact={contact} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} />
          </>
        )}
      </motion.section>

      {/* ---------------- info panel ---------------- */}
      <AnimatePresence>
        {info && contact && (
          <motion.div className="minfo-wrap" key="info" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 30 }}>
            <ChatInfo contact={contact} onClose={() => setInfo(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
