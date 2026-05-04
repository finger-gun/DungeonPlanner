import { getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import { getMirroredWallKey } from '../manualWalls'
import { getOpeningSegments } from '../openingSegments'
import { isInterRoomBoundary, wallKeyToWorldPosition } from '../wallSegments'
import type { OpeningRecord, PaintedCellRecord } from '../useDungeonStore'

export type WallOpeningDerivedState = {
  wallOpeningsBySegmentKey: Record<string, OpeningRecord>
  suppressedWallKeys: Set<string>
}

export type EligibleOpenPassageWall = {
  wallKey: string
  position: [number, number, number]
  rotation: [number, number, number]
}

const wallOpeningDerivedStateCache = new Map<string, WallOpeningDerivedState>()
const eligibleOpenPassageWallCache = new Map<string, EligibleOpenPassageWall[]>()
const derivedObjectIdentityCache = new WeakMap<object, number>()
let nextDerivedObjectIdentity = 1

export function buildWallOpeningDerivedState(
  wallOpenings: Record<string, OpeningRecord>,
): WallOpeningDerivedState {
  const cacheKey = `${getDerivedObjectIdentity(wallOpenings)}`
  const cachedState = wallOpeningDerivedStateCache.get(cacheKey)
  if (cachedState) {
    return cachedState
  }

  const wallOpeningsBySegmentKey: Record<string, OpeningRecord> = {}
  const suppressedWallKeys = new Set<string>()

  for (const opening of Object.values(wallOpenings)) {
    for (const wallKey of getOpeningSegments(opening.wallKey, opening.width)) {
      wallOpeningsBySegmentKey[wallKey] = opening
      suppressedWallKeys.add(wallKey)

      const mirroredWallKey = getMirroredWallKey(wallKey)
      if (mirroredWallKey) {
        suppressedWallKeys.add(mirroredWallKey)
      }
    }
  }

  const nextState = {
    wallOpeningsBySegmentKey,
    suppressedWallKeys,
  }
  wallOpeningDerivedStateCache.set(cacheKey, nextState)
  return nextState
}

export function buildEligibleOpenPassageWalls(
  paintedCells: Record<string, PaintedCellRecord>,
  wallOpenings: Record<string, OpeningRecord>,
  wallOpeningDerivedState = buildWallOpeningDerivedState(wallOpenings),
) {
  const cacheKey = `${getDerivedObjectIdentity(paintedCells)}:${getDerivedObjectIdentity(wallOpenings)}`
  const cachedWalls = eligibleOpenPassageWallCache.get(cacheKey)
  if (cachedWalls) {
    return cachedWalls
  }

  const walls: EligibleOpenPassageWall[] = []
  const { suppressedWallKeys } = wallOpeningDerivedState

  for (const record of Object.values(paintedCells)) {
    const cell = record.cell
    const cellKey = getCellKey(cell)

    for (const [direction, delta] of WALL_CONNECTOR_DIRECTIONS) {
      const neighbor: GridCell = [cell[0] + delta[0], cell[1] + delta[1]]
      const neighborKey = getCellKey(neighbor)
      const wallKey = `${cellKey}:${direction}`

      if (
        !isInterRoomBoundary(cell, neighbor, paintedCells)
        || cellKey > neighborKey
        || suppressedWallKeys.has(wallKey)
      ) {
        continue
      }

      const position = wallKeyToWorldPosition(wallKey)
      if (!position) {
        continue
      }

      walls.push({
        wallKey,
        position: position.position,
        rotation: position.rotation,
      })
    }
  }

  eligibleOpenPassageWallCache.set(cacheKey, walls)
  return walls
}

const WALL_CONNECTOR_DIRECTIONS = [
  ['north', [0, 1]],
  ['east', [1, 0]],
  ['south', [0, -1]],
  ['west', [-1, 0]],
] as const

function getDerivedObjectIdentity(value: object) {
  const cachedIdentity = derivedObjectIdentityCache.get(value)
  if (cachedIdentity) {
    return cachedIdentity
  }

  const nextIdentity = nextDerivedObjectIdentity
  nextDerivedObjectIdentity += 1
  derivedObjectIdentityCache.set(value, nextIdentity)
  return nextIdentity
}
