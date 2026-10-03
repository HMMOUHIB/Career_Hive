import { useEffect, useRef } from 'react'

// Layered, slowly morphing blob (the "statistic" orb in the reference shot).
const layers = [
  { r: 96, amp: 10, k: 5, speed: 0.6, fill: 'url(#bg1)', o: 0.9, phase: 0 },
  { r: 90, amp: 12, k: 4, speed: -0.45, fill: 'url(#bg2)', o: 0.75, phase: 1.3 },
  { r: 84, amp: 9, k: 6, speed: 0.35, fill: 'url(#bg3)', o: 0.8, phase: 2.1 },
]

function path(cx, cy, r, amp, k, t, phase) {
  const pts = 64
  let d = ''
  for (let i = 0; i <= pts; i++) {
    const a = (i / pts) * Math.PI * 2
    const rr = r + Math.sin(a * k + t + phase) * amp + Math.cos(a * (k - 2) - t * 0.7) * amp * 0.4
    d += `${i ? 'L' : 'M'}${(cx + Math.cos(a) * rr).toFixed(2)},${(cy + Math.sin(a) * rr).toFixed(2)}`
  }
  return d + 'Z'
}

export default function Blob({ size = 230 }) {
  const refs = useRef([])
  useEffect(() => {
    let raf
    const loop = (ms) => {
      const t = ms / 1000
      layers.forEach((l, i) => refs.current[i]?.setAttribute('d', path(115, 115, l.r, l.amp, l.k, t * l.speed, l.phase)))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <svg viewBox="0 0 230 230" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: "var(--accent)" }} /><stop offset="1" style={{ stopColor: "var(--orb-b)" }} /></linearGradient>
        <linearGradient id="bg2" x1="1" y1="0" x2="0" y2="1"><stop offset="0" style={{ stopColor: "var(--pill)" }} /><stop offset="1" style={{ stopColor: "var(--accent-2)" }} /></linearGradient>
        <linearGradient id="bg3" x1="0" y1="1" x2="1" y2="0"><stop offset="0" style={{ stopColor: "var(--orb-b)" }} /><stop offset="1" style={{ stopColor: "var(--accent)" }} /></linearGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="1.2" /></filter>
      </defs>
      {layers.map((l, i) => (
        <path key={i} ref={(el) => (refs.current[i] = el)} fill={l.fill} opacity={l.o} filter="url(#soft)" />
      ))}
    </svg>
  )
}
