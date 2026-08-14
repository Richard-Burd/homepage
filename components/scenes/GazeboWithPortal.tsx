'use client'

import { MeshPortalMaterial, useGLTF } from '@react-three/drei'
import { useMemo, useRef, useState, type RefObject } from 'react'
import {
  AlwaysStencilFunc,
  Box3,
  BufferGeometry,
  EqualStencilFunc,
  Float32BufferAttribute,
  FrontSide,
  Mesh,
  ReplaceStencilOp,
  Vector3,
  type BufferAttribute,
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
const GAZEBO_FILE = 'Gazebo.12.6.glb'
const SECRET_WORLD_FILE = 'SecretWorld.1.2.glb'
const GAZEBO_URL = proxiedAssetUrl(GAZEBO_FILE)
const SECRET_WORLD_URL = proxiedAssetUrl(SECRET_WORLD_FILE)

/**
 * Mesh in the Gazebo GLB that is the portal: a box with the face on the gazebo
 * side deleted and all normals turned inward, so its five remaining walls form a
 * recess. All five are kept — the columns stand inside that recess, and a single
 * flat pane across the opening would cover them.
 */
const PORTAL_MESH_NAME = 'Portal-1'

/**
 * Empty that links the two GLBs when present. The Secret World is positioned so
 * this marker lands on PORTAL_TARGET_ANCHOR in Gazebo space. Newer Secret World
 * exports may omit it — then DEFAULT_PORTAL_TARGET_POSITION is used instead.
 */
const PORTAL_TARGET_NAME = 'Portal-1 Target'

/**
 * Fallback viewpoint in Secret World space when `Portal-1 Target` is missing.
 * Matches the Blender Ray Portal Mapping Z of 150' (45.72 m) used on Portal-1.
 */
const DEFAULT_PORTAL_TARGET_POSITION: [number, number, number] = [0, 45.72, 0]

/**
 * The Blender portal material feeds Ray Portal BSDF through a Mapping node whose
 * Scale is 10, so a ray's entry point is multiplied by 10 before it is traced into
 * the Secret World. Amplifying the viewpoint like that is the same as viewing a
 * world 10x smaller, so the Secret World is divided by the same factor here.
 * Without it, everything in the room sits 10x too far from the portal — the Sphere
 * in particular ends up far above the opening.
 */
const PORTAL_WORLD_SCALE = 1 / 10

/**
 * Where the Secret World's portal viewpoint is pinned, in Gazebo-space units
 * (before the TARGET_SIZE normalization below). Pinning it at the gazebo origin
 * puts the viewer inside the room, level with the gazebo. Raise y to sink the
 * room, lower it to lift the room's floor into view.
 * NOTE: 0,0,0 matches the Mapping coordinates on the portal material in Blender.
 */
const PORTAL_TARGET_ANCHOR: [number, number, number] = [0, 0, 0]

/** Max axis length in world units for the gazebo. The portal world scales with it. */
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

const CAMERA_POSITION: [number, number, number] = [8, 0.6, 12]
const CAMERA_FOV = 28

const AMBIENT_LIGHT_INTENSITY = 0.2
const DIRECTIONAL_LIGHT_POSITION: [number, number, number] = [10, 4, 7]
const DIRECTIONAL_LIGHT_INTENSITY = 1.5

/**
 * The portal renders its own scene, so it needs its own lights. The camera ends
 * up inside the green room, where only ambient light reliably reaches the walls.
 */
const PORTAL_AMBIENT_LIGHT_INTENSITY = 1.1
const PORTAL_DIRECTIONAL_LIGHT_INTENSITY = 0.8

/** SDF resolution for the portal mask — smaller is cheaper to start up. */
const PORTAL_RESOLUTION = 512

/** Edge fade blur on the portal, 0 = crisp edges. */
const PORTAL_BLUR = 0

/**
 * Stencil value marking the pixels where the recess's opening is visible.
 *
 * The recess draws only where the stencil matches, which is what stops its inner
 * walls from showing the other world through one another at oblique angles: from
 * behind, the near wall is culled as a back face and you would otherwise see the
 * far wall's inner surface through the gap. This is the equivalent of Blender
 * mixing in a Transparent BSDF once a ray has already crossed a portal face.
 */
const PORTAL_STENCIL_REF = 1

/** The opening marks the stencil before any geometry draws. */
const PORTAL_MASK_RENDER_ORDER = -1

/** The recess draws after the gazebo so it depth-tests against the columns. */
const PORTAL_RENDER_ORDER = 1

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

/** GLTFLoader sanitizes node names, so `Portal-1 Target` arrives as `Portal-1_Target`. */
function findByBlenderName(root: Object3D, name: string) {
  return (
    root.getObjectByName(name) ??
    root.getObjectByName(name.replace(/\s/g, '_')) ??
    null
  )
}

type Axis = 0 | 1 | 2
type OpenSide = { axis: Axis; dir: -1 | 1 }

/** Tolerance for treating a vertex as lying on a bounding-box face, in world units. */
const COPLANAR_EPSILON = 1e-3

/** Locate the deleted face by finding the bounding-box side no triangle lies on. */
function findOpenSide(geometry: BufferGeometry, box: Box3): OpenSide {
  const position = geometry.attributes.position as BufferAttribute
  const index = geometry.getIndex()
  const cornerCount = index ? index.count : position.count
  const vertex = new Vector3()

  const sides = ([0, 1, 2] as Axis[]).flatMap((axis) =>
    ([-1, 1] as const).map((dir) => ({ axis, dir, coverage: 0 }))
  )

  for (let corner = 0; corner < cornerCount; corner += 3) {
    const triangle = [0, 1, 2].map((offset) => {
      const vertexIndex = index ? index.getX(corner + offset) : corner + offset
      return vertex.fromBufferAttribute(position, vertexIndex).clone()
    })

    for (const side of sides) {
      const plane = (side.dir < 0 ? box.min : box.max).getComponent(side.axis)
      const onPlane = triangle.every(
        (point) =>
          Math.abs(point.getComponent(side.axis) - plane) < COPLANAR_EPSILON
      )
      if (onPlane) side.coverage++
    }
  }

  const open = sides.find((side) => side.coverage === 0)
  if (!open) {
    throw new Error(
      `"${PORTAL_MESH_NAME}" in ${GAZEBO_FILE} has no open face to use as a portal`
    )
  }

  return { axis: open.axis, dir: open.dir }
}

/**
 * Build a quad filling the recess's opening, wound so its normal points out
 * through that opening. It is never drawn; it only writes the stencil, so the
 * recess is visible looking in through the opening and nowhere else.
 */
function createApertureGeometry(box: Box3, { axis, dir }: OpenSide) {
  const plane = (dir < 0 ? box.min : box.max).getComponent(axis)
  const [u, v] = ([0, 1, 2] as Axis[]).filter((candidate) => candidate !== axis)

  const corner = (uValue: number, vValue: number) => {
    const point = new Vector3()
    point.setComponent(axis, plane)
    point.setComponent(u, uValue)
    point.setComponent(v, vValue)
    return point
  }

  const corners = [
    corner(box.min.getComponent(u), box.min.getComponent(v)),
    corner(box.max.getComponent(u), box.min.getComponent(v)),
    corner(box.max.getComponent(u), box.max.getComponent(v)),
    corner(box.min.getComponent(u), box.max.getComponent(v)),
  ]

  const normal = new Vector3().setComponent(axis, dir)
  const facesOutward =
    new Vector3()
      .subVectors(corners[1], corners[0])
      .cross(new Vector3().subVectors(corners[2], corners[0]))
      .dot(normal) > 0

  const geometry = new BufferGeometry()
  geometry.setAttribute(
    'position',
    new Float32BufferAttribute(
      corners.flatMap((point) => point.toArray()),
      3
    )
  )
  geometry.setAttribute(
    'normal',
    new Float32BufferAttribute(
      corners.flatMap(() => normal.toArray()),
      3
    )
  )
  geometry.setAttribute(
    'uv',
    new Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2)
  )
  geometry.setIndex(facesOutward ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2])

  return geometry
}

function usePortalScene() {
  const { scene: gazeboScene } = useGLTF(GAZEBO_URL)
  const { scene: secretWorldScene } = useGLTF(SECRET_WORLD_URL)

  return useMemo(() => {
    const gazebo = gazeboScene.clone(true)
    gazebo.updateMatrixWorld(true)

    const portal = findByBlenderName(gazebo, PORTAL_MESH_NAME)
    if (!(portal instanceof Mesh)) {
      throw new Error(
        `"${PORTAL_MESH_NAME}" mesh is missing from ${GAZEBO_FILE}`
      )
    }

    // Bake the portal node's transform into a standalone geometry so the recess
    // and its opening land in the gazebo's own space.
    const portalGeometry = portal.geometry
      .clone()
      .applyMatrix4(portal.matrixWorld)
    const portalBounds = new Box3().setFromBufferAttribute(
      portalGeometry.attributes.position as BufferAttribute
    )
    const apertureGeometry = createApertureGeometry(
      portalBounds,
      findOpenSide(portalGeometry, portalBounds)
    )
    portal.visible = false

    const secretWorld = secretWorldScene.clone(true)
    secretWorld.updateMatrixWorld(true)

    // Prefer the Blender empty when present; otherwise use the same 150' Mapping
    // offset the Ray Portal material used so newer Secret World exports still line up.
    const marker = findByBlenderName(secretWorld, PORTAL_TARGET_NAME)
    const markerPosition = marker
      ? marker.getWorldPosition(new Vector3())
      : new Vector3(...DEFAULT_PORTAL_TARGET_POSITION)
    // Blender's Mapping node computes `Location + Scale * point`, so undoing it is
    // `(point - Location) / Scale`: shrink the world, then move its viewpoint to
    // the anchor.
    const secretWorldOffset = new Vector3(...PORTAL_TARGET_ANCHOR).sub(
      markerPosition.multiplyScalar(PORTAL_WORLD_SCALE)
    )

    gazebo.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true
        object.receiveShadow = true
      }
    })

    const bounds = new Box3().setFromObject(gazeboScene)
    const size = bounds.getSize(new Vector3())

    return {
      gazebo,
      portalGeometry,
      apertureGeometry,
      secretWorld,
      secretWorldOffset,
      scale: TARGET_SIZE / (Math.max(size.x, size.y, size.z) || 1),
      center: bounds.getCenter(new Vector3()),
    }
  }, [gazeboScene, secretWorldScene])
}

function GazeboPortal() {
  const {
    gazebo,
    portalGeometry,
    apertureGeometry,
    secretWorld,
    secretWorldOffset,
    scale,
    center,
  } = usePortalScene()

  return (
    <group scale={scale}>
      <group position={[-center.x, -center.y, -center.z]}>
        <primitive object={gazebo} dispose={null} />
        <mesh
          geometry={apertureGeometry}
          renderOrder={PORTAL_MASK_RENDER_ORDER}
        >
          <meshBasicMaterial
            colorWrite={false}
            depthWrite={false}
            side={FrontSide}
            stencilWrite
            stencilRef={PORTAL_STENCIL_REF}
            stencilFunc={AlwaysStencilFunc}
            stencilZPass={ReplaceStencilOp}
          />
        </mesh>
        {/* A portal is a window, so it neither casts nor catches shadows. */}
        <mesh
          geometry={portalGeometry}
          renderOrder={PORTAL_RENDER_ORDER}
          castShadow={false}
          receiveShadow={false}
        >
          <MeshPortalMaterial
            blur={PORTAL_BLUR}
            resolution={PORTAL_RESOLUTION}
            side={FrontSide}
            stencilWrite
            stencilRef={PORTAL_STENCIL_REF}
            stencilFunc={EqualStencilFunc}
          >
            <ambientLight intensity={PORTAL_AMBIENT_LIGHT_INTENSITY} />
            <directionalLight
              position={DIRECTIONAL_LIGHT_POSITION}
              intensity={PORTAL_DIRECTIONAL_LIGHT_INTENSITY}
            />
            <group
              position={secretWorldOffset.toArray()}
              scale={PORTAL_WORLD_SCALE}
            >
              <primitive object={secretWorld} dispose={null} />
            </group>
          </MeshPortalMaterial>
        </mesh>
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
  const introCompleteRef = useRef(true)

  useTurntableAutoRotate(
    groupRef,
    anglesRef,
    pitchAxis,
    AUTO_ROTATE_SPEED,
    isDragging,
    introCompleteRef
  )

  return (
    <group ref={groupRef}>
      <group position={[-PIVOT_POINT[0], -PIVOT_POINT[1], -PIVOT_POINT[2]]}>
        <GazeboPortal />
      </group>
    </group>
  )
}

export default function GazeboWithPortal() {
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
      modelName={`${GAZEBO_FILE} + ${SECRET_WORLD_FILE}`}
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
useGLTF.preload(SECRET_WORLD_URL)
