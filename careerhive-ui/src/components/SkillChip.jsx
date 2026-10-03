import { techFor } from '../data/techIcons'
import { TechBadge, TechLogo } from './Cover'
import { Icon } from './ui'

const isDark = (hex) => parseInt(hex.slice(1), 16) < 0x333333
const hueOf = (s) => [...s.toLowerCase()].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 360, 7)

/** Skill label with its real logo when we know it; otherwise the `fallback` icon. */
export function SkillIcon({ name, size = 14, fallback = 'Sparkles' }) {
  const t = techFor(name)
  if (!t) return <Icon name={fallback} size={size - 1} />
  return <span className="skill-ic" style={{ width: size, height: size }}><TechLogo icon={t} size={size} color={isDark(t.hex) ? 'currentColor' : t.hex} /></span>
}

/** A skill as a small logo tile: its technology's logo when we know it, else its initial on a tile tinted from the name. */
export function SkillBadge({ name = '', size = 30 }) {
  const radius = Math.round(size * 0.3)
  if (techFor(name)) return <TechBadge item={{ title: name }} size={size} radius={radius} />
  const h = hueOf(name)
  return (
    <span className="tech-badge skill-mono" title={name} style={{ width: size, height: size, borderRadius: radius, fontSize: size * 0.44, background: `linear-gradient(140deg, hsl(${h} 72% 62%), hsl(${h} 62% 38%))`, boxShadow: `0 10px 22px -12px hsl(${h} 70% 45%)` }}>
      {name.trim().charAt(0).toUpperCase() || '?'}
    </span>
  )
}

export function SkillChip({ name, plain }) {
  return <span className={`chip ${plain ? '' : 'accent'}`}><SkillIcon name={name} size={12} />{name}</span>
}
