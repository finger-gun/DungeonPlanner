import type { ContentPack } from '../types'
import { floorAsset } from './Floor'
import { wallAsset } from './Wall'
import { propsWallTorchAsset } from './WallTorch'
import { propsStairCaseUpAsset } from './StairCaseUp'
import { propsStairCaseDownAsset } from './StairCaseDown'
import { propsRubbleAsset } from './Rubble'
import { propsPillarAsset } from './Pillar'
import { propsPillarWallAsset } from './PillarWall'
import { openingDoorWall1Asset } from './DoorWall1'
import { openingDoorWall3Asset } from './DoorWall3'

export const coreContentPack: ContentPack = {
  id: 'core',
  name: 'Core Dungeon Pack',
  assets: [
    floorAsset,
    wallAsset,
    propsWallTorchAsset,
    propsStairCaseUpAsset,
    propsStairCaseDownAsset,
    propsRubbleAsset,
    propsPillarAsset,
    propsPillarWallAsset,
    openingDoorWall1Asset,
    openingDoorWall3Asset,
  ],
}
