import { createDungeonWallAsset } from '../shared/createDungeonWallAsset'

export const dungeonWallOpeningAsset = createDungeonWallAsset({
  id: 'dungeon.wall_wall_opening',
  slug: 'dungeon-wall-wall-opening',
  name: 'Dungeon Wall Opening',
  category: 'opening',
  modelName: 'wall_opening',
  metadata: {
    snapsTo: 'GRID',
    openingWidth: 1,
    openingKind: 'passage',
    connectors: [{ point: [0, 0, 0], type: 'WALL' }],
    browserSubcategory: 'doors',
  },
})
