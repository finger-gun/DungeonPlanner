import { describe, expect, it, vi } from 'vitest'
import { loadGeneratedCharacterPackRecords } from './packLoader'

describe('loadGeneratedCharacterPackRecords', () => {
  it('returns no records when the discovery index is missing', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response(null, { status: 404 }))

    await expect(loadGeneratedCharacterPackRecords({
      fetchImpl,
      indexUrl: 'http://example.test/generated-character-packs/index.json',
    })).resolves.toEqual([])
  })

  it('loads manifested character packs into generated character records', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        schemaVersion: 1,
        manifests: ['./zombie-monsters/manifest.json'],
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        schemaVersion: 1,
        type: 'generated-character-pack',
        packId: 'zombie-monsters',
        name: 'Zombie Monsters',
        description: 'Five shambling undead NPCs.',
        scope: 'workspace',
        tags: ['undead', 'zombies'],
        generatedAt: '2026-01-01T00:00:00.000Z',
        characters: [
          {
            id: 'fresh-grave-riser',
            name: 'Fresh Grave Riser',
            prompt: 'undead zombie',
            kind: 'npc',
            size: 'M',
            model: 'disty/z-image',
            originalImagePath: './assets/fresh-grave-riser-main.png',
            portraitImagePath: './assets/fresh-grave-riser-portrait.png',
            processedImagePath: './assets/fresh-grave-riser-processed.png',
            alphaMaskPath: './assets/fresh-grave-riser-alpha-mask.png',
            thumbnailPath: './assets/fresh-grave-riser-thumbnail.png',
            width: 412,
            height: 721,
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:01.000Z',
          },
        ],
      })))

    const records = await loadGeneratedCharacterPackRecords({
      fetchImpl,
      indexUrl: 'http://example.test/generated-character-packs/index.json',
    })

    expect(records).toEqual([
      expect.objectContaining({
        assetId: 'generated.npc.zombie-monsters.fresh-grave-riser',
        name: 'Fresh Grave Riser',
        kind: 'npc',
        packId: 'zombie-monsters',
        packName: 'Zombie Monsters',
        packDescription: 'Five shambling undead NPCs.',
        packScope: 'workspace',
        originalImageUrl: 'http://example.test/generated-character-packs/zombie-monsters/assets/fresh-grave-riser-main.png',
        processedImageUrl: 'http://example.test/generated-character-packs/zombie-monsters/assets/fresh-grave-riser-processed.png',
        alphaMaskUrl: 'http://example.test/generated-character-packs/zombie-monsters/assets/fresh-grave-riser-alpha-mask.png',
        thumbnailUrl: 'http://example.test/generated-character-packs/zombie-monsters/assets/fresh-grave-riser-thumbnail.png',
        width: 412,
        height: 721,
      }),
    ])
  })

  it('merges multiple discovery indexes and prefers the later duplicate record', async () => {
    const fetchImpl = vi.fn(async (input: string | URL | Request) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url

      if (url === 'http://editor.example.test/generated-character-packs/index.json') {
        return new Response(JSON.stringify({
          schemaVersion: 1,
          manifests: ['./zombie-monsters/manifest.json'],
        }))
      }

      if (url === 'http://editor.example.test/generated-character-packs/zombie-monsters/manifest.json') {
        return new Response(JSON.stringify({
          schemaVersion: 1,
          type: 'generated-character-pack',
          packId: 'zombie-monsters',
          name: 'Zombie Monsters',
          description: 'Local pack copy.',
          scope: 'workspace',
          tags: ['undead'],
          generatedAt: '2026-01-01T00:00:00.000Z',
          characters: [
            {
              id: 'fresh-grave-riser',
              name: 'Fresh Grave Riser',
              prompt: 'local prompt',
              kind: 'npc',
              size: 'M',
              model: 'disty/z-image',
              originalImagePath: null,
              portraitImagePath: null,
              processedImagePath: './assets/local.png',
              alphaMaskPath: null,
              thumbnailPath: './assets/local-thumb.png',
              width: 412,
              height: 721,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:01.000Z',
            },
          ],
        }))
      }

      if (url === 'http://backend.example.test/generated-character-packs/index.json') {
        return new Response(JSON.stringify({
          schemaVersion: 1,
          manifests: ['./zombie-monsters/manifest.json'],
        }))
      }

      if (url === 'http://backend.example.test/generated-character-packs/zombie-monsters/manifest.json') {
        return new Response(JSON.stringify({
          schemaVersion: 1,
          type: 'generated-character-pack',
          packId: 'zombie-monsters',
          name: 'Zombie Monsters',
          description: 'Backend-served pack copy.',
          scope: 'workspace',
          tags: ['undead'],
          generatedAt: '2026-01-01T00:00:00.000Z',
          characters: [
            {
              id: 'fresh-grave-riser',
              name: 'Fresh Grave Riser',
              prompt: 'remote prompt',
              kind: 'npc',
              size: 'M',
              model: 'disty/z-image',
              originalImagePath: null,
              portraitImagePath: null,
              processedImagePath: './assets/remote.png',
              alphaMaskPath: null,
              thumbnailPath: './assets/remote-thumb.png',
              width: 412,
              height: 721,
              createdAt: '2026-01-01T00:00:00.000Z',
              updatedAt: '2026-01-01T00:00:02.000Z',
            },
          ],
        }))
      }

      throw new Error(`Unexpected fetch URL: ${url}`)
    })

    const records = await loadGeneratedCharacterPackRecords({
      fetchImpl,
      indexUrls: [
        'http://editor.example.test/generated-character-packs/index.json',
        'http://backend.example.test/generated-character-packs/index.json',
      ],
    })

    expect(records).toHaveLength(1)
    expect(records[0]).toEqual(expect.objectContaining({
      assetId: 'generated.npc.zombie-monsters.fresh-grave-riser',
      prompt: 'remote prompt',
      packDescription: 'Backend-served pack copy.',
      processedImageUrl: 'http://backend.example.test/generated-character-packs/zombie-monsters/assets/remote.png',
      thumbnailUrl: 'http://backend.example.test/generated-character-packs/zombie-monsters/assets/remote-thumb.png',
    }))
  })
})
