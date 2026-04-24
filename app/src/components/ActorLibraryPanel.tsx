import { useEffect, useMemo, useState } from 'react'
import type { ActorKind, ActorSize } from '@dungeonplanner/shared/actors'
import {
  deleteGeneratedCharacterAssets,
  requestGeneratedCharacterImage,
  saveGeneratedCharacterAssets,
} from '@dungeonplanner/shared/generated-characters/api'
import { composeGeneratedCharacterPrompt } from '@dungeonplanner/shared/generated-characters/prompt'
import { processGeneratedCharacterImage } from '@dungeonplanner/shared/generated-characters/processing'
import type { Id } from '../../convex/_generated/dataModel'
import { api } from '../../convex/_generated/api'
import { useMutation, useQuery } from '../lib/backendData'
import { resolveBackendApiBaseUrl } from '../lib/backendAuthApi'

const DEFAULT_ACTOR_KIND: ActorKind = 'character'
const DEFAULT_ACTOR_SIZE: ActorSize = 'M'

type ActorPackSummary = {
  _id: Id<'actorPacks'>
  name: string
  description: string | null
  isActive: boolean
  actorCount: number
  createdAt: number
  updatedAt: number
}

type ActorSummary = {
  _id: Id<'characters'>
  actorPackId: Id<'actorPacks'> | null
  actorPackName: string | null
  name: string
  kind: ActorKind
  prompt: string
  model: string | null
  size: ActorSize
  storageId: string | null
  originalImageUrl: string | null
  processedImageUrl: string | null
  alphaMaskUrl: string | null
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  createdAt: number
  updatedAt: number
}

type ActorDraft = {
  actorId: Id<'characters'> | null
  actorPackId: Id<'actorPacks'> | null
  name: string
  kind: ActorKind
  prompt: string
  model: string | null
  size: ActorSize
  storageId: string | null
  originalImageUrl: string | null
  processedImageUrl: string | null
  alphaMaskUrl: string | null
  thumbnailUrl: string | null
  width: number | null
  height: number | null
}

function createEmptyActorDraft(actorPackId: Id<'actorPacks'> | null): ActorDraft {
  return {
    actorId: null,
    actorPackId,
    name: '',
    kind: DEFAULT_ACTOR_KIND,
    prompt: '',
    model: null,
    size: DEFAULT_ACTOR_SIZE,
    storageId: null,
    originalImageUrl: null,
    processedImageUrl: null,
    alphaMaskUrl: null,
    thumbnailUrl: null,
    width: null,
    height: null,
  }
}

function buildActorGenerationPrompt(draft: Pick<ActorDraft, 'kind' | 'name' | 'size' | 'prompt'>) {
  return composeGeneratedCharacterPrompt({
    kind: draft.kind === 'npc' ? 'npc' : 'player',
    name: draft.name,
    prompt: draft.prompt,
    size: draft.size,
  })
}

function resolveActorAssetUrl(path: string | null, backendBaseUrl: string) {
  if (!path) {
    return null
  }

  try {
    return new URL(path, `${backendBaseUrl}/`).toString()
  } catch {
    return path
  }
}

export function ActorLibraryPanel() {
  const backendBaseUrl = useMemo(
    () => resolveBackendApiBaseUrl(window.location, import.meta.env.VITE_BACKEND_URL),
    [],
  )
  const actorPacksQuery = useQuery(api.actors.listViewerActorPacks, {}) as ActorPackSummary[] | undefined
  const actorsQuery = useQuery(api.actors.listViewerActors, {}) as ActorSummary[] | undefined
  const actorPacks = useMemo(() => actorPacksQuery ?? [], [actorPacksQuery])
  const actors = useMemo(() => actorsQuery ?? [], [actorsQuery])
  const saveActorPack = useMutation(api.actors.saveActorPack)
  const setActorPackActive = useMutation(api.actors.setActorPackActive)
  const saveActor = useMutation(api.actors.saveActor)
  const deleteActor = useMutation(api.actors.deleteActor)

  const [selectedActorPackId, setSelectedActorPackId] = useState<Id<'actorPacks'> | null>(null)
  const [packFormId, setPackFormId] = useState<Id<'actorPacks'> | null>(null)
  const [packName, setPackName] = useState('')
  const [packDescription, setPackDescription] = useState('')
  const [packIsActive, setPackIsActive] = useState(true)
  const [packError, setPackError] = useState<string | null>(null)
  const [packNotice, setPackNotice] = useState<string | null>(null)
  const [isSavingPack, setIsSavingPack] = useState(false)

  const [actorDraft, setActorDraft] = useState<ActorDraft>(() => createEmptyActorDraft(null))
  const [actorError, setActorError] = useState<string | null>(null)
  const [actorNotice, setActorNotice] = useState<string | null>(null)
  const [isSavingActor, setIsSavingActor] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)

  useEffect(() => {
    if (selectedActorPackId && actorPacks.some((actorPack) => actorPack._id === selectedActorPackId)) {
      return
    }

    const firstActorPack = actorPacks[0] ?? null
    setSelectedActorPackId(firstActorPack?._id ?? null)
  }, [actorPacks, selectedActorPackId])

  useEffect(() => {
    if (!selectedActorPackId) {
      setActorDraft((current) => (
        current.actorId ? current : createEmptyActorDraft(null)
      ))
      return
    }

    setActorDraft((current) => (
      current.actorId || current.actorPackId === selectedActorPackId
        ? current
        : createEmptyActorDraft(selectedActorPackId)
    ))
  }, [selectedActorPackId])

  const selectedActorPack = actorPacks.find((actorPack) => actorPack._id === selectedActorPackId) ?? null
  const actorsInSelectedPack = useMemo(
    () => actors.filter((actor) => actor.actorPackId === selectedActorPackId),
    [actors, selectedActorPackId],
  )

  function hydratePackForm(actorPack: ActorPackSummary | null) {
    setPackFormId(actorPack?._id ?? null)
    setPackName(actorPack?.name ?? '')
    setPackDescription(actorPack?.description ?? '')
    setPackIsActive(actorPack?.isActive ?? true)
    setPackError(null)
    setPackNotice(actorPack ? `Loaded "${actorPack.name}" for editing.` : 'Started a new actor pack draft.')
  }

  function hydrateActorDraft(actor: ActorSummary | null) {
    if (!actor) {
      setActorDraft(createEmptyActorDraft(selectedActorPackId))
      setActorError(null)
      setActorNotice('Started a new actor draft.')
      return
    }

    setActorDraft({
      actorId: actor._id,
      actorPackId: actor.actorPackId,
      name: actor.name,
      kind: actor.kind,
      prompt: actor.prompt,
      model: actor.model,
      size: actor.size,
      storageId: actor.storageId,
      originalImageUrl: actor.originalImageUrl,
      processedImageUrl: actor.processedImageUrl,
      alphaMaskUrl: actor.alphaMaskUrl,
      thumbnailUrl: actor.thumbnailUrl,
      width: actor.width,
      height: actor.height,
    })
    setActorError(null)
    setActorNotice(`Loaded "${actor.name}" into the actor editor.`)
  }

  async function handleSavePack() {
    const normalizedName = packName.trim()
    if (!normalizedName) {
      setPackError('Pack name is required.')
      setPackNotice(null)
      return
    }

    setIsSavingPack(true)
    setPackError(null)
    setPackNotice(null)

    try {
      const actorPackId = await saveActorPack({
        actorPackId: packFormId ?? undefined,
        name: normalizedName,
        description: packDescription.trim() || undefined,
        isActive: packIsActive,
      })

      setSelectedActorPackId(actorPackId)
      setPackFormId(actorPackId)
      setPackNotice(packFormId ? 'Updated the actor pack.' : 'Created a new actor pack.')
    } catch (error) {
      console.error(error)
      setPackError('Saving the actor pack failed.')
    }

    setIsSavingPack(false)
  }

  async function handleToggleActive(actorPack: ActorPackSummary) {
    try {
      await setActorPackActive({
        actorPackId: actorPack._id,
        isActive: !actorPack.isActive,
      })
      setPackNotice(`${actorPack.isActive ? 'Deactivated' : 'Activated'} "${actorPack.name}".`)
      setPackError(null)
    } catch (error) {
      console.error(error)
      setPackError('Updating the actor pack activation failed.')
    }
  }

  async function handleGenerateImage() {
    if (!actorDraft.prompt.trim()) {
      setActorError('Enter an actor prompt before generating an image.')
      setActorNotice(null)
      return
    }

    setIsGeneratingImage(true)
    setActorError(null)
    setActorNotice(null)

    try {
      const generated = await requestGeneratedCharacterImage(buildActorGenerationPrompt(actorDraft), {
        baseUrl: backendBaseUrl,
      })
      const processed = await processGeneratedCharacterImage(generated.imageDataUrl)
      const saved = await saveGeneratedCharacterAssets({
        originalImageDataUrl: generated.imageDataUrl,
        processedImageDataUrl: processed.processedImageDataUrl,
        alphaMaskDataUrl: processed.alphaMaskDataUrl,
        thumbnailDataUrl: processed.thumbnailDataUrl,
      }, fetch, backendBaseUrl)

      if (actorDraft.storageId && actorDraft.storageId !== saved.storageId) {
        try {
          await deleteGeneratedCharacterAssets(actorDraft.storageId, fetch, backendBaseUrl)
        } catch (cleanupError) {
          console.error(cleanupError)
        }
      }

      setActorDraft((current) => ({
        ...current,
        model: generated.model,
        storageId: saved.storageId,
        originalImageUrl: saved.originalImageUrl,
        processedImageUrl: saved.processedImageUrl,
        alphaMaskUrl: saved.alphaMaskUrl,
        thumbnailUrl: saved.thumbnailUrl,
        width: processed.width,
        height: processed.height,
      }))
      setActorNotice('Generated and stored a new standee image for this actor.')
    } catch (error) {
      console.error(error)
      setActorError(error instanceof Error ? error.message : 'Actor image generation failed.')
    }

    setIsGeneratingImage(false)
  }

  async function handleSaveActor() {
    if (!actorDraft.actorPackId) {
      setActorError('Choose an actor pack before saving an actor.')
      setActorNotice(null)
      return
    }

    const normalizedName = actorDraft.name.trim()
    if (!normalizedName) {
      setActorError('Actor name is required.')
      setActorNotice(null)
      return
    }

    setIsSavingActor(true)
    setActorError(null)
    setActorNotice(null)

    try {
      const actorId = await saveActor({
        actorId: actorDraft.actorId ?? undefined,
        actorPackId: actorDraft.actorPackId,
        name: normalizedName,
        kind: actorDraft.kind,
        prompt: actorDraft.prompt,
        model: actorDraft.model ?? undefined,
        size: actorDraft.size,
        storageId: actorDraft.storageId ?? undefined,
        originalImageUrl: actorDraft.originalImageUrl ?? undefined,
        processedImageUrl: actorDraft.processedImageUrl ?? undefined,
        alphaMaskUrl: actorDraft.alphaMaskUrl ?? undefined,
        thumbnailUrl: actorDraft.thumbnailUrl ?? undefined,
        width: actorDraft.width ?? undefined,
        height: actorDraft.height ?? undefined,
      })

      setActorDraft((current) => ({
        ...current,
        actorId,
        name: normalizedName,
      }))
      setActorNotice(actorDraft.actorId ? 'Updated the actor record.' : 'Saved a new actor record.')
    } catch (error) {
      console.error(error)
      setActorError('Saving the actor failed.')
    }

    setIsSavingActor(false)
  }

  async function handleDeleteActor() {
    if (!actorDraft.actorId) {
      return
    }

    if (!window.confirm(`Delete "${actorDraft.name || 'this actor'}"?`)) {
      return
    }

    setIsSavingActor(true)
    setActorError(null)
    setActorNotice(null)

    try {
      const result = await deleteActor({
        actorId: actorDraft.actorId,
      })

      if (result.storageId) {
        try {
          await deleteGeneratedCharacterAssets(result.storageId, fetch, backendBaseUrl)
        } catch (cleanupError) {
          console.error(cleanupError)
        }
      }

      setActorDraft(createEmptyActorDraft(selectedActorPackId))
      setActorNotice('Deleted the actor record.')
    } catch (error) {
      console.error(error)
      setActorError('Deleting the actor failed.')
    }

    setIsSavingActor(false)
  }

  return (
    <article className="panel panel--characters">
      <p className="panel__eyebrow">Actors</p>
      <h2 className="panel__title">Actor packs and standees</h2>
      <p className="panel__copy">
        Create characters and NPCs in the app, group them into user-owned packs, and toggle which packs are active in the editor.
      </p>

      <div className="library-grid">
        <section className="library-card">
          <div className="library-card__header">
            <div>
              <p className="status-card__label">Actor packs</p>
              <h3 className="library-card__title">Pack manager</h3>
            </div>
            <button className="hero-panel__button hero-panel__button--secondary" onClick={() => hydratePackForm(null)} type="button">
              New pack
            </button>
          </div>

          <label className="auth-card__field">
            <span>Name</span>
            <input onChange={(event) => setPackName(event.target.value)} type="text" value={packName} />
          </label>

          <label className="auth-card__field">
            <span>Description</span>
            <input onChange={(event) => setPackDescription(event.target.value)} type="text" value={packDescription} />
          </label>

          <label className="auth-card__field">
            <span>Active in editor</span>
            <select className="auth-card__select" onChange={(event) => setPackIsActive(event.target.value === 'true')} value={String(packIsActive)}>
              <option value="true">true</option>
              <option value="false">false</option>
            </select>
          </label>

          {packError ? <p className="auth-card__error">{packError}</p> : null}
          {packNotice ? <p className="library-notice">{packNotice}</p> : null}

          <div className="library-card__actions">
            <button className="hero-panel__button hero-panel__button--primary" disabled={isSavingPack} onClick={() => void handleSavePack()} type="button">
              {packFormId ? 'Update pack' : 'Save pack'}
            </button>
          </div>

          <div className="library-records">
            {actorPacks.length > 0 ? actorPacks.map((actorPack) => (
              <article className={`library-record ${selectedActorPackId === actorPack._id ? 'library-record--selected' : ''}`} key={actorPack._id}>
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => {
                    setSelectedActorPackId(actorPack._id)
                    hydratePackForm(actorPack)
                  }}
                >
                  <p className="library-record__title">{actorPack.name}</p>
                  <p className="panel__copy">{actorPack.description ?? 'No description yet.'}</p>
                  <p className="library-record__meta">{actorPack.actorCount} actors · {actorPack.isActive ? 'active' : 'inactive'}</p>
                </button>
                <div className="library-card__actions">
                  <button className="hero-panel__button hero-panel__button--secondary" onClick={() => void handleToggleActive(actorPack)} type="button">
                    {actorPack.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </article>
            )) : (
              <p className="panel__copy">No actor packs yet. Create one to start grouping actors for the editor.</p>
            )}
          </div>
        </section>

        <section className="library-card">
          <div className="library-card__header">
            <div>
              <p className="status-card__label">Actors</p>
              <h3 className="library-card__title">{selectedActorPack?.name ?? 'Choose a pack'}</h3>
            </div>
            <button className="hero-panel__button hero-panel__button--secondary" disabled={!selectedActorPackId} onClick={() => hydrateActorDraft(null)} type="button">
              New actor
            </button>
          </div>

          {selectedActorPackId ? (
            <div className="library-records">
              {actorsInSelectedPack.length > 0 ? actorsInSelectedPack.map((actor) => (
                <button
                  className={`library-record ${actorDraft.actorId === actor._id ? 'library-record--selected' : ''}`}
                  key={actor._id}
                  onClick={() => hydrateActorDraft(actor)}
                  type="button"
                >
                  <div>
                    <p className="library-record__title">{actor.name}</p>
                    <p className="panel__copy">{actor.kind === 'npc' ? 'NPC' : 'Character'} · {actor.size}</p>
                  </div>
                  <p className="library-record__meta">
                    {actor.processedImageUrl ? 'Ready for editor' : 'Needs standee image'}
                  </p>
                </button>
              )) : (
                <p className="panel__copy">This pack has no actors yet.</p>
              )}
            </div>
          ) : (
            <p className="panel__copy">Select or create a pack before working with actors.</p>
          )}
        </section>

        <section className="library-card">
          <div className="library-card__header">
            <div>
              <p className="status-card__label">Actor editor</p>
              <h3 className="library-card__title">{actorDraft.actorId ? 'Edit actor' : 'New actor'}</h3>
            </div>
          </div>

          <label className="auth-card__field">
            <span>Pack</span>
            <select
              className="auth-card__select"
              onChange={(event) => {
                const nextActorPackId = event.target.value ? event.target.value as Id<'actorPacks'> : null
                setSelectedActorPackId(nextActorPackId)
                setActorDraft((current) => ({
                  ...current,
                  actorPackId: nextActorPackId,
                }))
              }}
              value={actorDraft.actorPackId ?? ''}
            >
              <option value="">Select a pack</option>
              {actorPacks.map((actorPack) => (
                <option key={actorPack._id} value={actorPack._id}>
                  {actorPack.name}
                </option>
              ))}
            </select>
          </label>

          <label className="auth-card__field">
            <span>Name</span>
            <input onChange={(event) => setActorDraft((current) => ({ ...current, name: event.target.value }))} type="text" value={actorDraft.name} />
          </label>

          <label className="auth-card__field">
            <span>Kind</span>
            <select className="auth-card__select" onChange={(event) => setActorDraft((current) => ({ ...current, kind: event.target.value as ActorKind }))} value={actorDraft.kind}>
              <option value="character">character</option>
              <option value="npc">npc</option>
            </select>
          </label>

          <label className="auth-card__field">
            <span>Size</span>
            <select className="auth-card__select" onChange={(event) => setActorDraft((current) => ({ ...current, size: event.target.value as ActorSize }))} value={actorDraft.size}>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </label>

          <label className="auth-card__field">
            <span>Prompt</span>
            <textarea className="library-editor" onChange={(event) => setActorDraft((current) => ({ ...current, prompt: event.target.value }))} rows={7} value={actorDraft.prompt} />
          </label>

          {actorDraft.thumbnailUrl ? (
            <img
              alt={`${actorDraft.name || 'Actor'} preview`}
              className="feat-gif rounded-2xl border border-stone-800 bg-stone-950/70 object-contain"
              src={resolveActorAssetUrl(actorDraft.thumbnailUrl, backendBaseUrl) ?? actorDraft.thumbnailUrl}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-700 px-4 py-8 text-center text-sm text-stone-400">
              No standee image yet. Generate one here, then save the actor into the selected pack.
            </div>
          )}

          {actorError ? <p className="auth-card__error">{actorError}</p> : null}
          {actorNotice ? <p className="library-notice">{actorNotice}</p> : null}

          <div className="library-card__actions">
            <button className="hero-panel__button hero-panel__button--secondary" disabled={isGeneratingImage} onClick={() => void handleGenerateImage()} type="button">
              {isGeneratingImage ? 'Generating...' : 'Generate image'}
            </button>
            <button className="hero-panel__button hero-panel__button--primary" disabled={isSavingActor} onClick={() => void handleSaveActor()} type="button">
              {actorDraft.actorId ? 'Update actor' : 'Save actor'}
            </button>
            <button className="hero-panel__button hero-panel__button--secondary" disabled={!actorDraft.actorId || isSavingActor} onClick={() => void handleDeleteActor()} type="button">
              Delete actor
            </button>
          </div>
        </section>
      </div>
    </article>
  )
}
