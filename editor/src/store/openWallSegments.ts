import { metadataSupportsConnectorType } from '../content-packs/connectors'
import { getContentPackAssetById } from '../content-packs/registry'
import { getOpeningSegments } from './openingSegments'
import { getMirroredWallKey } from './manualWalls'
import type { OpeningRecord } from './useDungeonStore'

export function buildOpenWallSegmentSet(
  wallOpenings: Record<string, OpeningRecord>,
  wallSurfaceAssetIdsOrProps: Record<string, string> | Record<string, Record<string, unknown>> = {},
  wallSurfacePropsMaybe: Record<string, Record<string, unknown>> = {},
) {
  const {
    wallSurfaceAssetIds,
    wallSurfaceProps,
  } = normalizeWallSurfaceOpeningInputs(wallSurfaceAssetIdsOrProps, wallSurfacePropsMaybe)
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

  for (const [wallKey, assetId] of Object.entries(wallSurfaceAssetIds)) {
    if (!isLegacyPassableWallSurfaceOpening(assetId, wallSurfaceProps[wallKey])) {
      continue
    }

    openWalls.add(wallKey)
    const mirrored = getMirroredWallKey(wallKey)
    if (mirrored) {
      openWalls.add(mirrored)
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

function normalizeWallSurfaceOpeningInputs(
  wallSurfaceAssetIdsOrProps: Record<string, string> | Record<string, Record<string, unknown>>,
  wallSurfaceProps: Record<string, Record<string, unknown>>,
) {
  if (Object.keys(wallSurfaceProps).length > 0) {
    return {
      wallSurfaceAssetIds: wallSurfaceAssetIdsOrProps as Record<string, string>,
      wallSurfaceProps,
    }
  }

  const sampleValue = Object.values(wallSurfaceAssetIdsOrProps)[0]
  if (typeof sampleValue === 'string') {
    return {
      wallSurfaceAssetIds: wallSurfaceAssetIdsOrProps as Record<string, string>,
      wallSurfaceProps,
    }
  }

  return {
    wallSurfaceAssetIds: {},
    wallSurfaceProps: wallSurfaceAssetIdsOrProps as Record<string, Record<string, unknown>>,
  }
}

function isLegacyPassableWallSurfaceOpening(
  assetId: string,
  props: Record<string, unknown> | undefined,
) {
  const asset = getContentPackAssetById(assetId)
  if (
    asset?.category !== 'opening'
    || !metadataSupportsConnectorType(asset.metadata, 'WALL')
  ) {
    return false
  }

  return asset.metadata?.openingKind === 'passage' || props?.open === true
}
