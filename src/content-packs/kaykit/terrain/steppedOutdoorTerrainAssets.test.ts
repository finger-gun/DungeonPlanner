import { describe, expect, it } from 'vitest'
import {
  STEPPED_OUTDOOR_TERRAIN_ASSETS,
  resolveSteppedOutdoorTerrainAssetUrl,
} from './steppedOutdoorTerrainAssets'

describe('steppedOutdoorTerrainAssets', () => {
  it('resolves maintained runtime urls for every required terrain asset', () => {
    for (const assetKey of Object.keys(STEPPED_OUTDOOR_TERRAIN_ASSETS)) {
      const url = resolveSteppedOutdoorTerrainAssetUrl(assetKey as keyof typeof STEPPED_OUTDOOR_TERRAIN_ASSETS)
      expect(url).toBeTruthy()
      expect(url.startsWith('data:model/gltf+json;base64,')).toBe(true)
    }
  })

  it('does not reference temp-pack paths at runtime', () => {
    for (const assetKey of Object.keys(STEPPED_OUTDOOR_TERRAIN_ASSETS)) {
      const url = resolveSteppedOutdoorTerrainAssetUrl(assetKey as keyof typeof STEPPED_OUTDOOR_TERRAIN_ASSETS)
      expect(url).not.toContain('forrest-assets-tmp')
    }
  })

  it('rewrites terrain sidecars to emitted runtime urls', () => {
    const url = resolveSteppedOutdoorTerrainAssetUrl('top-center')
    expect(url.startsWith('data:model/gltf+json;base64,')).toBe(true)

    const payload = url.slice('data:model/gltf+json;base64,'.length)
    const document = JSON.parse(atob(payload)) as {
      buffers?: Array<{ uri?: string }>
      images?: Array<{ uri?: string }>
    }

    expect(document.buffers?.[0]?.uri).toContain('Hill_Top_E_Center_Color1')
    expect(document.buffers?.[0]?.uri).toContain('.bin')
    expect(document.buffers?.[0]?.uri).not.toBe('Hill_Top_E_Center_Color1.bin')
    expect(document.images?.[0]?.uri).toContain('forest_texture')
    expect(document.images?.[0]?.uri).toContain('.ktx2')
    expect(document.images?.[0]?.uri).not.toBe('forest_texture.ktx2')
  })
})
