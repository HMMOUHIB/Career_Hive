/**
 * The motion system's single entry point: GSAP with ScrollTrigger and the React hook registered once,
 * plus the timing tokens every animation in the app uses.
 *
 *   DUR.micro  .15s  hover / press feedback
 *   DUR.fast   .25s  exits, small state changes
 *   DUR.base   .5s   entries, panels, indicators
 *   DUR.slow   .9s   headline reveals, data that fills in
 *
 *   EASE.out    entries: fast start, long settle (feels weighted, never bouncy)
 *   EASE.in     exits: get out of the way quickly
 *   EASE.inOut  things that travel from one place to another (indicators)
 */
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger, useGSAP)

export const DUR = { micro: 0.15, fast: 0.25, base: 0.5, slow: 0.9 }
export const EASE = { out: 'expo.out', soft: 'power3.out', in: 'power2.in', inOut: 'power3.inOut' }
export const STAGGER = 0.055

gsap.defaults({ duration: DUR.base, ease: EASE.out })

const query = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
/** True when the person asked the system for less motion. Read at animation time, so a change applies right away. */
export const reducedMotion = () => !!query?.matches

/** Scale a duration down to nothing when motion is reduced. */
export const dur = (d) => (reducedMotion() ? 0 : d)

export { gsap, ScrollTrigger, useGSAP }
