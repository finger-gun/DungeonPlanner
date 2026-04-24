import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
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
      'dungeons.issueEditorAccessToken': vi.fn(),
      'dungeons.copyViewerDungeon': vi.fn(),
      'dungeons.deleteViewerDungeon': vi.fn(),
      'dungeons.saveDungeon': vi.fn(),
    'sessions.createSession': vi.fn(),
    'sessions.joinSessionByCode': vi.fn(),
    'sessions.issueServerAccessTicket': vi.fn(),
    'actors.saveActorPack': vi.fn(),
    'actors.setActorPackActive': vi.fn(),
    'actors.saveActor': vi.fn(),
    'actors.deleteActor': vi.fn(),
    'sessions.attachCharacterToSession': vi.fn(),
    'packs.generatePackUploadUrl': vi.fn(),
    'packs.savePackRecord': vi.fn(),
    'packs.setPackActive': vi.fn(),
  } as Record<string, ReturnType<typeof vi.fn>>,
}))

vi.mock('./lib/backendAuth', () => ({
  useAuthActions: () => ({
    signIn: mock.signIn,
    signOut: mock.signOut,
  }),
  useBackendAuthState: () => mock.authState,
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
      issueEditorAccessToken: 'dungeons.issueEditorAccessToken',
      copyViewerDungeon: 'dungeons.copyViewerDungeon',
      deleteViewerDungeon: 'dungeons.deleteViewerDungeon',
      saveDungeon: 'dungeons.saveDungeon',
    },
    sessions: {
      listViewerSessions: 'sessions.listViewerSessions',
      createSession: 'sessions.createSession',
      joinSessionByCode: 'sessions.joinSessionByCode',
      issueServerAccessTicket: 'sessions.issueServerAccessTicket',
      attachCharacterToSession: 'sessions.attachCharacterToSession',
    },
    actors: {
      listViewerActorPacks: 'actors.listViewerActorPacks',
      listViewerActors: 'actors.listViewerActors',
      saveActorPack: 'actors.saveActorPack',
      setActorPackActive: 'actors.setActorPackActive',
      saveActor: 'actors.saveActor',
      deleteActor: 'actors.deleteActor',
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

vi.mock('./lib/backendData', () => ({
  useQuery: (queryKey: string, args: unknown) => (args === 'skip' ? undefined : mock.queries[queryKey]),
  useMutation: (mutationKey: string) => mock.mutations[mutationKey] ?? vi.fn(),
  uploadFileThroughBackend: vi.fn(),
}))

vi.mock('./lib/auth', () => ({
  useViewerIdentity: () => mock.viewerIdentity,
}))

describe('authenticated app shell', () => {
  const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
  const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true)

  beforeEach(() => {
    window.location.hash = ''
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
    openSpy.mockClear()
    confirmSpy.mockClear()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows the public landing page when unauthenticated', async () => {
    render(<App />)

    expect(screen.getByRole('heading', { name: /build dungeons\.\s*run epic sessions\./i })).toBeTruthy()
    expect(screen.getByRole('img', { name: 'DungeonPlanner logo' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Why DungeonPlanner?' })).toBeTruthy()
    expect(screen.getAllByRole('link', { name: 'Login' }).length).toBeGreaterThan(0)
  })

  it('submits the password sign-in form on the login screen', async () => {
    const user = userEvent.setup()
    mock.signIn.mockResolvedValue(undefined)
    window.location.hash = '#/login'

    render(<App />)

    expect(screen.getByRole('heading', { name: 'Welcome back to DungeonPlanner' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Sign in to DungeonPlanner' })).toBeTruthy()

    await user.type(screen.getByLabelText('Email'), 'user@example.com')
    await user.type(screen.getByLabelText('Password'), 'DungeonPlanner123!')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))

    await waitFor(() => expect(mock.signIn).toHaveBeenCalledTimes(1))
    expect(mock.signIn.mock.calls[0]?.[0]).toBe('password')
    expect(mock.signIn.mock.calls[0]?.[1]).toBeInstanceOf(FormData)
  })

  it('shows a launcher-only dungeon library for authenticated players', async () => {
    window.location.hash = '#/app/library'
    mock.authState.isAuthenticated = true
    mock.viewerIdentity = {
      viewer: { name: 'Player Builder', email: 'player@example.com' },
      workspace: { name: 'Player Workspace' },
      roles: ['player'],
      access: {
        isAdmin: false,
        canManageUsers: false,
        canManagePacks: false,
        canManageDungeons: true,
        canManageSessions: false,
        canUseCharacterLibrary: true,
      },
    }
    mock.queries = {
      'dungeons.listViewerDungeons': [],
      'sessions.listViewerSessions': [],
      'characters.listViewerCharacters': [],
    }

    render(<App />)

    expect(screen.getByRole('button', { name: 'New in editor' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Open selected in editor' })).toBeNull()
    expect(screen.queryByText('Import dungeon file')).toBeNull()
    expect(screen.queryByLabelText('Portable dungeon JSON')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Save as new record' })).toBeNull()
  })

  it('opens a fresh editor session from the dungeon library route', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/app/library'
    mock.authState.isAuthenticated = true
    mock.viewerIdentity = {
      viewer: { name: 'Player Builder', email: 'player@example.com' },
      workspace: { name: 'Player Workspace' },
      roles: ['player'],
      access: {
        isAdmin: false,
        canManageUsers: false,
        canManagePacks: false,
        canManageDungeons: true,
        canManageSessions: false,
        canUseCharacterLibrary: true,
      },
    }
    mock.queries = {
      'dungeons.listViewerDungeons': [],
      'sessions.listViewerSessions': [],
      'characters.listViewerCharacters': [],
    }
    mock.mutations['dungeons.issueEditorAccessToken'].mockResolvedValue({
      accessToken: 'token-123',
      expiresAt: 123,
    })

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'New in editor' }))

    await waitFor(() =>
      expect(mock.mutations['dungeons.issueEditorAccessToken']).toHaveBeenCalledWith({}),
    )
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openSpy.mock.calls[0]?.[0]).toContain('appEditorToken=token-123')
  })

  it('reveals admin debug views only after the hidden shortcut', async () => {
    window.location.hash = '#/app/dev/users'
    mock.authState.isAuthenticated = true
    mock.viewerIdentity = {
      viewer: { name: 'Admin User', email: 'admin@example.com' },
      workspace: { name: 'Guild Hall' },
      roles: ['admin'],
      access: {
        isAdmin: true,
        canManageUsers: true,
        canManagePacks: true,
        canManageDungeons: true,
        canManageSessions: true,
        canUseCharacterLibrary: true,
      },
    }
    mock.queries = {
      'dungeons.listViewerDungeons': [],
      'sessions.listViewerSessions': [],
      'characters.listViewerCharacters': [],
      'packs.listWorkspacePacks': [],
      'roles.listActiveWorkspaceUsers': [],
    }

    render(<App />)

    const mainNav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(within(mainNav).queryByRole('link', { name: 'Dev' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'User access tools' })).toBeNull()

    fireEvent.keyDown(window, { key: 'F12', code: 'F12', ctrlKey: true, shiftKey: true })

    expect(within(mainNav).getByRole('link', { name: 'Dev' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'User access tools' })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Dev pages' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Packs' })).toBeTruthy()
  })

  it('opens a saved dungeon in the editor from its card', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/app/library'
    mock.authState.isAuthenticated = true
    mock.viewerIdentity = {
      viewer: { name: 'Dungeon Master', email: 'dm@example.com' },
      workspace: { name: 'DM Workspace' },
      roles: ['dm'],
      access: {
        isAdmin: false,
        canManageUsers: false,
        canManagePacks: false,
        canManageDungeons: true,
        canManageSessions: false,
        canUseCharacterLibrary: false,
      },
    }
    mock.queries = {
      'dungeons.listViewerDungeons': [
        {
          _id: 'dungeon-1',
          title: 'Archived Keep',
          description: 'Basement layout',
          createdAt: 1,
          updatedAt: 2,
        },
      ],
      'sessions.listViewerSessions': [],
    }
    mock.mutations['dungeons.issueEditorAccessToken'].mockResolvedValue({
      accessToken: 'token-123',
      expiresAt: 123,
    })

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Open' }))

    await waitFor(() =>
      expect(mock.mutations['dungeons.issueEditorAccessToken']).toHaveBeenCalledWith({}),
    )
    expect(openSpy).toHaveBeenCalledTimes(1)
    expect(openSpy.mock.calls[0]?.[0]).toContain('appDungeonId=dungeon-1')
    expect(openSpy.mock.calls[0]?.[0]).toContain('appEditorToken=token-123')
  })

  it('copies and deletes dungeons from their library cards', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/app/library'
    mock.authState.isAuthenticated = true
    mock.viewerIdentity = {
      viewer: { name: 'Dungeon Master', email: 'dm@example.com' },
      workspace: { name: 'DM Workspace' },
      roles: ['dm'],
      access: {
        isAdmin: false,
        canManageUsers: false,
        canManagePacks: false,
        canManageDungeons: true,
        canManageSessions: false,
        canUseCharacterLibrary: false,
      },
    }
    mock.queries = {
      'dungeons.listViewerDungeons': [
        {
          _id: 'dungeon-1',
          title: 'Archived Keep',
          description: 'Basement layout',
          createdAt: 1,
          updatedAt: 2,
        },
      ],
      'sessions.listViewerSessions': [],
    }
    mock.mutations['dungeons.copyViewerDungeon'].mockResolvedValue({
      _id: 'dungeon-2',
      title: 'Archived Keep (Copy)',
      description: 'Basement layout',
      createdAt: 3,
      updatedAt: 3,
    })
    mock.mutations['dungeons.deleteViewerDungeon'].mockResolvedValue({
      dungeonId: 'dungeon-1',
    })

    render(<App />)

    await user.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(() =>
      expect(mock.mutations['dungeons.copyViewerDungeon']).toHaveBeenCalledWith({
        dungeonId: 'dungeon-1',
      }),
    )

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(confirmSpy).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(mock.mutations['dungeons.deleteViewerDungeon']).toHaveBeenCalledWith({
        dungeonId: 'dungeon-1',
      }),
    )
  })

  it('shows dedicated admin user management pages for administrators after dev unlock', async () => {
    window.location.hash = '#/app/dev/users'
    mock.authState.isAuthenticated = true
    mock.viewerIdentity = {
      viewer: { name: 'Admin User', email: 'admin@example.com' },
      workspace: { name: 'Guild Hall' },
      roles: ['admin'],
      access: {
        isAdmin: true,
        canManageUsers: true,
        canManagePacks: true,
        canManageDungeons: true,
        canManageSessions: true,
        canUseCharacterLibrary: true,
      },
    }
    mock.queries = {
      'dungeons.listViewerDungeons': [],
      'sessions.listViewerSessions': [],
      'characters.listViewerCharacters': [],
      'packs.listWorkspacePacks': [],
      'roles.listActiveWorkspaceUsers': [],
    }

    render(<App />)

    fireEvent.keyDown(window, { key: 'F12', code: 'F12', ctrlKey: true, shiftKey: true })

    const mainNav = screen.getByRole('navigation', { name: 'Main navigation' })
    expect(screen.getByRole('heading', { name: 'User access tools' })).toBeTruthy()
    expect(screen.getByLabelText('User email')).toBeTruthy()
    expect(within(mainNav).getByRole('link', { name: 'Dev' })).toBeTruthy()
    expect(screen.getByRole('navigation', { name: 'Dev pages' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Packs' })).toBeTruthy()
  })
})
