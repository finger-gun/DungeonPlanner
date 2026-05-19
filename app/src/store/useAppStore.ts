import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import type { Id } from '../../convex/_generated/dataModel'
import type { PlatformRole } from '../lib/roles'

const DEFAULT_CHARACTER_SHEET = '{\n  "notes": ""\n}'

type RoleScope = 'workspace' | 'global'

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

type AppShellState = {
  currentPath: string
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
  setRoleManager: (patch: Partial<RoleManagerState>) => void
  setDungeonLibrary: (patch: Partial<DungeonLibraryState>) => void
  setSessionTools: (patch: Partial<SessionToolsState>) => void
  selectSession: (sessionId: Id<'sessions'>, joinCode: string, title: string) => void
  setCharacterTools: (patch: Partial<CharacterToolsState>) => void
  startNewCharacterDraft: () => void
  selectCharacter: (characterId: Id<'characters'>, name: string) => void
  loadCharacterDraft: (character: CharacterDraftSource) => void
  setPackTools: (patch: Partial<PackToolsState>) => void
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
    notice: null,
    error: null,
    isWorking: false,
  }
}

function createInitialAppStoreFields(): AppStoreFields {
  return {
    shell: {
      currentPath: readHashPath(),
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
  resetWorkspaceState: () => {
    set({
      roleManager: createInitialRoleManagerState(),
      dungeonLibrary: createInitialDungeonLibraryState(),
      sessionTools: createInitialSessionToolsState(),
      characterTools: createInitialCharacterToolsState(),
      packTools: createInitialPackToolsState(),
    })
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
    setRoleManager: state.setRoleManager,
    setDungeonLibrary: state.setDungeonLibrary,
    setSessionTools: state.setSessionTools,
    selectSession: state.selectSession,
    setCharacterTools: state.setCharacterTools,
    startNewCharacterDraft: state.startNewCharacterDraft,
    selectCharacter: state.selectCharacter,
    loadCharacterDraft: state.loadCharacterDraft,
    setPackTools: state.setPackTools,
    resetWorkspaceState: state.resetWorkspaceState,
  })))
}

export function resetAppStore() {
  useAppStore.setState(createInitialAppStoreFields())
}
