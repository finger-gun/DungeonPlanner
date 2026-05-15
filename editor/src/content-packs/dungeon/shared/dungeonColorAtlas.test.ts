import { describe, expect, it } from 'vitest'
import { getAtlasCellKey } from '../../shared/atlasColorVariants'
import { buildDungeonColorVariants, createGenericColorSwatch } from './dungeonColorAtlas'

describe('dungeonColorAtlas', () => {
  it('builds dungeon swatches with named cells and dungeon palette colors', () => {
    const variants = buildDungeonColorVariants({
      excludedCells: [[1, 0]],
      namedVariantsByCell: {
        [getAtlasCellKey([6, 2])]: { id: 'blue', label: 'Blue' },
      },
    })

    expect(variants).toHaveLength(31)
    expect(variants.find((variant) => variant.id === 'blue')).toMatchObject({
      label: 'Blue',
      swatchColor: '#63a0d0',
      cell: [6, 2],
    })
  })

  it('creates a dungeon prop asset with atlas color metadata', () => {
    const variants = buildDungeonColorVariants({
      namedVariantsByCell: {
        [getAtlasCellKey([6, 2])]: { id: 'blue', label: 'Blue' },
      },
    })

    const asset = createGenericColorSwatch({
      id: 'test.banner',
      slug: 'test-banner',
      name: 'Test Banner',
      modelName: 'banner_blue',
      sourceCells: [[6, 2]],
      variants,
      defaultVariantId: 'blue',
      metadata: {
        snapsTo: 'GRID',
      },
      getLight: () => ({
        color: '#ffffff',
        intensity: 1,
        distance: 3,
      }),
      getEffect: () => ({
        preset: 'fire',
        emitters: [{ offset: [0, 0, 0], scale: 1, intensity: 1 }],
      }),
      getPlayModeNextProps: () => ({ lit: true }),
    })

    expect(asset.metadata?.atlasColorVariants).toMatchObject({
      propKey: 'colorVariant',
      defaultVariantId: 'blue',
      variants,
    })
    expect(asset.getLight?.({})).toMatchObject({
      color: '#ffffff',
      intensity: 1,
      distance: 3,
    })
    expect(asset.getEffect?.({})).toMatchObject({
      preset: 'fire',
    })
    expect(asset.getPlayModeNextProps?.({})).toEqual({ lit: true })
  })
})
