import { useEffect, useRef, useState } from 'react'
import { Axis3D, Grid, LayoutGrid, Triangle, Video } from 'lucide-react'
import { useDungeonStore, type CameraPreset } from '../../store/useDungeonStore'

type PresetEntry = {
  id: CameraPreset
  label: string
  sub: string
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>
}

const CAMERA_PRESETS: PresetEntry[] = [
  { id: 'perspective', label: 'Perspective', sub: 'Full orbit', Icon: Triangle },
  { id: 'isometric', label: 'Isometric', sub: 'Locked angle', Icon: Axis3D },
  { id: 'top-down', label: 'Top Down', sub: 'Print / TTRPG', Icon: LayoutGrid },
]

export function CameraDropdown() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const activeCameraMode = useDungeonStore((state) => state.activeCameraMode)
  const showGrid = useDungeonStore((state) => state.showGrid)
  const setCameraPreset = useDungeonStore((state) => state.setCameraPreset)
  const setShowGrid = useDungeonStore((state) => state.setShowGrid)

  useEffect(() => {
    if (!open) {
      return
    }

    function handlePointerDown(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const activePreset = CAMERA_PRESETS.find((preset) => preset.id === activeCameraMode) ?? CAMERA_PRESETS[0]

  return (
    <div ref={menuRef} className="absolute right-4 top-4 z-20">
      <button
        type="button"
        title="Camera"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`flex h-10 w-10 items-center justify-center rounded-2xl border backdrop-blur transition ${
          open
            ? 'border-amber-300/35 bg-stone-900/90 text-amber-200'
            : 'border-stone-700/70 bg-stone-950/80 text-stone-300 hover:border-stone-500 hover:bg-stone-900/90'
        }`}
      >
        <Video size={16} strokeWidth={1.7} />
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-stone-700/60 bg-stone-900/95 p-2 shadow-2xl backdrop-blur">
          <div className="px-2 pb-2 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-200/75">
              Camera
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Current: {activePreset.label}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            {CAMERA_PRESETS.map(({ id, label, sub, Icon }) => {
              const active = activeCameraMode === id

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    setCameraPreset(id)
                    setOpen(false)
                  }}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                    active
                      ? 'border-amber-300/35 bg-amber-400/10 text-amber-200'
                      : 'border-stone-800 bg-stone-950/40 text-stone-300 hover:border-stone-700 hover:bg-stone-800/80'
                  }`}
                >
                  <Icon size={15} strokeWidth={active ? 2 : 1.5} />
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-tight">{label}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-stone-500">{sub}</p>
                  </div>
                  {active && (
                    <span className="text-[10px] uppercase tracking-[0.2em] text-amber-300/70">
                      Active
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          <div className="mt-2 border-t border-stone-800/80 px-1 pt-2">
            <button
              type="button"
              aria-label="Grid"
              aria-pressed={showGrid}
              onClick={() => setShowGrid(!showGrid)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                showGrid
                  ? 'border-teal-300/35 bg-teal-400/10 text-teal-200'
                  : 'border-stone-800 bg-stone-950/40 text-stone-300 hover:border-stone-700 hover:bg-stone-800/80'
              }`}
            >
              <Grid size={15} strokeWidth={1.5} />
              <div className="flex-1">
                <p className="text-sm font-medium leading-tight">Grid</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-stone-500">
                  {showGrid ? 'Visible' : 'Hidden'}
                </p>
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
