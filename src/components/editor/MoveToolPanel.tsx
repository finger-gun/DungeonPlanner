import { Gauge, Grid } from 'lucide-react'
import { useDungeonStore } from '../../store/useDungeonStore'

const FPS_OPTIONS: { value: 0 | 30 | 60 | 120; label: string }[] = [
  { value: 30,  label: '30' },
  { value: 60,  label: '60' },
  { value: 120, label: '120' },
  { value: 0,   label: '∞' },
]

export function MoveToolPanel() {
  const mapMode = useDungeonStore((state) => state.mapMode)
  const showGrid = useDungeonStore((state) => state.showGrid)
  const setShowGrid = useDungeonStore((state) => state.setShowGrid)
  const sceneLighting = useDungeonStore((state) => state.sceneLighting)
  const setSceneLightingIntensity = useDungeonStore((state) => state.setSceneLightingIntensity)
  const pp = useDungeonStore((state) => state.postProcessing)
  const setPostProcessing = useDungeonStore((state) => state.setPostProcessing)
  const outdoorTimeOfDay = useDungeonStore((state) => state.outdoorTimeOfDay)
  const setOutdoorTimeOfDay = useDungeonStore((state) => state.setOutdoorTimeOfDay)
  const fpsLimit = useDungeonStore((state) => state.fpsLimit)
  const setFpsLimit = useDungeonStore((state) => state.setFpsLimit)

  return (
    <div className="space-y-4">
      {/* Performance */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Performance
        </p>
        <div className="mt-3 rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3">
          <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone-400">
            <Gauge size={12} strokeWidth={1.5} />
            <span>FPS Cap</span>
          </div>
          <div className="grid grid-cols-4 gap-1">
            {FPS_OPTIONS.map(({ value, label }) => {
              const active = fpsLimit === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFpsLimit(value)}
                  className={`rounded-xl border py-1.5 text-xs tabular-nums transition ${
                    active
                      ? 'border-amber-300/40 bg-amber-400/10 text-amber-200'
                      : 'border-stone-700/60 bg-stone-900/40 text-stone-500 hover:border-stone-600 hover:text-stone-300'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Viewport */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Viewport
        </p>

        {/* Grid toggle */}
        <button
          type="button"
          onClick={() => setShowGrid(!showGrid)}
          className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
            showGrid
              ? 'border-teal-300/35 bg-teal-400/10 text-teal-200'
              : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:bg-stone-900/60'
          }`}
        >
          <Grid size={15} strokeWidth={1.5} />
          <div>
            <p className="text-sm font-medium">Grid</p>
            <p className="text-[10px] uppercase tracking-[0.18em] text-stone-500">
              {showGrid ? 'Visible' : 'Hidden'}
            </p>
          </div>
        </button>
      </section>

      {/* Light Rig */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Light Rig
        </p>
        <div className="rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-4">
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="light-intensity"
              className="text-xs uppercase tracking-[0.22em] text-stone-400"
            >
              Intensity
            </label>
            <span className="text-xs tabular-nums text-stone-300">
              {sceneLighting.intensity.toFixed(2)}
            </span>
          </div>
          <input
            id="light-intensity"
            type="range"
            min={0}
            max={2}
            step={0.01}
            value={sceneLighting.intensity}
            onChange={(e) => setSceneLightingIntensity(Number(e.target.value))}
            className="w-full accent-amber-400"
          />
          <div className="mt-1 flex justify-between text-[10px] text-stone-600">
            <span>Off</span>
            <span>Default</span>
            <span>2×</span>
          </div>
        </div>
      </section>

      {mapMode === 'outdoor' && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
            Environment
          </p>
          <div className="rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-4">
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="outdoor-time-of-day" className="text-xs uppercase tracking-[0.22em] text-stone-400">
                Time of Day
              </label>
              <span className="text-xs tabular-nums text-stone-300">{Math.round(outdoorTimeOfDay * 100)}%</span>
            </div>
            <input
              id="outdoor-time-of-day"
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={outdoorTimeOfDay}
              onChange={(event) => setOutdoorTimeOfDay(Number(event.target.value))}
              className="w-full accent-amber-300"
            />
            <div className="mt-1 flex justify-between text-[10px] text-stone-600">
              <span>Dawn</span>
              <span>Noon</span>
              <span>Night</span>
            </div>
          </div>
        </section>
      )}

      {/* Lens */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">Lens</p>
          <button
            type="button"
            onClick={() => setPostProcessing({ enabled: !pp.enabled })}
            className={`relative h-4 w-7 rounded-full transition ${pp.enabled ? 'bg-sky-500' : 'bg-stone-700'}`}
          >
            <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${pp.enabled ? 'left-[14px]' : 'left-0.5'}`} />
          </button>
        </div>
        <div className={`rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-4 flex flex-col gap-4 transition-opacity ${pp.enabled ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-stone-400">Autofocus</p>
            <p className="mt-2 text-xs leading-relaxed text-stone-400">
              Focus follows whatever the camera center ray hits.
            </p>
          </div>
          {([
            { label: 'Near Range', value: pp.focalLength, min: 0.5, max: 12, step: 0.25, fmt: (v: number) => v.toFixed(2),             key: 'focalLength'   as const },
            { label: 'Far Range',  value: pp.backgroundFocalLength, min: 0.5, max: 12, step: 0.25, fmt: (v: number) => v.toFixed(2),   key: 'backgroundFocalLength' as const },
            { label: 'Blur',       value: pp.bokehScale,  min: 0.5, max: 6,  step: 0.25, fmt: (v: number) => `${v.toFixed(2)}x`,      key: 'bokehScale'    as const },
          ]).map(({ label, value, min, max, step, fmt, key }) => (
            <div key={key}>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs uppercase tracking-[0.22em] text-stone-400">{label}</label>
                <span className="text-xs tabular-nums text-stone-300">{fmt(value)}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={value}
                onChange={(e) => setPostProcessing({ [key]: parseFloat(e.target.value) })}
                className="w-full accent-sky-400" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
