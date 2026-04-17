import {
  GRID_SIZE,
  cellToWorldPosition,
  getCellKey,
  type GridCell,
} from '../hooks/useSnapToGrid'
import type { PaintedCellRecord, PaintedCells, Room } from './useDungeonStore'

export type WallDirection = 'north' | 'south' | 'east' | 'west'

export type BoundaryWallSegment = {
  key: string
  direction: WallDirection
  index: number
}

export const WALL_DIRECTIONS: Array<{
  direction: WallDirection
  opposite: WallDirection
  delta: GridCell
  rotation: [number, number, number]
}> = [
  { direction: 'north', opposite: 'south', delta: [0, 1], rotation: [0, Math.PI, 0] },
  { direction: 'south', opposite: 'north', delta: [0, -1], rotation: [0, 0, 0] },
  { direction: 'east', opposite: 'west', delta: [1, 0], rotation: [0, -Math.PI / 2, 0] },
  { direction: 'west', opposite: 'east', delta: [-1, 0], rotation: [0, Math.PI / 2, 0] },
]

export function isWallBoundary(
  cell: GridCell,
  neighbor: GridCell,
  paintedCells: PaintedCells,
): boolean {
  const neighborRecord = paintedCells[getCellKey(neighbor)]
  if (!neighborRecord) return true
  const cellRecord = paintedCells[getCellKey(cell)]
  return (cellRecord?.roomId ?? null) !== (neighborRecord.roomId ?? null)
}

export function isInterRoomBoundary(
  cell: GridCell,
  neighbor: GridCell,
  paintedCells: PaintedCells,
): boolean {
  const cellRecord = paintedCells[getCellKey(cell)]
  const neighborRecord = paintedCells[getCellKey(neighbor)]
  return Boolean(
    cellRecord &&
    neighborRecord &&
    (cellRecord.roomId ?? null) !== (neighborRecord.roomId ?? null),
  )
}

export function getOppositeDirection(direction: WallDirection) {
  return WALL_DIRECTIONS.find((entry) => entry.direction === direction)?.opposite ?? direction
}

export function wallKeyToWorldPosition(
  wallKey: string,
): { position: [number, number, number]; rotation: [number, number, number] } | null {
  const parsed = parseWallKey(wallKey)
  if (!parsed) return null

  const center = cellToWorldPosition(parsed.cell)
  return {
    position: [
      center[0] + parsed.directionEntry.delta[0] * (GRID_SIZE * 0.5),
      0,
      center[2] + parsed.directionEntry.delta[1] * (GRID_SIZE * 0.5),
    ],
    rotation: parsed.directionEntry.rotation,
  }
}

export function collectBoundaryWallSegments(
  paintedCells: PaintedCells,
  options?: {
    interRoomOnly?: boolean
    suppressedWallKeys?: Set<string>
  },
): BoundaryWallSegment[] {
  const segments: BoundaryWallSegment[] = []
  const suppressedWallKeys = options?.suppressedWallKeys

  Object.values(paintedCells).forEach((record) => {
    const cell = record.cell
    const cellKey = getCellKey(cell)

    WALL_DIRECTIONS.forEach((directionEntry) => {
      const neighbor: GridCell = [
        cell[0] + directionEntry.delta[0],
        cell[1] + directionEntry.delta[1],
      ]
      const neighborKey = getCellKey(neighbor)
      const neighborRecord = paintedCells[neighborKey]
      const wallKey = `${cellKey}:${directionEntry.direction}`

      if (suppressedWallKeys?.has(wallKey)) {
        return
      }
      if (!isWallBoundary(cell, neighbor, paintedCells)) {
        return
      }
      if (options?.interRoomOnly && !isInterRoomBoundary(cell, neighbor, paintedCells)) {
        return
      }
      if (neighborRecord && cellKey > neighborKey) {
        return
      }

      segments.push({
        key: wallKey,
        direction: directionEntry.direction,
        index:
          directionEntry.direction === 'north' || directionEntry.direction === 'south'
            ? cell[0]
            : cell[1],
      })
    })
  })

  return segments
}

export function getCanonicalWallKey(
  wallKey: string,
  paintedCells: PaintedCells,
): string | null {
  const parsed = parseWallKey(wallKey)
  if (!parsed) {
    return null
  }

  const cellKey = getCellKey(parsed.cell)
  const cellRecord = paintedCells[cellKey]
  if (!cellRecord) {
    return null
  }

  const neighbor: GridCell = [
    parsed.cell[0] + parsed.directionEntry.delta[0],
    parsed.cell[1] + parsed.directionEntry.delta[1],
  ]
  const neighborKey = getCellKey(neighbor)
  const neighborRecord = paintedCells[neighborKey]

  if (!isWallBoundary(parsed.cell, neighbor, paintedCells)) {
    return null
  }

  if (!neighborRecord || cellKey <= neighborKey) {
    return wallKey
  }

  return `${neighborKey}:${parsed.directionEntry.opposite}`
}

export function getWallOwnerRecord(
  wallKey: string,
  paintedCells: PaintedCells,
): PaintedCellRecord | null {
  const canonicalKey = getCanonicalWallKey(wallKey, paintedCells)
  if (!canonicalKey) {
    return null
  }

  const parsed = parseWallKey(canonicalKey)
  if (!parsed) {
    return null
  }

  return paintedCells[getCellKey(parsed.cell)] ?? null
}

export function getInheritedWallAssetIdForWallKey(
  wallKey: string,
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalWallAssetId: string | null,
): string | null {
  const ownerRecord = getWallOwnerRecord(wallKey, paintedCells)
  if (!ownerRecord) {
    return globalWallAssetId
  }

  const room = ownerRecord.roomId ? rooms[ownerRecord.roomId] : null
  return room?.wallAssetId ?? globalWallAssetId
}

type ParsedWallKey = {
  cell: GridCell
  direction: WallDirection
  directionEntry: (typeof WALL_DIRECTIONS)[number]
}

function parseWallKey(wallKey: string): ParsedWallKey | null {
  const parts = wallKey.split(':')
  if (parts.length !== 3) return null

  const x = Number.parseInt(parts[0] ?? '', 10)
  const z = Number.parseInt(parts[1] ?? '', 10)
  if (Number.isNaN(x) || Number.isNaN(z)) {
    return null
  }

  const direction = parts[2] as WallDirection
  const directionEntry = WALL_DIRECTIONS.find((entry) => entry.direction === direction)
  if (!directionEntry) {
    return null
  }

  return {
    cell: [x, z],
    direction,
    directionEntry,
  }
}
