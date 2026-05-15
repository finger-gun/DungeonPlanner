import type { MutableRefObject } from 'react'
import * as THREE from 'three'
import type { PropLight } from '../../content-packs/types'
import { getStableLightPhase } from '../../rendering/lightFlickerMath'
import {
  DEFAULT_DYNAMIC_LIGHT_POOL_SIZE,
  getPropLightWorldPosition as getResolvedPropLightWorldPosition,
  resolveObjectLightSources,
  type ResolvedDungeonLightSource,
} from '../../rendering/dungeonLightField'
import type { DungeonObjectRecord } from '../../store/useDungeonStore'
import type { ObjectLightOverrides } from '../../store/lightOverrides'
import type { PlayVisibility } from './playVisibility'
import { shouldRenderLineOfSightLight } from './losRendering'

export const MAX_DYNAMIC_PROP_LIGHTS = DEFAULT_DYNAMIC_LIGHT_POOL_SIZE
export const DEFAULT_POOLED_PROP_LIGHTS = MAX_DYNAMIC_PROP_LIGHTS

const NEAR_VIEW_LIGHT_MARGIN = 1.5
const DORMANT_LIGHT_POSITION: [number, number, number] = [0, -1000, 0]
const sphereScratch = new THREE.Sphere()
const cameraProjectionMatrixScratch = new THREE.Matrix4()
const cameraPositionScratch = new THREE.Vector3()
const dormantColor = new THREE.Color('#000000')

export type PropLightPoolAssignment = {
  key: string
  position: [number, number, number]
  light: PropLight
}

export type PropLightSource = ResolvedDungeonLightSource

export function precomputeLightSources(
  objects: DungeonObjectRecord[],
  previewOverrides: Record<string, ObjectLightOverrides> = {},
): PropLightSource[] {
  return resolveObjectLightSources(objects, previewOverrides)
}

export function getDesiredPropLightPoolSize(lightSourceCount: number) {
  return Math.max(0, Math.floor(lightSourceCount))
}

export function getPropLightRenderCapacity(lightCount: number) {
  return Math.max(0, Math.floor(lightCount))
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

export function applyPropLightPoolAssignment(
  pooledLight: THREE.PointLight,
  assignment: PropLightPoolAssignment | undefined,
  elapsedTime: number,
  flickerEnabled = true,
) {
  if (!assignment) {
    pooledLight.position.set(...DORMANT_LIGHT_POSITION)
    pooledLight.color.copy(dormantColor)
    pooledLight.intensity = 0
    pooledLight.distance = 0
    pooledLight.decay = 2
    pooledLight.visible = false
    return
  }

  pooledLight.position.set(...assignment.position)
  pooledLight.color.set(assignment.light.color)
  pooledLight.distance = assignment.light.distance
  pooledLight.decay = assignment.light.decay ?? 2
  pooledLight.intensity = getPooledLightIntensity(assignment, elapsedTime, flickerEnabled)
  pooledLight.visible = true
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
  return getResolvedPropLightWorldPosition(object, offset)
}

export function getCameraFrustum(camera: THREE.Camera) {
  return new THREE.Frustum().setFromProjectionMatrix(
    cameraProjectionMatrixScratch.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse),
  )
}

export function hasCameraChanged(
  camera: THREE.Camera,
  lastCameraMatrixElementsRef: MutableRefObject<Float32Array | null>,
  lastProjectionMatrixElementsRef: MutableRefObject<Float32Array | null>,
) {
  const worldChanged = copyMatrixElements(camera.matrixWorld, lastCameraMatrixElementsRef)
  const projectionChanged = copyMatrixElements(camera.projectionMatrix, lastProjectionMatrixElementsRef)
  return worldChanged || projectionChanged
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

function getPooledLightIntensity(
  assignment: PropLightPoolAssignment,
  elapsedTime: number,
  flickerEnabled: boolean,
) {
  if (!flickerEnabled || !assignment.light.flicker) {
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

export function getCameraPosition(camera: THREE.Camera): [number, number, number] {
  camera.getWorldPosition(cameraPositionScratch)
  return [cameraPositionScratch.x, cameraPositionScratch.y, cameraPositionScratch.z]
}
