import express, { type Express, type Request, type Response } from 'express'
import { ConvexHttpClient } from 'convex/browser'
import { resolveRequestAccessToken } from './authFacade.js'

const DEFAULT_CONVEX_URL = 'http://127.0.0.1:3210'
const DEFAULT_CONVEX_SITE_URL = 'http://127.0.0.1:3211'

function getConvexDeploymentUrl() {
  return (
    process.env.CONVEX_SELF_HOSTED_URL ??
    process.env.NEXT_PUBLIC_CONVEX_URL ??
    process.env.VITE_CONVEX_URL ??
    DEFAULT_CONVEX_URL
  )
}

function getConvexSiteUrl() {
  return process.env.CONVEX_SITE_URL ?? DEFAULT_CONVEX_SITE_URL
}

function createConvexClient(token: string) {
  const client = new ConvexHttpClient(getConvexDeploymentUrl())
  client.setAuth(token)
  return client
}

function sendApiError(response: Response, error: unknown, status = 400) {
  response.status(status).json({
    error: error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Backend request failed.',
  })
}

function normalizeRouteArgs(body: unknown) {
  if (body === undefined || body === null) {
    return {}
  }

  if (typeof body !== 'object' || Array.isArray(body)) {
    throw new Error('Request body must be an object when provided.')
  }

  return body as Record<string, unknown>
}

async function proxyConvexSiteRequest(path: string, body: unknown) {
  const response = await fetch(new URL(path, `${getConvexSiteUrl()}/`), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let errorMessage = 'Backend request failed.'

    try {
      const errorBody = (await response.json()) as { error?: string }
      if (errorBody.error) {
        errorMessage = errorBody.error
      }
    } catch {
      // Keep the fallback when Convex returns non-JSON.
    }

    throw new Error(errorMessage)
  }

  return response.json()
}

async function withAuthenticatedConvexClient(request: Request, response: Response) {
  const token = await resolveRequestAccessToken(request, response)

  if (!token) {
    sendApiError(response, 'Authentication required.', 401)
    return null
  }

  return createConvexClient(token)
}

function shouldRetryWithFreshToken(error: unknown) {
  return error instanceof Error && error.message.includes('UNAUTHENTICATED')
}

type AppFacadeRoute = {
  method: 'get' | 'post'
  path: string
  convexFunction: string
}

const APP_QUERY_ROUTES = [
  { method: 'get', path: '/api/app/viewer-context', convexFunction: 'users:viewerContext' },
  { method: 'get', path: '/api/app/workspace/users', convexFunction: 'roles:listActiveWorkspaceUsers' },
  { method: 'get', path: '/api/app/dungeons', convexFunction: 'dungeons:listViewerDungeons' },
  { method: 'get', path: '/api/app/sessions', convexFunction: 'sessions:listViewerSessions' },
  { method: 'get', path: '/api/app/actor-packs', convexFunction: 'actors:listViewerActorPacks' },
  { method: 'get', path: '/api/app/actors', convexFunction: 'actors:listViewerActors' },
  { method: 'get', path: '/api/app/packs', convexFunction: 'packs:listWorkspacePacks' },
  { method: 'post', path: '/api/app/session-packs', convexFunction: 'packs:listSessionPacks' },
] satisfies AppFacadeRoute[]

const APP_MUTATION_ROUTES = [
  { method: 'post', path: '/api/app/initialize-viewer', convexFunction: 'users:initializeViewer' },
  { method: 'post', path: '/api/app/roles/grant', convexFunction: 'roles:grantRoleByEmail' },
  { method: 'post', path: '/api/app/roles/revoke', convexFunction: 'roles:revokeRoleByEmail' },
  { method: 'post', path: '/api/app/editor-access-token', convexFunction: 'dungeons:issueEditorAccessToken' },
  { method: 'post', path: '/api/app/dungeons/copy', convexFunction: 'dungeons:copyViewerDungeon' },
  { method: 'post', path: '/api/app/dungeons/delete', convexFunction: 'dungeons:deleteViewerDungeon' },
  { method: 'post', path: '/api/app/sessions/create', convexFunction: 'sessions:createSession' },
  { method: 'post', path: '/api/app/sessions/join', convexFunction: 'sessions:joinSessionByCode' },
  { method: 'post', path: '/api/app/sessions/access-ticket', convexFunction: 'sessions:issueServerAccessTicket' },
  { method: 'post', path: '/api/app/packs/save', convexFunction: 'packs:savePackRecord' },
  { method: 'post', path: '/api/app/packs/set-active', convexFunction: 'packs:setPackActive' },
  { method: 'post', path: '/api/app/actor-packs/save', convexFunction: 'actors:saveActorPack' },
  { method: 'post', path: '/api/app/actor-packs/set-active', convexFunction: 'actors:setActorPackActive' },
  { method: 'post', path: '/api/app/actors/save', convexFunction: 'actors:saveActor' },
  { method: 'post', path: '/api/app/actors/delete', convexFunction: 'actors:deleteActor' },
  { method: 'post', path: '/api/app/actors/delete-uploaded-images', convexFunction: 'actors:deleteUploadedActorImages' },
] satisfies AppFacadeRoute[]

const EDITOR_PROXY_ROUTES = [
  { path: '/api/editor/dungeons/list', convexPath: '/api/editor/dungeons/list' },
  { path: '/api/editor/dungeons/open', convexPath: '/api/editor/dungeons/open' },
  { path: '/api/editor/dungeons/save', convexPath: '/api/editor/dungeons/save' },
  { path: '/api/editor/dungeons/copy', convexPath: '/api/editor/dungeons/copy' },
  { path: '/api/editor/dungeons/delete', convexPath: '/api/editor/dungeons/delete' },
  { path: '/api/editor/actors/list', convexPath: '/api/editor/actors/list' },
  { path: '/api/session-access/consume', convexPath: '/api/session-access/consume' },
] as const

async function runAuthenticatedConvexCall(
  request: Request,
  response: Response,
  operation: 'query' | 'mutation',
  convexFunction: string,
  args: Record<string, unknown>,
) {
  const client = await withAuthenticatedConvexClient(request, response)

  if (!client) {
    return
  }

  try {
    const value = operation === 'query'
      ? await client.query(convexFunction as never, args as never)
      : await client.mutation(convexFunction as never, args as never)
    response.json({ value })
  } catch (error) {
    if (shouldRetryWithFreshToken(error)) {
      const token = await resolveRequestAccessToken(request, response, true)

      if (!token) {
        sendApiError(response, 'Authentication required.', 401)
        return
      }

      try {
        const retryClient = createConvexClient(token)
        const value = operation === 'query'
          ? await retryClient.query(convexFunction as never, args as never)
          : await retryClient.mutation(convexFunction as never, args as never)
        response.json({ value })
        return
      } catch (retryError) {
        sendApiError(response, retryError, 400)
        return
      }
    }

    sendApiError(response, error, 400)
  }
}

function registerAuthenticatedConvexRoute(
  app: Express,
  route: AppFacadeRoute,
  operation: 'query' | 'mutation',
) {
  const handler = async (request: Request, response: Response) => {
    let args: Record<string, unknown>

    try {
      args = route.method === 'get' ? {} : normalizeRouteArgs(request.body)
    } catch (error) {
      sendApiError(response, error, 400)
      return
    }

    await runAuthenticatedConvexCall(request, response, operation, route.convexFunction, args)
  }

  if (route.method === 'get') {
    app.get(route.path, handler)
  } else {
    app.post(route.path, handler)
  }
}

function registerConvexSiteProxyRoute(
  app: Express,
  route: (typeof EDITOR_PROXY_ROUTES)[number],
) {
  app.post(route.path, async (request, response) => {
    try {
      response.json(await proxyConvexSiteRequest(route.convexPath, request.body))
    } catch (error) {
      sendApiError(response, error, 400)
    }
  })
}

export function registerAppFacadeRoutes(app: Express) {
  for (const route of APP_QUERY_ROUTES) {
    registerAuthenticatedConvexRoute(app, route, 'query')
  }

  for (const route of APP_MUTATION_ROUTES) {
    registerAuthenticatedConvexRoute(app, route, 'mutation')
  }

  app.post(
    '/api/app/storage/upload',
    express.raw({ type: '*/*', limit: '50mb' }),
    async (request, response) => {
      const client = await withAuthenticatedConvexClient(request, response)

      if (!client) {
        return
      }

      const body = request.body

      if (!(body instanceof Buffer) || body.length === 0) {
        sendApiError(response, 'A file payload is required.', 400)
        return
      }

      try {
        const uploadUrl = await client.mutation('packs:generatePackUploadUrl' as never, {} as never)
        const uploadResponse = await fetch(uploadUrl as string, {
          method: 'POST',
          headers: {
            'Content-Type': request.header('content-type') ?? 'application/octet-stream',
          },
          body,
        })

        if (!uploadResponse.ok) {
          throw new Error('Pack file upload failed.')
        }

        const payload = (await uploadResponse.json()) as { storageId: string }
        response.json(payload)
      } catch (error) {
        sendApiError(response, error, 502)
      }
    },
  )

  for (const route of EDITOR_PROXY_ROUTES) {
    registerConvexSiteProxyRoute(app, route)
  }
}
