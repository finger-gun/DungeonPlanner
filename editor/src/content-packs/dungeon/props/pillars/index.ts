import type { ContentPackAsset } from '../../../types'
import { dungeonColumnAsset } from "./column"
import { dungeonPillarAsset } from "./pillar"
import { dungeonScaffoldBeamCornerAsset } from "./scaffold_beam_corner"
import { dungeonScaffoldPillarCornerAsset } from "./scaffold_pillar_corner"
import { dungeonWallCornerSmallAsset } from "./wall_corner_small"
import { dungeonWallEndcapAsset } from "./wall_endcap"

export const dungeonPillarsAssets: ContentPackAsset[] = [
  dungeonColumnAsset,
  dungeonPillarAsset,
  dungeonScaffoldBeamCornerAsset,
  dungeonScaffoldPillarCornerAsset,
  dungeonWallCornerSmallAsset,
  dungeonWallEndcapAsset,
]
