import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import type { PlayVisibilityState } from './playVisibility'

export type TilePlacement = {
  key: string
  position: readonly [number, number, number]
  rotation: readonly [number, number, number]
  buildAnimationDelay?: number
  buildAnimationStart?: number
  bakedLight?: readonly [number, number, number]
  bakedLightDirection?: readonly [number, number, number]
  bakedLightDirectionSecondary?: readonly [number, number, number]
  fogCell?: readonly [number, number]
}

export type StaticTileEntry = TilePlacement & {
  assetId: string | null
  variant: 'floor' | 'wall'
  variantKey?: string
  objectProps?: Record<string, unknown>
  visibility: PlayVisibilityState
  bakedLightField?: BakedFloorLightField
  fogCell?: readonly [number, number]
}
