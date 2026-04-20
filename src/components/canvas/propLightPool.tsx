import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PropLight } from '../../content-packs/types'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { DungeonObjectRecord } from '../../store/useDungeonStore'
import type { PlayVisibility } from './playVisibility'
import { shouldRenderLineOfSightLight } from './losRendering'

const DEFAULT_POOLED_PROP_LIGHTS = 32
const DORMANT_LIGHT_POSITION: [number, number, number] = [0, -1000, 0]
const NEAR_VIEW_LIGHT_MARGIN = 1.5
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

  useFrame(({ camera, clock }) => {
    camera.updateMatrixWorld()
    projectionMatrixRef.current.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    )
    lightFrustumRef.current.setFromProjectionMatrix(projectionMatrixRef.current)

    const assignments = buildPropLightPoolAssignments({
      objects,
      visibility,
      useLineOfSightPostMask: visibility.active && visibility.mask !== null,
      cameraPosition: [camera.position.x, camera.position.y, camera.position.z],
      cameraFrustum: lightFrustumRef.current,
      maxLights,
    })

    for (let index = 0; index < maxLights; index += 1) {
      const pooledLight = refs.current[index]
      if (!pooledLight) {
        continue
      }

      const assignment = assignments[index]
      if (!assignment) {
        pooledLight.position.set(...DORMANT_LIGHT_POSITION)
        pooledLight.color.copy(dormantColor)
        pooledLight.intensity = 0
        pooledLight.distance = 0
        pooledLight.decay = 2
        pooledLight.castShadow = false
        continue
      }

      pooledLight.position.set(...assignment.position)
      pooledLight.color.set(assignment.light.color)
      pooledLight.distance = assignment.light.distance
      pooledLight.decay = assignment.light.decay ?? 2
      pooledLight.castShadow = assignment.light.castShadow ?? false
      pooledLight.intensity = getPooledLightIntensity(assignment, clock.elapsedTime)
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
  objects,
  visibility,
  useLineOfSightPostMask,
  cameraPosition,
  cameraFrustum,
  maxLights,
}: {
  objects: DungeonObjectRecord[]
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

  objects.forEach((object) => {
    const asset = object.assetId ? getContentPackAssetById(object.assetId) : null
    const light = asset?.getLight?.(object.props) ?? asset?.metadata?.light ?? null
    if (!light) {
      return
    }

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
      key: object.id,
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
