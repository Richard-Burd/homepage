'use client'

import { useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import type { Group } from 'three'

export type DragHitBox = {
  /** Left edge as a fraction of canvas width (0–1). */
  x: number
  /** Top edge as a fraction of canvas height (0–1). */
  y: number
  /** Width as a fraction of canvas width (0–1). */
  width: number
  /** Height as a fraction of canvas height (0–1). */
  height: number
}

export function useDragOrbit(
  groupRef: RefObject<Group | null>,
  sensitivity: number,
  hitBox: DragHitBox | null = null
) {
  const isDragging = useRef(false)
  const isScrolling = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const gl = useThree((state) => state.gl)

  useEffect(() => {
    const element = gl.domElement

    const isInsideHitBox = (clientX: number, clientY: number) => {
      if (!hitBox) return true

      const rect = element.getBoundingClientRect()
      if (rect.width <= 0 || rect.height <= 0) return false

      const u = (clientX - rect.left) / rect.width
      const v = (clientY - rect.top) / rect.height

      return (
        u >= hitBox.x &&
        u <= hitBox.x + hitBox.width &&
        v >= hitBox.y &&
        v <= hitBox.y + hitBox.height
      )
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return

      lastPointer.current = { x: event.clientX, y: event.clientY }

      if (isInsideHitBox(event.clientX, event.clientY)) {
        event.preventDefault()
        isDragging.current = true
        isScrolling.current = false
        element.setPointerCapture(event.pointerId)
        return
      }

      // Outside the hit box: scroll the page instead of rotating the model.
      if (hitBox) {
        event.preventDefault()
        isScrolling.current = true
        isDragging.current = false
        element.setPointerCapture(event.pointerId)
      }
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (isDragging.current && groupRef.current) {
        event.preventDefault()
        const deltaX = event.clientX - lastPointer.current.x
        const deltaY = event.clientY - lastPointer.current.y

        lastPointer.current = { x: event.clientX, y: event.clientY }
        groupRef.current.rotation.y += deltaX * sensitivity
        groupRef.current.rotation.x += deltaY * sensitivity
        return
      }

      if (isScrolling.current) {
        event.preventDefault()
        const deltaY = event.clientY - lastPointer.current.y
        lastPointer.current = { x: event.clientX, y: event.clientY }
        window.scrollBy(0, -deltaY)
      }
    }

    const handlePointerUp = (event: PointerEvent) => {
      isDragging.current = false
      isScrolling.current = false

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
  }, [gl, groupRef, hitBox, sensitivity])

  return isDragging
}
