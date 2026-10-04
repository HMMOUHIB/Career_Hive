import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { reducedMotion } from '../../motion/gsap'
import { useStore } from '../../store/store'
import { softwareGL } from '../../three/gpu'

const Mascot = lazy(() => import('../../three/Mascot'))

// the portal vortex and prop accents follow the theme's vermilion
const LOOK = {
  dark: { vortex: ['#ffb36b', '#ff5b45'], accent: '#ff5b45' },
  light: { vortex: ['#ffc58a', '#d8402b'], accent: '#d8402b' },
}

/**
 * The 3D mascot behind a page's command area. It renders only while on screen (an IntersectionObserver pauses the
 * WebGL loop when scrolled away) and renders once, without idling, when the person prefers reduced motion.
 */
export default function MascotStage({ model, variant, distance = 8.2, className = '' }) {
  const { state } = useStore()
  const box = useRef(null)
  const [active, setActive] = useState(true)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: '80px' })
    io.observe(box.current)
    return () => io.disconnect()
  }, [])
  const look = LOOK[state.theme] ?? LOOK.dark
  return (
    <div ref={box} className={`mascot-stage ${className}`} aria-hidden="true">
      {!softwareGL() && <Suspense fallback={null}>
        <Mascot model={model} variant={variant} distance={distance} vortex={look.vortex} accent={look.accent} shadow={false} active={active} still={reducedMotion()} />
      </Suspense>}
    </div>
  )
}
