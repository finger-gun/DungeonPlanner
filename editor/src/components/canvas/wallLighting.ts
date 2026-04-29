import { getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
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
