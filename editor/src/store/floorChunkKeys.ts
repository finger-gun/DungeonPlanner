import { getCellKey, type GridCell } from '../hooks/useSnapToGrid'
import type { FloorDirtyRect } from './floorDirtyDomains'

export const DEFAULT_FLOOR_CHUNK_SIZE = 8
export const DEFAULT_FLOOR_RENDER_CHUNK_SIZE = DEFAULT_FLOOR_CHUNK_SIZE

export function getFloorChunkKeyForCell(
  cell: readonly [number, number],
  chunkSize: number = DEFAULT_FLOOR_RENDER_CHUNK_SIZE,
) {
  return `${Math.floor(cell[0] / chunkSize)}:${Math.floor(cell[1] / chunkSize)}`
}

export function getFloorChunkKeysForCells(
  cells: Iterable<GridCell | string> | undefined,
  options?: {
    chunkSize?: number
    haloCells?: number
  },
) {
  if (!cells) {
    return []
  }

  const chunkSize = options?.chunkSize ?? DEFAULT_FLOOR_RENDER_CHUNK_SIZE
  const haloCells = options?.haloCells ?? 0
  const chunkKeys = new Set<string>()

  for (const entry of cells) {
    const parsed = parseCellKey(typeof entry === 'string' ? entry : getCellKey(entry))
    if (!parsed) {
      continue
    }

    for (let cellZ = parsed.cellZ - haloCells; cellZ <= parsed.cellZ + haloCells; cellZ += 1) {
      for (let cellX = parsed.cellX - haloCells; cellX <= parsed.cellX + haloCells; cellX += 1) {
        chunkKeys.add(getFloorChunkKeyForCell([cellX, cellZ], chunkSize))
      }
    }
  }

  return [...chunkKeys].sort()
}

export function getFloorChunkKeysForRect(
  dirtyRect: FloorDirtyRect,
  options?: {
    chunkSize?: number
    haloCells?: number
  },
) {
  if (!dirtyRect) {
    return []
  }

  const chunkSize = options?.chunkSize ?? DEFAULT_FLOOR_RENDER_CHUNK_SIZE
  const haloCells = options?.haloCells ?? 0
  const minChunkX = Math.floor((dirtyRect.minCellX - haloCells) / chunkSize)
  const maxChunkX = Math.floor((dirtyRect.maxCellX + haloCells) / chunkSize)
  const minChunkZ = Math.floor((dirtyRect.minCellZ - haloCells) / chunkSize)
  const maxChunkZ = Math.floor((dirtyRect.maxCellZ + haloCells) / chunkSize)
  const chunkKeys: string[] = []

  for (let chunkZ = minChunkZ; chunkZ <= maxChunkZ; chunkZ += 1) {
    for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX += 1) {
      chunkKeys.push(`${chunkX}:${chunkZ}`)
    }
  }

  return chunkKeys
}

function parseCellKey(cellKey: string) {
  const [cellXPart, cellZPart] = cellKey.split(':')
  const cellX = Number.parseInt(cellXPart ?? '', 10)
  const cellZ = Number.parseInt(cellZPart ?? '', 10)
  if (Number.isNaN(cellX) || Number.isNaN(cellZ)) {
    return null
  }

  return { cellX, cellZ }
}
