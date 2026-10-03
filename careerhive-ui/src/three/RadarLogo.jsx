/**
 * RadarLogo — the radar in the CareerHive mark (components/Logo.jsx puts the "CR" text under it): src/assets/radar.glb,
 * a Dragon Ball radar. Its screen no longer shows dragon balls: it is repainted on a canvas with one glowing
 * certification seal in the centre, in the theme's colours (blue on Frost, red on Ember and Light), and repainted
 * when the theme changes.
 * It stays still (no cursor effects, no spin) apart from a slow float done in CSS (.radar-logo), so the scene
 * renders on demand: once when it loads and again on a theme change.
 * Model: "dragon ball radar" by Osmany.Areas on Sketchfab, CC-BY-4.0 (credit required).
 */
import { useGLTF } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import modelUrl from '../assets/radar.glb?url'
import { radarColors } from './colors'

const FIT = 4.6 // the model's largest side in scene units; the camera sees ~5.4 at its distance
const VIEW = [0.1, -0.3, 0] // a fixed, slight three-quarter view so it reads as an object, not a flat disc
const TAU = Math.PI * 2

/** Paint the screen in the layout of the model's own texture (its UVs map the disc to the right half), a seal in place of the balls. */
function paintScreen(canvas, theme) {
  const c = radarColors(theme)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.fillStyle = c.bg; ctx.fillRect(0, 0, 1024, 1024)
  const cx = 700, cy = 530 // centre of the disc
  ctx.setTransform(1, 0, 0, -1, 0, cy * 2) // the model shows its texture upside down: paint mirrored about the disc's centre line
  const lit = ctx.createRadialGradient(cx, cy, 0, cx, cy, 300)
  lit.addColorStop(0, c.glow); lit.addColorStop(1, c.bg)
  ctx.globalAlpha = 0.35; ctx.fillStyle = lit; ctx.fillRect(0, 0, 1024, 1024); ctx.globalAlpha = 1

  ctx.strokeStyle = c.grid; ctx.lineWidth = 3; ctx.beginPath()
  for (let k = 0; k < 12; k++) { const x = 510 + k * 34.6; ctx.moveTo(x, 318); ctx.lineTo(x, 742) }
  for (let k = 0; k < 12; k++) { const y = 339 + k * 34.7; ctx.moveTo(488, y); ctx.lineTo(913, y) }
  for (const y of [270, 304, 755, 789]) { ctx.moveTo(488, y); ctx.lineTo(913, y) }
  for (const x of [442, 476, 926, 960]) { ctx.moveTo(x, 318); ctx.lineTo(x, 742) }
  ctx.stroke()

  // the certification, centred: a scalloped seal with a star, glowing in the theme colour
  const sx = cx, sy = cy, R = 96
  ctx.save()
  ctx.shadowColor = c.glow; ctx.shadowBlur = 50
  ctx.beginPath()
  for (let i = 0; i <= 160; i++) {
    const a = (i / 160) * TAU, r = R * (1 + 0.075 * Math.cos(a * 16))
    if (i) ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); else ctx.moveTo(sx + r, sy)
  }
  const face = ctx.createRadialGradient(sx - R * 0.3, sy - R * 0.35, R * 0.1, sx, sy, R * 1.1)
  face.addColorStop(0, c.core); face.addColorStop(1, c.glow)
  ctx.fillStyle = face; ctx.fill(); ctx.fill() // twice: a stronger halo
  ctx.restore()
  ctx.strokeStyle = c.bg; ctx.globalAlpha = 0.5; ctx.lineWidth = 5
  ctx.beginPath(); ctx.arc(sx, sy, R * 0.74, 0, TAU); ctx.stroke()
  ctx.globalAlpha = 0.75; ctx.fillStyle = c.bg; ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5, r = i % 2 ? R * 0.2 : R * 0.46
    if (i) ctx.lineTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r); else ctx.moveTo(sx + Math.cos(a) * r, sy + Math.sin(a) * r)
  }
  ctx.closePath(); ctx.fill(); ctx.globalAlpha = 1
}

function Radar({ theme }) {
  const { scene } = useGLTF(modelUrl)
  const invalidate = useThree((s) => s.invalidate)
  const screen = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 1024
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false; tex.anisotropy = 4 // glTF UVs: no flip
    return { canvas, tex }
  }, [])

  const model = useMemo(() => {
    const root = scene.clone(true)
    const strap = []
    root.traverse((o) => {
      if (/^(tubo)?cuerda/.test(o.name)) strap.push(o) // the cord and its loop: a stray dark line at logo size
      if (o.isMesh && o.material.name === 'material') { // the screen: lit from within by our canvas
        o.material = new THREE.MeshStandardMaterial({ map: screen.tex, emissiveMap: screen.tex, emissive: '#ffffff', emissiveIntensity: 0.9, roughness: 0.2, metalness: 0 })
      }
    })
    strap.forEach((o) => o.removeFromParent())
    root.rotation.y = -Math.PI / 2 // the screen faces +x in the file; turn it to the camera
    const pivot = new THREE.Group(); pivot.add(root); pivot.rotation.set(...VIEW)
    pivot.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(pivot)
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3())
    pivot.position.copy(center).negate()
    const fit = new THREE.Group(); fit.add(pivot); fit.scale.setScalar(FIT / Math.max(size.x, size.y))
    return fit
  }, [scene, screen])

  useEffect(() => {
    paintScreen(screen.canvas, theme)
    screen.tex.needsUpdate = true
    invalidate()
  }, [theme, screen, invalidate])
  useEffect(() => () => screen.tex.dispose(), [screen])

  return <primitive object={model} />
}

export default function RadarLogo({ theme }) {
  return (
    <span className="radar-logo" aria-hidden="true">
      <Canvas frameloop="demand" flat dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 30 }} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}>
        <ambientLight intensity={1.3} />
        <directionalLight position={[3, 4, 6]} intensity={2.4} />
        <directionalLight position={[-4, -2, 3]} intensity={0.7} />
        <Suspense fallback={null}><Radar theme={theme} /></Suspense>
      </Canvas>
    </span>
  )
}
