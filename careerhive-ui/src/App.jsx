import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import { ChatDock } from './components/Messenger'
import { HeadsUp } from './components/NotificationCenter'
import { Sidebar, TabBar, Toast, Topbar } from './components/Shell'
import Splash from './components/Splash'
import { PageSkeleton } from './components/PageSkeleton'
import { DUR, EASE, gsap, reducedMotion } from './motion/gsap'
import Presence from './motion/Presence'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import { useDerived, useStore } from './store/store'

// The dashboard and sign-in load with the app; every other page is fetched when it is first opened,
// or earlier once the workspace sits idle (usePrefetch), so a first visit doesn't wait on the network.
const PAGES = {
  Profile: () => import('./pages/Profile'),
  Promotion: () => import('./pages/Promotion'),
  Formations: () => import('./pages/Formations'),
  Skills: () => import('./pages/Skills'),
  TeamHub: () => import('./pages/TeamHub'),
  Feed: () => import('./pages/Feed'),
  PublicProfile: () => import('./pages/PublicProfile'),
  Reviews: () => import('./pages/Reviews'),
  Teams: () => import('./pages/Teams'),
  People: () => import('./pages/People'),
}
const Profile = lazy(PAGES.Profile)
const Promotion = lazy(PAGES.Promotion)
const Formations = lazy(PAGES.Formations)
const Skills = lazy(PAGES.Skills)
const TeamHub = lazy(PAGES.TeamHub)
const Feed = lazy(PAGES.Feed)
const PublicProfile = lazy(PAGES.PublicProfile)
const Reviews = lazy(PAGES.Reviews)
const Teams = lazy(PAGES.Teams)
const People = lazy(PAGES.People)

/** A few seconds after the workspace opens, fetch the other pages' code while the browser is idle (skipped on data saver / 2G). */
function usePrefetch() {
  useEffect(() => {
    const net = navigator.connection
    if (net?.saveData || /2g/.test(net?.effectiveType ?? '')) return
    let idle
    const timer = setTimeout(() => {
      const run = () => Object.values(PAGES).forEach((load) => load().catch(() => {}))
      idle = window.requestIdleCallback ? requestIdleCallback(run, { timeout: 5000 }) : setTimeout(run, 0)
    }, 3000)
    return () => { clearTimeout(timer); if (idle) (window.cancelIdleCallback ?? clearTimeout)(idle) }
  }, [])
}

// the loading screen stays up at least INTRO ms and until its emblem has turned about once (TURN ms), but never past INTRO_MAX
const INTRO = 1600, TURN = 1200, INTRO_MAX = 3500

/**
 * Route transition.
 * Purpose: one continuous product — the page you leave steps back before the next one arrives.
 * Trigger: the pathname changing (query and hash changes pass straight through).
 * Exit: the stage fades and lifts 6px in ~.2s (EASE.in); then the new page mounts and its own reveal runs.
 * Reduced motion: an instant swap.
 */
function useRouteStage() {
  const location = useLocation()
  const [shown, setShown] = useState(location)
  const stage = useRef(null)

  useEffect(() => {
    if (location.pathname === shown.pathname) { if (location !== shown) setShown(location); return }
    const swap = () => { setShown(location); window.scrollTo(0, 0) }
    if (!stage.current || reducedMotion()) return swap()
    const t = gsap.to(stage.current, { autoAlpha: 0, y: -6, duration: DUR.fast * 0.8, ease: EASE.in, onComplete: swap })
    return () => t.kill()
  }, [location]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => { if (stage.current) gsap.set(stage.current, { autoAlpha: 1, y: 0 }) }, [shown.pathname])
  return { shown, stage }
}

function Workspace() {
  const { state } = useStore()
  const { isStaff } = useDerived()
  const [menu, setMenu] = useState(false)
  const closeMenu = useCallback(() => setMenu(false), [])
  const { shown, stage } = useRouteStage()
  usePrefetch()
  const fill = shown.pathname === '/team' // the hub fills the screen and scrolls inside its own panes

  return (
    <div className={`app ${fill ? 'app--fill' : ''}`}>
      <a href="#main" className="skip-link">Skip to content</a>
      <Sidebar open={menu} onNavigate={closeMenu} />
      <div className="workspace">
        <Topbar onMenu={() => setMenu((m) => !m)} menuOpen={menu} />
        <main id="main" className="content" tabIndex={-1}>
          <div ref={stage} className="stage">
            <ErrorBoundary key={shown.pathname}>
              <Suspense fallback={<PageSkeleton />}>
                <Routes location={shown} key={shown.pathname}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/promotion" element={<Promotion />} />
                  <Route path="/formations" element={<Formations />} />
                  <Route path="/skills" element={<Skills />} />
                  <Route path="/team" element={<TeamHub />} />
                  <Route path="/feed" element={<Feed />} />
                  <Route path="/u/:id" element={<PublicProfile />} />
                  {isStaff && <Route path="/reviews" element={<Reviews />} />}
                  {isStaff && <Route path="/teams" element={<Teams />} />}
                  {state.user.isOwner && <Route path="/people" element={<People />} />}
                  <Route path="*" element={<Dashboard />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>
      <TabBar onMenu={() => setMenu(true)} />
      <ChatDock />
      <HeadsUp />
      <Toast />
    </div>
  )
}

export default function App() {
  const { state } = useStore()
  const [intro, setIntro] = useState(true)
  const markAt = useRef(null) // when the loading screen's emblem appeared
  const onMark = useCallback(() => { markAt.current ??= performance.now() }, [])
  useEffect(() => {
    const t0 = performance.now()
    const id = setInterval(() => {
      const now = performance.now(), turned = markAt.current !== null && now - markAt.current > TURN
      if (now - t0 > INTRO_MAX || (now - t0 > INTRO && turned)) { setIntro(false); clearInterval(id) }
    }, 100)
    return () => clearInterval(id)
  }, [])

  // the splash stays first in every branch, so it can fade out over whatever comes next
  const loading = intro || state.status === 'loading'
  const splash = <Presence show={loading} variant="fade" duration={0.6} appear={false}><Splash theme={state.theme} onReady={onMark} /></Presence>
  if (loading) return <>{splash}</>
  if (!state.user) return <>{splash}<Login /><Toast /></>
  return <>{splash}<Workspace /></>
}
