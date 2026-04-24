import { useMemo } from 'react'
import { getContentPackAssetById, getContentPackAssetsByCategory } from '../../content-packs/registry'
import { isGeneratedCharacterAssetId } from '../../content-packs/runtimeRegistry'
import {
  getGeneratedCharacterDisplayName,
  isGeneratedCharacterReady,
} from '../../generated-characters/types'
import type { ContentPackAsset } from '../../content-packs/types'
import { useDungeonStore } from '../../store/useDungeonStore'
import { AssetCatalog } from './AssetCatalog'

const EMPTY_COMPONENT = () => null

export function CharacterToolPanel() {
  const selectedAssetIds = useDungeonStore((state) => state.selectedAssetIds)
  const setSelectedAsset = useDungeonStore((state) => state.setSelectedAsset)
  const generatedCharacters = useDungeonStore((state) => state.generatedCharacters)
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

  const actorAssets = useMemo(
    () => Object.values(generatedCharacters)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .map<ContentPackAsset>((character) => ({
        id: character.assetId,
        slug: character.assetId,
        name: getGeneratedCharacterDisplayName(character),
        category: 'player',
        thumbnailUrl: character.thumbnailUrl ?? undefined,
        Component: EMPTY_COMPONENT,
      })),
    [generatedCharacters],
  )

  function handleCharacterSelect(asset: ContentPackAsset) {
    const generatedCharacter = generatedCharacters[asset.id]
    if (generatedCharacter && !isGeneratedCharacterReady(generatedCharacter)) {
      return
    }

    setSelectedAsset('player', asset.id)
  }

  return (
    <div className="space-y-4">
      <AssetCatalog
        title="Character Library"
        sections={[
          { title: 'Active Actor Packs', assets: actorAssets },
          ...(corePlayerAssets.length > 0 ? [{ title: 'Core Characters', assets: corePlayerAssets }] : []),
        ]}
        isSelected={(asset) => selectedAssetIds.player === asset.id}
        onSelect={handleCharacterSelect}
        getBadgeLabel={(asset, active) => {
          if (active) {
            return 'Selected'
          }
          const record = generatedCharacters[asset.id]
          if (!record) {
            return 'Core'
          }
          return isGeneratedCharacterReady(record) ? record.kind.toUpperCase() : 'Pending'
        }}
        getBadgeClassName={(asset, active) => {
          if (active) {
            return 'bg-teal-300/15 text-teal-100'
          }
          return generatedCharacters[asset.id]
            ? 'bg-sky-400/10 text-sky-200'
            : 'bg-stone-800 text-stone-400'
        }}
        getDescription={(asset) => {
          const record = generatedCharacters[asset.id]
          if (!record) {
            return asset.slug
          }
          if (!isGeneratedCharacterReady(record)) {
            return 'This actor is still preparing and is not ready for placement yet.'
          }
          return record.prompt.trim() || 'Generated character'
        }}
      />

      <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-xs leading-6 text-stone-400">
        <p className="font-medium text-stone-300">Character Placement</p>
        <p className="mt-1">Click a ready actor to arm it for placement in the viewport.</p>
        <p>Creation and editing now happen in the app. The editor only shows active actor packs.</p>
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
