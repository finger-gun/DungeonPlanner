import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PropLight } from '../../content-packs/types'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { DungeonObjectRecord } from '../../store/useDungeonStore'
import type { PlayVisibility } from './playVisibility'
import { shouldRenderLineOfSightLight } from './losRendering'

export const DEFAULT_POOLED_PROP_LIGHTS = 32
const DORMANT_LIGHT_POSITION: [number, number, number] = [0, -1000, 0]
const NEAR_VIEW_LIGHT_MARGIN = 1.5
/** Minimum squared camera displacement before re-sorting the light pool. */
const CAMERA_DIRTY_THRESHOLD_SQ = 0.01
/**
 * Max age (seconds) before forcing a re-sort even when the camera is still,
 * so that visibility changes (e.g. player movement) are reflected promptly.
 */
const ASSIGNMENT_MAX_STALE_AGE_S = 0.5
const positionScratch = new THREE.Vector3()
const offsetScratch = new THREE.Vector3()
const rotationScratch = new THREE.Euler()
const sphereScratch = new THREE.Sphere()
const dormantColor = new THREE.Color('#000000')

export type PropLightPoolAssignment = {
  key: string
  position: [number, number, number]
  light: PropLight
}

/**
 * A pre-resolved light source — asset registry lookup is done once when the
 * objects list changes rather than inside the per-frame useFrame callback.
 */
export type PropLightSource = {
  key: string
  object: DungeonObjectRecord
  light: PropLight
}

/**
 * Pre-computes the list of objects that emit light.
 * Call this via useMemo so registry lookups only run when objects change,
 * not on every animation frame.
 */
export function precomputeLightSources(objects: DungeonObjectRecord[]): PropLightSource[] {
  return objects.flatMap((object) => {
    const asset = object.assetId ? getContentPackAssetById(object.assetId) : null
    const light = asset?.getLight?.(object.props) ?? asset?.metadata?.light ?? null
    return light ? [{ key: object.id, object, light }] : []
  })
}

export function PropLightPool({
  objects,
  visibility,
  maxLights = DEFAULT_POOLED_PROP_LIGHTS,
}: {
  objects: DungeonObjectRecord[]
  visibility: PlayVisibility
  maxLights?: number
}) {
  const lightRefs = useMemo(() => THREE.MathUtils.generateUUID(), [])
  const refs = useRef<Array<THREE.PointLight | null>>([])
  const lightFrustumRef = useRef(new THREE.Frustum())
  const projectionMatrixRef = useRef(new THREE.Matrix4())

  // Registry + getLight lookups are O(n_objects) — only redo when objects changes.
  const lightSources = useMemo(() => precomputeLightSources(objects), [objects])

  const assignmentsRef = useRef<PropLightPoolAssignment[]>([])
  // Initialise far away so the very first frame is always treated as dirty.
  const prevCameraPositionRef = useRef(new THREE.Vector3(0, -999999, 0))
  const prevLightSourcesRef = useRef<PropLightSource[] | null>(null)
  const lastRebuildTimeRef = useRef(-Infinity)

  // Reset cached state when the pool size changes so stale slot refs don't linger.
  useEffect(() => {
    assignmentsRef.current = []
    lastRebuildTimeRef.current = -Infinity
  }, [maxLights])

  useFrame(({ camera, clock }) => {
    const useLineOfSightPostMask = visibility.active && visibility.mask !== null
    const now = clock.elapsedTime

    const cameraMoved =
      camera.position.distanceToSquared(prevCameraPositionRef.current) > CAMERA_DIRTY_THRESHOLD_SQ
    const lightSourcesChanged = lightSources !== prevLightSourcesRef.current
    const stale = now - lastRebuildTimeRef.current > ASSIGNMENT_MAX_STALE_AGE_S

    if (cameraMoved || lightSourcesChanged || stale) {
      projectionMatrixRef.current.multiplyMatrices(
        camera.projectionMatrix,
        camera.matrixWorldInverse,
      )
      lightFrustumRef.current.setFromProjectionMatrix(projectionMatrixRef.current)

      assignmentsRef.current = buildPropLightPoolAssignments({
        lightSources,
        visibility,
        useLineOfSightPostMask,
        cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
        cameraFrustum: lightFrustumRef.current,
        maxLights,
      })

      prevCameraPositionRef.current.copy(camera.position)
      prevLightSourcesRef.current = lightSources
      lastRebuildTimeRef.current = now

      // Sync positions, colors, and distances — only needed when assignments change.
      for (let index = 0; index < maxLights; index += 1) {
        const pooledLight = refs.current[index]
        if (!pooledLight) {
          continue
        }

        const assignment = assignmentsRef.current[index]
        if (!assignment) {
          pooledLight.position.set(...DORMANT_LIGHT_POSITION)
          pooledLight.color.copy(dormantColor)
          pooledLight.intensity = 0
          pooledLight.distance = 0
          pooledLight.decay = 2
          continue
        }

        pooledLight.position.set(...assignment.position)
        pooledLight.color.set(assignment.light.color)
        pooledLight.distance = assignment.light.distance
        pooledLight.decay = assignment.light.decay ?? 2
        // Non-flickering intensity is stable between assignment changes.
        if (!assignment.light.flicker) {
          pooledLight.intensity = assignment.light.intensity
        }
      }
    }

    // Flicker runs every frame — cheap sin math that needs continuous motion.
    // This is decoupled from the expensive sort above.
    for (let index = 0; index < maxLights; index += 1) {
      const assignment = assignmentsRef.current[index]
      if (!assignment?.light.flicker) {
        continue
      }
      const pooledLight = refs.current[index]
      if (pooledLight) {
        pooledLight.intensity = getPooledLightIntensity(assignment, clock.elapsedTime)
      }
    }
  })

  return (
    <>
      {Array.from({ length: maxLights }, (_, index) => (
        <pointLight
          key={`${lightRefs}:${index}`}
          ref={(light) => {
            refs.current[index] = light
          }}
          position={DORMANT_LIGHT_POSITION}
          color="#000000"
          intensity={0}
          distance={0}
          decay={2}
          castShadow={false}
        />
      ))}
    </>
  )
}

export function buildPropLightPoolAssignments({
  lightSources,
  visibility,
  useLineOfSightPostMask,
  cameraPosition,
  cameraFrustum,
  maxLights,
}: {
  lightSources: PropLightSource[]
  visibility: Pick<PlayVisibility, 'getObjectVisibility'>
  useLineOfSightPostMask: boolean
  cameraPosition: readonly [number, number, number]
  cameraFrustum?: THREE.Frustum
  maxLights: number
}) {
  const candidates: Array<PropLightPoolAssignment & {
    distanceToCameraSquared: number
    viewPriority: 0 | 1
  }> = []

  lightSources.forEach(({ key, object, light }) => {
    const visibilityState = visibility.getObjectVisibility(object)
    if (!shouldRenderLineOfSightLight(visibilityState, useLineOfSightPostMask)) {
      return
    }

    const position = getPropLightWorldPosition(object, light.offset)
    const viewPriority = getPropLightViewPriority(cameraFrustum, position, light)
    if (viewPriority === null) {
      return
    }

    const dx = position[0] - cameraPosition[0]
    const dy = position[1] - cameraPosition[1]
    const dz = position[2] - cameraPosition[2]

    candidates.push({
      key,
      position,
      light,
      distanceToCameraSquared: dx * dx + dy * dy + dz * dz,
      viewPriority,
    })
  })

  candidates.sort((left, right) =>
    left.viewPriority - right.viewPriority
    || left.distanceToCameraSquared - right.distanceToCameraSquared
    || right.light.intensity - left.light.intensity
    || left.key.localeCompare(right.key),
  )

  return candidates.slice(0, maxLights)
}

export function getPropLightWorldPosition(
  object: Pick<DungeonObjectRecord, 'position' | 'rotation'>,
  offset?: [number, number, number],
): [number, number, number] {
  positionScratch.set(...object.position)
  if (!offset) {
    return positionScratch.toArray() as [number, number, number]
  }

  offsetScratch.set(...offset)
  rotationScratch.set(...object.rotation)
  offsetScratch.applyEuler(rotationScratch)
  positionScratch.add(offsetScratch)
  return positionScratch.toArray() as [number, number, number]
}

function getPropLightViewPriority(
  cameraFrustum: THREE.Frustum | undefined,
  position: [number, number, number],
  light: PropLight,
) {
  if (!cameraFrustum) {
    return 0
  }

  const lightDistance = Math.max(light.distance, 0)
  sphereScratch.center.set(...position)
  sphereScratch.radius = lightDistance
  if (cameraFrustum.intersectsSphere(sphereScratch)) {
    return 0
  }

  sphereScratch.radius = lightDistance + NEAR_VIEW_LIGHT_MARGIN
  if (cameraFrustum.intersectsSphere(sphereScratch)) {
    return 1
  }

  return null
}

function getPooledLightIntensity(assignment: PropLightPoolAssignment, elapsedTime: number) {
  if (!assignment.light.flicker) {
    return assignment.light.intensity
  }

  const phase = getStableLightPhase(assignment.key)
  const t = elapsedTime + phase
  const noise =
    Math.sin(t * 11.3) * 0.10 +
    Math.sin(t * 7.1) * 0.08 +
    Math.sin(t * 23.7) * 0.05

  return assignment.light.intensity * (1 + noise)
}

function getStableLightPhase(key: string) {
  let hash = 2166136261
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return (hash >>> 0) / 4294967296 * Math.PI * 2
}
