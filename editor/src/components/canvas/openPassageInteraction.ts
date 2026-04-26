import { GRID_SIZE, getCellKey, snapWorldPointToGrid } from '../../hooks/useSnapToGrid'
import type { AssetBrowserCategory } from '../../content-packs/types'
import type { PaintedCellRecord, DungeonTool } from '../../store/useDungeonStore'
import { isInterRoomBoundary, isWallBoundary, WALL_DIRECTIONS } from '../../store/wallSegments'

export function shouldAllowObjectContextDelete(
  tool: DungeonTool,
  assetBrowserCategory: AssetBrowserCategory,
) {
  return tool === 'character'
    || (tool === 'prop' && assetBrowserCategory !== 'openings' && assetBrowserCategory !== 'surfaces')
}

export function getEligibleOpenPassageWallKey(
  point: { x: number; y: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
  eligibleWallKeys: Set<string>,
) {
  const snapped = snapWorldPointToGrid(point)
  if (!paintedCells[snapped.key]) {
    return null
  }

  const cellCenterX = snapped.cell[0] * GRID_SIZE
  const cellCenterZ = snapped.cell[1] * GRID_SIZE
  const localX = point.x - cellCenterX
  const localZ = point.z - cellCenterZ

  const rankedDirections = [...WALL_DIRECTIONS].sort((left, right) => {
    const leftDistance = Math.abs(localX - left.delta[0] * (GRID_SIZE * 0.5))
      + Math.abs(localZ - left.delta[1] * (GRID_SIZE * 0.5))
    const rightDistance = Math.abs(localX - right.delta[0] * (GRID_SIZE * 0.5))
      + Math.abs(localZ - right.delta[1] * (GRID_SIZE * 0.5))

    return leftDistance - rightDistance
  })

  const matchingDirection = rankedDirections.find((direction) => {
    const neighbor: [number, number] = [
      snapped.cell[0] + direction.delta[0],
      snapped.cell[1] + direction.delta[1],
    ]

    return isWallBoundary(snapped.cell, neighbor, paintedCells)
      && isInterRoomBoundary(snapped.cell, neighbor, paintedCells)
  })

  if (!matchingDirection) {
    return null
  }

  const wallKey = `${getCellKey(snapped.cell)}:${matchingDirection.direction}`
  return eligibleWallKeys.has(wallKey) ? wallKey : null
}
