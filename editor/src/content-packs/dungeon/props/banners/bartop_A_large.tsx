import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBartopALargeAsset = createDungeonAsset({
  id: 'dungeon.props_banners_bartop_A_large',
  slug: 'dungeon-props-banners-bartop-A-large',
  name: 'Dungeon Bartop A Large',
  category: 'prop',
  modelName: 'bartop_A_large',
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
