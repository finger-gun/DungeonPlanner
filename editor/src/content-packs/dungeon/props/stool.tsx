import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonStoolAsset = createDungeonAsset({
  id: 'dungeon.props_stool',
  slug: 'dungeon-props-stool',
  name: 'Dungeon Stool',
  category: 'prop',
  modelName: 'stool',
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
