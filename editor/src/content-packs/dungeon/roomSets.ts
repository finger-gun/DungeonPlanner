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
      assetId: 'dungeon.floor_standard-living-room',
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
      kind: 'single',
      assetId: 'dungeon.floor_ancient-catacomb',
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
      assetId: 'dungeon.floor_ancient-catacomb',
    },
  },
]
