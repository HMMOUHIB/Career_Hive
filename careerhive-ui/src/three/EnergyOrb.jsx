import { Float, MeshDistortMaterial, Sparkles } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

function OrbitRing({ radius, speed, tilt, color, opacity = 0.5 }) {
  const ref = useRef()
  useFrame((_, d) => { ref.current.rotation.z += d * speed })
  return (
    <mesh ref={ref} rotation={[tilt, 0.3, 0]}>
      <torusGeometry args={[radius, 0.012, 16, 160]} />
      <meshBasicMaterial color={color} transparent opacity={opacity} />
    </mesh>
  )
}

function Shards({ count = 40, color }) {
  const ref = useRef()
  const seeds = useMemo(() => Array.from({ length: count }, () => ({
    r: 1.9 + Math.random() * 1.1, a: Math.random() * Math.PI * 2, y: (Math.random() - 0.5) * 1.6, s: 0.03 + Math.random() * 0.06, v: 0.15 + Math.random() * 0.35,
  })), [count])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    seeds.forEach((p, i) => {
      const a = p.a + t * p.v
      dummy.position.set(Math.cos(a) * p.r, p.y + Math.sin(t + i) * 0.12, Math.sin(a) * p.r * 0.6)
      dummy.rotation.set(t * p.v, t, 0)
      dummy.scale.setScalar(p.s)
      dummy.updateMatrix()
      ref.current.setMatrixAt(i, dummy.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[null, null, count]}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} roughness={0.3} />
    </instancedMesh>
  )
}

function Core({ a, b }) {
  const mesh = useRef()
  const shell = useRef()
  useFrame((state, d) => {
    mesh.current.rotation.y += d * 0.25
    shell.current.rotation.y -= d * 0.15
    shell.current.rotation.x += d * 0.08
    // follow the mouse slightly
    const p = state.pointer
    mesh.current.position.x = THREE.MathUtils.lerp(mesh.current.position.x, p.x * 0.25, 0.05)
    mesh.current.position.y = THREE.MathUtils.lerp(mesh.current.position.y, p.y * 0.2, 0.05)
  })
  return (
    <group>
      <mesh ref={mesh}>
        <icosahedronGeometry args={[1.15, 32]} />
        <MeshDistortMaterial color={a} emissive={b} emissiveIntensity={0.35} roughness={0.15} metalness={0.4} distort={0.42} speed={2.2} />
      </mesh>
      <mesh ref={shell} scale={1.55}>
        <icosahedronGeometry args={[1, 1]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.12} />
      </mesh>
    </group>
  )
}

export default function EnergyOrb({ a = '#ff5a4e', b = '#7b2cff' }) {
  return (
    <Canvas dpr={[1, 1.8]} camera={{ position: [0, 0, 5.2], fov: 42 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.5} />
      <pointLight position={[4, 3, 4]} intensity={60} color="#ffffff" />
      <pointLight position={[-4, -2, 2]} intensity={40} color={b} />
      <Float speed={1.6} rotationIntensity={0.4} floatIntensity={0.8}>
        <Core a={a} b={b} />
        <OrbitRing radius={2.1} speed={0.4} tilt={1.2} color="#ffffff" opacity={0.35} />
        <OrbitRing radius={2.5} speed={-0.25} tilt={1.4} color={b} opacity={0.45} />
      </Float>
      <Shards color="#ffffff" />
      <Sparkles count={60} scale={[6, 4, 3]} size={2.2} speed={0.4} color="#fff" opacity={0.7} />
    </Canvas>
  )
}
