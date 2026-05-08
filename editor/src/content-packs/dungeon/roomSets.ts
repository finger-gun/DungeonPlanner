import type { ContentPackRoomSet } from '../types'

export const DEFAULT_DUNGEON_ROOM_SET_ID = 'dungeon'

export const dungeonRoomSets: ContentPackRoomSet[] = [
  {
    id: 'dungeon',
    name: 'Dungeon',
    previewWallAssetId: 'dungeon.wall_wall',
    wallAssetId: 'dungeon.wall_wall',
    pillarAssetId: 'dungeon.props_pillars_pillar',
    floor: {
      kind: 'single',
      assetId: 'dungeon.floor_floor_tile_small',
    },
  },
  {
    id: 'timber-frame',
    name: 'Timber Frame',
    previewWallAssetId: 'dungeon.wall_wall_scaffold',
    wallAssetId: 'dungeon.wall_wall_scaffold',
    pillarAssetId: 'dungeon.props_pillars_pillar',
    openingAssetId: 'dungeon.wall_wall_doorway_scaffold',
    floor: {
      kind: 'single',
      assetId: 'dungeon.floor_floor_tile_small',
    },
  },
  {
    id: 'cave',
    name: 'Cave',
    previewWallAssetId: 'dungeon.wall_wall_cave',
    wallAssetId: 'dungeon.wall_wall_cave',
    pillarAssetId: 'dungeon.props_pillars_cave_pillar',
    floor: {
      kind: 'randomized',
      assetIds: [
        'dungeon.floor_floor_dirt_small_A',
        'dungeon.floor_floor_dirt_small_B',
        'dungeon.floor_floor_dirt_small_C',
        'dungeon.floor_floor_dirt_small_D',
      ],
      randomQuarterTurns: true,
    },
  },
]
