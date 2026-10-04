import { useMemo } from 'react'
import { resolveIcon } from '../data/techIcons'
import { Icon } from './ui'

/* ---------- colour helpers ---------- */
const rgb = (hex) => { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255] }
const toHex = (c) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')
const mix = (a, b, t) => toHex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t))
const lum = (hex) => { const [r, g, b] = rgb(hex).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }); return 0.2126 * r + 0.7152 * g + 0.0722 * b }

export function paletteFor(hex) {
  const L = lum(hex)
  if (L < 0.03) return { a: '#343a4a', b: '#0d0f16', logo: '#ffffff', glow: '#8b93ff' } // black brands
  if (L > 0.5) return { a: mix(hex, '#000', 0.55), b: mix(hex, '#000', 0.88), logo: hex, glow: hex } // very light brands
  return { a: mix(hex, '#fff', 0.12), b: mix(hex, '#000', 0.62), logo: '#ffffff', glow: hex }
}

/* deterministic pseudo-random from a seed */
const rng = (seed) => { let s = (Math.abs(seed) * 9301 + 49297) % 233280 || 1; return () => (s = (s * 9301 + 49297) % 233280) / 233280 }
const seedOf = (v) => [...String(v)].reduce((n, c) => n * 31 + c.charCodeAt(0), 7) % 100000

/** A single tech mark: real SVG logo, text mark, lucide fallback or an uploaded image. */
export function TechLogo({ icon, size = 24, color }) {
  if (icon.kind === 'svg') {
    return <svg viewBox="0 0 24 24" width={size} height={size} fill={color ?? icon.hex} role="img" aria-label={icon.title}><path d={icon.path} /></svg>
  }
  if (icon.kind === 'text') {
    return <span style={{ fontSize: size * 0.62, fontWeight: 800, letterSpacing: '-0.04em', color: color ?? icon.hex, lineHeight: 1, fontFamily: 'var(--f-display)' }} aria-label={icon.title}>{icon.label}</span>
  }
  if (icon.kind === 'img') return <img src={icon.src} alt={icon.title ?? ''} width={size} height={size} style={{ objectFit: 'contain', borderRadius: size * 0.18 }} />
  return <Icon name={icon.name} size={size} style={{ color: color ?? icon.hex }} />
}

/** Square logo tile (thumbnails, lists, badges). */
export function TechBadge({ item, size = 54, radius = 16 }) {
  const icon = resolveIcon(item)
  const p = paletteFor(icon.hex)
  return (
    <div className="tech-badge" style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(140deg, ${p.a}, ${p.b})`, boxShadow: `0 10px 24px -12px ${p.glow}` }} title={icon.title}>
      <TechLogo icon={icon} size={size * 0.5} color={p.logo} />
    </div>
  )
}

/** Generated course cover: brand gradient, contour-line pattern, oversized glowing logo. */
export default function Cover({ item, variant = 'card', children, className = '', style }) {
  const icon = resolveIcon(item)
  const p = paletteFor(icon.hex)
  const seed = seedOf(item.id ?? item.title)
  const rings = useMemo(() => {
    const r = rng(seed)
    const cx = 70 + r() * 20, cy = 55 + r() * 25
    return Array.from({ length: 9 }, (_, k) => {
      const base = 10 + k * 9
      const pts = 48
      let d = ''
      const ph = r() * 6, amp = 1.5 + r() * 3.5, f = 3 + Math.floor(r() * 3)
      for (let i = 0; i <= pts; i++) {
        const a = (i / pts) * Math.PI * 2
        const rad = base + Math.sin(a * f + ph) * amp + Math.cos(a * 2 - ph) * amp * 0.6
        d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rad * 1.25).toFixed(1)},${(cy + Math.sin(a) * rad).toFixed(1)}`
      }
      return d + 'Z'
    })
  }, [seed])

  const big = variant === 'drawer' ? 112 : variant === 'tile' ? 84 : 104
  return (
    <div className={`cover-art cover-${variant} ${className}`} style={{ background: `radial-gradient(120% 90% at 85% 80%, ${mix(p.glow, p.b, 0.55)} 0%, transparent 55%), linear-gradient(145deg, ${p.a} 0%, ${p.b} 100%)`, ...style }}>
      <svg className="cover-lines" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden>
        {rings.map((d, i) => <path key={i} d={d} fill="none" stroke="#fff" strokeOpacity={0.05 + i * 0.012} strokeWidth="0.35" />)}
      </svg>
      <div className="cover-dots" aria-hidden />
      <div className="cover-ghost" aria-hidden><TechLogo icon={icon} size={big * 2.1} color="#ffffff" /></div>
      <div className="cover-logo" style={{ '--glow': `${p.glow}aa` }}><TechLogo icon={icon} size={big} color={p.logo} /></div>
      <div className="cover-shine" aria-hidden />
      {children}
    </div>
  )
}
