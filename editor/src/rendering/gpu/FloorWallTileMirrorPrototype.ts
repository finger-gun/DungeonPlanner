import type { FloorDirtyInfo, FloorDirtyRect } from '../../store/floorDirtyDomains'
import type {
  InnerWallRecord,
  OpeningRecord,
  PaintedCells,
} from '../../store/useDungeonStore'
import { DEFAULT_FLOOR_CHUNK_SIZE } from '../../store/floorChunkKeys'

export const DEFAULT_FLOOR_WALL_TILE_MIRROR_CHUNK_SIZE = DEFAULT_FLOOR_CHUNK_SIZE
export const FLOOR_TILE_MIRROR_STRIDE = 4
export const FLOOR_OPENING_MIRROR_STRIDE = 4
export const FLOOR_INNER_WALL_MIRROR_STRIDE = 4

export type FloorWallTileMirrorPrototypeInput = {
  floorId: string
  paintedCells: PaintedCells
  wallOpenings: Record<string, OpeningRecord>
  innerWalls: Record<string, InnerWallRecord>
  dirtyHint?: Pick<FloorDirtyInfo, 'dirtyCellRect' | 'dirtyWallKeys' | 'fullRefresh'> | null
  chunkSize?: number
}

export type FloorWallTileMirrorPrototypePackedJob = {
  floorId: string
  chunkSize: number
  dirtyChunkKeys: string[]
  tileCellKeys: string[]
  openingWallKeys: string[]
  innerWallKeys: string[]
  buffers: {
    tileData: Int32Array
    openingData: Int32Array
    innerWallData: Int32Array
  }
}

type ParsedWallKey = {
  wallKey: string
  cellX: number
  cellZ: number
  directionCode: number
}

export function packFloorWallTileMirrorPrototype({
  floorId,
  paintedCells,
  wallOpenings,
  innerWalls,
  dirtyHint = null,
  chunkSize = DEFAULT_FLOOR_WALL_TILE_MIRROR_CHUNK_SIZE,
}: FloorWallTileMirrorPrototypeInput): FloorWallTileMirrorPrototypePackedJob {
  const tileEntries = Object.entries(paintedCells)
    .filter(([, record]) => shouldIncludeCell(record.cell[0], record.cell[1], dirtyHint))
    .sort(compareTileEntries)

  const dirtyWallKeySet = new Set(dirtyHint?.dirtyWallKeys ?? [])
  const openingEntries = Object.values(wallOpenings)
    .filter((opening) => shouldIncludeWallKey(opening.wallKey, dirtyHint, dirtyWallKeySet))
    .map((opening) => ({ wallKey: opening.wallKey, width: opening.width }))
    .sort((left, right) => left.wallKey.localeCompare(right.wallKey))

  const innerWallEntries = Object.values(innerWalls)
    .filter((innerWall) => shouldIncludeWallKey(innerWall.wallKey, dirtyHint, dirtyWallKeySet))
    .map((innerWall) => ({ wallKey: innerWall.wallKey }))
    .sort((left, right) => left.wallKey.localeCompare(right.wallKey))

  const dirtyChunkKeys = new Set<string>()
  const tileData = new Int32Array(tileEntries.length * FLOOR_TILE_MIRROR_STRIDE)
  tileEntries.forEach(([, record], index) => {
    const offset = index * FLOOR_TILE_MIRROR_STRIDE
    tileData[offset + 0] = record.cell[0]
    tileData[offset + 1] = record.cell[1]
    tileData[offset + 2] = 1
    tileData[offset + 3] = record.roomId ? 1 : 0
    dirtyChunkKeys.add(getChunkKey(record.cell[0], record.cell[1], chunkSize))
  })

  const openingData = new Int32Array(openingEntries.length * FLOOR_OPENING_MIRROR_STRIDE)
  openingEntries.forEach((opening, index) => {
    const parsed = parseWallKey(opening.wallKey)
    if (!parsed) {
      return
    }

    const offset = index * FLOOR_OPENING_MIRROR_STRIDE
    openingData[offset + 0] = parsed.cellX
    openingData[offset + 1] = parsed.cellZ
    openingData[offset + 2] = parsed.directionCode
    openingData[offset + 3] = opening.width
    dirtyChunkKeys.add(getChunkKey(parsed.cellX, parsed.cellZ, chunkSize))
  })

  const innerWallData = new Int32Array(innerWallEntries.length * FLOOR_INNER_WALL_MIRROR_STRIDE)
  innerWallEntries.forEach((innerWall, index) => {
    const parsed = parseWallKey(innerWall.wallKey)
    if (!parsed) {
      return
    }

    const offset = index * FLOOR_INNER_WALL_MIRROR_STRIDE
    innerWallData[offset + 0] = parsed.cellX
    innerWallData[offset + 1] = parsed.cellZ
    innerWallData[offset + 2] = parsed.directionCode
    innerWallData[offset + 3] = 1
    dirtyChunkKeys.add(getChunkKey(parsed.cellX, parsed.cellZ, chunkSize))
  })

  return {
    floorId,
    chunkSize,
    dirtyChunkKeys: [...dirtyChunkKeys].sort(),
    tileCellKeys: tileEntries.map(([cellKey]) => cellKey),
    openingWallKeys: openingEntries.map((entry) => entry.wallKey),
    innerWallKeys: innerWallEntries.map((entry) => entry.wallKey),
    buffers: {
      tileData,
      openingData,
      innerWallData,
    },
  }
}

function shouldIncludeCell(cellX: number, cellZ: number, dirtyHint: FloorWallTileMirrorPrototypeInput['dirtyHint']) {
  if (!dirtyHint || dirtyHint.fullRefresh || !dirtyHint.dirtyCellRect) {
    return true
  }

  return isPointInsideRect(cellX, cellZ, dirtyHint.dirtyCellRect)
}

function shouldIncludeWallKey(
  wallKey: string,
  dirtyHint: FloorWallTileMirrorPrototypeInput['dirtyHint'],
  dirtyWallKeySet: ReadonlySet<string>,
) {
  if (!dirtyHint || dirtyHint.fullRefresh) {
    return true
  }

  if (dirtyWallKeySet.has(wallKey)) {
    return true
  }

  if (!dirtyHint.dirtyCellRect) {
    return dirtyWallKeySet.size === 0
  }

  const parsed = parseWallKey(wallKey)
  return Boolean(parsed && isPointInsideRect(parsed.cellX, parsed.cellZ, dirtyHint.dirtyCellRect, 1))
}

function isPointInsideRect(cellX: number, cellZ: number, rect: FloorDirtyRect, padding = 0) {
  if (!rect) {
    return true
  }

  return (
    cellX >= rect.minCellX - padding
    && cellX <= rect.maxCellX + padding
    && cellZ >= rect.minCellZ - padding
    && cellZ <= rect.maxCellZ + padding
  )
}

function getChunkKey(cellX: number, cellZ: number, chunkSize: number) {
  return `${Math.floor(cellX / chunkSize)}:${Math.floor(cellZ / chunkSize)}`
}

function compareTileEntries(
  [leftKey, left]: [string, PaintedCells[string]],
  [rightKey, right]: [string, PaintedCells[string]],
) {
  return left.cell[1] - right.cell[1] || left.cell[0] - right.cell[0] || leftKey.localeCompare(rightKey)
}

function parseWallKey(wallKey: string): ParsedWallKey | null {
  const [cellXPart, cellZPart, directionPart] = wallKey.split(':')
  const cellX = Number.parseInt(cellXPart ?? '', 10)
  const cellZ = Number.parseInt(cellZPart ?? '', 10)
  const directionCode = getDirectionCode(directionPart ?? '')
  if (Number.isNaN(cellX) || Number.isNaN(cellZ) || directionCode === -1) {
    return null
  }

  return {
    wallKey,
    cellX,
    cellZ,
    directionCode,
  }
}

function getDirectionCode(direction: string) {
  switch (direction) {
    case 'north':
      return 0
    case 'east':
      return 1
    case 'south':
      return 2
    case 'west':
      return 3
    default:
      return -1
  }
}

export function createFloorWallTileMirrorDirtyHint(cellKeys: Array<[number, number]>) {
  if (cellKeys.length === 0) {
    return null
  }

  let minCellX = Number.POSITIVE_INFINITY
  let maxCellX = Number.NEGATIVE_INFINITY
  let minCellZ = Number.POSITIVE_INFINITY
  let maxCellZ = Number.NEGATIVE_INFINITY
  cellKeys.forEach((cell) => {
    minCellX = Math.min(minCellX, cell[0])
    maxCellX = Math.max(maxCellX, cell[0])
    minCellZ = Math.min(minCellZ, cell[1])
    maxCellZ = Math.max(maxCellZ, cell[1])
  })

  return {
    dirtyCellRect: {
      minCellX,
      maxCellX,
      minCellZ,
      maxCellZ,
    },
    dirtyWallKeys: [],
    fullRefresh: false,
  } as const
}
