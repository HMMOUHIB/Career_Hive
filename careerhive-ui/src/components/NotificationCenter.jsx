import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { deriveNotifications, playPop, timeAgo, TYPE_STYLE } from '../store/notifications'
import { colorFor, useDerived, useStore } from '../store/store'
import { Avatar, Icon } from './ui'

const DAY = 864e5

/** All notifications with a `read` flag, newest first. */
export function useNotifications() {
  const { state } = useStore()
  const { contacts } = useDerived()
  return useMemo(() => {
    if (state.serverNotifs) return state.serverNotifs
    const first = state.notifRead.__first ?? Date.now()
    return deriveNotifications(state, contacts).map((n) => ({
      ...n, read: n.live ? false : !!state.notifRead[n.id] || n.at < first - 10 * DAY,
    }))
  }, [state, contacts])
}

function Item({ n, onOpen }) {
  const st = TYPE_STYLE[n.type] ?? TYPE_STYLE.info
  return (
    <motion.button layout className={`nitem ${n.read ? '' : 'unread'}`} onClick={() => onOpen(n)}
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }}>
      <div className="nitem-ava">
        {n.avatar
          ? <Avatar name={n.avatar.name} src={n.avatar.avatar} color={colorFor(n.avatar.name)} size={48} />
          : <div className="nitem-ic" style={{ background: `color-mix(in srgb, ${st.color} 18%, transparent)`, color: st.color }}><Icon name={st.icon} size={22} /></div>}
        <span className="nitem-badge" style={{ background: st.color }}><Icon name={st.icon} size={11} draw={false} /></span>
      </div>
      <div className="nitem-text">
        <b>{n.title}</b>
        {n.body && <span>{n.body}</span>}
        <small style={{ color: n.read ? 'var(--dim)' : st.color }}>{timeAgo(n.at, n.dateOnly)}</small>
      </div>
      {!n.read && <i className="nitem-dot" />}
    </motion.button>
  )
}

export function NotificationBell() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const list = useNotifications()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('all')
  const ref = useRef(null)
  const unread = list.filter((n) => !n.read)
  const shown = tab === 'all' ? list : unread

  useEffect(() => {
    if (!open) return
    const off = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', off); window.addEventListener('keydown', esc)
    return () => { document.removeEventListener('pointerdown', off); window.removeEventListener('keydown', esc) }
  }, [open])

  const openItem = (n) => {
    actions.markNotif(n)
    setOpen(false)
    if (n.chat) actions.openChat(n.chat)
    else if (n.link) navigate(n.link)
  }
  const askDesktop = async () => {
    if (!('Notification' in window)) return actions.toast('This browser has no desktop notifications', 'bad')
    const p = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission().catch(() => 'denied')
    if (p === 'granted') actions.setNotifPrefs({ desktop: !state.notifPrefs.desktop })
    else actions.toast('Desktop notifications are blocked in this browser', 'bad')
  }

  const isToday = (n) => (n.dateOnly ? ['Today'].includes(timeAgo(n.at, true)) : Date.now() - n.at < DAY)
  const today = shown.filter(isToday)
  const earlier = shown.filter((n) => !isToday(n))

  return (
    <div className="nbell" ref={ref}>
      <button className={`icon-btn ${open ? 'on' : ''}`} aria-label={`Notifications${unread.length ? `, ${unread.length} unread` : ''}`} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Icon name="Bell" size={18} className={unread.length ? 'ic-bell ringing' : ''} />
        <AnimatePresence>
          {unread.length > 0 && (
            <motion.span key={unread.length} className="nbadge" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }}>
              {unread.length > 9 ? '9+' : unread.length}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div className="npanel" role="dialog" aria-label="Notifications"
            initial={{ opacity: 0, y: -10, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.96 }} transition={{ type: 'spring', stiffness: 420, damping: 32 }}>
            <header className="npanel-head">
              <h3>Notifications</h3>
              <button className="nlink" disabled={!unread.length} onClick={() => actions.markAllNotifs(unread)}><Icon name="CheckCheck" size={15} draw={false} />Mark all read</button>
            </header>
            <div className="mfilters" style={{ padding: '0 12px 8px' }}>
              <button className={tab === 'all' ? 'on' : ''} onClick={() => setTab('all')}>All</button>
              <button className={tab === 'unread' ? 'on' : ''} onClick={() => setTab('unread')}>Unread{unread.length ? ` (${unread.length})` : ''}</button>
            </div>
            <div className="npanel-list">
              {!shown.length && (
                <div className="nempty"><div className="lk"><Icon name="BellRing" size={26} /></div><b>You're all caught up</b><span>New messages and decisions will show up here.</span></div>
              )}
              <AnimatePresence initial={false}>
                {today.length > 0 && <div className="ngroup" key="t">Today</div>}
                {today.map((n) => <Item key={n.id} n={n} onOpen={openItem} />)}
                {earlier.length > 0 && <div className="ngroup" key="e">Earlier</div>}
                {earlier.map((n) => <Item key={n.id} n={n} onOpen={openItem} />)}
              </AnimatePresence>
            </div>
            <footer className="npanel-foot">
              <button className={`ntoggle ${state.notifPrefs.sound ? 'on' : ''}`} onClick={() => actions.setNotifPrefs({ sound: !state.notifPrefs.sound })}>
                <Icon name={state.notifPrefs.sound ? 'Volume2' : 'VolumeX'} size={15} draw={false} />Sound {state.notifPrefs.sound ? 'on' : 'off'}
              </button>
              <button className={`ntoggle ${state.notifPrefs.desktop ? 'on' : ''}`} onClick={askDesktop}>
                <Icon name="Monitor" size={15} draw={false} />Desktop alerts {state.notifPrefs.desktop ? 'on' : 'off'}
              </button>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Pop-up cards (bottom-left) + sound + desktop notification + tab-title count when something new arrives. */
export function HeadsUp() {
  const { state, actions } = useStore()
  const navigate = useNavigate()
  const list = useNotifications()
  const known = useRef(null)
  const mountedAt = useRef(Date.now())
  const [cards, setCards] = useState([])
  const unreadCount = list.filter((n) => !n.read).length

  useEffect(() => {
    const base = 'CareerHive Workspace'
    document.title = unreadCount ? `(${unreadCount}) ${base}` : base
  }, [unreadCount])

  useEffect(() => {
    const ids = new Set(list.map((n) => n.id))
    // first seconds after sign-in: learn what already exists instead of popping it
    if (known.current === null || Date.now() - mountedAt.current < 3000) { known.current = ids; return }
    const fresh = list.filter((n) => !n.read && !known.current.has(n.id))
    known.current = ids
    if (!fresh.length) return
    const muted = (n) => n.chat && state.chatPrefs[n.chat]?.muted
    const loud = fresh.filter((n) => !muted(n))
    if (!loud.length) return
    setCards((c) => [...loud.slice(0, 3).map((n) => ({ ...n, key: `${n.id}-${Date.now()}` })), ...c].slice(0, 3))
    if (state.notifPrefs.sound) playPop()
    if (state.notifPrefs.desktop && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      loud.forEach((n) => { try { new Notification(n.title, { body: n.body, tag: n.id }) } catch { /* ignore */ } })
    }
  }, [list]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cards.length) return
    const t = setTimeout(() => setCards((c) => c.slice(0, -1)), 5500)
    return () => clearTimeout(t)
  }, [cards])

  const open = (n) => {
    setCards((c) => c.filter((x) => x.key !== n.key))
    actions.markNotif(n)
    if (n.chat) actions.openChat(n.chat)
    else if (n.link) navigate(n.link)
  }

  return (
    <div className="headsup" aria-live="polite">
      <AnimatePresence>
        {cards.map((n) => {
          const st = TYPE_STYLE[n.type] ?? TYPE_STYLE.info
          return (
            <motion.div key={n.key} className="hu-card" layout initial={{ opacity: 0, x: -60, scale: 0.9 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: -60, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}>
              <button className="hu-main" onClick={() => open(n)}>
                {n.avatar
                  ? <Avatar name={n.avatar.name} src={n.avatar.avatar} color={colorFor(n.avatar.name)} size={44} status={n.avatar.status} />
                  : <div className="nitem-ic" style={{ width: 44, height: 44, background: `color-mix(in srgb, ${st.color} 18%, transparent)`, color: st.color }}><Icon name={st.icon} size={20} /></div>}
                <div className="nitem-text">
                  <small style={{ color: st.color, fontWeight: 700 }}>{n.type === 'message' ? 'New message' : 'CareerHive'}</small>
                  <b>{n.title}</b>
                  {n.body && <span>{n.body}</span>}
                </div>
              </button>
              <button className="hu-close" onClick={() => setCards((c) => c.filter((x) => x.key !== n.key))} aria-label="Dismiss"><Icon name="X" size={14} draw={false} /></button>
              <motion.i className="hu-timer" initial={{ scaleX: 1 }} animate={{ scaleX: 0 }} transition={{ duration: 5.5, ease: 'linear' }} style={{ background: st.color }} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
