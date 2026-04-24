export const ACTOR_KINDS = ['character', 'npc'] as const
export type ActorKind = (typeof ACTOR_KINDS)[number]

export const ACTOR_SIZES = ['S', 'M', 'XL', 'XXL'] as const
export type ActorSize = (typeof ACTOR_SIZES)[number]

const EDITOR_ACTOR_ASSET_PREFIX = 'generated.player.'

export type EditorActorRecord = {
  actorId: string
  actorPackId: string
  actorPackName: string
  assetId: string
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
  createdAt: string
  updatedAt: string
}

export function buildEditorActorAssetId(actorId: string) {
  return `${EDITOR_ACTOR_ASSET_PREFIX}${actorId}`
}

export function isEditorActorReady(actor: Pick<EditorActorRecord, 'processedImageUrl' | 'thumbnailUrl' | 'width' | 'height'>) {
  return Boolean(
    actor.processedImageUrl &&
    actor.thumbnailUrl &&
    actor.width &&
    actor.height,
  )
}
