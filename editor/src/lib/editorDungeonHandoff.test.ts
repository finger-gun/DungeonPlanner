import { describe, expect, it, vi } from 'vitest'
import {
  copyEditorDungeon,
  consumeEditorDungeonHandoff,
  listEditorDungeons,
  parseEditorDungeonHandoff,
  saveEditorDungeon,
  stripEditorDungeonHandoff,
} from './editorDungeonHandoff'

describe('editor dungeon handoff helpers', () => {
  it('parses a complete handoff from URL search params', () => {
    expect(
      parseEditorDungeonHandoff('?appDungeonId=d1&appEditorToken=t1&appBackendUrl=http%3A%2F%2F127.0.0.1%3A3210'),
    ).toEqual({
      dungeonId: 'd1',
      accessToken: 't1',
      backendUrl: 'http://127.0.0.1:3210',
    })
  })

  it('removes only handoff params from the URL', () => {
    expect(stripEditorDungeonHandoff('?foo=bar&appDungeonId=d1&appEditorToken=t1&appBackendUrl=http%3A%2F%2Fx')).toBe(
      '?foo=bar',
    )
  })

  it('posts the dungeon handoff request to the backend', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ serializedDungeon: '{"version":1,"rooms":[]}' }),
    })

    await consumeEditorDungeonHandoff(
      {
        dungeonId: 'd1',
        accessToken: 't1',
        backendUrl: 'http://127.0.0.1:3210',
      },
      fetchMock as unknown as typeof fetch,
    )

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3210/api/editor/dungeons/open', expect.objectContaining({
      method: 'POST',
    }))
  })

  it('lists and saves dungeons through the editor library endpoints', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{ _id: 'd1', title: 'Keep', description: null, createdAt: 1, updatedAt: 2 }],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ _id: 'd1', title: 'Keep', description: null, createdAt: 1, updatedAt: 2 }),
      })

    await listEditorDungeons(
      { accessToken: 't1', backendUrl: 'http://127.0.0.1:3210' },
      fetchMock as unknown as typeof fetch,
    )
    await saveEditorDungeon(
      { accessToken: 't1', backendUrl: 'http://127.0.0.1:3210' },
      { title: 'Keep', serializedDungeon: '{"version":1,"rooms":[]}' },
      fetchMock as unknown as typeof fetch,
    )

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://127.0.0.1:3210/api/editor/dungeons/list')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('http://127.0.0.1:3210/api/editor/dungeons/save')
  })

  it('copies dungeons through the editor library endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ _id: 'd2', title: 'Keep (Copy)', description: null, createdAt: 1, updatedAt: 2 }),
    })

    await copyEditorDungeon(
      { accessToken: 't1', backendUrl: 'http://127.0.0.1:3210' },
      'd1',
      fetchMock as unknown as typeof fetch,
    )

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3210/api/editor/dungeons/copy', expect.objectContaining({
      method: 'POST',
    }))
  })
})
