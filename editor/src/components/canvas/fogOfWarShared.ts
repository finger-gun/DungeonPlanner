/* eslint-disable @typescript-eslint/no-explicit-any */
import * as THREE from 'three'
import { StorageTexture } from 'three/webgpu'
import {
  attribute,
  float,
  fract,
  floor,
  int,
  max,
  materialColor,
  mix,
  positionWorld,
  sin,
  smoothstep,
  vec2,
  vec3,
} from 'three/tsl'
import { GRID_SIZE, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import { getOpeningSegments } from '../../store/openingSegments'
import { getMirroredWallKey, type InnerWallRecord } from '../../store/manualWalls'
import { useDungeonStore, type OpeningRecord } from '../../store/useDungeonStore'

const PLAYER_VISION_RANGE_CELLS = 8
const VISION_RADIUS_WORLD = PLAYER_VISION_RANGE_CELLS * GRID_SIZE
const OCCUPANCY_SUBDIVISIONS = 4
const OCCUPANCY_CELL_SIZE = GRID_SIZE / OCCUPANCY_SUBDIVISIONS
export const FOG_VISIBILITY_MASK_SIZE = 256
export const FOG_VISIBILITY_MASK_ORIGIN_CAPACITY = 8
const FOG_VISIBILITY_MASK_JITTER_TEXELS = 0.65
const FOG_GRID_MAX_WIDTH = 128
const FOG_GRID_MAX_HEIGHT = 128
const GPU_LOS_DDA_MAX_STEPS = getFogOfWarDdaMaxSteps()

type FogOfWarLayout = {
  minCellX: number
  minCellZ: number
  width: number
  height: number
  occupancyWidth: number
  occupancyHeight: number
  occupancy: Int32Array
}

export type FogOfWarRuntime = {
  occupancy: any
  exploredStates: any
  visibilityMasks: any[]
  visibilityMaskTextures: StorageTexture[]
  visibilityMaskComputes: any[]
  playerOrigins: any[]
  minCellX: any
  minCellZ: any
  width: any
  height: any
  cellSize: any
  minWorldX: any
  minWorldZ: any
  occupancyWidth: any
  occupancyHeight: any
  occupancyCellSize: any
  originCount: any
  visionRadius: any
  visionEdge: any
}

type FogOfWarVariant = 'floor' | 'wall' | 'prop'

type FogAwareMaterial = THREE.Material & {
  isNodeMaterial?: boolean
  colorNode?: unknown
  emissiveNode?: unknown
  metalnessNode?: unknown
  roughnessNode?: unknown
  opacityNode?: unknown
  emissive?: THREE.Color
  metalness?: number
  roughness?: number
  opacity?: number
}

type FogOfWarMaterialOptions = {
  variant: FogOfWarVariant
  cell?: readonly [number, number] | null
  useCellAttribute?: boolean
}

type WallDirection = 'north' | 'south' | 'east' | 'west'

const WALL_DIRECTIONS: Record<WallDirection, { delta: GridCell }> = {
  north: { delta: [0, 1] },
  south: { delta: [0, -1] },
  east: { delta: [1, 0] },
  west: { delta: [-1, 0] },
}

export function applyFogOfWarToMaterial(
  material: THREE.Material,
  runtime: FogOfWarRuntime | null,
  options: FogOfWarMaterialOptions,
) {
  const fogMaterial = material as FogAwareMaterial
  if (!fogMaterial.isNodeMaterial) {
    return
  }

  const nextFogSignature = runtime
    ? `${options.variant}:${options.useCellAttribute ? 'cell-attribute' : 'world'}:${options.cell?.join(':') ?? 'dynamic'}`
    : 'off'
  const previousFogSignature = fogMaterial.userData.fogOfWarSignature ?? null
  if (previousFogSignature === nextFogSignature) {
    return
  }

  if (runtime) {
    if (!Object.prototype.hasOwnProperty.call(fogMaterial.userData, 'fogOfWarBaseColorNode')) {
      fogMaterial.userData.fogOfWarBaseColorNode = fogMaterial.colorNode ?? null
      fogMaterial.userData.fogOfWarBaseEmissiveNode = fogMaterial.emissiveNode ?? null
      fogMaterial.userData.fogOfWarBaseMetalnessNode = fogMaterial.metalnessNode ?? null
      fogMaterial.userData.fogOfWarBaseRoughnessNode = fogMaterial.roughnessNode ?? null
      fogMaterial.userData.fogOfWarBaseOpacityNode = fogMaterial.opacityNode ?? null
      fogMaterial.userData.fogOfWarBaseOpacity = fogMaterial.opacity ?? 1
      fogMaterial.userData.fogOfWarBaseAlphaTest = fogMaterial.alphaTest ?? 0
    }

    const nodes = createFogOfWarNodes(runtime, fogMaterial, options)
    fogMaterial.colorNode = nodes.colorNode
    fogMaterial.emissiveNode = nodes.emissiveNode
    fogMaterial.metalnessNode = nodes.metalnessNode
    fogMaterial.roughnessNode = nodes.roughnessNode
    fogMaterial.opacityNode = nodes.opacityNode
    fogMaterial.alphaTest = Math.max(fogMaterial.userData.fogOfWarBaseAlphaTest ?? 0, 0.001)
  } else if (Object.prototype.hasOwnProperty.call(fogMaterial.userData, 'fogOfWarBaseColorNode')) {
    fogMaterial.colorNode = fogMaterial.userData.fogOfWarBaseColorNode
    fogMaterial.emissiveNode = fogMaterial.userData.fogOfWarBaseEmissiveNode ?? null
    fogMaterial.metalnessNode = fogMaterial.userData.fogOfWarBaseMetalnessNode ?? null
    fogMaterial.roughnessNode = fogMaterial.userData.fogOfWarBaseRoughnessNode ?? null
    fogMaterial.opacityNode = fogMaterial.userData.fogOfWarBaseOpacityNode ?? null
    fogMaterial.alphaTest = fogMaterial.userData.fogOfWarBaseAlphaTest ?? 0
  }

  fogMaterial.userData.fogOfWarSignature = nextFogSignature
  if (previousFogSignature !== nextFogSignature) {
    fogMaterial.needsUpdate = true
  }
}

export function applyFogOfWarToObject(
  object: THREE.Object3D,
  runtime: FogOfWarRuntime | null,
  options: FogOfWarMaterialOptions,
) {
  object.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) {
      return
    }

    if (Array.isArray(child.material)) {
      child.material.forEach((material) => applyFogOfWarToMaterial(material, runtime, options))
      return
    }

    if (child.material instanceof THREE.Material) {
      applyFogOfWarToMaterial(child.material, runtime, options)
    }
  })
}

function createFogOfWarNodes(
  runtime: FogOfWarRuntime,
  material: FogAwareMaterial,
  options: FogOfWarMaterialOptions,
) {
  const visibilityFactor: any = createVisibilityFactorNode(runtime)
  const exploredFactor = sampleExploredFactorNode(runtime, options)
  const hasExploredMemory = exploredFactor.greaterThan(float(0.5))
  const baseColor = vec3((material.userData.fogOfWarBaseColorNode ?? materialColor) as never)
  const baseEmissive = vec3(
    (material.userData.fogOfWarBaseEmissiveNode
      ?? vec3(material.emissive?.r ?? 0, material.emissive?.g ?? 0, material.emissive?.b ?? 0)) as never,
  )
  const baseMetalness = float(
    (material.userData.fogOfWarBaseMetalnessNode ?? material.metalness ?? 0) as never,
  )
  const baseRoughness = float(
    (material.userData.fogOfWarBaseRoughnessNode ?? material.roughness ?? 1) as never,
  )
  const baseOpacity = float(
    (material.userData.fogOfWarBaseOpacityNode ?? material.userData.fogOfWarBaseOpacity ?? 1) as never,
  )
  const exploredColor = mix(vec3(float(0.05), float(0.055), float(0.065)), baseColor, float(0.34))
  const exploredEmissive = baseEmissive.mul(float(0.18))
  const exploredMetalness = baseMetalness.mul(float(0.1))
  const visibilityInverse = float(1).sub(visibilityFactor)
  const exploredRoughness = baseRoughness.mul(float(0.15)).add(float(0.85))
  const hiddenColor = vec3(0, 0, 0)
  const hiddenEmissive = vec3(0, 0, 0)
  const hiddenMetalness = float(0)
  const hiddenRoughness = float(1)
  const memoryColor = hasExploredMemory.select(exploredColor, hiddenColor)
  const memoryEmissive = hasExploredMemory.select(exploredEmissive, hiddenEmissive)
  const memoryMetalness = hasExploredMemory.select(exploredMetalness, hiddenMetalness)
  const memoryRoughness = hasExploredMemory.select(exploredRoughness, hiddenRoughness)
  const visibleBinary = visibilityFactor.greaterThan(float(0.001))

  return {
    colorNode: mix(memoryColor, baseColor, visibilityFactor),
    emissiveNode: mix(memoryEmissive, baseEmissive, visibilityFactor),
    metalnessNode: memoryMetalness.mul(visibilityInverse).add(baseMetalness.mul(visibilityFactor)),
    roughnessNode: memoryRoughness.mul(visibilityInverse).add(baseRoughness.mul(visibilityFactor)),
    opacityNode: hasExploredMemory.select(
      baseOpacity,
      visibleBinary.select(baseOpacity, float(0)),
    ),
  }
}

function createVisibilityFactorNode(runtime: FogOfWarRuntime) {
  const worldXZ = positionWorld.xz as any
  const originCount = int(runtime.originCount)
  const maskSizeWorld = runtime.visionRadius.mul(float(2))
  let combinedVisibility: any = float(0)

  runtime.visibilityMasks.forEach((visibilityMask, index) => {
    const playerOrigin = runtime.playerOrigins[index]
    const originEnabled = originCount.greaterThan(int(index))
    const maskMinWorld = playerOrigin.sub(vec2(runtime.visionRadius, runtime.visionRadius))
    const maskUv = worldXZ.sub(maskMinWorld).div(maskSizeWorld)
    const inBounds = maskUv.x.greaterThanEqual(float(0))
      .and(maskUv.y.greaterThanEqual(float(0)))
      .and(maskUv.x.lessThanEqual(float(1)))
      .and(maskUv.y.lessThanEqual(float(1)))
    const sampledVisibility = sampleVisibilityMaskNode(visibilityMask, maskUv, worldXZ, playerOrigin)
    const radiusMask = float(1).sub(
      smoothstep(
        runtime.visionRadius.sub(runtime.visionEdge),
        runtime.visionRadius,
        worldXZ.sub(playerOrigin).length(),
      ),
    )
    const enabledVisibility = originEnabled.select(
      inBounds.select(sampledVisibility.mul(radiusMask), float(0)),
      float(0),
    )
    combinedVisibility = max(combinedVisibility, enabledVisibility)
  })

  return combinedVisibility
}

function sampleVisibilityMaskNode(visibilityMask: any, maskUv: any, worldXZ: any, playerOrigin: any) {
  const jitterScale = float(FOG_VISIBILITY_MASK_JITTER_TEXELS).div(float(FOG_VISIBILITY_MASK_SIZE))
  const jitterSeedX = worldXZ.x.mul(float(12.9898))
    .add(worldXZ.y.mul(float(78.233)))
    .add(playerOrigin.x.mul(float(0.137)))
    .add(playerOrigin.y.mul(float(0.193)))
  const jitterSeedY = worldXZ.x.mul(float(39.3467))
    .add(worldXZ.y.mul(float(11.1351)))
    .add(playerOrigin.x.mul(float(0.173)))
    .add(playerOrigin.y.mul(float(0.257)))
  const jitter = vec2(
    fract(sin(jitterSeedX).mul(float(43758.5453))),
    fract(sin(jitterSeedY).mul(float(24634.6345))),
  ).sub(vec2(0.5, 0.5)).mul(jitterScale)
  const minSampleUv = float(0.5).div(float(FOG_VISIBILITY_MASK_SIZE))
  const maxSampleUv = float(1).sub(minSampleUv)
  const jitteredUv = vec2(
    maskUv.x.add(jitter.x).max(minSampleUv).min(maxSampleUv),
    maskUv.y.add(jitter.y).max(minSampleUv).min(maxSampleUv),
  )

  return visibilityMask.sample(jitteredUv).r
}

export function getFogOfWarDdaMaxSteps(
  visionRangeCells = PLAYER_VISION_RANGE_CELLS,
  occupancySubdivisions = OCCUPANCY_SUBDIVISIONS,
) {
  return Math.max(1, Math.ceil(visionRangeCells * occupancySubdivisions * 2))
}

export function buildFogOfWarVisibilityMask(
  layout: FogOfWarLayout | null,
  playerOrigin: readonly [number, number] | null,
) {
  if (!layout || !playerOrigin) {
    return null
  }

  const mask = new Uint8Array(FOG_VISIBILITY_MASK_SIZE * FOG_VISIBILITY_MASK_SIZE)
  for (let z = 0; z < FOG_VISIBILITY_MASK_SIZE; z += 1) {
    for (let x = 0; x < FOG_VISIBILITY_MASK_SIZE; x += 1) {
      const normalizedX = (x + 0.5) / FOG_VISIBILITY_MASK_SIZE
      const normalizedZ = (z + 0.5) / FOG_VISIBILITY_MASK_SIZE
      const worldX = playerOrigin[0] + ((normalizedX * 2) - 1) * VISION_RADIUS_WORLD
      const worldZ = playerOrigin[1] + ((normalizedZ * 2) - 1) * VISION_RADIUS_WORLD

      if (Math.hypot(worldX - playerOrigin[0], worldZ - playerOrigin[1]) > VISION_RADIUS_WORLD) {
        continue
      }

      if (hasLineOfSightInOccupancy(layout, playerOrigin, [worldX, worldZ])) {
        mask[z * FOG_VISIBILITY_MASK_SIZE + x] = 255
      }
    }
  }

  return mask
}

export function buildFogOfWarVisibilityMasks(
  layout: FogOfWarLayout | null,
  playerOrigins: ReadonlyArray<readonly [number, number]>,
) {
  const masks: Uint8Array[] = []

  for (let index = 0; index < Math.min(playerOrigins.length, FOG_VISIBILITY_MASK_ORIGIN_CAPACITY); index += 1) {
    const mask = buildFogOfWarVisibilityMask(layout, playerOrigins[index] ?? null)
    if (mask) {
      masks.push(mask)
    }
  }

  return masks
}

export function buildFogOfWarLayout({
  active,
  paintedCells,
  wallOpenings,
  innerWalls,
}: {
  active: boolean
  paintedCells: ReturnType<typeof useDungeonStore.getState>['paintedCells']
  wallOpenings: Record<string, OpeningRecord>
  innerWalls: Record<string, InnerWallRecord>
}): FogOfWarLayout | null {
  if (!active) {
    return null
  }

  const cells = Object.values(paintedCells)
  if (cells.length === 0) {
    return null
  }

  let minCellX = Number.POSITIVE_INFINITY
  let maxCellX = Number.NEGATIVE_INFINITY
  let minCellZ = Number.POSITIVE_INFINITY
  let maxCellZ = Number.NEGATIVE_INFINITY

  cells.forEach(({ cell }) => {
    minCellX = Math.min(minCellX, cell[0])
    maxCellX = Math.max(maxCellX, cell[0])
    minCellZ = Math.min(minCellZ, cell[1])
    maxCellZ = Math.max(maxCellZ, cell[1])
  })

  if (!Number.isFinite(minCellX) || !Number.isFinite(minCellZ)) {
    return null
  }

  const width = maxCellX - minCellX + 1
  const height = maxCellZ - minCellZ + 1
  if (width > FOG_GRID_MAX_WIDTH || height > FOG_GRID_MAX_HEIGHT) {
    throw new Error(
      `Fog-of-war grid ${width}x${height} exceeds fixed storage buffer capacity ${FOG_GRID_MAX_WIDTH}x${FOG_GRID_MAX_HEIGHT}.`,
    )
  }
  const occupancyWidth = width * OCCUPANCY_SUBDIVISIONS + 1
  const occupancyHeight = height * OCCUPANCY_SUBDIVISIONS + 1
  const occupancy = new Int32Array(occupancyWidth * occupancyHeight)
  occupancy.fill(1)

  const openWalls = buildOpenWallSet(wallOpenings)
  const solidWalls = buildSolidWallSet(innerWalls)

  cells.forEach(({ cell }) => {
    const [cellX, cellZ] = cell
    const localX = cellX - minCellX
    const localZ = cellZ - minCellZ
    const occupancyX = localX * OCCUPANCY_SUBDIVISIONS
    const occupancyZ = localZ * OCCUPANCY_SUBDIVISIONS
    fillOccupancyRect(
      occupancy,
      occupancyWidth,
      occupancyX + 1,
      occupancyX + OCCUPANCY_SUBDIVISIONS - 1,
      occupancyZ + 1,
      occupancyZ + OCCUPANCY_SUBDIVISIONS - 1,
      0,
    )
  })

  cells.forEach(({ cell }) => {
    const localX = cell[0] - minCellX
    const localZ = cell[1] - minCellZ
    const occupancyX = localX * OCCUPANCY_SUBDIVISIONS
    const occupancyZ = localZ * OCCUPANCY_SUBDIVISIONS
    const northOpen = canTraverseWall(cell, 'north', paintedCells, openWalls, solidWalls)
    const southOpen = canTraverseWall(cell, 'south', paintedCells, openWalls, solidWalls)
    const eastOpen = canTraverseWall(cell, 'east', paintedCells, openWalls, solidWalls)
    const westOpen = canTraverseWall(cell, 'west', paintedCells, openWalls, solidWalls)

    if (northOpen) {
      fillOccupancyRect(
        occupancy,
        occupancyWidth,
        occupancyX + 1,
        occupancyX + OCCUPANCY_SUBDIVISIONS - 1,
        occupancyZ + OCCUPANCY_SUBDIVISIONS,
        occupancyZ + OCCUPANCY_SUBDIVISIONS,
        0,
      )
    }

    if (southOpen) {
      fillOccupancyRect(
        occupancy,
        occupancyWidth,
        occupancyX + 1,
        occupancyX + OCCUPANCY_SUBDIVISIONS - 1,
        occupancyZ,
        occupancyZ,
        0,
      )
    }

    if (eastOpen) {
      fillOccupancyRect(
        occupancy,
        occupancyWidth,
        occupancyX + OCCUPANCY_SUBDIVISIONS,
        occupancyX + OCCUPANCY_SUBDIVISIONS,
        occupancyZ + 1,
        occupancyZ + OCCUPANCY_SUBDIVISIONS - 1,
        0,
      )
    }

    if (westOpen) {
      fillOccupancyRect(
        occupancy,
        occupancyWidth,
        occupancyX,
        occupancyX,
        occupancyZ + 1,
        occupancyZ + OCCUPANCY_SUBDIVISIONS - 1,
        0,
      )
    }

    if (northOpen && eastOpen) {
      occupancy[(occupancyZ + OCCUPANCY_SUBDIVISIONS) * occupancyWidth + (occupancyX + OCCUPANCY_SUBDIVISIONS)] = 0
    }
    if (northOpen && westOpen) {
      occupancy[(occupancyZ + OCCUPANCY_SUBDIVISIONS) * occupancyWidth + occupancyX] = 0
    }
    if (southOpen && eastOpen) {
      occupancy[occupancyZ * occupancyWidth + (occupancyX + OCCUPANCY_SUBDIVISIONS)] = 0
    }
    if (southOpen && westOpen) {
      occupancy[occupancyZ * occupancyWidth + occupancyX] = 0
    }
  })

  return {
    minCellX,
    minCellZ,
    width,
    height,
    occupancyWidth,
    occupancyHeight,
    occupancy,
  }
}

export function buildFogOfWarExploredStates(
  layout: FogOfWarLayout | null,
  exploredCells: Record<string, true>,
) {
  if (!layout) {
    return null
  }

  const exploredStates = new Int32Array(layout.width * layout.height)

  Object.keys(exploredCells).forEach((cellKey) => {
    const [cellXString, cellZString] = cellKey.split(':')
    const cellX = Number(cellXString)
    const cellZ = Number(cellZString)
    if (!Number.isFinite(cellX) || !Number.isFinite(cellZ)) {
      return
    }

    const localX = cellX - layout.minCellX
    const localZ = cellZ - layout.minCellZ
    if (
      localX < 0 ||
      localZ < 0 ||
      localX >= layout.width ||
      localZ >= layout.height
    ) {
      return
    }

    exploredStates[localZ * layout.width + localX] = 1
  })

  return exploredStates
}

function hasLineOfSightInOccupancy(
  layout: FogOfWarLayout,
  origin: readonly [number, number],
  target: readonly [number, number],
) {
  const minWorldX = layout.minCellX * GRID_SIZE
  const minWorldZ = layout.minCellZ * GRID_SIZE
  const gridOriginX = (origin[0] - minWorldX) / OCCUPANCY_CELL_SIZE
  const gridOriginZ = (origin[1] - minWorldZ) / OCCUPANCY_CELL_SIZE
  const gridTargetX = (target[0] - minWorldX) / OCCUPANCY_CELL_SIZE
  const gridTargetZ = (target[1] - minWorldZ) / OCCUPANCY_CELL_SIZE
  let currentCellX = Math.floor(gridOriginX)
  let currentCellZ = Math.floor(gridOriginZ)
  const targetCellX = Math.floor(gridTargetX)
  const targetCellZ = Math.floor(gridTargetZ)
  const rayDirX = gridTargetX - gridOriginX
  const rayDirZ = gridTargetZ - gridOriginZ
  const rayDirAbsX = Math.abs(rayDirX)
  const rayDirAbsZ = Math.abs(rayDirZ)
  const stepX = rayDirX >= 0 ? 1 : -1
  const stepZ = rayDirZ >= 0 ? 1 : -1
  const hasRayX = rayDirAbsX > 0.00001
  const hasRayZ = rayDirAbsZ > 0.00001
  const deltaDistX = hasRayX ? 1 / rayDirAbsX : Number.POSITIVE_INFINITY
  const deltaDistZ = hasRayZ ? 1 / rayDirAbsZ : Number.POSITIVE_INFINITY
  let sideDistX = hasRayX
    ? ((stepX >= 0 ? currentCellX + 1 - gridOriginX : gridOriginX - currentCellX) * deltaDistX)
    : Number.POSITIVE_INFINITY
  let sideDistZ = hasRayZ
    ? ((stepZ >= 0 ? currentCellZ + 1 - gridOriginZ : gridOriginZ - currentCellZ) * deltaDistZ)
    : Number.POSITIVE_INFINITY

  for (let step = 0; step < GPU_LOS_DDA_MAX_STEPS; step += 1) {
    if (currentCellX === targetCellX && currentCellZ === targetCellZ) {
      return true
    }

    if (sideDistX <= sideDistZ) {
      currentCellX += stepX
      sideDistX += deltaDistX
    } else {
      currentCellZ += stepZ
      sideDistZ += deltaDistZ
    }

    if (sampleFogOfWarOccupancyCell(layout, currentCellX, currentCellZ) > 0) {
      return false
    }
  }

  return true
}

function sampleFogOfWarOccupancyCell(layout: FogOfWarLayout, cellX: number, cellZ: number) {
  if (
    cellX < 0 ||
    cellZ < 0 ||
    cellX >= layout.occupancyWidth ||
    cellZ >= layout.occupancyHeight
  ) {
    return 1
  }

  return layout.occupancy[cellZ * layout.occupancyWidth + cellX] ?? 1
}

function sampleExploredFactorNode(runtime: FogOfWarRuntime, options: FogOfWarMaterialOptions) {
  const width = int(runtime.width)
  const height = int(runtime.height)
  const fogCell: any = options.useCellAttribute
    ? attribute('fogCell', 'vec2')
    : options.cell
      ? vec2(options.cell[0], options.cell[1])
      : positionWorld.xz.div(runtime.cellSize)
  const cellX = int(floor(fogCell.x)).sub(runtime.minCellX)
  const cellZ = int(floor(fogCell.y)).sub(runtime.minCellZ)
  const inBounds = cellX.greaterThanEqual(int(0))
    .and(cellZ.greaterThanEqual(int(0)))
    .and(cellX.lessThan(width))
    .and(cellZ.lessThan(height))
  const safeCellX = (cellX as any).max(int(0)).min(width.sub(1))
  const safeCellZ = (cellZ as any).max(int(0)).min(height.sub(1))
  const cellIndex = safeCellZ.mul(width).add(safeCellX)
  const sampledState = runtime.exploredStates.element(cellIndex)
  return inBounds.select(float(sampledState), float(0))
}

function buildOpenWallSet(wallOpenings: Record<string, OpeningRecord>) {
  const openWalls = new Set<string>()

  Object.values(wallOpenings).forEach((opening) => {
    getOpeningSegments(opening.wallKey, opening.width).forEach((wallKey) => {
      openWalls.add(wallKey)
      const mirroredWallKey = getMirroredWallKey(wallKey)
      if (mirroredWallKey) {
        openWalls.add(mirroredWallKey)
      }
    })
  })

  return openWalls
}

function fillOccupancyRect(
  occupancy: Int32Array,
  occupancyWidth: number,
  minX: number,
  maxX: number,
  minZ: number,
  maxZ: number,
  value: 0 | 1,
) {
  for (let z = minZ; z <= maxZ; z += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      occupancy[z * occupancyWidth + x] = value
    }
  }
}

function buildSolidWallSet(innerWalls: Record<string, InnerWallRecord>) {
  const solidWalls = new Set<string>()

  Object.keys(innerWalls).forEach((wallKey) => {
    solidWalls.add(wallKey)
    const mirroredWallKey = getMirroredWallKey(wallKey)
    if (mirroredWallKey) {
      solidWalls.add(mirroredWallKey)
    }
  })

  return solidWalls
}

function canTraverseWall(
  cell: GridCell,
  direction: WallDirection,
  paintedCells: ReturnType<typeof useDungeonStore.getState>['paintedCells'],
  openWalls: Set<string>,
  solidWalls: Set<string>,
) {
  const cellKey = getCellKey(cell)
  const record = paintedCells[cellKey]
  if (!record) {
    return false
  }

  const delta = WALL_DIRECTIONS[direction].delta
  const neighbor: GridCell = [cell[0] + delta[0], cell[1] + delta[1]]
  const neighborKey = getCellKey(neighbor)
  const neighborRecord = paintedCells[neighborKey]
  if (!neighborRecord) {
    return false
  }

  const wallKey = `${cellKey}:${direction}`
  if (solidWalls.has(wallKey)) {
    return false
  }

  if ((record.roomId ?? null) === (neighborRecord.roomId ?? null)) {
    return true
  }

  return openWalls.has(wallKey)
}
