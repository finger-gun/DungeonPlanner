import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { createTextureMask } from './OutdoorGround'
import { sampleOutdoorTerrainHeight } from '../../store/outdoorTerrain'

describe('createTextureMask', () => {
  it('disables vertical texture flipping so painted ground aligns with cursor position', () => {
    const texture = createTextureMask({
      '2:1': {
        cell: [2, 1],
        layerId: 'default',
        textureType: 'rough-stone',
      },
    }, 'rough-stone')

    expect(texture).toBeInstanceOf(THREE.CanvasTexture)
    expect(texture.flipY).toBe(false)
    expect(texture.wrapS).toBe(THREE.ClampToEdgeWrapping)
    expect(texture.wrapT).toBe(THREE.ClampToEdgeWrapping)

    texture.dispose()
  })

  it('samples sculpted terrain heights from world coordinates', () => {
    const outdoorTerrainHeights = {
      '0:0': { cell: [0, 0] as [number, number], height: 1 },
      '1:0': { cell: [1, 0] as [number, number], height: 0 },
      '0:1': { cell: [0, 1] as [number, number], height: 0 },
      '1:1': { cell: [1, 1] as [number, number], height: 0 },
    }

    expect(sampleOutdoorTerrainHeight(outdoorTerrainHeights, 1, 1)).toBe(1)
    expect(sampleOutdoorTerrainHeight(outdoorTerrainHeights, 2, 2)).toBeCloseTo(0.25, 5)
  })
})
