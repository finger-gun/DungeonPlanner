import { coreContentPack } from './core'
import type { ContentPackCategory } from './types'

export const contentPacks = [coreContentPack]

export const contentPackAssets = contentPacks.flatMap((pack) => pack.assets)

const assetById = new Map(contentPackAssets.map((asset) => [asset.id, asset]))

export function getContentPackAssetById(id: string) {
  return assetById.get(id) ?? null
}

export function getContentPackAssetsByCategory(category: ContentPackCategory) {
  return contentPackAssets.filter((asset) => asset.category === category)
}

export function getDefaultAssetIdByCategory(category: ContentPackCategory) {
  return getContentPackAssetsByCategory(category)[0]?.id ?? null
}
