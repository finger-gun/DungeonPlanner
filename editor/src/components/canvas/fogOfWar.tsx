/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, type ReactNode } from 'react'
import { useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { StorageBufferAttribute, StorageTexture } from 'three/webgpu'
import {
  Break,
  Fn,
  If,
  Loop,
  float,
  floor,
  instanceIndex,
  int,
  max,
  storage,
  storageTexture,
  texture,
  textureStore,
  uniform,
  uint,
  uvec2,
  vec2,
  vec4,
} from 'three/tsl'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import { useDungeonStore } from '../../store/useDungeonStore'
import {
  ACTIVE_FLOOR_VISIBILITY_DOMAINS,
  useActiveFloorSnapshot,
} from '../../store/useActiveFloorSnapshot'
import type { PlayVisibility } from './playVisibility'
import { FogOfWarContext } from './fogOfWarHooks'
import {
  buildFogOfWarExploredStates,
  buildFogOfWarLayout,
  getFogOfWarDdaMaxSteps,
  type FogOfWarRuntime,
} from './fogOfWarShared'

const PLAYER_VISION_RANGE_CELLS = 8
const VISION_RADIUS_WORLD = PLAYER_VISION_RANGE_CELLS * GRID_SIZE
const VISION_EDGE_WORLD = GRID_SIZE * 1.5
const OCCUPANCY_SUBDIVISIONS = 4
const OCCUPANCY_CELL_SIZE = GRID_SIZE / OCCUPANCY_SUBDIVISIONS
const FOG_VISIBILITY_MASK_SIZE = 256
const FOG_VISIBILITY_MASK_ORIGIN_CAPACITY = 8
const FOG_GRID_MAX_WIDTH = 128
const FOG_GRID_MAX_HEIGHT = 128
const FOG_GRID_MAX_CELLS = FOG_GRID_MAX_WIDTH * FOG_GRID_MAX_HEIGHT
const GPU_LOS_DDA_MAX_STEPS = getFogOfWarDdaMaxSteps()

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
  const { paintedCells, splineWallGraph, wallOpenings, innerWalls, wallSurfaceAssetIds, wallSurfaceProps } = useActiveFloorSnapshot(
    ACTIVE_FLOOR_VISIBILITY_DOMAINS,
    (state) => ({
      paintedCells: state.paintedCells,
      splineWallGraph: state.splineWallGraph,
      wallOpenings: state.wallOpenings,
      innerWalls: state.innerWalls,
      wallSurfaceAssetIds: state.wallSurfaceAssetIds,
      wallSurfaceProps: state.wallSurfaceProps,
    }),
  )
  const layout = useMemo(
    () => buildFogOfWarLayout({
      active: visibility.active,
      paintedCells,
      splineWallGraph,
      wallOpenings,
      innerWalls,
      wallSurfaceAssetIds,
      wallSurfaceProps,
    }),
    [
      innerWalls,
      paintedCells,
      splineWallGraph,
      visibility.active,
      wallOpenings,
      wallSurfaceAssetIds,
      wallSurfaceProps,
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
