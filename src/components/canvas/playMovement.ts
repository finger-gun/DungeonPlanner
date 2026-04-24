import { GRID_SIZE, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import { getOpeningSegments } from '../../store/openingSegments'
import { getCanonicalInnerWallKey, getMirroredWallKey, type InnerWallRecord } from '../../store/manualWalls'
import { isWallBoundary, type WallDirection } from '../../store/wallSegments'
import type {
  BlockedCells,
  DungeonObjectRecord,
  MapMode,
  OpeningRecord,
  PaintedCells,
} from '../../store/useDungeonStore'

const DEFAULT_PLAYER_MOVEMENT_METERS = 10
const MOVEMENT_DIRECTIONS: Array<{ delta: GridCell, diagonal: boolean }> = [
  { delta: [1, 0], diagonal: false },
  { delta: [-1, 0], diagonal: false },
  { delta: [0, 1], diagonal: false },
  { delta: [0, -1], diagonal: false },
  { delta: [1, 1], diagonal: true },
  { delta: [1, -1], diagonal: true },
  { delta: [-1, 1], diagonal: true },
  { delta: [-1, -1], diagonal: true },
]

export type MovementRange = {
  originCell: GridCell
  meters: number
  squares: number
  reachableCells: GridCell[]
  reachableCellKeys: ReadonlySet<string>
}

type BuildMovementRangeInput = {
  object: DungeonObjectRecord
  originCell?: GridCell
  mapMode: MapMode
  paintedCells: PaintedCells
  blockedCells: BlockedCells
  wallOpenings: Record<string, OpeningRecord>
  innerWalls: Record<string, InnerWallRecord>
  occupancy: Record<string, string>
  placedObjects: Record<string, DungeonObjectRecord>
}

export function getObjectMovementMeters(object: Pick<DungeonObjectRecord, 'props'>) {
  const movementMeters = object.props.movementMeters
  return typeof movementMeters === 'number' && Number.isFinite(movementMeters) && movementMeters >= 0
    ? movementMeters
    : DEFAULT_PLAYER_MOVEMENT_METERS
}

export function metersToSquares(meters: number) {
  if (!Number.isFinite(meters) || meters <= 0) {
    return 0
  }

  return Math.floor(meters / GRID_SIZE)
}

export function buildMovementRange({
  object,
  originCell = object.cell,
  mapMode,
  paintedCells,
  blockedCells,
  wallOpenings,
  innerWalls,
  occupancy,
  placedObjects,
}: BuildMovementRangeInput): MovementRange {
  const meters = getObjectMovementMeters(object)
  const squares = metersToSquares(meters)
  const originKey = getCellKey(originCell)
  const reachableCellKeys = new Set<string>([originKey])
  const reachableCells: GridCell[] = [[originCell[0], originCell[1]]]
  const queue: Array<{ cell: GridCell, steps: number }> = [{ cell: originCell, steps: 0 }]
  const suppressedBoundaryWalls = getSuppressedBoundaryWalls(wallOpenings)

  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]
    if (!current || current.steps >= squares) {
      continue
    }

    for (const entry of MOVEMENT_DIRECTIONS) {
      const nextCell: GridCell = [
        current.cell[0] + entry.delta[0],
        current.cell[1] + entry.delta[1],
      ]
      const nextKey = getCellKey(nextCell)
      if (reachableCellKeys.has(nextKey)) {
        continue
      }

      if (!canTraverseCell({
        cell: nextCell,
        object,
        mapMode,
        paintedCells,
        blockedCells,
        occupancy,
        placedObjects,
      })) {
        continue
      }

      if (
        mapMode !== 'outdoor'
        && !canTraverseIndoorStep({
          from: current.cell,
          to: nextCell,
          diagonal: entry.diagonal,
          object,
          paintedCells,
          blockedCells,
          suppressedBoundaryWalls,
          innerWalls,
          occupancy,
          placedObjects,
          mapMode,
        })
      ) {
        continue
      }

      reachableCellKeys.add(nextKey)
      reachableCells.push(nextCell)
      queue.push({ cell: nextCell, steps: current.steps + 1 })
    }
  }

  return {
    originCell: [originCell[0], originCell[1]],
    meters,
    squares,
    reachableCells,
    reachableCellKeys,
  }
}

function getSuppressedBoundaryWalls(wallOpenings: Record<string, OpeningRecord>) {
  const suppressed = new Set<string>()

  Object.values(wallOpenings).forEach((opening) => {
    for (const segment of getOpeningSegments(opening.wallKey, opening.width)) {
      suppressed.add(segment)
      const mirrored = getMirroredWallKey(segment)
      if (mirrored) {
        suppressed.add(mirrored)
      }
    }
  })

  return suppressed
}

function canTraverseCell({
  cell,
  object,
  mapMode,
  paintedCells,
  blockedCells,
  occupancy,
  placedObjects,
}: {
  cell: GridCell
  object: DungeonObjectRecord
  mapMode: MapMode
  paintedCells: PaintedCells
  blockedCells: BlockedCells
  occupancy: Record<string, string>
  placedObjects: Record<string, DungeonObjectRecord>
}) {
  const cellKey = getCellKey(cell)
  if (mapMode !== 'outdoor' && !paintedCells[cellKey]) {
    return false
  }

  if (mapMode === 'outdoor' && blockedCells[cellKey]) {
    return false
  }

  const occupantId = occupancy[`${cellKey}:floor`]
  if (!occupantId || occupantId === object.id) {
    return true
  }

  const occupant = placedObjects[occupantId]
  return Boolean(
    mapMode === 'outdoor'
    && occupant
    && occupant.props.generatedBy === 'surrounding-forest',
  )
}

function canTraverseIndoorStep({
  from,
  to,
  diagonal,
  object,
  paintedCells,
  blockedCells,
  suppressedBoundaryWalls,
  innerWalls,
  occupancy,
  placedObjects,
  mapMode,
}: {
  from: GridCell
  to: GridCell
  diagonal: boolean
  object: DungeonObjectRecord
  paintedCells: PaintedCells
  blockedCells: BlockedCells
  suppressedBoundaryWalls: ReadonlySet<string>
  innerWalls: Record<string, InnerWallRecord>
  occupancy: Record<string, string>
  placedObjects: Record<string, DungeonObjectRecord>
  mapMode: MapMode
}) {
  const deltaX = to[0] - from[0]
  const deltaZ = to[1] - from[1]

  if (!diagonal) {
    return isCardinalIndoorStepPassable(from, to, paintedCells, suppressedBoundaryWalls, innerWalls)
  }

  const intermediateA: GridCell = [from[0] + deltaX, from[1]]
  const intermediateB: GridCell = [from[0], from[1] + deltaZ]

  return canTraverseCell({
    cell: intermediateA,
    object,
    mapMode,
    paintedCells,
    blockedCells,
    occupancy,
    placedObjects,
  })
    && canTraverseCell({
      cell: intermediateB,
      object,
      mapMode,
      paintedCells,
      blockedCells,
      occupancy,
      placedObjects,
    })
    && isCardinalIndoorStepPassable(from, intermediateA, paintedCells, suppressedBoundaryWalls, innerWalls)
    && isCardinalIndoorStepPassable(from, intermediateB, paintedCells, suppressedBoundaryWalls, innerWalls)
}

function isCardinalIndoorStepPassable(
  from: GridCell,
  to: GridCell,
  paintedCells: PaintedCells,
  suppressedBoundaryWalls: ReadonlySet<string>,
  innerWalls: Record<string, InnerWallRecord>,
) {
  const direction = getWallDirection(from, to)
  if (!direction) {
    return false
  }

  const wallKey = `${getCellKey(from)}:${direction}`
  if (isWallBoundary(from, to, paintedCells)) {
    return suppressedBoundaryWalls.has(wallKey)
  }

  const canonicalInnerWallKey = getCanonicalInnerWallKey(wallKey, paintedCells)
  return !(canonicalInnerWallKey && innerWalls[canonicalInnerWallKey])
}

function getWallDirection(from: GridCell, to: GridCell): WallDirection | null {
  const deltaX = to[0] - from[0]
  const deltaZ = to[1] - from[1]

  if (deltaX === 1 && deltaZ === 0) return 'east'
  if (deltaX === -1 && deltaZ === 0) return 'west'
  if (deltaX === 0 && deltaZ === 1) return 'north'
  if (deltaX === 0 && deltaZ === -1) return 'south'
  return null
}
