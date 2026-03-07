"use client"

import { Line } from "@react-three/drei"
import { useMemo } from "react"

export default function SignalLines() {

  const points = useMemo(() => [
    [-2,0,0],
    [0,1,0],
    [2,0,0]
  ],[])

  return (
    <Line
      points={points}
      color="#a855f7"
      lineWidth={2}
    />
  )
}