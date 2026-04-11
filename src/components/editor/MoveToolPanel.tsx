import { Axis3D, Grid, LayoutGrid, Square, Triangle } from 'lucide-react'
import { useDungeonStore, type CameraPreset, type GroundPlane } from '../../store/useDungeonStore'

type PresetEntry = {
  id: CameraPreset
  label: string
  sub: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const CAMERA_PRESETS: PresetEntry[] = [
  { id: 'perspective', label: 'Perspective', sub: 'Full orbit',     Icon: Triangle },
  { id: 'isometric',   label: 'Isometric',   sub: 'Locked angle',   Icon: Axis3D },
  { id: 'top-down',    label: 'Top Down',    sub: 'Print / TTRPG',  Icon: LayoutGrid },
]

type GroundEntry = { id: GroundPlane; label: string; swatch: string }
const GROUND_OPTIONS: GroundEntry[] = [
  { id: 'black', label: 'Black', swatch: '#0e0e0e' },
  { id: 'green', label: 'Green', swatch: '#2a4a1a' },
]

export function MoveToolPanel() {
  const setCameraPreset = useDungeonStore((state) => state.setCameraPreset)
  const activeCameraMode = useDungeonStore((state) => state.activeCameraMode)
  const showGrid = useDungeonStore((state) => state.showGrid)
  const setShowGrid = useDungeonStore((state) => state.setShowGrid)
  const groundPlane = useDungeonStore((state) => state.groundPlane)
  const setGroundPlane = useDungeonStore((state) => state.setGroundPlane)
  const showGroundPlane = useDungeonStore((state) => state.showGroundPlane)
  const setShowGroundPlane = useDungeonStore((state) => state.setShowGroundPlane)
  const sceneLighting = useDungeonStore((state) => state.sceneLighting)
  const setSceneLightingIntensity = useDungeonStore((state) => state.setSceneLightingIntensity)
  const pp = useDungeonStore((state) => state.postProcessing)
  const setPostProcessing = useDungeonStore((state) => state.setPostProcessing)

  return (
    <div className="space-y-4">
      {/* Camera Positions */}
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Camera
        </p>
        <div className="grid grid-cols-1 gap-2">
          {CAMERA_PRESETS.map(({ id, label, sub, Icon }) => {
            const active = activeCameraMode === id
            return (
              <button
                key={id}
                type="button"
                onClick={() => setCameraPreset(id)}
                className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                  active
                    ? 'border-amber-300/40 bg-amber-400/10 text-amber-200'
                    : 'border-stone-800 bg-stone-950/60 text-stone-300 hover:border-stone-700 hover:bg-stone-900/60'
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                <div className="flex-1">
                  <p className="text-sm font-medium leading-tight">{label}</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-stone-500">{sub}</p>
                </div>
                {active && (
                  <span className="text-[10px] uppercase tracking-[0.2em] text-amber-300/70">Active</span>
                )}
              </button>
            )
          })}
        </div>
        {activeCameraMode !== 'perspective' && (
          <p className="mt-2 text-[10px] leading-5 text-stone-600">
            {activeCameraMode === 'isometric'
              ? 'Rotation locked · WASD to pan'
              : 'Rotation locked · WASD to pan · scroll to zoom'}
          </p>
        )}
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

        {/* Ground plane selector */}
        <div className="mt-2 rounded-2xl border border-stone-800 bg-stone-950/60 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-stone-400">
              <Square size={12} strokeWidth={1.5} />
              <span>Ground</span>
            </div>
            <button
              type="button"
              onClick={() => setShowGroundPlane(!showGroundPlane)}
              className={`rounded-lg border px-2 py-0.5 text-[10px] uppercase tracking-[0.15em] transition ${
                showGroundPlane
                  ? 'border-sky-500/50 bg-sky-900/30 text-sky-300'
                  : 'border-stone-700/60 bg-stone-900/40 text-stone-500 hover:border-stone-600 hover:text-stone-300'
              }`}
            >
              {showGroundPlane ? 'Visible' : 'Hidden'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {GROUND_OPTIONS.map(({ id, label, swatch }) => {
              const active = groundPlane === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setGroundPlane(id)}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border py-2 text-[10px] uppercase tracking-[0.15em] transition ${
                    active
                      ? 'border-amber-300/40 bg-amber-400/10 text-amber-200'
                      : 'border-stone-700/60 bg-stone-900/40 text-stone-500 hover:border-stone-600 hover:text-stone-300'
                  }`}
                >
                  <span
                    className="block size-5 rounded-full border border-stone-600"
                    style={{ background: swatch === 'transparent' ? 'transparent' : swatch }}
                  />
                  {label}
                </button>
              )
            })}
          </div>
        </div>
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
          {([
            { label: 'Focus Y', value: pp.focusDistance, min: 0,   max: 1,  step: 0.01, fmt: (v: number) => `${(v*100).toFixed(0)}%`, key: 'focusDistance' as const },
            { label: 'Band',    value: pp.focalLength,   min: 0.5, max: 12, step: 0.25, fmt: (v: number) => v.toFixed(2),              key: 'focalLength'   as const },
            { label: 'Blur',    value: pp.bokehScale,    min: 0.5, max: 6,  step: 0.25, fmt: (v: number) => `${v.toFixed(2)}x`,       key: 'bokehScale'    as const },
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
