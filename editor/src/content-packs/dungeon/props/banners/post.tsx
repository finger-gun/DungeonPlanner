import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonPostAsset = createDungeonAsset({
  id: 'dungeon.props_banners_post',
  slug: 'dungeon-props-banners-post',
  name: 'Dungeon Post',
  category: 'prop',
  modelName: 'post',
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
