import { useLayoutEffect, useRef, useState } from 'react'
import { DUR, EASE, gsap, reducedMotion } from './gsap'

/**
 * Mount / unmount with an animation: the child stays rendered until its exit tween finishes.
 * Purpose: panels, popovers, toasts and scrims appear and leave in place instead of popping.
 * Trigger: `show` changing. Exit: the reverse of the entry, faster, easing in.
 * Reduced motion: opacity only, near instant.
 *
 * The wrapper is `display: contents`, so it adds no box; the tweens target its children.
 */
export const VARIANTS = {
  fade: { from: { autoAlpha: 0 }, to: { autoAlpha: 1 } },
  rise: { from: { autoAlpha: 0, y: 12 }, to: { autoAlpha: 1, y: 0 } },
  pop: { from: { autoAlpha: 0, y: -6, scale: 0.97 }, to: { autoAlpha: 1, y: 0, scale: 1 } },
  toast: { from: { autoAlpha: 0, y: 24 }, to: { autoAlpha: 1, y: 0 } },
  drawer: { from: { xPercent: 104 }, to: { xPercent: 0 } },
  sheet: { from: { yPercent: 104 }, to: { yPercent: 0 } },
  left: { from: { xPercent: -104 }, to: { xPercent: 0 } },
  zoom: { from: { autoAlpha: 0, scale: 0.96 }, to: { autoAlpha: 1, scale: 1 } },
}

export default function Presence({ show, variant = 'fade', duration = DUR.base, appear = true, children }) {
  const [mounted, setMounted] = useState(show)
  const box = useRef(null)
  const kept = useRef(children)
  const first = useRef(true)
  const shown = useRef(false) // whether the content is (or is heading to) its visible state
  if (show) kept.current = children
  if (show && !mounted) setMounted(true)

  useLayoutEffect(() => {
    const els = box.current ? [...box.current.children] : []
    const isFirst = first.current
    first.current = false
    if (!els.length) return
    const v = VARIANTS[variant] ?? VARIANTS.fade
    const still = reducedMotion()
    gsap.killTweensOf(els)
    if (show) {
      if (shown.current) return
      shown.current = true
      if (isFirst && !appear) return
      gsap.fromTo(els, still ? { autoAlpha: 0 } : v.from, { ...(still ? { autoAlpha: 1 } : v.to), duration: still ? 0.01 : duration, ease: EASE.out, clearProps: 'transform' })
    } else {
      shown.current = false
      gsap.to(els, { ...(still ? { autoAlpha: 0 } : v.from), duration: still ? 0.01 : Math.min(duration, DUR.fast), ease: EASE.in, onComplete: () => setMounted(false) })
    }
  }, [show, mounted, variant, duration, appear])

  if (!mounted) return null
  return <div ref={box} style={{ display: 'contents' }}>{show ? children : kept.current}</div>
}
