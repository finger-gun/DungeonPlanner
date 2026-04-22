import { describe, expect, it } from 'vitest'
import {
  STEPPED_OUTDOOR_TERRAIN_ASSETS,
  resolveSteppedOutdoorTerrainAssetUrl,
} from './steppedOutdoorTerrainAssets'

describe('steppedOutdoorTerrainAssets', () => {
  it('resolves maintained project urls for every required terrain asset', () => {
    for (const assetKey of Object.keys(STEPPED_OUTDOOR_TERRAIN_ASSETS)) {
      const url = resolveSteppedOutdoorTerrainAssetUrl(assetKey as keyof typeof STEPPED_OUTDOOR_TERRAIN_ASSETS)
      expect(url).toBeTruthy()
      expect(url?.startsWith('data:model/gltf+json;base64,')).toBe(true)
    }
  })

  it('does not reference temp-pack paths at runtime', () => {
    for (const assetKey of Object.keys(STEPPED_OUTDOOR_TERRAIN_ASSETS)) {
      const url = resolveSteppedOutdoorTerrainAssetUrl(assetKey as keyof typeof STEPPED_OUTDOOR_TERRAIN_ASSETS)
      expect(url).not.toContain('forrest-assets-tmp')
    }
  })
})
