import { createDungeonAsset } from '../../shared/createDungeonAsset'

const DUNGEON_STAIRS_WOOD_UP_TRANSFORM = {
  position: [0, 0, -1] as const,
  rotation: [0, 0, 0] as const,
}

export const dungeonStairsWoodUpAsset = createDungeonAsset({
  id: 'dungeon.stairs_stairs_wood_up',
  slug: 'dungeon-stairs-stairs-wood-up',
  name: 'Dungeon Stairs Wood Up',
  category: 'opening',
  modelName: 'stairs_wood',
  transform: DUNGEON_STAIRS_WOOD_UP_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    stairDirection: 'up',
    pairedAssetId: 'dungeon.stairs_stairs_wood',
  },
})
