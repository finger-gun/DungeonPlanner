import { useDungeonStore } from '../../store/useDungeonStore'

export function PostProcessingPanel() {
  const pp = useDungeonStore((state) => state.postProcessing)
  const setPostProcessing = useDungeonStore((state) => state.setPostProcessing)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">
          Lens
        </p>
        <button
          type="button"
          onClick={() => setPostProcessing({ enabled: !pp.enabled })}
          className={`relative h-4 w-7 rounded-full transition ${
            pp.enabled ? 'bg-sky-500' : 'bg-stone-700'
          }`}
          title={pp.enabled ? 'Disable post-processing' : 'Enable post-processing'}
        >
          <span
            className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${
              pp.enabled ? 'left-[14px]' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      <div className={`flex flex-col gap-3 transition-opacity ${pp.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
        <div className="rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs uppercase tracking-[0.22em] text-stone-400">Focus Y</label>
            <span className="text-xs tabular-nums text-stone-300">{(pp.focusDistance * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01} value={pp.focusDistance}
            onChange={(e) => setPostProcessing({ focusDistance: parseFloat(e.target.value) })}
            className="w-full accent-sky-400"
          />
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs uppercase tracking-[0.22em] text-stone-400">Band</label>
            <span className="text-xs tabular-nums text-stone-300">{pp.focalLength.toFixed(2)}</span>
          </div>
          <input
            type="range" min={0.5} max={12} step={0.25} value={pp.focalLength}
            onChange={(e) => setPostProcessing({ focalLength: parseFloat(e.target.value) })}
            className="w-full accent-sky-400"
          />
        </div>

        <div className="rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-xs uppercase tracking-[0.22em] text-stone-400">Blur</label>
            <span className="text-xs tabular-nums text-stone-300">{pp.bokehScale.toFixed(2)}x</span>
          </div>
          <input
            type="range" min={0.5} max={6} step={0.25} value={pp.bokehScale}
            onChange={(e) => setPostProcessing({ bokehScale: parseFloat(e.target.value) })}
            className="w-full accent-sky-400"
          />
        </div>
      </div>
    </section>
  )
}
