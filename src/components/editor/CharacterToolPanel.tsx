import { useMemo, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { getContentPackAssetById, getContentPackAssetsByCategory } from '../../content-packs/registry'
import { isGeneratedCharacterAssetId } from '../../content-packs/runtimeRegistry'
import { deleteGeneratedCharacterAssets } from '../../generated-characters/api'
import {
  getGeneratedCharacterDisplayName,
  isGeneratedCharacterReady,
} from '../../generated-characters/types'
import type { ContentPackAsset } from '../../content-packs/types'
import { useDungeonStore } from '../../store/useDungeonStore'
import { AssetCatalog } from './AssetCatalog'
import { CompactPillButton } from './CompactPillButton'

const CREATE_CHARACTER_CARD_ID = 'generated.character.create-new'
const EMPTY_COMPONENT = () => null

export function CharacterToolPanel() {
  const selectedAssetIds = useDungeonStore((state) => state.selectedAssetIds)
  const setSelectedAsset = useDungeonStore((state) => state.setSelectedAsset)
  const generatedCharacters = useDungeonStore((state) => state.generatedCharacters)
  const createGeneratedCharacterDraft = useDungeonStore((state) => state.createGeneratedCharacterDraft)
  const openCharacterSheet = useDungeonStore((state) => state.openCharacterSheet)
  const removeGeneratedCharacter = useDungeonStore((state) => state.removeGeneratedCharacter)
  const selection = useDungeonStore((state) => state.selection)
  const selectedObject = useDungeonStore((state) =>
    selection ? state.placedObjects[selection] : null,
  )
  const selectedPlacedAsset = selectedObject?.assetId
    ? getContentPackAssetById(selectedObject.assetId)
    : null
  const corePlayerAssets = useMemo(
    () => getContentPackAssetsByCategory('player').filter((asset) => !isGeneratedCharacterAssetId(asset.id)),
    [],
  )
  const [characterError, setCharacterError] = useState<string | null>(null)

  const createdCharacterAssets = useMemo(() => {
    const records = Object.values(generatedCharacters)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map<ContentPackAsset>((character) => ({
        id: character.assetId,
        slug: character.assetId,
        name: getGeneratedCharacterDisplayName(character),
        category: 'player',
        thumbnailUrl: character.thumbnailUrl ?? undefined,
        Component: EMPTY_COMPONENT,
      }))

    return [
      ...records,
      {
        id: CREATE_CHARACTER_CARD_ID,
        slug: 'create-character',
        name: 'Create New Character',
        category: 'player' as const,
        Component: EMPTY_COMPONENT,
      },
    ]
  }, [generatedCharacters])

  async function handleDeleteGeneratedCharacter(assetId: string) {
    setCharacterError(null)
    const record = generatedCharacters[assetId]
    if (!record) {
      return
    }

    if (!removeGeneratedCharacter(assetId)) {
      setCharacterError('Remove this character from the dungeon before deleting it.')
      return
    }

    if (!record.storageId) {
      return
    }

    try {
      await deleteGeneratedCharacterAssets(record.storageId)
    } catch (error) {
      setCharacterError(error instanceof Error ? error.message : 'Could not delete generated character assets.')
    }
  }

  function handleCharacterSelect(asset: ContentPackAsset) {
    if (asset.id === CREATE_CHARACTER_CARD_ID) {
      const draftId = createGeneratedCharacterDraft()
      openCharacterSheet(draftId)
      return
    }

    const generatedCharacter = generatedCharacters[asset.id]
    if (generatedCharacter) {
      if (isGeneratedCharacterReady(generatedCharacter)) {
        setSelectedAsset('player', asset.id)
        return
      }

      openCharacterSheet(asset.id)
      return
    }

    setSelectedAsset('player', asset.id)
  }

  return (
    <div className="space-y-4">
      <AssetCatalog
        title="Character Library"
        sections={[
          { title: 'Created Characters', assets: createdCharacterAssets },
          ...(corePlayerAssets.length > 0 ? [{ title: 'Core Characters', assets: corePlayerAssets }] : []),
        ]}
        isSelected={(asset) => selectedAssetIds.player === asset.id}
        onSelect={handleCharacterSelect}
        renderActions={(asset) => {
          const record = generatedCharacters[asset.id]
          if (!record) {
            return null
          }

          return (
            <div className="flex gap-2">
              <button
                type="button"
                aria-label={`Edit ${record.name || 'character'}`}
                title="Edit character"
                onClick={(event) => {
                  event.stopPropagation()
                  openCharacterSheet(asset.id)
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-sky-300/30 bg-sky-400/10 text-sky-100 transition hover:border-sky-200/50 hover:bg-sky-400/15"
              >
                <Pencil size={12} strokeWidth={1.9} />
              </button>
              <button
                type="button"
                aria-label={`Delete ${record.name || 'character'}`}
                title="Delete character"
                onClick={(event) => {
                  event.stopPropagation()
                  void handleDeleteGeneratedCharacter(asset.id)
                }}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-rose-400/30 bg-rose-500/10 text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-500/20"
              >
                <Trash2 size={12} strokeWidth={1.9} />
              </button>
            </div>
          )
        }}
        getBadgeLabel={(asset, active) => {
          if (active) {
            return 'Selected'
          }
          if (asset.id === CREATE_CHARACTER_CARD_ID) {
            return 'New'
          }
          const record = generatedCharacters[asset.id]
          if (!record) {
            return 'Core'
          }
          return isGeneratedCharacterReady(record) ? record.kind.toUpperCase() : 'Draft'
        }}
        getBadgeClassName={(asset, active) => {
          if (active) {
            return 'bg-teal-300/15 text-teal-100'
          }
          if (asset.id === CREATE_CHARACTER_CARD_ID) {
            return 'bg-amber-400/15 text-amber-200'
          }
          return generatedCharacters[asset.id]
            ? 'bg-sky-400/10 text-sky-200'
            : 'bg-stone-800 text-stone-400'
        }}
        getDescription={(asset) => {
          if (asset.id === CREATE_CHARACTER_CARD_ID) {
            return 'Open a blank character sheet with default values.'
          }
          const record = generatedCharacters[asset.id]
          if (!record) {
            return asset.slug
          }
          if (!isGeneratedCharacterReady(record)) {
            return 'Draft character — open to finish setup and generate an image.'
          }
          return record.prompt.trim() || 'Generated character'
        }}
      />

      {characterError && (
        <p className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {characterError}
        </p>
      )}

      <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-xs leading-6 text-stone-400">
        <p className="font-medium text-stone-300">Character Placement</p>
        <p className="mt-1">Click a ready character to arm it for placement in the viewport.</p>
        <p>Draft characters reopen in the character sheet until they have a generated standee image.</p>
      </section>

      {selectedObject?.type === 'player' && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">
            Selected Character
          </p>
          <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {selectedPlacedAsset?.name ?? selectedObject.type}
                </p>
                <p className="mt-1 font-mono text-sm text-stone-200">
                  {selectedObject.id.slice(0, 8)}
                </p>
              </div>
              {selectedObject.assetId && generatedCharacters[selectedObject.assetId] && (
                <CompactPillButton
                  type="button"
                  onClick={() => openCharacterSheet(selectedObject.assetId!)}
                  tone="sky"
                  size="sm"
                >
                  Edit
                </CompactPillButton>
              )}
            </div>
            <div className="grid gap-2 text-xs">
              <CharacterRow label="Position" value={selectedObject.position.map((v) => v.toFixed(2)).join(', ')} />
              <CharacterRow label="Rotation" value={selectedObject.rotation.map((v) => v.toFixed(2)).join(', ')} />
              <CharacterRow label="Cell" value={selectedObject.cellKey} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function CharacterRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2">
      <span className="uppercase tracking-[0.2em] text-stone-500">{label}</span>
      <span className="break-all text-right text-stone-300">{value}</span>
    </div>
  )
}
