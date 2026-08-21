'use client'

import { Canvas } from '@react-three/fiber'
import { DepthOfField, EffectComposer } from '@react-three/postprocessing'
import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'

type ShadowType = 'basic' | 'percentage' | 'variance'

/** Cap fill rate on high-DPI phones (e.g. ~3x) without softening desktop. */
const CANVAS_DPR: [number, number] = [1, 2]

type SceneCanvasProps = {
  children: ReactNode
  className?: string
  style?: CSSProperties
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
  /** When true, applies depth-of-field postprocessing. */
  depthOfField?: boolean
  /** World-unit distance from the camera to the sharp focus plane. */
  depthOfFieldFocusDistance?: number
  /** World-unit thickness of the sharp band around the focus plane. */
  depthOfFieldFocusRange?: number
  /** Out-of-focus bokeh strength. */
  depthOfFieldBokehScale?: number
  /** Request a stencil buffer. Three omits one by default; stencil-masked portals need it. */
  stencil?: boolean
}

export default function SceneCanvas({
  children,
  className,
  style,
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
  depthOfField = false,
  depthOfFieldFocusDistance = 13,
  depthOfFieldFocusRange = 3,
  depthOfFieldBokehScale = 5,
  stencil = false,
}: SceneCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null)
  // Assume visible until the observer reports otherwise so the first paint
  // still runs when the canvas is in the initial viewport.
  const [isInView, setIsInView] = useState(true)

  useEffect(() => {
    const node = wrapperRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting)
      },
      // Tiny threshold: pause as soon as the canvas fully leaves the viewport.
      { threshold: 0 }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={wrapperRef} className={className} style={style}>
      <Canvas
        camera={{ position: cameraPosition, fov: cameraFov }}
        shadows={shadows ? shadowType : false}
        gl={{ stencil }}
        dpr={CANVAS_DPR}
        // Stop the WebGL loop while scrolled offscreen so page scrolling
        // (especially on high-refresh phones) isn't fighting a continuous
        // shadow + portal render.
        frameloop={isInView ? 'always' : 'never'}
        // Let page scroll pass through; orbit is handled by a DOM overlay instead.
        style={{ pointerEvents: 'none' }}
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
        {depthOfField && depthOfFieldBokehScale > 0 ? (
          <EffectComposer multisampling={0}>
            <DepthOfField
              focusDistance={depthOfFieldFocusDistance}
              focusRange={depthOfFieldFocusRange}
              bokehScale={depthOfFieldBokehScale}
            />
          </EffectComposer>
        ) : null}
      </Canvas>
    </div>
  )
}
