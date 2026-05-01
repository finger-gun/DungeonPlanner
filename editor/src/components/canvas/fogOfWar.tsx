/* eslint-disable @typescript-eslint/no-explicit-any */
import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { StorageBufferAttribute, StorageTexture } from 'three/webgpu'
import {
  Break,
  Fn,
  If,
  Loop,
  attribute,
  float,
  fract,
  floor,
  instanceIndex,
  int,
  max,
  materialColor,
  mix,
  positionWorld,
  sin,
  storage,
  storageTexture,
  smoothstep,
  texture,
  textureStore,
  uniform,
  uint,
  uvec2,
  vec2,
  vec4,
  vec3,
} from 'three/tsl'
import { GRID_SIZE, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import { getOpeningSegments } from '../../store/openingSegments'
import { getMirroredWallKey, type InnerWallRecord } from '../../store/manualWalls'
import { useDungeonStore, type OpeningRecord } from '../../store/useDungeonStore'
import {
  ACTIVE_FLOOR_VISIBILITY_DOMAINS,
  useActiveFloorSnapshot,
} from '../../store/useActiveFloorSnapshot'
import type { PlayVisibility } from './playVisibility'

const PLAYER_VISION_RANGE_CELLS = 8
const VISION_RADIUS_WORLD = PLAYER_VISION_RANGE_CELLS * GRID_SIZE
const VISION_EDGE_WORLD = GRID_SIZE * 1.5
const OCCUPANCY_SUBDIVISIONS = 4
const OCCUPANCY_CELL_SIZE = GRID_SIZE / OCCUPANCY_SUBDIVISIONS
export const FOG_VISIBILITY_MASK_SIZE = 256
export const FOG_VISIBILITY_MASK_ORIGIN_CAPACITY = 8
const FOG_VISIBILITY_MASK_JITTER_TEXELS = 0.65
const FOG_GRID_MAX_WIDTH = 128
const FOG_GRID_MAX_HEIGHT = 128
const FOG_GRID_MAX_CELLS = FOG_GRID_MAX_WIDTH * FOG_GRID_MAX_HEIGHT
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

type FogOfWarRuntime = {
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

const FogOfWarContext = createContext<FogOfWarRuntime | null>(null)

export function FogOfWarProvider({
  visibility,
  children,
}: {
  visibility: PlayVisibility
  children: ReactNode
}) {
  const renderer = useThree((state) => state.gl) as any
  const invalidate = useThree((state) => state.invalidate)
  const exploredCells = useDungeonStore((state) => state.exploredCells)
  const { paintedCells, wallOpenings, innerWalls } = useActiveFloorSnapshot(
    ACTIVE_FLOOR_VISIBILITY_DOMAINS,
    (state) => ({
      paintedCells: state.paintedCells,
      wallOpenings: state.wallOpenings,
      innerWalls: state.innerWalls,
    }),
  )
  const layout = useMemo(
    () => buildFogOfWarLayout({
      active: visibility.active,
      paintedCells,
      wallOpenings,
      innerWalls,
    }),
    [
      innerWalls,
      paintedCells,
      visibility.active,
      wallOpenings,
    ],
  )
  const exploredStates = useMemo(
    () => buildFogOfWarExploredStates(layout, exploredCells),
    [layout, exploredCells],
  )
  const runtime = useMemo(() => createFogOfWarRuntime(), [])

  useEffect(() => {
    runtime.minCellX.value = layout?.minCellX ?? 0
    runtime.minCellZ.value = layout?.minCellZ ?? 0
    runtime.width.value = layout?.width ?? 1
    runtime.height.value = layout?.height ?? 1
    runtime.cellSize.value = GRID_SIZE
    runtime.minWorldX.value = (layout?.minCellX ?? 0) * GRID_SIZE
    runtime.minWorldZ.value = (layout?.minCellZ ?? 0) * GRID_SIZE
    runtime.occupancyWidth.value = layout?.occupancyWidth ?? 1
    runtime.occupancyHeight.value = layout?.occupancyHeight ?? 1
    runtime.occupancyCellSize.value = OCCUPANCY_CELL_SIZE
    runtime.visionRadius.value = VISION_RADIUS_WORLD
    runtime.visionEdge.value = VISION_EDGE_WORLD
  }, [layout, runtime])

  useEffect(() => {
    const occupancyArray = runtime.occupancy.value.array as Int32Array
    occupancyArray.fill(0)
    if (layout) {
      occupancyArray.set(layout.occupancy)
    }
    runtime.occupancy.value.needsUpdate = true
  }, [layout, runtime])

  useEffect(() => {
    const exploredArray = runtime.exploredStates.value.array as Int32Array
    exploredArray.fill(0)
    if (exploredStates) {
      exploredArray.set(exploredStates)
    }
    runtime.exploredStates.value.needsUpdate = true
  }, [exploredStates, runtime])

  useEffect(() => {
    runtime.originCount.value = Math.min(visibility.playerOrigins.length, FOG_VISIBILITY_MASK_ORIGIN_CAPACITY)
    runtime.playerOrigins.forEach((playerOrigin, index) => {
      const sourceOrigin = visibility.playerOrigins[index]
      if (sourceOrigin) {
        playerOrigin.value.set(sourceOrigin[0], sourceOrigin[1])
      } else {
        playerOrigin.value.set(0, 0)
      }
    })
  }, [runtime, visibility.playerOrigins])

  useEffect(() => {
    if (!layout || runtime.originCount.value <= 0) {
      return
    }

    for (let index = 0; index < runtime.originCount.value; index += 1) {
      renderer.compute(runtime.visibilityMaskComputes[index])
    }

    invalidate()
  }, [invalidate, layout, renderer, runtime, visibility.playerOrigins])

  return (
    <FogOfWarContext.Provider value={layout ? runtime : null}>
      {children}
    </FogOfWarContext.Provider>
  )
}

export function useFogOfWarRuntime() {
  return useContext(FogOfWarContext)
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

function createFogOfWarRuntime(): FogOfWarRuntime {
  const occupancyStorage = new StorageBufferAttribute(
    new Int32Array((FOG_GRID_MAX_WIDTH * OCCUPANCY_SUBDIVISIONS + 1) * (FOG_GRID_MAX_HEIGHT * OCCUPANCY_SUBDIVISIONS + 1)),
    1,
  ) as any
  const exploredStorage = new StorageBufferAttribute(new Int32Array(FOG_GRID_MAX_CELLS), 1) as any
  const visibilityMaskTextures = Array.from({ length: FOG_VISIBILITY_MASK_ORIGIN_CAPACITY }, (_, index) => {
    const visibilityMaskTexture = new StorageTexture(FOG_VISIBILITY_MASK_SIZE, FOG_VISIBILITY_MASK_SIZE)
    visibilityMaskTexture.name = `FogOfWar.VisibilityMask.${index}`
    visibilityMaskTexture.minFilter = THREE.LinearFilter
    visibilityMaskTexture.magFilter = THREE.LinearFilter
    visibilityMaskTexture.wrapS = THREE.ClampToEdgeWrapping
    visibilityMaskTexture.wrapT = THREE.ClampToEdgeWrapping
    visibilityMaskTexture.generateMipmaps = false
    visibilityMaskTexture.needsUpdate = true
    return visibilityMaskTexture
  })
  const storageNode = storage as any
  const runtime: FogOfWarRuntime = {
    occupancy: storageNode(
      occupancyStorage,
      'int',
      (FOG_GRID_MAX_WIDTH * OCCUPANCY_SUBDIVISIONS + 1) * (FOG_GRID_MAX_HEIGHT * OCCUPANCY_SUBDIVISIONS + 1),
    ).toReadOnly(),
    exploredStates: storageNode(exploredStorage, 'int', FOG_GRID_MAX_CELLS).toReadOnly(),
    visibilityMasks: visibilityMaskTextures.map((visibilityMaskTexture) => texture(visibilityMaskTexture)),
    visibilityMaskTextures,
    visibilityMaskComputes: [],
    playerOrigins: Array.from({ length: FOG_VISIBILITY_MASK_ORIGIN_CAPACITY }, () => uniform(new THREE.Vector2())),
    minCellX: uniform(0),
    minCellZ: uniform(0),
    width: uniform(1),
    height: uniform(1),
    cellSize: uniform(GRID_SIZE),
    minWorldX: uniform(0),
    minWorldZ: uniform(0),
    occupancyWidth: uniform(1),
    occupancyHeight: uniform(1),
    occupancyCellSize: uniform(OCCUPANCY_CELL_SIZE),
    originCount: uniform(0),
    visionRadius: uniform(VISION_RADIUS_WORLD),
    visionEdge: uniform(VISION_EDGE_WORLD),
  }

  runtime.visibilityMaskComputes = visibilityMaskTextures.map((_, index) => createVisibilityMaskComputeNode(runtime, index))

  return runtime
}

function createVisibilityMaskComputeNode(runtime: FogOfWarRuntime, originIndex: number) {
  const computeVisibilityMask = Fn(() => {
    const maskTexelIndex = uint(instanceIndex).toVar()
    const maskX = maskTexelIndex.mod(uint(FOG_VISIBILITY_MASK_SIZE)).toVar()
    const maskZ = maskTexelIndex.div(uint(FOG_VISIBILITY_MASK_SIZE)).toVar()
    const maskCoord = uvec2(maskX, maskZ)
    const playerOrigin = runtime.playerOrigins[originIndex]
    const visibilitySum = float(0).toVar()

    ;([
      [0.25, 0.25],
      [0.75, 0.25],
      [0.25, 0.75],
      [0.75, 0.75],
    ] as const).forEach(([offsetX, offsetZ]) => {
      const normalizedX = float(maskX).add(offsetX).div(float(FOG_VISIBILITY_MASK_SIZE))
      const normalizedZ = float(maskZ).add(offsetZ).div(float(FOG_VISIBILITY_MASK_SIZE))
      const targetWorld = vec2(
        playerOrigin.x.add(normalizedX.mul(2).sub(1).mul(runtime.visionRadius)),
        playerOrigin.y.add(normalizedZ.mul(2).sub(1).mul(runtime.visionRadius)),
      )

      visibilitySum.addAssign(traceVisibilityRayNode(runtime, playerOrigin, targetWorld))
    })

    const visibility = visibilitySum.div(float(4))

    textureStore(
      storageTexture(runtime.visibilityMaskTextures[originIndex]).toWriteOnly(),
      maskCoord,
      vec4(visibility, visibility, visibility, float(1)),
    )
  })

  return computeVisibilityMask().compute(FOG_VISIBILITY_MASK_SIZE * FOG_VISIBILITY_MASK_SIZE, [64])
}

function traceVisibilityRayNode(runtime: FogOfWarRuntime, originWorld: any, targetWorld: any) {
  const visibility = float(0).toVar()
  const ray = targetWorld.sub(originWorld).toVar()
  const rayLength = ray.length().toVar()

  If(rayLength.lessThanEqual(runtime.visionRadius), () => {
    const occupancyWidth = int(runtime.occupancyWidth)
    const occupancyHeight = int(runtime.occupancyHeight)
    const gridOrigin = originWorld
      .sub(vec2(runtime.minWorldX, runtime.minWorldZ))
      .div(runtime.occupancyCellSize)
      .toVar()
    const gridTarget = targetWorld
      .sub(vec2(runtime.minWorldX, runtime.minWorldZ))
      .div(runtime.occupancyCellSize)
      .toVar()
    const currentCellX = int(floor(gridOrigin.x)).toVar()
    const currentCellZ = int(floor(gridOrigin.y)).toVar()
    const targetCellX = int(floor(gridTarget.x)).toVar()
    const targetCellZ = int(floor(gridTarget.y)).toVar()
    const rayDirX = gridTarget.x.sub(gridOrigin.x).toVar()
    const rayDirZ = gridTarget.y.sub(gridOrigin.y).toVar()
    const rayDirAbsX = rayDirX.abs().toVar()
    const rayDirAbsZ = rayDirZ.abs().toVar()
    const hasRayX = rayDirAbsX.greaterThan(float(0.00001)).toVar()
    const hasRayZ = rayDirAbsZ.greaterThan(float(0.00001)).toVar()
    const stepX = hasRayX.select(rayDirX.greaterThanEqual(float(0)).select(int(1), int(-1)), int(0)).toVar()
    const stepZ = hasRayZ.select(rayDirZ.greaterThanEqual(float(0)).select(int(1), int(-1)), int(0)).toVar()
    const deltaDistX = hasRayX.select(float(1).div(max(rayDirAbsX, float(0.00001))), float(1000000)).toVar()
    const deltaDistZ = hasRayZ.select(float(1).div(max(rayDirAbsZ, float(0.00001))), float(1000000)).toVar()
    const sideDistX = hasRayX.select(
      stepX.greaterThanEqual(int(0))
        .select(float(currentCellX).add(1).sub(gridOrigin.x), gridOrigin.x.sub(float(currentCellX)))
        .mul(deltaDistX),
      float(1000000),
    ).toVar()
    const sideDistZ = hasRayZ.select(
      stepZ.greaterThanEqual(int(0))
        .select(float(currentCellZ).add(1).sub(gridOrigin.y), gridOrigin.y.sub(float(currentCellZ)))
        .mul(deltaDistZ),
      float(1000000),
    ).toVar()
    const hitWall = float(0).toVar()

    Loop({ start: int(0), end: int(GPU_LOS_DDA_MAX_STEPS), type: 'int', condition: '<' }, () => {
      const inBounds = currentCellX.greaterThanEqual(int(0))
        .and(currentCellZ.greaterThanEqual(int(0)))
        .and(currentCellX.lessThan(occupancyWidth))
        .and(currentCellZ.lessThan(occupancyHeight))
      const safeCellX = (currentCellX as any).max(int(0)).min(occupancyWidth.sub(1))
      const safeCellZ = (currentCellZ as any).max(int(0)).min(occupancyHeight.sub(1))
      const occupancyIndex = safeCellZ.mul(occupancyWidth).add(safeCellX)
      const blocked = inBounds
        .select(runtime.occupancy.element(occupancyIndex).greaterThan(int(0)), int(1))

      If(blocked, () => {
        hitWall.assign(float(1))
        Break()
      })

      If(currentCellX.equal(targetCellX).and(currentCellZ.equal(targetCellZ)), () => {
        Break()
      })

      If(sideDistX.lessThanEqual(sideDistZ), () => {
        currentCellX.addAssign(stepX)
        sideDistX.addAssign(deltaDistX)
      }).Else(() => {
        currentCellZ.addAssign(stepZ)
        sideDistZ.addAssign(deltaDistZ)
      })
    })

    visibility.assign(hitWall.equal(float(0)).select(float(1), float(0)))
  })

  return visibility
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
