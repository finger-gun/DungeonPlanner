import type { ContentPackModelTransform } from '../../content-packs/types'
import { getContentPackAssetById } from '../../content-packs/registry'

type ObjectProps = Record<string, unknown> | undefined

export type ResolvedBatchedTileAsset = {
  assetUrl: string
  transform?: ContentPackModelTransform
  transformKey: string
  receiveShadow: boolean
}

export type ResolvedProjectionReceiverAsset = {
  assetUrl: string
  transform?: ContentPackModelTransform
  transformKey: string
}

export function resolveBatchedTileAsset(
  assetId: string | null,
  variantKey?: string,
  objectProps?: ObjectProps,
): ResolvedBatchedTileAsset | null {
  if (!assetId) {
    return null
  }

  const asset = getContentPackAssetById(assetId)
  const batchRender = asset?.batchRender
  if (!asset || !batchRender) {
    return null
  }

  const assetUrl = batchRender.getAssetUrl?.(variantKey, objectProps) ?? asset.assetUrl
  if (!assetUrl) {
    return null
  }

  const transform = resolveTransform(batchRender.transform, variantKey, objectProps)
  return {
    assetUrl,
    transform,
    transformKey: getTransformKey(transform),
    receiveShadow: asset.metadata?.receiveShadow !== false,
  }
}

export function resolveProjectionReceiverAsset(
  assetId: string | null,
  variantKey?: string,
): ResolvedProjectionReceiverAsset | null {
  if (!assetId) {
    return null
  }

  const asset = getContentPackAssetById(assetId)
  if (!asset) {
    return null
  }

  const assetUrl = asset.projectionReceiver?.getAssetUrl?.(variantKey) ?? asset.assetUrl
  if (!assetUrl) {
    return null
  }

  const transform = asset.projectionReceiver?.transform
  return {
    assetUrl,
    transform,
    transformKey: getTransformKey(transform),
  }
}

function resolveTransform(
  value:
    | ContentPackModelTransform
    | ((variantKey?: string, objectProps?: ObjectProps) => ContentPackModelTransform | undefined)
    | undefined,
  variantKey?: string,
  objectProps?: ObjectProps,
) {
  return typeof value === 'function' ? value(variantKey, objectProps) : value
}

function getTransformKey(transform?: ContentPackModelTransform) {
  if (!transform) {
    return 'default'
  }

  return JSON.stringify({
    position: transform.position ?? null,
    rotation: transform.rotation ?? null,
    scale: transform.scale ?? null,
  })
}
