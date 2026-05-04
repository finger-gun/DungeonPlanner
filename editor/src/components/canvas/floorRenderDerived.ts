import { getContentPackAssetById } from '../../content-packs/registry'
import type { ContentPackModelTransform } from '../../content-packs/types'
import { GRID_SIZE, cellToWorldPosition, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import type { FloorDirtyInfo } from '../../store/floorDirtyDomains'
import { getInnerWallOwnerRecord } from '../../store/manualWalls'
import { buildWallOpeningDerivedState } from '../../store/derived/wallOpeningDerived'
import {
  buildFloorRenderPlan,
  type FloorRenderGroup,
  type FloorSurfacePlacement,
} from '../../store/floorSurfaceLayout'
import {
  collectBoundaryWallSegments,
  getInheritedWallAssetIdForWallKey,
  wallKeyToWorldPosition,
  type BoundaryWallSegment,
} from '../../store/wallSegments'
import type { InnerWallRecord, Layer, OpeningRecord, PaintedCells, Room } from '../../store/useDungeonStore'
import type { FloorDerivedBundle } from '../../store/derived/floorDerived'
import { deriveWallCornersFromSegments, type WallCornerInstance } from './wallCornerLayout'
import { getWallSpanInteriorLightDirections } from './wallLighting'
import { DEFAULT_RENDER_BATCH_CHUNK_SIZE, getRenderBatchChunkKeyForCell } from './batchDescriptors'

export type RoomWallInstance = {
  key: string
  assetId: string | null
  segmentKeys: string[]
  position: [number, number, number]
  rotation: [number, number, number]
  bakedLightDirection?: [number, number, number]
  bakedLightDirectionSecondary?: [number, number, number]
  objectProps?: Record<string, unknown>
}

export type RoomCornerRenderInstance = WallCornerInstance & {
  assetId: string | null
}

export type FloorReceiverCellInput = {
  cell: GridCell
  cellKey: string
  assetId: string | null
  coveredCellKeys?: string[]
  receiverTransformOverride?: ContentPackModelTransform
}

type BoundaryWallSegmentWithAsset = BoundaryWallSegment & {
  assetId: string | null
}

const WALL_CORNER_PILLAR_ASSET_ID = 'dungeon.props_pillars_pillar'

export type FloorRenderDerivedBundle = {
  floorGroups: FloorRenderGroup[]
  floorSurfaceEntries: FloorSurfacePlacement[]
  visibleFloorReceiverCells: FloorReceiverCellInput[]
  walls: RoomWallInstance[]
  corners: RoomCornerRenderInstance[]
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
  )

  return {
    floorGroups: floorRenderPlan.baseGroups as FloorRenderGroup[],
    floorSurfaceEntries: floorRenderPlan.surfacePlacements as FloorSurfacePlacement[],
    visibleFloorReceiverCells: options?.includeFloorReceivers === false
      ? []
      : deriveFloorReceiverCells(floorRenderPlan),
    walls: deriveWallInstances(
      input.visiblePaintedCellRecords,
      input.rooms,
      input.globalWallAssetId,
      input.wallSurfaceAssetIds,
      input.wallSurfaceProps,
      input.wallOpeningDerivedState.suppressedWallKeys,
      input.innerWalls,
    ),
    corners: deriveVisibleWallCorners(
      input.visiblePaintedCellRecords,
      input.rooms,
      input.globalWallAssetId,
      input.wallSurfaceAssetIds,
      input.wallOpeningDerivedState.suppressedWallKeys,
      input.innerWalls,
    ),
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
        groupKey: `${chunkKey}:${group.floorAssetId ?? 'none'}`,
        cells: chunkCells,
      }]
    }),
    floorSurfaceEntries: localBundle.floorSurfaceEntries.filter((placement) =>
      isCellInFloorRenderRect(placement.anchorCell, targetRect)),
    visibleFloorReceiverCells: localBundle.visibleFloorReceiverCells.filter((cell) =>
      isCellInFloorRenderRect(cell.cell, targetRect)),
    walls: localBundle.walls.filter((wall) => getChunkKeyForWallInstance(wall) === chunkKey),
    corners: localBundle.corners.filter((corner) => getChunkKeyForCornerInstance(corner) === chunkKey),
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
    || !dirtyInfo?.dirtyCellRect
    || dirtyInfo.fullRefresh

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

  const affectedChunkKeys = new Set(getChunkKeysForDirtyRect(dirtyInfo.dirtyCellRect, haloCells))
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
    accumulator.walls.push(...bundle.walls)
    accumulator.corners.push(...bundle.corners)
    return accumulator
  }, createEmptyFloorRenderDerivedBundle())
}

export function getChunkKeysForDirtyRect(
  dirtyRect: FloorDirtyInfo['dirtyCellRect'],
  haloCells = 0,
): string[] {
  if (!dirtyRect) {
    return []
  }

  const expanded = expandFloorRenderRect({
    minCellX: dirtyRect.minCellX,
    maxCellX: dirtyRect.maxCellX,
    minCellZ: dirtyRect.minCellZ,
    maxCellZ: dirtyRect.maxCellZ,
  }, haloCells)
  const minChunkX = Math.floor(expanded.minCellX / DEFAULT_RENDER_BATCH_CHUNK_SIZE)
  const maxChunkX = Math.floor(expanded.maxCellX / DEFAULT_RENDER_BATCH_CHUNK_SIZE)
  const minChunkZ = Math.floor(expanded.minCellZ / DEFAULT_RENDER_BATCH_CHUNK_SIZE)
  const maxChunkZ = Math.floor(expanded.maxCellZ / DEFAULT_RENDER_BATCH_CHUNK_SIZE)
  const chunkKeys: string[] = []

  for (let chunkZ = minChunkZ; chunkZ <= maxChunkZ; chunkZ += 1) {
    for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX += 1) {
      chunkKeys.push(`${chunkX}:${chunkZ}`)
    }
  }

  return chunkKeys
}

function deriveFloorReceiverCells(plan: ReturnType<typeof buildFloorRenderPlan>): FloorReceiverCellInput[] {
  return [
    ...plan.baseGroups.flatMap((group) => group.cells.map((cell) => {
      const cellKey = getCellKey(cell)
      return {
        cell,
        cellKey,
        assetId: plan.effectiveAssetIdsByCellKey[cellKey] ?? group.floorAssetId,
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
        ],
      },
    })),
  ]
}

function deriveWallInstances(
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalWallAssetId: string | null,
  wallSurfaceAssetIds: Record<string, string>,
  wallSurfaceProps: Record<string, Record<string, unknown>>,
  suppressedWallKeys: Set<string>,
  innerWalls: Record<string, InnerWallRecord>,
): RoomWallInstance[] {
  const wallSegments = collectRenderableWallSegments(
    paintedCells,
    rooms,
    globalWallAssetId,
    wallSurfaceAssetIds,
    suppressedWallKeys,
    innerWalls,
  )

  const groups = new Map<string, BoundaryWallSegmentWithAsset[]>()
  wallSegments.forEach((segment) => {
    const [xPart, zPart] = segment.key.split(':')
    const lineKey =
      segment.direction === 'north' || segment.direction === 'south'
        ? `${segment.direction}:${zPart}`
        : `${segment.direction}:${xPart}`
    const groupKey = `${segment.assetId ?? 'none'}|${lineKey}`
    if (!groups.has(groupKey)) {
      groups.set(groupKey, [])
    }
    groups.get(groupKey)!.push(segment)
  })

  const walls: RoomWallInstance[] = []
  groups.forEach((segments) => {
    const sorted = [...segments].sort((left, right) => left.index - right.index)
    let runStart = 0

    while (runStart < sorted.length) {
      let runEnd = runStart + 1
      while (runEnd < sorted.length && sorted[runEnd].index === sorted[runEnd - 1].index + 1) {
        runEnd += 1
      }

      const run = sorted.slice(runStart, runEnd)
      const wallSpan = getContentPackAssetById(run[0]?.assetId ?? '')?.metadata?.wallSpan ?? 1
      let offset = 0

      while (offset < run.length) {
        const remaining = run.length - offset
        const span = remaining >= wallSpan ? wallSpan : 1
        const segmentKeys = run.slice(offset, offset + span).map((segment) => segment.key)
        const transform = getWallSpanWorldTransform(segmentKeys)
        if (transform) {
          const interiorDirections = getWallSpanInteriorLightDirections(segmentKeys, paintedCells)
          const persistedProps = segmentKeys[0] ? wallSurfaceProps[segmentKeys[0]] : undefined
          const objectProps =
            wallSpan > 1
              ? { ...(persistedProps ?? {}), span }
              : persistedProps
          walls.push({
            key: segmentKeys.join('|'),
            assetId: run[offset]?.assetId ?? null,
            segmentKeys,
            position: transform.position,
            rotation: transform.rotation,
            bakedLightDirection: interiorDirections.primary,
            bakedLightDirectionSecondary: interiorDirections.secondary,
            ...(objectProps ? { objectProps } : {}),
          })
        }

        offset += span
      }

      runStart = runEnd
    }
  })

  return walls
}

function deriveVisibleWallCorners(
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalWallAssetId: string | null,
  wallSurfaceAssetIds: Record<string, string>,
  suppressedWallKeys: Set<string>,
  innerWalls: Record<string, InnerWallRecord>,
): RoomCornerRenderInstance[] {
  const wallSegments = collectRenderableWallSegments(
    paintedCells,
    rooms,
    globalWallAssetId,
    wallSurfaceAssetIds,
    suppressedWallKeys,
    innerWalls,
  )

  return deriveWallCornersFromSegments(wallSegments).map((corner) => ({
    ...corner,
    assetId: WALL_CORNER_PILLAR_ASSET_ID,
  }))
}

function collectRenderableWallSegments(
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalWallAssetId: string | null,
  wallSurfaceAssetIds: Record<string, string>,
  suppressedWallKeys: Set<string>,
  innerWalls: Record<string, InnerWallRecord>,
) {
  const boundarySegments = collectBoundaryWallSegments(paintedCells, { suppressedWallKeys }).map((segment) => ({
    ...segment,
    assetId:
      wallSurfaceAssetIds[segment.key] ??
      getInheritedWallAssetIdForWallKey(segment.key, paintedCells, rooms, globalWallAssetId),
  }))

  const explicitInnerSegments = Object.keys(innerWalls).flatMap<BoundaryWallSegmentWithAsset>((wallKey) => {
    const ownerRecord = getInnerWallOwnerRecord(wallKey, paintedCells)
    if (!ownerRecord) {
      return []
    }

    const room = ownerRecord.roomId ? rooms[ownerRecord.roomId] : null
    const parts = wallKey.split(':')
    const direction = parts[2] as BoundaryWallSegment['direction']
    const index =
      direction === 'north' || direction === 'south'
        ? ownerRecord.cell[0]
        : ownerRecord.cell[1]

    return [{
      key: wallKey,
      direction,
      index,
      assetId: room?.wallAssetId ?? globalWallAssetId,
    }]
  })

  return [...boundarySegments, ...explicitInnerSegments]
}

function getWallSpanWorldTransform(
  wallKeys: string[],
): { position: [number, number, number]; rotation: [number, number, number] } | null {
  if (wallKeys.length === 0) {
    return null
  }

  const transforms = wallKeys
    .map((wallKey) => wallKeyToWorldPosition(wallKey))
    .filter((transform): transform is NonNullable<ReturnType<typeof wallKeyToWorldPosition>> => Boolean(transform))

  if (transforms.length === 0) {
    return null
  }

  const position = transforms.reduce<[number, number, number]>(
    (accumulator, transform) => [
      accumulator[0] + transform.position[0],
      accumulator[1] + transform.position[1],
      accumulator[2] + transform.position[2],
    ],
    [0, 0, 0],
  )

  return {
    position: [
      position[0] / transforms.length,
      position[1] / transforms.length,
      position[2] / transforms.length,
    ],
    rotation: transforms[0].rotation,
  }
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
    walls: [],
    corners: [],
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

function getChunkKeyForWallInstance(wall: Pick<RoomWallInstance, 'segmentKeys' | 'position'>) {
  const wallCell = wall.segmentKeys[0] ? parseWallCellKey(wall.segmentKeys[0]) : null
  if (wallCell) {
    return getRenderBatchChunkKeyForCell(wallCell)
  }

  return getRenderBatchChunkKeyForCell([Math.round(wall.position[0]), Math.round(wall.position[2])])
}

function getChunkKeyForCornerInstance(corner: Pick<RoomCornerRenderInstance, 'key' | 'position'>) {
  const cornerCell = parseCellKey(corner.key)
  if (cornerCell) {
    return getRenderBatchChunkKeyForCell(cornerCell)
  }

  return getRenderBatchChunkKeyForCell([
    Math.round(corner.position[0] / GRID_SIZE),
    Math.round(corner.position[2] / GRID_SIZE),
  ])
}
