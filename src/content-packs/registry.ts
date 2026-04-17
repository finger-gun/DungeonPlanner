//import { coreContentPack } from './core'
import { kaykitContentPack } from './kaykit'
import type { ContentPackCategory } from './types'
import { getRuntimeAssetById, getRuntimeAssetsByCategory } from './runtimeRegistry'

export const contentPacks = [kaykitContentPack]

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
  return getContentPackAssetsByCategory(category)[0]?.id ?? null
}
