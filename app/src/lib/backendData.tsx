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

type BackendDataContextValue = {
  version: number
  invalidate: () => void
}

type QueryArgs = Record<string, unknown> | 'skip'

const BackendDataContext = createContext<BackendDataContextValue | null>(null)

function getBackendBaseUrl() {
  if (typeof window === 'undefined') {
    return 'http://127.0.0.1:2567'
  }

  return resolveBackendApiBaseUrl(window.location, import.meta.env.VITE_BACKEND_URL)
}

async function requestBackendValue<TResponse>(
  path: string,
  body: Record<string, unknown>,
  init: RequestInit = {},
  fetchImpl: typeof fetch = fetch,
) {
  const response = await fetchImpl(new URL(path, `${getBackendBaseUrl()}/`).toString(), {
    credentials: 'include',
    ...init,
    method: init.method ?? 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    body: JSON.stringify(body),
  })

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
  const { version } = useBackendDataContext()
  const [value, setValue] = useState<FunctionReturnType<Query> | undefined>(undefined)
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

  useEffect(() => {
    if (requestArgs === null) {
      setValue(undefined)
      return
    }

    let cancelled = false
    setValue(undefined)

    void requestBackendValue<FunctionReturnType<Query>>('/api/app/query', {
      name: queryName,
      args: requestArgs,
    }).then((result) => {
      if (!cancelled) {
        setValue(result)
      }
    }).catch(() => {
      if (!cancelled) {
        setValue(undefined)
      }
    })

    return () => {
      cancelled = true
    }
  }, [queryName, requestArgs, version])

  return value
}

export function useMutation<Mutation extends FunctionReference<'mutation'>>(mutation: Mutation) {
  const { invalidate } = useBackendDataContext()
  const mutationName = getFunctionName(mutation)

  return useCallback(
    async (args?: Mutation['_args']) => {
      const value = await requestBackendValue<FunctionReturnType<Mutation>>('/api/app/mutation', {
        name: mutationName,
        args: (args ?? {}) as Record<string, unknown>,
      })
      invalidate()
      return value
    },
    [invalidate, mutationName],
  )
}
