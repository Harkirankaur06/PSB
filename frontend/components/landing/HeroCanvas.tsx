"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import { Stars } from "@react-three/drei"
import { useRef } from "react"
import * as THREE from "three"

function Core() {
  const ref = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    ref.current.rotation.x = t * 0.3
    ref.current.rotation.y = t * 0.4
  })

  return (
    <mesh ref={ref}>
      <icosahedronGeometry args={[1.2, 2]} />
      <meshStandardMaterial
        color="#7c3aed"
        emissive="#7c3aed"
        emissiveIntensity={0.8}
        wireframe
      />
    </mesh>
  )
}

export default function HeroCanvas() {
  return (
    <Canvas camera={{ position: [0, 0, 4] }}>
      <ambientLight intensity={0.6} />
      <pointLight position={[10,10,10]} />

      <Stars
        radius={80}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
      />

      <Core />
    </Canvas>
  )
}