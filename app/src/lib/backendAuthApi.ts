export type BackendAuthFlow = 'signIn' | 'signUp'

export type BackendAuthSignInRequest = {
  provider: 'password'
  params: {
    email: string
    password: string
    flow: BackendAuthFlow
    name?: string
  }
}

export type BackendAuthSessionResponse = {
  isAuthenticated: boolean
}

export type BackendAuthTokenRequest = {
  forceRefreshToken: boolean
}

export type BackendAuthTokenResponse = BackendAuthSessionResponse & {
  token: string | null
}

type BrowserLocationLike = Pick<Location, 'hostname' | 'origin' | 'protocol'>

const DEFAULT_BACKEND_PORT = '2567'

export function resolveBackendApiBaseUrl(
  browserLocation: BrowserLocationLike,
  configuredBackendUrl?: string,
) {
  if (configuredBackendUrl) {
    return configuredBackendUrl.replace(/\/+$/, '')
  }

  if (browserLocation.hostname === 'localhost' || browserLocation.hostname === '127.0.0.1') {
    return `${browserLocation.protocol}//${browserLocation.hostname}:${DEFAULT_BACKEND_PORT}`
  }

  return browserLocation.origin
}

function getDefaultBackendApiBaseUrl() {
  if (typeof window === 'undefined') {
    return `http://127.0.0.1:${DEFAULT_BACKEND_PORT}`
  }

  return resolveBackendApiBaseUrl(window.location, import.meta.env.VITE_BACKEND_URL)
}

function buildBackendApiUrl(baseUrl: string, path: string) {
  return new URL(path, `${baseUrl}/`).toString()
}

async function requestBackendJson<TResponse>(
  path: string,
  init: RequestInit,
  fetchImpl: typeof fetch = fetch,
  baseUrl = getDefaultBackendApiBaseUrl(),
) {
  const response = await fetchImpl(buildBackendApiUrl(baseUrl, path), {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  })

  if (!response.ok) {
    let message = 'Backend auth request failed.'

    try {
      const errorBody = (await response.json()) as { error?: string }
      if (errorBody.error) {
        message = errorBody.error
      }
    } catch {
      // Keep the fallback message when the backend response is not JSON.
    }

    throw new Error(message)
  }

  return (await response.json()) as TResponse
}

export async function fetchBackendSession(
  fetchImpl: typeof fetch = fetch,
  baseUrl = getDefaultBackendApiBaseUrl(),
) {
  return requestBackendJson<BackendAuthSessionResponse>(
    '/api/auth/session',
    {
      method: 'GET',
    },
    fetchImpl,
    baseUrl,
  )
}

export async function signInWithBackend(
  request: BackendAuthSignInRequest,
  fetchImpl: typeof fetch = fetch,
  baseUrl = getDefaultBackendApiBaseUrl(),
) {
  return requestBackendJson<BackendAuthSessionResponse>(
    '/api/auth/sign-in',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    fetchImpl,
    baseUrl,
  )
}

export async function signOutWithBackend(
  fetchImpl: typeof fetch = fetch,
  baseUrl = getDefaultBackendApiBaseUrl(),
) {
  return requestBackendJson<BackendAuthSessionResponse>(
    '/api/auth/sign-out',
    {
      method: 'POST',
      body: JSON.stringify({}),
    },
    fetchImpl,
    baseUrl,
  )
}

export async function fetchBackendAccessToken(
  request: BackendAuthTokenRequest,
  fetchImpl: typeof fetch = fetch,
  baseUrl = getDefaultBackendApiBaseUrl(),
) {
  return requestBackendJson<BackendAuthTokenResponse>(
    '/api/auth/token',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    fetchImpl,
    baseUrl,
  )
}
