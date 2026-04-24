import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { useConvexAuth, useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { useViewerIdentity } from './lib/auth'
import { type PlatformRole } from './lib/roles'
import {
  getDungeonSyncState,
  inferDungeonTitle,
  isPortableDungeonPayload,
  type SavedDungeonSnapshot,
} from './lib/dungeonLibrary'

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

type WorkspacePage = 'overview' | 'library' | 'dev' | 'sessions' | 'characters' | 'admin-users' | 'admin-packs'
type DevWorkspacePage = 'sessions' | 'characters' | 'admin-users' | 'admin-packs'

const DEV_WORKSPACE_PAGES: readonly DevWorkspacePage[] = ['sessions', 'characters', 'admin-users', 'admin-packs']

const GITHUB_ICON_PATH =
  'M12 2C6.48 2 2 6.59 2 12.25c0 4.53 2.87 8.37 6.84 9.72.5.1.68-.22.68-.49 0-.24-.01-1.04-.01-1.89-2.78.62-3.37-1.22-3.37-1.22-.46-1.2-1.12-1.52-1.12-1.52-.92-.64.07-.63.07-.63 1.01.08 1.55 1.08 1.55 1.08.91 1.6 2.38 1.14 2.96.87.09-.68.36-1.14.65-1.4-2.22-.26-4.56-1.14-4.56-5.09 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.31.1-2.73 0 0 .85-.28 2.78 1.05a9.33 9.33 0 0 1 5.06 0c1.93-1.33 2.78-1.05 2.78-1.05.55 1.42.2 2.47.1 2.73.64.71 1.03 1.62 1.03 2.74 0 3.96-2.34 4.83-4.57 5.08.37.33.7.97.7 1.96 0 1.42-.01 2.57-.01 2.92 0 .27.18.59.69.49A10.25 10.25 0 0 0 22 12.25C22 6.59 17.52 2 12 2Z'

const LANDING_FEATURES = [
  {
    title: 'Tile-Based Building',
    copy: 'Snap rooms together on a grid. Walls, doors, stairs - everything clicks into place. Build a full dungeon in minutes.',
    imageSrc: '/animated-room.gif',
    imageAlt: 'Animated tile-based room building',
  },
  {
    title: 'Real-Time 3D',
    copy: 'See your dungeon come alive in full 3D with dynamic lighting, atmospheric fog, and smooth camera controls.',
    imageSrc: '/real-time.png',
    imageAlt: 'Real-time 3D dungeon rendering',
  },
  {
    title: 'Multi-Floor Dungeons',
    copy: 'Stack floors above and below. Cellars, towers, catacombs - your vertical designs stay connected and navigable.',
    imageSrc: '/animated-floors.gif',
    imageAlt: 'Animated multi-floor dungeon building',
  },
  {
    title: 'Props & Furnishing',
    copy: 'Place torches, chests, barrels, altars and more. Each asset snaps to walls or floors exactly where it belongs.',
    imageSrc: '/animated-barrel.gif',
    imageAlt: 'Animated props and furnishing placement',
  },
  {
    title: 'Save & Share',
    copy: 'Export your dungeon as a portable JSON file. Load it back anytime, share with your party, or build a library of maps.',
    imageSrc: '/save-n-load.png',
    imageAlt: 'Save and share dungeon maps',
  },
  {
    title: 'Source Available',
    copy: 'Source available and free for noncommercial use under PolyForm Noncommercial 1.0.0. Modify it, extend it, and contribute back.',
    imageSrc: '/open-source.png',
    imageAlt: 'Source available project',
  },
] as const

function readHashPath() {
  if (typeof window === 'undefined') {
    return '/'
  }

  const hash = window.location.hash.replace(/^#/, '').trim()
  return hash || '/'
}

function getWorkspacePageFromPath(path: string): WorkspacePage | null {
  switch (path) {
    case '/app':
      return 'overview'
    case '/app/library':
      return 'library'
    case '/app/dev':
      return 'dev'
    case '/app/sessions':
    case '/app/dev/sessions':
      return 'sessions'
    case '/app/characters':
    case '/app/dev/characters':
      return 'characters'
    case '/app/admin/users':
    case '/app/dev/users':
      return 'admin-users'
    case '/app/admin/packs':
    case '/app/dev/packs':
      return 'admin-packs'
    default:
      return null
  }
}

function isDevWorkspacePage(page: WorkspacePage | null): page is DevWorkspacePage {
  return page !== null && DEV_WORKSPACE_PAGES.includes(page as DevWorkspacePage)
}

function GitHubMark() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24">
      <path d={GITHUB_ICON_PATH} fill="currentColor" />
    </svg>
  )
}

function PublicLandingScreen() {
  return (
    <>
      <section className="hero">
        <div aria-hidden="true" className="hero-glow"></div>
        <div className="hero-content">
          <img alt="DungeonPlanner logo" className="hero-logo" src="/logo.png" />
          <h1>
            Build Dungeons.
            <br />
            Run <em>Epic</em> Sessions.
          </h1>
          <p className="hero-sub">
            A modern 3D dungeon editor made for game masters who want their maps to look as good as they play.
          </p>
          <div className="hero-actions">
            <a className="btn btn-primary" href="#/login">
              Login
            </a>
            <a className="btn btn-secondary" href="https://docs.dungeonplanner.com/" rel="noreferrer" target="_blank">
              Read the Docs
            </a>
          </div>
          <p className="hero-note">Source available · Free for noncommercial use</p>
        </div>

        <svg aria-hidden="true" className="deco deco-d20" viewBox="0 0 100 100">
          <polygon fill="none" points="50,5 95,35 80,90 20,90 5,35" stroke="currentColor" strokeWidth="1.5"></polygon>
          <line stroke="currentColor" strokeWidth="1" x1="50" x2="20" y1="5" y2="90"></line>
          <line stroke="currentColor" strokeWidth="1" x1="50" x2="80" y1="5" y2="90"></line>
          <line stroke="currentColor" strokeWidth="1" x1="5" x2="80" y1="35" y2="90"></line>
          <line stroke="currentColor" strokeWidth="1" x1="95" x2="20" y1="35" y2="90"></line>
          <line stroke="currentColor" strokeWidth="1" x1="5" x2="95" y1="35" y2="35"></line>
        </svg>
        <svg aria-hidden="true" className="deco deco-d20-sm" viewBox="0 0 100 100">
          <polygon fill="none" points="50,5 95,35 80,90 20,90 5,35" stroke="currentColor" strokeWidth="2"></polygon>
        </svg>
      </section>

      <section className="features">
        <h2 className="section-title">Why DungeonPlanner?</h2>
        <div className="features-grid">
          {LANDING_FEATURES.map((feature) => (
            <article className="feat-card feat-card--has-gif" key={feature.title}>
              <img alt={feature.imageAlt} className="feat-gif" src={feature.imageSrc} />
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="cta">
        <div className="cta-inner">
          <h2>Ready to Return?</h2>
          <p>Log in to open your saved dungeons, active sessions, characters, and packs.</p>
          <a className="btn btn-primary btn-lg" href="#/login">
            Login
          </a>
        </div>
      </section>

      <footer className="site-footer">
        <div className="footer-inner">
          <p className="footer-tagline">Made for TTRPG players who want their dungeon to look as good as it plays.</p>
          <p className="footer-credit">
            Made with ❤️ in Skane. A{' '}
            <a href="https://fingergun.dev/" rel="noreferrer" target="_blank">
              Finger Gun
            </a>{' '}
            project, making nothing into something.
          </p>
          <p className="footer-links">
            <a href="/privacy-cookie-policy.html">Privacy &amp; Cookie Policy</a>
          </p>
        </div>
      </footer>
    </>
  )
}

function PasswordAuthCard() {
  const { signIn } = useAuthActions()
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      await signIn('password', formData)
    } catch (submitError) {
      setError(
        flow === 'signIn'
          ? 'Sign-in failed. If this account does not exist yet, switch to sign up first.'
          : 'Sign-up failed. Make sure the email is valid and the password is at least 8 characters.',
      )
      console.error(submitError)
      setIsSubmitting(false)
      return
    }

    setIsSubmitting(false)
  }

  return (
    <section className="auth-card" aria-labelledby="auth-card-title">
      <div className="auth-card__header">
        <p className="app-shell__eyebrow">Login</p>
        <h2 className="panel__title" id="auth-card-title">
          Sign in to DungeonPlanner
        </h2>
        <p className="panel__copy">
          Open your dungeons, sessions, characters, and packs with your email and password.
        </p>
      </div>

      <form className="auth-card__form" onSubmit={handleSubmit}>
        <label className="auth-card__field">
          <span>Email</span>
          <input autoComplete="email" name="email" type="email" required />
        </label>

        {flow === 'signUp' ? (
          <label className="auth-card__field">
            <span>Display name</span>
            <input autoComplete="nickname" name="name" type="text" />
          </label>
        ) : null}

        <label className="auth-card__field">
          <span>Password</span>
          <input
            autoComplete={flow === 'signIn' ? 'current-password' : 'new-password'}
            minLength={8}
            name="password"
            type="password"
            required
          />
        </label>

        <input name="flow" type="hidden" value={flow} />

        {error ? <p className="auth-card__error">{error}</p> : null}

        <div className="auth-card__actions">
          <button className="hero-panel__button hero-panel__button--primary" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Working...' : flow === 'signIn' ? 'Sign in' : 'Create account'}
          </button>
          <button
            className="hero-panel__button hero-panel__button--secondary"
            onClick={() => {
              setError(null)
              setFlow(flow === 'signIn' ? 'signUp' : 'signIn')
            }}
            type="button"
          >
            {flow === 'signIn' ? 'Need an account?' : 'Already have an account?'}
          </button>
        </div>
      </form>
    </section>
  )
}

function SignedInOverview({
  currentPath,
  identity,
  isDevMenuVisible,
}: {
  currentPath: string
  identity: ReturnType<typeof useViewerIdentity>
  isDevMenuVisible: boolean
}) {
  const { signOut } = useAuthActions()
  const canAccessDungeonLibrary = identity.access.canManageDungeons
  const workspaceMembers = useQuery(
    api.roles.listActiveWorkspaceUsers,
    identity.access.canManageUsers ? {} : 'skip',
  )
  const libraryRecords = useQuery(
    api.dungeons.listViewerDungeons,
    canAccessDungeonLibrary ? {} : 'skip',
  )
  const sessionRecords = useQuery(api.sessions.listViewerSessions, {})
  const characterRecords = useQuery(
    api.characters.listViewerCharacters,
    identity.access.canUseCharacterLibrary ? {} : 'skip',
  )
  const packRecords = useQuery(
    api.packs.listWorkspacePacks,
    identity.access.canManagePacks ? {} : 'skip',
  )
  const grantRoleByEmail = useMutation(api.roles.grantRoleByEmail)
  const revokeRoleByEmail = useMutation(api.roles.revokeRoleByEmail)
  const saveDungeon = useMutation(api.dungeons.saveDungeon)
  const createSession = useMutation(api.sessions.createSession)
  const joinSessionByCode = useMutation(api.sessions.joinSessionByCode)
  const issueServerAccessTicket = useMutation(api.sessions.issueServerAccessTicket)
  const saveCharacter = useMutation(api.characters.saveCharacter)
  const deleteCharacter = useMutation(api.characters.deleteCharacter)
  const attachCharacterToSession = useMutation(api.sessions.attachCharacterToSession)
  const generatePackUploadUrl = useMutation(api.packs.generatePackUploadUrl)
  const savePackRecord = useMutation(api.packs.savePackRecord)
  const setPackActive = useMutation(api.packs.setPackActive)

  const [roleEmail, setRoleEmail] = useState('')
  const [roleToManage, setRoleToManage] = useState<PlatformRole>('player')
  const [roleScope, setRoleScope] = useState<'workspace' | 'global'>('workspace')
  const [roleError, setRoleError] = useState<string | null>(null)
  const [isManagingRoles, setIsManagingRoles] = useState(false)

  const [selectedDungeonId, setSelectedDungeonId] = useState<Id<'dungeons'> | null>(null)
  const selectedDungeon = useQuery(
    api.dungeons.getViewerDungeon,
    selectedDungeonId ? { dungeonId: selectedDungeonId } : 'skip',
  )
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftSerializedDungeon, setDraftSerializedDungeon] = useState('')
  const [dungeonNotice, setDungeonNotice] = useState<string | null>(null)
  const [dungeonError, setDungeonError] = useState<string | null>(null)
  const [isSavingDungeon, setIsSavingDungeon] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('')
  const [sessionJoinCode, setSessionJoinCode] = useState('')
  const [sessionNotice, setSessionNotice] = useState<string | null>(null)
  const [sessionError, setSessionError] = useState<string | null>(null)
  const [isWorkingSession, setIsWorkingSession] = useState(false)
  const [selectedSessionId, setSelectedSessionId] = useState<Id<'sessions'> | null>(null)
  const [sessionAccessPayload, setSessionAccessPayload] = useState<{
    roomName: string
    sessionId: string
    accessToken: string
    role: string
    expiresAt: number
  } | null>(null)
  const sessionPackRecords = useQuery(
    api.packs.listSessionPacks,
    selectedSessionId ? { sessionId: selectedSessionId } : 'skip',
  )
  const [selectedCharacterId, setSelectedCharacterId] = useState<Id<'characters'> | null>(null)
  const selectedCharacter = useQuery(
    api.characters.getViewerCharacter,
    selectedCharacterId ? { characterId: selectedCharacterId } : 'skip',
  )
  const [characterName, setCharacterName] = useState('')
  const [characterContentRef, setCharacterContentRef] = useState('')
  const [characterSheet, setCharacterSheet] = useState('{\n  "notes": ""\n}')
  const [characterNotice, setCharacterNotice] = useState<string | null>(null)
  const [characterError, setCharacterError] = useState<string | null>(null)
  const [isWorkingCharacter, setIsWorkingCharacter] = useState(false)
  const [selectedPackRecordId, setSelectedPackRecordId] = useState<Id<'packs'> | null>(null)
  const [packIdDraft, setPackIdDraft] = useState('')
  const [packNameDraft, setPackNameDraft] = useState('')
  const [packKindDraft, setPackKindDraft] = useState<'asset' | 'rules'>('asset')
  const [packVersionDraft, setPackVersionDraft] = useState('0.1.0')
  const [packVisibilityDraft, setPackVisibilityDraft] = useState<'global' | 'public' | 'private'>('public')
  const [packIsActiveDraft, setPackIsActiveDraft] = useState(true)
  const [packDescriptionDraft, setPackDescriptionDraft] = useState('')
  const [packEntriesJson, setPackEntriesJson] = useState(DEFAULT_PACK_ENTRIES_JSON)
  const [packDefaultRefsJson, setPackDefaultRefsJson] = useState(DEFAULT_PACK_DEFAULT_REFS_JSON)
  const [manifestFile, setManifestFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [manifestStorageId, setManifestStorageId] = useState<Id<'_storage'> | null>(null)
  const [thumbnailStorageId, setThumbnailStorageId] = useState<Id<'_storage'> | null>(null)
  const [packNotice, setPackNotice] = useState<string | null>(null)
  const [packError, setPackError] = useState<string | null>(null)
  const [isWorkingPacks, setIsWorkingPacks] = useState(false)

  const selectedSnapshot = useMemo<SavedDungeonSnapshot | null>(() => {
    if (!selectedDungeon) {
      return null
    }

    return {
      id: selectedDungeon._id,
      title: selectedDungeon.title,
      description: selectedDungeon.description ?? '',
      serializedDungeon: selectedDungeon.serializedDungeon,
    }
  }, [selectedDungeon])

  const syncState = getDungeonSyncState(
    {
      title: draftTitle,
      description: draftDescription,
      serializedDungeon: draftSerializedDungeon,
    },
    selectedSnapshot,
  )

  const selectedSession = sessionRecords?.find((session) => session._id === selectedSessionId) ?? null
  const selectedPackRecord = packRecords?.find((pack) => pack._id === selectedPackRecordId) ?? null
  const canAccessDevMenu = identity.access.isAdmin && isDevMenuVisible
  const requestedPage = getWorkspacePageFromPath(currentPath)
  const workspaceNavItems = [
    { id: 'overview', label: 'Overview', href: '#/app' },
    canAccessDungeonLibrary && { id: 'library', label: 'Dungeon Library', href: '#/app/library' },
    canAccessDevMenu && {
      id: 'dev',
      label: 'Dev',
      href: '#/app/dev',
    },
  ].filter((item): item is { id: string; label: string; href: string } => Boolean(item))
  const devNavItems = [
    identity.access.canManageSessions && { id: 'sessions', label: 'Sessions', href: '#/app/dev/sessions' },
    identity.access.canUseCharacterLibrary && { id: 'characters', label: 'Characters', href: '#/app/dev/characters' },
    identity.access.canManageUsers && { id: 'admin-users', label: 'Users', href: '#/app/dev/users' },
    identity.access.canManagePacks && { id: 'admin-packs', label: 'Packs', href: '#/app/dev/packs' },
  ].filter((item): item is { id: DevWorkspacePage; label: string; href: string } => Boolean(item))
  const activePage: WorkspacePage =
    requestedPage === 'library' && canAccessDungeonLibrary
      ? 'library'
      : requestedPage === 'dev' && canAccessDevMenu
        ? 'dev'
        : isDevWorkspacePage(requestedPage) && canAccessDevMenu && devNavItems.some((item) => item.id === requestedPage)
          ? requestedPage
          : 'overview'

  const pageIntro = {
    overview: {
      eyebrow: 'Overview',
      title: 'Your DungeonPlanner workspace',
      copy: 'Open your private dungeon library, review your access, and get ready for your next session.',
    },
    library: {
      eyebrow: 'Dungeons',
      title: 'Dungeon library',
      copy: 'Keep your private dungeon drafts in one place, save portable JSON exports, and load any map back into editing.',
    },
    dev: {
      eyebrow: 'Debug',
      title: 'Developer workspace',
      copy: 'Open the internal app views for sessions, characters, user roles, and pack management.',
    },
    sessions: {
      eyebrow: 'Debug',
      title: 'Session tools',
      copy: 'Use the current development session flows for creating tables, joining by code, and issuing server access tickets.',
    },
    characters: {
      eyebrow: 'Debug',
      title: 'Character tools',
      copy: 'Use the current development character flows for saved sheets and session attachments.',
    },
    'admin-users': {
      eyebrow: 'Debug',
      title: 'User access tools',
      copy: 'Grant or remove roles by email and inspect workspace membership from the current admin debug view.',
    },
    'admin-packs': {
      eyebrow: 'Debug',
      title: 'Content pack tools',
      copy: 'Use the internal pack registry view for uploads, visibility, and activation settings.',
    },
  } satisfies Record<WorkspacePage, { eyebrow: string; title: string; copy: string }>

  async function handleRoleMutation(mode: 'grant' | 'revoke') {
    const normalizedEmail = roleEmail.trim().toLowerCase()

    if (!normalizedEmail) {
      setRoleError('Enter a user email before changing roles.')
      return
    }

    setRoleError(null)
    setIsManagingRoles(true)

    try {
      const payload = {
        email: normalizedEmail,
        role: roleToManage,
        scope: roleScope,
      }

      if (mode === 'grant') {
        await grantRoleByEmail(payload)
      } else {
        await revokeRoleByEmail(payload)
      }
    } catch (mutationError) {
      console.error(mutationError)
      setRoleError(
        mode === 'grant'
          ? 'Role update failed. The target user may not exist yet.'
          : 'Role removal failed. The last global admin cannot remove their own admin access.',
      )
    }

    setIsManagingRoles(false)
  }

  async function handleDungeonFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    const payload = await file.text()

    if (!isPortableDungeonPayload(payload)) {
      setDungeonError('This file does not look like a portable DungeonPlanner dungeon export.')
      setDungeonNotice(null)
      return
    }

    setSelectedDungeonId(null)
    setDraftSerializedDungeon(payload)
    setDraftTitle(inferDungeonTitle(payload, file.name.replace(/\.[^.]+$/, '') || 'Imported Dungeon'))
    setDraftDescription('')
    setDungeonError(null)
    setDungeonNotice('Imported portable dungeon JSON into the local draft. Save it when you want a durable library record.')
  }

  function handleLoadSavedDungeon() {
    if (!selectedDungeon) {
      return
    }

    setDraftTitle(selectedDungeon.title)
    setDraftDescription(selectedDungeon.description ?? '')
    setDraftSerializedDungeon(selectedDungeon.serializedDungeon)
    setDungeonError(null)
    setDungeonNotice(`Loaded "${selectedDungeon.title}" into your draft.`)
  }

  async function handleSaveDungeon() {
    const normalizedTitle = draftTitle.trim()
    const normalizedPayload = draftSerializedDungeon.trim()

    if (!normalizedTitle) {
      setDungeonError('Give the dungeon a title before saving it.')
      setDungeonNotice(null)
      return
    }

    if (!isPortableDungeonPayload(normalizedPayload)) {
      setDungeonError('Save expects the existing portable dungeon JSON format. Import or paste a valid export first.')
      setDungeonNotice(null)
      return
    }

    setDungeonError(null)
    setDungeonNotice(null)
    setIsSavingDungeon(true)

    try {
      const savedId = await saveDungeon({
        dungeonId: selectedDungeonId ?? undefined,
        title: normalizedTitle,
        description: draftDescription.trim() || undefined,
        serializedDungeon: normalizedPayload,
      })

      setSelectedDungeonId(savedId)
      setDraftTitle(normalizedTitle)
      setDraftSerializedDungeon(normalizedPayload)
      setDungeonNotice(selectedDungeonId ? 'Updated the saved dungeon.' : 'Saved a new dungeon.')
    } catch (mutationError) {
      console.error(mutationError)
      setDungeonError('Saving the dungeon failed. Make sure this account can still manage dungeons.')
    }

    setIsSavingDungeon(false)
  }

  function handleDownloadDraft() {
    const normalizedTitle = draftTitle.trim() || 'dungeon'
    const blob = new Blob([draftSerializedDungeon], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${normalizedTitle.replace(/[^a-z0-9]/gi, '_')}.dungeon.json`
    anchor.click()
    URL.revokeObjectURL(url)
  }

  function handleNewDraft() {
    setSelectedDungeonId(null)
    setDraftTitle('')
    setDraftDescription('')
    setDraftSerializedDungeon('')
    setDungeonError(null)
    setDungeonNotice('Started a fresh local draft with no linked saved record.')
  }

  function handleNewCharacterDraft() {
    setSelectedCharacterId(null)
    setCharacterName('')
    setCharacterContentRef('')
    setCharacterSheet('{\n  "notes": ""\n}')
    setCharacterError(null)
    setCharacterNotice('Started a fresh character draft.')
  }

  async function handleCreateSession() {
    const normalizedTitle = sessionTitle.trim()

    if (!normalizedTitle) {
      setSessionError('Give the session a title before creating it.')
      setSessionNotice(null)
      return
    }

    setIsWorkingSession(true)
    setSessionError(null)
    setSessionNotice(null)

    try {
      const createdSession = await createSession({
        title: normalizedTitle,
      })

      setSelectedSessionId(createdSession.sessionId)
      setSessionTitle('')
      setSessionJoinCode(createdSession.joinCode)
      setSessionNotice(`Created "${normalizedTitle}" with join code ${createdSession.joinCode}.`)
    } catch (mutationError) {
      console.error(mutationError)
      setSessionError('Session creation failed. Only DMs can create sessions.')
    }

    setIsWorkingSession(false)
  }

  async function handleJoinSession() {
    const normalizedJoinCode = sessionJoinCode.trim().toUpperCase()

    if (!normalizedJoinCode) {
      setSessionError('Enter a join code first.')
      setSessionNotice(null)
      return
    }

    setIsWorkingSession(true)
    setSessionError(null)
    setSessionNotice(null)

    try {
      const joinedSession = await joinSessionByCode({
        joinCode: normalizedJoinCode,
      })

      setSelectedSessionId(joinedSession.sessionId)
      setSessionJoinCode(joinedSession.joinCode)
      setSessionNotice(`Joined "${joinedSession.title}".`)
    } catch (mutationError) {
      console.error(mutationError)
      setSessionError('That join code is invalid or no longer active.')
    }

    setIsWorkingSession(false)
  }

  async function handleIssueSessionAccessTicket() {
    if (!selectedSessionId) {
      return
    }

    setIsWorkingSession(true)
    setSessionError(null)
    setSessionNotice(null)

    try {
      const payload = await issueServerAccessTicket({
        sessionId: selectedSessionId,
      })

      setSessionAccessPayload(payload)
      setSessionNotice('Created a short-lived session access token.')
    } catch (mutationError) {
      console.error(mutationError)
      setSessionError('Could not create an access token for this session.')
    }

    setIsWorkingSession(false)
  }

  function handleLoadCharacter() {
    if (!selectedCharacter) {
      return
    }

    setCharacterName(selectedCharacter.name)
    setCharacterContentRef(selectedCharacter.contentRef ?? '')
    setCharacterSheet(JSON.stringify(selectedCharacter.sheet, null, 2))
    setCharacterError(null)
    setCharacterNotice(`Loaded "${selectedCharacter.name}" into the local character draft.`)
  }

  async function handleSaveCharacter() {
    const normalizedName = characterName.trim()

    if (!normalizedName) {
      setCharacterError('Give the character a name before saving.')
      setCharacterNotice(null)
      return
    }

    let parsedSheet: unknown

    try {
      parsedSheet = JSON.parse(characterSheet)
    } catch {
      setCharacterError('Character sheet JSON must be valid before saving.')
      setCharacterNotice(null)
      return
    }

    setIsWorkingCharacter(true)
    setCharacterError(null)
    setCharacterNotice(null)

    try {
      const savedCharacterId = await saveCharacter({
        characterId: selectedCharacterId ?? undefined,
        name: normalizedName,
        contentRef: characterContentRef.trim() || undefined,
        sheet: parsedSheet,
      })

      setSelectedCharacterId(savedCharacterId)
      setCharacterName(normalizedName)
      setCharacterNotice(selectedCharacterId ? 'Updated the character record.' : 'Saved a new character record.')
    } catch (mutationError) {
      console.error(mutationError)
      setCharacterError('Saving the character failed.')
    }

    setIsWorkingCharacter(false)
  }

  async function handleDeleteCharacter() {
    if (!selectedCharacterId) {
      return
    }

    setIsWorkingCharacter(true)
    setCharacterError(null)
    setCharacterNotice(null)

    try {
      await deleteCharacter({
        characterId: selectedCharacterId,
      })

      handleNewCharacterDraft()
      setCharacterNotice('Deleted the selected character record.')
    } catch (mutationError) {
      console.error(mutationError)
      setCharacterError('Deleting the character failed.')
    }

    setIsWorkingCharacter(false)
  }

  async function handleAttachCharacterToSession() {
    if (!selectedCharacterId || !selectedSessionId) {
      return
    }

    setIsWorkingCharacter(true)
    setCharacterError(null)
    setCharacterNotice(null)

    try {
      await attachCharacterToSession({
        sessionId: selectedSessionId,
        characterId: selectedCharacterId,
      })

      setCharacterNotice('Attached the selected character to the selected session record.')
    } catch (mutationError) {
      console.error(mutationError)
      setCharacterError('Attaching the character to the selected session failed.')
    }

    setIsWorkingCharacter(false)
  }

  function handleNewPackDraft() {
    setSelectedPackRecordId(null)
    setPackIdDraft('')
    setPackNameDraft('')
    setPackKindDraft('asset')
    setPackVersionDraft('0.1.0')
    setPackVisibilityDraft('public')
    setPackIsActiveDraft(true)
    setPackDescriptionDraft('')
    setPackEntriesJson(DEFAULT_PACK_ENTRIES_JSON)
    setPackDefaultRefsJson(DEFAULT_PACK_DEFAULT_REFS_JSON)
    setManifestFile(null)
    setThumbnailFile(null)
    setManifestStorageId(null)
    setThumbnailStorageId(null)
    setPackError(null)
    setPackNotice('Started a fresh pack draft.')
  }

  function hydratePackDraft(record: NonNullable<typeof packRecords>[number]) {
    setSelectedPackRecordId(record._id)
    setPackIdDraft(record.packId)
    setPackNameDraft(record.name)
    setPackKindDraft(record.kind)
    setPackVersionDraft(record.version)
    setPackVisibilityDraft(record.visibility)
    setPackIsActiveDraft(record.isActive)
    setPackDescriptionDraft(record.description ?? '')
    setPackEntriesJson(JSON.stringify(record.entries, null, 2))
    setPackDefaultRefsJson(JSON.stringify(record.defaultAssetRefs ?? {}, null, 2))
    setManifestFile(null)
    setThumbnailFile(null)
    setManifestStorageId(record.manifestStorageId)
    setThumbnailStorageId(record.thumbnailStorageId)
    setPackError(null)
    setPackNotice(`Loaded "${record.name}" into the pack draft.`)
  }

  async function uploadPackFile(file: File) {
    const uploadUrl = await generatePackUploadUrl()
    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    })

    if (!response.ok) {
      throw new Error('Pack file upload failed.')
    }

    const payload = (await response.json()) as { storageId: Id<'_storage'> }
    return payload.storageId
  }

  async function handleSavePack() {
    const normalizedPackId = packIdDraft.trim()
    const normalizedName = packNameDraft.trim()
    const normalizedVersion = packVersionDraft.trim()

    if (!normalizedPackId || !normalizedName || !normalizedVersion) {
      setPackError('Pack ID, name, and version are required before saving.')
      setPackNotice(null)
      return
    }

    let parsedEntries: unknown
    let parsedDefaultRefs: unknown

    try {
      parsedEntries = JSON.parse(packEntriesJson)
      parsedDefaultRefs = JSON.parse(packDefaultRefsJson)
    } catch {
      setPackError('Pack entries JSON and default refs JSON must both be valid JSON.')
      setPackNotice(null)
      return
    }

    setIsWorkingPacks(true)
    setPackError(null)
    setPackNotice(null)

    try {
      const entriesForMutation = Array.isArray(parsedEntries)
        ? parsedEntries.map((entry) => ({
            id: typeof entry?.id === 'string' ? entry.id : '',
            localId: typeof entry?.localId === 'string' ? entry.localId : '',
            name: typeof entry?.name === 'string' ? entry.name : '',
            entryKind: entry?.entryKind === 'rules-data' ? ('rules-data' as const) : ('scene-asset' as const),
            category: typeof entry?.category === 'string' ? entry.category : '',
            assetFileRef: typeof entry?.assetFileRef === 'string' ? entry.assetFileRef : undefined,
            thumbnailFileRef: typeof entry?.thumbnailFileRef === 'string' ? entry.thumbnailFileRef : undefined,
            placement: typeof entry?.placement === 'object' && entry.placement !== null ? entry.placement : undefined,
            browser: typeof entry?.browser === 'object' && entry.browser !== null ? entry.browser : undefined,
            light: typeof entry?.light === 'object' && entry.light !== null ? entry.light : undefined,
            effects: Array.isArray(entry?.effects) ? entry.effects : undefined,
          }))
        : []
      const nextManifestStorageId = manifestFile ? await uploadPackFile(manifestFile) : manifestStorageId ?? undefined
      const nextThumbnailStorageId = thumbnailFile ? await uploadPackFile(thumbnailFile) : thumbnailStorageId ?? undefined

      const savedPackRecordId = await savePackRecord({
        packRecordId: selectedPackRecordId ?? undefined,
        packId: normalizedPackId,
        name: normalizedName,
        kind: packKindDraft,
        version: normalizedVersion,
        visibility: packVisibilityDraft,
        description: packDescriptionDraft.trim() || undefined,
        isActive: packVisibilityDraft === 'global' ? true : packIsActiveDraft,
        manifestStorageId: nextManifestStorageId,
        thumbnailStorageId: nextThumbnailStorageId,
        defaultAssetRefs: parsedDefaultRefs as {
          floor?: string
          wall?: string
          opening?: string
          prop?: string
          player?: string
        },
        entries: entriesForMutation,
      })

      setSelectedPackRecordId(savedPackRecordId)
      setManifestStorageId(nextManifestStorageId ?? null)
      setThumbnailStorageId(nextThumbnailStorageId ?? null)
      setManifestFile(null)
      setThumbnailFile(null)
      setPackNotice(selectedPackRecordId ? 'Updated the pack registry record.' : 'Saved a new pack registry record.')
    } catch (mutationError) {
      console.error(mutationError)
      setPackError('Saving the pack failed. Check the canonical metadata JSON and admin permissions.')
    }

    setIsWorkingPacks(false)
  }

  async function handleTogglePackActive() {
    if (!selectedPackRecordId || !selectedPackRecord) {
      return
    }

    setIsWorkingPacks(true)
    setPackError(null)
    setPackNotice(null)

    try {
      await setPackActive({
        packRecordId: selectedPackRecordId,
        isActive: !selectedPackRecord.isActive,
      })

      setPackIsActiveDraft(!selectedPackRecord.isActive)
      setPackNotice(`${selectedPackRecord.isActive ? 'Deactivated' : 'Activated'} "${selectedPackRecord.name}".`)
    } catch (mutationError) {
      console.error(mutationError)
      setPackError('Updating the pack activation state failed.')
    }

    setIsWorkingPacks(false)
  }

  return (
    <>
      <section className="signed-in-card signed-in-card--overview" aria-labelledby="signed-in-title">
        <div>
          <p className="app-shell__eyebrow">Your table</p>
          <h2 className="panel__title" id="signed-in-title">
            {identity.viewer?.name ?? identity.viewer?.email ?? 'DungeonPlanner user'}
          </h2>
          <p className="panel__copy">Welcome back. Your private workspace is ready when you are.</p>
        </div>

        <div className="signed-in-card__meta">
          <div>
            <p className="status-card__label">Workspace</p>
            <p className="status-card__value">{identity.workspace?.name ?? 'Loading your table...'}</p>
          </div>
          <div>
            <p className="status-card__label">Roles</p>
            <div className="role-badges" aria-label="Current roles">
              {identity.roles.length > 0 ? (
                identity.roles.map((role: PlatformRole) => (
                  <span className="role-badge" key={role}>
                    {role}
                  </span>
                ))
              ) : (
                <span className="role-badge role-badge--muted">provisioning</span>
              )}
            </div>
          </div>
          <button className="hero-panel__button hero-panel__button--secondary" onClick={() => void signOut()} type="button">
            Sign out
          </button>
        </div>
      </section>

      <nav className="workspace-nav" aria-label="Workspace pages">
        {workspaceNavItems.map((item) => (
          <a
            className={`workspace-nav__link ${activePage === item.id ? 'workspace-nav__link--active' : ''}`}
            href={item.href}
            key={item.id}
          >
            {item.label}
          </a>
        ))}
      </nav>

      {canAccessDevMenu && (activePage === 'dev' || isDevWorkspacePage(activePage)) ? (
        <nav className="workspace-nav workspace-nav--nested" aria-label="Dev pages">
          <a className={`workspace-nav__link ${activePage === 'dev' ? 'workspace-nav__link--active' : ''}`} href="#/app/dev">
            Dev Home
          </a>
          {devNavItems.map((item) => (
            <a
              className={`workspace-nav__link ${activePage === item.id ? 'workspace-nav__link--active' : ''}`}
              href={item.href}
              key={item.id}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}

      {activePage === 'overview' ? (
        <section className="panels" aria-label="Workspace overview">
          {canAccessDungeonLibrary ? (
            <article className="status-card overview-card">
              <p className="status-card__label">Dungeon Library</p>
              <p className="status-card__value">{libraryRecords?.length ?? 0} saved</p>
              <p className="status-card__copy">Build dungeons for yourself, keep them private, and load any draft back into editing.</p>
              <a className="hero-panel__button hero-panel__button--secondary" href="#/app/library">
                Open Dungeon Library
              </a>
            </article>
          ) : null}
          <article className="status-card overview-card">
            <p className="status-card__label">Roles</p>
            <p className="status-card__value">{identity.roles.length > 0 ? identity.roles.join(', ') : 'provisioning'}</p>
            <p className="status-card__copy">
              Everyone can build private dungeons. Dungeon master tools stay limited to users with DM access.
            </p>
          </article>
        </section>
      ) : (
        <section className="page-header" aria-labelledby="workspace-page-title">
          <p className="panel__eyebrow">{pageIntro[activePage].eyebrow}</p>
          <h2 className="panel__title" id="workspace-page-title">
            {pageIntro[activePage].title}
          </h2>
          <p className="panel__copy">{pageIntro[activePage].copy}</p>
        </section>
      )}

      {!identity.access.canManageDungeons &&
      !identity.access.canManageSessions &&
      !identity.access.canManagePacks &&
      activePage === 'overview' ? (
        <section className="signed-in-card">
          <div>
            <p className="app-shell__eyebrow">Player access</p>
            <h2 className="panel__title">Your workspace is open</h2>
            <p className="panel__copy">Start building private dungeons now. Session-running tools appear when your access expands.</p>
          </div>
        </section>
      ) : null}

      <section className="panels" aria-label="Authenticated product modules">
        {activePage === 'dev' ? (
          <article className="panel panel--library">
            <p className="panel__eyebrow">Development</p>
            <h2 className="panel__title">Hidden development views</h2>
            <p className="panel__copy">
              These screens stay tucked behind the debug shortcut so the main product surface can stay focused on player-facing workflows.
            </p>

            <div className="panels">
              {devNavItems.map((item) => (
                <article className="status-card overview-card" key={item.id}>
                  <p className="status-card__label">{item.label}</p>
                  <p className="status-card__value">
                    {item.id === 'sessions'
                      ? `${sessionRecords?.length ?? 0} active`
                      : item.id === 'characters'
                        ? `${characterRecords?.length ?? 0} ready`
                        : item.id === 'admin-users'
                          ? `${workspaceMembers?.length ?? 0} visible`
                          : `${packRecords?.length ?? 0} registered`}
                  </p>
                  <p className="status-card__copy">
                    {item.id === 'sessions'
                      ? 'Open the current session creation, join, and access-ticket view.'
                      : item.id === 'characters'
                        ? 'Open the current character library and session-attachment view.'
                        : item.id === 'admin-users'
                          ? 'Open the current role and workspace membership management view.'
                          : 'Open the current pack upload and activation management view.'}
                  </p>
                  <a className="hero-panel__button hero-panel__button--secondary" href={item.href}>
                    Open {item.label}
                  </a>
                </article>
              ))}
            </div>
          </article>
        ) : null}

        {activePage === 'library' && canAccessDungeonLibrary ? (
          <article className="panel panel--library">
            <p className="panel__eyebrow">Dungeon Library</p>
            <h2 className="panel__title">Saved dungeons</h2>
            <p className="panel__copy">
              Keep portable dungeon exports in your private library and load them back into your draft whenever you need them.
            </p>

            <div className={`library-sync-state library-sync-state--${syncState.tone}`}>
              <div>
                <p className="status-card__label">Draft status</p>
                <p className="library-sync-state__title">{syncState.label}</p>
              </div>
              <p className="panel__copy">{syncState.detail}</p>
            </div>

            <div className="library-grid">
              <section className="library-card">
                <div className="library-card__header">
                  <div>
                    <p className="status-card__label">Saved records</p>
                    <h3 className="library-card__title">Dungeon library</h3>
                  </div>
                  <button className="hero-panel__button hero-panel__button--secondary" onClick={handleNewDraft} type="button">
                    New local draft
                  </button>
                </div>

                {libraryRecords && libraryRecords.length > 0 ? (
                  <div className="library-records">
                    {libraryRecords.map((record) => (
                      <button
                        className={`library-record ${selectedDungeonId === record._id ? 'library-record--selected' : ''}`}
                        key={record._id}
                        onClick={() => {
                          setSelectedDungeonId(record._id)
                          setDungeonError(null)
                          setDungeonNotice(`Selected "${record.title}" from your library.`)
                        }}
                        type="button"
                      >
                        <div>
                          <p className="library-record__title">{record.title}</p>
                          <p className="panel__copy">{record.description ?? 'No description yet.'}</p>
                        </div>
                        <p className="library-record__meta">Updated {new Date(record.updatedAt).toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="panel__copy">No dungeons have been saved here yet.</p>
                )}

                <div className="library-card__actions">
                  <button
                    className="hero-panel__button hero-panel__button--secondary"
                    disabled={!selectedDungeon}
                    onClick={handleLoadSavedDungeon}
                    type="button"
                  >
                    Load selected into draft
                  </button>
                </div>
              </section>

              <section className="library-card">
                <div className="library-card__header">
                  <div>
                    <p className="status-card__label">Local draft</p>
                    <h3 className="library-card__title">Manual save and load</h3>
                  </div>
                  <label className="hero-panel__button hero-panel__button--secondary library-import-button">
                    Import dungeon file
                    <input accept=".json,.dungeon.json" hidden onChange={(event) => void handleDungeonFileImport(event)} type="file" />
                  </label>
                </div>

                <label className="auth-card__field">
                  <span>Title</span>
                  <input onChange={(event) => setDraftTitle(event.target.value)} placeholder="Sunken Keep" type="text" value={draftTitle} />
                </label>

                <label className="auth-card__field">
                  <span>Description</span>
                  <input
                    onChange={(event) => setDraftDescription(event.target.value)}
                    placeholder="Latest manual save for tonight's crawl"
                    type="text"
                    value={draftDescription}
                  />
                </label>

                <label className="auth-card__field">
                  <span>Portable dungeon JSON</span>
                  <textarea
                    className="library-editor"
                    onChange={(event) => setDraftSerializedDungeon(event.target.value)}
                    placeholder='Paste a portable dungeon export, e.g. {"version":1,"name":"Sunken Keep",...}'
                    rows={14}
                    value={draftSerializedDungeon}
                  />
                </label>

                {dungeonError ? <p className="auth-card__error">{dungeonError}</p> : null}
                {dungeonNotice ? <p className="library-notice">{dungeonNotice}</p> : null}

                <div className="library-card__actions">
                  <button
                    className="hero-panel__button hero-panel__button--primary"
                    disabled={isSavingDungeon}
                    onClick={() => void handleSaveDungeon()}
                    type="button"
                  >
                    {isSavingDungeon ? 'Saving...' : selectedDungeonId ? 'Update saved record' : 'Save as new record'}
                  </button>
                  <button
                    className="hero-panel__button hero-panel__button--secondary"
                    disabled={!draftSerializedDungeon.trim()}
                    onClick={handleDownloadDraft}
                    type="button"
                  >
                    Download draft JSON
                  </button>
                </div>
              </section>
            </div>
          </article>
        ) : null}

        {activePage === 'sessions' ? (
          <article className="panel panel--sessions">
          <p className="panel__eyebrow">Sessions</p>
          <h2 className="panel__title">Tables, invites, and access</h2>
          <p className="panel__copy">
            Create sessions, share join codes, and keep each table ready for play.
          </p>

          <div className="library-grid">
            <section className="library-card">
                <div className="library-card__header">
                  <div>
                    <p className="status-card__label">Create or join</p>
                    <h3 className="library-card__title">Session setup</h3>
                  </div>
                </div>

              {identity.access.canManageSessions ? (
                <label className="auth-card__field">
                  <span>New session title</span>
                  <input
                    onChange={(event) => setSessionTitle(event.target.value)}
                    placeholder="Friday delve"
                    type="text"
                    value={sessionTitle}
                  />
                </label>
              ) : null}

              <label className="auth-card__field">
                <span>Join code</span>
                <input
                  onChange={(event) => setSessionJoinCode(event.target.value)}
                  placeholder="ABC123"
                  type="text"
                  value={sessionJoinCode}
                />
              </label>

              {sessionError ? <p className="auth-card__error">{sessionError}</p> : null}
              {sessionNotice ? <p className="library-notice">{sessionNotice}</p> : null}

              <div className="library-card__actions">
                {identity.access.canManageSessions ? (
                  <button
                    className="hero-panel__button hero-panel__button--primary"
                    disabled={isWorkingSession}
                    onClick={() => void handleCreateSession()}
                    type="button"
                  >
                    Create session
                  </button>
                ) : null}
                <button
                  className="hero-panel__button hero-panel__button--secondary"
                  disabled={isWorkingSession}
                  onClick={() => void handleJoinSession()}
                  type="button"
                >
                  Join by code
                </button>
              </div>
            </section>

            <section className="library-card">
              <div className="library-card__header">
                <div>
                  <p className="status-card__label">Accessible sessions</p>
                  <h3 className="library-card__title">Membership records</h3>
                </div>
              </div>

              {sessionRecords && sessionRecords.length > 0 ? (
                <div className="library-records">
                  {sessionRecords.map((session) => (
                    <button
                      className={`library-record ${selectedSessionId === session._id ? 'library-record--selected' : ''}`}
                      key={session._id}
                      onClick={() => {
                        setSelectedSessionId(session._id)
                        setSessionAccessPayload(null)
                        setSessionJoinCode(session.joinCode)
                        setSessionNotice(`Selected "${session.title}".`)
                        setSessionError(null)
                      }}
                      type="button"
                    >
                      <div>
                        <p className="library-record__title">{session.title}</p>
                        <p className="panel__copy">
                          {session.status} · {session.memberCount} member{session.memberCount === 1 ? '' : 's'}
                        </p>
                      </div>
                      <p className="library-record__meta">Join code {session.joinCode}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="panel__copy">You are not a member of any sessions here yet.</p>
              )}

              <div className="library-card__actions">
                <button
                  className="hero-panel__button hero-panel__button--secondary"
                  disabled={!selectedSessionId || isWorkingSession}
                  onClick={() => void handleIssueSessionAccessTicket()}
                  type="button"
                >
                  Create access token
                </button>
              </div>

              {selectedSession ? (
                <div className="session-summary">
                  <p className="status-card__label">Selected session</p>
                  <p className="library-card__title">{selectedSession.title}</p>
                  <p className="panel__copy">Share join code <strong>{selectedSession.joinCode}</strong> with your players.</p>
                  {sessionPackRecords ? (
                    <p className="panel__copy">
                      Active session packs:{' '}
                      {sessionPackRecords.length > 0
                        ? sessionPackRecords.map((pack) => pack.packId).join(', ')
                        : 'none'}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {sessionAccessPayload ? (
                <label className="auth-card__field">
                  <span>Session access token</span>
                  <textarea
                    className="library-editor"
                    readOnly
                    rows={8}
                    value={JSON.stringify(sessionAccessPayload, null, 2)}
                  />
                </label>
              ) : null}
            </section>
          </div>
        </article>
        ) : null}

        {activePage === 'characters' && identity.access.canUseCharacterLibrary ? (
          <article className="panel panel--characters">
            <p className="panel__eyebrow">Characters</p>
            <h2 className="panel__title">Character library</h2>
            <p className="panel__copy">
              Keep reusable character sheets ready for every session and connect them when it is time to play.
            </p>

            <div className="library-grid">
              <section className="library-card">
                <div className="library-card__header">
                  <div>
                    <p className="status-card__label">Owned characters</p>
                    <h3 className="library-card__title">Library records</h3>
                  </div>
                  <button className="hero-panel__button hero-panel__button--secondary" onClick={handleNewCharacterDraft} type="button">
                    New character
                  </button>
                </div>

                {characterRecords && characterRecords.length > 0 ? (
                  <div className="library-records">
                    {characterRecords.map((character) => (
                      <button
                        className={`library-record ${selectedCharacterId === character._id ? 'library-record--selected' : ''}`}
                        key={character._id}
                        onClick={() => {
                          setSelectedCharacterId(character._id)
                          setCharacterNotice(`Selected "${character.name}".`)
                          setCharacterError(null)
                        }}
                        type="button"
                      >
                        <div>
                          <p className="library-record__title">{character.name}</p>
                          <p className="panel__copy">{character.contentRef ?? 'No content reference yet.'}</p>
                        </div>
                        <p className="library-record__meta">Updated {new Date(character.updatedAt).toLocaleString()}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="panel__copy">No character records have been saved for this user yet.</p>
                )}

                <div className="library-card__actions">
                  <button
                    className="hero-panel__button hero-panel__button--secondary"
                    disabled={!selectedCharacter}
                    onClick={handleLoadCharacter}
                    type="button"
                  >
                    Load selected into draft
                  </button>
                </div>
              </section>

              <section className="library-card">
                <div className="library-card__header">
                  <div>
                    <p className="status-card__label">Local draft</p>
                    <h3 className="library-card__title">Character editor</h3>
                  </div>
                </div>

                <label className="auth-card__field">
                  <span>Name</span>
                  <input
                    onChange={(event) => setCharacterName(event.target.value)}
                    placeholder="Lysander"
                    type="text"
                    value={characterName}
                  />
                </label>

                <label className="auth-card__field">
                  <span>Content reference</span>
                  <input
                    onChange={(event) => setCharacterContentRef(event.target.value)}
                    placeholder="dragonbane-core:hero"
                    type="text"
                    value={characterContentRef}
                  />
                </label>

                <label className="auth-card__field">
                  <span>Character sheet JSON</span>
                  <textarea
                    className="library-editor"
                    onChange={(event) => setCharacterSheet(event.target.value)}
                    rows={12}
                    value={characterSheet}
                  />
                </label>

                {characterError ? <p className="auth-card__error">{characterError}</p> : null}
                {characterNotice ? <p className="library-notice">{characterNotice}</p> : null}

                <div className="library-card__actions">
                  <button
                    className="hero-panel__button hero-panel__button--primary"
                    disabled={isWorkingCharacter}
                    onClick={() => void handleSaveCharacter()}
                    type="button"
                  >
                    {selectedCharacterId ? 'Update character' : 'Save character'}
                  </button>
                  <button
                    className="hero-panel__button hero-panel__button--secondary"
                    disabled={!selectedCharacterId || isWorkingCharacter}
                    onClick={() => void handleDeleteCharacter()}
                    type="button"
                  >
                    Delete character
                  </button>
                </div>

                <div className="library-card__actions">
                  <button
                    className="hero-panel__button hero-panel__button--secondary"
                    disabled={!selectedCharacterId || !selectedSessionId || isWorkingCharacter}
                    onClick={() => void handleAttachCharacterToSession()}
                    type="button"
                  >
                    Attach to selected session
                  </button>
                </div>
              </section>
            </div>
          </article>
        ) : null}

        {activePage === 'admin-packs' && identity.access.canManagePacks ? (
          <article className="panel panel--packs">
            <p className="panel__eyebrow">Admin</p>
            <h2 className="panel__title">Content packs</h2>
            <p className="panel__copy">
              Keep your pack catalog organized, set defaults, and control what your group can use.
            </p>

            <div className="library-grid">
              <section className="library-card">
                <div className="library-card__header">
                  <div>
                    <p className="status-card__label">Registry records</p>
                    <h3 className="library-card__title">Available packs</h3>
                  </div>
                  <button className="hero-panel__button hero-panel__button--secondary" onClick={handleNewPackDraft} type="button">
                    New pack
                  </button>
                </div>

                {packRecords && packRecords.length > 0 ? (
                  <div className="library-records">
                    {packRecords.map((pack) => (
                      <button
                        className={`library-record ${selectedPackRecordId === pack._id ? 'library-record--selected' : ''}`}
                        key={pack._id}
                        onClick={() => hydratePackDraft(pack)}
                        type="button"
                      >
                        <div>
                          <p className="library-record__title">{pack.name}</p>
                          <p className="panel__copy">
                            {pack.packId} · {pack.kind} · {pack.visibility} · {pack.isActive ? 'active' : 'inactive'}
                          </p>
                        </div>
                        <p className="library-record__meta">{pack.entries.length} canonical entr{pack.entries.length === 1 ? 'y' : 'ies'}</p>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="panel__copy">No packs have been registered yet.</p>
                )}
              </section>

              <section className="library-card">
                <div className="library-card__header">
                  <div>
                    <p className="status-card__label">Canonical draft</p>
                    <h3 className="library-card__title">Pack metadata editor</h3>
                  </div>
                </div>

                <div className="role-manager">
                  <label className="auth-card__field">
                    <span>Pack ID</span>
                    <input onChange={(event) => setPackIdDraft(event.target.value)} placeholder="dungeon" type="text" value={packIdDraft} />
                  </label>

                  <label className="auth-card__field">
                    <span>Name</span>
                    <input onChange={(event) => setPackNameDraft(event.target.value)} placeholder="Dungeon Core" type="text" value={packNameDraft} />
                  </label>

                  <label className="auth-card__field">
                    <span>Kind</span>
                    <select className="auth-card__select" onChange={(event) => setPackKindDraft(event.target.value as 'asset' | 'rules')} value={packKindDraft}>
                      <option value="asset">asset</option>
                      <option value="rules">rules</option>
                    </select>
                  </label>

                  <label className="auth-card__field">
                    <span>Version</span>
                    <input onChange={(event) => setPackVersionDraft(event.target.value)} placeholder="1.0.0" type="text" value={packVersionDraft} />
                  </label>

                  <label className="auth-card__field">
                    <span>Visibility</span>
                    <select
                      className="auth-card__select"
                      onChange={(event) => setPackVisibilityDraft(event.target.value as 'global' | 'public' | 'private')}
                      value={packVisibilityDraft}
                    >
                      <option value="global">global</option>
                      <option value="public">public</option>
                      <option value="private">private</option>
                    </select>
                  </label>

                  <label className="auth-card__field">
                    <span>Active</span>
                    <select
                      className="auth-card__select"
                      disabled={packVisibilityDraft === 'global'}
                      onChange={(event) => setPackIsActiveDraft(event.target.value === 'true')}
                      value={packVisibilityDraft === 'global' ? 'true' : String(packIsActiveDraft)}
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </label>
                </div>

                <label className="auth-card__field">
                  <span>Description</span>
                  <input
                    onChange={(event) => setPackDescriptionDraft(event.target.value)}
                    placeholder="Core dungeon tiles and openings"
                    type="text"
                    value={packDescriptionDraft}
                  />
                </label>

                <div className="role-manager">
                  <label className="auth-card__field">
                    <span>Manifest file</span>
                    <input
                      onChange={(event) => setManifestFile(event.target.files?.[0] ?? null)}
                      type="file"
                    />
                    <span className="panel__copy">{manifestFile?.name ?? (manifestStorageId ? `Stored: ${manifestStorageId}` : 'Optional')}</span>
                  </label>

                  <label className="auth-card__field">
                    <span>Thumbnail file</span>
                    <input
                      accept="image/*"
                      onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)}
                      type="file"
                    />
                    <span className="panel__copy">{thumbnailFile?.name ?? (thumbnailStorageId ? `Stored: ${thumbnailStorageId}` : 'Optional')}</span>
                  </label>
                </div>

                <label className="auth-card__field">
                  <span>Default asset refs JSON</span>
                  <textarea
                    className="library-editor"
                    onChange={(event) => setPackDefaultRefsJson(event.target.value)}
                    rows={6}
                    value={packDefaultRefsJson}
                  />
                </label>

                <label className="auth-card__field">
                  <span>Canonical entries JSON</span>
                  <textarea
                    className="library-editor"
                    onChange={(event) => setPackEntriesJson(event.target.value)}
                    rows={14}
                    value={packEntriesJson}
                  />
                </label>

                {packError ? <p className="auth-card__error">{packError}</p> : null}
                {packNotice ? <p className="library-notice">{packNotice}</p> : null}

                <div className="library-card__actions">
                  <button
                    className="hero-panel__button hero-panel__button--primary"
                    disabled={isWorkingPacks}
                    onClick={() => void handleSavePack()}
                    type="button"
                  >
                    {selectedPackRecordId ? 'Update pack' : 'Save pack'}
                  </button>
                  <button
                    className="hero-panel__button hero-panel__button--secondary"
                    disabled={!selectedPackRecordId || isWorkingPacks}
                    onClick={() => void handleTogglePackActive()}
                    type="button"
                  >
                    {selectedPackRecord?.isActive ? 'Deactivate pack' : 'Activate pack'}
                  </button>
                </div>

                <p className="panel__copy">
                  Pack-managed references use <code>packId:localId</code> so assets stay tidy across your library.
                </p>
              </section>
            </div>
          </article>
        ) : null}

        {activePage === 'admin-users' && identity.access.canManageUsers ? (
          <section className="auth-card" aria-labelledby="role-manager-title">
          <div className="auth-card__header">
            <p className="app-shell__eyebrow">Admin</p>
            <h2 className="panel__title" id="role-manager-title">
              User access
            </h2>
            <p className="panel__copy">
              Add new users, grant roles by email, and keep the right tools in the right hands.
            </p>
          </div>

          <div className="role-manager">
            <label className="auth-card__field">
              <span>User email</span>
              <input
                autoComplete="email"
                onChange={(event) => setRoleEmail(event.target.value)}
                placeholder="player@example.com"
                type="email"
                value={roleEmail}
              />
            </label>

            <label className="auth-card__field">
              <span>Role</span>
              <select
                className="auth-card__select"
                onChange={(event) => setRoleToManage(event.target.value as PlatformRole)}
                value={roleToManage}
              >
                <option value="player">player</option>
                <option value="dm">dm</option>
                <option value="admin">admin</option>
              </select>
            </label>

            <label className="auth-card__field">
              <span>Scope</span>
              <select
                className="auth-card__select"
                disabled={roleToManage === 'admin'}
                  onChange={(event) => setRoleScope(event.target.value as 'workspace' | 'global')}
                  value={roleToManage === 'admin' ? 'global' : roleScope}
                >
                  <option value="workspace">workspace</option>
                  <option value="global">global</option>
                </select>
              </label>
          </div>

          {roleError ? <p className="auth-card__error">{roleError}</p> : null}

          <div className="auth-card__actions">
            <button
              className="hero-panel__button hero-panel__button--primary"
              disabled={isManagingRoles}
              onClick={() => void handleRoleMutation('grant')}
              type="button"
            >
              Grant role
            </button>
            <button
              className="hero-panel__button hero-panel__button--secondary"
              disabled={isManagingRoles}
              onClick={() => void handleRoleMutation('revoke')}
              type="button"
            >
              Revoke role
            </button>
          </div>

          <div className="workspace-members">
            <p className="status-card__label">Visible users</p>
            {workspaceMembers && workspaceMembers.length > 0 ? (
              <div className="workspace-members__list">
                {workspaceMembers.map((member: { userId: string; name: string | null; email: string | null; roles: PlatformRole[] }) => (
                  <article className="workspace-member" key={member.userId}>
                    <div>
                      <p className="workspace-member__title">{member.name ?? member.email ?? 'Unnamed user'}</p>
                      <p className="panel__copy">{member.email ?? 'No email on file'}</p>
                    </div>
                    <div className="role-badges">
                      {member.roles.length > 0 ? (
                        member.roles.map((role: PlatformRole) => (
                          <span className="role-badge" key={`${member.userId}-${role}`}>
                            {role}
                          </span>
                        ))
                      ) : (
                        <span className="role-badge role-badge--muted">no roles</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="panel__copy">No users are visible here yet.</p>
            )}
          </div>
        </section>
        ) : null}
      </section>
    </>
  )
}

function App() {
  const { isAuthenticated, isLoading } = useConvexAuth()
  const identity = useViewerIdentity()
  const [currentPath, setCurrentPath] = useState(() => readHashPath())
  const [isDevMenuVisible, setIsDevMenuVisible] = useState(false)
  const publicPath = currentPath === '/login' ? '/login' : '/'

  useEffect(() => {
    const syncHashPath = () => {
      setCurrentPath(readHashPath())
    }

    syncHashPath()
    window.addEventListener('hashchange', syncHashPath)

    return () => {
      window.removeEventListener('hashchange', syncHashPath)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !identity.access.isAdmin) {
      setIsDevMenuVisible(false)
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'F12') {
        event.preventDefault()
        setIsDevMenuVisible((current) => !current)
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [identity.access.isAdmin, isAuthenticated])

  const showDevHeaderLink = isAuthenticated && identity.access.isAdmin && isDevMenuVisible

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-inner">
          <a aria-label="DungeonPlanner home" className="brand" href={isAuthenticated ? '#/app' : '#/'}>
            <img alt="DungeonPlanner" className="brand-icon" src="/logo.png" />
          </a>

          <nav aria-label="Main navigation" className="header-nav">
            <a href="https://demo.dungeonplanner.com/" rel="noreferrer" target="_blank">
              Demo
            </a>
            <a href="https://docs.dungeonplanner.com/" rel="noreferrer" target="_blank">
              Docs
            </a>
            <a className="nav-gh" href="https://github.com/finger-gun/DungeonPlanner" rel="noreferrer" target="_blank">
              <GitHubMark />
              GitHub
            </a>
            {showDevHeaderLink ? (
              <a
                className={currentPath.startsWith('/app/dev') ? 'header-nav__link--active' : undefined}
                href="#/app/dev"
              >
                Dev
              </a>
            ) : null}
            <a
              className={
                !isAuthenticated && publicPath === '/login'
                  ? 'header-nav__link--active'
                  : isAuthenticated && currentPath.startsWith('/app') && !currentPath.startsWith('/app/dev')
                    ? 'header-nav__link--active'
                    : undefined
              }
              href={isAuthenticated ? '#/app' : '#/login'}
            >
              {isAuthenticated ? 'Workspace' : 'Login'}
            </a>
          </nav>
        </div>
      </header>

      <main className={`app-shell__main ${!isAuthenticated && publicPath === '/' ? 'app-shell__main--public' : ''}`}>
        {!isAuthenticated ? (
          <>
            {isLoading ? (
              <section className="signed-in-card signed-in-card--loading" aria-live="polite">
                <div>
                  <p className="app-shell__eyebrow">Loading</p>
                  <h2 className="panel__title">Checking your sign-in…</h2>
                  <p className="panel__copy">Just a moment while DungeonPlanner opens your table.</p>
                </div>
              </section>
            ) : publicPath === '/login' ? (
              <section className="login-screen" aria-labelledby="login-screen-title">
                <div className="login-screen__intro">
                  <p className="app-shell__eyebrow">Login</p>
                  <h1 className="panel__title" id="login-screen-title">
                    Welcome back to DungeonPlanner
                  </h1>
                  <p className="panel__copy">Sign in to open your saved dungeons, sessions, characters, and packs.</p>
                </div>
                <PasswordAuthCard />
              </section>
            ) : (
              <PublicLandingScreen />
            )}
          </>
        ) : isLoading ? (
          <section className="signed-in-card signed-in-card--loading" aria-live="polite">
            <div>
              <p className="app-shell__eyebrow">Loading</p>
              <h2 className="panel__title">Opening your table…</h2>
              <p className="panel__copy">Just a moment while DungeonPlanner loads your latest workspace.</p>
            </div>
          </section>
        ) : (
          <SignedInOverview currentPath={currentPath} identity={identity} isDevMenuVisible={isDevMenuVisible} />
        )}

        <footer className="app-shell__footer"></footer>
      </main>
    </div>
  )
}

export default App
