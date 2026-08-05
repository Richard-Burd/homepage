'use client'

import { useGLTF } from '@react-three/drei'
import { useRef } from 'react'
import type { Group } from 'three'

import BlenderModel from '@/components/three/BlenderModel'
import SceneCanvas from '@/components/three/SceneCanvas'
import { useAutoRotate } from '@/components/three/hooks/useAutoRotate'
import { useDragOrbit } from '@/components/three/hooks/useDragOrbit'
import { proxiedAssetUrl } from '@/lib/assets'

// Served via next.config rewrite → assets host (avoids browser CORS on the bucket).
const MODEL_URL = proxiedAssetUrl('test-object.1.glb')

/** Max axis length in world units (cube is 3). Bump this to enlarge the model. */
const TARGET_SIZE = 4

/** Radians per second while idle — much slower than the cube. */
const AUTO_ROTATE_SPEED = 0.25

/** How far the model turns per pixel dragged. */
const DRAG_SENSITIVITY = 0.008

/** Camera location in world space [x, y, z]. Higher/farther values pull the view back. */
const CAMERA_POSITION: [number, number, number] = [8, 7, 10]

/** Vertical field of view in degrees — lower = more telephoto / zoomed-in. */
const CAMERA_FOV = 28

/** Soft fill light from every direction. Higher values lift shadows and flatten contrast. */
const AMBIENT_LIGHT_INTENSITY = 0.4

/**
 * Directional light location [x, y, z]. The light aims at the origin, so this
 * vector sets the sun angle (y = height, x/z = side/front).
 */
const DIRECTIONAL_LIGHT_POSITION: [number, number, number] = [4, 10, 4]

/** Brightness of the directional “sun” light that casts shadows. */
const DIRECTIONAL_LIGHT_INTENSITY = 1

/** Draw black outline edges on mesh faces (drei Edges helper). */
const SHOW_EDGES = true

/** Color of those outline edges. */
const EDGE_COLOR = '#000000'

/** Minimum angle (degrees) between faces before an edge is drawn. Lower = more lines. */
const EDGE_THRESHOLD = 15

/** Outline thickness in screen pixels — stays constant no matter how close the camera is. */
const EDGE_WIDTH = 1

/** Master switch for WebGL shadow maps on this canvas. */
const SHADOWS_ENABLED = true

/**
 * Shadow filter algorithm: 'basic' (hard), 'percentage' (PCF soft), or
 * 'variance' (VSM — softer, may light-bleed through thin geometry).
 */
const SHADOW_TYPE = 'percentage'

/** Whether this model’s meshes cast shadows onto other surfaces (and themselves). */
const CAST_SHADOW = true

/** Whether this model’s meshes receive shadows from lights / other casters. */
const RECEIVE_SHADOW = true

/** Shadow map resolution in pixels. Higher = sharper shadows, more GPU cost. */
const SHADOW_MAP_SIZE = 2048

/** Edge blur in shadow-map texels: 1 is razor sharp, 8–16 reads as overcast. */
const SHADOW_RADIUS = 2

/** Blur sample count — only used when SHADOW_TYPE is 'variance'. */
const SHADOW_BLUR_SAMPLES = 16

/** How dark the shadow gets, 0 (invisible) to 1 (full strength). */
const SHADOW_INTENSITY = 0.8

/** Depth offset to reduce shadow acne (self-shadow speckles). Tiny values only. */
const SHADOW_BIAS = -0.0001

/** Offset along surface normals — also fights acne on shallow-angle lighting. */
const SHADOW_NORMAL_BIAS = 0.02

/**
 * Half-width of the orthographic shadow camera frustum. Fit this roughly to
 * the model size so the shadow map isn’t wasted on empty space.
 */
const SHADOW_CAMERA_SIZE = 6

/** Near clip of the shadow camera — geometry closer than this won’t cast. */
const SHADOW_CAMERA_NEAR = 0.1

/** Far clip of the shadow camera — geometry farther than this won’t cast. */
const SHADOW_CAMERA_FAR = 50

function RotatingObject() {
  const groupRef = useRef<Group>(null)
  const isDragging = useDragOrbit(groupRef, DRAG_SENSITIVITY)

  useAutoRotate(groupRef, AUTO_ROTATE_SPEED, isDragging)

  return (
    <group ref={groupRef}>
      <BlenderModel
        url={MODEL_URL}
        targetSize={TARGET_SIZE}
        showEdges={SHOW_EDGES}
        edgeColor={EDGE_COLOR}
        edgeThreshold={EDGE_THRESHOLD}
        edgeWidth={EDGE_WIDTH}
        castShadow={CAST_SHADOW}
        receiveShadow={RECEIVE_SHADOW}
      />
    </group>
  )
}

export default function RotatingBlenderTestObject() {
  return (
    <SceneCanvas
      className="aspect-square w-[clamp(12rem,40vw,28rem)] cursor-grab active:cursor-grabbing"
      cameraPosition={CAMERA_POSITION}
      cameraFov={CAMERA_FOV}
      ambientLightIntensity={AMBIENT_LIGHT_INTENSITY}
      directionalLightPosition={DIRECTIONAL_LIGHT_POSITION}
      directionalLightIntensity={DIRECTIONAL_LIGHT_INTENSITY}
      shadows={SHADOWS_ENABLED}
      shadowType={SHADOW_TYPE}
      shadowMapSize={SHADOW_MAP_SIZE}
      shadowRadius={SHADOW_RADIUS}
      shadowBlurSamples={SHADOW_BLUR_SAMPLES}
      shadowIntensity={SHADOW_INTENSITY}
      shadowBias={SHADOW_BIAS}
      shadowNormalBias={SHADOW_NORMAL_BIAS}
      shadowCameraSize={SHADOW_CAMERA_SIZE}
      shadowCameraNear={SHADOW_CAMERA_NEAR}
      shadowCameraFar={SHADOW_CAMERA_FAR}
    >
      <RotatingObject />
    </SceneCanvas>
  )
}

useGLTF.preload(MODEL_URL)
