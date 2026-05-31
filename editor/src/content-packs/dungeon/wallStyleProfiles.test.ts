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
            albedoUrl: expect.stringContaining(
              'generated-keep-granite-with-rugged-bone-white-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/wall_albedo.ktx2',
            ),
            normalUrl: expect.stringContaining(
              'generated-keep-granite-with-rugged-bone-white-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/wall_normal.ktx2',
            ),
            packedOrmHeightUrl: expect.stringContaining(
              'generated-keep-granite-with-rugged-bone-white-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/wall_ormh.ktx2',
            ),
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
              albedoUrl: expect.stringContaining(
                'generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/wall_albedo.ktx2',
              ),
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
