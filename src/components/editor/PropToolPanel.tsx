import { getContentPackAssetById, getContentPackAssetsByCategory } from '../../content-packs/registry'
import { useDungeonStore } from '../../store/useDungeonStore'
import { AssetCatalog } from './AssetCatalog'

export function PropToolPanel() {
  const selectedAssetIds = useDungeonStore((state) => state.selectedAssetIds)
  const setSelectedAsset = useDungeonStore((state) => state.setSelectedAsset)
  const selection = useDungeonStore((state) => state.selection)
  const selectedObject = useDungeonStore((state) =>
    selection ? state.placedObjects[selection] : null,
  )
  const removeSelectedObject = useDungeonStore((state) => state.removeSelectedObject)
  const propAssets = getContentPackAssetsByCategory('prop')
  const selectedAsset = selectedObject?.assetId
    ? getContentPackAssetById(selectedObject.assetId)
    : null

  return (
    <div className="space-y-4">
      <AssetCatalog
        sections={[{ title: 'Props', assets: propAssets }]}
        isSelected={(asset) => selectedAssetIds.prop === asset.id}
        onSelect={(asset) => setSelectedAsset('prop', asset.id)}
      />

      <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-xs leading-6 text-stone-400">
        <p className="font-medium text-stone-300">Placement Tool</p>
        <p className="mt-1">Click a room cell to place. Right-click to remove.</p>
        <p>Hold <kbd>Alt</kbd> + click to inspect.</p>
      </section>

      {selectedObject?.type === 'prop' && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">
            Selected Prop
          </p>
          <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {selectedAsset?.name ?? selectedObject.type}
                </p>
                <p className="mt-1 font-mono text-sm text-stone-200">
                  {selectedObject.id.slice(0, 8)}
                </p>
              </div>
              <button
                type="button"
                onClick={removeSelectedObject}
                className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs text-rose-200 transition hover:border-rose-300/60 hover:bg-rose-500/20"
              >
                Delete
              </button>
            </div>
            <div className="grid gap-2 text-xs">
              <PropRow label="Position" value={selectedObject.position.map((v) => v.toFixed(2)).join(', ')} />
              <PropRow label="Rotation" value={selectedObject.rotation.map((v) => v.toFixed(2)).join(', ')} />
              <PropRow label="Cell" value={selectedObject.cellKey} />
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
