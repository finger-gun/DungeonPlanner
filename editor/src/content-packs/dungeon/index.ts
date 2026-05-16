import { defaultAssetForCategory, type ContentPack } from '../types'
import { dungeonStairsAsset } from './openings/stairs/stairs'
import { dungeonTorchAsset } from './props/torch'
import { dungeonFloorTileSmallAsset } from './tiles/floors/floor_tile_small'
import { dungeonWallAsset } from './tiles/walls/wall'
import { dungeonFloorAssets } from './tiles/floors'
import { dungeonDoorWall1Asset } from './openings/door_wall_1'
import { dungeonDoorCustomAsset } from './openings/door_custom'
import { dungeonWallAssets } from './tiles/walls'
import { dungeonStairAssets } from './openings/stairs'
import { dungeonPropAssets } from './props'
import { dungeonRoomSets } from './roomSets'
import { dungeonWallMaterialSets } from './wallMaterialSets'
import { dungeonWallStyles } from './wallStyles'

export const dungeonContentPack: ContentPack = {
  id: 'dungeon',
  name: 'Dungeon',
  assets: [
    ...dungeonFloorAssets,
    ...dungeonWallAssets,
    dungeonDoorWall1Asset,
    dungeonDoorCustomAsset,
    ...dungeonStairAssets,
    ...dungeonPropAssets,
  ],
  roomSets: dungeonRoomSets,
  wallMaterialSets: dungeonWallMaterialSets,
  wallStyles: dungeonWallStyles,
  defaultAssets: {
    floor: defaultAssetForCategory('floor', dungeonFloorTileSmallAsset),
    wall: defaultAssetForCategory('wall', dungeonWallAsset),
    opening: defaultAssetForCategory('opening', dungeonStairsAsset),
    prop: defaultAssetForCategory('prop', dungeonTorchAsset),
  },
}
