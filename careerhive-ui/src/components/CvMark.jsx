import { useId } from 'react'

/**
 * The CV coach's flat mark, the same design as the 3D one (three/CvCompass.jsx): a CV with a folded corner and a compass
 * whose needle settles up and to the right — the next step. Theme colours; `glass` for coloured panels.
 * The needle's hunt-and-settle is CSS (.cv-mark .cvm-needle in index.css).
 */
export default function CvMark({ size = 34, glass = false, className = '' }) {
  const id = `cvm${useId().replace(/:/g, '')}`
  const fill = glass ? 'rgba(255,255,255,.2)' : `url(#${id})`
  return (
    <svg className={`cv-mark ${glass ? 'glass' : ''} ${className}`} width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--accent-2)' }} />
          <stop offset="1" style={{ stopColor: 'var(--accent)' }} />
        </linearGradient>
      </defs>
      <rect className="cvm-tile" x="1" y="1" width="46" height="46" rx="14" fill={fill} stroke={glass ? 'rgba(255,255,255,.35)' : 'none'} />
      <path d="M13 9.5h13.2L34 17.3v19.2a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3v-24a3 3 0 0 1 3-3z" fill="#fff" />
      <path d="M26.2 9.5v5.8a2 2 0 0 0 2 2H34z" fill={glass ? 'rgba(255,255,255,.55)' : `url(#${id})`} opacity={glass ? 1 : 0.5} />
      <circle cx="16.2" cy="16.4" r="2.6" fill={glass ? 'var(--accent)' : `url(#${id})`} />
      <rect x="20.4" y="14.6" width="6" height="2.1" rx="1.05" fill={glass ? 'var(--accent)' : `url(#${id})`} opacity=".85" />
      <rect className="cvm-line" x="13.6" y="22" width="12.5" height="1.9" rx=".95" fill="#c9d4e6" />
      <rect className="cvm-line" x="13.6" y="25.6" width="9" height="1.9" rx=".95" fill="#c9d4e6" />
      <g className="cvm-compass">
        <circle cx="32" cy="33" r="9.6" fill={glass ? 'var(--accent)' : `url(#${id})`} stroke="#fff" strokeWidth="2.4" />
        <g className="cvm-needle">
          <path d="M32 26.4l2.3 6.6h-4.6z" fill="#fff" />
          <path d="M32 39.6l-2.3-6.6h4.6z" fill="#fff" opacity=".5" />
        </g>
        <circle cx="32" cy="33" r="1.35" fill={glass ? 'var(--accent)' : `url(#${id})`} stroke="#fff" strokeWidth=".8" />
      </g>
    </svg>
  )
}
