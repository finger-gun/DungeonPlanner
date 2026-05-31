import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { ContentPackWallMaterialSet } from '../../content-packs/types'
import {
  configureSplineWallTexture,
  createSplineWallMaterial,
  createSplineWallTopMaterial,
  resolveActiveSplineWallMaterialSet,
  type SplineWallPbrTextures,
} from './splineWallMaterial'

function createTextures(overrides: Partial<SplineWallPbrTextures> = {}): SplineWallPbrTextures {
  return {
    albedo: new THREE.Texture(),
    normal: new THREE.Texture(),
    ao: new THREE.Texture(),
    height: new THREE.Texture(),
    displacement: new THREE.Texture(),
    roughness: new THREE.Texture(),
    metallic: new THREE.Texture(),
    aoChannel: 'r',
    heightChannel: 'r',
    roughnessChannel: 'g',
    ...overrides,
  }
}

describe('splineWallMaterial', () => {
  it('configures tiled wall textures with the right sampling mode', () => {
    const colorTexture = new THREE.Texture()
    const dataTexture = new THREE.Texture()

    configureSplineWallTexture(colorTexture, 'color')
    configureSplineWallTexture(dataTexture, 'data')

    expect(colorTexture.wrapS).toBe(THREE.RepeatWrapping)
    expect(colorTexture.wrapT).toBe(THREE.RepeatWrapping)
    expect(colorTexture.colorSpace).toBe(THREE.SRGBColorSpace)
    expect(colorTexture.anisotropy).toBe(8)
    expect(dataTexture.colorSpace).toBe(THREE.NoColorSpace)
  })

  it('can clamp wall textures vertically while keeping horizontal repeat', () => {
    const texture = new THREE.Texture()

    configureSplineWallTexture(texture, 'color', 'clamp')

    expect(texture.wrapS).toBe(THREE.RepeatWrapping)
    expect(texture.wrapT).toBe(THREE.ClampToEdgeWrapping)
  })

  it('creates a dungeon wall material with PBR maps', () => {
    const textures = createTextures()
    const material = createSplineWallMaterial('dungeon', textures) as THREE.MeshStandardMaterial

    expect(material.map).toBe(textures.albedo)
    expect(material.normalMap).toBe(textures.normal)
    expect(material.aoMap).toBe(textures.ao)
    expect(material.bumpMap).toBe(textures.height)
    expect(material.roughnessMap).toBe(textures.roughness)
    expect(material.metalnessMap).toBe(textures.metallic)
    expect(material.color.getHexString()).toBe('ffffff')
    expect(material.side).toBe(THREE.DoubleSide)
  })

  it('does not use packed ORMH height maps as legacy bump maps', () => {
    const packedMap = new THREE.Texture()
    const textures = createTextures({
      ao: packedMap,
      height: packedMap,
      roughness: packedMap,
      heightChannel: 'b',
    })

    const material = createSplineWallMaterial('dungeon', textures) as THREE.MeshStandardMaterial

    expect(material.aoMap).toBe(packedMap)
    expect(material.roughnessMap).toBe(packedMap)
    expect(material.bumpMap).toBeNull()
  })

  it('applies authored wall-set tint and scalar shading overrides', () => {
    const textures = createTextures({
      roughness: null,
      metallic: null,
      height: null,
    })
    const wallMaterialSet: ContentPackWallMaterialSet = {
      id: 'kaykit-stone',
      name: 'KayKit Stone',
      textures: {
        albedoUrl: '/wall_albedo.png',
      },
      shading: {
        tintColor: '#9499a7',
        roughness: 0.55,
        aoMapIntensity: 0.32,
        topSurfaceColor: '#2f3442',
        topSurfaceRoughness: 0.7,
      },
    }

    const material = createSplineWallMaterial('dungeon', textures, wallMaterialSet) as THREE.MeshStandardMaterial
    const topMaterial = createSplineWallTopMaterial('dungeon', wallMaterialSet) as THREE.MeshStandardMaterial

    expect(material.color.getHexString()).toBe('9499a7')
    expect(material.roughness).toBe(0.55)
    expect(material.aoMapIntensity).toBe(0.32)
    expect(topMaterial.map).toBeNull()
    expect(topMaterial.color.getHexString()).toBe('2f3442')
    expect(topMaterial.roughness).toBe(0.7)
  })

  it('enables parallax node sampling for authored height-map wall sets', () => {
    const textures = createTextures()
    const wallMaterialSet: ContentPackWallMaterialSet = {
      id: 'ai-gothic-depth-wall',
      name: 'AI Gothic Depth Wall',
      textures: {
        albedoUrl: '/wall_albedo.png',
        heightUrl: '/wall_height.png',
      },
      shading: {
        parallaxScale: 0.055,
        parallaxSteps: 10,
        parallaxInvert: true,
      },
    }

    const material = createSplineWallMaterial('dungeon', textures, wallMaterialSet) as THREE.MeshStandardMaterial & {
      colorNode?: unknown
      normalNode?: unknown
      roughnessNode?: unknown
    }

    expect(material.userData.splineWallParallax).toEqual({
      scale: 0.055,
      steps: 10,
      inverted: true,
      edgeFade: false,
      edgePadding: 0,
    })
    expect(material.colorNode).toBeDefined()
    expect(material.normalNode).toBeDefined()
    expect(material.roughnessNode).toBeDefined()
    expect(material.normalMap).toBeNull()
    expect(material.bumpMap).toBeNull()
    expect(material.roughnessMap).toBeNull()
  })

  it('marks clamped vertical wall parallax for edge fade and padding', () => {
    const textures = createTextures()
    const wallMaterialSet: ContentPackWallMaterialSet = {
      id: 'ai-gothic-depth-wall',
      name: 'AI Gothic Depth Wall',
      textures: {
        albedoUrl: '/wall_albedo.png',
        heightUrl: '/wall_height.png',
      },
      shading: {
        parallaxScale: 0.055,
      },
      uv: {
        verticalWrap: 'clamp',
      },
    }

    const material = createSplineWallMaterial('dungeon', textures, wallMaterialSet)

    expect(material.userData.splineWallParallax).toMatchObject({
      edgeFade: true,
      edgePadding: 0.015,
    })
  })

  it('enables true vertex displacement for authored height-map wall sets', () => {
    const textures = createTextures()
    const wallMaterialSet: ContentPackWallMaterialSet = {
      id: 'ai-gothic-depth-wall',
      name: 'AI Gothic Depth Wall',
      textures: {
        albedoUrl: '/wall_albedo.png',
        heightUrl: '/wall_height.png',
        displacementUrl: '/wall_displacement.png',
      },
      shading: {
        displacementScale: 0.12,
        displacementBias: -0.025,
      },
    }

    const material = createSplineWallMaterial('dungeon', textures, wallMaterialSet) as THREE.MeshStandardMaterial & {
      positionNode?: unknown
      castShadowPositionNode?: unknown
    }

    expect(material.userData.splineWallDisplacement).toEqual({
      scale: 0.12,
      bias: -0.025,
    })
    expect(material.positionNode).toBeDefined()
    expect(material.castShadowPositionNode).toBeDefined()
  })

  it('keeps cave walls on an untextured fallback material', () => {
    const textures = createTextures()
    const material = createSplineWallMaterial('cave', textures) as THREE.MeshStandardMaterial

    expect(material.map).toBeNull()
    expect(material.normalMap).toBeNull()
    expect(material.aoMap).toBeNull()
    expect(material.bumpMap).toBeNull()
    expect(material.roughnessMap).toBeNull()
    expect(material.color.getHexString()).toBe('55605b')
  })

  it('falls back to the default authored wall material set', () => {
    expect(resolveActiveSplineWallMaterialSet('missing-wall-set')).toMatchObject({
      id: 'kaykit-stone',
      name: 'KayKit Stone',
    })
  })
})
