'use client'

import { useEffect, useRef, type RefObject } from 'react'
import type { Group } from 'three'

/** Pixels of movement before a touch on a pan-y surface becomes an orbit drag. */
const DRAG_THRESHOLD_PX = 8

/**
 * Attach orbit dragging to an HTML element (typically a hit-box overlay).
 * Keep this off the WebGL canvas so the canvas never blocks page scroll.
 */
export function useDragOrbit(
  groupRef: RefObject<Group | null>,
  sensitivity: number,
  eventTarget: HTMLElement | null,
  /**
   * When true, vertical-dominant touches are left alone so the page can scroll
   * (`touch-action: pan-y` on the target). When false, any drag orbits immediately
   * (`touch-action: none` on a small hit-box overlay).
   */
  allowVerticalScroll = false
) {
  const isDragging = useRef(false)
  const pendingPointerId = useRef<number | null>(null)
  const startPointer = useRef({ x: 0, y: 0 })
  const lastPointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!eventTarget) return

    const element = eventTarget

    const releaseCapture = (pointerId: number) => {
      try {
        if (element.hasPointerCapture(pointerId)) {
          element.releasePointerCapture(pointerId)
        }
      } catch {
        // Browser already released capture for this pointer.
      }
    }

    const beginDrag = (event: PointerEvent) => {
      isDragging.current = true
      pendingPointerId.current = null
      lastPointer.current = { x: event.clientX, y: event.clientY }
      element.setPointerCapture(event.pointerId)
      event.preventDefault()
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return

      startPointer.current = { x: event.clientX, y: event.clientY }
      lastPointer.current = { x: event.clientX, y: event.clientY }

      if (allowVerticalScroll && event.pointerType === 'touch') {
        pendingPointerId.current = event.pointerId
        return
      }

      beginDrag(event)
    }

    const handlePointerMove = (event: PointerEvent) => {
      if (pendingPointerId.current === event.pointerId && !isDragging.current) {
        const dx = event.clientX - startPointer.current.x
        const dy = event.clientY - startPointer.current.y
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return

        if (Math.abs(dy) > Math.abs(dx)) {
          pendingPointerId.current = null
          return
        }

        beginDrag(event)
      }

      if (!isDragging.current || !groupRef.current) return

      event.preventDefault()
      const deltaX = event.clientX - lastPointer.current.x
      const deltaY = event.clientY - lastPointer.current.y

      lastPointer.current = { x: event.clientX, y: event.clientY }
      groupRef.current.rotation.y += deltaX * sensitivity
      groupRef.current.rotation.x += deltaY * sensitivity
    }

    const handlePointerUp = (event: PointerEvent) => {
      isDragging.current = false
      pendingPointerId.current = null
      releaseCapture(event.pointerId)
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
  }, [allowVerticalScroll, eventTarget, groupRef, sensitivity])

  return isDragging
}
