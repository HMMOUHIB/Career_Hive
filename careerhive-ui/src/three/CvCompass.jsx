/**
 * CvCompass — the CV coach's own 3D mark: a CV sheet with a folded corner, its lines and skill pills, a beam of light
 * scanning down it, and a compass badge whose needle settles "up and to the right" — your next step. Built from
 * primitives (no model file) and tinted with the theme.
 * `mode`: idle (the drop zone) · drag (a file is over it: the needle hunts) · scan (analysing: fast beam, spinning
 * needle, lines lighting up) · done (the needle locks, the rim turns green) · error (the needle drops, the rim turns red).
 * It renders only while on screen and not `paused` (hidden under the analysis overlay); with reduced motion it draws
 * one still frame.
 */
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'

const PALETTE = {
  frost: { a: '#2f7bf6', b: '#5fb2ff', sheet: '#ffffff', line: '#d3deef', ink: '#1c3fc9' },
  ember: { a: '#ff6a55', b: '#ff9a7e', sheet: '#fff6f3', line: '#efd5cf', ink: '#b8202f' },
  light: { a: '#d63a3a', b: '#f0664e', sheet: '#ffffff', line: '#eed8d4', ink: '#9e1f2a' },
}
const GOOD = new THREE.Color('#14a36b'), BAD = new THREE.Color('#e0453c')
const W = 2.2, H = 2.9, R = 0.2, F = 0.5, D = 0.1 // sheet width, height, corner radius, fold, depth
const Z = D / 2 + 0.045 // the sheet's front face
const NEXT = -Math.PI / 4 // the needle at rest: up and to the right
const LINES = [[0.32, 1.6], [0.12, 1.32], [-0.08, 1.5], [-0.28, 1.04]] // body lines: y, width (left-aligned at x = -0.8)
const PILLS = [-0.8, -0.3, 0.2] // skill pills' left edges, at y = -0.62

function roundRect(w, h, r, x0 = -w / 2, y0 = -h / 2) {
  const s = new THREE.Shape()
  s.moveTo(x0 + r, y0); s.lineTo(x0 + w - r, y0); s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r)
  s.lineTo(x0 + w, y0 + h - r); s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h)
  s.lineTo(x0 + r, y0 + h); s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r)
  s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0)
  return s
}

/** The sheet's outline: rounded corners, the top-right one folded over. */
function sheetShape() {
  const s = new THREE.Shape(), x = -W / 2, y = -H / 2
  s.moveTo(x + R, y); s.lineTo(x + W - R, y); s.quadraticCurveTo(x + W, y, x + W, y + R)
  s.lineTo(x + W, y + H - F); s.lineTo(x + W - F, y + H)
  s.lineTo(x + R, y + H); s.quadraticCurveTo(x, y + H, x, y + H - R)
  s.lineTo(x, y + R); s.quadraticCurveTo(x, y, x + R, y)
  return s
}

/** A soft vertical (beam) or radial (glow) alpha ramp, as a texture. */
function ramp(kind) {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grad = kind === 'radial' ? g.createRadialGradient(32, 32, 0, 32, 32, 32) : g.createLinearGradient(0, 0, 0, 64)
  if (kind === 'radial') { grad.addColorStop(0, '#fff'); grad.addColorStop(1, '#000') } else { grad.addColorStop(0, '#000'); grad.addColorStop(0.55, '#fff'); grad.addColorStop(0.62, '#fff'); grad.addColorStop(1, '#000') }
  g.fillStyle = grad; g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

const basic = (opts) => new THREE.MeshBasicMaterial({ toneMapped: false, ...opts })

function Mark({ theme, mode }) {
  const invalidate = useThree((s) => s.invalidate)
  const rig = useRef(null), beam = useRef(null), beamLine = useRef(null), needle = useRef(null), orbit = useRef(null), halo = useRef(null)
  const sim = useRef({ angle: NEXT + 1.2, vel: 0, light: 0, scale: 1 })
  const modeRef = useRef(mode)
  useEffect(() => { modeRef.current = mode }, [mode])

  const geo = useMemo(() => {
    const sheet = new THREE.ExtrudeGeometry(sheetShape(), { depth: D, bevelEnabled: true, bevelThickness: 0.045, bevelSize: 0.045, bevelSegments: 4, curveSegments: 10 })
    sheet.translate(0, 0, -D / 2)
    const fold = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(W / 2 - F, H / 2), new THREE.Vector2(W / 2 - F + 0.04, H / 2 - F + 0.04), new THREE.Vector2(W / 2, H / 2 - F)]))
    const north = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.085, 0), new THREE.Vector2(0, 0.44), new THREE.Vector2(0.085, 0)]))
    const south = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(-0.085, 0), new THREE.Vector2(0, -0.3), new THREE.Vector2(0.085, 0)]))
    const lines = LINES.map(([, w]) => new THREE.ShapeGeometry(roundRect(w, 0.075, 0.037, 0, -0.0375), 6))
    return {
      sheet, fold, north, south, lines,
      title: new THREE.ShapeGeometry(roundRect(0.92, 0.13, 0.065, 0, -0.065), 6),
      sub: new THREE.ShapeGeometry(roundRect(0.62, 0.08, 0.04, 0, -0.04), 6),
      pill: new THREE.ShapeGeometry(roundRect(0.42, 0.16, 0.08, 0, -0.08), 6),
      avatar: new THREE.CircleGeometry(0.23, 40),
      rim: new THREE.CylinderGeometry(0.66, 0.66, 0.16, 56).rotateX(Math.PI / 2),
      face: new THREE.CircleGeometry(0.55, 56),
      tick: new THREE.PlaneGeometry(0.035, 0.1),
      cap: new THREE.CircleGeometry(0.07, 24),
      glowRing: new THREE.TorusGeometry(0.7, 0.022, 10, 72),
      halo: new THREE.TorusGeometry(2.05, 0.009, 8, 160),
      dot: new THREE.SphereGeometry(0.038, 12, 12),
      beam: new THREE.PlaneGeometry(W - 0.16, 0.6),
      beamLine: new THREE.PlaneGeometry(W - 0.16, 0.022),
      glow: new THREE.PlaneGeometry(5, 5),
    }
  }, [])
  const tex = useMemo(() => ({ beam: ramp('linear'), glow: ramp('radial') }), [])
  const mat = useMemo(() => ({
    sheet: new THREE.MeshPhysicalMaterial({ roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.25 }),
    fold: basic({}), avatar: basic({}), title: basic({}), sub: basic({}), tick: basic({}), cap: basic({}), north: basic({}), south: basic({}), face: basic({}),
    lines: LINES.map(() => basic({})),
    pills: PILLS.map(() => basic({ transparent: true })),
    rim: new THREE.MeshStandardMaterial({ metalness: 0.35, roughness: 0.32 }),
    glowRing: basic({ transparent: true, opacity: 0.85 }),
    halo: basic({ transparent: true, opacity: 0.4 }),
    dot: basic({}),
    beam: basic({ transparent: true, alphaMap: tex.beam, depthWrite: false }),
    beamLine: basic({ transparent: true, depthWrite: false }),
    glow: basic({ transparent: true, alphaMap: tex.glow, opacity: 0.32, depthWrite: false }),
  }), [tex])
  useEffect(() => () => {
    Object.values(geo).flat().forEach((g) => g.dispose())
    Object.values(mat).flat().forEach((m) => m.dispose())
    Object.values(tex).forEach((t) => t.dispose())
  }, [geo, mat, tex])

  // theme colours, and the working colours the frame loop blends between
  const col = useMemo(() => ({ a: new THREE.Color(), b: new THREE.Color(), line: new THREE.Color(), tmp: new THREE.Color() }), [])
  useEffect(() => {
    const p = PALETTE[theme] ?? PALETTE.frost
    col.a.set(p.a); col.b.set(p.b); col.line.set(p.line)
    mat.sheet.color.set(p.sheet); mat.face.color.set(p.sheet)
    mat.fold.color.set(p.b); mat.avatar.color.set(p.a); mat.title.color.set(p.ink); mat.sub.color.set(p.line).multiplyScalar(0.86)
    mat.tick.color.set(p.a); mat.cap.color.set(p.ink); mat.north.color.set(p.a); mat.south.color.set(p.line).multiplyScalar(0.8)
    mat.rim.color.set(p.a); mat.rim.emissive.set(p.a); mat.rim.emissiveIntensity = 0.25
    mat.glowRing.color.set(p.b); mat.halo.color.set(p.a); mat.dot.color.set(p.b); mat.beam.color.set(p.b); mat.beamLine.color.set(p.b); mat.glow.color.set(p.a)
    mat.lines.forEach((m) => m.color.set(p.line)); mat.pills.forEach((m) => { m.color.set(p.a); m.opacity = 0.28 })
    invalidate()
  }, [theme, mat, col, invalidate])

  const dots = useMemo(() => Array.from({ length: 16 }, (_, i) => ({ a: (i / 16) * Math.PI * 2, r: 1.85 + (i % 3) * 0.12, y: ((i * 7) % 5 - 2) * 0.05 })), [])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime, m = modeRef.current, s = sim.current
    const busy = m === 'scan' || m === 'drag'
    dt = Math.min(dt, 0.05)
    // float and sway; a little bigger while a file hovers
    s.scale += ((m === 'drag' ? 1.07 : 1) - s.scale) * Math.min(1, dt * 8)
    rig.current.scale.setScalar(s.scale)
    rig.current.position.y = Math.sin(t * 1.1) * 0.07
    rig.current.rotation.set(-0.08 + Math.sin(t * 0.37) * 0.06, Math.sin(t * 0.45) * (busy ? 0.18 : 0.32), Math.sin(t * 0.3) * 0.03)

    // the scan beam runs down the sheet; slow while idle, fast while analysing, gone once done
    const period = m === 'scan' ? 1.15 : m === 'drag' ? 1.6 : 3.8
    const ph = (t % period) / period, top = H / 2 - 0.2, bottom = -H / 2 + 0.2
    const by = top + (bottom - top) * (ph < 0.5 ? 2 * ph * ph : 1 - (-2 * ph + 2) ** 2 / 2)
    const on = m !== 'done' && m !== 'error'
    const fade = on ? Math.min(1, ph * 6, (1 - ph) * 6) : 0
    beam.current.position.y = by; beamLine.current.position.y = by - 0.05
    mat.beam.opacity = fade * (m === 'scan' ? 0.95 : 0.6); mat.beamLine.opacity = fade

    // lines light up as the beam passes; all of them glow once the analysis is done
    s.light += ((m === 'done' ? 1 : 0) - s.light) * Math.min(1, dt * 3)
    LINES.forEach(([y], i) => {
      const lit = by < y ? Math.max(0, 1 - (y - by) / 0.55) * fade : 0
      mat.lines[i].color.copy(col.line).lerp(col.b, Math.max(lit, s.light * 0.7))
    })
    mat.pills.forEach((pm, i) => { const lit = by < -0.62 ? Math.max(0, 1 - (-0.62 - by) / 0.5) * fade : 0; pm.opacity = 0.28 + 0.72 * Math.max(lit, s.light, m === 'scan' ? 0.4 + 0.3 * Math.sin(t * 6 + i) : 0) })

    // the needle: hunts while a file hovers or is read, then springs to the next step (or drops on an error)
    if (busy) { s.angle -= dt * (m === 'scan' ? 7 : 4.5); s.vel = 0 } else {
      const target = m === 'error' ? Math.PI : NEXT + (m === 'idle' ? Math.sin(t * 1.3) * 0.16 : 0)
      s.angle = target + ((((s.angle - target + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI
      s.vel += ((target - s.angle) * 42 - s.vel * 7) * dt
      s.angle += s.vel * dt
    }
    needle.current.rotation.z = s.angle
    const state3 = m === 'done' ? GOOD : m === 'error' ? BAD : col.a
    mat.rim.color.lerp(state3, Math.min(1, dt * 4)); mat.rim.emissive.copy(mat.rim.color)
    mat.glowRing.color.copy(m === 'done' ? GOOD : m === 'error' ? BAD : col.b)
    mat.glowRing.opacity = 0.55 + 0.35 * Math.sin(t * (busy ? 7 : 2.4))

    // satellites and the halo
    orbit.current.rotation.z += dt * (m === 'scan' ? 1.7 : m === 'drag' ? 1.1 : 0.32)
    halo.current.rotation.z -= dt * 0.12
  })

  return (
    <group ref={rig}>
      <mesh geometry={geo.glow} material={mat.glow} position={[0, 0, -0.8]} />
      <mesh ref={halo} geometry={geo.halo} material={mat.halo} rotation={[1.22, 0.18, 0]} />
      <group ref={orbit} rotation={[1.1, -0.25, 0]}>
        {dots.map((d, i) => <mesh key={i} geometry={geo.dot} material={mat.dot} position={[Math.cos(d.a) * d.r, Math.sin(d.a) * d.r, d.y]} scale={0.7 + (i % 4) * 0.25} />)}
      </group>

      <mesh geometry={geo.sheet} material={mat.sheet} />
      <mesh geometry={geo.fold} material={mat.fold} position={[0, 0, Z + 0.004]} />
      <group position={[0, 0, Z + 0.002]}>
        <mesh geometry={geo.avatar} material={mat.avatar} position={[-0.56, 0.9, 0]} />
        <mesh geometry={geo.title} material={mat.title} position={[-0.2, 0.98, 0]} />
        <mesh geometry={geo.sub} material={mat.sub} position={[-0.2, 0.78, 0]} />
        {LINES.map(([y], i) => <mesh key={y} geometry={geo.lines[i]} material={mat.lines[i]} position={[-0.8, y, 0]} />)}
        {PILLS.map((x, i) => <mesh key={x} geometry={geo.pill} material={mat.pills[i]} position={[x, -0.62, 0]} />)}
        <mesh ref={beam} geometry={geo.beam} material={mat.beam} position={[0, 0, 0.01]} />
        <mesh ref={beamLine} geometry={geo.beamLine} material={mat.beamLine} position={[0, 0, 0.012]} />
      </group>

      <group position={[0.95, -1.08, 0.34]}>
        <mesh geometry={geo.glowRing} material={mat.glowRing} position={[0, 0, -0.02]} />
        <mesh geometry={geo.rim} material={mat.rim} />
        <mesh geometry={geo.face} material={mat.face} position={[0, 0, 0.082]} />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2, r = i % 3 === 0 ? 0.43 : 0.45
          return <mesh key={i} geometry={geo.tick} material={mat.tick} position={[Math.sin(a) * r, Math.cos(a) * r, 0.086]} rotation={[0, 0, -a]} scale={i % 3 === 0 ? [1.2, 1.3, 1] : [0.8, 0.7, 1]} />
        })}
        <group ref={needle} position={[0, 0, 0.09]}>
          <mesh geometry={geo.north} material={mat.north} />
          <mesh geometry={geo.south} material={mat.south} />
        </group>
        <mesh geometry={geo.cap} material={mat.cap} position={[0, 0, 0.095]} />
      </group>
    </group>
  )
}

export default function CvCompass({ theme, mode = 'idle', paused = false, className = 'cv3d' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(true)
  const still = useMemo(() => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, [])
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting))
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])
  return (
    <span ref={ref} className={className} aria-hidden="true">
      <Canvas frameloop={still ? 'demand' : visible && !paused ? 'always' : 'never'} flat dpr={[1, 2]} camera={{ position: [0, 0, 8.7], fov: 30 }} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}>
        <ambientLight intensity={1.15} />
        <directionalLight position={[3, 4, 6]} intensity={1.8} />
        <directionalLight position={[-4, -2, 3]} intensity={0.5} />
        <Mark theme={theme} mode={mode} />
      </Canvas>
    </span>
  )
}
