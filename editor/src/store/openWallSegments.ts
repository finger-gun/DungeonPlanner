import { getOpeningSegments } from './openingSegments'
import { getMirroredWallKey } from './manualWalls'
import type { OpeningRecord } from './useDungeonStore'

export function buildOpenWallSegmentSet(
  wallOpenings: Record<string, OpeningRecord>,
  wallSurfaceAssetIdsOrProps?: Record<string, string> | Record<string, Record<string, unknown>>,
  wallSurfacePropsMaybe?: Record<string, Record<string, unknown>>,
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

  const legacyWallSurfaceProps = wallSurfacePropsMaybe
    ?? resolveLegacyWallSurfaceProps(wallSurfaceAssetIdsOrProps)
  Object.entries(legacyWallSurfaceProps).forEach(([wallKey, props]) => {
    if (props?.open !== true) {
      return
    }

    openWalls.add(wallKey)
    const mirrored = getMirroredWallKey(wallKey)
    if (mirrored) {
      openWalls.add(mirrored)
    }
  })

  return openWalls
}

function resolveLegacyWallSurfaceProps(
  wallSurfaceAssetIdsOrProps: Record<string, string> | Record<string, Record<string, unknown>> | undefined,
) {
  if (!wallSurfaceAssetIdsOrProps) {
    return {}
  }

  const firstValue = Object.values(wallSurfaceAssetIdsOrProps)[0]
  if (firstValue && typeof firstValue === 'object') {
    return wallSurfaceAssetIdsOrProps as Record<string, Record<string, unknown>>
  }

  return {}
}
