/**
 * Hamzaoui — the employee dashboard's mascot: src/assets/hamzaoui.glb, a flat Rick & Morty emblem (a disc with
 * their heads cut out, plus a separate mesh for their eyes). It has no rig or clips, so its life is procedural:
 *   entrance                    → spins in and pops open, then Mascot's vortex opens behind it
 *   cursor anywhere on the page → the badge tilts toward it and both pairs of eyes follow it; they blink now and then
 *   hovering it → lifts toward you and glows · click → flips like a coin · drag → spin it, it springs back
 */
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import modelUrl from '../assets/hamzaoui.glb?url'

const HEIGHT = 3.4 // badge diameter, close to the other mascots' footprint
const CENTER_Y = 0.25 // concentric with Mascot's vortex, which then rings it like a halo
const ENTER = 1.1 // seconds for the entrance spin
const EYE_TRAVEL = [0.08, 0.06] // how far the eyes shift toward the cursor, in model units (the badge is ~4 across)
const FROST = new THREE.Color('#f2f7ff') // on the blue frost hero the blue badge would vanish: it turns white there

const easeOut = (x) => 1 - (1 - x) ** 3
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)
const backOut = (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2
const phase = (t, start, dur) => { const p = (t - start) / dur; return p >= 0 && p < 1 ? p : null }

/** Clone the cached GLB, bake the eyes into badge space so they can be moved per vertex, and fit it. */
function buildBadge(scene) {
  const root = scene.clone()
  root.updateMatrixWorld(true)
  let body, eyes
  root.traverse((o) => { if (o.isMesh) { if (o.name.startsWith('Eyes')) eyes = o; else body = o } })
  body.material = body.material.clone() // own copy: it glows on hover and changes colour per theme
  eyes.material = body.material

  eyes.geometry = eyes.geometry.clone().applyMatrix4(eyes.matrixWorld)
  eyes.removeFromParent()
  eyes.position.set(0, 0, 0); eyes.quaternion.identity(); eyes.scale.set(1, 1, 1)
  root.add(eyes)
  const rest = eyes.geometry.attributes.position.array.slice()

  // one cluster per eye: the mesh's connected pieces, after welding vertices that share a position (the caps and
  // sides of each extruded eye are split apart in the file)
  const n = rest.length / 3, weld = new Int32Array(n), ids = new Map()
  for (let v = 0; v < n; v++) {
    const key = `${Math.round(rest[v * 3] * 1e4)},${Math.round(rest[v * 3 + 1] * 1e4)},${Math.round(rest[v * 3 + 2] * 1e4)}`
    if (!ids.has(key)) ids.set(key, ids.size)
    weld[v] = ids.get(key)
  }
  const parent = [...Array(ids.size).keys()]
  const top = (a) => (parent[a] === a ? a : (parent[a] = top(parent[a])))
  const tri = eyes.geometry.index?.array ?? [...Array(n).keys()]
  for (let k = 0; k < tri.length; k += 3) { const a = top(weld[tri[k]]); parent[top(weld[tri[k + 1]])] = a; parent[top(weld[tri[k + 2]])] = a }
  const groups = new Map()
  for (let v = 0; v < n; v++) {
    const c = groups.get(top(weld[v])) ?? { idx: [], x: 0, y0: Infinity, y1: -Infinity }
    groups.set(top(weld[v]), c)
    c.idx.push(v); c.x += rest[v * 3]; c.y0 = Math.min(c.y0, rest[v * 3 + 1]); c.y1 = Math.max(c.y1, rest[v * 3 + 1])
  }
  const clusters = [...groups.values()].sort((a, b) => a.x / a.idx.length - b.x / b.idx.length) // Rick's eyes, then Morty's
  clusters.forEach((c, k) => { c.cy = (c.y0 + c.y1) / 2; c.lag = k < clusters.length / 2 ? 0 : 0.12 }) // Morty blinks a beat after Rick

  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3())
  const scale = HEIGHT / size.y
  return {
    root, body, eyes, rest, clusters, blue: body.material.color.clone(),
    fit: { scale, offset: center.multiplyScalar(-scale).toArray(), radius: (Math.max(size.x, size.y) * scale) / 2 },
    dispose() { body.material.dispose(); eyes.geometry.dispose() },
  }
}

/** `stage.current.arrivedAt` is set to the clock time the entrance ends (Mascot's vortex waits for it). */
export default function Hamzaoui({ stage }) {
  const { scene } = useGLTF(modelUrl)
  const badge = useMemo(() => buildBadge(scene), [scene])
  const group = useRef()
  const { gl, clock } = useThree()
  const input = useRef({ x: 0, y: 0, active: false, over: false, drag: null, spin: 0, spinV: 0, flip: -99 })
  const smooth = useRef({ x: 0, y: 0, ex: 0, ey: 0, face: 0, t0: null, blink: 2 })

  useEffect(() => badge.dispose, [badge])

  useEffect(() => {
    const el = gl.domElement, i = input.current
    const move = (e) => {
      const r = el.getBoundingClientRect()
      i.x = ((e.clientX - r.left) / r.width) * 2 - 1
      i.y = 1 - ((e.clientY - r.top) / r.height) * 2
      i.active = true
      if (i.drag) { i.spin = i.drag.spin + (e.clientX - i.drag.x) * 0.012; i.spinV = 0 }
    }
    const leave = () => { i.active = false }
    const grab = (e) => { if (e.button !== 0) return; i.drag = { x: e.clientX, spin: i.spin }; el.style.cursor = 'grabbing' }
    const drop = () => {
      if (!i.drag) return
      i.drag = null
      i.spin = THREE.MathUtils.euclideanModulo(i.spin + Math.PI, Math.PI * 2) - Math.PI // spring back the short way round
      el.style.cursor = ''
    }
    const root = document.documentElement
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerup', drop)
    window.addEventListener('pointercancel', drop)
    root.addEventListener('pointerleave', leave)
    el.addEventListener('pointerdown', grab)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', drop)
      window.removeEventListener('pointercancel', drop)
      root.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointerdown', grab)
    }
  }, [gl])

  useFrame((_, delta) => {
    const t = clock.elapsedTime, dt = Math.min(delta, 1 / 20)
    const i = input.current, s = smooth.current, g = group.current
    const ease = (rate) => 1 - Math.exp(-rate * dt)
    if (s.t0 === null) s.t0 = matchMedia('(prefers-reduced-motion: reduce)').matches ? t - ENTER : t // reduced motion: no entrance

    // smooth the inputs; with no cursor around it drifts on its own
    s.x += ((i.active ? i.x : Math.sin(t * 0.37) * 0.4) - s.x) * ease(5)
    s.y += ((i.active ? i.y : Math.sin(t * 0.23) * 0.2) - s.y) * ease(5)
    s.ex += ((i.active ? i.x : s.x) - s.ex) * ease(14) // the eyes dart ahead of the tilt
    s.ey += ((i.active ? i.y : s.y) - s.ey) * ease(14)
    s.face += ((i.over || i.drag ? 1 : 0) - s.face) * ease(5)
    if (!i.drag) { i.spinV += (-40 * i.spin - 7 * i.spinV) * dt; i.spin += i.spinV * dt }
    const lx = Math.tanh(s.x * 0.8), ly = Math.tanh(s.y * 0.8) // the cursor can be far outside the canvas

    // entrance: spin in edge-first and pop to size; then the vortex may open
    const enter = Math.min(1, (t - s.t0) / ENTER)
    if (enter === 1 && stage.current.arrivedAt === null) stage.current.arrivedAt = s.t0 + ENTER
    const flip = phase(t, i.flip, 0.9)
    g.position.set(0, CENTER_Y + Math.sin(t * 1.6) * 0.06 + (flip === null ? 0 : Math.sin(flip * Math.PI) * 0.35), s.face * 0.35)
    g.rotation.set(-ly * 0.28, lx * 0.4 + i.spin + (flip === null ? 0 : easeInOut(flip) * Math.PI * 2) - (1 - easeOut(enter)) * Math.PI * 2, Math.sin(t * 0.8) * 0.03)
    g.scale.setScalar(backOut(enter) * (1 + s.face * 0.05))

    // eyes: shift toward the cursor, and blink (each eye squashes toward its own middle)
    if (t > s.blink + 0.4) s.blink = t + 2.5 + Math.random() * 3
    const pos = badge.eyes.geometry.attributes.position, { rest } = badge
    const ox = Math.tanh(s.ex * 0.8) * EYE_TRAVEL[0], oy = Math.tanh(s.ey * 0.8) * EYE_TRAVEL[1]
    for (const c of badge.clusters) {
      const b = phase(t, s.blink + c.lag, 0.16)
      const open = b === null ? 1 : 0.1 + 0.9 * Math.abs(Math.cos(b * Math.PI))
      for (const v of c.idx) pos.setXY(v, rest[v * 3] + ox, c.cy + (rest[v * 3 + 1] - c.cy) * open + oy)
    }
    pos.needsUpdate = true

    // colour: the model's blue, white on the frost theme; glows while hovered
    const m = badge.body.material
    m.color.lerp(document.documentElement.dataset.theme === 'frost' ? FROST : badge.blue, ease(6))
    m.emissive.copy(m.color)
    m.emissiveIntensity = s.face * 0.35
  })

  const { fit } = badge
  return (
    <group ref={group} position-y={CENTER_Y}>
      <group position={fit.offset} scale={fit.scale}><primitive object={badge.root} /></group>
      <mesh
        position-z={0.1}
        onPointerOver={(e) => { e.stopPropagation(); input.current.over = true }}
        onPointerOut={() => { input.current.over = false }}
        onClick={(e) => { e.stopPropagation(); if (e.delta < 5) input.current.flip = clock.elapsedTime }}
      >
        <circleGeometry args={[fit.radius, 48]} />
        <meshBasicMaterial visible={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

useGLTF.preload(modelUrl)
