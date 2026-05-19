import { describe, expect, it } from 'vitest'
import {
  buildAiWallStyleRecipe,
  buildWallMaterialSetSource,
  buildWallStyleMaterialSource,
  deriveWallTextureNameFromPrompt,
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
})
