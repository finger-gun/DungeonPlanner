import { createDungeonAsset } from '../shared/createDungeonAsset'

const DOOR_CUSTOM_SCALE = 0.5
const DOOR_CUSTOM_SOURCE_CENTER_X = 18
const DOOR_CUSTOM_SOURCE_MIN_Y = 28
const DOOR_CUSTOM_FACE_OFFSET = 0.057

export const dungeonDoorCustomAsset = createDungeonAsset({
  id: 'core.opening_door_custom',
  slug: 'core-opening-door-custom',
  name: 'Dungeon Door (Custom)',
  category: 'opening',
  modelName: 'door_custom',
  transform: {
    position: [
      -DOOR_CUSTOM_SOURCE_CENTER_X * DOOR_CUSTOM_SCALE,
      -DOOR_CUSTOM_SOURCE_MIN_Y * DOOR_CUSTOM_SCALE,
      DOOR_CUSTOM_FACE_OFFSET,
    ],
    rotation: [0, 0, 0],
    scale: DOOR_CUSTOM_SCALE,
  },
  metadata: {
    snapsTo: 'GRID',
    openingWidth: 1,
    openingKind: 'door',
    openingCutoutWidth: 1.04,
    openingCutoutHeight: 1.42,
    openingCutoutShape: 'arched',
    connectors: [
      {
        point: [0, 0, 0],
        type: 'WALL',
      },
    ],
    browserCategory: 'openings',
    browserSubcategory: 'doors',
  },
})
