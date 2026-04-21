//import { coreContentPack } from './core'
//import { kaykitContentPack } from './kaykit'
import { dungeonContentPack } from './dungeon'
import { warnIfUsesDeprecatedConnectsTo } from './deprecations'
import type { ContentPackCategory } from './types'
import { getRuntimeAssetById, getRuntimeAssetsByCategory } from './runtimeRegistry'

export const contentPacks = [dungeonContentPack]

export const contentPackAssets = contentPacks.flatMap((pack) => pack.assets)

const assetById = new Map(contentPackAssets.map((asset) => [asset.id, asset]))

export function getContentPackAssetById(id: string) {
  return warnIfUsesDeprecatedConnectsTo(assetById.get(id) ?? getRuntimeAssetById(id))
}

export function getContentPackAssetsByCategory(category: ContentPackCategory) {
  return [
    ...contentPackAssets.filter((asset) => asset.category === category),
    ...getRuntimeAssetsByCategory(category),
  ].map((asset) => warnIfUsesDeprecatedConnectsTo(asset))
}

export function getDefaultAssetIdByCategory(category: ContentPackCategory) {
  // Check if any content pack has a default for this category
  for (const pack of contentPacks) {
    const defaultAsset = pack.defaultAssets?.[category]
    if (defaultAsset) {
      // Verify the asset actually exists
      const asset = getContentPackAssetById(defaultAsset.id)
      if (asset && asset.category === category) {
        return defaultAsset.id
      }
    }
  }
  // Fall back to first asset in category
  return getContentPackAssetsByCategory(category)[0]?.id ?? null
}
