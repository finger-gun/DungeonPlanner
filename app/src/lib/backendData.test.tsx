import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AppBackendProvider, useMutation, useQuery } from './backendData'

const authState = vi.hoisted(() => ({
  isLoading: true,
  isAuthenticated: false,
}))

vi.mock('convex/server', () => ({
  getFunctionName: (query: string) => query,
}))

vi.mock('./backendAuth', () => ({
  useBackendAuthState: () => authState,
}))

function QueryProbe() {
  const value = useQuery('users.viewerContext' as never, {})
  return <output>{value ? JSON.stringify(value) : 'empty'}</output>
}

function MutationProbe() {
  const initializeViewer = useMutation('users.initializeViewer' as never)

  return (
    <button
      type="button"
      onClick={() => {
        void initializeViewer()
      }}
    >
      Initialize
    </button>
  )
}

function DeleteUploadedActorImagesProbe() {
  const deleteUploadedActorImages = useMutation('actors.deleteUploadedActorImages' as never)

  return (
    <button
      type="button"
      onClick={() => {
        void deleteUploadedActorImages({ storageIds: ['storage-1', 'storage-2'] } as never)
      }}
    >
      Delete uploaded images
    </button>
  )
}

describe('useQuery', () => {
  const fetchMock = vi.fn<typeof fetch>()

  beforeEach(() => {
    authState.isLoading = true
    authState.isAuthenticated = false
    fetchMock.mockReset()
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ value: { viewer: { name: 'Tester' } } }),
    } as Response)
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('waits for auth restoration before fetching authenticated queries', async () => {
    const { rerender } = render(
      <AppBackendProvider>
        <QueryProbe />
      </AppBackendProvider>,
    )

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByText('empty')).toBeTruthy()

    authState.isLoading = false
    authState.isAuthenticated = true

    rerender(
      <AppBackendProvider>
        <QueryProbe />
      </AppBackendProvider>,
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:2567/api/app/viewer-context', expect.objectContaining({
      credentials: 'include',
      method: 'GET',
    }))
    expect(fetchMock.mock.calls[0]?.[1]).not.toHaveProperty('body')
    await waitFor(() => expect(screen.getByText('{"viewer":{"name":"Tester"}}')).toBeTruthy())
  })

  it('clears query state when auth becomes unauthenticated', async () => {
    const { rerender } = render(
      <AppBackendProvider>
        <QueryProbe />
      </AppBackendProvider>,
    )

    authState.isLoading = false
    authState.isAuthenticated = true

    rerender(
      <AppBackendProvider>
        <QueryProbe />
      </AppBackendProvider>,
    )

    await waitFor(() => expect(screen.getByText('{"viewer":{"name":"Tester"}}')).toBeTruthy())

    authState.isAuthenticated = false

    rerender(
      <AppBackendProvider>
        <QueryProbe />
      </AppBackendProvider>,
    )

    await waitFor(() => expect(screen.getByText('empty')).toBeTruthy())
  })

  it('routes mutations through explicit backend endpoints', async () => {
    authState.isLoading = false
    authState.isAuthenticated = true
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: { workspaceId: 'w1' } }),
    } as Response)

    render(
      <AppBackendProvider>
        <MutationProbe />
      </AppBackendProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Initialize' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:2567/api/app/initialize-viewer', expect.objectContaining({
      body: '{}',
      credentials: 'include',
      method: 'POST',
    }))
  })

  it('routes actor image cleanup through the backend facade', async () => {
    authState.isLoading = false
    authState.isAuthenticated = true
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: { deletedCount: 2 } }),
    } as Response)

    render(
      <AppBackendProvider>
        <DeleteUploadedActorImagesProbe />
      </AppBackendProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Delete uploaded images' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:2567/api/app/actors/delete-uploaded-images', expect.objectContaining({
      body: JSON.stringify({ storageIds: ['storage-1', 'storage-2'] }),
      credentials: 'include',
      method: 'POST',
    }))
  })
})
