'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, type ReactNode } from 'react'

type ShadowType = 'basic' | 'percentage' | 'variance'

type SceneCanvasProps = {
  children: ReactNode
  className?: string
  cameraPosition: [number, number, number]
  cameraFov: number
  ambientLightIntensity: number
  directionalLightPosition: [number, number, number]
  directionalLightIntensity: number
  shadows: boolean
  shadowType: ShadowType
  shadowMapSize: number
  shadowRadius: number
  shadowBlurSamples: number
  shadowIntensity: number
  shadowBias: number
  shadowNormalBias: number
  shadowCameraSize: number
  shadowCameraNear: number
  shadowCameraFar: number
}

export default function SceneCanvas({
  children,
  className,
  cameraPosition,
  cameraFov,
  ambientLightIntensity,
  directionalLightPosition,
  directionalLightIntensity,
  shadows,
  shadowType,
  shadowMapSize,
  shadowRadius,
  shadowBlurSamples,
  shadowIntensity,
  shadowBias,
  shadowNormalBias,
  shadowCameraSize,
  shadowCameraNear,
  shadowCameraFar,
}: SceneCanvasProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: cameraPosition, fov: cameraFov }}
        shadows={shadows ? shadowType : false}
        style={{ touchAction: 'none' }}
      >
        <ambientLight intensity={ambientLightIntensity} />
        <directionalLight
          castShadow={shadows}
          position={directionalLightPosition}
          intensity={directionalLightIntensity}
          shadow-mapSize={[shadowMapSize, shadowMapSize]}
          shadow-radius={shadowRadius}
          shadow-blurSamples={shadowBlurSamples}
          shadow-intensity={shadowIntensity}
          shadow-bias={shadowBias}
          shadow-normalBias={shadowNormalBias}
        >
          <orthographicCamera
            attach="shadow-camera"
            args={[
              -shadowCameraSize,
              shadowCameraSize,
              shadowCameraSize,
              -shadowCameraSize,
              shadowCameraNear,
              shadowCameraFar,
            ]}
          />
        </directionalLight>
        <Suspense fallback={null}>{children}</Suspense>
      </Canvas>
    </div>
  )
}
