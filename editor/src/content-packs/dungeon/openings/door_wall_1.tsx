import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DUNGEON_WALL_TRANSFORM } from '../shared/dungeonConstants'
import { DungeonWallDoorwayVariant } from '../tiles/walls/wall_doorway'

export const dungeonDoorWall1Asset = createDungeonAsset({
  id: 'core.opening_door_wall_1',
  slug: 'core-opening-door-wall-1',
  name: 'Dungeon Door',
  category: 'opening',
  modelName: 'wall_doorway',
  Component: DungeonWallDoorwayVariant,
  transform: DUNGEON_WALL_TRANSFORM,
  metadata: {
    snapsTo: 'GRID',
    openingWidth: 1,
    connectors: [
      {
        point: [0, 0, 0],
        type: 'WALL',
      },
    ],
    browserCategory: 'openings',
    browserSubcategory: 'doors',
  },
  getPlayModeNextProps: (objectProps) => ({
    open: objectProps.open !== true,
  }),
})
