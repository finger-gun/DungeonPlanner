import { createDungeonAsset } from '../../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../../shared/dungeonConstants'

export const dungeonScaffoldBeamCornerAsset = createDungeonAsset({
  id: 'dungeon.props_pillars_scaffold_beam_corner',
  slug: 'dungeon-props-pillars-scaffold-beam-corner',
  name: 'Dungeon Scaffold Beam Corner',
  category: 'prop',
  modelName: 'scaffold_beam_corner',
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
