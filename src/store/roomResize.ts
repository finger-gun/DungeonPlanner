import { GRID_SIZE, getCellKey } from '../hooks/useSnapToGrid'
import type { GridCell } from '../hooks/useSnapToGrid'
import { getOpeningSegments } from './openingSegments'
import type { OpeningRecord, PaintedCells } from './useDungeonStore'

export type RoomBounds = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

export type RoomOutlineSegment = {
  position: [number, number, number]
  size: [number, number, number]
}

export type RoomResizeCorner = 'nw' | 'ne' | 'sw' | 'se'
export type RoomResizeEdge = 'north' | 'south' | 'east' | 'west'
export type RoomBoundaryRun = {
  direction: RoomResizeEdge
  line: number
  start: number
  end: number
}

export function getRoomBounds(roomId: string, paintedCells: PaintedCells): RoomBounds | null {
  let minX = Number.POSITIVE_INFINITY
  let maxX = Number.NEGATIVE_INFINITY
  let minZ = Number.POSITIVE_INFINITY
  let maxZ = Number.NEGATIVE_INFINITY
  let found = false

  for (const record of Object.values(paintedCells)) {
    if (record.roomId !== roomId) {
      continue
    }

    found = true
    minX = Math.min(minX, record.cell[0])
    maxX = Math.max(maxX, record.cell[0])
    minZ = Math.min(minZ, record.cell[1])
    maxZ = Math.max(maxZ, record.cell[1])
  }

  return found ? { minX, maxX, minZ, maxZ } : null
}

export function isRectangularRoom(
  roomId: string,
  paintedCells: PaintedCells,
  bounds?: RoomBounds | null,
) {
  const rect = bounds ?? getRoomBounds(roomId, paintedCells)
  if (!rect) {
    return false
  }

  for (let z = rect.minZ; z <= rect.maxZ; z += 1) {
    for (let x = rect.minX; x <= rect.maxX; x += 1) {
      if (paintedCells[getCellKey([x, z])]?.roomId !== roomId) {
        return false
      }
    }
  }

  return true
}

export function getRoomCellKeysInBounds(bounds: RoomBounds) {
  const keys: string[] = []

  for (let z = bounds.minZ; z <= bounds.maxZ; z += 1) {
    for (let x = bounds.minX; x <= bounds.maxX; x += 1) {
      keys.push(getCellKey([x, z]))
    }
  }

  return keys
}

export function canResizeRoomToBounds(roomId: string, bounds: RoomBounds, paintedCells: PaintedCells) {
  return getRoomCellKeysInBounds(bounds).every((key) => {
    const record = paintedCells[key]
    return !record || record.roomId === roomId
  })
}

export function getCornerBoundary(bounds: RoomBounds, corner: RoomResizeCorner): [number, number] {
  switch (corner) {
    case 'nw':
      return [bounds.minX, bounds.maxZ + 1]
    case 'ne':
      return [bounds.maxX + 1, bounds.maxZ + 1]
    case 'sw':
      return [bounds.minX, bounds.minZ]
    case 'se':
      return [bounds.maxX + 1, bounds.minZ]
  }
}

export function getOppositeCornerBoundary(bounds: RoomBounds, corner: RoomResizeCorner): [number, number] {
  switch (corner) {
    case 'nw':
      return getCornerBoundary(bounds, 'se')
    case 'ne':
      return getCornerBoundary(bounds, 'sw')
    case 'sw':
      return getCornerBoundary(bounds, 'ne')
    case 'se':
      return getCornerBoundary(bounds, 'nw')
  }
}

export function snapWorldToBoundary(value: number) {
  return Math.round(value / GRID_SIZE)
}

export function resizeBoundsFromCorner(
  bounds: RoomBounds,
  corner: RoomResizeCorner,
  boundaryX: number,
  boundaryZ: number,
): RoomBounds {
  const [anchorX, anchorZ] = getOppositeCornerBoundary(bounds, corner)
  const nextX = clampBoundary(boundaryX, anchorX, corner === 'nw' || corner === 'sw' ? -1 : 1)
  const nextZ = clampBoundary(boundaryZ, anchorZ, corner === 'sw' || corner === 'se' ? -1 : 1)

  const minBoundaryX = Math.min(anchorX, nextX)
  const maxBoundaryX = Math.max(anchorX, nextX)
  const minBoundaryZ = Math.min(anchorZ, nextZ)
  const maxBoundaryZ = Math.max(anchorZ, nextZ)

  return {
    minX: minBoundaryX,
    maxX: maxBoundaryX - 1,
    minZ: minBoundaryZ,
    maxZ: maxBoundaryZ - 1,
  }
}

export function resizeBoundsFromEdge(
  bounds: RoomBounds,
  edge: RoomResizeEdge,
  boundary: number,
): RoomBounds {
  switch (edge) {
    case 'north':
      return {
        ...bounds,
        maxZ: clampBoundary(boundary, bounds.minZ, 1) - 1,
      }
    case 'south':
      return {
        ...bounds,
        minZ: clampBoundary(boundary, bounds.maxZ + 1, -1),
      }
    case 'east':
      return {
        ...bounds,
        maxX: clampBoundary(boundary, bounds.minX, 1) - 1,
      }
    case 'west':
      return {
        ...bounds,
        minX: clampBoundary(boundary, bounds.maxX + 1, -1),
      }
  }
}

export function getRoomWorldRect(bounds: RoomBounds) {
  return {
    minX: bounds.minX * GRID_SIZE,
    maxX: (bounds.maxX + 1) * GRID_SIZE,
    minZ: bounds.minZ * GRID_SIZE,
    maxZ: (bounds.maxZ + 1) * GRID_SIZE,
  }
}

export function getRoomOutlineSegments(roomId: string, paintedCells: PaintedCells): RoomOutlineSegment[] {
  return getRoomOutlineSegmentsForCells(getRoomCells(roomId, paintedCells))
}

export function getRoomOutlineSegmentsForCells(cells: GridCell[]): RoomOutlineSegment[] {
  const segments: RoomOutlineSegment[] = []
  const cellKeys = new Set(cells.map((cell) => getCellKey(cell)))

  for (const [x, z] of cells) {
    const minX = x * GRID_SIZE
    const maxX = (x + 1) * GRID_SIZE
    const minZ = z * GRID_SIZE
    const maxZ = (z + 1) * GRID_SIZE
    const centerX = (minX + maxX) / 2
    const centerZ = (minZ + maxZ) / 2

    if (!cellKeys.has(getCellKey([x, z + 1]))) {
      segments.push({
        position: [centerX, 0, maxZ],
        size: [GRID_SIZE, 0.02, 0.08],
      })
    }

    if (!cellKeys.has(getCellKey([x, z - 1]))) {
      segments.push({
        position: [centerX, 0, minZ],
        size: [GRID_SIZE, 0.02, 0.08],
      })
    }

    if (!cellKeys.has(getCellKey([x + 1, z]))) {
      segments.push({
        position: [maxX, 0, centerZ],
        size: [0.08, 0.02, GRID_SIZE],
      })
    }

    if (!cellKeys.has(getCellKey([x - 1, z]))) {
      segments.push({
        position: [minX, 0, centerZ],
        size: [0.08, 0.02, GRID_SIZE],
      })
    }
  }

  return segments
}

export function getRoomBoundaryRuns(roomId: string, paintedCells: PaintedCells): RoomBoundaryRun[] {
  const units: RoomBoundaryRun[] = []

  for (const record of Object.values(paintedCells)) {
    if (record.roomId !== roomId) {
      continue
    }

    const [x, z] = record.cell

    if (paintedCells[getCellKey([x, z + 1])]?.roomId !== roomId) {
      units.push({ direction: 'north', line: z + 1, start: x, end: x })
    }
    if (paintedCells[getCellKey([x, z - 1])]?.roomId !== roomId) {
      units.push({ direction: 'south', line: z, start: x, end: x })
    }
    if (paintedCells[getCellKey([x + 1, z])]?.roomId !== roomId) {
      units.push({ direction: 'east', line: x + 1, start: z, end: z })
    }
    if (paintedCells[getCellKey([x - 1, z])]?.roomId !== roomId) {
      units.push({ direction: 'west', line: x, start: z, end: z })
    }
  }

  return mergeBoundaryRuns(units)
}

export function getRoomBoundaryRunSegment(run: RoomBoundaryRun): RoomOutlineSegment {
  const startWorld = run.start * GRID_SIZE
  const endWorld = (run.end + 1) * GRID_SIZE
  const lineWorld = run.line * GRID_SIZE
  const center = (startWorld + endWorld) / 2
  const span = endWorld - startWorld

  if (run.direction === 'north' || run.direction === 'south') {
    return {
      position: [center, 0, lineWorld],
      size: [span, 0.02, 0.08],
    }
  }

  return {
    position: [lineWorld, 0, center],
    size: [0.08, 0.02, span],
  }
}

function clampBoundary(value: number, anchor: number, direction: -1 | 1) {
  if (direction === -1) {
    return Math.min(value, anchor - 1)
  }

  return Math.max(value, anchor + 1)
}

function mergeBoundaryRuns(runs: RoomBoundaryRun[]) {
  const groups = new Map<string, RoomBoundaryRun[]>()

  runs.forEach((run) => {
    const key = `${run.direction}:${run.line}`
    const bucket = groups.get(key)
    if (bucket) {
      bucket.push(run)
      return
    }
    groups.set(key, [run])
  })

  return Array.from(groups.values()).flatMap((group) => {
    const sorted = [...group].sort((a, b) => a.start - b.start)
    const merged: RoomBoundaryRun[] = []

    sorted.forEach((run) => {
      const previous = merged.at(-1)
      if (previous && previous.end + 1 === run.start) {
        previous.end = run.end
        return
      }

      merged.push({ ...run })
    })

    return merged
  })
}

function getRunStripCells(run: RoomBoundaryRun, boundary: number) {
  const cells: GridCell[] = []

  switch (run.direction) {
    case 'north':
    case 'south': {
      const minZ = Math.min(run.line, boundary)
      const maxZ = Math.max(run.line, boundary) - 1
      for (let x = run.start; x <= run.end; x += 1) {
        for (let z = minZ; z <= maxZ; z += 1) {
          cells.push([x, z])
        }
      }
      return cells
    }
    case 'east':
    case 'west': {
      const minX = Math.min(run.line, boundary)
      const maxX = Math.max(run.line, boundary) - 1
      for (let x = minX; x <= maxX; x += 1) {
        for (let z = run.start; z <= run.end; z += 1) {
          cells.push([x, z])
        }
      }
      return cells
    }
  }
}

function isAddingRunCells(run: RoomBoundaryRun, boundary: number) {
  switch (run.direction) {
    case 'north':
    case 'east':
      return boundary > run.line
    case 'south':
    case 'west':
      return boundary < run.line
  }
}

function isConnectedCellSet(cellKeys: Set<string>) {
  const [firstKey] = cellKeys
  if (!firstKey) {
    return false
  }

  const queue = [parseCellKey(firstKey)]
  const visited = new Set<string>([firstKey])

  while (queue.length > 0) {
    const [x, z] = queue.shift()!

    ;([
      [x + 1, z],
      [x - 1, z],
      [x, z + 1],
      [x, z - 1],
    ] as GridCell[]).forEach((neighbor) => {
      const key = getCellKey(neighbor)
      if (!cellKeys.has(key) || visited.has(key)) {
        return
      }

      visited.add(key)
      queue.push(neighbor)
    })
  }

  return visited.size === cellKeys.size
}

export function getRoomCells(roomId: string, paintedCells: PaintedCells) {
  const cells: GridCell[] = []

  for (const record of Object.values(paintedCells)) {
    if (record.roomId === roomId) {
      cells.push(record.cell)
    }
  }

  return cells
}

export function getResizedRoomCellsForRun(
  roomId: string,
  paintedCells: PaintedCells,
  run: RoomBoundaryRun,
  boundary: number,
) {
  if (boundary === run.line) {
    return getRoomCells(roomId, paintedCells)
  }

  const currentCells = getRoomCells(roomId, paintedCells)
  const nextKeys = new Set(currentCells.map((cell) => getCellKey(cell)))

  for (const cell of getRunStripCells(run, boundary)) {
    const key = getCellKey(cell)
    const record = paintedCells[key]

    if (isAddingRunCells(run, boundary)) {
      if (record && record.roomId !== roomId) {
        return null
      }
      nextKeys.add(key)
    } else {
      nextKeys.delete(key)
    }
  }

  if (nextKeys.size === 0 || !isConnectedCellSet(nextKeys)) {
    return null
  }

  return Array.from(nextKeys, parseCellKey)
}

export function remapOpeningForRoomResize(
  opening: OpeningRecord,
  roomId: string,
  oldBounds: RoomBounds,
  newBounds: RoomBounds,
  paintedCells: PaintedCells,
): OpeningRecord | null {
  const nextWallKey = remapWallKeyForRoomResize(opening.wallKey, roomId, oldBounds, newBounds, paintedCells)
  if (!nextWallKey) {
    return null
  }

  if (nextWallKey === opening.wallKey) {
    return opening
  }

  if (!openingFitsBounds(opening.width, nextWallKey, newBounds)) {
    return null
  }

  return {
    ...opening,
    wallKey: nextWallKey,
  }
}

function remapWallKeyForRoomResize(
  wallKey: string,
  roomId: string,
  oldBounds: RoomBounds,
  newBounds: RoomBounds,
  paintedCells: PaintedCells,
) {
  const parsed = parseWallKey(wallKey)
  if (!parsed) {
    return wallKey
  }

  const directSide = getBoundarySide(parsed, oldBounds, roomId, paintedCells)
  if (directSide) {
    const remappedDirect = buildRemappedWall(parsed, directSide, newBounds)
    return remappedDirect ? formatWallKey(remappedDirect) : null
  }

  const mirrored = mirrorWallKey(parsed)
  const mirroredSide = mirrored ? getBoundarySide(mirrored, oldBounds, roomId, paintedCells) : null

  if (!mirrored || !mirroredSide) {
    return wallKey
  }

  const remappedMirror = buildRemappedWall(mirrored, mirroredSide, newBounds)
  if (!remappedMirror) {
    return null
  }

  const mirroredBack = mirrorWallKey(remappedMirror)
  return mirroredBack ? formatWallKey(mirroredBack) : null
}

function getBoundarySide(
  wall: ParsedWallKey,
  bounds: RoomBounds,
  roomId: string,
  paintedCells: PaintedCells,
): 'north' | 'south' | 'east' | 'west' | null {
  const record = paintedCells[getCellKey([wall.x, wall.z])]
  if (record?.roomId !== roomId) {
    return null
  }

  if (wall.direction === 'north' && wall.z === bounds.maxZ) return 'north'
  if (wall.direction === 'south' && wall.z === bounds.minZ) return 'south'
  if (wall.direction === 'east' && wall.x === bounds.maxX) return 'east'
  if (wall.direction === 'west' && wall.x === bounds.minX) return 'west'
  return null
}

type ParsedWallKey = {
  x: number
  z: number
  direction: 'north' | 'south' | 'east' | 'west'
}

function parseCellKey(key: string): GridCell {
  const [x, z] = key.split(':').map((value) => parseInt(value, 10))
  return [x, z]
}

function parseWallKey(wallKey: string): ParsedWallKey | null {
  const [xText, zText, direction] = wallKey.split(':')
  const x = parseInt(xText, 10)
  const z = parseInt(zText, 10)

  if (
    Number.isNaN(x) ||
    Number.isNaN(z) ||
    (direction !== 'north' &&
      direction !== 'south' &&
      direction !== 'east' &&
      direction !== 'west')
  ) {
    return null
  }

  return { x, z, direction }
}

function buildRemappedWall(
  wall: ParsedWallKey,
  side: 'north' | 'south' | 'east' | 'west',
  bounds: RoomBounds,
) {
  switch (side) {
    case 'north':
      return withinRange(wall.x, bounds.minX, bounds.maxX)
        ? { ...wall, z: bounds.maxZ, direction: 'north' as const }
        : null
    case 'south':
      return withinRange(wall.x, bounds.minX, bounds.maxX)
        ? { ...wall, z: bounds.minZ, direction: 'south' as const }
        : null
    case 'east':
      return withinRange(wall.z, bounds.minZ, bounds.maxZ)
        ? { ...wall, x: bounds.maxX, direction: 'east' as const }
        : null
    case 'west':
      return withinRange(wall.z, bounds.minZ, bounds.maxZ)
        ? { ...wall, x: bounds.minX, direction: 'west' as const }
        : null
  }
}

function mirrorWallKey(wall: ParsedWallKey): ParsedWallKey | null {
  switch (wall.direction) {
    case 'north':
      return { x: wall.x, z: wall.z + 1, direction: 'south' }
    case 'south':
      return { x: wall.x, z: wall.z - 1, direction: 'north' }
    case 'east':
      return { x: wall.x + 1, z: wall.z, direction: 'west' }
    case 'west':
      return { x: wall.x - 1, z: wall.z, direction: 'east' }
  }
}

function formatWallKey(wall: ParsedWallKey) {
  return `${wall.x}:${wall.z}:${wall.direction}`
}

function withinRange(value: number, min: number, max: number) {
  return value >= min && value <= max
}

function openingFitsBounds(width: 1 | 2 | 3, wallKey: string, bounds: RoomBounds) {
  const parsed = parseWallKey(wallKey)
  if (!parsed) {
    return false
  }

  return getOpeningSegments(wallKey, width).every((segmentKey) => {
    const segment = parseWallKey(segmentKey)
    if (!segment) {
      return false
    }

    if (segment.direction === 'north' || segment.direction === 'south') {
      return segment.x >= bounds.minX && segment.x <= bounds.maxX
    }

    return segment.z >= bounds.minZ && segment.z <= bounds.maxZ
  })
}
