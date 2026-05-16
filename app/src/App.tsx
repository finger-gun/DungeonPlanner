import './App.css'
import { useEffect, useMemo, useState } from 'react'
import { api } from '../convex/_generated/api'
import type { Id } from '../convex/_generated/dataModel'
import { useAuthActions, useBackendAuthState } from './lib/backendAuth'
import { uploadFileThroughBackend, useMutation, useQuery } from './lib/backendData'
import { resolveBackendApiBaseUrl } from './lib/backendAuthApi'
import { useViewerIdentity } from './lib/auth'
import { type PlatformRole } from './lib/roles'
import { buildEditorLaunchUrl, resolveEditorBaseUrl } from './lib/editorLaunch'
import { useAuthenticatedAppState } from './store/useAppStore'
import { DragonbaneCharacterCreator } from './components/DragonbaneCharacterCreator'
import {
  loadBundledPackManifest,
  mergeRuntimeRulesPacks,
  toWorkspaceRulesPackSaveInput,
  useBundledDragonbanePacks,
  type WorkspaceRulesPackRecord,
} from './lib/dragonbanePacks'

type WorkspacePage = 'overview' | 'library' | 'sessions' | 'characters' | 'admin-users' | 'admin-packs'
const GENERATED_CHARACTER_PACK_INDEX_PATH = '/generated-character-packs/index.json'

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

function SignedInOverview({ identity }: { identity: ReturnType<typeof useViewerIdentity> }) {
  const { signOut } = useAuthActions()
  const bundledPackState = useBundledDragonbanePacks()
  const [remotePackUrl, setRemotePackUrl] = useState('')
  const [remotePackError, setRemotePackError] = useState<string | null>(null)
  const [remotePackNotice, setRemotePackNotice] = useState<string | null>(null)
  const [isImportingRemotePack, setIsImportingRemotePack] = useState(false)
  const {
    shell,
    roleManager,
    dungeonLibrary,
    sessionTools,
    packTools,
    setRoleManager,
    setDungeonLibrary,
    setSessionTools,
    setPackTools,
    startNewPackDraft,
    hydratePackDraft,
  } = useAuthenticatedAppState()
  const currentPath = shell.currentPath
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
  const packRecords = useQuery(
    api.packs.listWorkspacePacks,
    identity.access.canManagePacks || identity.access.canUseCharacterLibrary ? {} : 'skip',
  ) as WorkspaceRulesPackRecord[] | undefined
  const grantRoleByEmail = useMutation(api.roles.grantRoleByEmail)
  const revokeRoleByEmail = useMutation(api.roles.revokeRoleByEmail)
  const issueEditorAccessToken = useMutation(api.dungeons.issueEditorAccessToken)
  const copyViewerDungeon = useMutation(api.dungeons.copyViewerDungeon)
  const deleteViewerDungeon = useMutation(api.dungeons.deleteViewerDungeon)
  const createSession = useMutation(api.sessions.createSession)
  const joinSessionByCode = useMutation(api.sessions.joinSessionByCode)
  const issueServerAccessTicket = useMutation(api.sessions.issueServerAccessTicket)
  const savePackRecord = useMutation(api.packs.savePackRecord)
  const setPackActive = useMutation(api.packs.setPackActive)
  const sessionPackRecords = useQuery(
    api.packs.listSessionPacks,
    sessionTools.selectedSessionId ? { sessionId: sessionTools.selectedSessionId } : 'skip',
  )
  const selectedSession = sessionRecords?.find((session) => session._id === sessionTools.selectedSessionId) ?? null
  const selectedPackRecord = packRecords?.find((pack) => pack._id === packTools.selectedPackRecordId) ?? null
  const bundledPacks = bundledPackState.packs
  const bundledRegistry = bundledPackState.registry
  const installedPackById = useMemo(
    () => new Map((packRecords ?? []).map((pack) => [pack.packId, pack])),
    [packRecords],
  )
  const runtimeCharacterPacks = useMemo(
    () => mergeRuntimeRulesPacks(bundledPackState.alwaysActivePacks, packRecords),
    [bundledPackState.alwaysActivePacks, packRecords],
  )
  const dungeonError = dungeonLibrary.error
  const dungeonNotice = dungeonLibrary.notice
  const roleEmail = roleManager.email
  const roleToManage = roleManager.role
  const roleScope = roleManager.scope
  const roleError = roleManager.error
  const isManagingRoles = roleManager.isWorking
  const setRoleEmail = (email: string) => setRoleManager({ email })
  const setRoleToManage = (role: PlatformRole) =>
    setRoleManager({
      role,
      scope: role === 'admin' ? 'global' : roleManager.scope,
    })
  const setRoleScope = (scope: 'workspace' | 'global') => setRoleManager({ scope })
  const sessionTitle = sessionTools.titleDraft
  const sessionJoinCode = sessionTools.joinCodeDraft
  const sessionError = sessionTools.error
  const sessionNotice = sessionTools.notice
  const isWorkingSession = sessionTools.isWorking
  const selectedSessionId = sessionTools.selectedSessionId
  const sessionAccessPayload = sessionTools.accessPayload
  const setSessionTitle = (titleDraft: string) => setSessionTools({ titleDraft })
  const setSessionJoinCode = (joinCodeDraft: string) => setSessionTools({ joinCodeDraft })
  const setSelectedSessionId = (selectedSessionId: Id<'sessions'> | null) => setSessionTools({ selectedSessionId })
  const setSessionAccessPayload = (accessPayload: typeof sessionTools.accessPayload) => setSessionTools({ accessPayload })
  const setSessionNotice = (notice: string | null) => setSessionTools({ notice })
  const setSessionError = (error: string | null) => setSessionTools({ error })
  const selectedPackRecordId = packTools.selectedPackRecordId
  const packIdDraft = packTools.packIdDraft
  const packNameDraft = packTools.nameDraft
  const packKindDraft = packTools.kindDraft
  const packVersionDraft = packTools.versionDraft
  const packVisibilityDraft = packTools.visibilityDraft
  const packIsActiveDraft = packTools.isActiveDraft
  const packDescriptionDraft = packTools.descriptionDraft
  const packEntriesJson = packTools.entriesJsonDraft
  const packDefaultRefsJson = packTools.defaultRefsJsonDraft
  const packDomainsJson = packTools.domainsJsonDraft
  const packSourceProvenanceJson = packTools.sourceProvenanceJsonDraft
  const manifestFile = packTools.manifestFile
  const thumbnailFile = packTools.thumbnailFile
  const manifestStorageId = packTools.manifestStorageId
  const thumbnailStorageId = packTools.thumbnailStorageId
  const packError = packTools.error
  const packNotice = packTools.notice
  const isWorkingPacks = packTools.isWorking
  const setPackIdDraft = (nextPackIdDraft: string) => setPackTools({ packIdDraft: nextPackIdDraft })
  const setPackNameDraft = (nameDraft: string) => setPackTools({ nameDraft })
  const setPackKindDraft = (kindDraft: typeof packTools.kindDraft) => setPackTools({ kindDraft })
  const setPackVersionDraft = (versionDraft: string) => setPackTools({ versionDraft })
  const setPackVisibilityDraft = (visibilityDraft: typeof packTools.visibilityDraft) => setPackTools({ visibilityDraft })
  const setPackIsActiveDraft = (isActiveDraft: boolean) => setPackTools({ isActiveDraft })
  const setPackDescriptionDraft = (descriptionDraft: string) => setPackTools({ descriptionDraft })
  const setManifestFile = (nextManifestFile: File | null) => setPackTools({ manifestFile: nextManifestFile })
  const setThumbnailFile = (nextThumbnailFile: File | null) => setPackTools({ thumbnailFile: nextThumbnailFile })
  const setPackDefaultRefsJson = (defaultRefsJsonDraft: string) => setPackTools({ defaultRefsJsonDraft })
  const setPackEntriesJson = (entriesJsonDraft: string) => setPackTools({ entriesJsonDraft })
  const setPackDomainsJson = (domainsJsonDraft: string) => setPackTools({ domainsJsonDraft })
  const setPackSourceProvenanceJson = (sourceProvenanceJsonDraft: string) => setPackTools({ sourceProvenanceJsonDraft })
  const editorBaseUrl = resolveEditorBaseUrl(window.location, import.meta.env.VITE_EDITOR_URL)
  const backendUrl = resolveBackendApiBaseUrl(window.location, import.meta.env.VITE_BACKEND_URL)
  const requestedPage = getWorkspacePageFromPath(currentPath)
  const workspaceNavItems = [
    { id: 'overview', label: 'Overview', href: '#/app' },
    canAccessDungeonLibrary && { id: 'library', label: 'Dungeon Library', href: '#/app/library' },
    identity.access.canManageSessions && { id: 'sessions', label: 'Sessions', href: '#/app/sessions' },
    identity.access.canUseCharacterLibrary && { id: 'characters', label: 'Characters', href: '#/app/characters' },
    identity.access.canManageUsers && { id: 'admin-users', label: 'Users', href: '#/app/admin/users' },
    identity.access.canManagePacks && { id: 'admin-packs', label: 'Packs', href: '#/app/admin/packs' },
  ].filter((item): item is { id: WorkspacePage; label: string; href: string } => Boolean(item))
  const activePage: WorkspacePage =
    requestedPage === 'library' && canAccessDungeonLibrary
      ? 'library'
      : requestedPage === 'sessions' && identity.access.canManageSessions
        ? 'sessions'
        : requestedPage === 'characters' && identity.access.canUseCharacterLibrary
          ? 'characters'
          : requestedPage === 'admin-users' && identity.access.canManageUsers
            ? 'admin-users'
            : requestedPage === 'admin-packs' && identity.access.canManagePacks
              ? 'admin-packs'
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
      copy: 'Open your private dungeon maps in the editor, duplicate a draft, or remove the ones you no longer need.',
    },
    sessions: {
      eyebrow: 'Sessions',
      title: 'Session tools',
      copy: 'Create tables, join by code, and issue server access tickets.',
    },
    characters: {
      eyebrow: 'Characters',
      title: 'Character library',
      copy: 'Create Dragonbane characters and manage saved standees for play.',
    },
    'admin-users': {
      eyebrow: 'Admin',
      title: 'User access tools',
      copy: 'Grant or remove roles by email and inspect workspace membership.',
    },
    'admin-packs': {
      eyebrow: 'Admin',
      title: 'Content pack tools',
      copy: 'Manage pack uploads, visibility, and activation settings.',
    },
  } satisfies Record<WorkspacePage, { eyebrow: string; title: string; copy: string }>

  async function handleRoleMutation(mode: 'grant' | 'revoke') {
    const normalizedEmail = roleManager.email.trim().toLowerCase()

    if (!normalizedEmail) {
      setRoleManager({ error: 'Enter a user email before changing roles.' })
      return
    }

    setRoleManager({ error: null, isWorking: true })

    try {
      const payload = {
        email: normalizedEmail,
        role: roleManager.role,
        scope: roleManager.scope,
      }

      if (mode === 'grant') {
        await grantRoleByEmail(payload)
      } else {
        await revokeRoleByEmail(payload)
      }
    } catch (mutationError) {
      console.error(mutationError)
      setRoleManager({
        error: mode === 'grant'
          ? 'Role update failed. The target user may not exist yet.'
          : 'Role removal failed. The last global admin cannot remove their own admin access.',
      })
    }

    setRoleManager({ isWorking: false })
  }

  async function handleLaunchEditor(dungeonId?: Id<'dungeons'>) {
    if (dungeonId && !backendUrl) {
      setDungeonLibrary({
        error: 'Opening saved dungeons requires a backend connection.',
        notice: null,
      })
      return
    }

    setDungeonLibrary({
      error: null,
      notice: null,
      activeAction: dungeonId ? `open:${dungeonId}` : 'new',
    })

    try {
      if (backendUrl) {
        const access = await issueEditorAccessToken({})

        window.open(
          buildEditorLaunchUrl({
            editorBaseUrl,
            backendUrl,
            accessToken: access.accessToken,
            dungeonId: dungeonId ? String(dungeonId) : undefined,
            generatedPackIndexUrl: new URL(GENERATED_CHARACTER_PACK_INDEX_PATH, backendUrl).toString(),
          }),
          '_blank',
          'noopener,noreferrer',
        )
      } else {
        window.open(buildEditorLaunchUrl({ editorBaseUrl }), '_blank', 'noopener,noreferrer')
      }

      setDungeonLibrary({
        notice: dungeonId ? 'Opened the saved dungeon in the editor.' : 'Opened a fresh editor session.',
      })
    } catch (mutationError) {
      console.error(mutationError)
      setDungeonLibrary({
        error: dungeonId
          ? 'Opening the dungeon in the editor failed.'
          : 'Opening a fresh editor session failed.',
      })
    }

    setDungeonLibrary({ activeAction: null })
  }

  async function handleCopyDungeon(dungeonId: Id<'dungeons'>) {
    setDungeonLibrary({
      error: null,
      notice: null,
      activeAction: `copy:${dungeonId}`,
    })

    try {
      const copiedDungeon = await copyViewerDungeon({ dungeonId })
      setDungeonLibrary({ notice: `Created "${copiedDungeon.title}" in your library.` })
    } catch (mutationError) {
      console.error(mutationError)
      setDungeonLibrary({ error: 'Copying the dungeon failed.' })
    }

    setDungeonLibrary({ activeAction: null })
  }

  async function handleDeleteDungeon(dungeonId: Id<'dungeons'>, title: string) {
    if (!window.confirm(`Delete "${title}" from your dungeon library?`)) {
      return
    }

    setDungeonLibrary({
      error: null,
      notice: null,
      activeAction: `delete:${dungeonId}`,
    })

    try {
      await deleteViewerDungeon({ dungeonId })
      setDungeonLibrary({ notice: `Deleted "${title}" from your library.` })
    } catch (mutationError) {
      console.error(mutationError)
      setDungeonLibrary({ error: 'Deleting the dungeon failed.' })
    }

    setDungeonLibrary({ activeAction: null })
  }

  async function handleCreateSession() {
    const normalizedTitle = sessionTools.titleDraft.trim()

    if (!normalizedTitle) {
      setSessionTools({
        error: 'Give the session a title before creating it.',
        notice: null,
      })
      return
    }

    setSessionTools({
      isWorking: true,
      error: null,
      notice: null,
    })

    try {
      const createdSession = await createSession({
        title: normalizedTitle,
      })

      setSessionTools({
        selectedSessionId: createdSession.sessionId,
        titleDraft: '',
        joinCodeDraft: createdSession.joinCode,
        notice: `Created "${normalizedTitle}" with join code ${createdSession.joinCode}.`,
      })
    } catch (mutationError) {
      console.error(mutationError)
      setSessionTools({ error: 'Session creation failed. Only DMs can create sessions.' })
    }

    setSessionTools({ isWorking: false })
  }

  async function handleJoinSession() {
    const normalizedJoinCode = sessionTools.joinCodeDraft.trim().toUpperCase()

    if (!normalizedJoinCode) {
      setSessionTools({
        error: 'Enter a join code first.',
        notice: null,
      })
      return
    }

    setSessionTools({
      isWorking: true,
      error: null,
      notice: null,
    })

    try {
      const joinedSession = await joinSessionByCode({
        joinCode: normalizedJoinCode,
      })

      setSessionTools({
        selectedSessionId: joinedSession.sessionId,
        joinCodeDraft: joinedSession.joinCode,
        notice: `Joined "${joinedSession.title}".`,
      })
    } catch (mutationError) {
      console.error(mutationError)
      setSessionTools({ error: 'That join code is invalid or no longer active.' })
    }

    setSessionTools({ isWorking: false })
  }

  async function handleIssueSessionAccessTicket() {
    if (!sessionTools.selectedSessionId) {
      return
    }

    setSessionTools({
      isWorking: true,
      error: null,
      notice: null,
    })

    try {
      const payload = await issueServerAccessTicket({
        sessionId: sessionTools.selectedSessionId,
      })

      setSessionTools({
        accessPayload: payload,
        notice: 'Created a short-lived session access token.',
      })
    } catch (mutationError) {
      console.error(mutationError)
      setSessionTools({ error: 'Could not create an access token for this session.' })
    }

    setSessionTools({ isWorking: false })
  }

  function handleNewPackDraft() {
    startNewPackDraft()
  }

  async function uploadPackFile(file: File) {
    const payload = await uploadFileThroughBackend(file) as { storageId: Id<'_storage'> }
    return payload.storageId
  }

  async function installRulesPack(packUrl: string, packRecordId?: Id<'packs'>) {
    const manifest = await loadBundledPackManifest(packUrl)

    return savePackRecord({
      packRecordId,
      ...toWorkspaceRulesPackSaveInput(manifest),
    })
  }

  async function handleInstallBundledPack(packUrl: string, packId: string, name: string) {
    setPackTools({ error: null, notice: null, isWorking: true })
    setRemotePackError(null)
    setRemotePackNotice(null)

    try {
      const existingPackRecord = installedPackById.get(packId)
      await installRulesPack(packUrl, existingPackRecord?._id as Id<'packs'> | undefined)
      setPackTools({ notice: existingPackRecord ? `Updated "${name}" from the bundled manifest.` : `Installed "${name}".` })
    } catch (mutationError) {
      console.error(mutationError)
      setPackTools({ error: `Installing "${name}" failed.` })
    }

    setPackTools({ isWorking: false })
  }

  async function handleInstallRemotePack() {
    const normalizedUrl = remotePackUrl.trim()

    if (!normalizedUrl) {
      setRemotePackError('Enter a pack manifest URL first.')
      setRemotePackNotice(null)
      return
    }

    setIsImportingRemotePack(true)
    setRemotePackError(null)
    setRemotePackNotice(null)
    setPackTools({ error: null, notice: null })

    try {
      const manifest = await loadBundledPackManifest(normalizedUrl)
      const existingPackRecord = installedPackById.get(manifest.packId)

      await savePackRecord({
        packRecordId: existingPackRecord?._id as Id<'packs'> | undefined,
        ...toWorkspaceRulesPackSaveInput(manifest),
      })

      setRemotePackNotice(existingPackRecord ? `Updated "${manifest.name}" from ${normalizedUrl}.` : `Installed "${manifest.name}" from ${normalizedUrl}.`)
      setRemotePackUrl('')
    } catch (mutationError) {
      console.error(mutationError)
      setRemotePackError('Importing the remote pack failed. Make sure the URL returns a valid pack JSON document.')
    }

    setIsImportingRemotePack(false)
  }

  async function handleSavePack() {
    const normalizedPackId = packTools.packIdDraft.trim()
    const normalizedName = packTools.nameDraft.trim()
    const normalizedVersion = packTools.versionDraft.trim()

    if (!normalizedPackId || !normalizedName || !normalizedVersion) {
      setPackTools({
        error: 'Pack ID, name, and version are required before saving.',
        notice: null,
      })
      return
    }

    let parsedEntries: unknown
    let parsedDefaultRefs: unknown
    let parsedDomains: unknown
    let parsedSourceProvenance: unknown

    try {
      parsedEntries = JSON.parse(packTools.entriesJsonDraft)
      if (packTools.kindDraft === 'asset') {
        parsedDefaultRefs = JSON.parse(packTools.defaultRefsJsonDraft)
      } else {
        parsedDomains = JSON.parse(packTools.domainsJsonDraft)
        parsedSourceProvenance = JSON.parse(packTools.sourceProvenanceJsonDraft)
      }
    } catch {
      setPackTools({
        error: packTools.kindDraft === 'asset'
          ? 'Pack entries JSON and default refs JSON must both be valid JSON.'
          : 'Pack entries, rules domains, and source provenance must all be valid JSON.',
        notice: null,
      })
      return
    }

    setPackTools({
      isWorking: true,
      error: null,
      notice: null,
    })

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
      const nextManifestStorageId = packTools.manifestFile ? await uploadPackFile(packTools.manifestFile) : packTools.manifestStorageId ?? undefined
      const nextThumbnailStorageId = packTools.thumbnailFile ? await uploadPackFile(packTools.thumbnailFile) : packTools.thumbnailStorageId ?? undefined

      const savedPackRecordId = await savePackRecord({
        packRecordId: packTools.selectedPackRecordId ?? undefined,
        packId: normalizedPackId,
        name: normalizedName,
        kind: packTools.kindDraft,
        version: normalizedVersion,
        visibility: packTools.visibilityDraft,
        description: packTools.descriptionDraft.trim() || undefined,
        isActive: packTools.visibilityDraft === 'global' ? true : packTools.isActiveDraft,
        manifestStorageId: nextManifestStorageId,
        thumbnailStorageId: nextThumbnailStorageId,
        defaultAssetRefs: packTools.kindDraft === 'asset'
          ? parsedDefaultRefs as {
              floor?: string
              wall?: string
              opening?: string
              prop?: string
              player?: string
            }
          : undefined,
        domains: packTools.kindDraft === 'rules' ? parsedDomains : undefined,
        sourceProvenance: packTools.kindDraft === 'rules'
          ? parsedSourceProvenance as {
              sourceRepository: string
              sourcePath: string
              sourceVersion?: string
              packVersion: string
              importedAt: string
              importer: 'dragonbane-unbound'
            }
          : undefined,
        entries: entriesForMutation,
      })

      setPackTools({
        selectedPackRecordId: savedPackRecordId,
        manifestStorageId: nextManifestStorageId ?? null,
        thumbnailStorageId: nextThumbnailStorageId ?? null,
        manifestFile: null,
        thumbnailFile: null,
        notice: packTools.selectedPackRecordId ? 'Updated the pack registry record.' : 'Saved a new pack registry record.',
      })
    } catch (mutationError) {
      console.error(mutationError)
      setPackTools({
        error: 'Saving the pack failed. Check the canonical metadata JSON and admin permissions.',
      })
    }

    setPackTools({ isWorking: false })
  }

  async function handleTogglePackActive() {
    if (!packTools.selectedPackRecordId || !selectedPackRecord) {
      return
    }

    setPackTools({
      isWorking: true,
      error: null,
      notice: null,
    })

    try {
      await setPackActive({
        packRecordId: packTools.selectedPackRecordId,
        isActive: !selectedPackRecord.isActive,
      })

      setPackTools({
        isActiveDraft: !selectedPackRecord.isActive,
        notice: `${selectedPackRecord.isActive ? 'Deactivated' : 'Activated'} "${selectedPackRecord.name}".`,
      })
    } catch (mutationError) {
      console.error(mutationError)
      setPackTools({ error: 'Updating the pack activation state failed.' })
    }

    setPackTools({ isWorking: false })
  }

  async function handleToggleWorkspacePack(packRecordId: Id<'packs'>, nextIsActive: boolean, packName: string) {
    setPackTools({
      isWorking: true,
      error: null,
      notice: null,
    })

    try {
      await setPackActive({
        packRecordId,
        isActive: nextIsActive,
      })

      setPackTools({
        notice: `${nextIsActive ? 'Activated' : 'Deactivated'} "${packName}".`,
      })
    } catch (mutationError) {
      console.error(mutationError)
      setPackTools({ error: `Updating "${packName}" failed.` })
    }

    setPackTools({ isWorking: false })
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
        {activePage === 'library' && canAccessDungeonLibrary ? (
          <article className="panel panel--library">
            <p className="panel__eyebrow">Dungeon Library</p>
            <h2 className="panel__title">Saved dungeons</h2>
            <p className="panel__copy">
              Browse your private dungeon library and continue building any saved map in the main editor.
            </p>

            <div className="library-sync-state library-sync-state--muted">
              <div>
                <p className="status-card__label">Library status</p>
                <p className="library-sync-state__title">{libraryRecords?.length ?? 0} saved dungeons</p>
              </div>
              <p className="panel__copy">
                Open any saved dungeon straight in the editor, or duplicate and tidy up your library from here.
              </p>
            </div>

            <div className="library-grid">
              <section className="library-card">
                <div className="library-card__header">
                  <div>
                    <p className="status-card__label">Saved records</p>
                    <h3 className="library-card__title">Dungeon library</h3>
                  </div>
                  <button
                    className="hero-panel__button hero-panel__button--secondary"
                    disabled={dungeonLibrary.activeAction === 'new'}
                    onClick={() => void handleLaunchEditor()}
                    type="button"
                  >
                    {dungeonLibrary.activeAction === 'new' ? 'Opening...' : 'New in editor'}
                  </button>
                </div>

                {libraryRecords && libraryRecords.length > 0 ? (
                  <div className="library-records">
                    {libraryRecords.map((record) => (
                      <article className="library-record" key={record._id}>
                        <div>
                          <p className="library-record__title">{record.title}</p>
                          <p className="panel__copy">{record.description ?? 'No description yet.'}</p>
                          <p className="library-record__meta">Updated {new Date(record.updatedAt).toLocaleString()}</p>
                        </div>
                        <div className="library-record__actions">
                          <button
                            className="hero-panel__button hero-panel__button--secondary"
                            disabled={!backendUrl || dungeonLibrary.activeAction === `open:${record._id}`}
                            onClick={() => void handleLaunchEditor(record._id)}
                            type="button"
                          >
                            {dungeonLibrary.activeAction === `open:${record._id}` ? 'Opening...' : 'Open'}
                          </button>
                          <button
                            className="hero-panel__button hero-panel__button--secondary"
                            disabled={dungeonLibrary.activeAction === `copy:${record._id}`}
                            onClick={() => void handleCopyDungeon(record._id)}
                            type="button"
                          >
                            {dungeonLibrary.activeAction === `copy:${record._id}` ? 'Copying...' : 'Copy'}
                          </button>
                          <button
                            className="hero-panel__button hero-panel__button--secondary library-record__button--danger"
                            disabled={dungeonLibrary.activeAction === `delete:${record._id}`}
                            onClick={() => void handleDeleteDungeon(record._id, record.title)}
                            type="button"
                          >
                            {dungeonLibrary.activeAction === `delete:${record._id}` ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="panel__copy">No dungeons have been saved here yet.</p>
                )}

                {!backendUrl ? (
                  <p className="panel__copy">
                    Editor launching is unavailable until the app has a backend URL configured.
                  </p>
                ) : null}

                {dungeonError ? <p className="auth-card__error">{dungeonError}</p> : null}
                {dungeonNotice ? <p className="library-notice">{dungeonNotice}</p> : null}
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
          <DragonbaneCharacterCreator packs={runtimeCharacterPacks} />
        ) : null}

        {activePage === 'admin-packs' && identity.access.canManagePacks ? (
          <article className="panel panel--packs">
            <header className="packs-hero">
              <div>
                <p className="panel__eyebrow">Admin</p>
                <h2 className="panel__title">Content packs</h2>
                <p className="panel__copy">
                  Review bundled packs, install community rules data, and edit workspace pack records from one focused workspace.
                </p>
              </div>
              <div className="packs-metrics" aria-label="Pack summary">
                <div className="packs-metric">
                  <span>Installed</span>
                  <strong>{packRecords?.length ?? 0}</strong>
                </div>
                <div className="packs-metric">
                  <span>Active</span>
                  <strong>{packRecords?.filter((pack) => pack.isActive).length ?? 0}</strong>
                </div>
                <div className="packs-metric">
                  <span>Bundled</span>
                  <strong>{bundledRegistry?.packs.length ?? 0}</strong>
                </div>
              </div>
            </header>

            {packError ? <p className="auth-card__error">{packError}</p> : null}
            {packNotice ? <p className="library-notice">{packNotice}</p> : null}

            <div className="packs-layout">
              <aside className="packs-sidebar" aria-label="Pack sources and records">
                <section className="packs-card packs-card--toolbar">
                  <div>
                    <p className="status-card__label">Workspace registry</p>
                    <h3 className="library-card__title">Installed packs</h3>
                  </div>
                  <button className="hero-panel__button hero-panel__button--secondary" onClick={handleNewPackDraft} type="button">
                    New pack
                  </button>
                </section>

                <section className="packs-card">
                  {packRecords && packRecords.length > 0 ? (
                    <div className="packs-records">
                      {packRecords.map((pack) => (
                        <button
                          className={`packs-record ${selectedPackRecordId === pack._id ? 'packs-record--selected' : ''}`}
                          key={pack._id}
                          onClick={() => hydratePackDraft(pack)}
                          type="button"
                        >
                          <span className="packs-record__kind">{pack.kind}</span>
                          <strong>{pack.name}</strong>
                          <span>{pack.packId} · {pack.visibility} · {pack.isActive ? 'active' : 'inactive'}</span>
                          <small>{pack.entries.length} canonical entr{pack.entries.length === 1 ? 'y' : 'ies'}</small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="panel__copy">No packs have been registered yet.</p>
                  )}
                </section>

                <details className="packs-card packs-disclosure" open>
                  <summary>
                    <span>
                      <span className="status-card__label">Bundled manifests</span>
                      <strong>Backend-shipped packs</strong>
                    </span>
                  </summary>

                  {bundledPackState.error ? <p className="auth-card__error">{bundledPackState.error}</p> : null}
                  {bundledPackState.isLoading ? <p className="panel__copy">Loading bundled packs...</p> : null}
                  {bundledRegistry && bundledRegistry.packs.length > 0 ? (
                    <div className="packs-records">
                      {bundledRegistry.packs.map((registryEntry) => {
                        const manifest = bundledPacks.find((pack) => pack.packId === registryEntry.packId)
                        const installedPack = installedPackById.get(registryEntry.packId)

                        return (
                          <div className="packs-record packs-record--static" key={registryEntry.packId}>
                            <div>
                              <strong>{registryEntry.name}</strong>
                              <p className="panel__copy">
                                {registryEntry.packId} · {registryEntry.version} · {registryEntry.alwaysActive ? 'always active' : 'optional'}
                              </p>
                              <p className="library-record__meta">{registryEntry.path}</p>
                            </div>
                            <div className="library-card__actions">
                              {registryEntry.alwaysActive ? (
                                <button className="hero-panel__button hero-panel__button--tiny hero-panel__button--secondary" disabled type="button">
                                  Always active
                                </button>
                              ) : installedPack ? (
                                <>
                                  <button
                                    className="hero-panel__button hero-panel__button--tiny hero-panel__button--secondary"
                                    disabled={isWorkingPacks}
                                    onClick={() => void handleToggleWorkspacePack(installedPack._id as Id<'packs'>, !installedPack.isActive, installedPack.name)}
                                    type="button"
                                  >
                                    {installedPack.isActive ? 'Deactivate' : 'Activate'}
                                  </button>
                                  <button
                                    className="hero-panel__button hero-panel__button--tiny hero-panel__button--secondary"
                                    disabled={isWorkingPacks}
                                    onClick={() => void handleInstallBundledPack(registryEntry.path, registryEntry.packId, registryEntry.name)}
                                    type="button"
                                  >
                                    Refresh
                                  </button>
                                </>
                              ) : (
                                <button
                                  className="hero-panel__button hero-panel__button--tiny hero-panel__button--primary"
                                  disabled={isWorkingPacks || !manifest}
                                  onClick={() => void handleInstallBundledPack(registryEntry.path, registryEntry.packId, registryEntry.name)}
                                  type="button"
                                >
                                  Install
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : bundledPackState.isLoading ? null : (
                    <p className="panel__copy">No bundled manifests were found.</p>
                  )}
                </details>

                <section className="packs-card packs-import">
                  <div>
                    <p className="status-card__label">Community import</p>
                    <h3 className="library-card__title">Install from URL</h3>
                  </div>

                  <label className="auth-card__field">
                    <span>Manifest URL</span>
                    <input
                      onChange={(event) => setRemotePackUrl(event.target.value)}
                      placeholder="https://example.com/my-pack.json"
                      type="url"
                      value={remotePackUrl}
                    />
                  </label>

                  <p className="panel__copy">
                    Public JSON rules-pack manifest URL. GitHub raw URLs work well.
                  </p>

                  {remotePackError ? <p className="auth-card__error">{remotePackError}</p> : null}
                  {remotePackNotice ? <p className="library-notice">{remotePackNotice}</p> : null}

                  <div className="library-card__actions">
                    <button
                      className="hero-panel__button hero-panel__button--primary"
                      disabled={isImportingRemotePack}
                      onClick={() => void handleInstallRemotePack()}
                      type="button"
                    >
                      {isImportingRemotePack ? 'Importing...' : 'Import pack'}
                    </button>
                  </div>
                </section>
              </aside>

              <section className="packs-editor">
                <div className="packs-editor__header">
                  <div>
                    <p className="status-card__label">Canonical draft</p>
                    <h3 className="library-card__title">{selectedPackRecordId ? 'Edit selected pack' : 'Create pack record'}</h3>
                    <p className="panel__copy">
                      Use the basics first. Open advanced JSON only when changing canonical refs or Dragonbane rules data.
                    </p>
                  </div>
                  <div className="packs-editor__actions">
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
                      {selectedPackRecord?.isActive ? 'Deactivate pack' : 'Activate'}
                    </button>
                  </div>
                </div>

                <div className="packs-form-grid">
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

                <details className="packs-disclosure packs-disclosure--editor">
                  <summary>
                    <span>
                      <span className="status-card__label">Files</span>
                      <strong>Manifest and thumbnail uploads</strong>
                    </span>
                  </summary>
                  <div className="packs-form-grid">
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
                </details>

                <details className="packs-disclosure packs-disclosure--editor">
                  <summary>
                    <span>
                      <span className="status-card__label">Advanced JSON</span>
                      <strong>{packKindDraft === 'asset' ? 'Asset refs and canonical entries' : 'Rules domains and canonical entries'}</strong>
                    </span>
                  </summary>
                  <div className="packs-json-stack">
                    {packKindDraft === 'asset' ? (
                      <label className="auth-card__field">
                        <span>Default asset refs JSON</span>
                        <textarea
                          className="library-editor library-editor--compact"
                          onChange={(event) => setPackDefaultRefsJson(event.target.value)}
                          rows={6}
                          value={packDefaultRefsJson}
                        />
                      </label>
                    ) : (
                      <>
                        <label className="auth-card__field">
                          <span>Dragonbane domains JSON</span>
                          <textarea
                            className="library-editor library-editor--compact"
                            onChange={(event) => setPackDomainsJson(event.target.value)}
                            rows={12}
                            value={packDomainsJson}
                          />
                        </label>

                        <label className="auth-card__field">
                          <span>Source provenance JSON</span>
                          <textarea
                            className="library-editor library-editor--compact"
                            onChange={(event) => setPackSourceProvenanceJson(event.target.value)}
                            rows={6}
                            value={packSourceProvenanceJson}
                          />
                        </label>
                      </>
                    )}

                    <label className="auth-card__field">
                      <span>Canonical entries JSON</span>
                      <textarea
                        className="library-editor library-editor--compact"
                        onChange={(event) => setPackEntriesJson(event.target.value)}
                        rows={12}
                        value={packEntriesJson}
                      />
                    </label>
                  </div>
                </details>

                <div className="packs-editor__footer">
                  <p className="panel__copy">
                    Pack-managed references use <code>packId:localId</code> so assets stay tidy across your library.
                  </p>
                  <div className="packs-editor__actions">
                    <button
                      className="hero-panel__button hero-panel__button--primary"
                      disabled={isWorkingPacks}
                      onClick={() => void handleSavePack()}
                      type="button"
                    >
                      {selectedPackRecordId ? 'Update pack' : 'Save pack'}
                    </button>
                  </div>
                </div>
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
  const { isAuthenticated, isLoading } = useBackendAuthState()
  const identity = useViewerIdentity()
  const { shell, setCurrentPath, resetWorkspaceState } = useAuthenticatedAppState()
  const currentPath = shell.currentPath
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
  }, [setCurrentPath])

  useEffect(() => {
    if (!isAuthenticated) {
      resetWorkspaceState()
    }
  }, [isAuthenticated, resetWorkspaceState])

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
            <a
              className={
                !isAuthenticated && publicPath === '/login'
                  ? 'header-nav__link--active'
                  : isAuthenticated && currentPath.startsWith('/app')
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
          <SignedInOverview identity={identity} />
        )}

        <footer className="app-shell__footer"></footer>
      </main>
    </div>
  )
}

export default App
