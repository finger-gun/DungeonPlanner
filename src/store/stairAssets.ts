import { getContentPackAssetById } from '../content-packs/registry'

export type StairDirection = 'up' | 'down'

function getStairAssetMetadata(assetId: string | null | undefined) {
  if (!assetId) {
    return null
  }

  const asset = getContentPackAssetById(assetId)
  if (!asset || asset.category !== 'opening' || asset.metadata?.connectsTo !== 'FLOOR') {
    return null
  }

  return asset.metadata ?? null
}

export function getStairDirectionForAssetId(assetId: string | null | undefined): StairDirection | null {
  const direction = getStairAssetMetadata(assetId)?.stairDirection
  return direction === 'up' || direction === 'down' ? direction : null
}

export function getPairedStairAssetId(assetId: string | null | undefined): string | null {
  const pairedAssetId = getStairAssetMetadata(assetId)?.pairedAssetId
  return typeof pairedAssetId === 'string' && pairedAssetId.length > 0 ? pairedAssetId : null
}

export function isDownStairAssetId(assetId: string | null | undefined) {
  return getStairDirectionForAssetId(assetId) === 'down'
}
