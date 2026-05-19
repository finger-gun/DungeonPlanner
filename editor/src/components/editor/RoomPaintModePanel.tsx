import { SquareMousePointer, Brush, VectorSquare, BrickWall } from 'lucide-react'
import { useDungeonStore, type RoomEditMode, type RoomPaintMode } from '../../store/useDungeonStore'

const WALLS_MODE_LABEL = 'Spline walls'

type RoomContextTool =
  | {
      id: RoomPaintMode
      type: 'paint-mode'
      label: string
      Icon: typeof SquareMousePointer
    }
  | {
      id: Extract<RoomEditMode, 'walls'>
      type: 'edit-mode'
      label: string
      Icon: typeof BrickWall
    }

const ROOM_TOOLS: RoomContextTool[] = [
  {
    id: 'area' as const,
    type: 'paint-mode',
    label: 'Area',
    Icon: SquareMousePointer,
  },
  {
    id: 'paint' as const,
    type: 'paint-mode',
    label: 'Paint',
    Icon: Brush,
  },
  {
    id: 'resize' as const,
    type: 'paint-mode',
    label: 'Resize',
    Icon: VectorSquare,
  },
  {
    id: 'walls' as const,
    type: 'edit-mode',
    label: WALLS_MODE_LABEL,
    Icon: BrickWall,
  },
]

export function RoomPaintModePanel({ sidebarVisible }: { sidebarVisible: boolean }) {
  const tool = useDungeonStore((state) => state.tool)
  const roomEditMode = useDungeonStore((state) => state.roomEditMode)
  const roomPaintMode = useDungeonStore((state) => state.roomPaintMode)
  const setRoomEditMode = useDungeonStore((state) => state.setRoomEditMode)
  const setRoomPaintMode = useDungeonStore((state) => state.setRoomPaintMode)

  if (tool !== 'room') return null

  // Calculate position: center between canvas (left) and sidebar (right, if visible)
  // Sidebar is 22rem (352px) wide when visible
  const sidebarWidth = 352
  const left = sidebarVisible ? `calc(50% - ${sidebarWidth / 2}px)` : '50%'

  return (
    <div
      className="fixed bottom-6 z-50 flex items-center gap-0 pointer-events-auto transition-all duration-200"
      style={{
        left,
        transform: 'translateX(-50%)',
      }}
    >
      <div className="flex items-center gap-2 rounded-full border border-stone-700/50 bg-stone-900/95 px-3 py-2 shadow-2xl backdrop-blur">
        {ROOM_TOOLS.map(({ id, type, label, Icon }) => {
          const active = type === 'edit-mode'
            ? roomEditMode === id
            : roomEditMode === 'rooms' && roomPaintMode === id
          return (
            <button
              key={id}
              onClick={() => {
                if (type === 'edit-mode') {
                  setRoomEditMode(id)
                  return
                }

                setRoomEditMode('rooms')
                setRoomPaintMode(id)
              }}
              className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
                active
                  ? 'bg-stone-800 text-teal-400 ring-1.5 ring-teal-500/60'
                  : 'text-stone-400 hover:bg-stone-800/50 hover:text-stone-200'
              }`}
              aria-label={label}
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
