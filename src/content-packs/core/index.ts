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
import { playerBarbarianAsset } from './players/PlayerBarbarian'
import { playerKnightAsset } from './players/PlayerKnight'
import { playerMageAsset } from './players/PlayerMage'
import { playerRangerAsset } from './players/PlayerRanger'
import { playerRogueAsset } from './players/PlayerRogue'
import { playerRogueHoodedAsset } from './players/PlayerRogueHooded'

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
    playerBarbarianAsset,
    playerKnightAsset,
    playerMageAsset,
    playerRangerAsset,
    playerRogueAsset,
    playerRogueHoodedAsset,
    openingDoorWall1Asset,
    openingDoorWallBars1Asset,
    openingDoorWall3Asset,
  ],
}
