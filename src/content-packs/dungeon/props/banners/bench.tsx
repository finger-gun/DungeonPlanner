import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonBenchAsset = createDungeonAsset({
  id: 'dungeon.props_banners_bench',
  slug: 'dungeon-props-banners-bench',
  name: 'Dungeon Bench',
  category: 'prop',
  modelName: 'bench',
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
