import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonBucketAsset = createDungeonAsset({
  id: 'dungeon.props_bucket',
  slug: 'dungeon-props-bucket',
  name: 'Dungeon Bucket',
  category: 'prop',
  modelName: 'bucket',
  transform: DUNGEON_PROP_TRANSFORM,
  metadata: {
    snapsTo: 'FREE',
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
})
