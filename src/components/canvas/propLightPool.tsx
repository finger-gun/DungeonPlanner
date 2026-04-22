import { useCallback, useLayoutEffect, useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { PropLight } from '../../content-packs/types'
import { getContentPackAssetById } from '../../content-packs/registry'
import { FORWARD_PLUS_LOCAL_LIGHT_SHADOWS } from '../../rendering/forwardPlusConfig'
import type { DungeonObjectRecord } from '../../store/useDungeonStore'
import { useDungeonStore } from '../../store/useDungeonStore'
import type { ObjectLightOverrides } from '../../store/lightOverrides'
import {
  getObjectLightOverrides,
  mergePropLightWithOverrides,
} from '../../store/lightOverrides'
import type { PlayVisibility } from './playVisibility'
import { shouldRenderLineOfSightLight } from './losRendering'

export const DEFAULT_POOLED_PROP_LIGHTS = 32
const NEAR_VIEW_LIGHT_MARGIN = 1.5
const DORMANT_LIGHT_POSITION: [number, number, number] = [0, -1000, 0]
const positionScratch = new THREE.Vector3()
const offsetScratch = new THREE.Vector3()
const rotationScratch = new THREE.Euler()
const sphereScratch = new THREE.Sphere()
const cameraProjectionMatrixScratch = new THREE.Matrix4()
const cameraPositionScratch = new THREE.Vector3()
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
export function precomputeLightSources(
  objects: DungeonObjectRecord[],
  previewOverrides: Record<string, ObjectLightOverrides> = {},
): PropLightSource[] {
  return objects.flatMap((object) => {
    const asset = object.assetId ? getContentPackAssetById(object.assetId) : null
    const baseLight = asset?.getLight?.(object.props) ?? asset?.metadata?.light ?? null
    if (!baseLight) {
      return []
    }

    const light = mergePropLightWithOverrides(
      baseLight,
      previewOverrides[object.id] ?? getObjectLightOverrides(object.props),
    )
    return light ? [{ key: object.id, object, light }] : []
  })
}

export function getDesiredPropLightPoolSize(lightSourceCount: number) {
  return Math.max(0, Math.floor(lightSourceCount))
}

export function getPropLightRenderCapacity(lightCount: number) {
  const safeCount = Math.max(0, Math.floor(lightCount))
  if (safeCount === 0) {
    return 0
  }

  return Math.ceil(safeCount / DEFAULT_POOLED_PROP_LIGHTS) * DEFAULT_POOLED_PROP_LIGHTS
}

export function distributeForwardPlusLightBudget(requestedCounts: number[], totalBudget: number) {
  const allocations = requestedCounts.map(() => 0)
  let remainingBudget = Math.max(0, Math.floor(totalBudget))

  for (let index = 0; index < requestedCounts.length; index += 1) {
    const requested = Math.max(0, Math.floor(requestedCounts[index] ?? 0))
    const allocated = Math.min(requested, remainingBudget)
    allocations[index] = allocated
    remainingBudget -= allocated
  }

  return allocations
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
  const { camera, invalidate, scene } = useThree()
  const refs = useRef<Array<THREE.PointLight | null>>([])
  const objectLightPreviewOverrides = useDungeonStore((state) => state.objectLightPreviewOverrides)
  const lightSources = useMemo(
    () => precomputeLightSources(objects, objectLightPreviewOverrides),
    [objects, objectLightPreviewOverrides],
  )
  const visibleAssignments = useMemo(
    () => collectVisiblePropLightAssignments({
      lightSources,
      visibility,
      useLineOfSightPostMask: visibility.active && visibility.mask !== null,
    }),
    [lightSources, visibility],
  )
  const hasFlicker = useMemo(
    () => visibleAssignments.some((assignment) => assignment.light.flicker),
    [visibleAssignments],
  )
  const renderCapacity = useMemo(() => getPropLightRenderCapacity(maxLights), [maxLights])
  const lastCameraMatrixElementsRef = useRef<Float32Array | null>(null)
  const lastProjectionMatrixElementsRef = useRef<Float32Array | null>(null)

  const publishAssignments = useCallback((elapsedTime: number) => {
    const cameraAwareAssignments =
      visibleAssignments.length > maxLights
        ? prioritizePropLightAssignments({
          assignments: visibleAssignments,
          cameraPosition: getCameraPosition(camera),
          cameraFrustum: getCameraFrustum(camera),
          maxLights,
        })
        : visibleAssignments.slice(0, maxLights)

    for (let index = 0; index < renderCapacity; index += 1) {
      const pooledLight = refs.current[index]
      if (!pooledLight) {
        continue
      }

      const assignment = cameraAwareAssignments[index]
      if (!assignment) {
        pooledLight.visible = false
        pooledLight.position.set(...DORMANT_LIGHT_POSITION)
        pooledLight.color.copy(dormantColor)
        pooledLight.intensity = 0
        pooledLight.distance = 0
        pooledLight.decay = 2
        continue
      }

      pooledLight.visible = true
      pooledLight.position.set(...assignment.position)
      pooledLight.color.set(assignment.light.color)
      pooledLight.distance = assignment.light.distance
      pooledLight.decay = assignment.light.decay ?? 2
      pooledLight.intensity = getPooledLightIntensity(assignment, elapsedTime)
    }
  }, [camera, maxLights, renderCapacity, visibleAssignments])

  useLayoutEffect(() => {
    while (refs.current.length < renderCapacity) {
      const pooledLight = new THREE.PointLight('#000000', 0, 0, 2)
      pooledLight.castShadow = FORWARD_PLUS_LOCAL_LIGHT_SHADOWS
      pooledLight.position.set(...DORMANT_LIGHT_POSITION)
      pooledLight.visible = false
      refs.current.push(pooledLight)
      scene.add(pooledLight)
    }

    while (refs.current.length > renderCapacity) {
      const pooledLight = refs.current.pop()
      if (!pooledLight) {
        continue
      }
      scene.remove(pooledLight)
    }

    return () => {
      refs.current.forEach((pooledLight) => {
        if (pooledLight) {
          scene.remove(pooledLight)
        }
      })
      refs.current = []
    }
  }, [renderCapacity, scene])

  useLayoutEffect(() => {
    publishAssignments(0)
    invalidate()
  }, [invalidate, publishAssignments])

  useFrame(({ clock }) => {
    const cameraAwareSelection = visibleAssignments.length > maxLights
    const cameraChanged = cameraAwareSelection && hasCameraChanged(
      camera,
      lastCameraMatrixElementsRef,
      lastProjectionMatrixElementsRef,
    )

    if (!hasFlicker && !cameraChanged) {
      return
    }

    publishAssignments(clock.elapsedTime)
    invalidate()
  })

  return null
}

export function collectVisiblePropLightAssignments({
  lightSources,
  visibility,
  useLineOfSightPostMask,
}: {
  lightSources: PropLightSource[]
  visibility: Pick<PlayVisibility, 'getObjectVisibility'>
  useLineOfSightPostMask: boolean
}) {
  const candidates: PropLightPoolAssignment[] = []

  lightSources.forEach(({ key, object, light }) => {
    const visibilityState = visibility.getObjectVisibility(object)
    if (!shouldRenderLineOfSightLight(visibilityState, useLineOfSightPostMask)) {
      return
    }

    candidates.push({
      key,
      position: getPropLightWorldPosition(object, light.offset),
      light,
    })
  })

  candidates.sort((left, right) =>
    right.light.intensity - left.light.intensity
    || left.key.localeCompare(right.key),
  )

  return candidates
}

export function buildVisiblePropLightAssignments({
  lightSources,
  visibility,
  useLineOfSightPostMask,
  maxLights,
}: {
  lightSources: PropLightSource[]
  visibility: Pick<PlayVisibility, 'getObjectVisibility'>
  useLineOfSightPostMask: boolean
  maxLights: number
}) {
  return collectVisiblePropLightAssignments({
    lightSources,
    visibility,
    useLineOfSightPostMask,
  }).slice(0, maxLights)
}

export function prioritizePropLightAssignments({
  assignments,
  cameraPosition,
  cameraFrustum,
  maxLights,
}: {
  assignments: PropLightPoolAssignment[]
  cameraPosition: readonly [number, number, number]
  cameraFrustum?: THREE.Frustum
  maxLights: number
}) {
  const candidates: Array<PropLightPoolAssignment & {
    distanceToCameraSquared: number
    viewPriority: 0 | 1
  }> = []

  assignments.forEach((assignment) => {
    const viewPriority = getPropLightViewPriority(cameraFrustum, assignment.position, assignment.light)
    if (viewPriority === null) {
      return
    }

    const dx = assignment.position[0] - cameraPosition[0]
    const dy = assignment.position[1] - cameraPosition[1]
    const dz = assignment.position[2] - cameraPosition[2]

    candidates.push({
      ...assignment,
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
  return prioritizePropLightAssignments({
    assignments: collectVisiblePropLightAssignments({
      lightSources,
      visibility,
      useLineOfSightPostMask,
    }),
    cameraPosition,
    cameraFrustum,
    maxLights,
  })
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

function getCameraFrustum(camera: THREE.Camera) {
  return new THREE.Frustum().setFromProjectionMatrix(
    cameraProjectionMatrixScratch.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  )
}

function getCameraPosition(camera: THREE.Camera): [number, number, number] {
  camera.getWorldPosition(cameraPositionScratch)
  return [cameraPositionScratch.x, cameraPositionScratch.y, cameraPositionScratch.z]
}

function hasCameraChanged(
  camera: THREE.Camera,
  lastCameraMatrixElementsRef: MutableRefObject<Float32Array | null>,
  lastProjectionMatrixElementsRef: MutableRefObject<Float32Array | null>,
) {
  const worldChanged = copyMatrixElements(camera.matrixWorld, lastCameraMatrixElementsRef)
  const projectionChanged = copyMatrixElements(camera.projectionMatrix, lastProjectionMatrixElementsRef)
  return worldChanged || projectionChanged
}

function copyMatrixElements(
  matrix: THREE.Matrix4,
  targetRef: MutableRefObject<Float32Array | null>,
) {
  const source = matrix.elements
  const cached = targetRef.current ?? new Float32Array(source.length)

  let changed = targetRef.current === null
  for (let index = 0; index < source.length; index += 1) {
    if (cached[index] !== source[index]) {
      changed = true
      cached[index] = source[index]
    }
  }

  targetRef.current = cached
  return changed
}
