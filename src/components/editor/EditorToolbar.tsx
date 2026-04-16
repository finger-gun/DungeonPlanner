import { useRef, useState, useEffect } from 'react'
import {
  Box,
  DoorOpen,
  FolderOpen,
  FilePlus2,
  Download,
  Blocks,
  Joystick,
  MousePointer2,
  Redo2,
  Settings,
  Undo2,
  Upload,
  Users,
} from 'lucide-react'
import { useDungeonStore, type DungeonTool } from '../../store/useDungeonStore'

const TOOLS: { id: DungeonTool; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; label: string }[] = [
  { id: 'play',    Icon: Joystick,      label: 'Play' },
  { id: 'select',  Icon: MousePointer2, label: 'Select' },
  { id: 'room',    Icon: Blocks,        label: 'Room' },
  { id: 'character', Icon: Users,       label: 'Character' },
  { id: 'prop',    Icon: Box,           label: 'Prop' },
  { id: 'opening', Icon: DoorOpen,      label: 'Opening' },
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

      {/* File menu + Undo/Redo at bottom */}
      <div className="flex flex-col items-center gap-1">
        <FileMenuButton />
        <SettingsButton />
        <div className="my-1 h-px w-6 bg-stone-800" />
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

function SettingsButton() {
  const tool = useDungeonStore((state) => state.tool)
  const setTool = useDungeonStore((state) => state.setTool)
  const active = tool === 'move'

  return (
    <button
      type="button"
      title="Settings"
      onClick={() => setTool('move')}
      className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
        active
          ? 'bg-amber-400/20 text-amber-300'
          : 'text-stone-500 hover:bg-stone-800 hover:text-stone-200'
      }`}
    >
      <Settings size={16} strokeWidth={active ? 2 : 1.5} />
    </button>
  )
}

// ── File menu ─────────────────────────────────────────────────────────────────

function FileMenuButton() {
  const [open, setOpen] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const downloadDungeon = useDungeonStore((s) => s.downloadDungeon)
  const loadDungeon = useDungeonStore((s) => s.loadDungeon)
  const newDungeon = useDungeonStore((s) => s.newDungeon)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
        setConfirmNew(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const json = ev.target?.result
      if (typeof json === 'string') loadDungeon(json)
    }
    reader.readAsText(file)
    e.target.value = ''
    setOpen(false)
  }

  function handleNew() {
    if (!confirmNew) { setConfirmNew(true); return }
    newDungeon()
    setOpen(false)
    setConfirmNew(false)
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        title="File"
        onClick={() => { setOpen((v) => !v); setConfirmNew(false) }}
        className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
          open ? 'bg-stone-800 text-stone-200' : 'text-stone-500 hover:bg-stone-800 hover:text-stone-200'
        }`}
      >
        <FolderOpen size={16} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="absolute bottom-0 left-14 z-50 w-44 rounded-2xl border border-stone-700/60 bg-stone-900 py-1.5 shadow-xl">
          {/* New */}
          <button
            type="button"
            onClick={handleNew}
            className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition ${
              confirmNew
                ? 'bg-red-900/40 text-red-300 hover:bg-red-900/60'
                : 'text-stone-300 hover:bg-stone-800'
            }`}
          >
            <FilePlus2 size={14} strokeWidth={1.5} className="shrink-0" />
            {confirmNew ? 'Confirm — clear all?' : 'New Dungeon'}
          </button>

          <div className="my-1 mx-3 h-px bg-stone-800" />

          {/* Save */}
          <button
            type="button"
            onClick={() => { downloadDungeon(); setOpen(false) }}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-stone-300 transition hover:bg-stone-800"
          >
            <Download size={14} strokeWidth={1.5} className="shrink-0" />
            Save Dungeon
          </button>

          {/* Load */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-stone-300 transition hover:bg-stone-800"
          >
            <Upload size={14} strokeWidth={1.5} className="shrink-0" />
            Load Dungeon
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.dungeon.json"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  )
}
