import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldPillarCornerAsset = createDungeonAsset({
  id: 'dungeon.props_pillars_scaffold_pillar_corner',
  slug: 'dungeon-props-pillars-scaffold-pillar-corner',
  name: 'Dungeon Scaffold Pillar Corner',
  category: 'prop',
  modelName: 'scaffold_pillar_corner',
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
