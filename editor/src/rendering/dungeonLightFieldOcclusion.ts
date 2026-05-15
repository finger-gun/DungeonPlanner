import { GRID_SIZE } from '../hooks/useSnapToGrid'

export function doesLineIntersectClosedWall(
  originWorld: readonly [number, number, number],
  targetWorld: readonly [number, number, number],
  closedWalls: ReadonlySet<string>,
  gridSize = GRID_SIZE,
) {
  for (const wallKey of closedWalls) {
    const wallSegment = getWallWorldSegment(wallKey, gridSize)
    if (!wallSegment) {
      continue
    }

    if (doesWorldLineIntersectWallSegment(originWorld, targetWorld, wallSegment)) {
      return true
    }
  }

  return false
}

export function isCornerBlockedBySolidWall(
  cornerCellX: number,
  cornerCellZ: number,
  solidWalls: ReadonlySet<string>,
) {
  return solidWalls.has(`${cornerCellX}:${cornerCellZ}:south`)
    || solidWalls.has(`${cornerCellX}:${cornerCellZ}:west`)
    || solidWalls.has(`${cornerCellX - 1}:${cornerCellZ}:east`)
    || solidWalls.has(`${cornerCellX}:${cornerCellZ - 1}:north`)
}

export function doesWorldLineIntersectWallSegment(
  originWorld: readonly [number, number, number],
  targetWorld: readonly [number, number, number],
  wallSegment: readonly [number, number, number, number],
) {
  const [wallStartX, wallStartZ, wallEndX, wallEndZ] = wallSegment
  const originX = originWorld[0]
  const originZ = originWorld[2]
  const targetX = targetWorld[0]
  const targetZ = targetWorld[2]
  const dx = targetX - originX
  const dz = targetZ - originZ
  const epsilon = 1e-5

  if (Math.abs(wallStartX - wallEndX) <= epsilon) {
    if (Math.abs(dx) <= epsilon) {
      return false
    }

    const t = (wallStartX - originX) / dx
    if (t <= epsilon || t >= 1 - epsilon) {
      return false
    }

    const intersectionZ = originZ + dz * t
    const minWallZ = Math.min(wallStartZ, wallEndZ)
    const maxWallZ = Math.max(wallStartZ, wallEndZ)
    return intersectionZ >= minWallZ - epsilon && intersectionZ <= maxWallZ + epsilon
  }

  if (Math.abs(dz) <= epsilon) {
    return false
  }

  const t = (wallStartZ - originZ) / dz
  if (t <= epsilon || t >= 1 - epsilon) {
    return false
  }

  const intersectionX = originX + dx * t
  const minWallX = Math.min(wallStartX, wallEndX)
  const maxWallX = Math.max(wallStartX, wallEndX)
  return intersectionX >= minWallX - epsilon && intersectionX <= maxWallX + epsilon
}

export function getWallWorldSegment(
  wallKey: string,
  gridSize = GRID_SIZE,
): readonly [number, number, number, number] | null {
  const [rawCellX, rawCellZ, direction] = wallKey.split(':')
  const cellX = Number.parseInt(rawCellX ?? '', 10)
  const cellZ = Number.parseInt(rawCellZ ?? '', 10)
  if (!Number.isFinite(cellX) || !Number.isFinite(cellZ)) {
    return null
  }

  switch (direction) {
    case 'north':
      return [
        cellX * gridSize,
        (cellZ + 1) * gridSize,
        (cellX + 1) * gridSize,
        (cellZ + 1) * gridSize,
      ]
    case 'south':
      return [
        cellX * gridSize,
        cellZ * gridSize,
        (cellX + 1) * gridSize,
        cellZ * gridSize,
      ]
    case 'east':
      return [
        (cellX + 1) * gridSize,
        cellZ * gridSize,
        (cellX + 1) * gridSize,
        (cellZ + 1) * gridSize,
      ]
    case 'west':
      return [
        cellX * gridSize,
        cellZ * gridSize,
        cellX * gridSize,
        (cellZ + 1) * gridSize,
      ]
    default:
      return null
  }
}
