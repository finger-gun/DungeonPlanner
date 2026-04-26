import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonStoolRoundAsset = createDungeonAsset({
  id: 'dungeon.props_banners_stool_round',
  slug: 'dungeon-props-banners-stool-round',
  name: 'Dungeon Stool Round',
  category: 'prop',
  modelName: 'stool_round',
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
