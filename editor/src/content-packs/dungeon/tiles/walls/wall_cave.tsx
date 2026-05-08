import { createDungeonWallAsset } from '../../shared/createDungeonWallAsset'

export const dungeonWallCaveAsset = createDungeonWallAsset({
  id: 'dungeon.wall_wall_cave',
  slug: 'dungeon-wall-wall-cave',
  name: 'Dungeon Wall Cave',
  modelName: 'cave_wall',
  wallRotationYOffset: Math.PI,
})
