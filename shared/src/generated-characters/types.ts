export type GeneratedCharacterKind = 'player' | 'npc'
export type GeneratedCharacterSize = 'S' | 'M' | 'XL' | 'XXL'
export type GeneratedCharacterPackScope = 'global' | 'workspace'

export type GeneratedCharacterRecord = {
  assetId: string
  storageId: string | null
  name: string
  kind: GeneratedCharacterKind
  prompt: string
  model: string | null
  size: GeneratedCharacterSize
  originalImageUrl: string | null
  processedImageUrl: string | null
  alphaMaskUrl: string | null
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  dragonbaneSummary?: {
    system: 'dragonbane'
    name: string
    movement: number
    hp: { current: number; max: number }
    wp: { current: number; max: number }
    conditions: Array<{ id: string; checked: boolean }>
    weapons: Array<{ ref: string; name: string; damage?: string }>
    armor: Array<{ ref: string; name: string; rating: number }>
    carryingLoad: { carried: number; capacity: number }
  } | null
  packId: string | null
  packName: string | null
  packDescription: string | null
  packScope: GeneratedCharacterPackScope | null
  createdAt: string
  updatedAt: string
}

export type GeneratedCharacterPackEntry = {
  id: string
  name: string
  prompt: string
  kind: GeneratedCharacterKind
  size: GeneratedCharacterSize
  model: string | null
  originalImagePath: string | null
  portraitImagePath: string | null
  processedImagePath: string
  alphaMaskPath: string | null
  thumbnailPath: string
  width: number
  height: number
  createdAt: string
  updatedAt: string
}

export type GeneratedCharacterPackManifest = {
  schemaVersion: 1
  type: 'generated-character-pack'
  packId: string
  name: string
  description: string
  scope: GeneratedCharacterPackScope
  tags: string[]
  generatedAt: string
  characters: GeneratedCharacterPackEntry[]
}

export type GeneratedCharacterPackIndex = {
  schemaVersion: 1
  manifests: string[]
}

export type CreateGeneratedCharacterInput = Partial<
  Omit<GeneratedCharacterRecord, 'assetId' | 'createdAt' | 'updatedAt'>
>

export type UpdateGeneratedCharacterInput = CreateGeneratedCharacterInput

export const DEFAULT_GENERATED_CHARACTER_SIZE: GeneratedCharacterSize = 'M'
export const DEFAULT_GENERATED_CHARACTER_KIND: GeneratedCharacterKind = 'player'
export const DEFAULT_GENERATED_CHARACTER_NAME = 'Untitled Character'

export function createDefaultGeneratedCharacterInput(): CreateGeneratedCharacterInput {
  return {
    storageId: null,
    name: '',
    kind: DEFAULT_GENERATED_CHARACTER_KIND,
    prompt: '',
    model: null,
    size: DEFAULT_GENERATED_CHARACTER_SIZE,
    originalImageUrl: null,
    processedImageUrl: null,
    alphaMaskUrl: null,
    thumbnailUrl: null,
    width: null,
    height: null,
    packId: null,
    packName: null,
    packDescription: null,
    packScope: null,
  }
}

export function getGeneratedCharacterDisplayName(character: Pick<GeneratedCharacterRecord, 'name'>) {
  const trimmed = character.name.trim()
  return trimmed.length > 0 ? trimmed : DEFAULT_GENERATED_CHARACTER_NAME
}

export function isGeneratedCharacterReady(
  character: Pick<GeneratedCharacterRecord, 'processedImageUrl' | 'thumbnailUrl' | 'width' | 'height'>,
) {
  return Boolean(
    character.processedImageUrl &&
    character.thumbnailUrl &&
    character.width &&
    character.height,
  )
}

export function normalizeGeneratedCharacterRecord(
  assetId: string,
  input: Partial<GeneratedCharacterRecord>,
): GeneratedCharacterRecord {
  const createdAt = typeof input.createdAt === 'string' && input.createdAt.trim()
    ? input.createdAt
    : new Date().toISOString()
  const updatedAt = typeof input.updatedAt === 'string' && input.updatedAt.trim()
    ? input.updatedAt
    : createdAt

  return {
    assetId,
    storageId: typeof input.storageId === 'string' && input.storageId.trim() ? input.storageId : null,
    name: typeof input.name === 'string' ? input.name : '',
    kind: input.kind === 'npc' ? 'npc' : DEFAULT_GENERATED_CHARACTER_KIND,
    prompt: typeof input.prompt === 'string' ? input.prompt : '',
    model: typeof input.model === 'string' && input.model.trim() ? input.model : null,
    size: isGeneratedCharacterSize(input.size) ? input.size : DEFAULT_GENERATED_CHARACTER_SIZE,
    originalImageUrl: typeof input.originalImageUrl === 'string' && input.originalImageUrl.trim()
      ? input.originalImageUrl
      : null,
    processedImageUrl: typeof input.processedImageUrl === 'string' && input.processedImageUrl.trim()
      ? input.processedImageUrl
      : null,
    alphaMaskUrl: typeof input.alphaMaskUrl === 'string' && input.alphaMaskUrl.trim()
      ? input.alphaMaskUrl
      : null,
    thumbnailUrl: typeof input.thumbnailUrl === 'string' && input.thumbnailUrl.trim()
      ? input.thumbnailUrl
      : null,
    width: typeof input.width === 'number' && input.width > 0 ? input.width : null,
    height: typeof input.height === 'number' && input.height > 0 ? input.height : null,
    dragonbaneSummary: normalizeGeneratedCharacterDragonbaneSummary(input.dragonbaneSummary),
    packId: typeof input.packId === 'string' && input.packId.trim() ? input.packId : null,
    packName: typeof input.packName === 'string' && input.packName.trim() ? input.packName : null,
    packDescription: typeof input.packDescription === 'string' && input.packDescription.trim()
      ? input.packDescription
      : null,
    packScope: isGeneratedCharacterPackScope(input.packScope) ? input.packScope : null,
    createdAt,
    updatedAt,
  }
}

function normalizeGeneratedCharacterDragonbaneSummary(
  input: GeneratedCharacterRecord['dragonbaneSummary'] | unknown,
): GeneratedCharacterRecord['dragonbaneSummary'] {
  if (!isRecord(input) || input.system !== 'dragonbane') {
    return null
  }

  const hp = normalizeCurrentMax(input.hp)
  const wp = normalizeCurrentMax(input.wp)
  const carryingLoad = normalizeCurrentMax(input.carryingLoad, 'carried', 'capacity')

  if (
    typeof input.name !== 'string'
    || typeof input.movement !== 'number'
    || !hp
    || !wp
    || !carryingLoad
    || !Array.isArray(input.conditions)
    || !Array.isArray(input.weapons)
    || !Array.isArray(input.armor)
  ) {
    return null
  }

  return {
    system: 'dragonbane',
    name: input.name,
    movement: input.movement,
    hp,
    wp,
    conditions: input.conditions
      .filter((condition): condition is { id: string; checked: unknown } =>
        isRecord(condition) && typeof condition.id === 'string')
      .map((condition) => ({ id: condition.id, checked: Boolean(condition.checked) })),
    weapons: input.weapons
      .filter((weapon): weapon is { ref: string; name: string; damage?: string } =>
        isRecord(weapon) && typeof weapon.ref === 'string' && typeof weapon.name === 'string')
      .map((weapon) => ({
        ref: weapon.ref,
        name: weapon.name,
        damage: typeof weapon.damage === 'string' ? weapon.damage : undefined,
      })),
    armor: input.armor
      .filter((armor): armor is { ref: string; name: string; rating: number } =>
        isRecord(armor) && typeof armor.ref === 'string' && typeof armor.name === 'string' && typeof armor.rating === 'number')
      .map((armor) => ({ ref: armor.ref, name: armor.name, rating: armor.rating })),
    carryingLoad,
  }
}

function normalizeCurrentMax(
  input: unknown,
  currentKey: 'current' | 'carried' = 'current',
  maxKey: 'max' | 'capacity' = 'max',
) {
  if (!isRecord(input) || typeof input[currentKey] !== 'number' || typeof input[maxKey] !== 'number') {
    return null
  }

  return {
    [currentKey]: input[currentKey],
    [maxKey]: input[maxKey],
  } as { current: number; max: number } & { carried: number; capacity: number }
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === 'object' && input !== null && !Array.isArray(input)
}

function isGeneratedCharacterSize(value: unknown): value is GeneratedCharacterSize {
  return value === 'S' || value === 'M' || value === 'XL' || value === 'XXL'
}

function isGeneratedCharacterPackScope(value: unknown): value is GeneratedCharacterPackScope {
  return value === 'global' || value === 'workspace'
}
