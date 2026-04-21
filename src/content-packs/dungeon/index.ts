import { defaultAssetForCategory, type ContentPack } from '../types'
import { dungeonStairsAsset } from './openings/stairs/stairs'
import { dungeonTorchLitAsset } from './props/torch_lit'
import { dungeonFloorTileSmallAsset } from './tiles/floors/floor_tile_small'
import { dungeonWallAsset } from './tiles/walls/wall'
import { dungeonFloorAssets } from './tiles/floors'
import { dungeonWallAssets } from './tiles/walls'
import { dungeonStairAssets } from './openings/stairs'
import { dungeonPropAssets } from './props'

export const dungeonContentPack: ContentPack = {
  id: 'dungeon',
  name: 'Dungeon',
  assets: [
    ...dungeonFloorAssets,
    ...dungeonWallAssets,
    ...dungeonStairAssets,
    ...dungeonPropAssets,
  ],
  defaultAssets: {
    floor: defaultAssetForCategory('floor', dungeonFloorTileSmallAsset),
    wall: defaultAssetForCategory('wall', dungeonWallAsset),
    opening: defaultAssetForCategory('opening', dungeonStairsAsset),
    prop: defaultAssetForCategory('prop', dungeonTorchLitAsset),
  },
}
