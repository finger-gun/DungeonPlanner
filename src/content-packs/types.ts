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
export type ContentPackBatchRender = {
  getAssetUrl?: (
    variantKey?: string,
    objectProps?: Record<string, unknown>,
  ) => string | undefined
  transform?:
    | ContentPackModelTransform
    | ((variantKey?: string, objectProps?: Record<string, unknown>) => ContentPackModelTransform | undefined)
}
export type ConnectsTo = 'FLOOR' | 'WALL' | 'SURFACE'
export type SnapsTo = 'GRID' | 'FREE'

export type Connector = {
  /** Position in local object space relative to model origin */
  point: readonly [number, number, number]
  /** What this connector can attach to */
  type: ConnectsTo
  /** Optional rotation adjustment when connected (euler angles in radians) */
  rotation?: readonly [number, number, number]
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

export type TileSpan = {
  /** How many grid cells wide this tile spans (1 cell = GRID_SIZE units). */
  gridWidth: 1 | 2 | 4
  /** How many grid cells deep this tile spans (1 cell = GRID_SIZE units). */
  gridHeight: 1 | 2 | 4
}

export type ContentPackAssetMetadata = {
  /** Legacy: single connection type (deprecated, use connectsTo array instead) */
  connectsTo?: PropConnector
  /** What this asset can connect to (FLOOR, WALL, or SURFACE for stackable objects) */
  connectsToTypes?: ConnectsTo | ConnectsTo[]
  /** How this asset snaps during placement: GRID (snap to grid/wall centers) or FREE (freeform) */
  snapsTo?: SnapsTo
  /** Multiple connection points for objects that can attach in different ways */
  connectors?: Connector[]
  /** Whether other props can be placed on this object's surface */
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
  /** How many grid cells this floor/ceiling tile spans. Default is 1x1. */
  tileSpan?: TileSpan
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
  batchRender?: ContentPackBatchRender
  getLight?: (objectProps: Record<string, unknown>) => PropLight | null
  getPlayModeNextProps?: (objectProps: Record<string, unknown>) => Record<string, unknown> | null
}

export type ContentPack = {
  id: string
  name: string
  assets: ContentPackAsset[]
  /** Optional default asset IDs for each category */
  defaultAssets?: {
    floor?: string
    wall?: string
    opening?: string
    prop?: string
    player?: string
  }
}
