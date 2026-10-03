/**
 * HamzaouiMark — the CareerHive logo: src/assets/hamzaoui.glb (the Rick & Morty emblem that is also the employee
 * mascot), tinted with the theme's accent, or white on a coloured panel. By default it is still (the slow float is
 * CSS on .logo-mark) and renders on demand: once when it loads and again on a theme change. With `spin` it turns like
 * a coin, for the loading screen.
 * Model: "Rick and Morty" by Ian Dowson on Sketchfab, CC-BY-4.0 (credit required).
 */
import { useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo } from 'react'
import * as THREE from 'three'
import modelUrl from '../assets/hamzaoui.glb?url'

const FIT = 4.4 // the emblem's diameter in scene units; the camera sees ~5.4 at its distance
const TINT = { frost: '#2f7bf6', ember: '#ff6a55', light: '#d63a3a' }
const TURN = 1.6 // seconds per coin turn on the loading screen: 0.95 s turning, then a short rest
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2)

function Emblem({ theme, tone, spin, onReady }) {
  const { scene } = useGLTF(modelUrl)
  const invalidate = useThree((s) => s.invalidate)
  const { fit, material } = useMemo(() => {
    const root = scene.clone(true)
    const material = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 }) // own copy: tinted per theme
    root.traverse((o) => { if (o.isMesh) o.material = material })
    const box = new THREE.Box3().setFromObject(root)
    const size = box.getSize(new THREE.Vector3()), center = box.getCenter(new THREE.Vector3())
    root.position.copy(center).negate()
    const fit = new THREE.Group(); fit.add(root); fit.scale.setScalar(FIT / Math.max(size.x, size.y))
    return { fit, material }
  }, [scene])
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => { onReady?.() }, [onReady]) // the model has loaded and is on screen

  useEffect(() => {
    const color = tone === 'white' ? '#ffffff' : TINT[theme] ?? TINT.frost
    material.color.set(color); material.emissive.set(color)
    material.emissiveIntensity = tone === 'white' ? 0.2 : 0.3
    invalidate()
  }, [theme, tone, material, invalidate])

  useFrame(({ clock }) => {
    if (spin) fit.rotation.y = easeInOut(Math.min(1, (clock.elapsedTime % TURN) / 0.95)) * Math.PI * 2
  })

  return <primitive object={fit} />
}

export default function HamzaouiMark({ theme, tone = 'accent', spin = false, className = 'logo-mark', onReady }) {
  return (
    <span className={className} aria-hidden="true">
      <Canvas frameloop={spin ? 'always' : 'demand'} flat dpr={[1, 2]} camera={{ position: [0, 0, 10], fov: 30 }} gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}>
        <ambientLight intensity={1.2} />
        <directionalLight position={[3, 4, 6]} intensity={2} />
        <Suspense fallback={null}><Emblem theme={theme} tone={tone} spin={spin} onReady={onReady} /></Suspense>
      </Canvas>
    </span>
  )
}
