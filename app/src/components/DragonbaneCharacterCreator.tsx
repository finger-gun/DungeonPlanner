import { useMemo, useState } from 'react'
import type { ActorKind, ActorSize } from '@dungeonplanner/shared/actors'
import {
  buildDragonbaneCharacterSheet,
  getDragonbaneSkillBaseChance,
  getDragonbaneTrainedSkillSlots,
} from '@dungeonplanner/shared/dragonbane/characterCreation'
import type { DragonbaneCharacterSheet } from '@dungeonplanner/shared/dragonbane/characterSheet'
import type { DragonbaneContentRef } from '@dungeonplanner/shared/dragonbane/contentRefs'
import type { DragonbaneAgeCategoryId, DragonbaneAttributeId } from '@dungeonplanner/shared/dragonbane/rulesPack'
import { requestGeneratedCharacterImage } from '@dungeonplanner/shared/generated-characters/api'
import { composeGeneratedCharacterPrompt } from '@dungeonplanner/shared/generated-characters/prompt'
import { processGeneratedCharacterImage } from '@dungeonplanner/shared/generated-characters/processing'
import { api } from '../../convex/_generated/api'
import type { Id } from '../../convex/_generated/dataModel'
import { resolveBackendApiBaseUrl } from '../lib/backendAuthApi'
import { uploadActorAssetThroughBackend, useMutation, useQuery } from '../lib/backendData'
import type { RuntimeRulesPackRecord } from '../lib/dragonbanePacks'
import {
  getAvailableKins,
  getDefaultKinRef,
  getDefaultProfessionRef,
  mergeDragonbaneDomains,
} from '../lib/dragonbaneRules'

type ActorPackSummary = {
  _id: Id<'actorPacks'>
  name: string
  description: string | null
  isActive: boolean
  actorCount: number
}

type ActorSummary = {
  _id: Id<'characters'>
  actorPackId: Id<'actorPacks'> | null
  actorPackName: string | null
  name: string
  kind: ActorKind
  prompt: string
  contentRef: string | null
  sheet: DragonbaneCharacterSheet | null
  model: string | null
  size: ActorSize
  storageId: string | null
  originalImageStorageId: Id<'_storage'> | null
  processedImageStorageId: Id<'_storage'> | null
  alphaMaskStorageId: Id<'_storage'> | null
  thumbnailStorageId: Id<'_storage'> | null
  originalImageUrl: string | null
  alphaMaskUrl: string | null
  thumbnailUrl: string | null
  processedImageUrl: string | null
  width: number | null
  height: number | null
}

type ActorGroup = {
  id: string
  name: string
  actorPackId: Id<'actorPacks'> | null
  actors: ActorSummary[]
}

type UploadedStandee = {
  model: string | null
  storageId: string | null
  originalImageStorageId: Id<'_storage'> | null
  processedImageStorageId: Id<'_storage'> | null
  alphaMaskStorageId: Id<'_storage'> | null
  thumbnailStorageId: Id<'_storage'> | null
  originalImageUrl: string | null
  processedImageUrl: string | null
  alphaMaskUrl: string | null
  thumbnailUrl: string | null
  width: number | null
  height: number | null
}

const ATTRIBUTE_IDS: DragonbaneAttributeId[] = ['STR', 'CON', 'AGL', 'INT', 'WIL', 'CHA']
const AGE_OPTIONS: DragonbaneAgeCategoryId[] = ['Young', 'Middle-Aged', 'Old']
const DEFAULT_ATTRIBUTES: Record<DragonbaneAttributeId, number> = {
  STR: 10,
  CON: 10,
  AGL: 10,
  INT: 10,
  WIL: 10,
  CHA: 10,
}

const EMPTY_STANDEE: UploadedStandee = {
  model: null,
  storageId: null,
  originalImageStorageId: null,
  processedImageStorageId: null,
  alphaMaskStorageId: null,
  thumbnailStorageId: null,
  originalImageUrl: null,
  processedImageUrl: null,
  alphaMaskUrl: null,
  thumbnailUrl: null,
  width: null,
  height: null,
}

const RANDOM_NAMES = ['Ada', 'Brindle', 'Corvin', 'Drum', 'Elka', 'Flifos', 'Mira', 'Rook', 'Sable', 'Tove']
const RANDOM_APPEARANCE = [
  'weathered cloak, practical gear, watchful eyes',
  'scarred veteran with a battered shield',
  'bright travel clothes and a confident grin',
  'hooded wanderer with ink-stained hands',
  'grim sellsword carrying too many knives',
  'mud-spattered explorer with a heavy pack',
]
const DEFAULT_GROUP_TAG = 'Misc'

function createCharacterRef(name: string) {
  return `character-library:${name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'character'}`
}

function pickRandom<T>(items: readonly T[]) {
  return items[Math.floor(Math.random() * items.length)]
}

function shuffle<T>(items: readonly T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

function rollAttribute() {
  return Array.from({ length: 3 }, () => 1 + Math.floor(Math.random() * 6)).reduce((sum, value) => sum + value, 0)
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

async function dataUrlToFile(dataUrl: string, fileName: string) {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], fileName, { type: blob.type || 'image/png' })
}

function collectDraftStorageIds(draft: UploadedStandee) {
  return [
    draft.originalImageStorageId,
    draft.processedImageStorageId,
    draft.alphaMaskStorageId,
    draft.thumbnailStorageId,
  ].filter((storageId): storageId is Id<'_storage'> => Boolean(storageId))
}

export function DragonbaneCharacterCreator({ packs }: { packs: RuntimeRulesPackRecord[] | undefined }) {
  const backendBaseUrl = useMemo(
    () => resolveBackendApiBaseUrl(window.location, import.meta.env.VITE_BACKEND_URL),
    [],
  )
  const actorPacksQuery = useQuery(api.actors.listViewerActorPacks, {}) as ActorPackSummary[] | undefined
  const actorsQuery = useQuery(api.actors.listViewerActors, {}) as ActorSummary[] | undefined
  const actorPacks = useMemo(() => actorPacksQuery ?? [], [actorPacksQuery])
  const actors = useMemo(() => actorsQuery ?? [], [actorsQuery])
  const saveActorPack = useMutation(api.actors.saveActorPack)
  const deleteActorPack = useMutation(api.actors.deleteActorPack)
  const saveActor = useMutation(api.actors.saveActor)
  const deleteUploadedActorImages = useMutation(api.actors.deleteUploadedActorImages)

  const rulesPacks = useMemo(
    () => (packs ?? []).filter((pack) => pack.kind === 'rules' && pack.isActive && pack.domains?.dragonbane),
    [packs],
  )
  const [selectedPackIds, setSelectedPackIds] = useState<string[]>([])
  const selectedRulesPacks = useMemo(
    () => (selectedPackIds.length > 0
      ? rulesPacks.filter((pack) => selectedPackIds.includes(pack.packId))
      : rulesPacks),
    [rulesPacks, selectedPackIds],
  )
  const domains = useMemo(() => mergeDragonbaneDomains(selectedRulesPacks), [selectedRulesPacks])
  const [actorKind, setActorKind] = useState<ActorKind>('character')
  const [actorSize, setActorSize] = useState<ActorSize>('M')
  const [characterName, setCharacterName] = useState('')
  const [kinRef, setKinRef] = useState<DragonbaneContentRef | ''>('')
  const [professionRef, setProfessionRef] = useState<DragonbaneContentRef | ''>('')
  const [age, setAge] = useState<DragonbaneAgeCategoryId>('Young')
  const [ageWasSelected, setAgeWasSelected] = useState(false)
  const [weakness, setWeakness] = useState('')
  const [appearance, setAppearance] = useState('')
  const [attributes, setAttributes] = useState(DEFAULT_ATTRIBUTES)
  const [editedAttributeIds, setEditedAttributeIds] = useState<Set<DragonbaneAttributeId>>(() => new Set())
  const [trainedSkillRefs, setTrainedSkillRefs] = useState<DragonbaneContentRef[]>([])
  const [editingActorId, setEditingActorId] = useState<Id<'characters'> | null>(null)
  const [isBuilderOpen, setIsBuilderOpen] = useState(false)
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)
  const [groupTag, setGroupTag] = useState('')
  const [prompt, setPrompt] = useState('')
  const [standee, setStandee] = useState<UploadedStandee>(EMPTY_STANDEE)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const availableKins = useMemo(() => getAvailableKins(domains, actorKind), [domains, actorKind])
  const selectedKin = availableKins.find((kin) => kin.ref === kinRef) ?? null
  const selectedProfession = domains?.dragonbane.professions.find((candidate) => candidate.ref === professionRef) ?? null
  const selectedKinRef = selectedKin?.ref ?? ''
  const selectedProfessionRef = selectedProfession?.ref ?? ''
  const validSkillRefs = new Set(domains?.dragonbane.skills.map((skill) => skill.ref) ?? [])
  const selectedTrainedSkillRefs = trainedSkillRefs.filter((ref) => validSkillRefs.has(ref))
  const trainedSlots = domains ? getDragonbaneTrainedSkillSlots(domains, age) : null
  const professionSkillRefs = useMemo(
    () => new Set(selectedProfession?.trainedSkillRefs ?? []),
    [selectedProfession],
  )
  const selectedProfessionSkillCount = selectedTrainedSkillRefs.filter((ref) => professionSkillRefs.has(ref)).length
  const selectedFreeSkillCount = selectedTrainedSkillRefs.length - selectedProfessionSkillCount
  const remainingProfessionSkillCount = Math.max(0, (trainedSlots?.fromProfession ?? 0) - selectedProfessionSkillCount)
  const remainingFreeSkillCount = Math.max(0, (trainedSlots?.freeChoice ?? 0) - selectedFreeSkillCount)
  const normalizedGroupTag = groupTag.trim()
  const defaultActorPack = actorPacks.find((pack) => pack.name.trim().toLowerCase() === DEFAULT_GROUP_TAG.toLowerCase()) ?? null
  const selectedActorPack = normalizedGroupTag
    ? actorPacks.find((pack) => pack.name.toLowerCase() === normalizedGroupTag.toLowerCase()) ?? null
    : null
  const actorGroups = useMemo<ActorGroup[]>(() => {
    const miscActors = actors.filter((actor) =>
      !actor.actorPackId || (defaultActorPack ? actor.actorPackId === defaultActorPack._id : false))
    const namedGroups = actorPacks
      .filter((pack) => !defaultActorPack || pack._id !== defaultActorPack._id)
      .map((pack) => ({
        id: pack._id,
        name: pack.name,
        actorPackId: pack._id,
        actors: actors.filter((actor) => actor.actorPackId === pack._id),
      }))
      .filter((group) => group.actors.length > 0)
      .sort((left, right) => left.name.localeCompare(right.name))

    if (miscActors.length > 0) {
      return [
        {
          id: defaultActorPack?._id ?? 'misc',
          name: DEFAULT_GROUP_TAG,
          actorPackId: defaultActorPack?._id ?? null,
          actors: miscActors,
        },
        ...namedGroups,
      ]
    }

    return namedGroups
  }, [actorPacks, actors, defaultActorPack])
  const sortedSkills = useMemo(
    () => [...(domains?.dragonbane.skills ?? [])].sort((left, right) => {
      const leftProfession = professionSkillRefs.has(left.ref)
      const rightProfession = professionSkillRefs.has(right.ref)

      if (leftProfession !== rightProfession) {
        return leftProfession ? -1 : 1
      }

      return left.name.localeCompare(right.name)
    }),
    [domains, professionSkillRefs],
  )
  const weaknessOptions = domains?.dragonbane.rules.weaknesses ?? []
  const appearanceOptions = domains?.dragonbane.rules.appearanceOptions ?? []
  const sheetPreview = useMemo(() => {
    if (!domains || !selectedKinRef || !selectedProfessionRef || !characterName.trim()) {
      return null
    }

    try {
      return buildDragonbaneCharacterSheet(domains, {
        characterName,
        kinRef: selectedKinRef,
        professionRef: selectedProfessionRef,
        age,
        weakness,
        appearance,
        attributes,
        trainedSkillRefs: selectedTrainedSkillRefs,
      })
    } catch {
      return null
    }
  }, [age, appearance, attributes, characterName, domains, selectedKinRef, selectedProfessionRef, selectedTrainedSkillRefs, weakness])

  const defaultPrompt = [
    characterName.trim() || 'Dragonbane adventurer',
    age,
    selectedKin?.name,
    selectedProfession?.name,
    weakness.trim(),
    appearance.trim(),
  ].filter(Boolean).join(', ')
  const imagePrompt = prompt.trim() || defaultPrompt
  const canSaveSheet = Boolean(sheetPreview)

  function updateAttribute(attributeId: DragonbaneAttributeId, value: string) {
    const parsedValue = Number(value)
    setEditedAttributeIds((current) => new Set(current).add(attributeId))
    setAttributes((current) => ({
      ...current,
      [attributeId]: Number.isFinite(parsedValue) ? Math.max(1, Math.min(18, parsedValue)) : current[attributeId],
    }))
  }

  function toggleSkill(skillRef: DragonbaneContentRef) {
    const isProfessionSkill = professionSkillRefs.has(skillRef)
    setTrainedSkillRefs((current) => {
      if (current.includes(skillRef)) {
        return current.filter((ref) => ref !== skillRef)
      }

      const currentProfessionCount = current.filter((ref) => professionSkillRefs.has(ref)).length
      const currentFreeCount = current.length - currentProfessionCount
      if (
        trainedSlots &&
        ((isProfessionSkill && currentProfessionCount >= trainedSlots.fromProfession) ||
          (!isProfessionSkill && currentFreeCount >= trainedSlots.freeChoice))
      ) {
        return current
      }

      return [...current, skillRef]
    })
  }

  function resetBuilder() {
    const defaultActorKind: ActorKind = 'character'
    setEditingActorId(null)
    setActorKind(defaultActorKind)
    setActorSize('M')
    setCharacterName('')
    setKinRef(getDefaultKinRef(domains, defaultActorKind))
    setProfessionRef(getDefaultProfessionRef(domains))
    setAge('Young')
    setAgeWasSelected(false)
    setWeakness('')
    setAppearance('')
    setAttributes(DEFAULT_ATTRIBUTES)
    setEditedAttributeIds(new Set())
    setTrainedSkillRefs([])
    setGroupTag(DEFAULT_GROUP_TAG)
    setPrompt('')
    setStandee(EMPTY_STANDEE)
  }

  function startNewCharacter() {
    setIsBuilderOpen(true)
    setError(null)
    setNotice(null)
    resetBuilder()
  }

  function editActor(actor: ActorSummary) {
    const sheet = actor.sheet
    const nextActorKind = actor.kind
    const nextKinRef = sheet?.identity.kinRef ?? getDefaultKinRef(domains, nextActorKind)
    const nextProfessionRef = sheet?.identity.professionRef ?? getDefaultProfessionRef(domains)
    const nextAvailableKins = getAvailableKins(domains, nextActorKind)
    const nextAvailableProfessions = domains?.dragonbane.professions ?? []
    setEditingActorId(actor._id)
    setActorKind(nextActorKind)
    setActorSize(actor.size)
    setCharacterName(sheet?.identity.name ?? actor.name)
    setKinRef(nextAvailableKins.some((kin) => kin.ref === nextKinRef) ? nextKinRef : (nextAvailableKins[0]?.ref ?? ''))
    setProfessionRef(
      nextAvailableProfessions.some((profession) => profession.ref === nextProfessionRef)
        ? nextProfessionRef
        : (nextAvailableProfessions[0]?.ref ?? ''),
    )
    setAge(sheet?.identity.age ?? 'Young')
    setAgeWasSelected(Boolean(sheet))
    setWeakness(sheet?.identity.weakness ?? '')
    setAppearance(sheet?.identity.appearance ?? '')
    setAttributes(sheet?.attributes ?? DEFAULT_ATTRIBUTES)
    setEditedAttributeIds(new Set(ATTRIBUTE_IDS))
    setTrainedSkillRefs(sheet?.skills.filter((skill) => skill.trained).map((skill) => skill.skillRef) ?? [])
    setGroupTag(actor.actorPackName ?? DEFAULT_GROUP_TAG)
    setPrompt(actor.prompt)
    setSelectedPackIds([])
    setStandee({
      model: actor.model,
      storageId: actor.storageId,
      originalImageStorageId: actor.originalImageStorageId,
      processedImageStorageId: actor.processedImageStorageId,
      alphaMaskStorageId: actor.alphaMaskStorageId,
      thumbnailStorageId: actor.thumbnailStorageId,
      originalImageUrl: actor.originalImageUrl,
      processedImageUrl: actor.processedImageUrl,
      alphaMaskUrl: actor.alphaMaskUrl,
      thumbnailUrl: actor.thumbnailUrl,
      width: actor.width,
      height: actor.height,
    })
    setIsBuilderOpen(true)
    setNotice(`Editing ${actor.name}. Save to update the existing character actor.`)
    setError(null)
  }

  function handleRandomizeCharacter() {
    if (!domains) {
      return
    }

    if (availableKins.length === 0 || domains.dragonbane.professions.length === 0) {
      setError('Random generation needs at least one available kin and profession.')
      return
    }

    const nextKin = kinRef
      ? availableKins.find((kin) => kin.ref === kinRef) ?? pickRandom(availableKins)
      : pickRandom(availableKins)
    const nextProfession = professionRef
      ? domains.dragonbane.professions.find((profession) => profession.ref === professionRef) ?? pickRandom(domains.dragonbane.professions)
      : pickRandom(domains.dragonbane.professions)
    const nextAge = ageWasSelected ? age : pickRandom(AGE_OPTIONS)
    const nextSlots = getDragonbaneTrainedSkillSlots(domains, nextAge)
    const nextProfessionSkillRefs = new Set(nextProfession.trainedSkillRefs)
    const allSkillRefs = new Set(domains.dragonbane.skills.map((skill) => skill.ref))
    const currentProfessionRefs = trainedSkillRefs.filter((ref) => nextProfessionSkillRefs.has(ref)).slice(0, nextSlots.fromProfession)
    const currentFreeRefs = trainedSkillRefs
      .filter((ref) => allSkillRefs.has(ref) && !nextProfessionSkillRefs.has(ref))
      .slice(0, nextSlots.freeChoice)
    const randomProfessionRefs = shuffle(nextProfession.trainedSkillRefs)
      .filter((ref) => !currentProfessionRefs.includes(ref))
      .slice(0, Math.max(0, nextSlots.fromProfession - currentProfessionRefs.length))
    const freePool = domains.dragonbane.skills
      .map((skill) => skill.ref)
      .filter((ref) => !nextProfessionSkillRefs.has(ref) && !currentFreeRefs.includes(ref))
    const randomFreeRefs = shuffle(freePool)
      .slice(0, Math.max(0, nextSlots.freeChoice - currentFreeRefs.length))

    setKinRef(nextKin.ref)
    setProfessionRef(nextProfession.ref)
    setAge(nextAge)
    setCharacterName((current) => current.trim() || pickRandom(RANDOM_NAMES))
    setWeakness((current) => current.trim() || (weaknessOptions.length > 0 ? pickRandom(weaknessOptions).name : ''))
    setAppearance((current) => current.trim() || (
      appearanceOptions.length > 0 ? pickRandom(appearanceOptions).name : pickRandom(RANDOM_APPEARANCE)
    ))
    setAttributes((current) => Object.fromEntries(
      ATTRIBUTE_IDS.map((attributeId) => [
        attributeId,
        editedAttributeIds.has(attributeId) ? current[attributeId] : rollAttribute(),
      ]),
    ) as Record<DragonbaneAttributeId, number>)
    setTrainedSkillRefs([...currentProfessionRefs, ...randomProfessionRefs, ...currentFreeRefs, ...randomFreeRefs])
    setNotice('Randomized missing character choices and kept your existing selections.')
    setError(null)
  }

  async function resolveDefaultActorPackTag() {
    if (defaultActorPack?._id) {
      return defaultActorPack._id
    }

    return saveActorPack({
      name: DEFAULT_GROUP_TAG,
      description: 'Default character group',
      isActive: true,
    }) as Promise<Id<'actorPacks'>>
  }

  async function resolveActorPackTag() {
    if (!normalizedGroupTag) {
      return resolveDefaultActorPackTag()
    }

    if (selectedActorPack?._id) {
      return selectedActorPack._id
    }

    return saveActorPack({
      name: normalizedGroupTag,
      description: `Character tag: ${normalizedGroupTag}`,
      isActive: true,
    }) as Promise<Id<'actorPacks'>>
  }

  async function handleDeleteGroup(group: ActorGroup) {
    if (!group.actorPackId) {
      return
    }

    setDeletingGroupId(group.id)
    setError(null)

    try {
      await deleteActorPack({ actorPackId: group.actorPackId })
      if (group.name.toLowerCase() === normalizedGroupTag.toLowerCase()) {
        setGroupTag(DEFAULT_GROUP_TAG)
      }
      setNotice(`Deleted "${group.name}". Characters were moved to ${DEFAULT_GROUP_TAG} when needed.`)
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Deleting tag failed.')
    }

    setDeletingGroupId(null)
  }

  async function handleGenerateImage() {
    if (!imagePrompt) {
      setError('Add a name or prompt before generating a standee.')
      setNotice(null)
      return
    }

    setIsGeneratingImage(true)
    setError(null)
    setNotice(null)

    try {
      const generated = await requestGeneratedCharacterImage(
        composeGeneratedCharacterPrompt({
          kind: actorKind === 'npc' ? 'npc' : 'player',
          name: characterName,
          prompt: imagePrompt,
          size: actorSize,
        }),
        { baseUrl: backendBaseUrl },
      )
      const processed = await processGeneratedCharacterImage(generated.imageDataUrl)
      const previousStorageIds = collectDraftStorageIds(standee)
      const editingActor = editingActorId ? actors.find((actor) => actor._id === editingActorId) : null
      const persistedEditingStorageIds = new Set([
        editingActor?.originalImageStorageId,
        editingActor?.processedImageStorageId,
        editingActor?.alphaMaskStorageId,
        editingActor?.thumbnailStorageId,
      ].filter((storageId): storageId is Id<'_storage'> => Boolean(storageId)))
      const staleDraftStorageIds = previousStorageIds.filter((storageId) => !persistedEditingStorageIds.has(storageId))
      const [originalImageStorageId, processedImageStorageId, alphaMaskStorageId, thumbnailStorageId] = await Promise.all([
        uploadActorAssetThroughBackend(await dataUrlToFile(generated.imageDataUrl, 'original.png')),
        uploadActorAssetThroughBackend(await dataUrlToFile(processed.processedImageDataUrl, 'processed.png')),
        uploadActorAssetThroughBackend(await dataUrlToFile(processed.alphaMaskDataUrl, 'alpha-mask.png')),
        uploadActorAssetThroughBackend(await dataUrlToFile(processed.thumbnailDataUrl, 'thumbnail.png')),
      ])

      if (staleDraftStorageIds.length > 0) {
        await deleteUploadedActorImages({ storageIds: staleDraftStorageIds })
      }

      setStandee({
        model: generated.model,
        storageId: thumbnailStorageId.storageId,
        originalImageStorageId: originalImageStorageId.storageId as Id<'_storage'>,
        processedImageStorageId: processedImageStorageId.storageId as Id<'_storage'>,
        alphaMaskStorageId: alphaMaskStorageId.storageId as Id<'_storage'>,
        thumbnailStorageId: thumbnailStorageId.storageId as Id<'_storage'>,
        originalImageUrl: generated.imageDataUrl,
        processedImageUrl: processed.processedImageDataUrl,
        alphaMaskUrl: processed.alphaMaskDataUrl,
        thumbnailUrl: processed.thumbnailDataUrl,
        width: processed.width,
        height: processed.height,
      })
      setNotice('Generated a standee image. Save the character to add it to the editor actor pack.')
    } catch (generateError) {
      console.error(generateError)
      setError(generateError instanceof Error ? generateError.message : 'Standee generation failed.')
    }

    setIsGeneratingImage(false)
  }

  async function handleSaveCharacter() {
    if (!domains || !selectedKinRef || !selectedProfessionRef) {
      setError('Select an active Dragonbane rules pack before saving.')
      setNotice(null)
      return
    }

    setIsSaving(true)
    setError(null)
    setNotice(null)

    try {
      const sheet = buildDragonbaneCharacterSheet(domains, {
        characterName,
        kinRef: selectedKinRef,
        professionRef: selectedProfessionRef,
        age,
        weakness,
        appearance,
        attributes,
        trainedSkillRefs: selectedTrainedSkillRefs,
      })
      const actorPackId = await resolveActorPackTag()

      await saveActor({
        actorId: editingActorId ?? undefined,
        actorPackId,
        name: sheet.identity.name,
        kind: actorKind,
        prompt: imagePrompt,
        contentRef: createCharacterRef(sheet.identity.name),
        sheet,
        model: standee.model ?? undefined,
        size: actorSize,
        storageId: standee.storageId ?? undefined,
        originalImageStorageId: standee.originalImageStorageId ?? undefined,
        processedImageStorageId: standee.processedImageStorageId ?? undefined,
        alphaMaskStorageId: standee.alphaMaskStorageId ?? undefined,
        thumbnailStorageId: standee.thumbnailStorageId ?? undefined,
        originalImageUrl: standee.originalImageStorageId ? undefined : (standee.originalImageUrl ?? undefined),
        processedImageUrl: standee.processedImageStorageId ? undefined : (standee.processedImageUrl ?? undefined),
        alphaMaskUrl: standee.alphaMaskStorageId ? undefined : (standee.alphaMaskUrl ?? undefined),
        thumbnailUrl: standee.thumbnailStorageId ? undefined : (standee.thumbnailUrl ?? undefined),
        width: standee.width ?? undefined,
        height: standee.height ?? undefined,
      })

      const wasEditing = Boolean(editingActorId)
      resetBuilder()
      setIsBuilderOpen(false)
      setNotice(wasEditing ? 'Updated the Dragonbane character actor.' : 'Saved the Dragonbane character and linked standee actor.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Saving the Dragonbane character failed.')
    }

    setIsSaving(false)
  }

  return (
    <article className="panel panel--characters character-builder">
      <div className="character-builder__hero">
        <div>
          <p className="panel__eyebrow">Dragonbane</p>
          <h2 className="panel__title">Character library</h2>
        </div>
        <div className="character-builder__hero-actions">
          <button className="hero-panel__button hero-panel__button--primary" onClick={startNewCharacter} type="button">
            Create new character
          </button>
        </div>
      </div>

      <section className="library-card character-builder__section character-builder__existing">
        {error ? <p className="auth-card__error">{error}</p> : null}
        {notice ? <p className="library-notice">{notice}</p> : null}
        {actorGroups.length > 0 ? (
          <div className="character-groups">
            {actorGroups.map((group) => (
              <section className="character-group" key={group.id}>
                <div className="character-group__header">
                  <strong>{group.name}</strong>
                  <div className="character-group__actions">
                    <span>{group.actors.length} character{group.actors.length === 1 ? '' : 's'}</span>
                    {group.actorPackId ? (
                      <button
                        className="hero-panel__button hero-panel__button--secondary"
                        disabled={deletingGroupId === group.id}
                        onClick={() => void handleDeleteGroup(group)}
                        type="button"
                      >
                        {deletingGroupId === group.id ? 'Deleting...' : 'Delete tag'}
                      </button>
                    ) : null}
                  </div>
                </div>
                <div className="existing-actors">
                  {group.actors.map((actor) => (
                    <article className="existing-actor" key={actor._id}>
                      <div>
                        <strong>{actor.name}</strong>
                        <span>{actor.kind} · {actor.size}</span>
                      </div>
                      <div className="existing-actor__actions">
                        <small>{actor.processedImageUrl ? 'standee ready' : 'needs image'}</small>
                        <button className="hero-panel__button hero-panel__button--secondary" onClick={() => editActor(actor)} type="button">
                          Edit
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <p className="panel__copy">No saved characters yet.</p>
        )}
      </section>

      {isBuilderOpen ? (
        rulesPacks.length === 0 ? (
          <p className="panel__copy">No active Dragonbane rules packs are available yet.</p>
        ) : (
        <div className="character-builder__layout">
          <section className="library-card character-builder__section">
            <div>
              <p className="status-card__label">Step 1</p>
              <h3 className="library-card__title">Identity</h3>
            </div>
            <div className="library-card__actions">
              <button className="hero-panel__button hero-panel__button--secondary" onClick={handleRandomizeCharacter} type="button">
                Randomize missing choices
              </button>
            </div>

            <div className="character-builder__compact-grid">
              <div className="auth-card__field">
                <span>Rules sources</span>
                <div className="pack-source-list" aria-label="Dragonbane rules sources">
                  {rulesPacks.map((pack) => {
                    const checked = selectedPackIds.length === 0 || selectedPackIds.includes(pack.packId)

                    return (
                      <label className="pack-source-choice" key={pack._id ?? pack.packId}>
                        <input
                          checked={checked}
                          onChange={() => {
                            const activeIds = selectedPackIds.length === 0 ? rulesPacks.map((rulesPack) => rulesPack.packId) : selectedPackIds
                            const nextIds = activeIds.includes(pack.packId)
                              ? activeIds.filter((packId) => packId !== pack.packId)
                              : [...activeIds, pack.packId]
                            const resolvedPackIds = nextIds.length === rulesPacks.length ? [] : nextIds
                            const nextRulesPacks = resolvedPackIds.length > 0
                              ? rulesPacks.filter((rulesPack) => resolvedPackIds.includes(rulesPack.packId))
                              : rulesPacks
                            const nextDomains = mergeDragonbaneDomains(nextRulesPacks)
                            const nextAvailableKins = getAvailableKins(nextDomains, actorKind)
                            const nextAvailableProfessions = nextDomains?.dragonbane.professions ?? []

                            setSelectedPackIds(resolvedPackIds)
                            setKinRef(nextAvailableKins.some((kin) => kin.ref === kinRef) ? kinRef : (nextAvailableKins[0]?.ref ?? ''))
                            setProfessionRef(
                              nextAvailableProfessions.some((profession) => profession.ref === professionRef)
                                ? professionRef
                                : (nextAvailableProfessions[0]?.ref ?? ''),
                            )
                            setTrainedSkillRefs([])
                          }}
                          type="checkbox"
                        />
                        <span>{pack.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <label className="auth-card__field">
                <span>Type</span>
                <select
                  className="auth-card__select"
                  onChange={(event) => {
                    const nextActorKind = event.target.value as ActorKind
                    const nextAvailableKins = getAvailableKins(domains, nextActorKind)

                    setActorKind(nextActorKind)
                    setKinRef(nextAvailableKins.some((kin) => kin.ref === kinRef) ? kinRef : (nextAvailableKins[0]?.ref ?? ''))
                  }}
                  value={actorKind}
                >
                  <option value="character">Player character</option>
                  <option value="npc">NPC</option>
                </select>
              </label>
            </div>

            <label className="auth-card__field">
              <span>Name</span>
              <input onChange={(event) => setCharacterName(event.target.value)} placeholder="Ada" type="text" value={characterName} />
            </label>

            <div className="character-builder__compact-grid">
              <label className="auth-card__field">
                <span>Kin</span>
                <select className="auth-card__select" onChange={(event) => setKinRef(event.target.value as DragonbaneContentRef)} value={kinRef}>
                  {kinRef === '' ? <option value="">Select kin</option> : null}
                  {availableKins.map((kin) => (
                    <option key={kin.ref} value={kin.ref}>
                      {kin.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="auth-card__field">
                <span>Profession</span>
                <select
                  className="auth-card__select"
                  onChange={(event) => {
                    setProfessionRef(event.target.value as DragonbaneContentRef)
                    setTrainedSkillRefs([])
                  }}
                  value={professionRef}
                >
                  {professionRef === '' ? <option value="">Select profession</option> : null}
                  {domains?.dragonbane.professions.map((nextProfession) => (
                    <option key={nextProfession.ref} value={nextProfession.ref}>
                      {nextProfession.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="auth-card__field">
                <span>Age</span>
                <select
                  className="auth-card__select"
                  onChange={(event) => {
                    setAge(event.target.value as DragonbaneAgeCategoryId)
                    setAgeWasSelected(true)
                  }}
                  value={age}
                >
                  {AGE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="auth-card__field">
              <span>Weakness</span>
              <input
                list="dragonbane-weakness-options"
                onChange={(event) => setWeakness(event.target.value)}
                placeholder="Gullible"
                type="text"
                value={weakness}
              />
              {weaknessOptions.length > 0 ? (
                <datalist id="dragonbane-weakness-options">
                  {weaknessOptions.map((option) => (
                    <option key={option.ref} value={option.name} />
                  ))}
                </datalist>
              ) : null}
            </label>

            <label className="auth-card__field">
              <span>Appearance notes</span>
              <textarea
                className="library-editor"
                onChange={(event) => setAppearance(event.target.value)}
                placeholder="Scarred veteran with a bronze shield..."
                rows={3}
                value={appearance}
              />
            </label>
            {appearanceOptions.length > 0 ? (
              <div className="panel__copy">
                Suggestions: {appearanceOptions.slice(0, 4).map((option) => option.name).join(' · ')}
              </div>
            ) : null}
          </section>

          <section className="library-card character-builder__section">
            <div>
              <p className="status-card__label">Step 2</p>
              <h3 className="library-card__title">Attributes drive the rules</h3>
              <p className="panel__copy">HP, WP, movement, damage bonus, carrying capacity, and skill values update from these scores.</p>
            </div>

            <div className="attribute-grid">
              {ATTRIBUTE_IDS.map((attributeId) => (
                <label className="attribute-control" key={attributeId}>
                  <span>{attributeId}</span>
                  <input
                    aria-label={attributeId}
                    max={18}
                    min={1}
                    onChange={(event) => updateAttribute(attributeId, event.target.value)}
                    type="number"
                    value={attributes[attributeId]}
                  />
                  <small>Base {getDragonbaneSkillBaseChance(attributes[attributeId])}</small>
                </label>
              ))}
            </div>
          </section>

          <section className="library-card character-builder__section character-builder__skills">
            <div className="library-card__header">
              <div>
                <p className="status-card__label">Step 3</p>
                <h3 className="library-card__title">Trained skills</h3>
                <p className="panel__copy">
                  Pick {remainingProfessionSkillCount} more highlighted profession skill{remainingProfessionSkillCount === 1 ? '' : 's'} and {remainingFreeSkillCount} more free skill{remainingFreeSkillCount === 1 ? '' : 's'}.
                </p>
              </div>
              <div className="skill-counter">
                <strong>{selectedTrainedSkillRefs.length}/{trainedSlots?.total ?? 0}</strong>
                <span>{selectedProfessionSkillCount}/{trainedSlots?.fromProfession ?? 0} profession · {selectedFreeSkillCount}/{trainedSlots?.freeChoice ?? 0} free</span>
              </div>
            </div>

            {selectedProfession && professionSkillRefs.size === 0 ? (
              <p className="auth-card__error">
                This profession has no imported profession-skill list yet, so the rules pack needs to be re-imported.
              </p>
            ) : null}

            <div className="skill-list">
              {sortedSkills.map((skill) => {
                const isProfessionSkill = professionSkillRefs.has(skill.ref)
                const isSelected = selectedTrainedSkillRefs.includes(skill.ref)
                const isDisabled = !isSelected && trainedSlots
                  ? isProfessionSkill
                    ? selectedProfessionSkillCount >= trainedSlots.fromProfession
                    : selectedFreeSkillCount >= trainedSlots.freeChoice
                  : false

                return (
                  <label className={`skill-choice ${isProfessionSkill ? 'skill-choice--profession' : ''} ${isDisabled ? 'skill-choice--disabled' : ''}`} key={skill.ref}>
                    <input
                      checked={isSelected}
                      disabled={isDisabled}
                      onChange={() => toggleSkill(skill.ref)}
                      type="checkbox"
                    />
                    <span>
                      <strong>
                        {skill.name}
                        {isProfessionSkill ? <em>Profession pick</em> : null}
                      </strong>
                      <small>
                        {skill.attributeId} {getDragonbaneSkillBaseChance(attributes[skill.attributeId])}
                        {' -> '}
                        {getDragonbaneSkillBaseChance(attributes[skill.attributeId]) * 2} trained
                        {isProfessionSkill ? ' · profession' : ''}
                      </small>
                    </span>
                  </label>
                )
              })}
            </div>
          </section>

          <aside className="library-card character-builder__section character-builder__summary">
            <div>
              <p className="status-card__label">Live sheet</p>
              <h3 className="library-card__title">{sheetPreview?.identity.name || 'Incomplete sheet'}</h3>
            </div>

            <div className="summary-grid">
              <div><span>HP</span><strong>{sheetPreview?.derived.maxHp ?? '-'}</strong></div>
              <div><span>WP</span><strong>{sheetPreview?.derived.maxWp ?? '-'}</strong></div>
              <div><span>Move</span><strong>{sheetPreview?.derived.movement ?? '-'}</strong></div>
              <div><span>Carry</span><strong>{sheetPreview?.derived.carryingCapacity ?? '-'}</strong></div>
              <div><span>STR dmg</span><strong>{sheetPreview?.derived.damageBonusStrength ?? '-'}</strong></div>
              <div><span>AGL dmg</span><strong>{sheetPreview?.derived.damageBonusAgility ?? '-'}</strong></div>
            </div>

            <div>
              <p className="status-card__label">Starting gear</p>
              <p className="panel__copy">
                {sheetPreview
                  ? `${sheetPreview.inventory.weaponRefs.length} weapons, ${sheetPreview.inventory.armorRefs.length} armor, ${sheetPreview.inventory.itemRefs.length} items, ${sheetPreview.inventory.copper} copper`
                  : 'Complete the sheet to preview gear.'}
              </p>
            </div>
          </aside>

          <section className="library-card character-builder__section character-builder__standee">
            <div>
              <p className="status-card__label">Step 4</p>
              <h3 className="library-card__title">Standee and editor actor</h3>
              <p className="panel__copy">Characters without a custom tag are saved to the default Misc group.</p>
            </div>

            <div className="character-builder__compact-grid">
              <label className="auth-card__field">
                <span>Group tag</span>
                <input
                  className="auth-card__select"
                  list="character-group-tags"
                  onChange={(event) => setGroupTag(event.target.value)}
                  placeholder={DEFAULT_GROUP_TAG}
                  value={groupTag}
                />
                <datalist id="character-group-tags">
                  {actorPacks.map((pack) => <option key={pack._id} value={pack.name} />)}
                </datalist>
              </label>

              <label className="auth-card__field">
                <span>Standee size</span>
                <select className="auth-card__select" onChange={(event) => setActorSize(event.target.value as ActorSize)} value={actorSize}>
                  <option value="S">Small</option>
                  <option value="M">Medium</option>
                  <option value="XL">Large</option>
                  <option value="XXL">Huge</option>
                </select>
              </label>
            </div>

            <label className="auth-card__field">
              <span>Image prompt</span>
              <textarea
                className="library-editor"
                onChange={(event) => setPrompt(event.target.value)}
                placeholder={defaultPrompt}
                rows={3}
                value={prompt}
              />
            </label>

            {standee.thumbnailUrl ? (
              <img
                alt={`${characterName || 'Character'} standee preview`}
                className="standee-preview"
                src={resolveActorAssetUrl(standee.thumbnailUrl, backendBaseUrl) ?? standee.thumbnailUrl}
              />
            ) : (
              <div className="standee-empty">No standee generated yet.</div>
            )}

            <div className="library-card__actions">
              <button className="hero-panel__button hero-panel__button--secondary" disabled={isGeneratingImage} onClick={() => void handleGenerateImage()} type="button">
                {isGeneratingImage ? 'Generating...' : 'Generate standee'}
              </button>
              <button className="hero-panel__button hero-panel__button--primary" disabled={isSaving || !canSaveSheet} onClick={() => void handleSaveCharacter()} type="button">
                {isSaving ? 'Saving...' : editingActorId ? 'Update character actor' : 'Save character actor'}
              </button>
            </div>
          </section>

        </div>
      )) : null}
    </article>
  )
}
