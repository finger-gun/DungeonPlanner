export const CROSS_ORIGIN_POST_PATHS = [
  '/api/session-access/consume',
  '/api/editor/dungeons/list',
  '/api/editor/dungeons/open',
  '/api/editor/dungeons/save',
  '/api/editor/dungeons/copy',
  '/api/editor/dungeons/delete',
  '/api/editor/actors/list',
] as const

const CORS_ALLOWED_HEADERS = 'Content-Type'
const CORS_ALLOWED_METHODS = 'POST, OPTIONS'
const CORS_ALLOWED_ORIGIN = '*'

export function buildCrossOriginHeaders(headers?: HeadersInit) {
  const next = new Headers(headers)
  next.set('Access-Control-Allow-Origin', CORS_ALLOWED_ORIGIN)
  next.set('Access-Control-Allow-Headers', CORS_ALLOWED_HEADERS)
  next.set('Access-Control-Allow-Methods', CORS_ALLOWED_METHODS)
  return next
}

export function crossOriginJson(body: unknown, init?: ResponseInit) {
  return Response.json(body, {
    ...init,
    headers: buildCrossOriginHeaders(init?.headers),
  })
}

export function crossOriginPreflight() {
  return new Response(null, {
    status: 204,
    headers: buildCrossOriginHeaders(),
  })
}
