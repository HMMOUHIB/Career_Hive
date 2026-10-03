/**
 * Mouhib — the mascot loaded from src/assets/mouhib.glb (a rigged character with a portal gun).
 * The GLB ships one frozen pose and no clips, so every movement is procedural and driven by the interface:
 *   entrance                         → a portal-gun shot splashes open a portal, he jumps out, it closes behind him
 *   cursor anywhere on the page      → body, chest, head and eyes track it
 *   hovering a button / field / card → he aims the portal gun at it and it charges up; pressing it fires
 *   a focused, hidden password field → he looks away
 *   hovering him → turns to you and twirls the gun · click → spin-jump · drag → spin him, he springs back
 */
import { useGLTF } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { clone as cloneRig } from 'three/addons/utils/SkeletonUtils.js'
import modelUrl from '../assets/mouhib.glb?url'

const HEIGHT = 3.6 // same on-screen footprint the bee had
const FLOOR = -1.72 // lowest foot, just above Mascot's contact shadow
const FACING = 2.5 // the GLB runs away from the camera; this yaw shows his face in a 3/4 view
const FRONT = -0.45 // extra body yaw toward the viewer while hovered
const HEAD_FRONT = -0.35 // resting head yaw toward the viewer, so the face and eyes read while the body runs 3/4
const AIM_Z = 2.2 // depth of the plane the gun aims at, in front of him
const MAX_AIM = 1.25 // radians the gun arm may swing away from its pose
const EYE_Z = 3.5 // depth of the plane the eyes focus on, between him and the camera
const EYE_TURN = 0.5 // gaze angle (radians) that takes a pupil to the rim of its eye
const EYE_CELL = 0.02 // height-map resolution over the eye whites, in model units
const INTERACTIVE = 'button, a, input, select, textarea, label, [role="button"], [role="tab"], .chip, .card, .kpi, .row-card, .stat-card'
// bones the (unskinned) lab coat gets bound to, each as a segment head → tail
const COAT = { spine: 'spine001', spine001: 'spine002', spine002: 'spine003', spine003: 'spine004', spine004: 'spine005',
  shoulderL: 'upper_armL', upper_armL: 'forearmL', forearmL: 'handL', handL: 'palm02L',
  shoulderR: 'upper_armR', upper_armR: 'forearmR', forearmR: 'handR', handR: 'palm02R' }
const LOOK = [['spine003', 0.2], ['spine004', 0.35], ['spine005', 0.45]] // how the head turn is spread down the neck
// entrance timeline, in seconds after the model is ready
const INTRO = { impact: 0.5, open: 0.45, jump: 0.95, land: 1.75, close: 2.2, end: 2.7 }
const PORTAL_Z = -1.3 // the portal he jumps out of stands between Mascot's vortex and him
const PORTAL_SIZE = 1.65
const JUMP_FROM = -2.8 // body depth when the jump starts, fully behind the portal
const SHOT_FROM = new THREE.Vector3(3.4, -1.9, 2.6), SHOT_BEND = new THREE.Vector3(1.8, 1.5, 1.2) // off-canvas bottom right, arcing up
const TRAIL = 10
const BURST = Array.from({ length: 48 }, (_, i) => {
  const a = (i / 48) * Math.PI * 2 + Math.random() * 0.3, v = 1.2 + Math.random() * 1.6
  return [Math.cos(a) * v, Math.sin(a) * v, Math.random() * 0.8]
})

const X = new THREE.Vector3(1, 0, 0), Z = new THREE.Vector3(0, 0, 1), ID = new THREE.Quaternion()
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _t = new THREE.Vector3()
const _q = new THREE.Quaternion(), _pq = new THREE.Quaternion(), _pi = new THREE.Quaternion(), _e = new THREE.Euler(), _m = new THREE.Matrix4()
const easeOut = (x) => 1 - (1 - x) ** 3
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)
const backOut = (x) => 1 + 2.2 * (x - 1) ** 3 + 1.2 * (x - 1) ** 2
/** 0→1 progress of a one-shot move that started at `start`, or null when it isn't running. */
const phase = (t, start, dur) => { const p = (t - start) / dur; return p >= 0 && p < 1 ? p : null }
const find = (root, prefix) => { let hit; root.traverse((o) => { if (!hit && o.name.startsWith(prefix)) hit = o }); return hit }
/** Point `out` on the portal-gun shot's arc (a quadratic Bézier ending at `to`) at progress p. */
const shotAt = (p, to, out) => out.set(0, 0, 0).addScaledVector(SHOT_FROM, (1 - p) ** 2).addScaledVector(SHOT_BEND, 2 * p * (1 - p)).addScaledVector(to, p * p)

let glow
/** A soft round sprite for the shot, its trail and the splash. */
function glowTexture() {
  if (glow) return glow
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  r.addColorStop(0, '#fff'); r.addColorStop(0.3, 'rgba(255,255,255,.7)'); r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 64, 64)
  return (glow = new THREE.CanvasTexture(c))
}

function segmentDistance(p, a, b) {
  _v.subVectors(b, a)
  const t = THREE.MathUtils.clamp(_w.subVectors(p, a).dot(_v) / _v.lengthSq(), 0, 1)
  return _w.copy(a).addScaledVector(_v, t).distanceTo(p)
}

/** The coat is a plain mesh frozen in the GLB's pose: bind each vertex to its nearest spine/arm bones so it moves with them. */
function skinToBones(mesh, skeleton, segments) {
  const geo = mesh.geometry
  if (!geo.attributes.skinIndex) {
    const pos = geo.attributes.position, n = pos.count, m = segments.length
    const index = new Uint16Array(n * 4), weight = new Float32Array(n * 4)
    const p = new THREE.Vector3(), d = new Float32Array(m), order = segments.map((_, i) => i)
    for (let v = 0; v < n; v++) {
      p.fromBufferAttribute(pos, v).applyMatrix4(mesh.matrixWorld)
      for (let s = 0; s < m; s++) d[s] = segmentDistance(p, segments[s][0], segments[s][1])
      order.sort((a, b) => d[a] - d[b])
      let sum = 0
      for (let k = 0; k < 4; k++) { const w = Math.max(d[order[k]], 0.05) ** -4; index[v * 4 + k] = order[k]; weight[v * 4 + k] = w; sum += w }
      for (let k = 0; k < 4; k++) weight[v * 4 + k] /= sum
    }
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(index, 4))
    geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(weight, 4))
  }
  const skinned = new THREE.SkinnedMesh(geo, mesh.material)
  skinned.name = mesh.name
  skinned.position.copy(mesh.position); skinned.quaternion.copy(mesh.quaternion); skinned.scale.copy(mesh.scale)
  mesh.parent.add(skinned)
  mesh.removeFromParent()
  skinned.updateMatrixWorld(true)
  skinned.bind(skeleton, skinned.matrixWorld)
}

/**
 * The pupils are flat black discs floating on the eye whites, skinned to the head bone. Each frame their vertices
 * slide (in bind space, so skinning still carries them with the head) across a height map of the whites' front
 * surface, which keeps them on the curved eye wherever they look.
 */
function buildEyes(root, head) {
  let whites, pupils
  root.traverse((o) => {
    if (o.material?.name === 'Material.009') whites = o
    if (o.material?.name === 'Material.006') pupils = o
  })
  pupils.geometry = pupils.geometry.clone() // edited every frame; the cached GLB keeps the original
  const rest = pupils.geometry.attributes.position.array.slice()
  const white = whites.geometry.attributes.position

  const sides = [-1, 1].map((sign) => {
    const on = (x) => Math.sign(x) === sign
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z0 = Infinity, z1 = -Infinity
    for (let i = 0; i < white.count; i++) {
      const x = white.getX(i), y = white.getY(i), z = white.getZ(i)
      if (!on(x)) continue
      x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); z0 = Math.min(z0, z); z1 = Math.max(z1, z)
    }
    const nx = Math.ceil((x1 - x0) / EYE_CELL) + 1, ny = Math.ceil((y1 - y0) / EYE_CELL) + 1
    const front = new Float32Array(nx * ny).fill(Infinity) // most forward (lowest) z per cell = the visible surface
    for (let i = 0; i < white.count; i++) {
      if (!on(white.getX(i))) continue
      const c = Math.round((white.getX(i) - x0) / EYE_CELL) + Math.round((white.getY(i) - y0) / EYE_CELL) * nx
      front[c] = Math.min(front[c], white.getZ(i))
    }
    const surface = (x, y) => {
      const cx = Math.round((x - x0) / EYE_CELL), cy = Math.round((y - y0) / EYE_CELL)
      let z = Infinity
      for (let j = cy - 1; j <= cy + 1; j++) for (let i = cx - 1; i <= cx + 1; i++) if (i >= 0 && i < nx && j >= 0 && j < ny) z = Math.min(z, front[i + j * nx])
      return z === Infinity ? z0 : z
    }

    const idx = []
    let px = 0, py = 0, radius = 0
    for (let i = 0; i < rest.length / 3; i++) if (on(rest[i * 3])) { idx.push(i); px += rest[i * 3]; py += rest[i * 3 + 1] }
    px /= idx.length; py /= idx.length
    for (const i of idx) radius = Math.max(radius, Math.hypot(rest[i * 3] - px, rest[i * 3 + 1] - py))
    return { idx, px, py, surface, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, cz: (z0 + z1) / 2, rx: ((x1 - x0) / 2 - radius) * 0.8, ry: ((y1 - y0) / 2 - radius) * 0.8 }
  })
  const headInverse = pupils.skeleton.boneInverses[pupils.skeleton.bones.indexOf(head)]
  return { mesh: pupils, rest, sides, head, headInverse }
}

/** Point the pupils at a world-space `target` (overwritten); `away` (0→1) rolls them up instead. */
function lookEyes(eyes, target, away) {
  const { mesh, rest, head } = eyes
  head.updateWorldMatrix(true, false)
  // world → the pupils' bind space (they are skinned 100% to the head bone)
  target.applyMatrix4(_m.multiplyMatrices(head.matrixWorld, eyes.headInverse).multiply(mesh.bindMatrix).invert())
  const pos = mesh.geometry.attributes.position
  for (const e of eyes.sides) {
    const dz = e.cz - target.z // the face looks down -z in bind space
    let ox = Math.atan2(target.x - e.cx, dz) / EYE_TURN, oy = Math.atan2(target.y - e.cy, dz) / EYE_TURN
    const len = Math.hypot(ox, oy)
    if (len > 1) { ox /= len; oy /= len }
    const x = e.cx + ox * (1 - away) * e.rx, y = e.cy + (oy * (1 - away) + away * 0.9) * e.ry
    for (const i of e.idx) {
      const vx = rest[i * 3] - e.px + x, vy = rest[i * 3 + 1] - e.py + y
      pos.setXYZ(i, vx, vy, e.surface(vx, vy) - 0.012)
    }
  }
  pos.needsUpdate = true
}

/** Clone the cached GLB and turn it into a rig we can pose every frame. */
function buildRig(scene) {
  const root = cloneRig(scene)
  const circle = find(root, 'Circle') // the GLB's portal disc, 20 units away in the file: it becomes the one he jumps out of
  circle.removeFromParent()
  root.rotation.y = FACING
  root.updateMatrixWorld(true)

  const bones = {}
  root.traverse((o) => { if (o.isBone) bones[o.name.replace(/_\d+$/, '')] = o }) // "upper_arm.L_27" loads as "upper_armL_27"

  const coatBones = Object.keys(COAT).map((k) => bones[k])
  const segments = Object.entries(COAT).map(([a, b]) => [bones[a].getWorldPosition(new THREE.Vector3()), bones[b].getWorldPosition(new THREE.Vector3())])
  const coatSkeleton = new THREE.Skeleton(coatBones)
  find(root, 'Cylinder001').children.slice().forEach((m) => skinToBones(m, coatSkeleton, segments))

  // own copies of the materials, clipped by a plane that sits on the portal's surface while he steps through it
  const clip = new THREE.Plane(new THREE.Vector3(0, 0, 1), 1000)
  root.traverse((o) => { if (o.material) { o.material = o.material.clone(); o.material.clippingPlanes = [clip] } })

  // the portal gun floats where the left hand is: parent it to that hand so it follows the arm
  const gun = find(root, 'Cube003')
  bones.handL.attach(gun)
  let tube
  gun.traverse((o) => {
    if (o.material?.name !== 'material_6') return // the glowing green canister
    o.material.emissive.set('#8dff4f')
    o.material.emissiveMap = o.material.map
    tube = o
  })
  const light = new THREE.PointLight('#8dff4f', 0, 3, 2)
  tube.add(light)

  const eyes = buildEyes(root, bones.spine005)

  root.traverse((o) => {
    if (o.isBone) o.userData.rest = o.quaternion.clone()
    if (o.isSkinnedMesh) o.frustumCulled = false // bounds come from the bind pose, not our procedural one
  })
  gun.userData.rest = gun.quaternion.clone()
  // shoulder → gun, in the upper arm's parent frame: the direction we rotate toward the cursor
  const arm = bones.upper_armL
  const restAim = arm.parent.worldToLocal(gun.getWorldPosition(new THREE.Vector3())).sub(arm.position).normalize()

  const box = new THREE.Box3().setFromObject(root)
  const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3())
  const scale = Math.min(HEIGHT / size.y, 4.4 / size.x)
  const hips = bones.spine.getWorldPosition(new THREE.Vector3())
  const shift = (hips.x - center.x) * scale

  // stand the portal disc up (it lies flat in the file), centred behind where he lands
  const portal = new THREE.Group(), disc = new THREE.Group()
  disc.rotation.x = Math.PI / 2
  const face = circle.children.find((m) => m.material.map)
  face.geometry.computeBoundingBox()
  const middle = face.geometry.boundingBox.getCenter(new THREE.Vector3()).negate()
  for (const m of circle.children.slice()) { m.position.copy(middle); disc.add(m) }
  portal.add(disc)
  portal.position.set(shift, 0.1, PORTAL_Z)
  portal.visible = false

  return {
    root, bones, gun, tube: tube.material, light, restAim, eyes, portal, clip,
    // pivot on the hips, but centre the whole silhouette (outstretched gun arm included) in the canvas
    fit: { scale, offset: [-hips.x * scale, FLOOR - box.min.y * scale, -center.z * scale], shift },
    hit: { size: [1.5, size.y * scale * 0.95, 1.4], y: FLOOR + (size.y * scale) / 2 },
    dispose() {
      root.traverse((o) => o.material?.dispose())
      coatSkeleton.dispose()
      eyes.mesh.geometry.dispose()
    },
  }
}

/** Rotate a bone by `d`, a world-space rotation, on top of its rest pose. */
function turn(bone, d) {
  bone.parent.getWorldQuaternion(_pq)
  bone.quaternion.copy(_pi.copy(_pq).invert()).multiply(d).multiply(_pq).multiply(bone.userData.rest)
}
/** Rotate a bone about one of its own axes, on top of its rest pose. */
const bend = (bone, axis, angle) => bone.quaternion.copy(bone.userData.rest).multiply(_q.setFromAxisAngle(axis, angle))

/** `stage.current.arrivedAt` is set to the clock time he is fully through the portal (Mascot's vortex waits for it). */
export default function Mouhib({ stage }) {
  const { scene } = useGLTF(modelUrl)
  const rig = useMemo(() => buildRig(scene), [scene])
  const body = useRef(), shot = useRef(), trail = useRef(), flash = useRef(), burst = useRef(), portalLight = useRef()
  const glowMap = useMemo(glowTexture, [])
  const burstPositions = useMemo(() => new Float32Array(BURST.length * 3), [])
  const { gl, clock } = useThree()
  // raw input (written by DOM events) and its smoothed version (written every frame)
  const input = useRef({ x: 0, y: 0, active: false, ui: false, over: false, drag: null, spin: 0, spinV: 0, hop: -99, fire: -99, twirl: -99 })
  const smooth = useRef({ x: 0, y: 0, ex: 0, ey: 0, aim: 0, away: 0, face: 0, glow: 0, t0: null, landed: false })

  useEffect(() => rig.dispose, [rig])
  useLayoutEffect(() => { gl.localClippingEnabled = true }, [gl]) // before the first frame, so he never shows behind the portal

  useEffect(() => {
    const el = gl.domElement, i = input.current
    const move = (e) => {
      const r = el.getBoundingClientRect()
      i.x = ((e.clientX - r.left) / r.width) * 2 - 1
      i.y = 1 - ((e.clientY - r.top) / r.height) * 2
      i.active = true
      i.ui = !!e.target.closest?.(INTERACTIVE)
      if (i.drag) {
        const dx = e.clientX - i.drag.x
        i.spin = i.drag.spin + dx * 0.012
        i.spinV = 0
      }
    }
    const leave = () => { i.active = false; i.ui = false }
    const press = (e) => { if (e.target.closest?.(INTERACTIVE)) i.fire = clock.elapsedTime }
    const grab = (e) => { if (e.button !== 0) return; i.drag = { x: e.clientX, spin: i.spin }; el.style.cursor = 'grabbing' }
    const drop = () => {
      if (!i.drag) return
      i.drag = null
      i.spin = THREE.MathUtils.euclideanModulo(i.spin + Math.PI, Math.PI * 2) - Math.PI // spring back the short way round
      el.style.cursor = ''
    }
    const root = document.documentElement
    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerdown', press)
    window.addEventListener('pointerup', drop)
    window.addEventListener('pointercancel', drop)
    root.addEventListener('pointerleave', leave)
    el.addEventListener('pointerdown', grab)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', press)
      window.removeEventListener('pointerup', drop)
      window.removeEventListener('pointercancel', drop)
      root.removeEventListener('pointerleave', leave)
      el.removeEventListener('pointerdown', grab)
    }
  }, [gl, clock])

  useFrame(({ camera }, delta) => {
    const t = clock.elapsedTime, dt = Math.min(delta, 1 / 20)
    const i = input.current, s = smooth.current, { bones, gun } = rig
    const ease = (rate) => 1 - Math.exp(-rate * dt)
    if (s.t0 === null) { // reduced motion: skip straight past the entrance
      const skip = matchMedia('(prefers-reduced-motion: reduce)').matches
      s.t0 = skip ? t - INTRO.end : t
      s.landed = skip
    }
    const password = document.activeElement?.type === 'password'

    // smooth the inputs; with no cursor around he glances about on his own
    s.x += ((i.active ? i.x : Math.sin(t * 0.37) * 0.4) - s.x) * ease(5)
    s.y += ((i.active ? i.y : 0.15 + Math.sin(t * 0.23) * 0.12) - s.y) * ease(5)
    s.ex += ((i.active ? i.x : s.x) - s.ex) * ease(14) // the eyes dart ahead of the head
    s.ey += ((i.active ? i.y : s.y) - s.ey) * ease(14)
    s.aim += ((password ? 0 : i.ui ? 1 : i.active ? 0.3 : 0) - s.aim) * ease(4)
    s.away += ((password ? 1 : 0) - s.away) * ease(4)
    s.face += ((i.over || i.drag ? 1 : 0) - s.face) * ease(4)
    if (!i.drag) { i.spinV += (-40 * i.spin - 7 * i.spinV) * dt; i.spin += i.spinV * dt }
    const lx = Math.tanh(s.x * 0.8), ly = Math.tanh(s.y * 0.8) // the cursor can be far outside the canvas
    const look = 1 - s.away

    // entrance: a portal-gun shot streaks in and splashes open a portal, he jumps out through it, it closes behind him
    const it = t - s.t0, at = rig.portal.position
    const flight = phase(it, 0, INTRO.impact)
    shot.current.visible = flight !== null
    if (flight !== null) shotAt(flight, at, shot.current.position)
    trail.current.children.forEach((dot, k) => {
      const p = flight === null ? -1 : flight - (k + 1) * 0.04
      dot.visible = p > 0
      if (p <= 0) return
      shotAt(p, at, dot.position)
      dot.scale.setScalar(0.6 * (1 - k / TRAIL))
      dot.material.opacity = 0.75 * (1 - k / TRAIL)
    })
    const splash = phase(it, INTRO.impact, 0.7)
    flash.current.visible = burst.current.visible = splash !== null
    if (splash !== null) {
      const spread = easeOut(splash)
      flash.current.position.copy(at).setZ(at.z + 0.4) // in front of the opaque portal disc
      flash.current.scale.setScalar(1 + spread * 4.5)
      flash.current.material.opacity = (1 - splash) ** 2
      const pos = burst.current.geometry.attributes.position
      BURST.forEach(([dx, dy, dz], k) => pos.setXYZ(k, at.x + dx * spread, at.y + dy * spread, at.z + 0.4 + dz * spread))
      pos.needsUpdate = true
      burst.current.material.opacity = 1 - splash
    }
    const opening = phase(it, INTRO.open, 0.6), closing = phase(it, INTRO.close, INTRO.end - INTRO.close)
    const open = it < INTRO.open || it >= INTRO.end ? 0 : opening !== null ? backOut(opening) : closing !== null ? 1 - closing * closing : 1
    rig.portal.visible = open > 0.001
    rig.portal.scale.set(open * PORTAL_SIZE * (1 + Math.sin(t * 7) * 0.025), open * PORTAL_SIZE * (1 + Math.cos(t * 6) * 0.025), open * PORTAL_SIZE)
    rig.portal.rotation.z = -t * 1.4 - (closing ?? 0) * 5
    portalLight.current.intensity = open * 4
    const jump = phase(it, INTRO.jump, INTRO.land - INTRO.jump)
    rig.clip.constant = it < INTRO.land ? -PORTAL_Z : 1000 // hide whatever of him is still behind the portal's surface
    if (it >= INTRO.land && !s.landed) { s.landed = true; i.fire = t } // lands and fires the gun
    if (it >= INTRO.land && stage.current.arrivedAt === null) stage.current.arrivedAt = s.t0 + INTRO.land

    // whole body: jump out, float, hop, lean toward the cursor
    const hop = phase(t, i.hop, 0.95), leap = jump === null ? 0 : Math.sin(jump * Math.PI)
    const b = body.current
    b.visible = it >= INTRO.jump
    b.position.y = Math.sin(t * 1.6) * 0.07 + (hop === null ? 0 : Math.sin(hop * Math.PI) * 0.6) + leap * 0.55
    b.position.z = jump !== null ? JUMP_FROM * (1 - easeOut(jump)) : it < INTRO.jump ? JUMP_FROM : 0
    b.rotation.set(-ly * 0.06 * look + leap * 0.3, lx * 0.2 * look - s.away * 0.9 + s.face * FRONT + i.spin + (hop === null ? 0 : easeInOut(hop) * Math.PI * 2), -lx * 0.05 * look)
    b.scale.setScalar(1 + s.face * 0.04)

    // breathing, then the head turn spread down the neck (parents before children).
    // His body runs 3/4 to the right, so the head rests turned toward the viewer and turns right less than left.
    bend(bones.spine002, X, Math.sin(t * 2.1) * 0.025)
    const yaw = (HEAD_FRONT + lx * (lx > 0 ? 0.55 : 0.7)) * look - s.away * 1.1, pitch = -ly * 0.5 * look - s.away * 0.4
    for (const [name, w] of LOOK) turn(bones[name], _q.setFromEuler(_e.set(pitch * w, yaw * w, 0, 'YXZ')))

    // eyes: focus on the cursor as if it hovered on a plane between him and the viewer
    _t.set(THREE.MathUtils.clamp(s.ex, -3, 3), THREE.MathUtils.clamp(s.ey, -3, 3), 0.5).unproject(camera).sub(camera.position)
    lookEyes(rig.eyes, _t.multiplyScalar((EYE_Z - camera.position.z) / _t.z).add(camera.position), s.away)

    // gun arm: swing the shoulder → gun direction toward the cursor, projected onto a plane in front of him
    const fire = phase(t, i.fire, 0.45)
    const kick = fire === null ? 0 : Math.sin(fire * Math.PI) * (1 - fire)
    _t.set(THREE.MathUtils.clamp(s.x, -2.5, 2.5), THREE.MathUtils.clamp(s.y, -2, 2) + kick * 1.5, 0.5).unproject(camera).sub(camera.position)
    _t.multiplyScalar((AIM_Z - camera.position.z) / _t.z).add(camera.position)
    const arm = bones.upper_armL
    arm.parent.updateWorldMatrix(true, false)
    arm.parent.worldToLocal(_t).sub(arm.position).normalize()
    const angle = rig.restAim.angleTo(_t)
    _q.setFromUnitVectors(rig.restAim, _t)
    arm.quaternion.copy(_pq.copy(ID).slerp(_q, s.aim * Math.min(1, MAX_AIM / Math.max(angle, 1e-3)))).multiply(arm.userData.rest)

    // mid-air "running": legs and free arm pump gently
    const run = Math.sin(t * 3.4)
    bend(bones.thighL, X, run * 0.12); bend(bones.thighR, X, -run * 0.12)
    bend(bones.shinL, X, Math.max(0, run) * 0.18); bend(bones.shinR, X, Math.max(0, -run) * 0.18)
    bend(bones.upper_armR, X, -run * 0.1)

    // gun: twirl when you hover him, glow with attention, flash when fired
    const twirl = phase(t, i.twirl, 0.75)
    gun.quaternion.copy(gun.userData.rest).multiply(_q.setFromAxisAngle(Z, twirl === null ? 0 : easeInOut(twirl) * Math.PI * 2))
    s.glow += (0.3 + s.aim * 0.9 + s.face * 0.5 - s.glow) * ease(6)
    const zap = kick * 3
    rig.tube.emissiveIntensity = s.glow + Math.sin(t * 5) * 0.08 + zap
    rig.light.intensity = s.glow * 0.8 + zap * 1.5
  })

  const { fit, hit } = rig
  const glowMaterial = (color) => <spriteMaterial map={glowMap} color={color} blending={THREE.AdditiveBlending} depthWrite={false} transparent />
  return (
    <>
      <primitive object={rig.portal} />
      <pointLight ref={portalLight} position={[fit.shift, 0.1, PORTAL_Z + 0.8]} color="#8dff4f" intensity={0} distance={6} decay={2} />
      <sprite ref={shot} scale={0.95} visible={false}>{glowMaterial('#d4ff9a')}</sprite>
      <group ref={trail}>
        {Array.from({ length: TRAIL }, (_, k) => <sprite key={k} visible={false}>{glowMaterial('#6dff3a')}</sprite>)}
      </group>
      <sprite ref={flash} visible={false}>{glowMaterial('#b4ff7a')}</sprite>
      <points ref={burst} visible={false} frustumCulled={false}>
        <bufferGeometry><bufferAttribute attach="attributes-position" args={[burstPositions, 3]} /></bufferGeometry>
        <pointsMaterial map={glowMap} color="#b4ff7a" size={0.3} sizeAttenuation blending={THREE.AdditiveBlending} depthWrite={false} transparent />
      </points>

      <group ref={body} position-x={fit.shift}>
        <group position={fit.offset} scale={fit.scale}><primitive object={rig.root} /></group>
        <mesh
          position={[0, hit.y, 0]}
          onPointerOver={(e) => { e.stopPropagation(); const i = input.current; i.over = true; if (clock.elapsedTime - i.twirl > 1) i.twirl = clock.elapsedTime }}
          onPointerOut={() => { input.current.over = false }}
          onClick={(e) => { e.stopPropagation(); if (e.delta < 5) input.current.hop = clock.elapsedTime }}
        >
          <boxGeometry args={hit.size} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </group>
    </>
  )
}

useGLTF.preload(modelUrl)
