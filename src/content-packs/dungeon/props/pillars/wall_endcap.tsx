import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonWallEndcapAsset = createDungeonAsset({
  id: 'dungeon.props_pillars_wall_endcap',
  slug: 'dungeon-props-pillars-wall-endcap',
  name: 'Dungeon Wall Endcap',
  category: 'prop',
  modelName: 'wall_endcap',
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
