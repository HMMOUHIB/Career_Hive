import { lazy, Suspense } from 'react'

const HamzaouiMark = lazy(() => import('../three/HamzaouiMark'))

/**
 * The CareerHive logo: the Hamzaoui emblem (three/HamzaouiMark.jsx), loaded on demand; an empty slot of the same size
 * holds its place. `tone="white"` for coloured panels, `spin` for the loading screen, `onReady` once it shows.
 * Its glow is the theme's --logo-drop.
 */
export default function Logo({ theme, tone, spin, className = 'logo-mark', onReady }) {
  return <Suspense fallback={<span className={className} aria-hidden="true" />}><HamzaouiMark theme={theme} tone={tone} spin={spin} className={className} onReady={onReady} /></Suspense>
}

/** "CareerHive" under the logo: each word rises out of its own mask, then "Hive" keeps a slow flowing gradient (.brand-title). */
export function BrandTitle() {
  return (
    <span className="brand-name brand-title">
      <span><b>Career</b></span>
      <span><b className="hive">Hive</b></span>
    </span>
  )
}
