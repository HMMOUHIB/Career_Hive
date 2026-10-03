import { AnimatePresence, motion } from 'framer-motion'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { colorFor, fullName, roleLabel, useDerived, useStore } from '../store/store'
import Logo, { BrandTitle } from './Logo'
import { ActiveNow } from './Messenger'
import { NotificationBell } from './NotificationCenter'
import { Avatar, Icon } from './ui'

function useNav() {
  const { state } = useStore()
  const { isStaff, eligible, active } = useDerived()
  const org = state.dashboard?.org
  const queue = (org?.totals?.promotionQueue ?? 0) + (org?.totals?.formationQueue ?? 0)
  const unread = Object.values(state.unread).reduce((a, b) => a + b, 0)
  return [
    { section: 'Overview', mark: '一', items: [{ to: '/', label: 'Dashboard', icon: 'LayoutDashboard' }] },
    {
      section: 'Career', mark: '二', items: [
        { to: '/profile', label: 'Profile', icon: 'User' },
        { to: '/promotion', label: 'Request promotion', icon: 'TrendingUp', badge: eligible ? 'Ready' : null, lock: !eligible },
        { to: '/formations', label: 'Formations', icon: 'GraduationCap', badge: active.length || null, soft: true },
        { to: '/skills', label: 'Skills evolution', icon: 'ChartLine' },
        { to: '/profile#career-compass', label: 'CV coach', icon: 'Compass' },
      ],
    },
    ...(isStaff ? [{
      section: 'Manage', mark: '四', items: [
        { to: '/reviews', label: 'Review queue', icon: 'ClipboardCheck', badge: queue || null },
        { to: '/teams', label: 'Teams', icon: 'Users' },
        ...(state.user?.isOwner ? [{ to: '/people', label: 'People & roles', icon: 'UserCog' }] : []),
      ],
    }] : []),
    { section: 'Connect', mark: '三', items: [{ to: '/feed', label: 'Feed', icon: 'Newspaper' }, { to: '/team', label: 'Team comm hub', icon: 'MessagesSquare', badge: unread || null }] },
  ]
}

const THEMES = [{ id: 'ember', label: 'Dark', icon: 'Moon' }, { id: 'light', label: 'Light', icon: 'Sun' }, { id: 'frost', label: 'Frost', icon: 'Snowflake' }]

export function Sidebar({ open, onNavigate }) {
  const { state, actions } = useStore()
  const { pathname, hash } = useLocation()
  const nav = useNav()

  return (
    <aside className={`rail sidebar ${open ? 'open' : ''}`}>
      <div className="brand stacked">
        <Logo theme={state.theme} />
        <BrandTitle />
        <div className="brand-sub">{roleLabel[state.user?.role] ?? 'Workspace'} space</div>
      </div>

      <ActiveNow />

      <nav style={{ overflowY: 'auto', margin: '0 -6px', padding: '0 6px' }}>
        {nav.map((g) => (
          <div className="nav-section" key={g.section}>
            <div className="nav-label"><i>{g.mark}</i>{g.section}</div>
            {g.items.map((it) => {
              // a "/page#section" item is active on that section; the page's own item then steps aside
              const [path, section] = it.to.split('#')
              const onSection = hash === '#career-compass' && pathname === '/profile'
              const active = section ? pathname === path && hash === `#${section}`
                : it.to === '/' ? pathname === '/'
                : pathname.startsWith(it.to) && !(it.to === '/team' && pathname.startsWith('/teams')) && !(it.to === '/profile' && onSection)
              return (
                <NavLink key={it.to} to={it.to} className={() => `nav-item ${active ? 'active' : ''}`} onClick={onNavigate}>
                  {active && (
                    <motion.div layoutId="nav-active" className="nav-bg" transition={{ type: 'spring', stiffness: 380, damping: 32 }}>
                      <span className="corner tl" /><span className="corner tr" /><span className="corner bl" /><span className="corner br" />
                    </motion.div>
                  )}
                  <Icon name={it.icon} size={20} />
                  <span>{it.label}</span>
                  {it.badge ? <span className="nav-badge" style={it.soft ? { background: 'var(--pill)', color: 'var(--pill-ink)' } : undefined}>{it.badge}</span>
                    : it.lock ? <Icon name="Lock" size={14} className="nav-lock" /> : null}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="side-foot">
        <div className="theme-switch" role="radiogroup" aria-label="Theme">
          <motion.div className="theme-pill" animate={{ x: `${THEMES.findIndex((t) => t.id === state.theme) * 100}%` }} transition={{ type: 'spring', stiffness: 400, damping: 34 }} />
          {THEMES.map((t) => (
            <button key={t.id} className={state.theme === t.id ? 'on' : ''} onClick={() => actions.setTheme(t.id)} aria-pressed={state.theme === t.id}><Icon name={t.icon} size={14} />{t.label}</button>
          ))}
        </div>
        <button className="add-btn" onClick={actions.logout}><b><Icon name="LogOut" size={14} /></b>Sign out</button>
      </div>
    </aside>
  )
}

export function Topbar({ onMenu }) {
  const { state, actions } = useStore()
  // the top-bar button cycles Frost → Dark → Light → Frost and shows the theme it switches to
  const CYCLE = ['frost', 'ember', 'light']
  const next = THEMES.find((t) => t.id === CYCLE[(CYCLE.indexOf(state.theme) + 1) % CYCLE.length])
  const { isStaff } = useDerived()
  const navigate = useNavigate()
  const h = new Date().getHours()
  const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'
  return (
    <header className="topbar">
      <button className="icon-btn burger" onClick={onMenu} aria-label="Menu"><Icon name="Menu" size={18} /></button>
      <div className="greet">{hello}, <b>{state.user?.firstName?.toUpperCase()}</b></div>
      <label className="search">
        <Icon name="Search" size={17} />
        <input placeholder="Search formations…" onKeyDown={(e) => e.key === 'Enter' && navigate(`/formations?q=${encodeURIComponent(e.currentTarget.value)}`)} />
      </label>
      <motion.button className="icon-btn" aria-label={`Switch to ${next.label}`} title={`Switch to ${next.label}`} onClick={() => actions.setTheme(next.id)} whileTap={{ rotate: 180, scale: 0.9 }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={next.id} initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} style={{ display: 'grid' }}>
            <Icon name={next.icon} size={18} />
          </motion.span>
        </AnimatePresence>
      </motion.button>
      <button className="icon-btn" aria-label="Certificates" onClick={() => navigate('/profile#certificates')}><Icon name="Award" size={18} /></button>
      <NotificationBell />
    </header>
  )
}

export function RightRail() {
  const { state, actions } = useStore()
  const { contacts } = useDerived()
  const navigate = useNavigate()
  const u = state.user
  const shown = contacts.slice(0, 7)
  const mgr = state.dashboard?.me?.team?.manager
  return (
    <aside className="right">
      <div className="rail grow">
        <button onClick={() => navigate('/profile')} className="rail-me" aria-label="My profile">
          <Avatar name={fullName(u)} src={u.profilePhoto} size={46} color="linear-gradient(135deg,#ffb199,#f2554a 60%,#7b2cff)" />
        </button>
        <Icon name="Users" size={18} className="rail-sep" />
        {shown.map((t, i) => (
          <motion.button key={t.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.07 }}
            whileHover={{ scale: 1.12 }} onClick={() => actions.openChat(t.id)} style={{ position: 'relative' }} title={`${t.name} · ${t.role ?? ''}`}>
            <Avatar name={t.name} src={t.avatar} color={colorFor(t.name)} size={44} status={t.status} tag={t.tag} />
          </motion.button>
        ))}
      </div>
      {mgr && (
        <div className="rail" style={{ paddingBottom: 18 }}>
          <Icon name="Crown" size={18} className="rail-sep" />
          <div title={`${mgr.name} · ${mgr.role}`}><Avatar name={mgr.name} src={mgr.avatar} color={colorFor(mgr.name)} size={42} status="busy" /></div>
          <button onClick={() => navigate('/team')} aria-label="Open hub"><Avatar name="+" color="var(--raise)" size={42} /></button>
        </div>
      )}
    </aside>
  )
}

export function Toast() {
  const { state } = useStore()
  const t = state.toast
  return (
    <AnimatePresence>
      {t && (
        <motion.div key={t.id} className="toast" initial={{ opacity: 0, y: 30, x: '-50%', scale: 0.9 }} animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }} exit={{ opacity: 0, y: 20, x: '-50%' }}>
          <Icon name={t.tone === 'bad' ? 'CircleX' : 'CircleCheck'} size={18} style={{ color: t.tone === 'bad' ? 'var(--bad)' : 'var(--good)' }} />
          {t.text}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
