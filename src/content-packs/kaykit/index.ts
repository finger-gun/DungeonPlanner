import type { ContentPack } from '../types'
import { kaykitOpeningAssets } from './openings'
import { kaykitPropAssets } from './props'
import { kaykitTileAssets } from './tiles'

// Mirror the core pack layout: each asset lives in its own file within a
// category folder, while shared behavior stays under ./shared.
export const kaykitContentPack: ContentPack = {
  id: 'kaykit-dungeon-remastered',
  name: 'KayKit Dungeon Remastered',
  assets: [
    ...kaykitTileAssets,
    ...kaykitOpeningAssets,
    ...kaykitPropAssets,
  ],
}
