import { useLayoutEffect, useRef } from 'react'
import { DUR, EASE, gsap, reducedMotion, ScrollTrigger } from './gsap'

/**
 * Data that fills in when it is first seen: numbers count, rings close, bars grow.
 * Purpose: draw the eye to the figures once, as they arrive, and show changes when values move.
 * Trigger: the element entering the viewport (once), then any later change of `value`.
 * Duration DUR.slow (first fill) / DUR.base (updates), EASE.out.
 * Reduced motion: the final value, no tween.
 *
 * All three write to the DOM directly (no React state per frame) and animate transforms or SVG dash offsets only.
 */
function useFill(ref, apply, value, from) {
  const seen = useRef(false)
  const current = useRef({ v: from })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const go = (d) => gsap.to(current.current, { v: value, duration: d, ease: EASE.out, overwrite: true, onUpdate: () => apply(current.current.v) })
    if (reducedMotion()) { current.current.v = value; apply(value); return }
    if (seen.current) { const t = go(DUR.base); return () => t.kill() }
    apply(current.current.v)
    const st = ScrollTrigger.create({ trigger: el, start: 'top 96%', once: true, onEnter: () => { seen.current = true; go(DUR.slow + 0.4) } })
    return () => st.kill()
  }, [value]) // eslint-disable-line react-hooks/exhaustive-deps
}

const format = (v, decimals) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })

/** A number that counts up to `value`. */
export function Counter({ value = 0, decimals = 0, suffix = '', className }) {
  const ref = useRef(null)
  const n = Number(value) || 0
  useFill(ref, (v) => { if (ref.current) ref.current.textContent = format(v, decimals) + suffix }, n, 0)
  // the text is written only by useFill, so React never holds a text node that GSAP has replaced
  return <span ref={ref} className={`t-data ${className ?? ''}`} />
}

/** Circular progress (value 0..1). Children sit in the centre. */
export function Ring({ value = 0, size = 96, stroke = 8, children, color = 'var(--accent)', track = 'color-mix(in srgb, var(--foreground) 9%, transparent)', label }) {
  const ref = useRef(null)
  const arc = useRef(null)
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const v = Math.max(0, Math.min(1, Number(value) || 0))
  useFill(ref, (x) => arc.current?.setAttribute('stroke-dashoffset', String(c * (1 - x))), v, 0)
  return (
    <div ref={ref} className="ring" style={{ width: size, height: size }} role={label ? 'img' : undefined} aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle ref={arc} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  )
}

/** Horizontal progress (value 0..1): the fill is scaled, never resized, so it stays on the compositor. */
export function Bar({ value = 0, tone, className = '', label }) {
  const ref = useRef(null)
  const fill = useRef(null)
  const v = Math.max(0, Math.min(1, Number(value) || 0))
  useFill(ref, (x) => { if (fill.current) fill.current.style.transform = `scaleX(${x})` }, v, 0)
  return (
    <div ref={ref} className={`bar ${tone ? `bar-${tone}` : ''} ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v * 100)} aria-label={label}>
      <div ref={fill} style={{ transform: `scaleX(${v})` }} />
    </div>
  )
}
