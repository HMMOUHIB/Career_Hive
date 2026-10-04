import { useLayoutEffect, useRef } from 'react'
import { DUR, EASE, gsap, reducedMotion } from './gsap'

/**
 * A sliding selection indicator (nav, tabs, segmented controls).
 * Purpose: show where you are, and that you moved, with one continuous object instead of a highlight that blinks.
 * Trigger: `activeKey` changing (and the container resizing).
 * Duration DUR.base, EASE.inOut; the first placement is instant.
 * Reduced motion: it jumps.
 *
 * The container holds one `.indicator` element and items marked `data-active="true"`.
 */
export function useIndicator(activeKey) {
  const container = useRef(null)
  const placed = useRef(false)
  useLayoutEffect(() => {
    const box = container.current
    const ind = box?.querySelector(':scope > .indicator')
    if (!box || !ind) return
    const place = (animate) => {
      const el = box.querySelector('[data-active="true"]')
      if (!el) { gsap.to(ind, { autoAlpha: 0, duration: DUR.fast }); placed.current = false; return }
      const props = { x: el.offsetLeft, y: el.offsetTop, width: el.offsetWidth, height: el.offsetHeight, autoAlpha: 1 }
      if (!animate || !placed.current || reducedMotion()) gsap.set(ind, props)
      else gsap.to(ind, { ...props, duration: DUR.base, ease: EASE.inOut, overwrite: true })
      placed.current = true
    }
    place(true)
    const ro = new ResizeObserver(() => place(false))
    ro.observe(box)
    return () => ro.disconnect()
  }, [activeKey])
  return container
}

/**
 * Subtle 3D tilt toward the pointer, for cards that are a single big target.
 * Fine pointers only; off with reduced motion. quickTo keeps it to one tween per axis.
 */
export function useTilt(max = 5) {
  const ref = useRef(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el || reducedMotion() || !window.matchMedia('(pointer: fine)').matches) return
    gsap.set(el, { transformPerspective: 900 })
    const rx = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: EASE.soft })
    const ry = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: EASE.soft })
    const move = (e) => {
      const b = el.getBoundingClientRect()
      ry(((e.clientX - b.left) / b.width - 0.5) * 2 * max)
      rx(-((e.clientY - b.top) / b.height - 0.5) * 2 * max)
    }
    const leave = () => { rx(0); ry(0) }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); gsap.killTweensOf(el) }
  }, [max])
  return ref
}
