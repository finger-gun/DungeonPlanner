import type { ComponentType } from 'react'
import type { JSX } from 'react'

export type ContentPackCategory = 'floor' | 'wall' | 'prop'
export type ContentPackComponentProps = JSX.IntrinsicElements['group'] & {
  variantKey?: string
}
export type PropConnector = 'FLOOR' | 'WALL' | 'WALLFLOOR'

export type PropLight = {
  color: string
  intensity: number
  distance: number
  decay?: number
  /** Position of the light in local object space (e.g. move up to where a flame would be) */
  offset?: [number, number, number]
  flicker?: boolean
}

export type ContentPackAssetMetadata = {
  connectsTo?: PropConnector
  light?: PropLight
}

export type ContentPackAsset = {
  id: string
  slug: string
  name: string
  category: ContentPackCategory
  assetUrl: string
  Component: ComponentType<ContentPackComponentProps>
  metadata?: ContentPackAssetMetadata
}

export type ContentPack = {
  id: string
  name: string
  assets: ContentPackAsset[]
}
