import { getContentPackAssetById, getDefaultAssetIdByCategory } from '../content-packs/registry'
import type { ContentPackCategory } from '../content-packs/types'
import type { DungeonObjectRecord, FloorRecord, OpeningRecord, Room, SelectedAssetIds } from './useDungeonStore'

type SnapshotAssetState = {
  selectedAssetIds?: SelectedAssetIds
  rooms: Record<string, Room>
  wallOpenings: Record<string, OpeningRecord>
  placedObjects: Record<string, DungeonObjectRecord>
  floorTileAssetIds?: Record<string, string>
  wallSurfaceAssetIds?: Record<string, string>
}

type PersistedAssetState = SnapshotAssetState & {
  floors?: Record<string, FloorRecord>
}

export function sanitizeSelectedAssetIds(selectedAssetIds: SelectedAssetIds): SelectedAssetIds {
  return {
    floor: sanitizeSelectedAssetId(selectedAssetIds.floor, 'floor'),
    wall: sanitizeSelectedAssetId(selectedAssetIds.wall, 'wall'),
    prop: sanitizeSelectedAssetId(selectedAssetIds.prop, 'prop'),
    opening: sanitizeSelectedAssetId(selectedAssetIds.opening, 'opening'),
    player: sanitizeSelectedAssetId(selectedAssetIds.player, 'player'),
  }
}

export function sanitizeSnapshotAssetReferences<T extends SnapshotAssetState>(snapshot: T): T {
  return {
    ...snapshot,
    ...(snapshot.selectedAssetIds
      ? {
          selectedAssetIds: sanitizeSelectedAssetIds(snapshot.selectedAssetIds),
        }
      : {}),
    rooms: Object.fromEntries(
      Object.entries(snapshot.rooms).map(([roomId, room]) => [
        roomId,
        {
          ...room,
          floorAssetId: sanitizeRoomAssetId(room.floorAssetId, 'floor'),
          wallAssetId: sanitizeRoomAssetId(room.wallAssetId, 'wall'),
        },
      ]),
    ),
    wallOpenings: Object.fromEntries(
      Object.entries(snapshot.wallOpenings).map(([openingId, opening]) => [
        openingId,
        sanitizeOpeningRecord(opening),
      ]),
    ),
    floorTileAssetIds: Object.fromEntries(
      Object.entries(snapshot.floorTileAssetIds ?? {}).filter(([, assetId]) => isValidAssetId(assetId, 'floor')),
    ),
    wallSurfaceAssetIds: Object.fromEntries(
      Object.entries(snapshot.wallSurfaceAssetIds ?? {}).filter(([, assetId]) => isValidAssetId(assetId, 'wall')),
    ),
    placedObjects: Object.fromEntries(
      Object.entries(snapshot.placedObjects).flatMap(([objectId, object]) => {
        const sanitized = sanitizePlacedObjectAsset(object)
        return sanitized ? [[objectId, sanitized]] : []
      }),
    ),
  } as T
}

export function sanitizePersistedAssetReferences<T extends PersistedAssetState>(state: T): T {
  return {
    ...sanitizeSnapshotAssetReferences(state),
    ...(state.floors
      ? {
          floors: Object.fromEntries(
            Object.entries(state.floors).map(([floorId, floor]) => [
              floorId,
              {
                ...floor,
                snapshot: sanitizeSnapshotAssetReferences(floor.snapshot),
              },
            ]),
          ),
        }
      : {}),
  } as T
}

function sanitizeSelectedAssetId(
  assetId: string | null,
  category: ContentPackCategory,
): string | null {
  const mappedAssetId = mapLegacyAssetId(assetId, category)
  return isValidAssetId(mappedAssetId, category) ? mappedAssetId : getDefaultAssetIdByCategory(category)
}

function sanitizeRoomAssetId(
  assetId: string | null,
  category: Extract<ContentPackCategory, 'floor' | 'wall'>,
): string | null {
  const mappedAssetId = mapLegacyAssetId(assetId, category)
  return isValidAssetId(mappedAssetId, category) ? mappedAssetId : null
}

function sanitizeOpeningAssetId(assetId: string | null) {
  const mappedAssetId = mapLegacyAssetId(assetId, 'opening')
  return isValidAssetId(mappedAssetId, 'opening') ? mappedAssetId : null
}

function sanitizeOpeningRecord(opening: OpeningRecord): OpeningRecord {
  const assetId = sanitizeOpeningAssetId(opening.assetId)
  if (!assetId) {
    return {
      ...opening,
      assetId,
    }
  }

  const asset = getContentPackAssetById(assetId)
  return {
    ...opening,
    assetId,
    width: asset?.metadata?.openingWidth ?? 1,
  }
}

function isValidAssetId(assetId: string | null, category: ContentPackCategory) {
  if (!assetId) {
    return false
  }

  const asset = getContentPackAssetById(assetId)
  return asset?.category === category
}

function mapLegacyAssetId(assetId: string | null, category: ContentPackCategory) {
  if (assetId === 'dungeon.props_torch_lit' && category === 'prop') {
    return 'dungeon.props_torch'
  }

   if (assetId === 'dungeon.props_candle_lit' && category === 'prop') {
    return 'dungeon.props_candle'
  }

  if (assetId === 'dungeon.props_candle_thin_lit' && category === 'prop') {
    return 'dungeon.props_candle_thin'
  }

  return assetId
}

function sanitizePlacedObjectAsset<T extends { assetId: string | null; props: Record<string, unknown> }>(object: T): T | null {
  const mappedAssetId = mapLegacyAssetId(object.assetId, 'prop')
  if (!mappedAssetId) {
    return object
  }

  const asset = getContentPackAssetById(mappedAssetId)
  if (!asset) {
    return null
  }

  if (object.assetId === 'dungeon.props_torch_lit') {
    return {
      ...object,
      assetId: 'dungeon.props_torch',
      props: {
        ...object.props,
        lit: true,
      },
    }
  }

  if (object.assetId === 'dungeon.props_candle_lit') {
    return {
      ...object,
      assetId: 'dungeon.props_candle',
      props: {
        ...object.props,
        lit: true,
      },
    }
  }

  if (object.assetId === 'dungeon.props_candle_thin_lit') {
    return {
      ...object,
      assetId: 'dungeon.props_candle_thin',
      props: {
        ...object.props,
        lit: true,
      },
    }
  }

  return {
    ...object,
    assetId: mappedAssetId,
  }
}
