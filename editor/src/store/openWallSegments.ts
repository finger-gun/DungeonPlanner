import { getOpeningSegments } from './openingSegments'
import { getMirroredWallKey } from './manualWalls'
import type { OpeningRecord } from './useDungeonStore'

export function buildOpenWallSegmentSet(
  wallOpenings: Record<string, OpeningRecord>,
  _wallSurfaceAssetIdsOrProps?: Record<string, string> | Record<string, Record<string, unknown>>,
  _wallSurfacePropsMaybe?: Record<string, Record<string, unknown>>,
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

  return openWalls
}
