import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBucketPickaxesAsset = createDungeonAsset({
  id: 'dungeon.props_bucket_pickaxes',
  slug: 'dungeon-props-bucket-pickaxes',
  name: 'Dungeon Bucket Pickaxes',
  category: 'prop',
  modelName: 'bucket_pickaxes',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
})
