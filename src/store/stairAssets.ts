import { getContentPackAssetById } from '../content-packs/registry'
import { metadataSupportsConnectorType } from '../content-packs/connectors'

export type StairDirection = 'up' | 'down'

function getStairAssetMetadata(assetId: string | null | undefined) {
  if (!assetId) {
    return null
  }

  const asset = getContentPackAssetById(assetId)
  if (!asset || asset.category !== 'opening' || !metadataSupportsConnectorType(asset.metadata, 'FLOOR')) {
    return null
  }

  return asset.metadata ?? null
}

export function getStairDirectionForAssetId(assetId: string | null | undefined): StairDirection | null {
  const direction = getStairAssetMetadata(assetId)?.stairDirection
  return direction === 'up' || direction === 'down' ? direction : null
}

export function getPairedStairAssetId(assetId: string | null | undefined): string | null {
  const metadata = getStairAssetMetadata(assetId)
  const pairedAssetId = metadata?.pairedAssetId
  if (typeof pairedAssetId === 'string' && pairedAssetId.length > 0) {
    return pairedAssetId
  }

  return metadata?.stairDirection ? assetId ?? null : null
}

export function isDownStairAssetId(assetId: string | null | undefined) {
  return getStairDirectionForAssetId(assetId) === 'down'
}
