import { describe, expect, it } from 'vitest'
import { createWallStyleFromRecipe, type WallStyleRecipe } from './wallStyleProfiles'

describe('wallStyleProfiles', () => {
  it('builds content-pack wall styles from procedural recipes', () => {
    const recipe: WallStyleRecipe = {
      id: 'test-style',
      name: 'Test Style',
      structuralCore: {
        profile: 'thick-stone-core',
        material: 'keep-core-blue',
      },
      roomFace: {
        profile: 'sloped-stone-room-face',
        material: 'keep-room-stone',
      },
      roomFaceDetails: [
        {
          profile: 'wainscot-room-base',
          material: 'tavern-wood-base',
        },
      ],
      exteriorFace: {
        profile: 'sloped-stone-exterior-face',
        material: 'wedged-cobblestone-exterior',
      },
      inserts: [
        {
          assetId: 'dungeon.props_pillars_pillar',
          anchors: ['interval'],
          interval: 3,
        },
      ],
    }

    const wallStyle = createWallStyleFromRecipe(recipe)

    expect(wallStyle).toMatchObject({
      id: 'test-style',
      name: 'Test Style',
      structuralCore: {
        profile: {
          points: [
            [-0.22, 0],
            [-0.22, 1],
            [0.22, 1],
            [0.22, 0],
          ],
        },
        material: {
          textures: {
            albedoUrl: expect.stringContaining('kaykit-stone/wall_albedo.png'),
          },
          shading: {
            tintColor: '#d7dde8',
            topSurfaceColor: '#2f3442',
          },
        },
      },
      roomFaceDetails: [
        {
          material: {
            textures: {
              albedoUrl: expect.stringContaining('tavern-wood-planks1_albedo.png'),
            },
          },
        },
      ],
      inserts: [
        {
          assetId: 'dungeon.props_pillars_pillar',
          anchors: ['interval'],
          interval: 3,
        },
      ],
    })
  })
})
