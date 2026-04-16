import type { ContentPack } from '../types'
import { floorAsset } from './tiles/Floor'
import { wallAsset } from './tiles/Wall'
import { propsWallTorchAsset } from './props/WallTorch'
import { propsStairCaseUpAsset } from './openings/StairCaseUp'
import { propsStairCaseDownAsset } from './openings/StairCaseDown'
import { propsRubbleAsset } from './props/Rubble'
import { propsBarrelAsset } from './props/Barrel'
import { propsPillarAsset } from './props/Pillar'
import { propsPillarWallAsset } from './props/PillarWall'
import { openingDoorWall1Asset } from './openings/DoorWall1'
import { openingDoorWallBars1Asset } from './openings/DoorWallBars1'
import { openingDoorWall3Asset } from './openings/DoorWall3'

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
    propsBarrelAsset,
    openingDoorWall1Asset,
    openingDoorWallBars1Asset,
    openingDoorWall3Asset,
  ],
}
