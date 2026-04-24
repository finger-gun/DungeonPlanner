/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getFunctionName, type FunctionReference, type FunctionReturnType } from 'convex/server'
import { resolveBackendApiBaseUrl } from './backendAuthApi'
import { useBackendAuthState } from './backendAuth'

type BackendDataContextValue = {
  version: number
  invalidate: () => void
}

type QueryArgs = Record<string, unknown> | 'skip'
type BackendDataRoute = {
  path: string
  method: 'GET' | 'POST'
}

const QUERY_ROUTES: Record<string, BackendDataRoute> = {
  'users:viewerContext': { path: '/api/app/viewer-context', method: 'GET' },
  'roles:listActiveWorkspaceUsers': { path: '/api/app/workspace/users', method: 'GET' },
  'dungeons:listViewerDungeons': { path: '/api/app/dungeons', method: 'GET' },
  'sessions:listViewerSessions': { path: '/api/app/sessions', method: 'GET' },
  'actors:listViewerActorPacks': { path: '/api/app/actor-packs', method: 'GET' },
  'actors:listViewerActors': { path: '/api/app/actors', method: 'GET' },
  'packs:listWorkspacePacks': { path: '/api/app/packs', method: 'GET' },
  'packs:listSessionPacks': { path: '/api/app/session-packs', method: 'POST' },
}

const MUTATION_ROUTES: Record<string, BackendDataRoute> = {
  'users:initializeViewer': { path: '/api/app/initialize-viewer', method: 'POST' },
  'roles:grantRoleByEmail': { path: '/api/app/roles/grant', method: 'POST' },
  'roles:revokeRoleByEmail': { path: '/api/app/roles/revoke', method: 'POST' },
  'dungeons:issueEditorAccessToken': { path: '/api/app/editor-access-token', method: 'POST' },
  'dungeons:copyViewerDungeon': { path: '/api/app/dungeons/copy', method: 'POST' },
  'dungeons:deleteViewerDungeon': { path: '/api/app/dungeons/delete', method: 'POST' },
  'sessions:createSession': { path: '/api/app/sessions/create', method: 'POST' },
  'sessions:joinSessionByCode': { path: '/api/app/sessions/join', method: 'POST' },
  'sessions:issueServerAccessTicket': { path: '/api/app/sessions/access-ticket', method: 'POST' },
  'packs:savePackRecord': { path: '/api/app/packs/save', method: 'POST' },
  'packs:setPackActive': { path: '/api/app/packs/set-active', method: 'POST' },
  'actors:saveActorPack': { path: '/api/app/actor-packs/save', method: 'POST' },
  'actors:setActorPackActive': { path: '/api/app/actor-packs/set-active', method: 'POST' },
  'actors:saveActor': { path: '/api/app/actors/save', method: 'POST' },
  'actors:deleteActor': { path: '/api/app/actors/delete', method: 'POST' },
}

const BackendDataContext = createContext<BackendDataContextValue | null>(null)

function getBackendBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:2567'
  }

  return resolveBackendApiBaseUrl(window.location, import.meta.env.VITE_BACKEND_URL)
}

async function requestBackendValue<TResponse>(
  route: BackendDataRoute,
  body: Record<string, unknown> = {},
  fetchImpl: typeof fetch = fetch,
) {
  const init: RequestInit = {
    credentials: 'include',
    method: route.method,
    headers: {
      'Content-Type': 'application/json',
    },
  }

  if (route.method !== 'GET') {
    init.body = JSON.stringify(body)
  }

  const response = await fetchImpl(new URL(route.path, `${getBackendBaseUrl()}/`).toString(), init)

  if (!response.ok) {
    let message = 'Backend data request failed.'

    try {
      const errorBody = (await response.json()) as { error?: string }
      if (errorBody.error) {
        message = errorBody.error
      }
    } catch {
      // Keep the fallback message.
    }

    throw new Error(message)
  }

  const payload = (await response.json()) as { value: TResponse }
  return payload.value
}

function normalizeFunctionName(functionName: string) {
  return functionName.replace(/\./g, ':')
}

function getBackendRoute(
  kind: 'query' | 'mutation',
  functionName: string,
) {
  const normalizedName = normalizeFunctionName(functionName)
  const route = kind === 'query'
    ? QUERY_ROUTES[normalizedName]
    : MUTATION_ROUTES[normalizedName]

  if (!route) {
    throw new Error(`Unsupported backend ${kind}: ${functionName}. Add an explicit backend API route before using it.`)
  }

  return route
}

export async function uploadFileThroughBackend(
  file: File,
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl(new URL('/api/app/storage/upload', `${getBackendBaseUrl()}/`).toString(), {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
    },
    body: file,
  })

  if (!response.ok) {
    let message = 'Pack file upload failed.'

    try {
      const errorBody = (await response.json()) as { error?: string }
      if (errorBody.error) {
        message = errorBody.error
      }
    } catch {
      // Keep the fallback message.
    }

    throw new Error(message)
  }

  return (await response.json()) as { storageId: string }
}

export function AppBackendProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)

  const invalidate = useCallback(() => {
    setVersion((current) => current + 1)
  }, [])

  const value = useMemo(() => ({ version, invalidate }), [invalidate, version])

  return (
    <BackendDataContext.Provider value={value}>
      {children}
    </BackendDataContext.Provider>
  )
}

function useBackendDataContext() {
  const context = useContext(BackendDataContext)

  if (!context) {
    throw new Error('AppBackendProvider is missing from the React tree.')
  }

  return context
}

export function useQuery<Query extends FunctionReference<'query'>>(
  query: Query,
  args: QueryArgs = {},
): FunctionReturnType<Query> | undefined {
  const { isAuthenticated, isLoading } = useBackendAuthState()
  const { version } = useBackendDataContext()
  const [result, setResult] = useState<{
    requestKey: string
    value: FunctionReturnType<Query>
  } | null>(null)
  const queryName = getFunctionName(query)
  const serializedArgs = args === 'skip' ? 'skip' : JSON.stringify(args)
  const requestArgs = useMemo(
    () => (
      serializedArgs === 'skip'
        ? null
        : JSON.parse(serializedArgs) as Record<string, unknown>
    ),
    [serializedArgs],
  )
  const shouldFetch = requestArgs !== null && !isLoading && isAuthenticated
  const requestKey = `${queryName}:${serializedArgs}:${version}`
  const queryRoute = getBackendRoute('query', queryName)

  useEffect(() => {
    if (!shouldFetch || requestArgs === null) {
      return
    }

    let cancelled = false

    void requestBackendValue<FunctionReturnType<Query>>(queryRoute, requestArgs).then((result) => {
      if (!cancelled) {
        setResult({
          requestKey,
          value: result,
        })
      }
    }).catch(() => {
      if (!cancelled) {
        setResult(null)
      }
    })

    return () => {
      cancelled = true
    }
  }, [queryRoute, requestArgs, requestKey, shouldFetch])

  return shouldFetch && result?.requestKey === requestKey ? result.value : undefined
}

export function useMutation<Mutation extends FunctionReference<'mutation'>>(mutation: Mutation) {
  const { invalidate } = useBackendDataContext()
  const mutationName = getFunctionName(mutation)
  const mutationRoute = getBackendRoute('mutation', mutationName)

  return useCallback(
    async (args?: Mutation['_args']) => {
      const value = await requestBackendValue<FunctionReturnType<Mutation>>(
        mutationRoute,
        (args ?? {}) as Record<string, unknown>,
      )
      invalidate()
      return value
    },
    [invalidate, mutationRoute],
  )
}
