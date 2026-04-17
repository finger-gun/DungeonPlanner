import type { ComponentType } from 'react'
import type { JSX } from 'react'

export type ContentPackCategory = 'floor' | 'wall' | 'prop' | 'opening' | 'player'
export type ContentPackComponentProps = JSX.IntrinsicElements['group'] & {
  variantKey?: string
  objectProps?: Record<string, unknown>
  poseSelected?: boolean
  playerAnimationState?: 'default' | 'selected' | 'pickup' | 'holding' | 'release'
}
export type ContentPackModelTransform = {
  position?: readonly [number, number, number]
  rotation?: readonly [number, number, number]
  scale?: number | readonly [number, number, number]
}
export type PropConnector = 'FLOOR' | 'WALL' | 'WALLFLOOR' | 'FREE'

export type PropLight = {
  color: string
  intensity: number
  distance: number
  decay?: number
  /** Position of the light in local object space (e.g. move up to where a flame would be) */
  offset?: [number, number, number]
  flicker?: boolean
  /** Whether this light casts shadows. Defaults to false (point light shadows are expensive). */
  castShadow?: boolean
}

export type ContentPackAssetMetadata = {
  connectsTo?: PropConnector
  propSurface?: boolean
  light?: PropLight
  /** Whether this asset blocks play-mode line of sight when placed on a floor cell. */
  blocksLineOfSight?: boolean
  /** Whether this asset's meshes receive shadows. Defaults to true when omitted. */
  receiveShadow?: boolean
  /** Width in wall segments for category='wall'. Default 1. */
  wallSpan?: 1 | 2 | 3
  /** Whether the wall should add auto-placed convex exterior corner pieces. */
  wallCornerType?: 'solitary'
  /** Width in wall segments (1–3). Only meaningful for category='opening'. Default 1. */
  openingWidth?: 1 | 2 | 3
  /** Marks a floor-connected opening as staircase that links floors. */
  stairDirection?: 'up' | 'down'
  /** Matching staircase asset to place on the adjacent floor. */
  pairedAssetId?: string
}

export type ContentPackAsset = {
  id: string
  slug: string
  name: string
  category: ContentPackCategory
  assetUrl?: string
  thumbnailUrl?: string
  Component: ComponentType<ContentPackComponentProps>
  metadata?: ContentPackAssetMetadata
  projectionReceiver?: {
    getAssetUrl?: (variantKey?: string) => string | undefined
    transform?: ContentPackModelTransform
  }
  getLight?: (objectProps: Record<string, unknown>) => PropLight | null
  getPlayModeNextProps?: (objectProps: Record<string, unknown>) => Record<string, unknown> | null
}

export type ContentPack = {
  id: string
  name: string
  assets: ContentPackAsset[]
}
