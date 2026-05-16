import { createDungeonAsset } from '../shared/createDungeonAsset'
import { DungeonDoorCustomVariant } from './door_custom_component'

const DOOR_CUSTOM_SCALE = 0.5

export const dungeonDoorCustomAsset = createDungeonAsset({
  id: 'core.opening_door_custom',
  slug: 'core-opening-door-custom',
  name: 'Dungeon Door (Custom)',
  category: 'opening',
  modelName: 'door_custom',
  Component: DungeonDoorCustomVariant,
  transform: {
    position: [0, 0, 0],
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
