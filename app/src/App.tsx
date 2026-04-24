import './App.css'
import { useMemo, useState } from 'react'
import { useAuthActions } from '@convex-dev/auth/react'
import { Authenticated, Unauthenticated, useConvexAuth, useMutation, useQuery } from 'convex/react'
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
        <p className="app-shell__eyebrow">Convex Auth</p>
        <h2 className="panel__title" id="auth-card-title">
          Email and password
        </h2>
        <p className="panel__copy">
          Local self-hosted authentication is the first gateway into the signed-in product.
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

function SignedInOverview() {
  const { signOut } = useAuthActions()
  const identity = useViewerIdentity()
  const workspaceMembers = useQuery(
    api.roles.listActiveWorkspaceUsers,
    identity.access.canManageUsers ? {} : 'skip',
  )
  const libraryRecords = useQuery(
    api.dungeons.listViewerDungeons,
    identity.access.canManageDungeons ? {} : 'skip',
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

  const navItems = [
    identity.access.canManageDungeons && { id: 'library', label: 'Dungeon Library' },
    { id: 'sessions', label: 'Sessions' },
    identity.access.canUseCharacterLibrary && { id: 'characters', label: 'Characters' },
    identity.access.canManagePacks && { id: 'admin', label: 'Admin' },
  ].filter((item): item is { id: string; label: string } => Boolean(item))

  const selectedSession = sessionRecords?.find((session) => session._id === selectedSessionId) ?? null
  const selectedPackRecord = packRecords?.find((pack) => pack._id === selectedPackRecordId) ?? null

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
    setDungeonNotice(`Loaded "${selectedDungeon.title}" from Convex into the local draft.`)
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
      setDungeonNotice(
        selectedDungeonId ? 'Updated the durable dungeon record in Convex.' : 'Saved a new durable dungeon record in Convex.',
      )
    } catch (mutationError) {
      console.error(mutationError)
      setDungeonError('Saving the dungeon failed. Make sure this account still has DM access in the active workspace.')
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
      setSessionNotice(`Joined "${joinedSession.title}". Convex now tracks this membership.`)
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
      setSessionNotice('Issued a short-lived Colyseus access ticket for the selected session.')
    } catch (mutationError) {
      console.error(mutationError)
      setSessionError('Could not issue a Colyseus access ticket for this session.')
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
      <section className="signed-in-card" aria-labelledby="signed-in-title">
        <div>
          <p className="app-shell__eyebrow">Authenticated workspace</p>
          <h2 className="panel__title" id="signed-in-title">
            {identity.viewer?.name ?? identity.viewer?.email ?? 'DungeonPlanner user'}
          </h2>
          <p className="panel__copy">
            Signed into the local Convex-backed shell. Workspace, role, and library records are now
            resolving through Convex instead of the anonymous demo surface.
          </p>
        </div>

        <div className="signed-in-card__meta">
          <div>
            <p className="status-card__label">Workspace</p>
            <p className="status-card__value">{identity.workspace?.name ?? 'Provisioning workspace...'}</p>
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

      <nav className="app-shell__subnav" aria-label="Signed-in modules">
        {navItems.map((item) => (
          <a className="app-shell__nav-link" href={`#${item.id}`} key={item.id}>
            {item.label}
          </a>
        ))}
      </nav>

      {!identity.access.canManageDungeons &&
      !identity.access.canManageSessions &&
      !identity.access.canManagePacks ? (
        <section className="signed-in-card">
          <div>
            <p className="app-shell__eyebrow">Player access</p>
            <h2 className="panel__title">Limited workspace tooling</h2>
            <p className="panel__copy">
              This account currently resolves as a player-only member. DM and admin tooling stays hidden
              until those roles are assigned in Convex.
            </p>
          </div>
        </section>
      ) : null}

      <section className="panels" id="roadmap" aria-label="Authenticated product modules">
        {identity.access.canManageDungeons ? (
          <article className="panel panel--library" id="library">
            <p className="panel__eyebrow">Dungeon Library</p>
            <h2 className="panel__title">Owned maps</h2>
            <p className="panel__copy">
              Durable library records now store the existing portable dungeon JSON payload without changing the editor export format.
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
                    <p className="status-card__label">Durable records</p>
                    <h3 className="library-card__title">Convex library</h3>
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
                          setDungeonNotice(`Selected "${record.title}" from the Convex library.`)
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
                  <p className="panel__copy">No dungeon records have been saved in this workspace yet.</p>
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

        <article className="panel panel--sessions" id="sessions">
          <p className="panel__eyebrow">Sessions</p>
          <h2 className="panel__title">Durable membership and room access</h2>
          <p className="panel__copy">
            Convex now owns shareable join codes, durable session membership, and the short-lived tickets the Colyseus room accepts.
          </p>

          <div className="library-grid">
            <section className="library-card">
              <div className="library-card__header">
                <div>
                  <p className="status-card__label">Create or join</p>
                  <h3 className="library-card__title">Session flows</h3>
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
                <p className="panel__copy">You are not a member of any sessions in the active workspace yet.</p>
              )}

              <div className="library-card__actions">
                <button
                  className="hero-panel__button hero-panel__button--secondary"
                  disabled={!selectedSessionId || isWorkingSession}
                  onClick={() => void handleIssueSessionAccessTicket()}
                  type="button"
                >
                  Issue Colyseus ticket
                </button>
              </div>

              {selectedSession ? (
                <div className="session-summary">
                  <p className="status-card__label">Selected session</p>
                  <p className="library-card__title">{selectedSession.title}</p>
                  <p className="panel__copy">Share join code <strong>{selectedSession.joinCode}</strong> with authenticated players.</p>
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
                  <span>Room access payload</span>
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

        {identity.access.canUseCharacterLibrary ? (
          <article className="panel panel--characters" id="characters">
            <p className="panel__eyebrow">Characters</p>
            <h2 className="panel__title">Player-owned records</h2>
            <p className="panel__copy">
              Character identity now lives as durable user-owned records, separate from placed map tokens, with first session-link plumbing in place.
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

        {identity.access.canManagePacks ? (
          <article className="panel panel--packs" id="admin">
            <p className="panel__eyebrow">Admin</p>
            <h2 className="panel__title">Pack governance</h2>
            <p className="panel__copy">
              The registry now stores canonical pack metadata, activation state, storage-backed manifest or thumbnail files, and namespaced content refs.
            </p>

            <div className="library-grid">
              <section className="library-card">
                <div className="library-card__header">
                  <div>
                    <p className="status-card__label">Registry records</p>
                    <h3 className="library-card__title">Workspace packs</h3>
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
                  <p className="panel__copy">No workspace packs have been registered yet.</p>
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
                  New pack-managed refs should use <code>packId:localId</code>. Legacy flat asset IDs are normalized on save, while runtime-generated player refs remain compatible.
                </p>
              </section>
            </div>
          </article>
        ) : null}
      </section>

      {identity.access.canManageUsers ? (
        <section className="auth-card" aria-labelledby="role-manager-title">
          <div className="auth-card__header">
            <p className="app-shell__eyebrow">Admin controls</p>
            <h2 className="panel__title" id="role-manager-title">
              Manage workspace roles
            </h2>
            <p className="panel__copy">
              Admins can grant or revoke additive roles by email. Global admin applies across every workspace.
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
            <p className="status-card__label">Visible members</p>
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
              <p className="panel__copy">No members are visible in the active workspace yet.</p>
            )}
          </div>
        </section>
      ) : null}
    </>
  )
}

function App() {
  const { isLoading } = useConvexAuth()

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <div className="app-shell__brand">
          <p className="app-shell__eyebrow">DungeonPlanner App</p>
          <h1 className="app-shell__title">Signed-in product shell</h1>
          <p className="app-shell__subtitle">
            Local-first authenticated workspace for libraries, sessions, characters, and admin tools.
          </p>
        </div>

        <nav className="app-shell__nav" aria-label="Primary">
          <a className="app-shell__nav-link" href="#hero-title">Overview</a>
          <a className="app-shell__nav-link" href="#auth">Auth</a>
          <a className="app-shell__nav-link" href="#roadmap">Workspace</a>
        </nav>
      </header>

      <main className="app-shell__main">
        <section className="hero-panel" aria-labelledby="hero-title">
          <div className="hero-panel__content">
            <p className="app-shell__eyebrow">Phase one foundation</p>
            <h2 className="hero-panel__title" id="hero-title">
              Build the real product without disturbing the public landing page or demo.
            </h2>
            <p className="hero-panel__copy">
              This workspace is the future signed-in surface. The anonymous demo, docs, and landing
              page stay where they are while Convex auth, libraries, sessions, and pack management
              come online here first.
            </p>
            <div className="hero-panel__actions">
              <a className="hero-panel__button hero-panel__button--primary" href="#auth">
                Auth flow placeholder
              </a>
              <a className="hero-panel__button hero-panel__button--secondary" href="#roadmap">
                Workspace roadmap
              </a>
            </div>
          </div>

          <div className="hero-panel__status">
            <article className="status-card">
              <p className="status-card__label">Auth</p>
              <p className="status-card__value">Convex Auth</p>
              <p className="status-card__copy">Starts here, not in the public site or demo.</p>
            </article>
            <article className="status-card">
              <p className="status-card__label">Persistence</p>
              <p className="status-card__value">Manual saves first</p>
              <p className="status-card__copy">Latest-only dungeon records before version history.</p>
            </article>
            <article className="status-card">
              <p className="status-card__label">Multiplayer</p>
              <p className="status-card__value">Colyseus stays live</p>
              <p className="status-card__copy">Durable identity moves to Convex, live transport stays separate.</p>
            </article>
          </div>
        </section>

        {isLoading ? (
          <section className="signed-in-card signed-in-card--loading" aria-live="polite">
            <div>
              <p className="app-shell__eyebrow">Connecting</p>
              <h2 className="panel__title">Waiting for local Convex auth state...</h2>
              <p className="panel__copy">
                The app is hydrating the current browser session against the self-hosted Convex backend.
              </p>
            </div>
          </section>
        ) : null}

        <Unauthenticated>
          <PasswordAuthCard />
        </Unauthenticated>

        <Authenticated>
          <SignedInOverview />
        </Authenticated>

        <footer className="app-shell__footer" id="auth">
          Local setup target: start self-hosted Convex, set the generated admin key in
          <code>app/.env.local</code>, then run <code>pnpm --filter dungeonplanner-app convex:dev</code>.
        </footer>
      </main>
    </div>
  )
}

export default App
