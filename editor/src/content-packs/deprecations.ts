import type { ContentPackAsset } from './types'

const warnedConnectsToAssetIds = new Set<string>()

export function warnIfUsesDeprecatedConnectsTo<TAsset extends ContentPackAsset | null>(
  asset: TAsset,
): TAsset {
  if (!asset?.metadata?.connectsTo || warnedConnectsToAssetIds.has(asset.id)) {
    return asset
  }

  warnedConnectsToAssetIds.add(asset.id)
  console.warn(
    `[deprecation] Content pack asset "${asset.id}" still uses metadata.connectsTo. ` +
      'Please migrate it to metadata.connectors and remove connectsTo.',
  )

  return asset
}

export function resetContentPackDeprecationWarningsForTest() {
  warnedConnectsToAssetIds.clear()
}
