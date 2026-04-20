import { RoomPanel } from './RoomPanel'
import { useDungeonStore } from '../../store/useDungeonStore'

export function RoomToolPanel() {
  const roomEditMode = useDungeonStore((state) => state.roomEditMode)
  const setRoomEditMode = useDungeonStore((state) => state.setRoomEditMode)

  return (
    <div className="space-y-5">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Room Tools
        </p>
        <div className="grid grid-cols-2 gap-2">
          {([
            ['rooms', 'Rooms'],
            ['walls', 'Walls'],
          ] as const).map(([mode, label]) => {
            const active = roomEditMode === mode
            return (
              <button
                key={mode}
                type="button"
                aria-pressed={active}
                onClick={() => setRoomEditMode(mode)}
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

      <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-sm leading-6 text-stone-400">
        <p className="font-medium text-stone-300">Room Tool</p>
        {roomEditMode === 'walls' ? (
          <>
            <p className="mt-1 text-xs">Click and drag to preview a locked wall run. Release to add or remove the whole run.</p>
            <p className="text-xs">Left-drag adds inner wall runs. Right-drag removes inner or shared wall runs.</p>
            <p className="text-xs">This mode is for structure editing in top-down view, not asset placement.</p>
          </>
        ) : (
          <>
            <p className="mt-1 text-xs">Left-drag to paint rooms. Right-drag to erase.</p>
            <p className="text-xs">Surface variants now live under the unified Assets browser.</p>
          </>
        )}
      </section>

      <RoomPanel />
    </div>
  )
}
