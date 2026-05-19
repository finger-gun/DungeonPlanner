import type { ContentPackRoomSet } from '../types'

export const DEFAULT_DUNGEON_ROOM_SET_ID = 'dungeon'

export const dungeonRoomSets: ContentPackRoomSet[] = [
  {
    id: 'dungeon',
    name: 'Dungeon',
    previewWallAssetId: 'dungeon.wall_wall',
    wallAssetId: 'dungeon.wall_wall',
    pillarAssetId: 'dungeon.props_pillars_pillar',
    wallStyleId: 'dungeon-stone',
    wallMaterialSetId: 'kaykit-stone',
    floor: {
      kind: 'single',
      assetId: 'dungeon.floor_floor_tile_small',
    },
  },
  {
    id: 'cave',
    name: 'Rocky Cave',
    previewWallAssetId: 'dungeon.wall_wall_cave',
    wallAssetId: 'dungeon.wall_wall_cave',
    pillarAssetId: 'dungeon.props_pillars_cave_pillar',
    wallStyleId: 'rocky-cave',
    wallMaterialSetId: 'rough-rockface-1-pbr-material',
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
  {
    id: 'ai-gothic',
    name: 'AI Gothic',
    previewWallAssetId: 'dungeon.wall_wall',
    wallAssetId: 'dungeon.wall_wall',
    pillarAssetId: 'dungeon.props_pillars_pillar',
    wallStyleId: 'ai-gothic',
    wallMaterialSetId: 'ai-gothic-depth-wall',
    floor: {
      kind: 'single',
      assetId: 'dungeon.floor_floor_tile_small',
    },
  },
]
