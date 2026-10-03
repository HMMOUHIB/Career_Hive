import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { ChatDock } from './components/Messenger'
import { HeadsUp } from './components/NotificationCenter'
import SectionBackground from './components/SectionBackground'
import Splash from './components/Splash'
import { useCursor } from './components/Cursor'
import { useSpotlight } from './components/ui'
import { RightRail, Sidebar, Toast, Topbar } from './components/Shell'
import Dashboard from './pages/Dashboard'
import Feed from './pages/Feed'
import PublicProfile from './pages/PublicProfile'
import People from './pages/People'
import Formations from './pages/Formations'
import Login from './pages/Login'
import Profile from './pages/Profile'
import Promotion from './pages/Promotion'
import Reviews from './pages/Reviews'
import Teams from './pages/Teams'
import TeamHub from './pages/TeamHub'
import { useDerived, useStore } from './store/store'

const Skills = lazy(() => import('./pages/Skills'))

// the loading screen stays up at least INTRO ms and until its emblem has turned about once (TURN ms), but never past INTRO_MAX
const INTRO = 1600, TURN = 1200, INTRO_MAX = 3500

export default function App() {
  const { state } = useStore()
  const location = useLocation()
  const [menu, setMenu] = useState(false)
  const { isStaff } = useDerived()
  const [intro, setIntro] = useState(true)
  const markAt = useRef(null) // when the loading screen's emblem appeared
  const onMark = useCallback(() => { markAt.current ??= performance.now() }, [])
  useSpotlight()
  useCursor()
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
  const splash = <AnimatePresence>{loading && <Splash key="splash" theme={state.theme} onReady={onMark} />}</AnimatePresence>
  if (loading) return <>{splash}</>
  if (!state.user) return <>{splash}<Login /><Toast /></>

  const isHub = location.pathname === '/team'
  return (
    <>
    {splash}
    <div className="stage">
      <motion.div className={`frame ${isHub ? 'no-rail' : ''}`} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}>
        <SectionBackground pathname={location.pathname} theme={state.theme} />
        <Sidebar open={menu} onNavigate={() => setMenu(false)} />
        <AnimatePresence>{menu && <motion.div className="menu-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMenu(false)} />}</AnimatePresence>
        <main className="main">
          <Topbar onMenu={() => setMenu((m) => !m)} />
          <div className="scroll" style={isHub ? { overflow: 'hidden', paddingBottom: 0 } : undefined}>
            <Suspense fallback={null}>
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
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
              </AnimatePresence>
            </Suspense>
          </div>
        </main>
        {!isHub && <RightRail />}
      </motion.div>
      <ChatDock />
      <HeadsUp />
      <Toast />
    </div>
    </>
  )
}
