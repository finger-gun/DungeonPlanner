import { describe, expect, it } from 'vitest'
import {
  buildCrossOriginHeaders,
  CROSS_ORIGIN_POST_PATHS,
  crossOriginJson,
  crossOriginPreflight,
} from './crossOriginHttp'

describe('cross-origin HTTP helpers', () => {
  it('adds CORS headers to JSON responses', async () => {
    const response = crossOriginJson(
      { ok: true },
      {
        status: 201,
        headers: {
          'X-Test': 'kept',
        },
      },
    )

    expect(response.status).toBe(201)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(response.headers.get('access-control-allow-methods')).toBe('POST, OPTIONS')
    expect(response.headers.get('access-control-allow-headers')).toBe('Content-Type')
    expect(response.headers.get('x-test')).toBe('kept')
    expect(await response.json()).toEqual({ ok: true })
  })

  it('builds a preflight response for each cross-origin endpoint', () => {
    const response = crossOriginPreflight()

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe('*')
    expect(CROSS_ORIGIN_POST_PATHS).toEqual(expect.arrayContaining([
      '/api/session-access/consume',
      '/api/editor/dungeons/list',
      '/api/editor/dungeons/open',
      '/api/editor/dungeons/save',
      '/api/editor/dungeons/copy',
      '/api/editor/dungeons/delete',
      '/api/editor/actors/list',
    ]))
  })

  it('preserves existing headers when building CORS headers', () => {
    const headers = buildCrossOriginHeaders({
      'Cache-Control': 'no-store',
    })

    expect(headers.get('cache-control')).toBe('no-store')
    expect(headers.get('access-control-allow-origin')).toBe('*')
  })
})
