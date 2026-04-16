import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { DecalGeometry } from 'three-stdlib'
import { getDecalReceiverMeshes, useDecalReceiverRegistryVersion } from './decalReceiverRegistry'

const PROJECTOR_FORWARD = new THREE.Vector3(0, 0, 1)
const PROJECTOR_UP = new THREE.Vector3(0, 1, 0)
const RAYCAST_DIRECTION = new THREE.Vector3(0, -1, 0)
const RAYCAST_START_HEIGHT = 4
const RAYCAST_MAX_DISTANCE = 10
const PROJECTOR_DEPTH = 1.5
const SURFACE_OFFSET = 0.008
const POSITION_EPSILON = 0.0001
const QUATERNION_EPSILON = 0.0001
const DEFAULT_RING_INNER_RADIUS = 0.416
const DEFAULT_RING_OUTER_RADIUS = 0.44

type ProjectedGroundDecalProps = {
  color?: string
  opacity?: number
  size?: number
  fallback?: boolean
}

type ProjectedGroundHit = {
  object: THREE.Mesh
  point: THREE.Vector3
  normal: THREE.Vector3
}

export function ProjectedGroundDecal({
  color = '#d4a72c',
  opacity = 0.85,
  size = 0.96,
  fallback = true,
}: ProjectedGroundDecalProps) {
  const anchorRef = useRef<THREE.Group>(null)
  const receiverVersion = useDecalReceiverRegistryVersion()
  const [geometry, setGeometry] = useState<THREE.BufferGeometry | null>(null)
  const coreTexture = useMemo(() => getRingCoreTexture(), [])
  const glowTexture = useMemo(() => getRingGlowTexture(), [])
  const fallbackGeometry = useMemo(
    () => new THREE.RingGeometry(DEFAULT_RING_INNER_RADIUS, DEFAULT_RING_OUTER_RADIUS, 48),
    [],
  )
  const lastPositionRef = useRef(new THREE.Vector3(Number.NaN, Number.NaN, Number.NaN))
  const lastQuaternionRef = useRef(new THREE.Quaternion(Number.NaN, Number.NaN, Number.NaN, Number.NaN))
  const lastReceiverVersionRef = useRef(-1)

  useEffect(() => () => geometry?.dispose(), [geometry])
  useLayoutEffect(() => {
    const anchor = anchorRef.current
    if (!anchor) {
      return
    }

    anchor.userData.ignoreLosRaycast = true
    anchor.traverse((child) => {
      child.userData.ignoreLosRaycast = true
      if (child instanceof THREE.Mesh) {
        child.raycast = () => {}
      }
    })
  }, [])

  useFrame(() => {
    const anchor = anchorRef.current
    if (!anchor) {
      return
    }

    const worldPosition = new THREE.Vector3()
    const worldQuaternion = new THREE.Quaternion()
    anchor.getWorldPosition(worldPosition)
    anchor.getWorldQuaternion(worldQuaternion)

    const samePosition = lastPositionRef.current.distanceToSquared(worldPosition) <= POSITION_EPSILON
    const sameRotation = Math.abs(lastQuaternionRef.current.angleTo(worldQuaternion)) <= QUATERNION_EPSILON
    const sameReceivers = lastReceiverVersionRef.current === receiverVersion
    if (samePosition && sameRotation && sameReceivers) {
      return
    }

    const nextGeometry = createProjectedGroundDecalGeometry({
      origin: worldPosition,
      receivers: getDecalReceiverMeshes(),
      size,
      anchorMatrixWorld: anchor.matrixWorld,
    })

    setGeometry((previous) => {
      previous?.dispose()
      return nextGeometry
    })

    lastPositionRef.current.copy(worldPosition)
    lastQuaternionRef.current.copy(worldQuaternion)
    lastReceiverVersionRef.current = receiverVersion
  })

  return (
    <group ref={anchorRef}>
      {geometry ? (
        <>
          <mesh geometry={geometry} renderOrder={2.9}>
            <meshBasicMaterial
              color={color}
              map={glowTexture}
              transparent
              opacity={Math.min(1, opacity * 0.9)}
              alphaTest={0.02}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-2}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          <mesh geometry={geometry} renderOrder={3}>
            <meshBasicMaterial
              color={color}
              map={coreTexture}
              transparent
              opacity={opacity}
              alphaTest={0.12}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-2}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </>
      ) : fallback ? (
        <>
          <mesh
            geometry={fallbackGeometry}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.02, 0]}
            scale={[size * 1.02, size * 1.02, 1]}
            renderOrder={2.9}
          >
            <meshBasicMaterial
              color={color}
              map={glowTexture}
              transparent
              opacity={Math.min(1, opacity * 0.9)}
              alphaTest={0.02}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
              toneMapped={false}
            />
          </mesh>
          <mesh
            geometry={fallbackGeometry}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.02, 0]}
            scale={[size, size, 1]}
            renderOrder={3}
          >
            <meshBasicMaterial
              color={color}
              map={coreTexture}
              transparent
              opacity={opacity}
              alphaTest={0.12}
              depthWrite={false}
              polygonOffset
              polygonOffsetFactor={-1}
              toneMapped={false}
            />
          </mesh>
        </>
      ) : null}
    </group>
  )
}

export function createProjectedGroundDecalGeometry({
  origin,
  receivers,
  size,
  anchorMatrixWorld,
}: {
  origin: THREE.Vector3
  receivers: THREE.Mesh[]
  size: number
  anchorMatrixWorld: THREE.Matrix4
}) {
  const hit = findProjectedGroundHit(origin, receivers)
  if (!hit) {
    return null
  }

  const decalPosition = hit.point.clone().addScaledVector(hit.normal, SURFACE_OFFSET)
  const orientation = getProjectedGroundOrientation()
  const geometry = new DecalGeometry(
    hit.object,
    decalPosition,
    orientation,
    new THREE.Vector3(size, size, PROJECTOR_DEPTH),
  )

  if (geometry.getAttribute('position').count === 0) {
    geometry.dispose()
    return null
  }

  geometry.applyMatrix4(new THREE.Matrix4().copy(anchorMatrixWorld).invert())
  return geometry
}

export function getProjectedGroundOrientation() {
  return new THREE.Euler().setFromQuaternion(
    new THREE.Quaternion().setFromUnitVectors(PROJECTOR_FORWARD, PROJECTOR_UP),
  )
}

export function findProjectedGroundHit(
  origin: THREE.Vector3,
  receivers: THREE.Mesh[],
  raycaster = new THREE.Raycaster(),
) {
  if (receivers.length === 0) {
    return null
  }

  const rayOrigin = origin.clone()
  rayOrigin.y += RAYCAST_START_HEIGHT
  raycaster.far = RAYCAST_START_HEIGHT + RAYCAST_MAX_DISTANCE
  raycaster.set(rayOrigin, RAYCAST_DIRECTION)

  const hit = raycaster.intersectObjects(receivers, false).find((candidate) => candidate.face && candidate.object.visible)
  if (!hit || !(hit.object instanceof THREE.Mesh) || !hit.face) {
    return null
  }

  return {
    object: hit.object,
    point: hit.point.clone(),
    normal: hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize(),
  } satisfies ProjectedGroundHit
}

let ringCoreTexture: THREE.CanvasTexture | null = null
let ringGlowTexture: THREE.CanvasTexture | null = null

function getRingCoreTexture() {
  if (ringCoreTexture) {
    return ringCoreTexture
  }

  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context is unavailable.')
  }

  context.clearRect(0, 0, size, size)
  context.strokeStyle = '#ffffff'
  context.lineWidth = 3
  context.beginPath()
  context.arc(size / 2, size / 2, 40, 0, Math.PI * 2)
  context.stroke()

  ringCoreTexture = new THREE.CanvasTexture(canvas)
  ringCoreTexture.colorSpace = THREE.SRGBColorSpace
  ringCoreTexture.needsUpdate = true
  return ringCoreTexture
}

function getRingGlowTexture() {
  if (ringGlowTexture) {
    return ringGlowTexture
  }

  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas 2D context is unavailable.')
  }

  context.clearRect(0, 0, size, size)
  context.strokeStyle = 'rgba(255, 255, 255, 0.9)'
  context.lineWidth = 4
  context.shadowColor = 'rgba(255, 255, 255, 1)'
  context.shadowBlur = 12
  context.beginPath()
  context.arc(size / 2, size / 2, 40, 0, Math.PI * 2)
  context.stroke()

  ringGlowTexture = new THREE.CanvasTexture(canvas)
  ringGlowTexture.colorSpace = THREE.SRGBColorSpace
  ringGlowTexture.needsUpdate = true
  return ringGlowTexture
}
