import { getContentPackAssetsByCategory } from '../../content-packs/registry'
import { useDungeonStore } from '../../store/useDungeonStore'

export function OpeningToolPanel() {
  const selectedAssetIds = useDungeonStore((state) => state.selectedAssetIds)
  const setSelectedAsset = useDungeonStore((state) => state.setSelectedAsset)
  const openingAssets = getContentPackAssetsByCategory('opening')

  return (
    <div className="space-y-4">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Openings
        </p>
        {openingAssets.length === 0 ? (
          <p className="rounded-2xl border border-stone-800 bg-stone-950/50 px-4 py-3 text-xs text-stone-500">
            No opening assets in content pack.
          </p>
        ) : (
          <div className="grid gap-2">
            {openingAssets.map((asset) => {
              const active = selectedAssetIds.opening === asset.id
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAsset('opening', asset.id)}
                  className={`rounded-2xl border px-3 py-3 text-left transition ${
                    active
                      ? 'border-teal-300/35 bg-teal-400/10'
                      : 'border-stone-800 bg-stone-950/60 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-stone-100">{asset.name}</span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
                      {active ? 'Selected' : `w${asset.metadata?.openingWidth ?? 1}`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{asset.slug}</p>
                </button>
              )
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-xs leading-6 text-stone-400">
        <p className="font-medium text-stone-300">Opening Tool</p>
        <p className="mt-1">Hover a wall edge to preview. Click to place.</p>
        <p>Right-click an opening to remove.</p>
      </section>
    </div>
  )
}
