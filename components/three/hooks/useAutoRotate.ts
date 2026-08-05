'use client'

import { useFrame } from '@react-three/fiber'
import type { RefObject } from 'react'
import type { Group } from 'three'

export function useAutoRotate(
  groupRef: RefObject<Group | null>,
  speed: number,
  isPaused?: RefObject<boolean>
) {
  useFrame((_, delta) => {
    if (!groupRef.current || isPaused?.current) return

    groupRef.current.rotation.y += delta * speed
  })
}
