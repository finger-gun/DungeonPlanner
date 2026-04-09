import { getContentPackAssetsByCategory } from '../../content-packs/registry'
import { useDungeonStore } from '../../store/useDungeonStore'

export function RoomToolPanel() {
  const selectedAssetIds = useDungeonStore((state) => state.selectedAssetIds)
  const setSelectedAsset = useDungeonStore((state) => state.setSelectedAsset)
  const floorAssets = getContentPackAssetsByCategory('floor')
  const wallAssets = getContentPackAssetsByCategory('wall')

  return (
    <div className="space-y-4">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Room Assets
        </p>
        <div className="space-y-4">
          <AssetSelector
            label="Floor Theme"
            assets={floorAssets}
            activeAssetId={selectedAssetIds.floor}
            onSelect={(id) => setSelectedAsset('floor', id)}
          />
          <AssetSelector
            label="Wall Theme"
            assets={wallAssets}
            activeAssetId={selectedAssetIds.wall}
            onSelect={(id) => setSelectedAsset('wall', id)}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-sm leading-6 text-stone-400">
        <p className="font-medium text-stone-300">Room Tool</p>
        <p className="mt-1 text-xs">Left-drag to paint rooms. Right-drag to erase.</p>
      </section>
    </div>
  )
}

function AssetSelector({
  label,
  assets,
  activeAssetId,
  onSelect,
}: {
  label: string
  assets: ReturnType<typeof getContentPackAssetsByCategory>
  activeAssetId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-stone-500">
        {label}
      </p>
      <div className="grid gap-2">
        {assets.map((asset) => {
          const active = activeAssetId === asset.id
          return (
            <button
              key={asset.id}
              type="button"
              onClick={() => onSelect(asset.id)}
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                active
                  ? 'border-teal-300/35 bg-teal-400/10'
                  : 'border-stone-800 bg-stone-950/60 hover:border-stone-700'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-stone-100">{asset.name}</span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
                  {active ? 'Active' : asset.category}
                </span>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
