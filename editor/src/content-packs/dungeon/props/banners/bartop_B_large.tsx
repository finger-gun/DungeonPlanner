import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBartopBLargeAsset = createDungeonAsset({
  id: 'dungeon.props_banners_bartop_B_large',
  slug: 'dungeon-props-banners-bartop-B-large',
  name: 'Dungeon Bartop B Large',
  category: 'prop',
  modelName: 'bartop_B_large',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'WALL',
      },
    ],
    blocksLineOfSight: false,
  },
})
