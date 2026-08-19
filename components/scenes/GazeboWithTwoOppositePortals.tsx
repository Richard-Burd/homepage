'use client'

import { MeshPortalMaterial, useGLTF } from '@react-three/drei'
import {
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import {
  AlwaysStencilFunc,
  BackSide,
  Box3,
  EqualStencilFunc,
  FrontSide,
  KeepStencilOp,
  Mesh,
  ReplaceStencilOp,
  Vector3,
  type BufferGeometry,
  type Group,
  type Object3D,
} from 'three'

import ModelErrorBoundary from '@/components/three/ModelErrorBoundary'
import SceneCanvas from '@/components/three/SceneCanvas'
import {
  useTurntableAutoRotate,
  useTurntableDrag,
  viewportPitchAxis,
  type TurntableAngles,
} from '@/components/three/hooks/useTurntable'
import { proxiedAssetUrl } from '@/lib/assets'

// Served via next.config rewrite → assets host (avoids browser CORS on the bucket).
const GAZEBO_FILE = 'Gazebo.26.2.glb'
const SECRET_WORLD_1_FILE = 'SecretWorld.1.16.glb'
const SECRET_WORLD_2_FILE = 'SecretWorld.2.5.glb'
const GAZEBO_URL = proxiedAssetUrl(GAZEBO_FILE)
const SECRET_WORLD_1_URL = proxiedAssetUrl(SECRET_WORLD_1_FILE)
const SECRET_WORLD_2_URL = proxiedAssetUrl(SECRET_WORLD_2_FILE)

/**
 * Each portal is a 5-sided open box (a cube with one face deleted). The GLB
 * stores inward-facing normals, so FrontSide is the concave interior you see
 * looking in through the opening, and BackSide is the convex exterior.
 *
 * That FrontSide is the portal; BackSide is transparent. The sister-face rule
 * below is the Three.js stand-in for Cycles mixing Transparent BSDF once a ray
 * has already crossed a backface of the *same* portal (Light Path / Transparent
 * Depth / Portal Depth — none of which survive a .glb export).
 */
const PORTAL_1_MESH_NAME = 'Portal-1'
const PORTAL_2_MESH_NAME = 'Portal-2'

/**
 * Empties that exist in the matching Secret World GLBs. Each Secret World is
 * shifted so its marker lands on PORTAL_TARGET_ANCHOR in Gazebo space.
 */
const PORTAL_1_TARGET_NAME = 'Portal-1 Target'
const PORTAL_2_TARGET_NAME = 'Portal-2 Target'

/**
 * Where each Secret World's target marker is pinned, in Gazebo-space units
 * (before the TARGET_SIZE normalization below). `[0, 0, 0]` matches Blender's
 * Mapping Location when the portal Mapping Scale is 1.
 */
const PORTAL_TARGET_ANCHOR: [number, number, number] = [0, 0, 0]

/**
 * Unique stencil *bits* so the two portals can mask themselves independently:
 *
 *   bit 0 (1) → Portal-1 has already been entered through a backface
 *   bit 1 (2) → Portal-2 has already been entered through a backface
 *
 * A portal's front faces draw only where their own bit is still 0. The other
 * portal's bit is ignored, so looking through Portal-1 can still reveal
 * Portal-2 and vice versa. Ordinary gazebo meshes never read these bits.
 */
const PORTAL_1_STENCIL_BIT = 0b00000001
const PORTAL_2_STENCIL_BIT = 0b00000010

/** Max axis length in world units for the gazebo. The portal worlds scale with it. */
const TARGET_SIZE = 4.3

/** Radians per second while idle. */
const AUTO_ROTATE_SPEED = 0.25

/** How far the model turns per pixel dragged. */
const DRAG_SENSITIVITY = 0.008

/** Pitch limits in radians — ±π allows a full flip with no left/right lean. */
const PITCH_MIN = -Math.PI
const PITCH_MAX = Math.PI

/** The point the model spins around, measured from the bounding-box center. */
const PIVOT_POINT: [number, number, number] = [0, -0.35, 0]

const CANVAS_WIDTH = '100%'
const CANVAS_ASPECT: [number, number] = [1.2, 1.3]
const CANVAS_BACKGROUND_COLOR = 'transparent'

/**
 * Where the camera sits in world space, looking toward the origin.
 * - [0] X — left/right. Positive = right of the model (orbiting around Y).
 * - [1] Y — up/down. Positive = above; negative = below eye level.
 * - [2] Z — toward/away. Positive = in front; larger = farther back.
 * Distance from origin (with FOV) sets how large the gazebo reads in frame.
 */
const CAMERA_POSITION: [number, number, number] = [8, -0.5, 5]
const CAMERA_FOV = 45

const AMBIENT_LIGHT_INTENSITY = 0.2
const DIRECTIONAL_LIGHT_POSITION: [number, number, number] = [10, 4, 7]
const DIRECTIONAL_LIGHT_INTENSITY = 1.5

/**
 * Each portal renders its own scene, so it needs its own lights. The camera
 * ends up inside the green / yellow rooms, where only ambient light reliably
 * reaches the walls.
 */
const PORTAL_AMBIENT_LIGHT_INTENSITY = 1.1
const PORTAL_DIRECTIONAL_LIGHT_INTENSITY = 0.8

/** SDF resolution for the portal mask — smaller is cheaper to start up. */
const PORTAL_RESOLUTION = 512

/** Edge fade blur on the portal, 0 = crisp edges. */
const PORTAL_BLUR = 0

/**
 * Backfaces mark the stencil after the gazebo has written depth, so a portal
 * only suppresses its sister faces where its own backface is actually visible
 * — not where a column or floor already occludes it.
 */
const PORTAL_MASK_RENDER_ORDER = 1

/** Portal surfaces draw after the gazebo so they depth-test against columns. */
const PORTAL_RENDER_ORDER = 2

const SHADOW_MAP_SIZE = 2048
const SHADOW_RADIUS = 2
const SHADOW_BLUR_SAMPLES = 16
const SHADOW_INTENSITY = 0.8
const SHADOW_BIAS = -0.0001
const SHADOW_NORMAL_BIAS = 0.02
const SHADOW_CAMERA_SIZE = 6
const SHADOW_CAMERA_NEAR = 0.1
const SHADOW_CAMERA_FAR = 50

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
 * Screen-space region where drag-to-rotate works. The WebGL canvas ignores
 * pointers so the page can still scroll; only this overlay captures drag.
 */
const DRAG_HIT_BOX: DragHitBox = {
  x: 0.2,
  y: 0.15,
  width: 0.6,
  height: 0.65,
}

const PORTAL_MESH_NAMES = new Set([PORTAL_1_MESH_NAME, PORTAL_2_MESH_NAME])

/** GLTFLoader sanitizes node names, so `Portal-1 Target` arrives as `Portal-1_Target`. */
function findByBlenderName(root: Object3D, name: string) {
  return (
    root.getObjectByName(name) ??
    root.getObjectByName(name.replace(/\s/g, '_')) ??
    null
  )
}

function requireMesh(root: Object3D, name: string, file: string) {
  const object = findByBlenderName(root, name)
  if (!(object instanceof Mesh)) {
    throw new Error(`"${name}" mesh is missing from ${file}`)
  }
  return object
}

function requireMarker(root: Object3D, name: string, file: string) {
  const object = findByBlenderName(root, name)
  if (!object) {
    throw new Error(`"${name}" is missing from ${file}`)
  }
  return object
}

function secretWorldOffset(marker: Object3D) {
  return new Vector3(...PORTAL_TARGET_ANCHOR).sub(
    marker.getWorldPosition(new Vector3())
  )
}

type PreparedPortal = {
  name: string
  stencilBit: number
  geometry: BufferGeometry
  secretWorld: Group
  secretWorldOffset: Vector3
}

function usePortalScene() {
  const { scene: gazeboScene } = useGLTF(GAZEBO_URL)
  const { scene: secretWorld1Scene } = useGLTF(SECRET_WORLD_1_URL)
  const { scene: secretWorld2Scene } = useGLTF(SECRET_WORLD_2_URL)

  return useMemo(() => {
    const gazebo = gazeboScene.clone(true)
    gazebo.updateMatrixWorld(true)

    const portal1Mesh = requireMesh(gazebo, PORTAL_1_MESH_NAME, GAZEBO_FILE)
    const portal2Mesh = requireMesh(gazebo, PORTAL_2_MESH_NAME, GAZEBO_FILE)

    const secretWorld1 = secretWorld1Scene.clone(true)
    secretWorld1.updateMatrixWorld(true)
    const secretWorld2 = secretWorld2Scene.clone(true)
    secretWorld2.updateMatrixWorld(true)

    const portals: PreparedPortal[] = [
      {
        name: PORTAL_1_MESH_NAME,
        stencilBit: PORTAL_1_STENCIL_BIT,
        geometry: portal1Mesh.geometry
          .clone()
          .applyMatrix4(portal1Mesh.matrixWorld),
        secretWorld: secretWorld1,
        secretWorldOffset: secretWorldOffset(
          requireMarker(secretWorld1, PORTAL_1_TARGET_NAME, SECRET_WORLD_1_FILE)
        ),
      },
      {
        name: PORTAL_2_MESH_NAME,
        stencilBit: PORTAL_2_STENCIL_BIT,
        geometry: portal2Mesh.geometry
          .clone()
          .applyMatrix4(portal2Mesh.matrixWorld),
        secretWorld: secretWorld2,
        secretWorldOffset: secretWorldOffset(
          requireMarker(secretWorld2, PORTAL_2_TARGET_NAME, SECRET_WORLD_2_FILE)
        ),
      },
    ]

    gazebo.traverse((object) => {
      if (!(object instanceof Mesh)) return
      const isPortal = PORTAL_MESH_NAMES.has(object.name)
      object.visible = !isPortal
      object.castShadow = !isPortal
      object.receiveShadow = !isPortal
    })

    const bounds = new Box3().setFromObject(gazeboScene)
    const size = bounds.getSize(new Vector3())

    return {
      gazebo,
      portals,
      scale: TARGET_SIZE / (Math.max(size.x, size.y, size.z) || 1),
      center: bounds.getCenter(new Vector3()),
    }
  }, [gazeboScene, secretWorld1Scene, secretWorld2Scene])
}

function PortalWorld({
  secretWorld,
  offset,
}: {
  secretWorld: Group
  offset: Vector3
}) {
  return (
    <>
      <ambientLight intensity={PORTAL_AMBIENT_LIGHT_INTENSITY} />
      <directionalLight
        position={DIRECTIONAL_LIGHT_POSITION}
        intensity={PORTAL_DIRECTIONAL_LIGHT_INTENSITY}
      />
      <group position={offset.toArray()}>
        <primitive object={secretWorld} dispose={null} />
      </group>
    </>
  )
}

/**
 * One 5-sided portal.
 *
 * Pass A — backfaces only, no color, no depth write: set this portal's stencil
 * bit wherever the concave interior is visible. That is the "already walked
 * through this portal" flag.
 *
 * Pass B — frontfaces with MeshPortalMaterial: draw the Secret World only where
 * this portal's bit is still 0. Sister faces of the same portal therefore stay
 * transparent after you have entered through a backface, while the other
 * portal (different bit) still works, and gazebo geometry in between is left
 * alone because it never consults the stencil.
 */
function OppositePortal({
  portal,
  children,
}: {
  portal: PreparedPortal
  children: ReactNode
}) {
  return (
    <>
      <mesh
        geometry={portal.geometry}
        renderOrder={PORTAL_MASK_RENDER_ORDER}
        frustumCulled={false}
        castShadow={false}
        receiveShadow={false}
      >
        <meshBasicMaterial
          colorWrite={false}
          depthWrite={false}
          side={BackSide}
          stencilWrite
          stencilRef={portal.stencilBit}
          stencilWriteMask={portal.stencilBit}
          stencilFuncMask={portal.stencilBit}
          stencilFunc={AlwaysStencilFunc}
          stencilFail={KeepStencilOp}
          stencilZFail={KeepStencilOp}
          stencilZPass={ReplaceStencilOp}
        />
      </mesh>
      <mesh
        geometry={portal.geometry}
        renderOrder={PORTAL_RENDER_ORDER}
        frustumCulled={false}
        castShadow={false}
        receiveShadow={false}
      >
        <MeshPortalMaterial
          blur={PORTAL_BLUR}
          resolution={PORTAL_RESOLUTION}
          side={FrontSide}
          stencilWrite
          stencilRef={0}
          stencilWriteMask={0}
          stencilFuncMask={portal.stencilBit}
          stencilFunc={EqualStencilFunc}
          stencilFail={KeepStencilOp}
          stencilZFail={KeepStencilOp}
          stencilZPass={KeepStencilOp}
        >
          {children}
        </MeshPortalMaterial>
      </mesh>
    </>
  )
}

function GazeboPortals() {
  const { gazebo, portals, scale, center } = usePortalScene()

  return (
    <group scale={scale}>
      <group position={[-center.x, -center.y, -center.z]}>
        <primitive object={gazebo} dispose={null} />
        {portals.map((portal) => (
          <OppositePortal key={portal.name} portal={portal}>
            <PortalWorld
              secretWorld={portal.secretWorld}
              offset={portal.secretWorldOffset}
            />
          </OppositePortal>
        ))}
      </group>
    </group>
  )
}

function RotatingPortalGazebo({
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
        <GazeboPortals />
      </group>
    </group>
  )
}

export default function GazeboWithTwoOppositePortals() {
  const groupRef = useRef<Group | null>(null)
  const anglesRef = useRef<TurntableAngles>({ yaw: 0, pitch: 0 })
  const pitchAxis = useMemo(() => viewportPitchAxis(CAMERA_POSITION), [])
  const [interactEl, setInteractEl] = useState<HTMLDivElement | null>(null)
  const isDragging = useTurntableDrag(
    groupRef,
    anglesRef,
    pitchAxis,
    DRAG_SENSITIVITY,
    interactEl,
    false,
    PITCH_MIN,
    PITCH_MAX
  )

  const canvasStyle = {
    width: '100%' as const,
    aspectRatio: `${CANVAS_ASPECT[0]} / ${CANVAS_ASPECT[1]}`,
    backgroundColor: CANVAS_BACKGROUND_COLOR,
  }

  return (
    <ModelErrorBoundary
      modelName={`${GAZEBO_FILE} + ${SECRET_WORLD_1_FILE} + ${SECRET_WORLD_2_FILE}`}
      style={{ ...canvasStyle, width: CANVAS_WIDTH }}
    >
      <div style={{ position: 'relative', width: CANVAS_WIDTH }}>
        <SceneCanvas
          style={canvasStyle}
          cameraPosition={CAMERA_POSITION}
          cameraFov={CAMERA_FOV}
          ambientLightIntensity={AMBIENT_LIGHT_INTENSITY}
          directionalLightPosition={DIRECTIONAL_LIGHT_POSITION}
          directionalLightIntensity={DIRECTIONAL_LIGHT_INTENSITY}
          shadows
          shadowType="percentage"
          shadowMapSize={SHADOW_MAP_SIZE}
          shadowRadius={SHADOW_RADIUS}
          shadowBlurSamples={SHADOW_BLUR_SAMPLES}
          shadowIntensity={SHADOW_INTENSITY}
          shadowBias={SHADOW_BIAS}
          shadowNormalBias={SHADOW_NORMAL_BIAS}
          shadowCameraSize={SHADOW_CAMERA_SIZE}
          shadowCameraNear={SHADOW_CAMERA_NEAR}
          shadowCameraFar={SHADOW_CAMERA_FAR}
          stencil
        >
          <RotatingPortalGazebo
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
            left: `${DRAG_HIT_BOX.x * 100}%`,
            top: `${DRAG_HIT_BOX.y * 100}%`,
            width: `${DRAG_HIT_BOX.width * 100}%`,
            height: `${DRAG_HIT_BOX.height * 100}%`,
            touchAction: 'none',
          }}
        />
      </div>
    </ModelErrorBoundary>
  )
}

useGLTF.preload(GAZEBO_URL)
useGLTF.preload(SECRET_WORLD_1_URL)
useGLTF.preload(SECRET_WORLD_2_URL)
