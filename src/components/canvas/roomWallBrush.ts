import { GRID_SIZE, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import {
  getCanonicalInnerWallKey,
  parseDirectedWallKey,
  type InnerWallRecord,
} from '../../store/manualWalls'
import {
  getCanonicalWallKey,
  isInterRoomBoundary,
  wallKeyToWorldPosition,
  type WallDirection,
} from '../../store/wallSegments'
import type { PaintedCellRecord } from '../../store/useDungeonStore'

export type RoomWallEditKind = 'inner' | 'shared'

export type RoomWallEditTarget = {
  wallKey: string
  kind: RoomWallEditKind
}

type RoomWallBrushAxis = 'x' | 'z'

export type RoomWallBrushAnchor = {
  target: RoomWallEditTarget
  axis: RoomWallBrushAxis
  cell: GridCell
  direction: WallDirection
}

export function getRoomWallBrushAnchor(target: RoomWallEditTarget): RoomWallBrushAnchor | null {
  const parsed = parseDirectedWallKey(target.wallKey)
  if (!parsed) {
    return null
  }

  return {
    target,
    axis: parsed.direction === 'north' || parsed.direction === 'south' ? 'x' : 'z',
    cell: parsed.cell,
    direction: parsed.direction,
  }
}

export function getRoomWallBrushTargets(
  anchor: RoomWallBrushAnchor,
  point: { x: number; z: number },
  paintedCells: Record<string, PaintedCellRecord>,
  innerWalls: Record<string, InnerWallRecord>,
  suppressedWallKeys: Set<string>,
  mode: 'paint' | 'erase',
): RoomWallEditTarget[] {
  const anchorWorld = wallKeyToWorldPosition(anchor.target.wallKey)
  if (!anchorWorld) {
    return [anchor.target]
  }

  const projectedOffset =
    anchor.axis === 'x'
      ? point.x - anchorWorld.position[0]
      : point.z - anchorWorld.position[2]
  const signedStepCount = Math.round(projectedOffset / GRID_SIZE)

  if (signedStepCount === 0) {
    return [anchor.target]
  }

  const nextTargets: RoomWallEditTarget[] = [anchor.target]
  const stepSign = Math.sign(signedStepCount)

  for (let step = 1; step <= Math.abs(signedStepCount); step += 1) {
    const cell: GridCell =
      anchor.axis === 'x'
        ? [anchor.cell[0] + stepSign * step, anchor.cell[1]]
        : [anchor.cell[0], anchor.cell[1] + stepSign * step]
    const rawWallKey = `${getCellKey(cell)}:${anchor.direction}`
    const target = resolveRoomWallBrushTarget(
      rawWallKey,
      anchor.target.kind,
      paintedCells,
      innerWalls,
      suppressedWallKeys,
      mode,
    )

    if (!target) {
      break
    }

    nextTargets.push(target)
  }

  return nextTargets
}

function resolveRoomWallBrushTarget(
  rawWallKey: string,
  kind: RoomWallEditKind,
  paintedCells: Record<string, PaintedCellRecord>,
  innerWalls: Record<string, InnerWallRecord>,
  suppressedWallKeys: Set<string>,
  mode: 'paint' | 'erase',
): RoomWallEditTarget | null {
  const parsed = parseDirectedWallKey(rawWallKey)
  if (!parsed) {
    return null
  }

  if (kind === 'inner') {
    const innerWallKey = getCanonicalInnerWallKey(rawWallKey, paintedCells)
    if (!innerWallKey) {
      return null
    }
    if (mode === 'erase' && !innerWalls[innerWallKey]) {
      return null
    }

    return { wallKey: innerWallKey, kind: 'inner' }
  }

  const neighbor: GridCell = [
    parsed.cell[0] + parsed.delta[0],
    parsed.cell[1] + parsed.delta[1],
  ]
  const sharedWallKey = getCanonicalWallKey(rawWallKey, paintedCells)

  if (
    !sharedWallKey ||
    !isInterRoomBoundary(parsed.cell, neighbor, paintedCells) ||
    (mode === 'paint' ? !suppressedWallKeys.has(sharedWallKey) : suppressedWallKeys.has(sharedWallKey))
  ) {
    return null
  }

  return { wallKey: sharedWallKey, kind: 'shared' }
}
