import { describe, expect, it } from 'vitest'
import {
  collectLocalArtifactPathsFromGltf,
  formatBytes,
  isThumbnailForModel,
} from '../../scripts/model-pipeline.mjs'

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
})
