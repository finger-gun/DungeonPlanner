import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

export const dungeonKeyringHangingAsset = createDungeonAsset({
  id: 'dungeon.props_keyring_hanging',
  slug: 'dungeon-props-keyring-hanging',
  name: 'Dungeon Keyring Hanging',
  category: 'prop',
  modelName: 'keyring_hanging',
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
