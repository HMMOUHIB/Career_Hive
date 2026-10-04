import { createElement } from 'react'
import { useIndicator, useTilt } from '../motion/interaction'
import * as Icons from './icons'

export { Bar, Counter, Ring } from '../motion/data'
export { Page, Reveal } from '../motion/reveal'

const kebab = (n) => n.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()

/**
 * Icon from the app's Lucide subset (components/icons.js, generated). One stroke weight across the product.
 * `ic-<name>` lets CSS give a few icons a hover gesture (arrows nudge, plus turns); nothing draws itself in.
 */
export const Icon = ({ name, size = 20, strokeWidth = 1.75, fill = 'none', className = '', style, label, draw: _draw, ...p }) => {
  const node = Icons[name] ?? Icons.Circle
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden={label ? undefined : 'true'} role={label ? 'img' : undefined} aria-label={label}
      className={`ic ic-${kebab(name ?? 'circle')} ${className}`} style={style} focusable="false" {...p}>
      {node.map(([tag, attrs], i) => createElement(tag, { ...attrs, key: i }))}
    </svg>
  )
}

/** A small square holding an icon, tinted in a tone: accent | accent2 | good | warn | bad | violet | b | neutral. */
export const IconTile = ({ icon, tone = 'accent', size = 36, soft = true }) => (
  <span className={`ic-tile t-${tone} ${soft ? 'soft' : 'solid'}`} style={{ width: size, height: size }} aria-hidden="true">
    <Icon name={icon} size={Math.round(size * 0.48)} />
  </span>
)

/** A card's title row: icon tile, title with an optional line under it, then anything on the right (a count, a link). */
export function CardHead({ icon, tone, title, sub, children, as: Tag = 'h3' }) {
  return (
    <div className="card-head">
      {icon && <IconTile icon={icon} tone={tone} size={32} />}
      <div className="ch-text"><Tag className="ch-title">{title}</Tag>{sub && <small>{sub}</small>}</div>
      {children}
    </div>
  )
}

/** Section heading used between blocks of a page: title, optional count, optional link on the right. */
export function SectionHead({ title, kicker, children, id }) {
  return (
    <div className="section-head">
      <div>
        {kicker && <div className="eyebrow">{kicker}</div>}
        <h2 id={id} className="t-h2">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export const initials = (name = '') => name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

export function Avatar({ name, color = 'var(--surface-hover)', size = 40, status, src, tag, ring }) {
  return (
    <div className="avatar" role="img" aria-label={name} title={name}
      style={{ width: size, height: size, background: src ? `center/cover url(${src})` : color, fontSize: size * 0.36, boxShadow: ring ? `0 0 0 2px ${ring}` : undefined }}>
      {!src && <span aria-hidden="true">{initials(name)}</span>}
      {status && <i className={`st st-${status}`} aria-hidden="true" />}
      {tag && <span className="rail-tag">{tag}</span>}
    </div>
  )
}

/** A card that leans toward the pointer. Keyboard users get the same action with Enter / Space. */
export function Tilt({ children, className = '', style, max = 4, onClick, label }) {
  const ref = useTilt(max)
  const key = (e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick(e) } }
  return (
    <div ref={ref} className={`tilt ${className}`} style={style} onClick={onClick} onKeyDown={key}
      role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined} aria-label={label}>
      {children}
    </div>
  )
}

/** Segmented tabs with one sliding indicator. */
export function Tabs({ items, value, onChange, label = 'Views', className = '' }) {
  const ref = useIndicator(value)
  return (
    <div ref={ref} className={`tabs ${className}`} role="tablist" aria-label={label}>
      <span className="indicator" aria-hidden="true" />
      {items.map((it) => (
        <button key={it.value} type="button" role="tab" aria-selected={value === it.value} data-active={value === it.value}
          className={value === it.value ? 'on' : ''} onClick={() => onChange(it.value)}>
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  )
}

/** Placeholder blocks while data loads: `lines` rows, or a block of `height`. */
export function Skeleton({ lines = 0, height, radius, className = '' }) {
  if (!lines) return <div className={`skeleton ${className}`} style={{ height, borderRadius: radius }} aria-hidden="true" />
  return (
    <div className={`skeleton-lines ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => <i key={i} className="skeleton" style={{ width: i === lines - 1 ? '62%' : undefined }} />)}
    </div>
  )
}

/** What's missing, why, and what to do next. */
export function EmptyState({ icon = 'Sparkles', title, text, children, compact = false }) {
  return (
    <div className={`empty-state ${compact ? 'compact' : ''}`}>
      <IconTile icon={icon} tone="neutral" size={compact ? 36 : 44} />
      <div className="es-text">
        <b>{title}</b>
        {text && <p>{text}</p>}
      </div>
      {children && <div className="es-actions">{children}</div>}
    </div>
  )
}

/** A failure the person can act on: plain words and a way out, never a raw error. */
export function ErrorState({ title = 'Something went wrong', text = 'Check your connection, then try again.', onRetry }) {
  return (
    <div className="empty-state error" role="alert">
      <IconTile icon="TriangleAlert" tone="bad" size={44} />
      <div className="es-text"><b>{title}</b><p>{text}</p></div>
      {onRetry && <div className="es-actions"><button type="button" className="btn ghost" onClick={onRetry}><Icon name="RotateCw" size={15} />Try again</button></div>}
    </div>
  )
}

export const statusChip = {
  earned: { cls: 'good', label: 'Earned', icon: 'CircleCheck' },
  progress: { cls: 'warn', label: 'In progress', icon: 'Clock' },
  available: { cls: 'accent', label: 'Available', icon: 'Sparkles' },
  locked: { cls: 'lock', label: 'Locked', icon: 'Lock' },
}

// Framer-motion variants some pages still pass while they move over to GSAP; harmless plain objects.
export const stagger = {}
export const rise = {}
