//import { coreContentPack } from './core'
//import { kaykitContentPack } from './kaykit'
import { dungeonContentPack } from './dungeon'
import type { ContentPackCategory } from './types'
import { getRuntimeAssetById, getRuntimeAssetsByCategory } from './runtimeRegistry'

export const contentPacks = [dungeonContentPack]

export const contentPackAssets = contentPacks.flatMap((pack) => pack.assets)

const assetById = new Map(contentPackAssets.map((asset) => [asset.id, asset]))

export function getContentPackAssetById(id: string) {
  return assetById.get(id) ?? getRuntimeAssetById(id)
}

export function getContentPackAssetsByCategory(category: ContentPackCategory) {
  return [
    ...contentPackAssets.filter((asset) => asset.category === category),
    ...getRuntimeAssetsByCategory(category),
  ]
}

export function getDefaultAssetIdByCategory(category: ContentPackCategory) {
  // Check if any content pack has a default for this category
  for (const pack of contentPacks) {
    const defaultId = pack.defaultAssets?.[category]
    if (defaultId) {
      // Verify the asset actually exists
      const asset = getContentPackAssetById(defaultId)
      if (asset && asset.category === category) {
        return defaultId
      }
    }
  }
  // Fall back to first asset in category
  return getContentPackAssetsByCategory(category)[0]?.id ?? null
}
