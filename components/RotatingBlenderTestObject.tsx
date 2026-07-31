'use client'

import { Center, Clone, Edges, useGLTF } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Box3, Mesh, Vector3, type Group, type Object3D } from 'three'

// Served via next.config rewrite → S3 (avoids browser CORS on the bucket).
const MODEL_URL = '/s3/test-object.1.glb'

/** Max axis length in world units (cube is 3). Bump this to enlarge the model. */
const TARGET_SIZE = 4

/** Radians per second while idle — much slower than the cube. */
const AUTO_ROTATE_SPEED = 0.25

/** How far the model turns per pixel dragged. */
const DRAG_SENSITIVITY = 0.008

function BlenderObject() {
  const groupRef = useRef<Group>(null)
  const isDragging = useRef(false)
  const lastPointer = useRef({ x: 0, y: 0 })
  const { gl } = useThree()
  const { scene } = useGLTF(MODEL_URL)

  // Scale via a React group prop — mutating scene.scale does not re-render Clone.
  const scale = useMemo(() => {
    scene.scale.setScalar(1)
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const maxDim = Math.max(size.x, size.y, size.z) || 1
    return TARGET_SIZE / maxDim
  }, [scene])

  useEffect(() => {
    const el = gl.domElement

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return
      isDragging.current = true
      lastPointer.current = { x: event.clientX, y: event.clientY }
      el.setPointerCapture(event.pointerId)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!isDragging.current || !groupRef.current) return
      const dx = event.clientX - lastPointer.current.x
      const dy = event.clientY - lastPointer.current.y
      lastPointer.current = { x: event.clientX, y: event.clientY }
      groupRef.current.rotation.y += dx * DRAG_SENSITIVITY
      groupRef.current.rotation.x += dy * DRAG_SENSITIVITY
    }

    const onPointerUp = (event: PointerEvent) => {
      isDragging.current = false
      if (el.hasPointerCapture(event.pointerId)) {
        el.releasePointerCapture(event.pointerId)
      }
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)

    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [gl])

  useFrame((_, delta) => {
    if (!groupRef.current || isDragging.current) return
    groupRef.current.rotation.y += delta * AUTO_ROTATE_SPEED
  })

  return (
    <group ref={groupRef}>
      <Center>
        <group scale={scale}>
          <Clone
            object={scene}
            inject={(object: Object3D) =>
              object instanceof Mesh ? (
                <Edges color="#000000" threshold={15} />
              ) : null
            }
          />
        </group>
      </Center>
    </group>
  )
}

export default function RotatingBlenderTestObject() {
  return (
    <div className="aspect-square w-[clamp(12rem,40vw,28rem)] cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [8, 7, 10], fov: 28 }}
        style={{ touchAction: 'none' }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 4, 4]} intensity={1} />
        <Suspense fallback={null}>
          <BlenderObject />
        </Suspense>
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODEL_URL)
