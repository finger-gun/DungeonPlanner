import { createDungeonAsset } from '../../shared/createDungeonAsset'

const DUNGEON_STAIRS_WOOD_DOWN_TRANSFORM = {
  position: [0, -2, -1] as const,
  rotation: [0, 0, 0] as const,
}

export const dungeonStairsWoodAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_wood',
  slug: 'dungeon-stairs-stairs-wood',
  name: 'Dungeon Stairs Wood Down',
  category: 'opening',
  modelName: 'stairs_wood',
  transform: DUNGEON_STAIRS_WOOD_DOWN_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    stairDirection: 'down',
    pairedAssetId: 'dungeon.stairs_stairs_wood_up',
  },
})
