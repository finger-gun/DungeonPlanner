import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import {
  applyTerrainShadowSettings,
  STEPPED_OUTDOOR_TERRAIN_ASSETS,
  resolveSteppedOutdoorTerrainAssetUrl,
} from './steppedOutdoorTerrainAssets'

describe('steppedOutdoorTerrainAssets', () => {
  it('resolves maintained runtime urls for every required terrain asset', () => {
    for (const assetKey of Object.keys(STEPPED_OUTDOOR_TERRAIN_ASSETS)) {
      const url = resolveSteppedOutdoorTerrainAssetUrl(assetKey as keyof typeof STEPPED_OUTDOOR_TERRAIN_ASSETS)
      expect(url).toBeTruthy()
      expect(url).toContain('.glb')
    }
  })

  it('does not reference temp-pack paths at runtime', () => {
    for (const assetKey of Object.keys(STEPPED_OUTDOOR_TERRAIN_ASSETS)) {
      const url = resolveSteppedOutdoorTerrainAssetUrl(assetKey as keyof typeof STEPPED_OUTDOOR_TERRAIN_ASSETS)
      expect(url).not.toContain('forrest-assets-tmp')
    }
  })

  it('resolves terrain assets to emitted glb runtime urls', () => {
    const url = resolveSteppedOutdoorTerrainAssetUrl('top-center')
    expect(url).toContain('Hill_Top_E_Center_Color1')
    expect(url).toContain('.glb')
  })

  it('enables shadow casting and receiving on cloned terrain meshes', () => {
    const root = new THREE.Group()
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial())
    root.add(mesh)

    applyTerrainShadowSettings(root)

    expect(mesh.castShadow).toBe(true)
    expect(mesh.receiveShadow).toBe(true)
  })
})
