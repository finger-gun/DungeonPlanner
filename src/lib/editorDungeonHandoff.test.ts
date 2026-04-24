import { describe, expect, it, vi } from 'vitest'
import {
  buildEditorDungeonConsumeUrl,
  consumeEditorDungeonHandoff,
  parseEditorDungeonHandoff,
  stripEditorDungeonHandoff,
} from './editorDungeonHandoff'

describe('editor dungeon handoff helpers', () => {
  it('parses a complete handoff from URL search params', () => {
    expect(
      parseEditorDungeonHandoff('?appDungeonId=d1&appDungeonToken=t1&appBackendUrl=http%3A%2F%2F127.0.0.1%3A3210'),
    ).toEqual({
      dungeonId: 'd1',
      accessToken: 't1',
      backendUrl: 'http://127.0.0.1:3210',
    })
  })

  it('removes only handoff params from the URL', () => {
    expect(stripEditorDungeonHandoff('?foo=bar&appDungeonId=d1&appDungeonToken=t1&appBackendUrl=http%3A%2F%2Fx')).toBe(
      '?foo=bar',
    )
  })

  it('builds the backend consume URL from the provided backend origin', () => {
    expect(buildEditorDungeonConsumeUrl('http://127.0.0.1:3210')).toBe('http://127.0.0.1:3210/editor-dungeon/consume')
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

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3210/editor-dungeon/consume', expect.objectContaining({
      method: 'POST',
    }))
  })
})
