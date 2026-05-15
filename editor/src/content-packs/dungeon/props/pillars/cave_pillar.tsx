import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonCavePillarAsset = createDungeonAsset({
  id: 'dungeon.props_pillars_cave_pillar',
  slug: 'dungeon-props-pillars-cave-pillar',
  name: 'Dungeon Cave Pillar',
  category: 'prop',
  modelName: 'cave_pillar',
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
