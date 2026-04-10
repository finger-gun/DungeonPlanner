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
        <SliderRow
          label="Focus"
          value={pp.focusDistance}
          min={1}
          max={30}
          step={0.5}
          format={(v) => `${v.toFixed(1)}u`}
          onChange={(v) => setPostProcessing({ focusDistance: v })}
        />
        <SliderRow
          label="Depth"
          value={pp.focalLength}
          min={0.5}
          max={12}
          step={0.25}
          format={(v) => `${v.toFixed(2)}u`}
          onChange={(v) => setPostProcessing({ focalLength: v })}
        />
        <SliderRow
          label="Bokeh"
          value={pp.bokehScale}
          min={0.5}
          max={6}
          step={0.25}
          format={(v) => `${v.toFixed(2)}x`}
          onChange={(v) => setPostProcessing({ bokehScale: v })}
        />
      </div>

      {pp.enabled && (
        <p className="mt-3 text-[10px] text-stone-600">
          Focus Distance: world units along camera look direction.
          Depth: blur falloff range. Bokeh: blur size multiplier.
        </p>
      )}
    </section>
  )
}

type SliderRowProps = {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}

function SliderRow({ label, value, min, max, step, format, onChange }: SliderRowProps) {
  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2">
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.2em] text-stone-500">{label}</span>
        <span className="font-mono text-[10px] text-stone-400">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-sky-400"
      />
    </div>
  )
}
