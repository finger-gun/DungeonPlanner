import type { ContentPackAsset, ContentPackCategory } from './types'
import { GeneratedStandeePlayer } from '../generated-characters/GeneratedStandeePlayer'
import {
  getGeneratedCharacterDisplayName,
  isGeneratedCharacterReady,
  type GeneratedCharacterRecord,
} from '../generated-characters/types'

const GENERATED_CHARACTER_PREFIX = 'generated.player.'
const runtimeAssetById = new Map<string, ContentPackAsset>()

export function syncGeneratedCharacterAssets(characters: Record<string, GeneratedCharacterRecord>) {
  runtimeAssetById.clear()
  Object.values(characters).forEach((character) => {
    if (!isGeneratedCharacterReady(character)) {
      return
    }
    runtimeAssetById.set(character.assetId, createGeneratedCharacterAsset(character))
  })
}

export function getRuntimeAssetById(id: string) {
  return runtimeAssetById.get(id) ?? null
}

export function getRuntimeAssetsByCategory(category: ContentPackCategory) {
  return [...runtimeAssetById.values()].filter((asset) => asset.category === category)
}

export function isGeneratedCharacterAssetId(assetId: string | null | undefined) {
  return Boolean(assetId && assetId.startsWith(GENERATED_CHARACTER_PREFIX))
}

export function createGeneratedCharacterAssetId(id: string) {
  return `${GENERATED_CHARACTER_PREFIX}${id}`
}

function createGeneratedCharacterAsset(character: GeneratedCharacterRecord): ContentPackAsset {
  return {
    id: character.assetId,
    slug: character.assetId.replace(/[^a-z0-9]+/gi, '_').toLowerCase(),
    name: getGeneratedCharacterDisplayName(character),
    category: 'player',
    thumbnailUrl: character.thumbnailUrl ?? undefined,
    Component: (props) => <GeneratedStandeePlayer character={character} {...props} />,
    metadata: {
      connectsTo: 'FLOOR',
    },
  }
}
