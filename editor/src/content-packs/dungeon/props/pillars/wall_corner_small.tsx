import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonWallCornerSmallAsset = createDungeonAsset({
  id: 'dungeon.props_pillars_wall_corner_small',
  slug: 'dungeon-props-pillars-wall-corner-small',
  name: 'Dungeon Wall Corner Small',
  category: 'prop',
  modelName: 'wall_corner_small',
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
