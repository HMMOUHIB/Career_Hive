import { animate, motion, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion'
import * as Lucide from 'lucide'
import { createElement, useEffect, useRef, useState } from 'react'

const kebab = (n) => n.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * Animated icon. Every stroke is normalised with pathLength=1, so CSS can "draw" it in on mount
 * and re-draw it on hover (see .ic rules in index.css). Each icon also gets an `ic-<name>` class
 * for its own hover motion (bell rings, send flies off, sun spins…).
 */
export const Icon = ({ name, size = 20, strokeWidth = 1.9, fill = 'none', className = '', style, draw = true, ...p }) => {
  const node = Lucide[name] ?? Lucide.Circle
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      className={`ic ic-${kebab(name ?? 'circle')} ${draw ? 'ic-draw' : ''} ${className}`} style={style} {...p}>
      {node.map(([tag, attrs], i) => createElement(tag, { ...attrs, key: i, pathLength: 1, style: { '--i': i } }))}
    </svg>
  )
}

/** A rounded, tinted tile holding an icon, with a soft shadow in its own colour. tone: accent | accent2 | good | warn | bad | violet | b */
export const IconTile = ({ icon, tone = 'accent', size = 38, soft = false }) => (
  <span className={`ic-tile t-${tone} ${soft ? 'soft' : ''}`} style={{ width: size, height: size, borderRadius: Math.round(size * 0.32) }} aria-hidden="true">
    <Icon name={icon} size={Math.round(size * 0.46)} />
  </span>
)

/** A card's title row: icon tile, title with an optional line under it, then anything on the right (a count, a link). */
export function CardHead({ icon, tone, title, sub, children }) {
  return (
    <div className="card-head">
      <IconTile icon={icon} tone={tone} />
      <div className="ch-text"><b>{title}</b>{sub && <small>{sub}</small>}</div>
      {children}
    </div>
  )
}

export const initials = (name = '') => name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

export function Avatar({ name, color = '#c2253a', size = 40, status, src, tag, ring }) {
  return (
    <div className="avatar" style={{ width: size, height: size, background: src ? `center/cover url(${src})` : color, fontSize: size * 0.36, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }} title={name}>
      {!src && initials(name)}
      {status && <i className={`st st-${status}`} />}
      {tag && <span className="rail-tag">{tag}</span>}
    </div>
  )
}

/** Animated number that counts up when it scrolls into view. */
export function Counter({ value, decimals = 0, suffix = '', duration = 1.4 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true })
  const [shown, setShown] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(from.current, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: setShown })
    from.current = value
    return c.stop
  }, [inView, value, duration])
  return <span ref={ref}>{shown.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>
}

/** Circular progress ring. */
export function Ring({ value, size = 96, stroke = 9, children, color = 'var(--accent)' }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div style={{ width: size, height: size, position: 'relative', flex: 'none' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="color-mix(in srgb, var(--text) 10%, transparent)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: 'drop-shadow(0 0 6px var(--glow))' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>{children}</div>
    </div>
  )
}

export function Bar({ value }) {
  return (
    <div className="bar">
      <motion.div initial={{ width: 0 }} animate={{ width: `${value * 100}%` }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} />
    </div>
  )
}

/** 3D tilt-on-hover wrapper. */
export function Tilt({ children, className, style, max = 10, onClick }) {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 200, damping: 18 })
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 200, damping: 18 })
  return (
    <motion.div
      className={className} onClick={onClick}
      style={{ ...style, rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        const b = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - b.left) / b.width); y.set((e.clientY - b.top) / b.height)
      }}
      onPointerLeave={() => { x.set(0.5); y.set(0.5) }}
      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  )
}

export const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
}
export const rise = {
  hidden: { opacity: 0, y: 24, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

export function Page({ children }) {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}>
      {children}
    </motion.div>
  )
}

export function Tabs({ items, value, onChange, id }) {
  return (
    <div className="tabs">
      {items.map((it) => (
        <button key={it.value} className={value === it.value ? 'on' : ''} onClick={() => onChange(it.value)}>
          {value === it.value && <motion.div layoutId={`tab-${id}`} className="tab-bg" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  )
}

export const statusChip = {
  earned: { cls: 'good', label: 'Earned', icon: 'CircleCheck' },
  progress: { cls: 'warn', label: 'In progress', icon: 'Clock' },
  available: { cls: 'accent', label: 'Available', icon: 'Sparkles' },
  locked: { cls: 'lock', label: 'Locked', icon: 'Lock' },
}

/** Headline that rises in word by word from behind a mask. */
export function Reveal({ text, as = 'h1', className, delay = 0.05, style }) {
  const Tag = motion[as]
  const words = String(text).split(' ')
  return (
    <Tag className={`reveal ${className ?? ''}`} style={style} aria-label={text}
      initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: delay } } }}>
      {words.map((w, i) => (
        <span className="reveal-mask" key={i} aria-hidden="true">
          <motion.span className="reveal-word" variants={{ hidden: { y: '110%', rotate: 6 }, show: { y: '0%', rotate: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } }}>
            {w}
          </motion.span>
        </span>
      ))}
    </Tag>
  )
}

/** Cursor spotlight on cards: one listener sets --mx/--my on whichever .card is hovered. */
export function useSpotlight() {
  useEffect(() => {
    const on = (e) => {
      const el = e.target.closest?.('.card, .kpi, .row-card, .form-card, .cert, .member, .stat-card')
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    window.addEventListener('pointermove', on, { passive: true })
    return () => window.removeEventListener('pointermove', on)
  }, [])
}
