import { useState, useRef, useMemo } from 'react'
import { ChevronRight, Trash2 } from 'lucide-react'
import { useDungeonStore, type FloorRecord } from '../../store/useDungeonStore'
import { getAssetBrowserCategory, getAssetBrowserSubcategory } from '../../content-packs/browserMetadata'
import { getContentPackAssetById } from '../../content-packs/registry'
import { isGeneratedCharacterAssetId } from '../../content-packs/runtimeRegistry'
import { requestFloorTransition } from '../canvas/floorTransition'
import type { PaintedCells } from '../../store/useDungeonStore'

// ── Types ─────────────────────────────────────────────────────────────────────

type FloorData = {
  rooms: Record<string, { id: string; name: string }>
  paintedCells: PaintedCells
  placedObjects: Record<string, { id: string; assetId: string | null; cell: [number, number]; cellKey: string }>
  wallOpenings: Record<string, { id: string; assetId: string | null; wallKey: string; width: 1 | 2 | 3 }>
}

// ── Main panel ────────────────────────────────────────────────────────────────

export function ScenePanel() {
  const floors       = useDungeonStore((s) => s.floors)
  const floorOrder   = useDungeonStore((s) => s.floorOrder)
  const activeFloorId = useDungeonStore((s) => s.activeFloorId)
  const floorViewMode = useDungeonStore((s) => s.floorViewMode)
  const selection    = useDungeonStore((s) => s.selection)
  const selectObject = useDungeonStore((s) => s.selectObject)
  const setTool      = useDungeonStore((s) => s.setTool)
  const setAssetBrowserCategory = useDungeonStore((s) => s.setAssetBrowserCategory)
  const setAssetBrowserSubcategory = useDungeonStore((s) => s.setAssetBrowserSubcategory)
  const setFloorViewMode = useDungeonStore((s) => s.setFloorViewMode)
  const removeRoom   = useDungeonStore((s) => s.removeRoom)
  const renameRoom   = useDungeonStore((s) => s.renameRoom)
  const deleteFloor  = useDungeonStore((s) => s.deleteFloor)
  const renameFloor  = useDungeonStore((s) => s.renameFloor)

  // Live state for the active floor
  const activeRooms        = useDungeonStore((s) => s.rooms)
  const activePaintedCells = useDungeonStore((s) => s.paintedCells)
  const activePlacedObjects = useDungeonStore((s) => s.placedObjects)
  const activeWallOpenings = useDungeonStore((s) => s.wallOpenings)

  function getFloorData(floorId: string): FloorData {
    if (floorId === activeFloorId) {
      return {
        rooms: activeRooms,
        paintedCells: activePaintedCells,
        placedObjects: activePlacedObjects,
        wallOpenings: activeWallOpenings,
      }
    }
    const snap = floors[floorId]?.snapshot
    return {
      rooms: snap?.rooms ?? {},
      paintedCells: snap?.paintedCells ?? {},
      placedObjects: snap?.placedObjects ?? {},
      wallOpenings: snap?.wallOpenings ?? {},
    }
  }

  // Sort floors by level descending (highest floor at top)
  const sortedFloorIds = useMemo(
    () => [...floorOrder].sort((a, b) => (floors[b]?.level ?? 0) - (floors[a]?.level ?? 0)),
    [floorOrder, floors],
  )

  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/75">
        Scene
      </p>

      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          aria-label="Scene overview"
          onClick={() => setFloorViewMode('scene')}
          className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-left transition ${
            floorViewMode === 'scene'
              ? 'border-sky-400/40 bg-sky-500/10 text-sky-100'
              : 'border-stone-800/50 bg-stone-950/40 text-stone-300 hover:border-stone-700 hover:text-stone-100'
          }`}
        >
          <span className="text-xs font-semibold uppercase tracking-[0.24em]">Scene</span>
          <span className="rounded px-1 py-px text-[9px] uppercase tracking-[0.15em] bg-stone-900/60">
            {floorViewMode === 'scene' ? 'overview' : 'all floors'}
          </span>
        </button>

        {sortedFloorIds.map((floorId) => {
          const floor = floors[floorId]
          if (!floor) return null
          const data = getFloorData(floorId)
          const isEditingFloor = floorId === activeFloorId
          const isActive = floorViewMode === 'active' && isEditingFloor

          return (
            <FloorNode
              key={floorId}
              floor={floor}
              isActive={isActive}
              isEditingFloor={isEditingFloor}
              isSceneOverview={floorViewMode === 'scene'}
              data={data}
              selection={selection}
              onActivate={() => {
                setFloorViewMode('active')
                if (!isEditingFloor) requestFloorTransition(floorId)
              }}
              onRename={(name) => renameFloor(floorId, name)}
              onDelete={floorOrder.length > 1 ? () => deleteFloor(floorId) : undefined}
              onSelectProp={(id) => {
                if (floorViewMode !== 'scene' && !isEditingFloor) requestFloorTransition(floorId)
                selectObject(id)
                const assetId = data.placedObjects[id]?.assetId
                const asset = assetId ? getContentPackAssetById(assetId) : null
                if (asset) {
                  setAssetBrowserCategory(getAssetBrowserCategory(asset))
                  setAssetBrowserSubcategory(getAssetBrowserSubcategory(asset))
                }
                setTool(asset?.category === 'player' || isGeneratedCharacterAssetId(asset?.id) ? 'character' : 'prop')
              }}
              onSelectOpening={(id) => {
                if (floorViewMode !== 'scene' && !isEditingFloor) requestFloorTransition(floorId)
                selectObject(id)
                const openingAssetId = data.wallOpenings[id]?.assetId
                const asset = openingAssetId ? getContentPackAssetById(openingAssetId) : null
                if (asset) {
                  setAssetBrowserCategory(getAssetBrowserCategory(asset))
                  setAssetBrowserSubcategory(getAssetBrowserSubcategory(asset))
                } else {
                  setAssetBrowserCategory('openings')
                  setAssetBrowserSubcategory(null)
                }
                setTool('prop')
              }}
              onRenameRoom={(roomId, name) => {
                if (isEditingFloor) renameRoom(roomId, name)
              }}
              onDeleteRoom={(roomId) => {
                if (isEditingFloor) removeRoom(roomId)
              }}
            />
          )
        })}
      </div>
    </section>
  )
}

// ── Floor node ────────────────────────────────────────────────────────────────

type FloorNodeProps = {
  floor: FloorRecord
  isActive: boolean
  isEditingFloor: boolean
  isSceneOverview: boolean
  data: FloorData
  selection: string | null
  onActivate: () => void
  onRename: (name: string) => void
  onDelete?: () => void
  onSelectProp: (id: string) => void
  onSelectOpening: (id: string) => void
  onRenameRoom: (roomId: string, name: string) => void
  onDeleteRoom: (roomId: string) => void
}

function FloorNode({
  floor, isActive, isEditingFloor, isSceneOverview, data, selection,
  onActivate, onRename, onDelete,
  onSelectProp, onSelectOpening, onRenameRoom, onDeleteRoom,
}: FloorNodeProps) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(floor.name)
  const inputRef = useRef<HTMLInputElement>(null)

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed) onRename(trimmed)
    else setDraft(floor.name)
    setEditing(false)
  }

  const levelLabel = floor.level > 0 ? `+${floor.level}` : String(floor.level)
  const levelColor = floor.level > 0
    ? 'text-sky-400/80'
    : floor.level < 0
    ? 'text-amber-400/80'
    : 'text-stone-500'

  // Compute rooms with their props/openings
  const roomList = Object.values(data.rooms)
  const propsByRoom = useMemoGroupBy(data.placedObjects, data.paintedCells)
  const openingsByRoom = useMemoGroupByOpening(data.wallOpenings, data.paintedCells)

  return (
    <div className={`rounded-2xl border ${isActive ? 'border-stone-600/60 bg-stone-900/70' : 'border-stone-800/50 bg-stone-950/40'}`}>
      {/* Floor header */}
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex h-4 w-4 shrink-0 items-center justify-center text-stone-500"
        >
          <ChevronRight size={11} strokeWidth={2} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {/* Level badge */}
        <span className={`shrink-0 text-[10px] font-bold tabular-nums ${levelColor}`}>{levelLabel}</span>

        {/* Floor name */}
        <div className="min-w-0 flex-1" onClick={onActivate}>
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit()
                if (e.key === 'Escape') { setDraft(floor.name); setEditing(false) }
              }}
              className="w-full bg-transparent text-xs font-semibold text-stone-200 outline-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span
              className={`block cursor-pointer truncate text-xs font-semibold ${isActive ? 'text-stone-100' : 'text-stone-400 hover:text-stone-200'}`}
              onDoubleClick={(e) => { e.stopPropagation(); setDraft(floor.name); setEditing(true) }}
            >
              {floor.name}
            </span>
          )}
        </div>

        {isActive && (
          <span className="shrink-0 rounded px-1 py-px text-[9px] uppercase tracking-[0.15em] bg-sky-900/40 text-sky-400/80">active</span>
        )}
        {!isActive && isSceneOverview && isEditingFloor && (
          <span className="shrink-0 rounded px-1 py-px text-[9px] uppercase tracking-[0.15em] bg-amber-900/40 text-amber-300/80">edit</span>
        )}

        {onDelete && (
          <button
            type="button"
            title="Delete floor"
            onClick={onDelete}
            className="flex h-4 w-4 shrink-0 items-center justify-center text-stone-700 hover:text-red-400 transition-colors"
          >
            <Trash2 size={10} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* Room list */}
      {expanded && (
        <div className="border-t border-stone-800/50 px-2 pb-2 pt-1.5 flex flex-col gap-1">
          {roomList.length === 0 ? (
            <p className="py-0.5 pl-1 text-[11px] text-stone-700">No rooms on this floor.</p>
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
                onRename={(name) => onRenameRoom(room.id, name)}
                onDelete={() => onDeleteRoom(room.id)}
                readonly={!isActive}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ── Grouping helpers (not React hooks, called inside render) ──────────────────

function useMemoGroupBy(
  placedObjects: FloorData['placedObjects'],
  paintedCells: PaintedCells,
) {
  return useMemo(() => {
    const acc: Record<string, typeof placedObjects[string][]> = {}
    for (const obj of Object.values(placedObjects)) {
      const posCellKey = `${obj.cell[0]}:${obj.cell[1]}`
      const roomId = paintedCells[posCellKey]?.roomId ?? null
      if (!roomId) continue
      if (!acc[roomId]) acc[roomId] = []
      acc[roomId].push(obj)
    }
    return acc
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placedObjects, paintedCells])
}

function useMemoGroupByOpening(
  wallOpenings: FloorData['wallOpenings'],
  paintedCells: PaintedCells,
) {
  return useMemo(() => {
    const acc: Record<string, typeof wallOpenings[string][]> = {}
    for (const opening of Object.values(wallOpenings)) {
      const parts = opening.wallKey.split(':')
      const cellKey = `${parts[0]}:${parts[1]}`
      const roomId = paintedCells[cellKey]?.roomId ?? null
      if (!roomId) continue
      if (!acc[roomId]) acc[roomId] = []
      acc[roomId].push(opening)
    }
    return acc
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallOpenings, paintedCells])
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
  readonly?: boolean
}

function RoomNode({ room, props, openings, selection, onSelectProp, onSelectOpening, onRename, onDelete, readonly }: RoomNodeProps) {
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
          <ChevronRight size={11} strokeWidth={2} className={`transition-transform ${expanded ? 'rotate-90' : ''}`} />
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
              onDoubleClick={() => { if (!readonly) { setDraft(room.name); setEditing(true) } }}
              title={readonly ? undefined : 'Double-click to rename'}
            >
              {room.name}
            </span>
          )}
        </div>

        {childCount > 0 && !expanded && (
          <span className="shrink-0 text-[10px] text-stone-600">{childCount}</span>
        )}

        {!readonly && (
          <button
            type="button"
            title="Delete room"
            onClick={onDelete}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-stone-700 transition hover:text-red-400"
          >
            <Trash2 size={10} strokeWidth={1.5} />
          </button>
        )}
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
                    label={opening.assetId ? (asset?.name ?? 'Unknown opening') : 'Open passage'}
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
  label, detail, active = false, onClick,
}: {
  label: string
  detail: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left text-[11px] transition ${
        active ? 'bg-sky-500/15 text-sky-300' : 'text-stone-500 hover:bg-stone-800/50 hover:text-stone-400'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <span className={`h-1 w-1 shrink-0 rounded-full ${active ? 'bg-sky-400' : 'bg-stone-700'}`} />
      <span className="truncate">{label}</span>
      <span className="ml-auto shrink-0 font-mono text-[10px] text-stone-700">{detail}</span>
    </button>
  )
}
