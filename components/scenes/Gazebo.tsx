'use client'

import { useGLTF } from '@react-three/drei'
import { useMemo, useState, useRef, type RefObject } from 'react'
import type { Group } from 'three'

import BlenderModel from '@/components/three/BlenderModel'
import SceneCanvas from '@/components/three/SceneCanvas'
import {
  useTurntableAutoRotate,
  useTurntableDrag,
  viewportPitchAxis,
  type TurntableAngles,
} from '@/components/three/hooks/useTurntable'
import { proxiedAssetUrl } from '@/lib/assets'

// Served via next.config rewrite → assets host (avoids browser CORS on the bucket).
const MODEL_URL = proxiedAssetUrl('Gazebo.3.4.glb')

/** Max axis length in world units (cube is 3). Bump this to enlarge the model. */
const TARGET_SIZE = 4

/** Radians per second while idle — much slower than the cube. */
const AUTO_ROTATE_SPEED = 0.25

/** How far the model turns per pixel dragged. */
const DRAG_SENSITIVITY = 0.008

/**
 * Pitch limits in radians. ±π allows a full flip to inspect the underside
 * while still forbidding any left/right lean relative to the viewport.
 */
const PITCH_MIN = -Math.PI
const PITCH_MAX = Math.PI

type DragHitBox = {
  /** Left edge as a fraction of canvas width (0–1). */
  x: number
  /** Top edge as a fraction of canvas height (0–1). */
  y: number
  /** Width as a fraction of canvas width (0–1). */
  width: number
  /** Height as a fraction of canvas height (0–1). */
  height: number
}

/**
 * Screen-space region where drag-to-rotate works, as fractions of the canvas
 * size (0–1). The WebGL canvas ignores pointers so the page can scroll; only
 * this overlay captures drag. Touches outside it scroll normally.
 *
 * Shape: { x, y, width, height }
 *   - x, y = top-left of the box (0 = left/top of the canvas)
 *   - width, height = size as a fraction of canvas width/height
 *
 * Examples:
 *   null                                            → drag anywhere on canvas
 *   { x: 0.2, y: 0.2, width: 0.6, height: 0.6 }     → center 60%
 *   { x: 0, y: 0, width: 1, height: 1 }             → full canvas (same as null)
 *
 * Set to `null` for a full-canvas drag surface (vertical swipes still scroll).
 */
const DRAG_HIT_BOX: DragHitBox | null = {
  x: 0.3,
  y: 0.3,
  width: 0.4,
  height: 0.5,
}

/**
 * Debug fill for DRAG_HIT_BOX so you can see the interactive region.
 * Use a translucent color while tuning (e.g. `'rgba(255, 0, 0, 0.25)'`),
 * then set to `'transparent'` when finished.
 */
const DRAG_HIT_BOX_COLOR = 'transparent'

/**
 * The point the model spins around, [x, y, z] in world units measured from the
 * bounding-box center. [0, 0, 0] keeps the default pivot; positive x moves the
 * pivot right, positive y up, positive z toward the camera. The model shifts
 * the opposite way on screen, since the pivot itself stays put.
 */
const PIVOT_POINT: [number, number, number] = [0, -0.6, 0]

/**
 * Canvas width on the page as a CSS length. `clamp(min, preferred, max)` keeps
 * it responsive between a floor and a ceiling.
 */
const CANVAS_WIDTH = '100%'

/**
 * Canvas aspect ratio as [width, height]. [1, 1] is square, [16, 9] widescreen,
 * [4, 3] classic — any positive pair works.
 */
const CANVAS_ASPECT: [number, number] = [1.2, 1]

/**
 * Canvas backdrop color. Use any CSS color (`'#fff'`, `'rgb(…)'`, etc.) or
 * `'transparent'` to let the page show through (the current default).
 */
const CANVAS_BACKGROUND_COLOR = 'transparent'

/** Camera location in world space [x, y, z]. Higher/farther values pull the view back. */
const CAMERA_POSITION: [number, number, number] = [8, 7, 10]

/** Vertical field of view in degrees — lower = more telephoto / zoomed-in. */
const CAMERA_FOV = 28

/** Master switch for depth-of-field postprocessing (near sharp / far soft). */
const DEPTH_OF_FIELD_ENABLED = false

/**
 * Distance from the camera to the sharp plane, in world units.
 * With the default CAMERA_POSITION the origin is ~14.6 away — lower values
 * focus closer to the camera (front of the model), higher focuses farther back.
 */
const DEPTH_OF_FIELD_FOCUS_DISTANCE = 13

/**
 * Thickness of the sharp band around the focus plane, in world units.
 * Smaller = thinner slice in focus; larger = more of the model stays sharp.
 */
const DEPTH_OF_FIELD_FOCUS_RANGE = 3

/**
 * Strength of the out-of-focus bokeh blur.
 * 0 = no DOF blur, 2–4 subtle, 8+ heavy. Ignored when DEPTH_OF_FIELD_ENABLED is false.
 */
const DEPTH_OF_FIELD_BOKEH_SCALE = 5

/**
 * Uniform soft blur on the whole canvas, in CSS pixels. 0 = off.
 * Stacks on top of depth of field — use for an overall soft look.
 */
const OVERALL_BLUR = 0

/** Soft fill light from every direction. Higher values lift shadows and flatten contrast. */
const AMBIENT_LIGHT_INTENSITY = 0.2

/**
 * Directional light location [x, y, z]. The light aims at the origin, so this
 * vector sets the sun angle (y = height, x/z = side/front).
 */
const DIRECTIONAL_LIGHT_POSITION: [number, number, number] = [4, 10, 4]

/** Brightness of the directional “sun” light that casts shadows. */
const DIRECTIONAL_LIGHT_INTENSITY = 1.5

/** Draw black outline edges on mesh faces (drei Edges helper). */
const SHOW_EDGES = false

/** Color of those outline edges. */
const EDGE_COLOR = '#000000'

/** Minimum angle (degrees) between faces before an edge is drawn. Lower = more lines. */
const EDGE_THRESHOLD = 23

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

function RotatingObject({
  groupRef,
  anglesRef,
  pitchAxis,
  isDragging,
}: {
  groupRef: RefObject<Group | null>
  anglesRef: RefObject<TurntableAngles>
  pitchAxis: ReturnType<typeof viewportPitchAxis>
  isDragging: RefObject<boolean>
}) {
  useTurntableAutoRotate(
    groupRef,
    anglesRef,
    pitchAxis,
    AUTO_ROTATE_SPEED,
    isDragging
  )

  return (
    <group ref={groupRef}>
      <group position={[-PIVOT_POINT[0], -PIVOT_POINT[1], -PIVOT_POINT[2]]}>
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
    </group>
  )
}

export default function Gazebo() {
  const groupRef = useRef<Group | null>(null)
  const anglesRef = useRef<TurntableAngles>({ yaw: 0, pitch: 0 })
  const pitchAxis = useMemo(
    () => viewportPitchAxis(CAMERA_POSITION),
    []
  )
  const [interactEl, setInteractEl] = useState<HTMLDivElement | null>(null)
  // Full-canvas overlay must allow vertical pan; a small hit box can capture all drags.
  const allowVerticalScroll = DRAG_HIT_BOX === null
  const isDragging = useTurntableDrag(
    groupRef,
    anglesRef,
    pitchAxis,
    DRAG_SENSITIVITY,
    interactEl,
    allowVerticalScroll,
    PITCH_MIN,
    PITCH_MAX
  )

  const hit = DRAG_HIT_BOX

  return (
    <div style={{ position: 'relative', width: CANVAS_WIDTH }}>
      <SceneCanvas
        style={{
          width: '100%',
          aspectRatio: `${CANVAS_ASPECT[0]} / ${CANVAS_ASPECT[1]}`,
          backgroundColor: CANVAS_BACKGROUND_COLOR,
          filter: OVERALL_BLUR > 0 ? `blur(${OVERALL_BLUR}px)` : undefined,
        }}
        cameraPosition={CAMERA_POSITION}
        cameraFov={CAMERA_FOV}
        depthOfField={DEPTH_OF_FIELD_ENABLED}
        depthOfFieldFocusDistance={DEPTH_OF_FIELD_FOCUS_DISTANCE}
        depthOfFieldFocusRange={DEPTH_OF_FIELD_FOCUS_RANGE}
        depthOfFieldBokehScale={DEPTH_OF_FIELD_BOKEH_SCALE}
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
        <RotatingObject
          groupRef={groupRef}
          anglesRef={anglesRef}
          pitchAxis={pitchAxis}
          isDragging={isDragging}
        />
      </SceneCanvas>
      <div
        ref={setInteractEl}
        aria-hidden
        className="cursor-grab active:cursor-grabbing"
        style={{
          position: 'absolute',
          left: hit ? `${hit.x * 100}%` : 0,
          top: hit ? `${hit.y * 100}%` : 0,
          width: hit ? `${hit.width * 100}%` : '100%',
          height: hit ? `${hit.height * 100}%` : '100%',
          backgroundColor: DRAG_HIT_BOX_COLOR,
          // Small hit box: capture all drags. Full canvas: let vertical swipes scroll.
          touchAction: hit ? 'none' : 'pan-y',
        }}
      />
    </div>
  )
}

useGLTF.preload(MODEL_URL)
