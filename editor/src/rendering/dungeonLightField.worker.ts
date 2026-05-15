import { GRID_SIZE, cellToWorldPosition } from '../hooks/useSnapToGrid'
import { doesLineIntersectClosedWall, isCornerBlockedBySolidWall } from './dungeonLightFieldOcclusion'
import { BAKED_FLICKER_COEFFICIENT_SCALE, getStableLightFlickerCoefficients } from './lightFlickerMath'
import type {
  BakedFloorLightFieldWorkerInput,
  BakedFloorLightFieldWorkerResult,
  BakedLightSample,
} from './dungeonLightField'

const DEFAULT_BAKED_LIGHT_CHANNEL_CAP = 0.9
const BAKED_LIGHT_DISTANCE_SCALE = 1.18
const BAKED_LIGHT_NEAR_FIELD_BOOST = 0.42
const BAKED_LIGHT_NEAR_FIELD_FRACTION = 0.38

type WorkerLightSource = {
  key: string
  position: [number, number, number]
  linearColor: [number, number, number]
  light: {
    intensity: number
    distance: number
    decay: number
  }
}

type WorkerOcclusion = {
  solidWalls: ReadonlySet<string>
  cornerBlockingWalls: ReadonlySet<string>
}

self.addEventListener('message', (event) => {
  const { requestId, input } = event.data as {
    requestId: number
    input: BakedFloorLightFieldWorkerInput
  }

  const result = buildBakedFloorLightFieldWorkerResult(input)
  self.postMessage({ requestId, result })
})

function buildBakedFloorLightFieldWorkerResult(
  input: BakedFloorLightFieldWorkerInput,
): BakedFloorLightFieldWorkerResult {
  const occlusion = input.solidWalls.length > 0
    ? {
      solidWalls: new Set(input.solidWalls),
      cornerBlockingWalls: new Set(input.cornerBlockingWalls),
    } satisfies WorkerOcclusion
    : null
  const staticLightSources = hydrateWorkerLightSources(input.staticLightSources)
  const flickerStaticLightSources = hydrateWorkerLightSources(input.flickerStaticLightSources)
  const sampleUpdates: BakedFloorLightFieldWorkerResult['sampleUpdates'] = []
  const cornerUpdates: BakedFloorLightFieldWorkerResult['cornerUpdates'] = []

  input.chunks.forEach((chunk) => {
    chunk.cellKeys.forEach((cellKey) => {
      const [cellX, cellZ] = cellKey.split(':').map((value) => Number.parseInt(value, 10))
      sampleUpdates.push({
        cellKey,
        sample: sampleStaticLightAtWorldPosition(
          staticLightSources,
          cellToWorldPosition([cellX, cellZ]),
          occlusion,
        ),
      })
    })

    for (let cellZ = chunk.minCellZ; cellZ <= chunk.maxCellZ + 1; cellZ += 1) {
      for (let cellX = chunk.minCellX; cellX <= chunk.maxCellX + 1; cellX += 1) {
        const blocked = occlusion && isCornerBlockedBySolidWall(cellX, cellZ, occlusion.cornerBlockingWalls)
        const sample = blocked
          ? [0, 0, 0] as const
          : sampleStaticLightAtWorldPosition(
            staticLightSources,
            [cellX * GRID_SIZE, 0, cellZ * GRID_SIZE],
            occlusion,
          )
        const [flickerBand0, flickerBand1, flickerBand2] = blocked
          ? [[0, 0, 0] as const, [0, 0, 0] as const, [0, 0, 0] as const]
          : sampleFlickerStaticLightBasisCoefficientsAtWorldPosition(
            flickerStaticLightSources,
            [cellX * GRID_SIZE, 0, cellZ * GRID_SIZE],
            occlusion,
          )
        cornerUpdates.push({
          key: `${cellX}:${cellZ}`,
          cellX,
          cellZ,
          sample,
          flickerBand0: flickerStaticLightSources.length > 0 ? flickerBand0 : null,
          flickerBand1: flickerStaticLightSources.length > 0 ? flickerBand1 : null,
          flickerBand2: flickerStaticLightSources.length > 0 ? flickerBand2 : null,
        })
      }
    }
  })

  return {
    floorId: input.floorId,
    sourceHash: input.sourceHash,
    sampleUpdates,
    cornerUpdates,
  }
}

function hydrateWorkerLightSources(
  lightSources: BakedFloorLightFieldWorkerInput['staticLightSources'],
): WorkerLightSource[] {
  return lightSources.map((lightSource) => ({ ...lightSource }))
}

function sampleFlickerStaticLightBasisCoefficientsAtWorldPosition(
  staticLightSources: WorkerLightSource[],
  worldPosition: readonly [number, number, number],
  occlusion: WorkerOcclusion | null = null,
) {
  const flickerBand0 = [0, 0, 0] as [number, number, number]
  const flickerBand1 = [0, 0, 0] as [number, number, number]
  const flickerBand2 = [0, 0, 0] as [number, number, number]

  staticLightSources.forEach((lightSource) => {
    const dx = lightSource.position[0] - worldPosition[0]
    const dy = lightSource.position[1] - worldPosition[1]
    const dz = lightSource.position[2] - worldPosition[2]
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const falloff = getBakedLightDistanceFalloff(lightSource.light, distance)
    if (falloff <= 0) {
      return
    }
    if (occlusion && !hasWorkerLightLineOfSight(lightSource.position, worldPosition, occlusion.solidWalls)) {
      return
    }

    const contribution = lightSource.light.intensity * falloff
    const [coefficient0, coefficient1, coefficient2] = getStableLightFlickerCoefficients(lightSource.key)
    const flickerContribution = contribution * BAKED_FLICKER_COEFFICIENT_SCALE
    flickerBand0[0] += lightSource.linearColor[0] * flickerContribution * coefficient0
    flickerBand0[1] += lightSource.linearColor[1] * flickerContribution * coefficient0
    flickerBand0[2] += lightSource.linearColor[2] * flickerContribution * coefficient0
    flickerBand1[0] += lightSource.linearColor[0] * flickerContribution * coefficient1
    flickerBand1[1] += lightSource.linearColor[1] * flickerContribution * coefficient1
    flickerBand1[2] += lightSource.linearColor[2] * flickerContribution * coefficient1
    flickerBand2[0] += lightSource.linearColor[0] * flickerContribution * coefficient2
    flickerBand2[1] += lightSource.linearColor[1] * flickerContribution * coefficient2
    flickerBand2[2] += lightSource.linearColor[2] * flickerContribution * coefficient2
  })

  return [
    clampSignedBakedLightSample(flickerBand0),
    clampSignedBakedLightSample(flickerBand1),
    clampSignedBakedLightSample(flickerBand2),
  ] as const
}

function sampleStaticLightAtWorldPosition(
  staticLightSources: WorkerLightSource[],
  worldPosition: readonly [number, number, number],
  occlusion: WorkerOcclusion | null = null,
): BakedLightSample {
  let red = 0
  let green = 0
  let blue = 0

  staticLightSources.forEach((lightSource) => {
    const dx = lightSource.position[0] - worldPosition[0]
    const dy = lightSource.position[1] - worldPosition[1]
    const dz = lightSource.position[2] - worldPosition[2]
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz)
    const falloff = getBakedLightDistanceFalloff(lightSource.light, distance)
    if (falloff <= 0) {
      return
    }
    if (occlusion && !hasWorkerLightLineOfSight(lightSource.position, worldPosition, occlusion.solidWalls)) {
      return
    }

    const intensity = lightSource.light.intensity * falloff
    red += lightSource.linearColor[0] * intensity
    green += lightSource.linearColor[1] * intensity
    blue += lightSource.linearColor[2] * intensity
  })

  return clampBakedLightSample([red, green, blue])
}

function getBakedLightDistanceFalloff(
  light: Pick<WorkerLightSource['light'], 'distance' | 'decay'>,
  distance: number,
) {
  const maxDistance = Math.max(light.distance, 0)
  const extendedDistance = maxDistance * BAKED_LIGHT_DISTANCE_SCALE
  if (extendedDistance <= 0 || distance >= extendedDistance) {
    return 0
  }

  const normalizedDistance = 1 - distance / extendedDistance
  const softenedDecay = Math.max(1, (light.decay ?? 2) * 0.82)
  const baseFalloff = Math.pow(normalizedDistance, softenedDecay)
  const nearFieldDistance = Math.max(maxDistance * BAKED_LIGHT_NEAR_FIELD_FRACTION, Number.EPSILON)
  const nearFieldFactor = clamp01(1 - distance / nearFieldDistance)
  return baseFalloff * (1 + nearFieldFactor * BAKED_LIGHT_NEAR_FIELD_BOOST)
}

function clampBakedLightSample([red, green, blue]: readonly [number, number, number]): BakedLightSample {
  const maxChannel = Math.max(red, green, blue)
  if (maxChannel <= DEFAULT_BAKED_LIGHT_CHANNEL_CAP || maxChannel <= 0) {
    return [red, green, blue]
  }

  const scale = DEFAULT_BAKED_LIGHT_CHANNEL_CAP / maxChannel
  return [red * scale, green * scale, blue * scale]
}

function clampSignedBakedLightSample([red, green, blue]: readonly [number, number, number]): BakedLightSample {
  const maxChannel = Math.max(Math.abs(red), Math.abs(green), Math.abs(blue))
  if (maxChannel <= DEFAULT_BAKED_LIGHT_CHANNEL_CAP || maxChannel <= 0) {
    return [red, green, blue]
  }

  const scale = DEFAULT_BAKED_LIGHT_CHANNEL_CAP / maxChannel
  return [red * scale, green * scale, blue * scale]
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value))
}

function hasWorkerLightLineOfSight(
  originWorld: readonly [number, number, number],
  targetWorld: readonly [number, number, number],
  closedWalls: ReadonlySet<string>,
) {
  return !doesLineIntersectClosedWall(originWorld, targetWorld, closedWalls)
}
