import { describe, expect, it } from 'vitest'
import {
  collectLocalArtifactPathsFromGltf,
  formatBytes,
  getModelPackConfig,
  getPreservedArtifactPaths,
  resolvePackSourceDir,
  isThumbnailForModel,
} from '../../scripts/model-pipeline.mjs'
import { createTiledStripTexture, makeTextureTileable } from '../../scripts/import-models.mjs'

describe('model pipeline utilities', () => {
  it('collects local gltf sidecar artifacts and ignores external URIs', () => {
    expect(
      collectLocalArtifactPathsFromGltf(
        {
          buffers: [
            { uri: 'tree.bin' },
            { uri: 'https://example.com/remote.bin' },
          ],
          images: [
            { uri: 'tree.ktx2' },
            { uri: 'data:image/png;base64,abc' },
          ],
        },
        '/packs/core',
        '/packs/core/tree.gltf',
      ),
    ).toEqual([
      '/packs/core/tree.bin',
      '/packs/core/tree.gltf',
      '/packs/core/tree.ktx2',
    ])
  })

  it('keeps thumbnail pngs separate from stale texture cleanup', () => {
    const modelBaseNames = new Set([
      '/packs/core/torch',
      '/packs/core/wall',
    ])

    expect(isThumbnailForModel('/packs/core/torch.png', modelBaseNames)).toBe(true)
    expect(isThumbnailForModel('/packs/core/torch.ktx2', modelBaseNames)).toBe(false)
    expect(isThumbnailForModel('/packs/core/shared-color.png', modelBaseNames)).toBe(false)
  })

  it('formats byte sizes for reporting', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(2048)).toBe('2.0 KB')
    expect(formatBytes(3 * 1024 ** 2)).toBe('3.00 MB')
  })

  it('resolves configured pack source directories from env or repo paths', () => {
    expect(resolvePackSourceDir('kaykit')).toContain(
      'forrest-assets-tmp/KayKit_Forest_Nature_Pack_1.0_EXTRA/Assets/gltf',
    )

    expect(
      resolvePackSourceDir('core', null, {
        DUNGEONPLANNER_CORE_SOURCE_DIR: '/tmp/core-models',
      }),
    ).toBe('/tmp/core-models')
  })

  it('preserves generated KayKit grass patch artifacts', () => {
    expect([...getPreservedArtifactPaths('/packs/kaykit')]).toEqual([])
    expect(
      [...getPreservedArtifactPaths('src/assets/models/forrest')].some((filePath) =>
        filePath.endsWith('/src/assets/models/forrest/Color1/forest_grass_patch.png'),
      ),
    ).toBe(true)
  })

  it('builds the KayKit grass patch from the optimized atlas output', () => {
    expect(getModelPackConfig('kaykit')?.derivedTextures).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'Color1/forest_texture.png',
          output: 'Color1/forest_grass_patch.png',
          phase: 'pre-optimize',
          sampleMode: 'strip',
          sampleBandHeightPx: 4,
          outputSize: 32,
        }),
        expect.objectContaining({
          source: 'Color8/forest_texture.png',
          output: 'Color8/forest_grass_patch.png',
          phase: 'pre-optimize',
        }),
      ]),
    )
  })

  it('builds square grass textures from the sampled hill-top strip', () => {
    const strip = new Uint8ClampedArray([
      10, 20, 30, 255,
      30, 40, 50, 255,
      50, 60, 70, 255,

      14, 24, 34, 255,
      34, 44, 54, 255,
      54, 64, 74, 255,
    ])

    const tiled = createTiledStripTexture(strip, 3, 2, 4, 6, 2)

    expect([...tiled.slice(0, 4)]).toEqual([12, 22, 32, 255])
    expect([...tiled.slice(4, 8)]).toEqual([12, 22, 32, 255])
    expect([...tiled.slice(8, 12)]).toEqual([32, 42, 52, 255])
    expect([...tiled.slice((6 * 4), (6 * 4) + 4)]).toEqual([12, 22, 32, 255])
  })

  it('feathers derived texture edges toward a wrapped copy for seamless tiling', () => {
    const data = new Uint8ClampedArray([
      0, 0, 0, 255,
      10, 0, 0, 255,
      20, 0, 0, 255,
      30, 0, 0, 255,

      40, 0, 0, 255,
      50, 0, 0, 255,
      60, 0, 0, 255,
      70, 0, 0, 255,

      80, 0, 0, 255,
      90, 0, 0, 255,
      100, 0, 0, 255,
      110, 0, 0, 255,

      120, 0, 0, 255,
      130, 0, 0, 255,
      140, 0, 0, 255,
      150, 0, 0, 255,
    ])

    const tiled = makeTextureTileable(data, 4, 4, 4, 1)

    expect([...tiled.slice(0, 4)]).toEqual([100, 0, 0, 255])
    expect([...tiled.slice((3 * 4) * 4, ((3 * 4) * 4) + 4)]).toEqual([60, 0, 0, 255])
    expect([...tiled.slice(((1 * 4) + 1) * 4, (((1 * 4) + 1) * 4) + 4)]).toEqual([50, 0, 0, 255])
  })
})
