import { getContentPackAssetById } from '../../content-packs/registry'
import { useDungeonStore } from '../../store/useDungeonStore'

export function SelectToolPanel() {
  const selection = useDungeonStore((state) => state.selection)
  const selectedObject = useDungeonStore((state) =>
    selection ? state.placedObjects[selection] : null,
  )
  const selectedOpening = useDungeonStore((state) =>
    selection ? state.wallOpenings[selection] : null,
  )
  const removeSelectedObject = useDungeonStore((state) => state.removeSelectedObject)
  const removeOpening = useDungeonStore((state) => state.removeOpening)

  const propAsset = selectedObject?.assetId ? getContentPackAssetById(selectedObject.assetId) : null
  const openingAsset = selectedOpening?.assetId ? getContentPackAssetById(selectedOpening.assetId) : null

  if (selectedObject) {
    return (
      <div className="space-y-4">
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">
            Selected Prop
          </p>
          <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {propAsset?.name ?? selectedObject.type}
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
              <InfoRow label="Position" value={selectedObject.position.map((v) => v.toFixed(2)).join(', ')} />
              <InfoRow label="Rotation" value={selectedObject.rotation.map((v) => v.toFixed(2)).join(', ')} />
              <InfoRow label="Cell" value={selectedObject.cellKey} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  if (selectedOpening) {
    return (
      <div className="space-y-4">
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">
            Selected Opening
          </p>
          <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {openingAsset?.name ?? 'Unknown opening'}
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
              <InfoRow label="Wall" value={selectedOpening.wallKey} />
              <InfoRow label="Width" value={`${selectedOpening.width} segment${selectedOpening.width > 1 ? 's' : ''}`} />
              <InfoRow label="Direction" value={selectedOpening.wallKey.split(':')[2]} />
            </div>
          </div>
        </section>
      </div>
    )
  }

  return (
    <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-xs leading-6 text-stone-400">
      <p className="font-medium text-stone-300">Select Tool</p>
      <p className="mt-1">Click a prop or opening in the scene to inspect it.</p>
      <p>Press <kbd>Esc</kbd> to deselect. <kbd>Del</kbd> to delete.</p>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2">
      <span className="uppercase tracking-[0.2em] text-stone-500">{label}</span>
      <span className="break-all text-right text-stone-300">{value}</span>
    </div>
  )
}
