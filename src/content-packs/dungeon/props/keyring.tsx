import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonKeyringAsset = createDungeonAsset({
  id: 'dungeon.props_keyring',
  slug: 'dungeon-props-keyring',
  name: 'Dungeon Keyring',
  category: 'prop',
  modelName: 'keyring',
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
