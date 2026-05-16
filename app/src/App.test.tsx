import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
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
    'actors.deleteActorPack': vi.fn(),
    'actors.setActorPackActive': vi.fn(),
    'actors.saveActor': vi.fn(),
    'actors.deleteActor': vi.fn(),
    'actors.deleteUploadedActorImages': vi.fn(),
    'characters.saveCharacter': vi.fn(),
    'characters.deleteCharacter': vi.fn(),
    'sessions.attachCharacterToSession': vi.fn(),
    'packs.generatePackUploadUrl': vi.fn(),
    'packs.savePackRecord': vi.fn(),
    'packs.setPackActive': vi.fn(),
  } as Record<string, ReturnType<typeof vi.fn>>,
}))

const dragonbaneRulesPack = {
  _id: 'pack-1',
  packId: 'core',
  name: 'Core Pack',
  kind: 'rules',
  version: '1.0.0',
  visibility: 'public',
  isActive: true,
  entries: [],
  defaultAssetRefs: null,
  manifestStorageId: null,
  thumbnailStorageId: null,
  sourceProvenance: {
    sourceRepository: 'fixture',
    sourcePath: '.',
    packVersion: '1.0.0',
    importedAt: '2026-05-16T00:00:00.000Z',
    importer: 'dragonbane-unbound',
  },
  domains: {
    dragonbane: {
      schemaVersion: 1,
      kins: [{ ref: 'core:kin.human', id: 'human', name: 'Human', movement: 10, playableByPlayers: true }],
      professions: [
        {
          ref: 'core:profession.fighter',
          id: 'fighter',
          name: 'Fighter',
          keyAttributeIds: ['STR'],
          trainedSkillRefs: ['core:skill.swords'],
          startingEquipment: {
            weaponRefs: ['core:weapon.broadsword'],
            armorRefs: [],
            itemRefs: [],
            copper: 10,
          },
        },
      ],
      skills: [
        { ref: 'core:skill.swords', id: 'swords', name: 'Swords', attributeId: 'STR', isSecondary: false },
        { ref: 'core:skill.lore', id: 'lore', name: 'Lore', attributeId: 'INT', isSecondary: false },
      ],
      rules: {
        characterCreation: {
          ref: 'core:rule.character-creation',
          id: 'character-creation',
          ageSkillSlots: {
            Young: { total: 2, fromProfession: 1, freeChoice: 1 },
            'Middle-Aged': { total: 2, fromProfession: 1, freeChoice: 1 },
            Old: { total: 2, fromProfession: 1, freeChoice: 1 },
          },
          damageBonusRanges: {
            STR: [{ min: 1, bonus: 'none' }],
            AGL: [{ min: 1, bonus: 'none' }],
          },
          movementAgilityModifiers: [{ min: 1, modifier: 0 }],
        },
        appearanceOptions: [],
        mementoOptions: [],
        weaknesses: [],
        heroicAbilities: [],
        magic: {
          rules: { schools: [] },
          schools: [],
        },
      },
      equipment: {
        weapons: [{ ref: 'core:weapon.broadsword', id: 'broadsword', name: 'Broadsword', features: [] }],
        armor: [],
      },
    },
  },
}

vi.mock('./lib/dragonbanePacks', () => ({
  useBundledDragonbanePacks: () => ({
    registry: {
      packs: [
        {
          packId: 'core',
          name: 'Core Pack',
          system: 'dragonbane',
          kind: 'rules',
          version: '1.0.0',
          alwaysActive: true,
          bundled: true,
          path: '/api/content-packs/core.pack.json',
        },
      ],
    },
    packs: [
      {
        ...dragonbaneRulesPack,
        system: 'dragonbane',
        visibility: 'global',
        alwaysActive: true,
        bundled: true,
        description: undefined,
        entries: [],
        sourceProvenance: {
          sourceRepository: 'fixture',
          sourcePath: '.',
          packVersion: '1.0.0',
          importedAt: '2026-05-16T00:00:00.000Z',
          importer: 'dragonbane-unbound',
        },
      },
    ],
    alwaysActivePacks: [
      {
        ...dragonbaneRulesPack,
        system: 'dragonbane',
        visibility: 'global',
        alwaysActive: true,
        bundled: true,
        description: undefined,
        entries: [],
        sourceProvenance: {
          sourceRepository: 'fixture',
          sourcePath: '.',
          packVersion: '1.0.0',
          importedAt: '2026-05-16T00:00:00.000Z',
          importer: 'dragonbane-unbound',
        },
      },
    ],
    error: null,
    isLoading: false,
  }),
  loadBundledPackManifest: vi.fn(),
  toWorkspaceRulesPackSaveInput: (pack: unknown) => pack,
  mergeRuntimeRulesPacks: (_bundled: unknown[], workspace: unknown[]) => workspace,
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
      deleteActorPack: 'actors.deleteActorPack',
      setActorPackActive: 'actors.setActorPackActive',
      saveActor: 'actors.saveActor',
      deleteActor: 'actors.deleteActor',
      deleteUploadedActorImages: 'actors.deleteUploadedActorImages',
    },
    characters: {
      listViewerCharacters: 'characters.listViewerCharacters',
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

vi.mock('./lib/backendData', () => ({
  useQuery: (queryKey: string, args: unknown) => (args === 'skip' ? undefined : mock.queries[queryKey]),
  useMutation: (mutationKey: string) => mock.mutations[mutationKey] ?? vi.fn(),
  uploadFileThroughBackend: vi.fn(),
  uploadActorAssetThroughBackend: vi.fn(),
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

  it('shows admin pages in the workspace navigation without a dev menu', async () => {
    window.location.hash = '#/app/admin/users'
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
    expect(screen.queryByRole('navigation', { name: 'Dev pages' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Users' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'User access tools' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Packs' })).toBeTruthy()
  })

  it('shows the Dragonbane character creator from the regular workspace menu for players', async () => {
    window.location.hash = '#/app/characters'
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
      'sessions.listViewerSessions': [],
      'packs.listWorkspacePacks': [dragonbaneRulesPack],
      'actors.listViewerActorPacks': [],
      'actors.listViewerActors': [],
    }

    render(<App />)

    expect(screen.getByRole('link', { name: 'Characters' })).toBeTruthy()
    expect(screen.getAllByRole('heading', { name: 'Character library' }).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Create new character' })).toBeTruthy()
    expect(screen.queryByRole('heading', { name: 'Create a playable character or NPC' })).toBeNull()
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

  it('shows dedicated admin user management pages for administrators', async () => {
    window.location.hash = '#/app/admin/users'
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
    expect(screen.getByRole('heading', { name: 'User access tools' })).toBeTruthy()
    expect(screen.getByLabelText('User email')).toBeTruthy()
    expect(within(mainNav).queryByRole('link', { name: 'Dev' })).toBeNull()
    expect(screen.queryByRole('navigation', { name: 'Dev pages' })).toBeNull()
    expect(screen.getByRole('link', { name: 'Users' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Packs' })).toBeTruthy()
  })

  it('saves rules packs with domains and source provenance from the metadata editor', async () => {
    const user = userEvent.setup()
    window.location.hash = '#/app/admin/packs'
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
      'packs.listWorkspacePacks': [dragonbaneRulesPack],
      'roles.listActiveWorkspaceUsers': [],
    }
    mock.mutations['packs.savePackRecord'].mockResolvedValue('pack-1')

    render(<App />)

    await user.click(screen.getByRole('button', { name: /Core Pack/ }))
    expect(screen.getByText('Dragonbane domains JSON')).toBeTruthy()
    expect(screen.getByText('Source provenance JSON')).toBeTruthy()

    await user.click(screen.getAllByRole('button', { name: 'Update pack' })[0])

    await waitFor(() =>
      expect(mock.mutations['packs.savePackRecord']).toHaveBeenCalledWith(
        expect.objectContaining({
          packRecordId: 'pack-1',
          kind: 'rules',
          domains: dragonbaneRulesPack.domains,
          sourceProvenance: dragonbaneRulesPack.sourceProvenance,
          defaultAssetRefs: undefined,
        }),
      ),
    )
  })
})
