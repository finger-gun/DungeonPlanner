import { useState, useRef } from 'react'
import { Eye, EyeOff, Lock, Unlock, Plus, Trash2 } from 'lucide-react'
import { useDungeonStore } from '../../store/useDungeonStore'

export function LayerPanel() {
  const layers = useDungeonStore((state) => state.layers)
  const layerOrder = useDungeonStore((state) => state.layerOrder)
  const activeLayerId = useDungeonStore((state) => state.activeLayerId)
  const addLayer = useDungeonStore((state) => state.addLayer)
  const removeLayer = useDungeonStore((state) => state.removeLayer)
  const renameLayer = useDungeonStore((state) => state.renameLayer)
  const setLayerVisible = useDungeonStore((state) => state.setLayerVisible)
  const setLayerLocked = useDungeonStore((state) => state.setLayerLocked)
  const setActiveLayer = useDungeonStore((state) => state.setActiveLayer)

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Layers
        </p>
        <button
          type="button"
          title="Add layer"
          onClick={() => addLayer('New Layer')}
          className="flex h-6 w-6 items-center justify-center rounded-lg text-stone-500 transition hover:bg-stone-800 hover:text-stone-200"
        >
          <Plus size={13} strokeWidth={2} />
        </button>
      </div>

      <div className="flex flex-col gap-1">
        {layerOrder.map((id) => {
          const layer = layers[id]
          if (!layer) return null
          const isActive = id === activeLayerId

          return (
            <LayerRow
              key={id}
              layer={layer}
              isActive={isActive}
              canDelete={layerOrder.length > 1}
              onActivate={() => setActiveLayer(id)}
              onRename={(name) => renameLayer(id, name)}
              onToggleVisible={() => setLayerVisible(id, !layer.visible)}
              onToggleLocked={() => setLayerLocked(id, !layer.locked)}
              onDelete={() => removeLayer(id)}
            />
          )
        })}
      </div>
    </section>
  )
}

type LayerRowProps = {
  layer: { id: string; name: string; visible: boolean; locked: boolean }
  isActive: boolean
  canDelete: boolean
  onActivate: () => void
  onRename: (name: string) => void
  onToggleVisible: () => void
  onToggleLocked: () => void
  onDelete: () => void
}

function LayerRow({
  layer,
  isActive,
  canDelete,
  onActivate,
  onRename,
  onToggleVisible,
  onToggleLocked,
  onDelete,
}: LayerRowProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(layer.name)
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(layer.name)
    setEditing(true)
    setTimeout(() => inputRef.current?.select(), 0)
  }

  function commitEdit() {
    const trimmed = draft.trim()
    if (trimmed) onRename(trimmed)
    setEditing(false)
  }

  return (
    <div
      className={`group flex items-center gap-1.5 rounded-xl border px-2.5 py-2 transition ${
        isActive
          ? 'border-amber-300/35 bg-amber-400/8 text-amber-100'
          : 'border-stone-800 bg-stone-950/50 text-stone-300'
      }`}
    >
      {/* Active indicator / click to activate */}
      <button
        type="button"
        title="Set as active layer"
        onClick={onActivate}
        className={`h-2 w-2 shrink-0 rounded-full transition ${
          isActive ? 'bg-amber-400' : 'bg-stone-700 hover:bg-stone-500'
        }`}
      />

      {/* Name (double-click to rename) */}
      <div className="flex-1 overflow-hidden">
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
            className="w-full bg-transparent text-xs outline-none"
            autoFocus
          />
        ) : (
          <span
            className={`block cursor-default truncate text-xs ${layer.visible ? '' : 'opacity-40'}`}
            onDoubleClick={startEdit}
            title={`${layer.name}${isActive ? ' (active)' : ''}`}
          >
            {layer.name}
          </span>
        )}
      </div>

      {/* Controls — visible on hover */}
      <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          type="button"
          title={layer.visible ? 'Hide layer' : 'Show layer'}
          onClick={onToggleVisible}
          className="flex h-5 w-5 items-center justify-center rounded text-stone-500 hover:text-stone-200"
        >
          {layer.visible ? <Eye size={12} strokeWidth={1.5} /> : <EyeOff size={12} strokeWidth={1.5} />}
        </button>
        <button
          type="button"
          title={layer.locked ? 'Unlock layer' : 'Lock layer'}
          onClick={onToggleLocked}
          className="flex h-5 w-5 items-center justify-center rounded text-stone-500 hover:text-stone-200"
        >
          {layer.locked ? <Lock size={12} strokeWidth={1.5} /> : <Unlock size={12} strokeWidth={1.5} />}
        </button>
        {canDelete && (
          <button
            type="button"
            title="Delete layer"
            onClick={onDelete}
            className="flex h-5 w-5 items-center justify-center rounded text-stone-500 hover:text-red-400"
          >
            <Trash2 size={12} strokeWidth={1.5} />
          </button>
        )}
      </div>
    </div>
  )
}
