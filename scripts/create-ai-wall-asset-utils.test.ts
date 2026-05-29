import { describe, expect, it } from 'vitest'
import {
  buildAiWallStyleRecipe,
  buildWallMaterialSetSource,
  buildWallStyleMaterialSource,
  createHeightfieldAoMap,
  createPackedOrmHeightMap,
  deriveWallStyleBrowserMetadata,
  deriveWallTextureNameFromFilename,
  deriveWallTextureNameFromPrompt,
  pairTextureDepthFilename,
  parseBooleanFlag,
  slugifyWallAssetId,
} from './create-ai-wall-asset-utils.mjs'

describe('create-ai-wall-asset utilities', () => {
  it('normalizes user-facing names into stable wall asset ids', () => {
    expect(slugifyWallAssetId('  Gothic AI Wall!!  ')).toBe('gothic-ai-wall')
    expect(slugifyWallAssetId('Dungeon_Stone 02')).toBe('dungeon-stone-02')
  })

  it('builds an AI wall style recipe with flat wall faces and hidden structural core', () => {
    const recipe = buildAiWallStyleRecipe({ id: 'gothic-ai-wall', name: 'Gothic AI Wall' })

    expect(recipe.roomFace).toEqual({
      profile: 'ai-gothic-wall-face',
      material: 'gothic-ai-wall',
    })
    expect(recipe.exteriorFace).toEqual({
      profile: 'ai-gothic-wall-face',
      material: 'gothic-ai-wall',
    })
    expect(recipe.structuralCore.render.hiddenProfileSegmentIndices).toEqual([0, 1, 2])
    expect(recipe.inserts).toBeUndefined()
    expect(recipe.previewImagePath).toBe(
      '../../assets/materials/dungeon/wall-materials/gothic-ai-wall/wall_albedo.png',
    )
    expect(recipe.browser).toMatchObject({
      family: 'Gothic AI Wall',
      source: 'built-in',
    })
  })

  it('derives browser metadata from generated wall style names', () => {
    expect(deriveWallStyleBrowserMetadata({
      id: 'generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-moss-green-bevel-edges-00001',
      name: 'Castle Stone With Massive Ashlar Masonry Blocks And Weathered Moss Green Bevel Edges 00001',
    })).toEqual({
      family: 'Castle Stone',
      variant: 'Moss Green',
      colorway: 'Moss Green',
      swatchColor: '#617544',
      tags: ['stone', 'organic', 'ruined'],
      source: 'generated',
    })
  })

  it('emits generated material sources with shader parallax settings', () => {
    const materialSetSource = buildWallMaterialSetSource({
      id: 'gothic-ai-wall',
      name: 'Gothic AI Wall',
      parallaxScale: 0.04,
      parallaxSteps: 12,
      parallaxInvert: true,
    })
    const wallStyleMaterialSource = buildWallStyleMaterialSource({
      id: 'gothic-ai-wall',
      parallaxScale: 0.04,
      parallaxSteps: 12,
      parallaxInvert: true,
    })

    expect(materialSetSource).toContain('parallaxScale: 0.04')
    expect(materialSetSource).toContain('parallaxSteps: 12')
    expect(materialSetSource).toContain('parallaxInvert: true')
    expect(materialSetSource).toContain(
      '../../../../assets/materials/dungeon/wall-materials/gothic-ai-wall/wall_albedo.png',
    )
    expect(wallStyleMaterialSource).toContain("import type { GeneratedWallStyleMaterialDefinition }")
    expect(wallStyleMaterialSource).toContain(
      '../../assets/materials/dungeon/wall-materials/gothic-ai-wall/wall_height.png',
    )
  })

  it('emits compressed generated material sources with packed ORMH maps', () => {
    const materialSetSource = buildWallMaterialSetSource({
      id: 'gothic-ai-wall',
      name: 'Gothic AI Wall',
      textureFormat: 'ktx2',
    })
    const wallStyleMaterialSource = buildWallStyleMaterialSource({
      id: 'gothic-ai-wall',
      textureFormat: 'ktx2',
    })

    expect(materialSetSource).toContain('preview.webp')
    expect(materialSetSource).toContain('wall_albedo.ktx2')
    expect(materialSetSource).toContain('wall_normal.ktx2')
    expect(materialSetSource).toContain('packedOrmHeightUrl')
    expect(materialSetSource).toContain('wall_ormh.ktx2')
    expect(materialSetSource).toContain('flipV: true')
    expect(materialSetSource).not.toContain('wall_height.png')
    expect(wallStyleMaterialSource).toContain('packedOrmHeightPath')
    expect(wallStyleMaterialSource).toContain('wall_ormh.ktx2')
    expect(wallStyleMaterialSource).toContain('flipV: true')
  })

  it('parses boolean flags used by the cli', () => {
    expect(parseBooleanFlag(undefined, true)).toBe(true)
    expect(parseBooleanFlag('true')).toBe(true)
    expect(parseBooleanFlag('0')).toBe(false)
    expect(() => parseBooleanFlag('maybe')).toThrow('Expected a boolean value')
  })

  it('derives compact wall names from generation prompts', () => {
    expect(
      deriveWallTextureNameFromPrompt(
        'a texture for 3d asset, fantasy medieval tavern building wall, white plaster walls with wooden beam in center, the texture fills the image from top to bottom, no background, style is low poly cartoon, seen from straight ahead, orthographic, flat unlit lighting',
      ),
    ).toBe('Medieval Tavern White Plaster Wooden Beam')
    expect(
      deriveWallTextureNameFromPrompt(
        'seamless texture map of a damp dungeon wall, rough stone blocks, no background, seen from straight ahead, orthographic',
      ),
    ).toBe('Damp Dungeon Rough Stone Blocks')
    expect(
      deriveWallTextureNameFromPrompt(
        'seamless 2D texture map of flat volcanic wall, black basalt blocks, lava cracks, no background',
      ),
    ).toBe('Volcanic Black Basalt Blocks Lava Cracks')
  })

  it('derives compact wall names from tokenized generated filenames', () => {
    expect(
      deriveWallTextureNameFromFilename(
        'Abyssal Coral with calcified tube-worm ridges and porous Bone White barnacle texture clusters-main_00001_.png',
        '-main_',
      ),
    ).toBe('Abyssal Coral With Calcified Tube Worm Ridges And Porous Bone White Barnacle Texture Clusters')
  })

  it('pairs tokenized texture and depth filenames', () => {
    expect(
      pairTextureDepthFilename(
        'Abyssal Coral with calcified tube-worm ridges-main_00001_.png',
        {
          textureToken: '-main_',
          depthToken: '-depth_',
        },
      ),
    ).toBe('Abyssal Coral with calcified tube-worm ridges-depth_00001_.png')
  })

  it('keeps flat height fields fully unoccluded', () => {
    const heightData = Buffer.alloc(25, 128)
    const ao = createHeightfieldAoMap(heightData, 5, 5)

    expect([...ao]).toEqual(Array.from({ length: 25 }, () => 255))
  })

  it('packs AO, roughness, and height into RGB channels', () => {
    const packed = createPackedOrmHeightMap({
      aoData: Buffer.from([1, 2]),
      roughnessData: Buffer.from([10, 20]),
      heightData: Buffer.from([100, 200]),
      width: 2,
      height: 1,
    })

    expect([...packed]).toEqual([1, 10, 100, 2, 20, 200])
  })

  it('darkens recessed texels surrounded by higher height values', () => {
    const heightData = Buffer.alloc(25, 220)
    heightData[12] = 24

    const ao = createHeightfieldAoMap(heightData, 5, 5, {
      directions: 8,
      radii: [1, 2],
      strength: 4,
    })

    expect(ao[12]).toBeLessThan(ao[0])
    expect(ao[12]).toBeLessThan(180)
  })

  it('leaves raised texels brighter than nearby cavities', () => {
    const heightData = Buffer.alloc(25, 40)
    heightData[12] = 240

    const ao = createHeightfieldAoMap(heightData, 5, 5, {
      directions: 8,
      radii: [1, 2],
      strength: 4,
    })

    expect(ao[12]).toBeGreaterThan(240)
    expect(ao[7]).toBeLessThan(ao[12])
  })

  it('samples across horizontal texture seams by default', () => {
    const heightData = Buffer.from([
      40, 40, 40, 40, 240,
      40, 40, 40, 40, 240,
      40, 40, 40, 40, 240,
      40, 40, 40, 40, 240,
      40, 40, 40, 40, 240,
    ])

    const wrappedAo = createHeightfieldAoMap(heightData, 5, 5, {
      directions: 8,
      radii: [1],
      strength: 2,
    })
    const clampedAo = createHeightfieldAoMap(heightData, 5, 5, {
      directions: 8,
      radii: [1],
      strength: 2,
      wrapX: false,
    })

    expect(wrappedAo[0]).toBeLessThan(clampedAo[0])
  })
})
