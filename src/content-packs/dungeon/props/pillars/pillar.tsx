import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonPillarAsset = createDungeonAsset({
  id: 'dungeon.props_pillars_pillar',
  slug: 'dungeon-props-pillars-pillar',
  name: 'Dungeon Pillar',
  category: 'prop',
  modelName: 'pillar',
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
