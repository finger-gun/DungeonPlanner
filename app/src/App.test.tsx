import type { ReactNode } from 'react'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const mock = vi.hoisted(() => ({
  authState: {
    isLoading: false,
    isAuthenticated: false,
  },
  viewerIdentity: {
    viewer: { name: 'Test User', email: 'user@example.com' },
    workspace: { name: 'Test Workspace' },
    roles: ['player'],
    access: {
      isAdmin: false,
      canManageUsers: false,
      canManagePacks: false,
      canManageDungeons: false,
      canManageSessions: false,
      canUseCharacterLibrary: false,
    },
  },
  queries: {} as Record<string, unknown>,
  signIn: vi.fn(),
  signOut: vi.fn(),
  mutations: {
    'roles.grantRoleByEmail': vi.fn(),
    'roles.revokeRoleByEmail': vi.fn(),
    'dungeons.saveDungeon': vi.fn(),
    'sessions.createSession': vi.fn(),
    'sessions.joinSessionByCode': vi.fn(),
    'sessions.issueServerAccessTicket': vi.fn(),
    'characters.saveCharacter': vi.fn(),
    'characters.deleteCharacter': vi.fn(),
    'sessions.attachCharacterToSession': vi.fn(),
    'packs.generatePackUploadUrl': vi.fn(),
    'packs.savePackRecord': vi.fn(),
    'packs.setPackActive': vi.fn(),
  } as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('@convex-dev/auth/react', () => ({
  useAuthActions: () => ({
    signIn: mock.signIn,
    signOut: mock.signOut,
  }),
}))

vi.mock('../convex/_generated/api', () => ({
  api: {
    roles: {
      listActiveWorkspaceUsers: 'roles.listActiveWorkspaceUsers',
      grantRoleByEmail: 'roles.grantRoleByEmail',
      revokeRoleByEmail: 'roles.revokeRoleByEmail',
    },
    dungeons: {
      listViewerDungeons: 'dungeons.listViewerDungeons',
      getViewerDungeon: 'dungeons.getViewerDungeon',
      saveDungeon: 'dungeons.saveDungeon',
    },
    sessions: {
      listViewerSessions: 'sessions.listViewerSessions',
      createSession: 'sessions.createSession',
      joinSessionByCode: 'sessions.joinSessionByCode',
      issueServerAccessTicket: 'sessions.issueServerAccessTicket',
      attachCharacterToSession: 'sessions.attachCharacterToSession',
    },
    characters: {
      listViewerCharacters: 'characters.listViewerCharacters',
      getViewerCharacter: 'characters.getViewerCharacter',
      saveCharacter: 'characters.saveCharacter',
      deleteCharacter: 'characters.deleteCharacter',
    },
    packs: {
      listWorkspacePacks: 'packs.listWorkspacePacks',
      listSessionPacks: 'packs.listSessionPacks',
      generatePackUploadUrl: 'packs.generatePackUploadUrl',
      savePackRecord: 'packs.savePackRecord',
      setPackActive: 'packs.setPackActive',
    },
  },
}))

vi.mock('convex/react', () => ({
  useConvexAuth: () => mock.authState,
  Authenticated: ({ children }: { children: ReactNode }) =>
    mock.authState.isAuthenticated ? <>{children}</> : null,
  Unauthenticated: ({ children }: { children: ReactNode }) =>
    mock.authState.isAuthenticated ? null : <>{children}</>,
  useQuery: (queryKey: string, args: unknown) => (args === 'skip' ? undefined : mock.queries[queryKey]),
  useMutation: (mutationKey: string) => mock.mutations[mutationKey] ?? vi.fn(),
}))

vi.mock('./lib/auth', () => ({
  useViewerIdentity: () => mock.viewerIdentity,
}))

describe('authenticated app shell', () => {
  beforeEach(() => {
    mock.authState.isLoading = false
    mock.authState.isAuthenticated = false
    mock.viewerIdentity = {
      viewer: { name: 'Test User', email: 'user@example.com' },
      workspace: { name: 'Test Workspace' },
      roles: ['player'],
      access: {
        isAdmin: false,
        canManageUsers: false,
        canManagePacks: false,
        canManageDungeons: false,
        canManageSessions: false,
        canUseCharacterLibrary: false,
      },
    }
    mock.queries = {
      'sessions.listViewerSessions': [],
    }

    Object.values(mock.mutations).forEach((fn) => fn.mockReset())
    mock.signIn.mockReset()
    mock.signOut.mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('submits the password sign-in form when unauthenticated', async () => {
    const user = userEvent.setup()
    mock.signIn.mockResolvedValue(undefined)

    render(<App />)

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'DungeonPlanner123!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(mock.signIn).toHaveBeenCalledTimes(1))
    expect(mock.signIn.mock.calls[0]?.[0]).toBe('password')
    expect(mock.signIn.mock.calls[0]?.[1]).toBeInstanceOf(FormData)
  })

  it('shows the dungeon save flow for authenticated DMs', async () => {
    const user = userEvent.setup()
    mock.authState.isAuthenticated = true
    mock.viewerIdentity = {
      viewer: { name: 'Dungeon Master', email: 'dm@example.com' },
      workspace: { name: 'DM Workspace' },
      roles: ['dm', 'player'],
      access: {
        isAdmin: false,
        canManageUsers: false,
        canManagePacks: false,
        canManageDungeons: true,
        canManageSessions: true,
        canUseCharacterLibrary: true,
      },
    }
    mock.queries = {
      'dungeons.listViewerDungeons': [],
      'sessions.listViewerSessions': [],
      'characters.listViewerCharacters': [],
    }
    mock.mutations['dungeons.saveDungeon'].mockResolvedValue('dungeon-1')

    render(<App />)

    await user.type(screen.getByLabelText('Title'), 'Sunken Keep')
    await user.click(screen.getByLabelText('Portable dungeon JSON'))
    await user.paste('{"version":1,"rooms":[]}')
    await user.click(screen.getByRole('button', { name: 'Save as new record' }))

    await waitFor(() =>
      expect(mock.mutations['dungeons.saveDungeon']).toHaveBeenCalledWith({
        dungeonId: undefined,
        title: 'Sunken Keep',
        description: undefined,
        serializedDungeon: '{"version":1,"rooms":[]}',
      }),
    )
  })

  it('lets authenticated players join a session by code', async () => {
    const user = userEvent.setup()
    mock.authState.isAuthenticated = true
    mock.viewerIdentity = {
      viewer: { name: 'Player One', email: 'player@example.com' },
      workspace: { name: 'Player Workspace' },
      roles: ['player'],
      access: {
        isAdmin: false,
        canManageUsers: false,
        canManagePacks: false,
        canManageDungeons: false,
        canManageSessions: false,
        canUseCharacterLibrary: true,
      },
    }
    mock.queries = {
      'sessions.listViewerSessions': [],
      'characters.listViewerCharacters': [],
    }
    mock.mutations['sessions.joinSessionByCode'].mockResolvedValue({
      sessionId: 'session-1',
      title: 'Friday Delve',
      joinCode: 'ABC123',
    })

    render(<App />)

    await user.type(screen.getByLabelText('Join code'), 'abc123')
    await user.click(screen.getByRole('button', { name: 'Join by code' }))

    await waitFor(() =>
      expect(mock.mutations['sessions.joinSessionByCode']).toHaveBeenCalledWith({
        joinCode: 'ABC123',
      }),
    )
  })
})
