import { SquareMousePointer, Brush, VectorSquare } from 'lucide-react'
import { useDungeonStore } from '../../store/useDungeonStore'

const PAINT_MODES = [
  {
    id: 'area' as const,
    label: 'Area',
    Icon: SquareMousePointer,
    description: 'Draw rectangular rooms.',
    usage: 'Click and drag to create a rectangular selection. Release to commit.',
  },
  {
    id: 'paint' as const,
    label: 'Paint',
    Icon: Brush,
    description: 'Paint rooms in any shape.',
    usage: 'Click and hold to paint cells continuously. Release to commit.',
  },
  {
    id: 'resize' as const,
    label: 'Resize',
    Icon: VectorSquare,
    description: 'Modify room boundaries.',
    usage: 'Click a room to show resize handles. Drag handles to adjust room shape.',
  },
]

export function RoomPaintModePanel({ sidebarVisible }: { sidebarVisible: boolean }) {
  const tool = useDungeonStore((state) => state.tool)
  const roomPaintMode = useDungeonStore((state) => state.roomPaintMode)
  const setRoomPaintMode = useDungeonStore((state) => state.setRoomPaintMode)

  if (tool !== 'room') return null

  // Calculate position: center between canvas (left) and sidebar (right, if visible)
  // Sidebar is 22rem (352px) wide when visible
  const sidebarWidth = 352
  const left = sidebarVisible ? `calc(50% - ${sidebarWidth / 2}px)` : '50%'

  return (
    <div
      className="fixed bottom-6 flex items-center gap-0 z-50 pointer-events-auto transition-all duration-200"
      style={{
        left,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-2 rounded-full bg-stone-900/95 backdrop-blur px-3 py-2 shadow-2xl border border-stone-700/50">
        {PAINT_MODES.map(({ id, label, Icon }) => {
          const active = roomPaintMode === id
          return (
            <button
              key={id}
              onClick={() => setRoomPaintMode(id)}
              className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200 ${
                active
                  ? 'bg-stone-800 ring-1.5 ring-teal-500/60 text-teal-400'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
              }`}
              title={label}
            >
              <div className={`absolute inset-0 rounded-full border ${active ? 'border-teal-500/40' : 'border-stone-700'}`} />
              <Icon size={18} strokeWidth={1.5} className="relative z-10" />
            </button>
          )
        })}
      </div>
    </div>
  )
}
