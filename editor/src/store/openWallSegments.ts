import { getOpeningSegments } from './openingSegments'
import { getMirroredWallKey } from './manualWalls'
import type { OpeningRecord } from './useDungeonStore'

export function buildOpenWallSegmentSet(
  wallOpenings: Record<string, OpeningRecord>,
  wallSurfaceProps: Record<string, Record<string, unknown>> = {},
) {
  const openWalls = new Set<string>()

  for (const opening of Object.values(wallOpenings)) {
    for (const wallKey of getOpeningSegments(opening.wallKey, opening.width)) {
      openWalls.add(wallKey)
      const mirrored = getMirroredWallKey(wallKey)
      if (mirrored) {
        openWalls.add(mirrored)
      }
    }
  }

  for (const [wallKey, props] of Object.entries(wallSurfaceProps)) {
    if (props.open !== true) {
      continue
    }
    openWalls.add(wallKey)
    const mirrored = getMirroredWallKey(wallKey)
    if (mirrored) {
      openWalls.add(mirrored)
    }
  }

  return openWalls
}
