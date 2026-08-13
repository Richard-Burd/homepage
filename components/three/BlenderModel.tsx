'use client'

import { Center, Clone, Edges, useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import {
  AnimationMixer,
  Box3,
  LoopOnce,
  Mesh,
  Vector3,
  type Object3D,
} from 'three'

type BlenderModelProps = {
  url: string
  targetSize: number
  showEdges?: boolean
  edgeColor?: string
  edgeThreshold?: number
  edgeWidth?: number
  castShadow?: boolean
  receiveShadow?: boolean
  /** Play every GLB clip once from the start pose, then hold the end pose. */
  playOnce?: boolean
  onPlaybackFinished?: () => void
}

function useModelScale(scene: Object3D, targetSize: number) {
  return useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z) || 1

    return targetSize / maxDimension
  }, [scene, targetSize])
}

function StaticModel({
  url,
  targetSize,
  showEdges = false,
  edgeColor = '#000000',
  edgeThreshold = 15,
  edgeWidth = 1,
  castShadow = false,
  receiveShadow = false,
}: BlenderModelProps) {
  const { scene } = useGLTF(url)
  const scale = useModelScale(scene, targetSize)

  return (
    <Center>
      <group scale={scale}>
        <Clone
          object={scene}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          inject={
            showEdges
              ? (object: Object3D) =>
                  object instanceof Mesh ? (
                    <Edges
                      color={edgeColor}
                      threshold={edgeThreshold}
                      lineWidth={edgeWidth}
                    />
                  ) : null
              : undefined
          }
        />
      </group>
    </Center>
  )
}

function AnimatedModel({
  url,
  targetSize,
  castShadow = false,
  receiveShadow = false,
  onPlaybackFinished,
}: BlenderModelProps) {
  const { scene, animations } = useGLTF(url)
  const scale = useModelScale(scene, targetSize)
  const finishedRef = useRef(false)
  const playingRef = useRef(false)
  const onFinishedRef = useRef(onPlaybackFinished)

  useLayoutEffect(() => {
    onFinishedRef.current = onPlaybackFinished
  }, [onPlaybackFinished])

  const cloned = useMemo(() => {
    const copy = scene.clone(true)
    copy.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = castShadow
        object.receiveShadow = receiveShadow
      }
    })
    return copy
  }, [scene, castShadow, receiveShadow])

  const mixer = useMemo(() => new AnimationMixer(cloned), [cloned])
  const duration = useMemo(
    () => animations.reduce((longest, clip) => Math.max(longest, clip.duration), 0),
    [animations]
  )

  useLayoutEffect(() => {
    finishedRef.current = false
    mixer.stopAllAction()
    mixer.setTime(0)

    for (const clip of animations) {
      const action = mixer.clipAction(clip)
      action.reset()
      action.setLoop(LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
    }

    playingRef.current = true

    return () => {
      playingRef.current = false
      mixer.stopAllAction()
    }
  }, [animations, mixer])

  useFrame((_, delta) => {
    if (!playingRef.current) return
    mixer.update(delta)
    if (finishedRef.current) return
    if (animations.length === 0 || mixer.time >= duration) {
      finishedRef.current = true
      onFinishedRef.current?.()
    }
  })

  return (
    <Center>
      <group scale={scale}>
        <primitive object={cloned} dispose={null} />
      </group>
    </Center>
  )
}

export default function BlenderModel(props: BlenderModelProps) {
  return props.playOnce ? <AnimatedModel {...props} /> : <StaticModel {...props} />
}
