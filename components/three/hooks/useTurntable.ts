'use client'

import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type RefObject } from 'react'
import { Quaternion, Vector3, type Group } from 'three'

/** Pixels of movement before a touch on a pan-y surface becomes a drag. */
const DRAG_THRESHOLD_PX = 8

const WORLD_UP = new Vector3(0, 1, 0)

export type TurntableAngles = {
  /** Spin around world up — same axis as idle auto-rotate. */
  yaw: number
  /** Tip toward / away from the camera around the viewport’s horizontal axis. */
  pitch: number
}

/**
 * Horizontal axis of the viewport through the look-at point (camera local +X).
 * Pitching around this axis brings the top/bottom toward the camera without
 * ever leaning the model onto its left or right side.
 */
export function viewportPitchAxis(
  cameraPosition: [number, number, number],
  lookAt: [number, number, number] = [0, 0, 0]
): Vector3 {
  const towardCamera = new Vector3(
    cameraPosition[0] - lookAt[0],
    cameraPosition[1] - lookAt[1],
    cameraPosition[2] - lookAt[2]
  ).normalize()
  return new Vector3().crossVectors(WORLD_UP, towardCamera).normalize()
}

function applyTurntableQuaternion(
  group: Group,
  angles: TurntableAngles,
  pitchAxis: Vector3,
  qYaw: Quaternion,
  qPitch: Quaternion
) {
  qYaw.setFromAxisAngle(WORLD_UP, angles.yaw)
  qPitch.setFromAxisAngle(pitchAxis, angles.pitch)
  // Yaw first (spin on upright axis), then pitch around fixed viewport axis.
  group.quaternion.copy(qPitch).multiply(qYaw)
}

/**
 * Drag: horizontal → yaw on world up; vertical → pitch toward/away from camera.
 * Orientation is rebuilt from angles so the model cannot roll onto its side.
 */
export function useTurntableDrag(
  groupRef: RefObject<Group | null>,
  anglesRef: RefObject<TurntableAngles>,
  pitchAxis: Vector3,
  sensitivity: number,
  eventTarget: HTMLElement | null,
  allowVerticalScroll = false,
  pitchMin = -Math.PI,
  pitchMax = Math.PI
) {
  const isDragging = useRef(false)
  const pendingPointerId = useRef<number | null>(null)
  const startPointer = useRef({ x: 0, y: 0 })
  const lastPointer = useRef({ x: 0, y: 0 })
  const qYaw = useMemo(() => new Quaternion(), [])
  const qPitch = useMemo(() => new Quaternion(), [])

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

    const apply = () => {
      if (!groupRef.current) return
      applyTurntableQuaternion(
        groupRef.current,
        anglesRef.current,
        pitchAxis,
        qYaw,
        qPitch
      )
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

      const angles = anglesRef.current
      angles.yaw += deltaX * sensitivity
      // Mouse down (positive deltaY): top tips toward the camera.
      angles.pitch = Math.min(
        pitchMax,
        Math.max(pitchMin, angles.pitch + deltaY * sensitivity)
      )
      apply()
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
  }, [
    allowVerticalScroll,
    anglesRef,
    eventTarget,
    groupRef,
    pitchAxis,
    pitchMax,
    pitchMin,
    qPitch,
    qYaw,
    sensitivity,
  ])

  return isDragging
}

/** Idle spin on the upright (yaw) axis only — must run inside the R3F canvas. */
export function useTurntableAutoRotate(
  groupRef: RefObject<Group | null>,
  anglesRef: RefObject<TurntableAngles>,
  pitchAxis: Vector3,
  speed: number,
  isPaused?: RefObject<boolean>
) {
  const qYaw = useMemo(() => new Quaternion(), [])
  const qPitch = useMemo(() => new Quaternion(), [])

  useFrame((_, delta) => {
    if (!groupRef.current || isPaused?.current) return

    anglesRef.current.yaw += delta * speed
    applyTurntableQuaternion(
      groupRef.current,
      anglesRef.current,
      pitchAxis,
      qYaw,
      qPitch
    )
  })
}
