import { getCellKey, type GridCell } from '../hooks/useSnapToGrid'
import type { PaintedCellRecord, PaintedCells } from './useDungeonStore'
import { getOppositeDirection, isWallBoundary, type WallDirection, WALL_DIRECTIONS } from './wallSegments'

export type InnerWallRecord = {
  wallKey: string
  layerId: string
}

type ParsedWallKey = {
  cell: GridCell
  direction: WallDirection
  delta: GridCell
}

export function parseDirectedWallKey(wallKey: string): ParsedWallKey | null {
  const parts = wallKey.split(':')
  if (parts.length !== 3) {
    return null
  }

  const x = Number.parseInt(parts[0] ?? '', 10)
  const z = Number.parseInt(parts[1] ?? '', 10)
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
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
    delta: directionEntry.delta,
  }
}

export function getMirroredWallKey(wallKey: string) {
  const parsed = parseDirectedWallKey(wallKey)
  if (!parsed) {
    return null
  }

  const neighbor: GridCell = [
    parsed.cell[0] + parsed.delta[0],
    parsed.cell[1] + parsed.delta[1],
  ]

  return `${getCellKey(neighbor)}:${getOppositeDirection(parsed.direction)}`
}

export function getCanonicalPaintedWallKey(
  wallKey: string,
  paintedCells: PaintedCells,
) {
  const parsed = parseDirectedWallKey(wallKey)
  if (!parsed) {
    return null
  }

  const cellKey = getCellKey(parsed.cell)
  const neighbor: GridCell = [
    parsed.cell[0] + parsed.delta[0],
    parsed.cell[1] + parsed.delta[1],
  ]
  const neighborKey = getCellKey(neighbor)

  if (!paintedCells[cellKey] || !paintedCells[neighborKey]) {
    return null
  }

  if (cellKey <= neighborKey) {
    return wallKey
  }

  return `${neighborKey}:${getOppositeDirection(parsed.direction)}`
}

export function getCanonicalInnerWallKey(
  wallKey: string,
  paintedCells: PaintedCells,
) {
  const canonicalWallKey = getCanonicalPaintedWallKey(wallKey, paintedCells)
  if (!canonicalWallKey) {
    return null
  }

  const parsed = parseDirectedWallKey(canonicalWallKey)
  if (!parsed) {
    return null
  }

  const neighbor: GridCell = [
    parsed.cell[0] + parsed.delta[0],
    parsed.cell[1] + parsed.delta[1],
  ]

  return isWallBoundary(parsed.cell, neighbor, paintedCells) ? null : canonicalWallKey
}

export function getInnerWallOwnerRecord(
  wallKey: string,
  paintedCells: PaintedCells,
): PaintedCellRecord | null {
  const canonicalWallKey = getCanonicalInnerWallKey(wallKey, paintedCells)
  if (!canonicalWallKey) {
    return null
  }

  const parsed = parseDirectedWallKey(canonicalWallKey)
  if (!parsed) {
    return null
  }

  return paintedCells[getCellKey(parsed.cell)] ?? null
}
