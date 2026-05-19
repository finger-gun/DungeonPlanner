import * as THREE from 'three'
import type { PlayVisibility } from '../playVisibility'
import { shouldRenderLineOfSightLight } from '../losRendering'
import type { RegisteredEffectSource } from '../objectSourceRegistry'
import { getObjectLocalOffsetWorldPosition } from '../../../rendering/dungeonLightField'

export const MAX_FIRE_EMITTERS = 256

const FIRE_EMITTER_FRUSTUM_MARGIN = 1.5
const frustumSphereScratch = new THREE.Sphere()

export type ActiveFireEmitter = {
  id: string
  worldX: number
  worldY: number
  worldZ: number
  scale: number
  intensity: number
  color: string
}

export function buildActiveFireEmitters({
  effectSources,
  visibility,
  useLineOfSightPostMask,
  cameraFrustum,
  maxEmitters = MAX_FIRE_EMITTERS,
}: {
  effectSources: RegisteredEffectSource[]
  visibility: Pick<PlayVisibility, 'getObjectVisibility'>
  useLineOfSightPostMask: boolean
  cameraFrustum?: THREE.Frustum
  maxEmitters?: number
}) {
  const result: ActiveFireEmitter[] = []

  for (const source of effectSources) {
    if (!shouldRenderLineOfSightLight(visibility.getObjectVisibility(source.object), useLineOfSightPostMask)) {
      continue
    }

    const emitters = source.effect.emitters?.length ? source.effect.emitters : [{}]
    for (let emIdx = 0; emIdx < emitters.length && result.length < maxEmitters; emIdx += 1) {
      const em = emitters[emIdx]
      const [worldX, worldY, worldZ] = getObjectLocalOffsetWorldPosition(
        source.object,
        (em.offset ?? [0, 0, 0]) as [number, number, number],
      )
      const scale = em.scale ?? 1

      if (cameraFrustum) {
        frustumSphereScratch.center.set(worldX, worldY, worldZ)
        frustumSphereScratch.radius = scale + FIRE_EMITTER_FRUSTUM_MARGIN
        if (!cameraFrustum.intersectsSphere(frustumSphereScratch)) {
          continue
        }
      }

      result.push({
        id: `${source.object.id}:${emIdx}`,
        worldX,
        worldY,
        worldZ,
        scale,
        intensity: em.intensity ?? 1,
        color: em.color ?? '#ff9944',
      })
    }
  }

  return result
}
