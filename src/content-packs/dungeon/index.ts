import type { ContentPack } from '../types'
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
    floor: 'dungeon.floor_floor_tile',
    wall: 'dungeon.wall_wall',
    opening: 'dungeon.stairs_stairs',
    prop: 'dungeon.props_torch_lit',
  },
}
