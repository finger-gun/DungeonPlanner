import {
  Box,
  Grid2X2,
  Hand,
  Redo2,
  Undo2,
} from 'lucide-react'
import { useDungeonStore, type DungeonTool } from '../../store/useDungeonStore'

const TOOLS: { id: DungeonTool; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string }[] = [
  { id: 'move', Icon: Hand,    label: 'Move' },
  { id: 'room', Icon: Grid2X2, label: 'Room' },
  { id: 'prop', Icon: Box,     label: 'Prop' },
]

export function EditorToolbar() {
  const tool = useDungeonStore((state) => state.tool)
  const setTool = useDungeonStore((state) => state.setTool)
  const undo = useDungeonStore((state) => state.undo)
  const redo = useDungeonStore((state) => state.redo)
  const historyLength = useDungeonStore((state) => state.history.length)
  const futureLength = useDungeonStore((state) => state.future.length)

  return (
    <div className="flex h-full flex-col items-center justify-between border-r border-stone-800/80 bg-stone-950/90 py-4 backdrop-blur">
      {/* App mark */}
      <div className="flex flex-col items-center gap-1">
        <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
          <span className="text-xs font-bold">D</span>
        </div>

        {/* Tool icons */}
        <div className="flex flex-col items-center gap-1">
          {TOOLS.map(({ id, Icon, label }) => {
            const active = tool === id
            return (
              <button
                key={id}
                type="button"
                title={label}
                onClick={() => setTool(id)}
                className={`group flex h-10 w-10 items-center justify-center rounded-xl transition ${
                  active
                    ? 'bg-amber-400/20 text-amber-300'
                    : 'text-stone-500 hover:bg-stone-800 hover:text-stone-200'
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2 : 1.5} />
              </button>
            )
          })}
        </div>
      </div>

      {/* Undo / Redo at bottom */}
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          title="Undo"
          onClick={undo}
          disabled={historyLength === 0}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-800 hover:text-stone-200 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Undo2 size={16} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          title="Redo"
          onClick={redo}
          disabled={futureLength === 0}
          className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-500 transition hover:bg-stone-800 hover:text-stone-200 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Redo2 size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  )
}
