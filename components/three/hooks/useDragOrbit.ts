'use client'

import { useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import type { Group } from 'three'

export function useDragOrbit(
  groupRef: RefObject<Group | null>,
  sensitivity: number
) {
  const isDragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const { gl } = useThree()

  useEffect(() => {
    const element = gl.domElement

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return

      isDragging.current = true
      lastPointer.current = { x: event.clientX, y: event.clientY }
      element.setPointerCapture(event.pointerId)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (!isDragging.current || !groupRef.current) return

      const deltaX = event.clientX - lastPointer.current.x
      const deltaY = event.clientY - lastPointer.current.y

      lastPointer.current = { x: event.clientX, y: event.clientY }
      groupRef.current.rotation.y += deltaX * sensitivity
      groupRef.current.rotation.x += deltaY * sensitivity
    }

    const handlePointerUp = (event: PointerEvent) => {
      isDragging.current = false

      if (element.hasPointerCapture(event.pointerId)) {
        element.releasePointerCapture(event.pointerId)
      }
    }

    element.addEventListener('pointerdown', handlePointerDown)
    element.addEventListener('pointermove', handlePointerMove)
    element.addEventListener('pointerup', handlePointerUp)
    element.addEventListener('pointercancel', handlePointerUp)

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown)
      element.removeEventListener('pointermove', handlePointerMove)
      element.removeEventListener('pointerup', handlePointerUp)
      element.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [gl, groupRef, sensitivity])

  return isDragging
}
