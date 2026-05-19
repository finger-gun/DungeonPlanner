import { getCellKey, GRID_SIZE, type GridCell } from '../../hooks/useSnapToGrid'
import type { PaintedCells } from '../../store/useDungeonStore'
import { getMirroredWallKey } from '../../store/manualWalls'

export function getWallInteriorLightDirection(
  wallKey: string,
): [number, number, number] | undefined {
  const direction = wallKey.split(':')[2]
  switch (direction) {
    case 'north':
      return [0, 0, -1]
    case 'south':
      return [0, 0, 1]
    case 'east':
      return [-1, 0, 0]
    case 'west':
      return [1, 0, 0]
    default:
      return undefined
  }
}

export function getWallSpanInteriorLightDirections(
  wallKeys: string[],
  paintedCells: PaintedCells,
) {
  const uniqueDirections: Array<[number, number, number]> = []

  wallKeys.forEach((wallKey) => {
    pushUniqueDirection(uniqueDirections, getWallInteriorLightDirection(wallKey))

    const mirroredWallKey = getMirroredWallKey(wallKey)
    if (!mirroredWallKey) {
      return
    }

    const mirroredCellKey = getWallCellKey(mirroredWallKey)
    if (!mirroredCellKey || !paintedCells[mirroredCellKey]) {
      return
    }

    pushUniqueDirection(uniqueDirections, getWallInteriorLightDirection(mirroredWallKey))
  })

  return {
    primary: uniqueDirections[0],
    secondary: uniqueDirections[1],
  }
}

export function getCornerInteriorLightDirections(wallKeys: string[]) {
  const uniqueDirections: Array<[number, number, number]> = []

  wallKeys.forEach((wallKey) => {
    pushUniqueDirection(uniqueDirections, getWallInteriorLightDirection(wallKey))
  })

  return {
    primary: uniqueDirections[0],
    secondary: uniqueDirections[1],
  }
}

export function getWallSpanSurfaceLightSamplePositions(
  wallKeys: string[],
  paintedCells: PaintedCells,
  {
    sampleHeight = 1.1,
    inwardOffset = GRID_SIZE * 0.28,
  }: {
    sampleHeight?: number
    inwardOffset?: number
  } = {},
) {
  const spanCenter = getWallSpanWorldCenter(wallKeys)
  if (!spanCenter) {
    return []
  }

  const interiorDirections = getWallSpanInteriorLightDirections(wallKeys, paintedCells)
  return [interiorDirections.primary, interiorDirections.secondary]
    .filter((direction): direction is [number, number, number] => Boolean(direction))
    .map((direction) => ([
      spanCenter[0] + direction[0] * inwardOffset,
      sampleHeight,
      spanCenter[1] + direction[2] * inwardOffset,
    ] as const))
}

function getWallCellKey(wallKey: string): string | null {
  const parts = wallKey.split(':')
  if (parts.length !== 3) {
    return null
  }

  const x = Number.parseInt(parts[0] ?? '', 10)
  const z = Number.parseInt(parts[1] ?? '', 10)
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    return null
  }

  return getCellKey([x, z] as GridCell)
}

function getWallSpanWorldCenter(wallKeys: string[]) {
  if (wallKeys.length === 0) {
    return null
  }

  let sumX = 0
  let sumZ = 0
  let count = 0
  wallKeys.forEach((wallKey) => {
    const center = getWallWorldCenter(wallKey)
    if (!center) {
      return
    }

    sumX += center[0]
    sumZ += center[1]
    count += 1
  })

  if (count === 0) {
    return null
  }

  return [sumX / count, sumZ / count] as const
}

function getWallWorldCenter(wallKey: string) {
  const parts = wallKey.split(':')
  if (parts.length !== 3) {
    return null
  }

  const x = Number.parseInt(parts[0] ?? '', 10)
  const z = Number.parseInt(parts[1] ?? '', 10)
  const direction = parts[2]
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    return null
  }

  switch (direction) {
    case 'north':
      return [x * GRID_SIZE + GRID_SIZE * 0.5, (z + 1) * GRID_SIZE] as const
    case 'south':
      return [x * GRID_SIZE + GRID_SIZE * 0.5, z * GRID_SIZE] as const
    case 'east':
      return [(x + 1) * GRID_SIZE, z * GRID_SIZE + GRID_SIZE * 0.5] as const
    case 'west':
      return [x * GRID_SIZE, z * GRID_SIZE + GRID_SIZE * 0.5] as const
    default:
      return null
  }
}

function pushUniqueDirection(
  directions: Array<[number, number, number]>,
  direction: [number, number, number] | undefined,
) {
  if (!direction) {
    return
  }

  if (!directions.some((candidate) =>
    candidate[0] === direction[0]
    && candidate[1] === direction[1]
    && candidate[2] === direction[2])) {
    directions.push(direction)
  }
}
