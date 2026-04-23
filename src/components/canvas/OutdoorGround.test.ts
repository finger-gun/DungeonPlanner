import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import {
  createTerrainStyleMask,
  getTerrainEdgeTransitionTransform,
  getTerrainStyleAtlasStripUv,
  makeTexturePixelsOpaque,
} from './OutdoorGround'
import { sampleOutdoorTerrainHeight } from '../../store/outdoorTerrain'

describe('OutdoorGround helpers', () => {
  it('disables vertical texture flipping so painted ground aligns with cursor position', () => {
    const texture = createTerrainStyleMask({
      '2:1': {
        cell: [2, 1],
        layerId: 'default',
        terrainStyle: 'Color3',
      },
    }, 'Color3')

    expect(texture).toBeInstanceOf(THREE.CanvasTexture)
    expect(texture.flipY).toBe(false)
    expect(texture.wrapS).toBe(THREE.ClampToEdgeWrapping)
    expect(texture.wrapT).toBe(THREE.ClampToEdgeWrapping)

    texture.dispose()
  })

  it('samples sculpted terrain heights from world coordinates', () => {
    const outdoorTerrainHeights = {
      '0:0': { cell: [0, 0] as [number, number], level: 1 },
    }

    expect(sampleOutdoorTerrainHeight(outdoorTerrainHeights, 1, 1)).toBe(2)
    expect(sampleOutdoorTerrainHeight(outdoorTerrainHeights, 2, 2)).toBe(0)
  })

  it('ignores source alpha when preparing the base grass texture', () => {
    const pixels = new Uint8ClampedArray([
      90, 164, 60, 0,
      75, 154, 59, 128,
    ])

    makeTexturePixelsOpaque(pixels)

    expect([...pixels]).toEqual([
      90, 164, 60, 255,
      75, 154, 59, 255,
    ])
  })

  it('positions terrain edge transitions on the matching cliff boundary', () => {
    expect(getTerrainEdgeTransitionTransform([2, 3], 'north')).toEqual({
      position: [5, 6],
      rotationY: 0,
    })

    expect(getTerrainEdgeTransitionTransform([2, 3], 'east')).toEqual({
      position: [6, 7],
      rotationY: Math.PI / 2,
    })
  })

  it('uses the authored top-center atlas strip for each terrain style', () => {
    expect(getTerrainStyleAtlasStripUv('Color1')).toEqual({
      minU: 0.03546178340911865,
      maxU: 0.055953145027160645,
      centerV: 0.0894547700881958,
    })
    expect(getTerrainStyleAtlasStripUv('Color5')).toEqual({
      minU: 0.5354617834091187,
      maxU: 0.5559531450271606,
      centerV: 0.0894547700881958,
    })
    expect(getTerrainStyleAtlasStripUv('Color8')).toEqual({
      minU: 0.9104617834091187,
      maxU: 0.9309531450271606,
      centerV: 0.0894547700881958,
    })
  })
})
