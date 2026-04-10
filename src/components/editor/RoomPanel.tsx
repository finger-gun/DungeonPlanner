import { useState, useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getContentPackAssetsByCategory } from '../../content-packs/registry'

const floorAssets = getContentPackAssetsByCategory('floor')
const wallAssets = getContentPackAssetsByCategory('wall')

export function RoomPanel() {
  const rooms = useDungeonStore((state) => state.rooms)
  const createRoom = useDungeonStore((state) => state.createRoom)
  const removeRoom = useDungeonStore((state) => state.removeRoom)
  const renameRoom = useDungeonStore((state) => state.renameRoom)
  const setRoomFloorAsset = useDungeonStore((state) => state.setRoomFloorAsset)
  const setRoomWallAsset = useDungeonStore((state) => state.setRoomWallAsset)

  const roomList = Object.values(rooms)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Rooms
        </p>
        <button
          type="button"
          title="Create room"
          onClick={() => createRoom('New Room')}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-800 hover:text-stone-200"
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      </div>

      {roomList.length === 0 ? (
        <p className="text-[11px] text-stone-600">
          No rooms yet. Create one to override floor/wall assets per room.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {roomList.map((room) => (
            <RoomRow
              key={room.id}
              room={room}
              onRename={(name) => renameRoom(room.id, name)}
              onSetFloor={(id) => setRoomFloorAsset(room.id, id)}
              onSetWall={(id) => setRoomWallAsset(room.id, id)}
              onDelete={() => removeRoom(room.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

type RoomRowProps = {
  room: { id: string; name: string; floorAssetId: string | null; wallAssetId: string | null }
  onRename: (name: string) => void
  onSetFloor: (id: string | null) => void
  onSetWall: (id: string | null) => void
  onDelete: () => void
}

function RoomRow({ room, onRename, onSetFloor, onSetWall, onDelete }: RoomRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(room.name)
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed) onRename(trimmed)
    setEditing(false)
  }

  return (
    <div className="rounded-2xl border border-stone-800 bg-stone-950/50">
      {/* Header row */}
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 text-left"
        >
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') setEditing(false)
              }}
              className="w-full bg-transparent text-xs text-stone-200 outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className="block truncate text-xs font-medium text-stone-200"
              onDoubleClick={(e) => {
                e.stopPropagation()
                setDraft(room.name)
                setEditing(true)
              }}
            >
              {room.name}
            </span>
          )}
        </button>
        <button
          type="button"
          title="Delete room"
          onClick={onDelete}
          className="flex h-5 w-5 items-center justify-center rounded text-stone-600 hover:text-red-400"
        >
          <Trash2 size={11} strokeWidth={1.5} />
        </button>
      </div>

      {/* Expandable asset overrides */}
      {expanded && (
        <div className="border-t border-stone-800/60 px-3 pb-3 pt-2.5 space-y-3">
          <AssetOverride
            label="Floor"
            assets={floorAssets}
            activeId={room.floorAssetId}
            onChange={onSetFloor}
          />
          <AssetOverride
            label="Wall"
            assets={wallAssets}
            activeId={room.wallAssetId}
            onChange={onSetWall}
          />
        </div>
      )}
    </div>
  )
}

function AssetOverride({
  label,
  assets,
  activeId,
  onChange,
}: {
  label: string
  assets: ReturnType<typeof getContentPackAssetsByCategory>
  activeId: string | null
  onChange: (id: string | null) => void
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] uppercase tracking-[0.2em] text-stone-500">{label}</p>
      <select
        value={activeId ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-xl border border-stone-700 bg-stone-900 px-2.5 py-1.5 text-xs text-stone-200 outline-none focus:border-amber-400/50"
      >
        <option value="">Inherit global</option>
        {assets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.name}
          </option>
        ))}
      </select>
    </div>
  )
}
