import type { ContentPack } from '../types'
import { floorAsset } from './Floor'
import { wallAsset } from './Wall'
import { propsWallTorchAsset } from './WallTorch'
import { propsStairCaseUpAsset } from './StairCaseUp'
import { propsRubbleAsset } from './Rubble'
import { propsPillarAsset } from './Pillar'

export const coreContentPack: ContentPack = {
  id: 'core',
  name: 'Core Dungeon Pack',
  assets: [
    floorAsset,
    wallAsset,
    propsWallTorchAsset,
    propsStairCaseUpAsset,
    propsRubbleAsset,
    propsPillarAsset,
  ],
}
