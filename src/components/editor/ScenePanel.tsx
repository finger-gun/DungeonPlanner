import { useState, useRef } from 'react'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getContentPackAssetById } from '../../content-packs/registry'

export function ScenePanel() {
  const rooms = useDungeonStore((state) => state.rooms)
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const placedObjects = useDungeonStore((state) => state.placedObjects)
  const wallOpenings = useDungeonStore((state) => state.wallOpenings)
  const selection = useDungeonStore((state) => state.selection)
  const selectObject = useDungeonStore((state) => state.selectObject)
  const setTool = useDungeonStore((state) => state.setTool)
  const removeRoom = useDungeonStore((state) => state.removeRoom)
  const renameRoom = useDungeonStore((state) => state.renameRoom)
  const floors = useDungeonStore((state) => state.floors)
  const floorOrder = useDungeonStore((state) => state.floorOrder)
  const activeFloorId = useDungeonStore((state) => state.activeFloorId)
  const createFloor = useDungeonStore((state) => state.createFloor)
  const deleteFloor = useDungeonStore((state) => state.deleteFloor)
  const switchFloor = useDungeonStore((state) => state.switchFloor)
  const renameFloor = useDungeonStore((state) => state.renameFloor)

  // Props grouped by roomId
  const propsByRoom = Object.values(placedObjects).reduce<
    Record<string, typeof placedObjects[string][]>
  >((acc, obj) => {
    const posCellKey = `${obj.cell[0]}:${obj.cell[1]}`
    const roomId = paintedCells[posCellKey]?.roomId ?? null
    if (!roomId) return acc
    if (!acc[roomId]) acc[roomId] = []
    acc[roomId].push(obj)
    return acc
  }, {})

  // Openings grouped by the roomId of their anchor cell
  const openingsByRoom = Object.values(wallOpenings).reduce<
    Record<string, typeof wallOpenings[string][]>
  >((acc, opening) => {
    const parts = opening.wallKey.split(':')
    const cellKey = `${parts[0]}:${parts[1]}`
    const roomId = paintedCells[cellKey]?.roomId ?? null
    if (!roomId) return acc
    if (!acc[roomId]) acc[roomId] = []
    acc[roomId].push(opening)
    return acc
  }, {})

  const roomList = Object.values(rooms)

  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/75">
        Scene
      </p>

      {/* Floor tab strip */}
      <FloorTabStrip
        floors={floors}
        floorOrder={floorOrder}
        activeFloorId={activeFloorId}
        onSwitch={switchFloor}
        onAdd={createFloor}
        onDelete={deleteFloor}
        onRename={renameFloor}
      />

      <div className="mt-2 rounded-2xl border border-stone-700/60 bg-stone-900/60">
        <RoomList
          roomList={roomList}
          propsByRoom={propsByRoom}
          openingsByRoom={openingsByRoom}
          selection={selection}
          onSelectProp={(id) => { selectObject(id); setTool('prop') }}
          onSelectOpening={(id) => { selectObject(id); setTool('opening') }}
          onRename={(id, name) => renameRoom(id, name)}
          onDelete={(id) => removeRoom(id)}
        />
      </div>
    </section>
  )
}

// ── Floor tab strip ────────────────────────────────────────────────────────────

type FloorTabStripProps = {
  floors: Record<string, { id: string; name: string; level: number }>
  floorOrder: string[]
  activeFloorId: string
  onSwitch: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onRename: (id: string, name: string) => void
}

function FloorTabStrip({ floors, floorOrder, activeFloorId, onSwitch, onAdd, onDelete, onRename }: FloorTabStripProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit(id: string, currentName: string) {
    setEditingId(id)
    setDraft(currentName)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commitEdit() {
    if (editingId) {
      const trimmed = draft.trim()
      if (trimmed) onRename(editingId, trimmed)
    }
    setEditingId(null)
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
      {floorOrder.map((id) => {
        const floor = floors[id]
        if (!floor) return null
        const isActive = id === activeFloorId
        const isEditing = editingId === id
        return (
          <div
            key={id}
            className={`group relative flex shrink-0 items-center rounded-lg border px-2.5 py-1 text-[11px] transition-colors ${
              isActive
                ? 'border-sky-500/60 bg-sky-900/40 text-sky-200'
                : 'border-stone-700/60 bg-stone-900/50 text-stone-400 hover:border-stone-600 hover:text-stone-200 cursor-pointer'
            }`}
            onClick={() => !isActive && !isEditing && onSwitch(id)}
            onDoubleClick={() => startEdit(id, floor.name)}
          >
            {isEditing ? (
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitEdit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commitEdit()
                  else if (e.key === 'Escape') setEditingId(null)
                }}
                className="w-20 bg-transparent text-[11px] text-sky-200 outline-none"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flex items-center gap-1">
                <span
                  className={`text-[9px] font-bold tabular-nums ${
                    floor.level > 0 ? 'text-sky-400/70' : floor.level < 0 ? 'text-amber-400/70' : 'text-stone-500'
                  }`}
                >
                  {floor.level > 0 ? `+${floor.level}` : floor.level}
                </span>
                <span className="max-w-[72px] truncate">{floor.name}</span>
              </span>
            )}
            {floorOrder.length > 1 && !isEditing && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(id) }}
                className="ml-1 hidden text-stone-500 hover:text-red-400 group-hover:inline-flex"
                title="Delete floor"
              >
                <Trash2 size={10} />
              </button>
            )}
          </div>
        )
      })}
      <button
        type="button"
        onClick={() => onAdd()}
        className="flex shrink-0 items-center justify-center rounded-lg border border-stone-700/60 bg-stone-900/50 p-1 text-stone-400 hover:border-stone-500 hover:text-stone-200 transition-colors"
        title="Add floor"
      >
        <Plus size={12} />
      </button>
    </div>
  )
}

// ── Room list ─────────────────────────────────────────────────────────────────

type RoomListProps = {
  roomList: { id: string; name: string }[]
  propsByRoom: Record<string, { id: string; assetId: string | null; cellKey: string }[]>
  openingsByRoom: Record<string, { id: string; assetId: string | null; wallKey: string; width: 1 | 2 | 3 }[]>
  selection: string | null
  onSelectProp: (id: string) => void
  onSelectOpening: (id: string) => void
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

function RoomList({ roomList, propsByRoom, openingsByRoom, selection, onSelectProp, onSelectOpening, onRename, onDelete }: RoomListProps) {
  const [expanded, setExpanded] = useState(true)
  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-1.5 px-2.5 py-2 text-left"
      >
        <ChevronRight
          size={12}
          strokeWidth={2}
          className={`shrink-0 text-stone-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="text-xs font-semibold text-stone-300">Rooms</span>
      </button>
      {expanded && (
        <div className="border-t border-stone-800/60 px-2 pb-2 pt-1.5 flex flex-col gap-1">
          {roomList.length === 0 ? (
            <p className="py-1 pl-1 text-[11px] text-stone-600">
              Draw rooms to populate the floor.
            </p>
          ) : (
            roomList.map((room) => (
              <RoomNode
                key={room.id}
                room={room}
                props={propsByRoom[room.id] ?? []}
                openings={openingsByRoom[room.id] ?? []}
                selection={selection}
                onSelectProp={onSelectProp}
                onSelectOpening={onSelectOpening}
                onRename={(name) => onRename(room.id, name)}
                onDelete={() => onDelete(room.id)}
              />
            ))
          )}
        </div>
      )}
    </>
  )
}

// ── Room node ─────────────────────────────────────────────────────────────────

type RoomNodeProps = {
  room: { id: string; name: string }
  props: { id: string; assetId: string | null; cellKey: string }[]
  openings: { id: string; assetId: string | null; wallKey: string; width: 1 | 2 | 3 }[]
  selection: string | null
  onSelectProp: (id: string) => void
  onSelectOpening: (id: string) => void
  onRename: (name: string) => void
  onDelete: () => void
}

function RoomNode({ room, props, openings, selection, onSelectProp, onSelectOpening, onRename, onDelete }: RoomNodeProps) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(room.name)
  const inputRef = useRef<HTMLInputElement>(null)

  const childCount = props.length + openings.length

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed) onRename(trimmed)
    else setDraft(room.name)
    setEditing(false)
  }

  return (
    <div className="rounded-xl border border-stone-800 bg-stone-950/60">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-stone-600 transition hover:text-stone-300"
        >
          <ChevronRight
            size={11}
            strokeWidth={2}
            className={`transition-transform ${expanded ? 'rotate-90' : ''}`}
          />
        </button>

        <div className="min-w-0 flex-1">
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') { setDraft(room.name); setEditing(false) }
              }}
              className="w-full bg-transparent text-xs text-stone-200 outline-none"
              autoFocus
            />
          ) : (
            <span
              className="block cursor-text truncate text-xs font-medium text-stone-300"
              onDoubleClick={() => { setDraft(room.name); setEditing(true) }}
              title="Double-click to rename"
            >
              {room.name}
            </span>
          )}
        </div>

        {childCount > 0 && !expanded && (
          <span className="shrink-0 text-[10px] text-stone-600">{childCount}</span>
        )}

        <button
          type="button"
          title="Delete room"
          onClick={onDelete}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-stone-700 transition hover:text-red-400"
        >
          <Trash2 size={10} strokeWidth={1.5} />
        </button>
      </div>

      {expanded && (
        <div className="border-t border-stone-800/50 px-3 pb-2 pt-1.5 flex flex-col gap-0.5">
          {childCount === 0 ? (
            <p className="text-[11px] text-stone-700">Nothing placed in this room.</p>
          ) : (
            <>
              {props.map((obj) => {
                const asset = obj.assetId ? getContentPackAssetById(obj.assetId) : null
                return (
                  <LeafRow
                    key={obj.id}
                    label={asset?.name ?? 'Unknown prop'}
                    detail={obj.cellKey}
                    active={selection === obj.id}
                    onClick={() => onSelectProp(obj.id)}
                  />
                )
              })}
              {openings.map((opening) => {
                const asset = opening.assetId ? getContentPackAssetById(opening.assetId) : null
                const direction = opening.wallKey.split(':')[2]
                return (
                  <LeafRow
                    key={opening.id}
                    label={asset?.name ?? 'Unknown opening'}
                    detail={direction}
                    active={selection === opening.id}
                    onClick={() => onSelectOpening(opening.id)}
                  />
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Leaf row ──────────────────────────────────────────────────────────────────

function LeafRow({
  label,
  detail,
  dim = false,
  active = false,
  onClick,
}: {
  label: string
  detail: string
  dim?: boolean
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left text-[11px] transition ${
        active
          ? 'bg-sky-500/15 text-sky-300'
          : 'text-stone-500 hover:bg-stone-800/50 hover:text-stone-400'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`h-1 w-1 shrink-0 rounded-full ${active ? 'bg-sky-400' : dim ? 'bg-stone-800' : 'bg-stone-700'}`} />
      <span className="truncate">{label}</span>
      <span className="ml-auto shrink-0 font-mono text-[10px] text-stone-700">{detail}</span>
    </button>
  )
}
