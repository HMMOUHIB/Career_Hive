import { useRef } from 'react'
import { DUR, EASE, gsap, reducedMotion, ScrollTrigger, STAGGER, useGSAP } from './gsap'

/**
 * Page entry.
 * Purpose: show the hierarchy of a page as it arrives: the most important block first, the rest in reading order.
 * Trigger: the page mounting (every route change mounts a new page).
 * Targets: elements marked `data-reveal` inside the page. Those in the first screen run as one staggered
 *   timeline; those below it rise in as they scroll into view (ScrollTrigger.batch, once).
 * Duration / easing: DUR.base per element, EASE.out, STAGGER between siblings.
 * Exit: handled by the route stage (App) as a short fade; this context is reverted on unmount.
 * Reduced motion: nothing moves; content is simply there.
 *
 * Content is visible by default: only JavaScript hides it for the instant before it animates,
 * so nothing stays invisible if a script fails.
 */
export function useReveal(scope, deps = []) {
  useGSAP(() => {
    if (reducedMotion() || !scope.current) return
    const items = gsap.utils.toArray('[data-reveal]', scope.current)
    if (!items.length) return
    const fold = window.innerHeight * 0.92
    const above = [], below = []
    for (const el of items) (el.getBoundingClientRect().top < fold ? above : below).push(el)

    gsap.fromTo(above, { autoAlpha: 0, y: 18 }, { autoAlpha: 1, y: 0, duration: DUR.base + 0.15, ease: EASE.out, stagger: STAGGER, delay: 0.04, clearProps: 'transform' })

    if (below.length) {
      gsap.set(below, { autoAlpha: 0, y: 26 })
      ScrollTrigger.batch(below, {
        start: 'top 94%',
        once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: DUR.base + 0.2, ease: EASE.out, stagger: STAGGER * 1.4, overwrite: true, clearProps: 'transform' }),
      })
    }
  }, { scope, dependencies: deps })
}

/** A page: a scoped container whose `data-reveal` children enter in sequence. */
export function Page({ children, className = '', ...rest }) {
  const ref = useRef(null)
  useReveal(ref)
  return <div ref={ref} className={`page ${className}`} {...rest}>{children}</div>
}

/**
 * Headline that rises word by word out of a mask.
 * Purpose: the page title is the first thing read, so it is the one element with a signature entrance.
 * Trigger: mount, or the text changing. Duration DUR.slow, EASE.out, .06s between words.
 * Reduced motion: static text.
 */
export function Reveal({ text, as: Tag = 'h1', className = '', delay = 0.05, style }) {
  const ref = useRef(null)
  const words = String(text ?? '').split(' ')
  useGSAP(() => {
    if (reducedMotion()) return
    gsap.fromTo(ref.current.querySelectorAll('.reveal-word'), { yPercent: 112 }, { yPercent: 0, duration: DUR.slow, ease: EASE.out, stagger: 0.06, delay })
  }, { scope: ref, dependencies: [text] })
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={style} aria-label={text}>
      {words.map((w, i) => (
        <span className="reveal-mask" key={`${w}-${i}`} aria-hidden="true"><span className="reveal-word">{w}</span></span>
      ))}
    </Tag>
  )
}
