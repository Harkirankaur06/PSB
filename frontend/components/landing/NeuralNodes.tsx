"use client"

import { useFrame } from "@react-three/fiber"
import { useRef } from "react"
import * as THREE from "three"

export default function NeuralNodes() {
  const group = useRef<THREE.Group>(null!)

  useFrame((state) => {
    group.current.rotation.y += 0.001
  })

  const nodes = new Array(40).fill(0)

  return (
    <group ref={group}>
      {nodes.map((_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 10,
          ]}
        >
          <sphereGeometry args={[0.05,16,16]} />
          <meshBasicMaterial color="#8b5cf6" />
        </mesh>
      ))}
    </group>
  )
}