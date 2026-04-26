import { describe, expect, it, vi } from 'vitest'
import { listEditorActors } from './editorActors'

describe('editor actor helpers', () => {
  it('lists actors through the explicit editor API route', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [],
    })

    await listEditorActors(
      { accessToken: 't1', backendUrl: 'http://127.0.0.1:3210' },
      fetchMock as unknown as typeof fetch,
    )

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3210/api/editor/actors/list', expect.objectContaining({
      method: 'POST',
    }))
  })
})
