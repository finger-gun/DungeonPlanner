import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  fetchBackendAccessToken,
  fetchBackendSession,
  signInWithBackend,
  signOutWithBackend,
  type BackendAuthFlow,
  type BackendAuthSignInRequest,
} from './backendAuthApi'

type BackendAuthContextValue = {
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (provider?: string, args?: FormData | Record<string, unknown>) => Promise<void>
  signOut: () => Promise<void>
  fetchAccessToken: (args: { forceRefreshToken: boolean }) => Promise<string | null>
}

const DEFAULT_BACKEND_ACCESS_TOKEN = {
  forceRefreshToken: false,
} as const

const BackendAuthContext = createContext<BackendAuthContextValue | null>(null)

function readRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${fieldName} is required.`)
  }

  return value
}

function normalizeSignInRequest(provider?: string, args?: FormData | Record<string, unknown>): BackendAuthSignInRequest {
  if (provider && provider !== 'password') {
    throw new Error(`Unsupported auth provider "${provider}".`)
  }

  const params = args instanceof FormData
    ? Object.fromEntries(args.entries())
    : (args ?? {})

  const flow = readRequiredString(params.flow, 'flow')

  if (flow !== 'signIn' && flow !== 'signUp') {
    throw new Error('flow must be "signIn" or "signUp".')
  }

  const request: BackendAuthSignInRequest = {
    provider: 'password',
    params: {
      email: readRequiredString(params.email, 'email'),
      password: readRequiredString(params.password, 'password'),
      flow: flow as BackendAuthFlow,
    },
  }

  if (typeof params.name === 'string' && params.name.trim()) {
    request.params.name = params.name
  }

  return request
}

export function BackendAuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const refreshSession = useCallback(async () => {
    try {
      const session = await fetchBackendSession()
      setIsAuthenticated(session.isAuthenticated)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const signIn = useCallback(async (provider?: string, args?: FormData | Record<string, unknown>) => {
    setIsLoading(true)

    try {
      const result = await signInWithBackend(normalizeSignInRequest(provider, args))
      setIsAuthenticated(result.isAuthenticated)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    setIsLoading(true)

    try {
      const result = await signOutWithBackend()
      setIsAuthenticated(result.isAuthenticated)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchAccessToken = useCallback(async ({ forceRefreshToken }: { forceRefreshToken: boolean }) => {
    const result = await fetchBackendAccessToken({ forceRefreshToken })
    setIsAuthenticated(result.isAuthenticated)
    return result.token
  }, [])

  const value = useMemo<BackendAuthContextValue>(() => ({
    isLoading,
    isAuthenticated,
    signIn,
    signOut,
    fetchAccessToken,
  }), [fetchAccessToken, isAuthenticated, isLoading, signIn, signOut])

  return (
    <BackendAuthContext.Provider value={value}>
      {children}
    </BackendAuthContext.Provider>
  )
}

function useBackendAuthContext() {
  const context = useContext(BackendAuthContext)

  if (!context) {
    throw new Error('BackendAuthProvider is missing from the React tree.')
  }

  return context
}

export function useAuthActions() {
  const { signIn, signOut } = useBackendAuthContext()
  return { signIn, signOut }
}

export function useBackendAuthState() {
  const { isAuthenticated, isLoading } = useBackendAuthContext()
  return { isAuthenticated, isLoading }
}

export function useBackendConvexAuth() {
  const { isLoading, isAuthenticated, fetchAccessToken } = useBackendAuthContext()

  return {
    isLoading,
    isAuthenticated,
    fetchAccessToken: useCallback(
      async ({ forceRefreshToken }: { forceRefreshToken: boolean }) =>
        fetchAccessToken(forceRefreshToken ? { forceRefreshToken: true } : DEFAULT_BACKEND_ACCESS_TOKEN),
      [fetchAccessToken],
    ),
  }
}
