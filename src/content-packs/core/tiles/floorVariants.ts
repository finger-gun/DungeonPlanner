import floorAssetUrl from '../../../assets/models/core/floor.glb'
import floor001AssetUrl from '../../../assets/models/core/floor_001.glb'
import floor002AssetUrl from '../../../assets/models/core/floor_002.glb'
import floor003AssetUrl from '../../../assets/models/core/floor_003.glb'
import floor004AssetUrl from '../../../assets/models/core/floor_004.glb'
import floor005AssetUrl from '../../../assets/models/core/floor_005.glb'
import floor006AssetUrl from '../../../assets/models/core/floor_006.glb'
import floor007AssetUrl from '../../../assets/models/core/floor_007.glb'

export const FLOOR_PIVOT_OFFSET = [-1, -0.22, 1] as const

export const FLOOR_VARIANT_URLS = [
  floorAssetUrl,
  floor001AssetUrl,
  floor002AssetUrl,
  floor003AssetUrl,
  floor004AssetUrl,
  floor005AssetUrl,
  floor006AssetUrl,
  floor007AssetUrl,
] as const

export function getFloorVariantAssetUrl(variantKey: string | undefined) {
  return FLOOR_VARIANT_URLS[getFloorVariantIndex(variantKey, FLOOR_VARIANT_URLS.length)]
}

export function getFloorVariantIndex(variantKey: string | undefined, variantCount: number) {
  if (!variantKey) {
    return 0
  }

  let hash = 0
  for (let index = 0; index < variantKey.length; index += 1) {
    hash = (hash * 31 + variantKey.charCodeAt(index)) >>> 0
  }

  return hash % variantCount
}
