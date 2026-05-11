import { dungeonContentPack } from './dungeon'
import { warnIfUsesDeprecatedConnectsTo } from './deprecations'
import { kaykitContentPack } from './kaykit'
import type { ContentPack, ContentPackCategory } from './types'
import { getRuntimeAssetById, getRuntimeAssetsByCategory } from './runtimeRegistry'

export const contentPacks = [dungeonContentPack, kaykitContentPack]

export const contentPackAssets = contentPacks.flatMap((pack) => pack.assets)

function getStaticContentPacks() {
  return [dungeonContentPack, kaykitContentPack]
}

function getStaticContentPackAssets() {
  return getStaticContentPacks().flatMap((pack) => pack.assets)
}

export function getContentPackById(id: string): ContentPack | null {
  return getStaticContentPacks().find((pack) => pack.id === id) ?? null
}

export function getContentPackRoomSets(contentPackId: string) {
  return getContentPackById(contentPackId)?.roomSets ?? []
}

export function getContentPackWallMaterialSets(contentPackId: string) {
  return getContentPackById(contentPackId)?.wallMaterialSets ?? []
}

export function getContentPackRoomSetById(contentPackId: string, roomSetId: string | null | undefined) {
  if (!roomSetId) {
    return null
  }

  return getContentPackRoomSets(contentPackId).find((roomSet) => roomSet.id === roomSetId) ?? null
}

export function getContentPackWallMaterialSetById(
  contentPackId: string,
  wallMaterialSetId: string | null | undefined,
) {
  if (!wallMaterialSetId) {
    return null
  }

  return getContentPackWallMaterialSets(contentPackId)
    .find((wallMaterialSet) => wallMaterialSet.id === wallMaterialSetId) ?? null
}

export function getDefaultContentPackRoomSetId(contentPackId: string) {
  return getContentPackRoomSets(contentPackId)[0]?.id ?? null
}

export function getDefaultContentPackWallMaterialSetId(contentPackId: string) {
  return getContentPackWallMaterialSets(contentPackId)[0]?.id ?? null
}

export function getContentPackAssetById(id: string) {
  return warnIfUsesDeprecatedConnectsTo(
    getStaticContentPackAssets().find((asset) => asset.id === id) ?? getRuntimeAssetById(id),
  )
}

export function getContentPackAssetsByCategory(category: ContentPackCategory) {
  return [
    ...getStaticContentPackAssets().filter((asset) => asset.category === category),
    ...getRuntimeAssetsByCategory(category),
  ].map((asset) => warnIfUsesDeprecatedConnectsTo(asset))
}

export function getDefaultAssetIdByCategory(category: ContentPackCategory) {
  // Check if any content pack has a default for this category
  for (const pack of getStaticContentPacks()) {
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
