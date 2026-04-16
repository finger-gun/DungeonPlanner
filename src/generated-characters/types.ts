export type GeneratedCharacterKind = 'player' | 'npc'
export type GeneratedCharacterSize = 'S' | 'M' | 'XL' | 'XXL'

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
  thumbnailUrl: string | null
  width: number | null
  height: number | null
  createdAt: string
  updatedAt: string
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
    thumbnailUrl: null,
    width: null,
    height: null,
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
    thumbnailUrl: typeof input.thumbnailUrl === 'string' && input.thumbnailUrl.trim()
      ? input.thumbnailUrl
      : null,
    width: typeof input.width === 'number' && input.width > 0 ? input.width : null,
    height: typeof input.height === 'number' && input.height > 0 ? input.height : null,
    createdAt,
    updatedAt,
  }
}

function isGeneratedCharacterSize(value: unknown): value is GeneratedCharacterSize {
  return value === 'S' || value === 'M' || value === 'XL' || value === 'XXL'
}
