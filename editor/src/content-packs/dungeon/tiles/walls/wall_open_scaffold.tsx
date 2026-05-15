import { createDungeonWallAsset } from '../../shared/createDungeonWallAsset'

export const dungeonWallOpenScaffoldAsset = createDungeonWallAsset({
  id: 'dungeon.wall_wall_open_scaffold',
  slug: 'dungeon-wall-wall-open-scaffold',
  name: 'Dungeon Wall Open Scaffold',
  category: 'opening',
  modelName: 'wall_open_scaffold',
  metadata: {
    snapsTo: 'GRID',
    openingWidth: 1,
    openingKind: 'passage',
    connectors: [{ point: [0, 0, 0], type: 'WALL' }],
    browserSubcategory: 'doors',
  },
})
