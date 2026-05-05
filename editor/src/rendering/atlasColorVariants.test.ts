import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import {
  applyAtlasColorVariantToObject,
  hasAtlasColorVariants,
  resolveAtlasColorVariant,
} from './atlasColorVariants'

describe('atlasColorVariants', () => {
  it('resolves an opted-in atlas variant from object props', () => {
    const resolved = resolveAtlasColorVariant({
      atlasColorVariants: {
        propKey: 'bannerColor',
        variants: [
          { id: 'red', label: 'Red', uvOffset: [0, 0], uvScale: [0.5, 1] },
          { id: 'blue', label: 'Blue', uvOffset: [0.5, 0], uvScale: [0.5, 1] },
        ],
      },
    }, { bannerColor: 'blue' })

    expect(resolved).toMatchObject({
      id: 'blue',
      label: 'Blue',
      propKey: 'bannerColor',
      uvOffset: [0.5, 0],
      uvScale: [0.5, 1],
    })
  })

  it('reports whether metadata exposes atlas color variants', () => {
    expect(hasAtlasColorVariants({
      atlasColorVariants: {
        propKey: 'bannerColor',
        variants: [{ id: 'red', label: 'Red', uvOffset: [0, 0] }],
      },
    })).toBe(true)
    expect(hasAtlasColorVariants({})).toBe(false)
  })

  it('clones the base color texture and applies offset/repeat to matching materials', () => {
    const baseTexture = new THREE.Texture()
    const material = new THREE.MeshStandardMaterial({ map: baseTexture })
    material.name = 'BannerCloth'
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
    const root = new THREE.Group()
    root.add(mesh)

    applyAtlasColorVariantToObject(root, {
      id: 'blue',
      label: 'Blue',
      propKey: 'bannerColor',
      materialNames: ['BannerCloth'],
      uvOffset: [0.5, 0.25],
      uvScale: [0.25, 0.5],
    })

    expect(material.map).not.toBe(baseTexture)
    expect(material.map?.offset.toArray()).toEqual([0.5, 0.25])
    expect(material.map?.repeat.toArray()).toEqual([0.25, 0.5])
  })

  it('restores the original texture when the variant is cleared', () => {
    const baseTexture = new THREE.Texture()
    const material = new THREE.MeshStandardMaterial({ map: baseTexture })
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material)
    const root = new THREE.Group()
    root.add(mesh)

    applyAtlasColorVariantToObject(root, {
      id: 'green',
      label: 'Green',
      propKey: 'bannerColor',
      uvOffset: [0.25, 0],
      uvScale: [0.25, 1],
    })
    expect(material.map).not.toBe(baseTexture)

    applyAtlasColorVariantToObject(root, null)

    expect(material.map).toBe(baseTexture)
  })
})
