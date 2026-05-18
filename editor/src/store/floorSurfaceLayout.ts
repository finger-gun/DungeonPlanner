import {
  getContentPackAssetById,
  getContentPackRoomSetById,
  getDefaultAssetIdByCategory,
} from '../content-packs/registry'
import type { TileSpan } from '../content-packs/types'
import {
  GRID_SIZE,
  cellToWorldPosition,
  getCellKey,
  type GridCell,
} from '../hooks/useSnapToGrid'
import type { PaintedCells, Room } from './useDungeonStore'
import type { SplineWallGraph } from './splineWallGraph'
import { createSplineWallQueryCache } from './splineWallQueries'
import { buildCoveredCellsForPolygon } from './roomDraftClip'

const SINGLE_TILE_SPAN = { gridWidth: 1, gridHeight: 1 } satisfies TileSpan
const ZERO_ROTATION = [0, 0, 0] as const
const ROOM_SET_CONTENT_PACK_ID = 'dungeon'

type FloorRotation = readonly [number, number, number]

type ResolvedInheritedFloorRender = {
  assetId: string | null
  rotation: FloorRotation
  groupKey: string
}

export type FloorSurfacePlacement = {
  anchorCell: GridCell
  anchorCellKey: string
  assetId: string
  tileSpan: TileSpan
  coveredCells: GridCell[]
  coveredCellKeys: string[]
  position: [number, number, number]
  roomId?: string | null
}

export type FloorRenderGroup = {
  groupKey: string
  floorAssetId: string | null
  rotation: FloorRotation
  cells: GridCell[]
  roomId?: string | null
}

export type FloorRenderPlan = {
  baseGroups: FloorRenderGroup[]
  surfacePlacements: FloorSurfacePlacement[]
  effectiveAssetIdsByCellKey: Record<string, string | null>
  effectiveRotationsByCellKey: Record<string, FloorRotation>
  surfaceAnchorByCoveredCellKey: Record<string, string>
}

export function getFloorTileSpan(assetId: string | null | undefined): TileSpan {
  return assetId
    ? (getContentPackAssetById(assetId)?.metadata?.tileSpan ?? SINGLE_TILE_SPAN)
    : SINGLE_TILE_SPAN
}

export function isMultiTileFloorAsset(assetId: string | null | undefined) {
  const span = getFloorTileSpan(assetId)
  return span.gridWidth > 1 || span.gridHeight > 1
}

export function isSingleTileSpan(span: TileSpan) {
  return span.gridWidth === 1 && span.gridHeight === 1
}

export function getFloorSurfaceCoveredCells(anchorCell: GridCell, assetId: string): GridCell[] {
  const span = getFloorTileSpan(assetId)
  const cells: GridCell[] = []

  for (let dz = 0; dz < span.gridHeight; dz += 1) {
    for (let dx = 0; dx < span.gridWidth; dx += 1) {
      cells.push([anchorCell[0] + dx, anchorCell[1] + dz])
    }
  }

  return cells
}

export function getFloorSurfaceWorldPosition(anchorCell: GridCell, assetId: string): [number, number, number] {
  const span = getFloorTileSpan(assetId)
  const [baseX, baseY, baseZ] = cellToWorldPosition(anchorCell)
  return [
    baseX + ((span.gridWidth - 1) * GRID_SIZE) / 2,
    baseY,
    baseZ + ((span.gridHeight - 1) * GRID_SIZE) / 2,
  ]
}

export function createFloorSurfacePlacement(anchorCellKey: string, assetId: string): FloorSurfacePlacement | null {
  const anchorCell = parseFloorCellKey(anchorCellKey)
  if (!anchorCell) {
    return null
  }

  const tileSpan = getFloorTileSpan(assetId)
  return {
    anchorCell,
    anchorCellKey,
    assetId,
    tileSpan,
    coveredCells: getFloorSurfaceCoveredCells(anchorCell, assetId),
    coveredCellKeys: getFloorSurfaceCoveredCells(anchorCell, assetId).map(getCellKey),
    position: getFloorSurfaceWorldPosition(anchorCell, assetId),
    roomId: null,
  }
}

export function isFloorSurfacePlacementValid(
  anchorCellKey: string,
  assetId: string,
  paintedCells: PaintedCells,
) {
  const placement = createFloorSurfacePlacement(anchorCellKey, assetId)
  return Boolean(placement && placement.coveredCellKeys.every((cellKey) => Boolean(paintedCells[cellKey])))
}

export function buildFloorSurfacePlacements(
  paintedCells: PaintedCells,
  floorTileAssetIds: Record<string, string>,
): FloorSurfacePlacement[] {
  return Object.entries(floorTileAssetIds)
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .flatMap(([anchorCellKey, assetId]) => {
      if (!paintedCells[anchorCellKey] || !isFloorSurfacePlacementValid(anchorCellKey, assetId, paintedCells)) {
        return []
      }

      const placement = createFloorSurfacePlacement(anchorCellKey, assetId)
      return placement ? [{
        ...placement,
        roomId: paintedCells[anchorCellKey]?.roomId ?? null,
      }] : []
    })
}

export function findFloorSurfaceAnchorAtCell(
  cellKey: string,
  paintedCells: PaintedCells,
  floorTileAssetIds: Record<string, string>,
) {
  for (const placement of buildFloorSurfacePlacements(paintedCells, floorTileAssetIds)) {
    if (placement.coveredCellKeys.includes(cellKey)) {
      return placement.anchorCellKey
    }
  }

  return null
}

export function collectOverlappingFloorSurfaceAnchors(
  anchorCellKey: string,
  assetId: string,
  paintedCells: PaintedCells,
  floorTileAssetIds: Record<string, string>,
) {
  const placement = createFloorSurfacePlacement(anchorCellKey, assetId)
  if (!placement) {
    return []
  }

  const targetCoveredKeys = new Set(placement.coveredCellKeys)
  return buildFloorSurfacePlacements(paintedCells, floorTileAssetIds)
    .filter((existingPlacement) =>
      existingPlacement.coveredCellKeys.some((cellKey) => targetCoveredKeys.has(cellKey)))
    .map((existingPlacement) => existingPlacement.anchorCellKey)
}

export function getInheritedFloorAssetIdForCellKey(
  cellKey: string,
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalFloorAssetId: string | null,
) {
  return resolveInheritedFloorRenderForCellKey(cellKey, paintedCells, rooms, globalFloorAssetId).assetId
}

export function getRenderableInheritedFloorAssetId(assetId: string | null) {
  if (!assetId) {
    return null
  }

  if (!isMultiTileFloorAsset(assetId)) {
    return assetId
  }

  return getDefaultAssetIdByCategory('floor')
}

export function resolveEffectiveFloorAssetIdForCellKey(
  cellKey: string,
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalFloorAssetId: string | null,
  floorTileAssetIds: Record<string, string>,
) {
  const anchorCellKey = findFloorSurfaceAnchorAtCell(cellKey, paintedCells, floorTileAssetIds)
  if (anchorCellKey) {
    return floorTileAssetIds[anchorCellKey] ?? null
  }

  return getRenderableInheritedFloorAssetId(
    getInheritedFloorAssetIdForCellKey(cellKey, paintedCells, rooms, globalFloorAssetId),
  )
}

export function buildFloorRenderPlan(
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalFloorAssetId: string | null,
  floorTileAssetIds: Record<string, string>,
  splineWallGraph?: SplineWallGraph | null,
): FloorRenderPlan {
  const surfacePlacements = buildFloorSurfacePlacements(paintedCells, floorTileAssetIds)
  const surfaceAnchorByCoveredCellKey = Object.fromEntries(
    surfacePlacements.flatMap((placement) =>
      placement.coveredCellKeys.map((cellKey) => [cellKey, placement.anchorCellKey])),
  ) as Record<string, string>
  const surfaceAnchorByCoveredRoomCellKey = Object.fromEntries(
    surfacePlacements.flatMap((placement) =>
      placement.coveredCellKeys.map((cellKey) => [
        getRoomScopedFloorCellKey(placement.roomId ?? null, cellKey),
        placement.anchorCellKey,
      ])),
  ) as Record<string, string>
  const effectiveAssetIdsByCellKey: Record<string, string | null> = {}
  const effectiveRotationsByCellKey: Record<string, FloorRotation> = {}
  const baseGroups = new Map<string, FloorRenderGroup>()
  const graphRoomCellsByRoomId = buildGraphRoomCellsByRoomId(paintedCells, splineWallGraph)
  const graphRoomIds = new Set(Object.keys(graphRoomCellsByRoomId))

  surfacePlacements.forEach((placement) => {
    placement.coveredCellKeys.forEach((cellKey) => {
      if (!(cellKey in effectiveAssetIdsByCellKey)) {
        effectiveAssetIdsByCellKey[cellKey] = placement.assetId
      }
      if (!(cellKey in effectiveRotationsByCellKey)) {
        effectiveRotationsByCellKey[cellKey] = ZERO_ROTATION
      }
    })
  })

  Object.entries(graphRoomCellsByRoomId).forEach(([roomId, cells]) => {
    const room = rooms[roomId] ?? null
    cells.forEach((cell) => {
      const cellKey = getCellKey(cell)
      if (surfaceAnchorByCoveredRoomCellKey[getRoomScopedFloorCellKey(roomId, cellKey)]) {
        return
      }

      const resolvedFloor = resolveInheritedFloorRender(
        room,
        cell,
        globalFloorAssetId,
      )
      const groupKey = `${roomId}:${resolvedFloor.groupKey}`
      if (!baseGroups.has(groupKey)) {
        baseGroups.set(groupKey, {
          groupKey,
          floorAssetId: resolvedFloor.assetId,
          rotation: resolvedFloor.rotation,
          cells: [],
          roomId,
        })
      }
      baseGroups.get(groupKey)!.cells.push(cell)
      if (!(cellKey in effectiveAssetIdsByCellKey)) {
        effectiveAssetIdsByCellKey[cellKey] = resolvedFloor.assetId
      }
      if (!(cellKey in effectiveRotationsByCellKey)) {
        effectiveRotationsByCellKey[cellKey] = resolvedFloor.rotation
      }
    })
  })

  Object.entries(paintedCells).forEach(([cellKey, record]) => {
    if (record.roomId && graphRoomIds.has(record.roomId)) {
      return
    }

    if (surfaceAnchorByCoveredRoomCellKey[getRoomScopedFloorCellKey(record.roomId ?? null, cellKey)]) {
      return
    }

    const resolvedFloor = resolveInheritedFloorRender(
      record.roomId ? rooms[record.roomId] : null,
      record.cell,
      globalFloorAssetId,
    )
    const roomId = record.roomId ?? null
    const groupKey = `${roomId ?? 'legacy'}:${resolvedFloor.groupKey}`
    if (!baseGroups.has(groupKey)) {
      baseGroups.set(groupKey, {
        groupKey,
        floorAssetId: resolvedFloor.assetId,
        rotation: resolvedFloor.rotation,
        cells: [],
        roomId,
      })
    }
    baseGroups.get(groupKey)!.cells.push(record.cell)
    effectiveAssetIdsByCellKey[cellKey] = resolvedFloor.assetId
    effectiveRotationsByCellKey[cellKey] = resolvedFloor.rotation
  })

  return {
    baseGroups: Array.from(baseGroups.values()),
    surfacePlacements,
    effectiveAssetIdsByCellKey,
    effectiveRotationsByCellKey,
    surfaceAnchorByCoveredCellKey,
  }
}

function buildGraphRoomCellsByRoomId(
  paintedCells: PaintedCells,
  splineWallGraph: SplineWallGraph | null | undefined,
) {
  if (!splineWallGraph) {
    return {} as Record<string, GridCell[]>
  }

  const roomIds = new Set(
    Object.values(paintedCells)
      .map((record) => record.roomId)
      .filter((roomId): roomId is string => typeof roomId === 'string' && roomId.length > 0),
  )
  if (roomIds.size === 0) {
    return {} as Record<string, GridCell[]>
  }

  const queryCache = createSplineWallQueryCache(splineWallGraph, { roomIds })
  return Object.fromEntries(
    Object.entries(queryCache.rooms).flatMap(([roomId, room]) => {
      const coveredCells: GridCell[] = []
      const seenCellKeys = new Set<string>()

      room.polygons.forEach((polygon) => {
        buildCoveredCellsForPolygon(polygon, getPolygonGridBounds(polygon)).forEach((cell) => {
          const cellKey = getCellKey(cell)
          if (seenCellKeys.has(cellKey)) {
            return
          }
          seenCellKeys.add(cellKey)
          coveredCells.push(cell)
        })
      })

      return coveredCells.length > 0
        ? [[roomId, coveredCells] as const]
        : []
    }),
  )
}

function getPolygonGridBounds(
  polygon: readonly (readonly [number, number])[],
) {
  const worldBounds = polygon.reduce((bounds, point) => ({
    minX: Math.min(bounds.minX, point[0]),
    maxX: Math.max(bounds.maxX, point[0]),
    minZ: Math.min(bounds.minZ, point[1]),
    maxZ: Math.max(bounds.maxZ, point[1]),
  }), {
    minX: Number.POSITIVE_INFINITY,
    maxX: Number.NEGATIVE_INFINITY,
    minZ: Number.POSITIVE_INFINITY,
    maxZ: Number.NEGATIVE_INFINITY,
  })

  return {
    minX: Math.floor(worldBounds.minX / GRID_SIZE),
    maxX: Math.ceil(worldBounds.maxX / GRID_SIZE) - 1,
    minZ: Math.floor(worldBounds.minZ / GRID_SIZE),
    maxZ: Math.ceil(worldBounds.maxZ / GRID_SIZE) - 1,
  }
}

function getRoomScopedFloorCellKey(roomId: string | null, cellKey: string) {
  return `${roomId ?? 'legacy'}:${cellKey}`
}

function resolveInheritedFloorRenderForCellKey(
  cellKey: string,
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalFloorAssetId: string | null,
): ResolvedInheritedFloorRender {
  const record = paintedCells[cellKey]
  const cell = record?.cell ?? parseFloorCellKey(cellKey)
  return resolveInheritedFloorRender(
    record?.roomId ? rooms[record.roomId] : null,
    cell,
    globalFloorAssetId,
  )
}

function resolveInheritedFloorRender(
  room: Room | null | undefined,
  cell: GridCell | null | undefined,
  globalFloorAssetId: string | null,
): ResolvedInheritedFloorRender {
  if (room?.floorAssetId) {
    return createResolvedInheritedFloorRender(room.floorAssetId, ZERO_ROTATION)
  }

  const roomSet = getContentPackRoomSetById(ROOM_SET_CONTENT_PACK_ID, room?.roomSetId)
  if (roomSet) {
    if (roomSet.floor.kind === 'single') {
      return createResolvedInheritedFloorRender(roomSet.floor.assetId, ZERO_ROTATION)
    }

    const assetIds = roomSet.floor.assetIds.filter(Boolean)
    if (assetIds.length > 0 && cell) {
      const variationSeed = hashSeedString(`${roomSet.id}:${room?.id ?? 'room-set'}`)
      const assetIndex = hashCellVariation(variationSeed, cell, 0) % assetIds.length
      const quarterTurns = roomSet.floor.randomQuarterTurns
        ? (1 + (hashCellVariation(variationSeed, cell, 1) % 3)) as 1 | 2 | 3
        : 0
      return createResolvedInheritedFloorRender(
        assetIds[assetIndex] ?? globalFloorAssetId,
        quarterTurnRotation(quarterTurns),
      )
    }
  }

  return createResolvedInheritedFloorRender(globalFloorAssetId, ZERO_ROTATION)
}

function createResolvedInheritedFloorRender(
  assetId: string | null,
  rotation: FloorRotation,
): ResolvedInheritedFloorRender {
  const renderableAssetId = getRenderableInheritedFloorAssetId(assetId)
  const renderableRotation = renderableAssetId === assetId ? rotation : ZERO_ROTATION
  return {
    assetId: renderableAssetId,
    rotation: renderableRotation,
    groupKey: `${renderableAssetId ?? 'none'}:${renderableRotation.join(',')}`,
  }
}

function quarterTurnRotation(quarterTurns: 0 | 1 | 2 | 3): FloorRotation {
  return [0, quarterTurns * (Math.PI / 2), 0] as const
}

function hashSeedString(value: string) {
  let hash = 2166136261 >>> 0

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619) >>> 0
  }

  return hash >>> 0
}

function hashCellVariation(seed: number, cell: GridCell, channel: number) {
  let hash =
    (seed
      ^ Math.imul(cell[0], 0x9e3779b1)
      ^ Math.imul(cell[1], 0x85ebca6b)
      ^ Math.imul(channel, 0xc2b2ae35)) >>> 0

  hash ^= hash >>> 16
  hash = Math.imul(hash, 0x7feb352d) >>> 0
  hash ^= hash >>> 15
  hash = Math.imul(hash, 0x846ca68b) >>> 0
  hash ^= hash >>> 16

  return hash >>> 0
}

function parseFloorCellKey(cellKey: string): GridCell | null {
  const [xPart, zPart] = cellKey.split(':')
  const x = Number.parseInt(xPart ?? '', 10)
  const z = Number.parseInt(zPart ?? '', 10)
  if (Number.isNaN(x) || Number.isNaN(z)) {
    return null
  }

  return [x, z]
}
