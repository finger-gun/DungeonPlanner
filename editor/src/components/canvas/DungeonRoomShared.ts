import { GRID_SIZE } from '../../hooks/useSnapToGrid'

export const WALL_EXTRA_DELAY_MS = 70

function getWallCellKey(wallKey: string) {
  const [xText, zText, direction] = wallKey.split(':')
  const x = Number.parseInt(xText ?? '', 10)
  const z = Number.parseInt(zText ?? '', 10)
  if (Number.isNaN(x) || Number.isNaN(z)) {
    return []
  }

  const cellKeys = [`${x}:${z}`]
  if (direction === 'north') {
    cellKeys.push(`${x}:${z + 1}`)
  } else if (direction === 'south') {
    cellKeys.push(`${x}:${z - 1}`)
  } else if (direction === 'east') {
    cellKeys.push(`${x + 1}:${z}`)
  } else if (direction === 'west') {
    cellKeys.push(`${x - 1}:${z}`)
  }

  return cellKeys
}

export function getBuildAnimationKeyFromWallKeys(
  wallKeys: string[],
  isBuildAnimationCurrentlyActive?: (cellKey: string) => boolean,
) {
  if (isBuildAnimationCurrentlyActive) {
    const activeWallKey = wallKeys.find((wallKey) => isBuildAnimationCurrentlyActive(wallKey))
    if (activeWallKey) {
      return activeWallKey
    }
  }

  const cellKeys = [...new Set(
    wallKeys
      .flatMap(getWallCellKey),
  )]

  if (cellKeys.length === 0) {
    return null
  }

  return isBuildAnimationCurrentlyActive
    ? (cellKeys.find((cellKey) => isBuildAnimationCurrentlyActive(cellKey)) ?? cellKeys[0])
    : cellKeys[0]
}

export function getOpeningHitboxSize(width: number): [number, number, number] {
  return [width * GRID_SIZE * 0.95, 2.2, 0.1]
}
