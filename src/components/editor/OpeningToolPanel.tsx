import { getContentPackAssetById, getContentPackAssetsByCategory } from '../../content-packs/registry'
import type { ContentPackAsset } from '../../content-packs/types'
import { metadataSupportsConnectorType } from '../../content-packs/connectors'
import { useDungeonStore } from '../../store/useDungeonStore'
import { AssetCatalog } from './AssetCatalog'

export function OpeningToolPanel() {
  const selectedAssetIds = useDungeonStore((state) => state.selectedAssetIds)
  const wallConnectionMode = useDungeonStore((state) => state.wallConnectionMode)
  const setSelectedAsset = useDungeonStore((state) => state.setSelectedAsset)
  const setWallConnectionMode = useDungeonStore((state) => state.setWallConnectionMode)
  const selection = useDungeonStore((state) => state.selection)
  const selectedOpening = useDungeonStore((state) =>
    selection ? state.wallOpenings[selection] : null,
  )
  const removeOpening = useDungeonStore((state) => state.removeOpening)
  const openingAssets = getContentPackAssetsByCategory('opening')
  const selectedAsset = selectedOpening?.assetId
    ? getContentPackAssetById(selectedOpening.assetId)
    : null
  const openingCatalogSections = [
    {
      title: 'Doors',
      assets: openingAssets.filter((asset) => metadataSupportsConnectorType(asset.metadata, 'WALL')),
    },
    {
      title: 'Stairs',
      assets: openingAssets.filter((asset) => !metadataSupportsConnectorType(asset.metadata, 'WALL')),
    },
  ].filter((section) => section.assets.length > 0)

  return (
    <div className="space-y-4">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Connections
        </p>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['wall', 'Wall'],
            ['door', 'Door'],
            ['open', 'Open'],
          ] as const).map(([mode, label]) => {
            const active = wallConnectionMode === mode
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setWallConnectionMode(mode)}
                className={`rounded-2xl border px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition ${
                  active
                    ? 'border-teal-300/35 bg-teal-400/10 text-teal-200'
                    : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </section>

      {wallConnectionMode === 'door' && (
        <>
          {openingAssets.length === 0 ? (
            <p className="rounded-2xl border border-stone-800 bg-stone-950/50 px-4 py-3 text-xs text-stone-500">
              No opening assets in content pack.
            </p>
          ) : (
            <AssetCatalog
              title="Opening Catalogue"
              sections={openingCatalogSections}
              isSelected={(asset) => selectedAssetIds.opening === asset.id}
              onSelect={(asset) => setSelectedAsset('opening', asset.id)}
              getBadgeLabel={getOpeningBadgeLabel}
              getBadgeClassName={getOpeningBadgeClassName}
            />
          )}
        </>
      )}

      <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-xs leading-6 text-stone-400">
        <p className="font-medium text-stone-300">Connection Tool</p>
        <p className="mt-1">
          {wallConnectionMode === 'wall'
            ? 'Click an existing door or passage to restore the wall.'
            : wallConnectionMode === 'open'
              ? 'Click and drag across shared walls to open them. The camera stays locked until you release.'
              : 'Hover a wall edge to preview a door. Click to place.'}
        </p>
        <p>Floor-connected opening assets still place normally.</p>
        <p>Right-click a connection to remove it.</p>
        <p>Hold <kbd>Alt</kbd> + click to inspect.</p>
      </section>

      {/* Inline inspector when an opening is selected */}
      {selectedOpening && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">
            Selected Opening
          </p>
          <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {selectedOpening.assetId ? (selectedAsset?.name ?? 'Unknown opening') : 'Open passage'}
                </p>
                <p className="mt-1 font-mono text-sm text-stone-200">
                  {selectedOpening.id.slice(0, 8)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => removeOpening(selectedOpening.id)}
                className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-500/20"
              >
                Delete
              </button>
            </div>
            <div className="grid gap-2 text-xs">
              <PropRow label="Wall" value={selectedOpening.wallKey} />
              <PropRow label="Width" value={`${selectedOpening.width} segment${selectedOpening.width > 1 ? 's' : ''}`} />
              <PropRow label="Direction" value={selectedOpening.wallKey.split(':')[2]} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

function PropRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2">
      <span className="uppercase tracking-[0.2em] text-stone-500">{label}</span>
      <span className="break-all text-right text-stone-300">{value}</span>
    </div>
  )
}

function getOpeningBadgeLabel(asset: ContentPackAsset, active: boolean) {
  if (active) {
    return 'Selected'
  }

  return metadataSupportsConnectorType(asset.metadata, 'WALL')
    ? `w${asset.metadata?.openingWidth ?? 1}`
    : 'floor'
}

function getOpeningBadgeClassName(asset: ContentPackAsset, active: boolean) {
  if (active) {
    return 'bg-teal-300/15 text-teal-100'
  }

  return metadataSupportsConnectorType(asset.metadata, 'WALL')
    ? 'bg-violet-400/10 text-violet-200'
    : 'bg-amber-400/10 text-amber-200'
}
