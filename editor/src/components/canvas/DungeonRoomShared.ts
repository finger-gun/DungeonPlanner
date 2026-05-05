import { GRID_SIZE } from '../../hooks/useSnapToGrid'

export const WALL_EXTRA_DELAY_MS = 70

function getWallCellKey(wallKey: string) {
  const [x, z] = wallKey.split(':')
  if (x === undefined || z === undefined) {
    return null
  }

  return `${x}:${z}`
}

export function getBuildAnimationCellKeyFromWallKeys(
  wallKeys: string[],
  isBuildAnimationCurrentlyActive?: (cellKey: string) => boolean,
) {
  const cellKeys = [...new Set(
    wallKeys
      .map(getWallCellKey)
      .filter((cellKey): cellKey is string => cellKey !== null),
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
