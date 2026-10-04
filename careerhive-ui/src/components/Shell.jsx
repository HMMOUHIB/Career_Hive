import { useEffect, useRef } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import Presence from '../motion/Presence'
import { useIndicator } from '../motion/interaction'
import { fullName, nextTheme, roleLabel, THEMES, useDerived, useStore } from '../store/store'
import Logo, { BrandTitle } from './Logo'
import { ActiveNow } from './Messenger'
import { NotificationBell } from './NotificationCenter'
import { Avatar, Icon } from './ui'

/** The navigation model: one list, used by the sidebar, the rail, the mobile drawer and the page title. */
export function useNav() {
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
        { to: '/promotion', label: 'Promotion', icon: 'TrendingUp', badge: eligible ? 'Ready' : null, tone: 'highlight', lock: !eligible },
        { to: '/formations', label: 'Formations', icon: 'GraduationCap', badge: active.length || null, tone: 'soft' },
        { to: '/skills', label: 'Skills', icon: 'ChartLine' },
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
    { section: 'Connect', mark: '三', items: [{ to: '/feed', label: 'Feed', icon: 'Newspaper' }, { to: '/team', label: 'Team hub', icon: 'MessagesSquare', badge: unread || null }] },
  ]
}

/** Which nav item a location belongs to (a "/page#section" item wins over its page on that section). */
export function isActive(to, pathname, hash) {
  const [path, section] = to.split('#')
  if (section) return pathname === path && hash === `#${section}`
  if (to === '/') return pathname === '/'
  if (to === '/team') return pathname === '/team'
  if (to === '/profile') return pathname === '/profile' && hash !== '#career-compass'
  return pathname.startsWith(to)
}

/** Name of the current page, for the top bar and the document title. */
export function usePageTitle() {
  const nav = useNav()
  const { pathname, hash } = useLocation()
  for (const g of nav) for (const it of g.items) if (isActive(it.to, pathname, hash)) return { label: it.label, mark: g.mark, section: g.section }
  if (pathname.startsWith('/u/')) return { label: 'Profile', mark: '三', section: 'Connect' }
  return { label: 'Dashboard', mark: '一', section: 'Overview' }
}

function NavList({ onNavigate }) {
  const { pathname, hash } = useLocation()
  const nav = useNav()
  const activeKey = nav.flatMap((g) => g.items).find((it) => isActive(it.to, pathname, hash))?.to ?? ''
  const ref = useIndicator(activeKey)
  return (
    <nav ref={ref} className="nav-list" aria-label="Main">
      <span className="indicator" aria-hidden="true" />
      {nav.map((g) => (
        <div className="nav-group" key={g.section} role="group" aria-labelledby={`nav-${g.section}`}>
          <div className="nav-label" id={`nav-${g.section}`}><i aria-hidden="true">{g.mark}</i>{g.section}</div>
          {g.items.map((it) => {
            const on = isActive(it.to, pathname, hash)
            return (
              <NavLink key={it.to} to={it.to} end className={`nav-item ${on ? 'active' : ''}`} data-active={on} data-label={it.label}
                aria-current={on ? 'page' : undefined} onClick={onNavigate}>
                <Icon name={it.icon} size={18} />
                <span className="nav-text">{it.label}</span>
                {it.badge ? <span className={`nav-badge ${it.tone ?? ''}`}>{it.badge}</span>
                  : it.lock ? <Icon name="Lock" size={13} className="nav-lock" label="Locked until you meet the requirements" /> : null}
              </NavLink>
            )
          })}
        </div>
      ))}
    </nav>
  )
}

function ThemeSwitch() {
  const { state, actions } = useStore()
  const ref = useIndicator(state.theme)
  return (
    <div ref={ref} className="segmented theme-switch" role="radiogroup" aria-label="Theme">
      <span className="indicator" aria-hidden="true" />
      {THEMES.map((t) => (
        <button key={t.id} type="button" role="radio" aria-checked={state.theme === t.id} data-active={state.theme === t.id}
          className={state.theme === t.id ? 'on' : ''} onClick={() => actions.setTheme(t.id)}>
          <Icon name={t.icon} size={14} />{t.label}
        </button>
      ))}
    </div>
  )
}

/** The left navigation: full on desktop, an icon rail on tablets, a drawer on phones (`open`). */
export function Sidebar({ open, onNavigate }) {
  const { state, actions } = useStore()
  const panel = useRef(null)

  // on phones the drawer behaves like a dialog: Escape closes it and focus moves into it
  useEffect(() => {
    if (!open) return
    const key = (e) => e.key === 'Escape' && onNavigate()
    window.addEventListener('keydown', key)
    panel.current?.querySelector('.nav-item')?.focus({ preventScroll: true })
    return () => window.removeEventListener('keydown', key)
  }, [open, onNavigate])

  return (
    <>
      <aside ref={panel} className={`sidebar ${open ? 'open' : ''}`} aria-label="Workspace">
        <div className="brand">
          <Logo theme={state.theme} />
          <div className="brand-text">
            <BrandTitle />
            <span className="brand-sub">{roleLabel[state.user?.role] ?? 'Workspace'} space</span>
          </div>
        </div>
        <ActiveNow />
        <NavList onNavigate={onNavigate} />
        <div className="side-foot">
          <ThemeSwitch />
          <button type="button" className="nav-item signout" onClick={actions.logout} data-label="Sign out">
            <Icon name="LogOut" size={18} /><span className="nav-text">Sign out</span>
          </button>
        </div>
      </aside>
      <Presence show={open} variant="fade" duration={0.3}>
        <div className="scrim nav-scrim" onClick={onNavigate} aria-hidden="true" />
      </Presence>
    </>
  )
}

export function Topbar({ onMenu, menuOpen }) {
  const { state, actions } = useStore()
  const next = nextTheme(state.theme)
  const navigate = useNavigate()
  const page = usePageTitle()
  const search = useRef(null)
  const u = state.user

  useEffect(() => { document.title = `${page.label} · CareerHive` }, [page.label])
  // "/" focuses search, as in most tools
  useEffect(() => {
    const key = (e) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || /input|textarea|select/i.test(document.activeElement?.tagName ?? '') || document.activeElement?.isContentEditable) return
      e.preventDefault(); search.current?.focus()
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  return (
    <header className="topbar">
      <button type="button" className="icon-btn burger" onClick={onMenu} aria-label="Menu" aria-expanded={menuOpen}><Icon name="Menu" size={18} /></button>
      <div className="where" aria-live="polite">
        <span className="where-mark" aria-hidden="true">{page.mark}</span>
        <span className="where-section">{page.section}</span>
        <Icon name="ChevronRight" size={14} className="where-sep" />
        <b>{page.label}</b>
      </div>
      <form className="search" role="search" onSubmit={(e) => { e.preventDefault(); const q = search.current.value.trim(); navigate(`/formations${q ? `?q=${encodeURIComponent(q)}` : ''}`) }}>
        <Icon name="Search" size={16} />
        <label htmlFor="top-search" className="sr-only">Search formations</label>
        <input id="top-search" ref={search} type="search" placeholder="Search formations" autoComplete="off" />
        <kbd aria-hidden="true">/</kbd>
      </form>
      <div className="top-actions">
        <button type="button" className="icon-btn" aria-label={`Switch to ${next.label} theme`} title={`${next.label} theme`} onClick={() => actions.setTheme(next.id)}>
          <Icon name={next.icon} size={17} />
        </button>
        <NotificationBell />
        <button type="button" className="me-btn" onClick={() => navigate('/profile')} aria-label="My profile">
          <Avatar name={fullName(u)} src={u?.profilePhoto} size={34} color="var(--signal)" />
        </button>
      </div>
    </header>
  )
}

/** Phones: the four places people go most, plus the full menu. */
export function TabBar({ onMenu }) {
  const { pathname, hash } = useLocation()
  const { isStaff } = useDerived()
  const items = [
    { to: '/', label: 'Home', icon: 'LayoutDashboard' },
    isStaff ? { to: '/reviews', label: 'Reviews', icon: 'ClipboardCheck' } : { to: '/promotion', label: 'Promotion', icon: 'TrendingUp' },
    { to: '/formations', label: 'Learn', icon: 'GraduationCap' },
    { to: '/team', label: 'Hub', icon: 'MessagesSquare' },
  ]
  return (
    <nav className="tabbar" aria-label="Quick navigation">
      {items.map((it) => {
        const on = isActive(it.to, pathname, hash)
        return (
          <NavLink key={it.to} to={it.to} end className={on ? 'on' : ''} aria-current={on ? 'page' : undefined}>
            <Icon name={it.icon} size={20} /><span>{it.label}</span>
          </NavLink>
        )
      })}
      <button type="button" onClick={onMenu}><Icon name="Menu" size={20} /><span>More</span></button>
    </nav>
  )
}

export function Toast() {
  const { state } = useStore()
  const t = state.toast
  return (
    <div className="toast-region" role="status" aria-live="polite">
      <Presence show={!!t} variant="toast" duration={0.45}>
        {t && (
          <div className={`toast ${t.tone === 'bad' ? 'bad' : 'good'}`} key={t.id}>
            <Icon name={t.tone === 'bad' ? 'CircleX' : 'CircleCheck'} size={18} />
            <span>{t.text}</span>
          </div>
        )}
      </Presence>
    </div>
  )
}
