import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { Id } from '../../convex/_generated/dataModel'
import type { PlatformRole } from '../lib/roles'

const DEFAULT_CHARACTER_SHEET = '{\n  "notes": ""\n}'
const DEFAULT_PACK_ENTRIES_JSON = `[
  {
    "localId": "wall_window_open",
    "name": "Window Opening",
    "entryKind": "scene-asset",
    "category": "opening",
    "assetFileRef": "assets/models/dungeon/wall_window_open.glb",
    "thumbnailFileRef": "assets/models/dungeon/wall_window_open.png",
    "placement": {
      "category": "opening",
      "snapsTo": "GRID",
      "connectors": [{ "point": [0, 0, 0], "type": "WALL" }],
      "openingWidth": 1
    },
    "browser": {
      "category": "openings",
      "subcategory": "doors",
      "tags": ["wall-mounted"]
    }
  }
]`
const DEFAULT_PACK_DEFAULT_REFS_JSON = `{
  "floor": "dungeon:floor_flagstone",
  "wall": "dungeon:wall_plain"
}`

type RoleScope = 'workspace' | 'global'
type PackKind = 'asset' | 'rules'
type PackVisibility = 'global' | 'public' | 'private'

export type SessionAccessPayload = {
  roomName: string
  sessionId: string
  accessToken: string
  role: string
  expiresAt: number
}

export type CharacterDraftSource = {
  name: string
  contentRef?: string | null
  sheet: unknown
}

export type PackDraftSource = {
  _id: Id<'packs'>
  packId: string
  name: string
  kind: PackKind
  version: string
  visibility: PackVisibility
  isActive: boolean
  description?: string | null
  entries: unknown[]
  defaultAssetRefs?: {
    floor?: string
    wall?: string
    opening?: string
    prop?: string
    player?: string
  } | null
  manifestStorageId?: Id<'_storage'> | null
  thumbnailStorageId?: Id<'_storage'> | null
}

type AppShellState = {
  currentPath: string
  isDevMenuVisible: boolean
}

type RoleManagerState = {
  email: string
  role: PlatformRole
  scope: RoleScope
  error: string | null
  isWorking: boolean
}

type DungeonLibraryState = {
  notice: string | null
  error: string | null
  activeAction: string | null
}

type SessionToolsState = {
  titleDraft: string
  joinCodeDraft: string
  notice: string | null
  error: string | null
  isWorking: boolean
  selectedSessionId: Id<'sessions'> | null
  accessPayload: SessionAccessPayload | null
}

type CharacterToolsState = {
  selectedCharacterId: Id<'characters'> | null
  nameDraft: string
  contentRefDraft: string
  sheetDraft: string
  notice: string | null
  error: string | null
  isWorking: boolean
}

type PackToolsState = {
  selectedPackRecordId: Id<'packs'> | null
  packIdDraft: string
  nameDraft: string
  kindDraft: PackKind
  versionDraft: string
  visibilityDraft: PackVisibility
  isActiveDraft: boolean
  descriptionDraft: string
  entriesJsonDraft: string
  defaultRefsJsonDraft: string
  manifestFile: File | null
  thumbnailFile: File | null
  manifestStorageId: Id<'_storage'> | null
  thumbnailStorageId: Id<'_storage'> | null
  notice: string | null
  error: string | null
  isWorking: boolean
}

type AppStoreFields = {
  shell: AppShellState
  roleManager: RoleManagerState
  dungeonLibrary: DungeonLibraryState
  sessionTools: SessionToolsState
  characterTools: CharacterToolsState
  packTools: PackToolsState
}

type AppStore = AppStoreFields & {
  setCurrentPath: (path: string) => void
  setDevMenuVisible: (isVisible: boolean) => void
  toggleDevMenuVisible: () => void
  setRoleManager: (patch: Partial<RoleManagerState>) => void
  setDungeonLibrary: (patch: Partial<DungeonLibraryState>) => void
  setSessionTools: (patch: Partial<SessionToolsState>) => void
  selectSession: (sessionId: Id<'sessions'>, joinCode: string, title: string) => void
  setCharacterTools: (patch: Partial<CharacterToolsState>) => void
  startNewCharacterDraft: () => void
  selectCharacter: (characterId: Id<'characters'>, name: string) => void
  loadCharacterDraft: (character: CharacterDraftSource) => void
  setPackTools: (patch: Partial<PackToolsState>) => void
  startNewPackDraft: () => void
  hydratePackDraft: (record: PackDraftSource) => void
  resetWorkspaceState: () => void
}

function readHashPath() {
  if (typeof window === 'undefined') {
    return '/'
  }

  const hash = window.location.hash.replace(/^#/, '').trim()
  return hash || '/'
}

function createInitialRoleManagerState(): RoleManagerState {
  return {
    email: '',
    role: 'player',
    scope: 'workspace',
    error: null,
    isWorking: false,
  }
}

function createInitialDungeonLibraryState(): DungeonLibraryState {
  return {
    notice: null,
    error: null,
    activeAction: null,
  }
}

function createInitialSessionToolsState(): SessionToolsState {
  return {
    titleDraft: '',
    joinCodeDraft: '',
    notice: null,
    error: null,
    isWorking: false,
    selectedSessionId: null,
    accessPayload: null,
  }
}

function createInitialCharacterToolsState(): CharacterToolsState {
  return {
    selectedCharacterId: null,
    nameDraft: '',
    contentRefDraft: '',
    sheetDraft: DEFAULT_CHARACTER_SHEET,
    notice: null,
    error: null,
    isWorking: false,
  }
}

function createInitialPackToolsState(): PackToolsState {
  return {
    selectedPackRecordId: null,
    packIdDraft: '',
    nameDraft: '',
    kindDraft: 'asset',
    versionDraft: '0.1.0',
    visibilityDraft: 'public',
    isActiveDraft: true,
    descriptionDraft: '',
    entriesJsonDraft: DEFAULT_PACK_ENTRIES_JSON,
    defaultRefsJsonDraft: DEFAULT_PACK_DEFAULT_REFS_JSON,
    manifestFile: null,
    thumbnailFile: null,
    manifestStorageId: null,
    thumbnailStorageId: null,
    notice: null,
    error: null,
    isWorking: false,
  }
}

function createInitialAppStoreFields(): AppStoreFields {
  return {
    shell: {
      currentPath: readHashPath(),
      isDevMenuVisible: false,
    },
    roleManager: createInitialRoleManagerState(),
    dungeonLibrary: createInitialDungeonLibraryState(),
    sessionTools: createInitialSessionToolsState(),
    characterTools: createInitialCharacterToolsState(),
    packTools: createInitialPackToolsState(),
  }
}

export const useAppStore = create<AppStore>((set) => ({
  ...createInitialAppStoreFields(),
  setCurrentPath: (path) => {
    set((state) => ({
      shell: {
        ...state.shell,
        currentPath: path,
      },
    }))
  },
  setDevMenuVisible: (isVisible) => {
    set((state) => ({
      shell: {
        ...state.shell,
        isDevMenuVisible: isVisible,
      },
    }))
  },
  toggleDevMenuVisible: () => {
    set((state) => ({
      shell: {
        ...state.shell,
        isDevMenuVisible: !state.shell.isDevMenuVisible,
      },
    }))
  },
  setRoleManager: (patch) => {
    set((state) => ({
      roleManager: {
        ...state.roleManager,
        ...patch,
      },
    }))
  },
  setDungeonLibrary: (patch) => {
    set((state) => ({
      dungeonLibrary: {
        ...state.dungeonLibrary,
        ...patch,
      },
    }))
  },
  setSessionTools: (patch) => {
    set((state) => ({
      sessionTools: {
        ...state.sessionTools,
        ...patch,
      },
    }))
  },
  selectSession: (sessionId, joinCode, title) => {
    set((state) => ({
      sessionTools: {
        ...state.sessionTools,
        selectedSessionId: sessionId,
        accessPayload: null,
        joinCodeDraft: joinCode,
        notice: `Selected "${title}".`,
        error: null,
      },
    }))
  },
  setCharacterTools: (patch) => {
    set((state) => ({
      characterTools: {
        ...state.characterTools,
        ...patch,
      },
    }))
  },
  startNewCharacterDraft: () => {
    set({
      characterTools: {
        ...createInitialCharacterToolsState(),
        notice: 'Started a fresh character draft.',
      },
    })
  },
  selectCharacter: (characterId, name) => {
    set((state) => ({
      characterTools: {
        ...state.characterTools,
        selectedCharacterId: characterId,
        notice: `Selected "${name}".`,
        error: null,
      },
    }))
  },
  loadCharacterDraft: (character) => {
    set((state) => ({
      characterTools: {
        ...state.characterTools,
        nameDraft: character.name,
        contentRefDraft: character.contentRef ?? '',
        sheetDraft: JSON.stringify(character.sheet, null, 2),
        error: null,
        notice: `Loaded "${character.name}" into the local character draft.`,
      },
    }))
  },
  setPackTools: (patch) => {
    set((state) => ({
      packTools: {
        ...state.packTools,
        ...patch,
      },
    }))
  },
  startNewPackDraft: () => {
    set({
      packTools: {
        ...createInitialPackToolsState(),
        notice: 'Started a fresh pack draft.',
      },
    })
  },
  hydratePackDraft: (record) => {
    set({
      packTools: {
        selectedPackRecordId: record._id,
        packIdDraft: record.packId,
        nameDraft: record.name,
        kindDraft: record.kind,
        versionDraft: record.version,
        visibilityDraft: record.visibility,
        isActiveDraft: record.isActive,
        descriptionDraft: record.description ?? '',
        entriesJsonDraft: JSON.stringify(record.entries, null, 2),
        defaultRefsJsonDraft: JSON.stringify(record.defaultAssetRefs ?? {}, null, 2),
        manifestFile: null,
        thumbnailFile: null,
        manifestStorageId: record.manifestStorageId ?? null,
        thumbnailStorageId: record.thumbnailStorageId ?? null,
        notice: `Loaded "${record.name}" into the pack draft.`,
        error: null,
        isWorking: false,
      },
    })
  },
  resetWorkspaceState: () => {
    set((state) => ({
      shell: {
        ...state.shell,
        isDevMenuVisible: false,
      },
      roleManager: createInitialRoleManagerState(),
      dungeonLibrary: createInitialDungeonLibraryState(),
      sessionTools: createInitialSessionToolsState(),
      characterTools: createInitialCharacterToolsState(),
      packTools: createInitialPackToolsState(),
    }))
  },
}))

export function useAuthenticatedAppState() {
  return useAppStore(useShallow((state) => ({
    shell: state.shell,
    roleManager: state.roleManager,
    dungeonLibrary: state.dungeonLibrary,
    sessionTools: state.sessionTools,
    characterTools: state.characterTools,
    packTools: state.packTools,
    setCurrentPath: state.setCurrentPath,
    setDevMenuVisible: state.setDevMenuVisible,
    toggleDevMenuVisible: state.toggleDevMenuVisible,
    setRoleManager: state.setRoleManager,
    setDungeonLibrary: state.setDungeonLibrary,
    setSessionTools: state.setSessionTools,
    selectSession: state.selectSession,
    setCharacterTools: state.setCharacterTools,
    startNewCharacterDraft: state.startNewCharacterDraft,
    selectCharacter: state.selectCharacter,
    loadCharacterDraft: state.loadCharacterDraft,
    setPackTools: state.setPackTools,
    startNewPackDraft: state.startNewPackDraft,
    hydratePackDraft: state.hydratePackDraft,
    resetWorkspaceState: state.resetWorkspaceState,
  })))
}

export function resetAppStore() {
  useAppStore.setState(createInitialAppStoreFields())
}
