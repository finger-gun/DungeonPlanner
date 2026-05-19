import type { ContentPackModelTransform } from '../../content-packs/types'
import { cellToWorldPosition, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import type { FloorDirtyInfo } from '../../store/floorDirtyDomains'
import type { SplineWallGraph } from '../../store/splineWallGraph'
import { buildWallOpeningDerivedState } from '../../store/derived/wallOpeningDerived'
import {
  buildFloorRenderPlan,
  type FloorRenderGroup,
  type FloorSurfacePlacement,
} from '../../store/floorSurfaceLayout'
import type { InnerWallRecord, Layer, OpeningRecord, PaintedCells, Room } from '../../store/useDungeonStore'
import type { FloorDerivedBundle } from '../../store/derived/floorDerived'
import { DEFAULT_RENDER_BATCH_CHUNK_SIZE, getRenderBatchChunkKeyForCell } from './batchDescriptors'
import {
  getFloorChunkKeysForCells,
  getFloorChunkKeysForRect,
} from '../../store/floorChunkKeys'

export type FloorReceiverCellInput = {
  cell: GridCell
  cellKey: string
  assetId: string | null
  coveredCellKeys?: string[]
  receiverTransformOverride?: ContentPackModelTransform
}

export type FloorRenderDerivedBundle = {
  floorGroups: FloorRenderGroup[]
  floorSurfaceEntries: FloorSurfacePlacement[]
  visibleFloorReceiverCells: FloorReceiverCellInput[]
}

export type FloorRenderChunkBundle = FloorRenderDerivedBundle & {
  contextPaintedCells: PaintedCells
  openings: OpeningRecord[]
}

export type FloorRenderChunkCache = {
  floorId: string
  includeFloorReceivers: boolean
  haloCells: number
  orderedChunkKeys: string[]
  bundlesByChunk: Map<string, FloorRenderChunkBundle>
}

export type FloorRenderDerivedInput = {
  visiblePaintedCellRecords: PaintedCells
  rooms: Record<string, Room>
  globalFloorAssetId: string | null
  floorTileAssetIds: Record<string, string>
  globalWallAssetId: string | null
  wallSurfaceAssetIds: Record<string, string>
  wallSurfaceProps: Record<string, Record<string, unknown>>
  wallOpeningDerivedState: FloorDerivedBundle['wallOpeningDerivedState']
  innerWalls: Record<string, InnerWallRecord>
  splineWallGraph?: SplineWallGraph
}

export type FloorRenderChunkInput = {
  paintedCells: PaintedCells
  layers: Record<string, Layer>
  rooms: Record<string, Room>
  wallOpenings: Record<string, OpeningRecord>
  innerWalls: Record<string, InnerWallRecord>
  floorTileAssetIds: Record<string, string>
  wallSurfaceAssetIds: Record<string, string>
  wallSurfaceProps: Record<string, Record<string, unknown>>
  globalFloorAssetId: string | null
  globalWallAssetId: string | null
  splineWallGraph?: SplineWallGraph
}

export function buildFloorRenderDerivedBundle(
  derived: FloorDerivedBundle,
  options?: {
    includeFloorReceivers?: boolean
  },
): FloorRenderDerivedBundle {
  return buildFloorRenderDerivedBundleFromInput({
    visiblePaintedCellRecords: derived.visiblePaintedCellRecords,
    rooms: derived.data.rooms,
    globalFloorAssetId: derived.data.globalFloorAssetId,
    floorTileAssetIds: derived.data.floorTileAssetIds,
    globalWallAssetId: derived.data.globalWallAssetId,
    wallSurfaceAssetIds: derived.data.wallSurfaceAssetIds,
    wallSurfaceProps: derived.data.wallSurfaceProps,
    wallOpeningDerivedState: derived.wallOpeningDerivedState,
    innerWalls: derived.data.innerWalls,
    splineWallGraph: derived.data.splineWallGraph,
  }, options)
}

export function buildFloorRenderDerivedBundleFromInput(
  input: FloorRenderDerivedInput,
  options?: {
    includeFloorReceivers?: boolean
  },
): FloorRenderDerivedBundle {
  const floorRenderPlan = buildFloorRenderPlan(
    input.visiblePaintedCellRecords,
    input.rooms,
    input.globalFloorAssetId,
    input.floorTileAssetIds,
    input.splineWallGraph,
  )

  return {
    floorGroups: floorRenderPlan.baseGroups as FloorRenderGroup[],
    floorSurfaceEntries: floorRenderPlan.surfacePlacements as FloorSurfacePlacement[],
    visibleFloorReceiverCells: options?.includeFloorReceivers === false
      ? []
      : deriveFloorReceiverCells(floorRenderPlan),
  }
}

export function buildFloorRenderDerivedBundleForChunk(
  input: FloorRenderChunkInput,
  chunkKey: string,
  options?: {
    includeFloorReceivers?: boolean
    haloCells?: number
  },
): FloorRenderChunkBundle {
  const targetRect = getChunkRect(chunkKey)
  const contextRect = expandFloorRenderRect(targetRect, options?.haloCells ?? 0)
  const contextPaintedCells = filterVisiblePaintedCellsByRect(
    input.paintedCells,
    input.layers,
    contextRect,
  )
  const contextWallOpenings = filterVisibleOpeningRecordByRect(
    input.wallOpenings,
    input.layers,
    contextRect,
  )
  const contextWallOpeningDerivedState = buildWallOpeningDerivedState(contextWallOpenings)
  const localBundle = buildFloorRenderDerivedBundleFromInput({
    visiblePaintedCellRecords: contextPaintedCells,
    rooms: input.rooms,
    globalFloorAssetId: input.globalFloorAssetId,
    floorTileAssetIds: filterCellKeyRecordByRect(input.floorTileAssetIds, contextRect),
    globalWallAssetId: input.globalWallAssetId,
    wallSurfaceAssetIds: filterWallKeyRecordByRect(input.wallSurfaceAssetIds, contextRect),
    wallSurfaceProps: filterWallKeyRecordByRect(input.wallSurfaceProps, contextRect),
    wallOpeningDerivedState: contextWallOpeningDerivedState,
    innerWalls: filterWallKeyRecordByRect(input.innerWalls, contextRect),
    splineWallGraph: input.splineWallGraph,
  }, options)

  return {
    contextPaintedCells,
    openings: Object.values(contextWallOpenings).filter((opening) =>
      isWallKeyInFloorRenderRect(opening.wallKey, targetRect)),
    floorGroups: localBundle.floorGroups.flatMap((group) => {
      const chunkCells = group.cells.filter((cell) => isCellInFloorRenderRect(cell, targetRect))
      if (chunkCells.length === 0) {
        return []
      }

      return [{
        ...group,
        groupKey: `${chunkKey}:${group.groupKey}`,
        cells: chunkCells,
      }]
    }),
    floorSurfaceEntries: localBundle.floorSurfaceEntries.filter((placement) =>
      isCellInFloorRenderRect(placement.anchorCell, targetRect)),
    visibleFloorReceiverCells: localBundle.visibleFloorReceiverCells.filter((cell) =>
      isCellInFloorRenderRect(cell.cell, targetRect)),
  }
}

export function buildChunkedFloorRenderDerivedCache({
  previous,
  floorId,
  input,
  dirtyInfo,
  includeFloorReceivers,
  haloCells,
}: {
  previous: FloorRenderChunkCache | null
  floorId: string
  input: FloorRenderChunkInput
  dirtyInfo: FloorDirtyInfo | null | undefined
  includeFloorReceivers: boolean
  haloCells: number
}): FloorRenderChunkCache {
  const orderedChunkKeys = collectChunkKeysFromPaintedCells(input.paintedCells, input.layers)
  const nextChunkKeySet = new Set(orderedChunkKeys)
  const shouldRebuildAll =
    !previous
    || previous.floorId !== floorId
    || previous.includeFloorReceivers !== includeFloorReceivers
    || previous.haloCells !== haloCells
    || !hasDirtyRenderScope(dirtyInfo)
    || Boolean(dirtyInfo?.fullRefresh)

  if (shouldRebuildAll) {
    return {
      floorId,
      includeFloorReceivers,
      haloCells,
      orderedChunkKeys,
      bundlesByChunk: new Map(
        orderedChunkKeys.map((chunkKey) => [
          chunkKey,
          buildFloorRenderDerivedBundleForChunk(input, chunkKey, {
            includeFloorReceivers,
            haloCells,
          }),
        ]),
      ),
    }
  }

  const bundlesByChunk = new Map(previous.bundlesByChunk)
  for (const chunkKey of [...bundlesByChunk.keys()]) {
    if (!nextChunkKeySet.has(chunkKey)) {
      bundlesByChunk.delete(chunkKey)
    }
  }

  const affectedChunkKeys = new Set(getChunkKeysForDirtyInfo(dirtyInfo, haloCells))
  orderedChunkKeys.forEach((chunkKey) => {
    if (!bundlesByChunk.has(chunkKey)) {
      affectedChunkKeys.add(chunkKey)
    }
  })

  affectedChunkKeys.forEach((chunkKey) => {
    if (!nextChunkKeySet.has(chunkKey)) {
      bundlesByChunk.delete(chunkKey)
      return
    }

    bundlesByChunk.set(
      chunkKey,
      buildFloorRenderDerivedBundleForChunk(input, chunkKey, {
        includeFloorReceivers,
        haloCells,
      }),
    )
  })

  return {
    floorId,
    includeFloorReceivers,
    haloCells,
    orderedChunkKeys,
    bundlesByChunk,
  }
}

export function flattenFloorRenderChunkCache(
  cache: FloorRenderChunkCache | null,
): FloorRenderDerivedBundle {
  if (!cache || cache.orderedChunkKeys.length === 0) {
    return createEmptyFloorRenderDerivedBundle()
  }

  return cache.orderedChunkKeys.reduce<FloorRenderDerivedBundle>((accumulator, chunkKey) => {
    const bundle = cache.bundlesByChunk.get(chunkKey)
    if (!bundle) {
      return accumulator
    }

    accumulator.floorGroups.push(...bundle.floorGroups)
    accumulator.floorSurfaceEntries.push(...bundle.floorSurfaceEntries)
    accumulator.visibleFloorReceiverCells.push(...bundle.visibleFloorReceiverCells)
    return accumulator
  }, createEmptyFloorRenderDerivedBundle())
}

export function getChunkKeysForDirtyRect(
  dirtyRect: FloorDirtyInfo['dirtyCellRect'],
  haloCells = 0,
): string[] {
  return getFloorChunkKeysForRect(dirtyRect, {
    chunkSize: DEFAULT_RENDER_BATCH_CHUNK_SIZE,
    haloCells,
  })
}

export function getChunkKeysForDirtyInfo(
  dirtyInfo: FloorDirtyInfo | null | undefined,
  haloCells = 0,
): string[] {
  if (!dirtyInfo) {
    return []
  }

  if (dirtyInfo.dirtyRenderChunkKeys.length > 0) {
    return dirtyInfo.dirtyRenderChunkKeys
  }

  if (dirtyInfo.dirtyCellKeys.length > 0) {
    return getFloorChunkKeysForCells(dirtyInfo.dirtyCellKeys, {
      chunkSize: DEFAULT_RENDER_BATCH_CHUNK_SIZE,
      haloCells,
    })
  }

  return getChunkKeysForDirtyRect(dirtyInfo.dirtyCellRect, haloCells)
}

function hasDirtyRenderScope(dirtyInfo: FloorDirtyInfo | null | undefined) {
  return Boolean(
    dirtyInfo?.dirtyCellRect
      || dirtyInfo?.dirtyCellKeys.length
      || dirtyInfo?.dirtyRenderChunkKeys.length,
  )
}

function deriveFloorReceiverCells(plan: ReturnType<typeof buildFloorRenderPlan>): FloorReceiverCellInput[] {
  return [
    ...plan.baseGroups.flatMap((group) => group.cells.map((cell) => {
      return {
        cell,
        cellKey: getCellKey(cell),
        assetId: group.floorAssetId,
        receiverTransformOverride: {
          rotation: group.rotation,
        },
      }
    })),
    ...plan.surfacePlacements.map((placement) => ({
      cell: placement.anchorCell,
      cellKey: placement.anchorCellKey,
      assetId: placement.assetId,
      coveredCellKeys: placement.coveredCellKeys,
      receiverTransformOverride: {
        position: [
          placement.position[0] - cellToWorldPosition(placement.anchorCell)[0],
          0,
          placement.position[2] - cellToWorldPosition(placement.anchorCell)[2],
        ] as const,
      },
    })),
  ]
}

type FloorRenderRect = {
  minCellX: number
  maxCellX: number
  minCellZ: number
  maxCellZ: number
}

function createEmptyFloorRenderDerivedBundle(): FloorRenderDerivedBundle {
  return {
    floorGroups: [],
    floorSurfaceEntries: [],
    visibleFloorReceiverCells: [],
  }
}

function collectChunkKeysFromPaintedCells(
  paintedCells: PaintedCells,
  layers: Record<string, Layer>,
) {
  return [...new Set(
    Object.values(paintedCells)
      .filter((record) => layers[record.layerId]?.visible !== false)
      .map((record) => getRenderBatchChunkKeyForCell(record.cell)),
  )].sort()
}

function getChunkRect(chunkKey: string): FloorRenderRect {
  const [chunkXText, chunkZText] = chunkKey.split(':')
  const chunkX = Number.parseInt(chunkXText ?? '', 10)
  const chunkZ = Number.parseInt(chunkZText ?? '', 10)
  const normalizedChunkX = Number.isNaN(chunkX) ? 0 : chunkX
  const normalizedChunkZ = Number.isNaN(chunkZ) ? 0 : chunkZ

  return {
    minCellX: normalizedChunkX * DEFAULT_RENDER_BATCH_CHUNK_SIZE,
    maxCellX: (normalizedChunkX + 1) * DEFAULT_RENDER_BATCH_CHUNK_SIZE - 1,
    minCellZ: normalizedChunkZ * DEFAULT_RENDER_BATCH_CHUNK_SIZE,
    maxCellZ: (normalizedChunkZ + 1) * DEFAULT_RENDER_BATCH_CHUNK_SIZE - 1,
  }
}

function expandFloorRenderRect(rect: FloorRenderRect, haloCells: number): FloorRenderRect {
  return {
    minCellX: rect.minCellX - haloCells,
    maxCellX: rect.maxCellX + haloCells,
    minCellZ: rect.minCellZ - haloCells,
    maxCellZ: rect.maxCellZ + haloCells,
  }
}

function isCellInFloorRenderRect(cell: GridCell, rect: FloorRenderRect) {
  return (
    cell[0] >= rect.minCellX
    && cell[0] <= rect.maxCellX
    && cell[1] >= rect.minCellZ
    && cell[1] <= rect.maxCellZ
  )
}

function filterVisiblePaintedCellsByRect(
  paintedCells: PaintedCells,
  layers: Record<string, Layer>,
  rect: FloorRenderRect,
): PaintedCells {
  return Object.fromEntries(
    Object.entries(paintedCells).filter(([, record]) => {
      if (!isCellInFloorRenderRect(record.cell, rect)) {
        return false
      }
      const layer = layers[record.layerId]
      return layer?.visible !== false
    }),
  )
}

function filterVisibleOpeningRecordByRect(
  openings: Record<string, OpeningRecord>,
  layers: Record<string, Layer>,
  rect: FloorRenderRect,
): Record<string, OpeningRecord> {
  return Object.fromEntries(
    Object.entries(openings).filter(([, opening]) => {
      if (!isWallKeyInFloorRenderRect(opening.wallKey, rect)) {
        return false
      }
      const layer = layers[opening.layerId]
      return layer?.visible !== false
    }),
  )
}

function filterCellKeyRecordByRect<T>(
  records: Record<string, T>,
  rect: FloorRenderRect,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(records).filter(([cellKey]) => isCellKeyInFloorRenderRect(cellKey, rect)),
  )
}

function filterWallKeyRecordByRect<T>(
  records: Record<string, T>,
  rect: FloorRenderRect,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(records).filter(([wallKey]) => isWallKeyInFloorRenderRect(wallKey, rect)),
  )
}

function isCellKeyInFloorRenderRect(cellKey: string, rect: FloorRenderRect) {
  const cell = parseCellKey(cellKey)
  return cell ? isCellInFloorRenderRect(cell, rect) : false
}

function isWallKeyInFloorRenderRect(wallKey: string, rect: FloorRenderRect) {
  const wallCell = parseWallCellKey(wallKey)
  return wallCell ? isCellInFloorRenderRect(wallCell, rect) : false
}

function parseCellKey(cellKey: string): GridCell | null {
  const [cellXText, cellZText] = cellKey.split(':')
  const cellX = Number.parseInt(cellXText ?? '', 10)
  const cellZ = Number.parseInt(cellZText ?? '', 10)
  if (Number.isNaN(cellX) || Number.isNaN(cellZ)) {
    return null
  }

  return [cellX, cellZ]
}

function parseWallCellKey(wallKey: string): GridCell | null {
  const [cellXText, cellZText] = wallKey.split(':')
  const cellX = Number.parseInt(cellXText ?? '', 10)
  const cellZ = Number.parseInt(cellZText ?? '', 10)
  if (Number.isNaN(cellX) || Number.isNaN(cellZ)) {
    return null
  }

  return [cellX, cellZ]
}
