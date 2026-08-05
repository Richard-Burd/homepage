'use client'

import { Center, Clone, Edges, useGLTF } from '@react-three/drei'
import { useMemo } from 'react'
import { Box3, Mesh, Vector3, type Object3D } from 'three'

type BlenderModelProps = {
  url: string
  targetSize: number
  showEdges?: boolean
  edgeColor?: string
  edgeThreshold?: number
  edgeWidth?: number
  castShadow?: boolean
  receiveShadow?: boolean
}

export default function BlenderModel({
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

  const scale = useMemo(() => {
    const box = new Box3().setFromObject(scene)
    const size = box.getSize(new Vector3())
    const maxDimension = Math.max(size.x, size.y, size.z) || 1

    return targetSize / maxDimension
  }, [scene, targetSize])

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
