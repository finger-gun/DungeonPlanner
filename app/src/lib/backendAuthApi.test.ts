import { describe, expect, it, vi } from 'vitest'
import {
  fetchBackendAccessToken,
  fetchBackendSession,
  resolveBackendApiBaseUrl,
  signInWithBackend,
  signOutWithBackend,
} from './backendAuthApi'

describe('backend auth API helpers', () => {
  it('resolves localhost apps to the server backend port', () => {
    expect(resolveBackendApiBaseUrl({
      hostname: 'localhost',
      origin: 'http://localhost:4173',
      protocol: 'http:',
    })).toBe('http://localhost:2567')
  })

  it('keeps deployed apps on the current origin when no backend override is configured', () => {
    expect(resolveBackendApiBaseUrl({
      hostname: 'demo.dungeonplanner.com',
      origin: 'https://demo.dungeonplanner.com',
      protocol: 'https:',
    })).toBe('https://demo.dungeonplanner.com')
  })

  it('posts password sign-in requests through the backend facade with cookies', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ isAuthenticated: true }),
    })

    await signInWithBackend({
      provider: 'password',
      params: {
        email: 'user@example.com',
        password: 'DungeonPlanner123!',
        flow: 'signIn',
      },
    }, fetchMock as unknown as typeof fetch, 'http://localhost:2567')

    expect(fetchMock).toHaveBeenCalledWith('http://localhost:2567/api/auth/sign-in', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
    }))
  })

  it('requests session state, token refreshes, and sign-outs through the backend facade', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isAuthenticated: true }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isAuthenticated: true, token: 'jwt-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ isAuthenticated: false }),
      })

    await fetchBackendSession(fetchMock as unknown as typeof fetch, 'http://localhost:2567')
    await fetchBackendAccessToken(
      { forceRefreshToken: true },
      fetchMock as unknown as typeof fetch,
      'http://localhost:2567',
    )
    await signOutWithBackend(fetchMock as unknown as typeof fetch, 'http://localhost:2567')

    expect(fetchMock.mock.calls[0]?.[0]).toBe('http://localhost:2567/api/auth/session')
    expect(fetchMock.mock.calls[1]?.[0]).toBe('http://localhost:2567/api/auth/token')
    expect(fetchMock.mock.calls[2]?.[0]).toBe('http://localhost:2567/api/auth/sign-out')
  })
})
