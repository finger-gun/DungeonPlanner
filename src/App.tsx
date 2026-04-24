import { Suspense, lazy, useEffect, useEffectEvent, useRef, useState } from 'react'
import { overlayDomRef } from './components/canvas/floorTransition'
import { getDefaultAssetIdByCategory } from './content-packs/registry'
import { getContentPackAssetById } from './content-packs/registry'
import {
  getContentPackAssetSourceLink,
  getContentPackAssetSourcePath,
  getDebugPanelAssetId,
} from './content-packs/debugSourceLinks'
import { EditorToolbar } from './components/editor/EditorToolbar'
import { CameraDropdown } from './components/editor/CameraDropdown'
import { MoveToolPanel } from './components/editor/MoveToolPanel'
import { RoomToolPanel } from './components/editor/RoomToolPanel'
import { PropToolPanel } from './components/editor/PropToolPanel'
import { CharacterToolPanel } from './components/editor/CharacterToolPanel'
import { SelectToolPanel } from './components/editor/SelectToolPanel'
import { ScenePanel } from './components/editor/ScenePanel'
import { CharacterSheetOverlay } from './components/editor/CharacterSheetOverlay'
import { getDebugCameraPose, projectDebugWorldPoint } from './components/canvas/debugCameraBridge'
import { migrateLegacyGeneratedCharacters } from './generated-characters/migration'
import { useDungeonStore } from './store/useDungeonStore'
import { shouldRotateSelectionFromShortcut } from './rotationShortcuts'
import {
  cellToWorldPosition,
  getCellKey,
  getRectangleCells,
  type GridCell,
} from './hooks/useSnapToGrid'
import type {
  CameraPreset,
} from './store/useDungeonStore'
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { RendererErrorBoundary } from './components/RendererErrorBoundary'
import { WebGpuRequiredNotice } from './components/WebGpuRequiredNotice'
import { getWebGpuSupportMessage, isWebGpuSupported } from './rendering/webgpuSupport'
import {
  copyEditorDungeon,
  deleteEditorDungeon,
  consumeEditorDungeonHandoff,
  listEditorDungeons,
  openEditorDungeon,
  parseEditorDungeonHandoff,
  saveEditorDungeon,
  stripEditorDungeonHandoff,
} from './lib/editorDungeonHandoff'
import type { SavedDungeonSummary } from '../shared/editorAccess'

const Scene = lazy(() =>
  import('./components/canvas/Scene').then((module) => ({
    default: module.Scene,
  })),
)

const FpsOverlay = lazy(() =>
  import('./components/canvas/FpsCounter').then((module) => ({
    default: module.FpsOverlay,
  })),
)

const EDITOR_LIBRARY_SESSION_STORAGE_KEY = 'dungeonplanner.editor-library-access'

function RightPanel({
  panelMode,
  onExitSettings,
}: {
  panelMode: 'tool' | 'settings'
  onExitSettings?: () => void
}) {
  const tool = useDungeonStore((state) => state.tool)
  const mapMode = useDungeonStore((state) => state.mapMode)
  const showSettings = panelMode === 'settings'
  return (
    <aside
      id="editor-right-panel"
      data-testid="editor-right-panel"
      className="flex h-full flex-col overflow-hidden border-l border-stone-800/80 bg-stone-950/85 backdrop-blur"
    >
      {!showSettings && (
        <div className="shrink-0 border-b border-stone-800/60 p-5">
          <ScenePanel />
        </div>
      )}

      {/* Tool-specific panel */}
      <div className="flex-1 overflow-y-auto p-5">
        <div className="mb-5 flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/75">
            {showSettings
              ? 'Settings'
              : tool === 'play'
              ? 'Play'
              : tool === 'select'
                ? 'Select'
                : tool === 'move'
                  ? 'Move'
                  : tool === 'room'
                    ? mapMode === 'outdoor' ? 'Terrain' : 'Room'
                    : tool === 'character'
                      ? 'Characters'
                      : 'Assets'}
          </p>
          {showSettings && onExitSettings && (
            <button
              type="button"
              aria-label="Back from settings"
              onClick={onExitSettings}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-stone-400 transition hover:bg-stone-800 hover:text-stone-100"
            >
              <ChevronLeft size={16} strokeWidth={1.8} />
            </button>
          )}
        </div>
        {showSettings && <MoveToolPanel />}
        {!showSettings && tool === 'play' && null}
        {!showSettings && tool === 'select' && <SelectToolPanel />}
        {!showSettings && tool === 'room' && <RoomToolPanel />}
        {!showSettings && tool === 'character' && <CharacterToolPanel />}
        {!showSettings && tool === 'prop' && <PropToolPanel />}
      </div>
    </aside>
  )
}

function RemoteDungeonLibraryModal({
  activeDungeonId,
  busyAction,
  dungeons,
  error,
  isLoading,
  onClose,
  onCopy,
  onDelete,
  onOpen,
}: {
  activeDungeonId: string | null
  busyAction: string | null
  dungeons: SavedDungeonSummary[]
  error: string | null
  isLoading: boolean
  onClose: () => void
  onCopy: (dungeon: SavedDungeonSummary) => void
  onDelete: (dungeon: SavedDungeonSummary) => void
  onOpen: (dungeon: SavedDungeonSummary) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-stone-700/70 bg-stone-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-stone-800/80 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-300/80">Dungeon Library</p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-100">Open a saved dungeon</h2>
            <p className="mt-1 text-sm text-stone-400">
              Open, copy, or delete private dungeon records without leaving the editor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-stone-700 px-3 py-2 text-sm text-stone-300 transition hover:border-stone-500 hover:text-stone-100"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error ? (
            <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-950/40 px-4 py-3 text-sm text-red-100">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <p className="text-sm text-stone-400">Loading your dungeon library...</p>
          ) : dungeons.length > 0 ? (
            <div className="grid gap-4">
              {dungeons.map((dungeon) => (
                <article
                  key={dungeon._id}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-stone-800/80 bg-stone-900/70 p-4"
                >
                  <div className="max-w-2xl">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-stone-100">{dungeon.title}</h3>
                      {activeDungeonId === dungeon._id ? (
                        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200">
                          Current
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 text-sm text-stone-400">{dungeon.description ?? 'No description yet.'}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.24em] text-stone-500">
                      Updated {new Date(dungeon.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => onOpen(dungeon)}
                      disabled={busyAction === `open:${dungeon._id}`}
                      className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyAction === `open:${dungeon._id}` ? 'Opening...' : 'Open'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onCopy(dungeon)}
                      disabled={busyAction === `copy:${dungeon._id}`}
                      className="rounded-xl border border-stone-700 px-4 py-2 text-sm text-stone-200 transition hover:border-stone-500 hover:text-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyAction === `copy:${dungeon._id}` ? 'Copying...' : 'Copy'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(dungeon)}
                      disabled={busyAction === `delete:${dungeon._id}`}
                      className="rounded-xl border border-red-500/30 px-4 py-2 text-sm text-red-200 transition hover:border-red-400/50 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {busyAction === `delete:${dungeon._id}` ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-stone-700 px-4 py-8 text-center text-sm text-stone-400">
              Your dungeon library is empty. Save the current map to create your first record.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  const tool = useDungeonStore((state) => state.tool)
  const mapMode = useDungeonStore((state) => state.mapMode)
  const roomEditMode = useDungeonStore((state) => state.roomEditMode)
  const outdoorBrushMode = useDungeonStore((state) => state.outdoorBrushMode)
  const dungeonName = useDungeonStore((state) => state.dungeonName)
  const exportDungeonJson = useDungeonStore((state) => state.exportDungeonJson)
  const isPlayMode = tool === 'play'
  const [sidebarPanel, setSidebarPanel] = useState<'tool' | 'settings'>('tool')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [debugPanelOpen, setDebugPanelOpen] = useState(false)
  const [editorLibraryAccess, setEditorLibraryAccess] = useState<{
    backendUrl: string
    accessToken: string
  } | null>(null)
  const [editorLibraryOpen, setEditorLibraryOpen] = useState(false)
  const [editorLibraryRecords, setEditorLibraryRecords] = useState<SavedDungeonSummary[]>([])
  const [editorLibraryBusyAction, setEditorLibraryBusyAction] = useState<string | null>(null)
  const [editorLibraryError, setEditorLibraryError] = useState<string | null>(null)
  const [editorLibraryNotice, setEditorLibraryNotice] = useState<string | null>(null)
  const [isEditorLibraryLoading, setIsEditorLibraryLoading] = useState(false)
  const [isSavingRemoteDungeon, setIsSavingRemoteDungeon] = useState(false)
  const [currentRemoteDungeonId, setCurrentRemoteDungeonId] = useState<string | null>(null)
  const selectedAssetIds = useDungeonStore((state) => state.selectedAssetIds)
  const surfaceBrushAssetIds = useDungeonStore((state) => state.surfaceBrushAssetIds)
  const assetBrowser = useDungeonStore((state) => state.assetBrowser)
  const selection = useDungeonStore((state) => state.selection)
  const selectedObject = useDungeonStore((state) =>
    selection ? state.placedObjects[selection] : null,
  )
  const selectedOpening = useDungeonStore((state) =>
    selection ? state.wallOpenings[selection] : null,
  )
  const propCount = useDungeonStore(
    (state) => Object.keys(state.placedObjects).length,
  )
  const paintedCellCount = useDungeonStore(
    (state) => Object.keys(state.paintedCells).length,
  )
  const exploredCellCount = useDungeonStore(
    (state) => Object.keys(state.exploredCells).length,
  )
  const clearExploredCells = useDungeonStore((state) => state.clearExploredCells)
  const showLosDebugMask = useDungeonStore((state) => state.showLosDebugMask)
  const showLosDebugRays = useDungeonStore((state) => state.showLosDebugRays)
  const showLensFocusDebugPoint = useDungeonStore((state) => state.showLensFocusDebugPoint)
  const showProjectionDebugMesh = useDungeonStore((state) => state.showProjectionDebugMesh)
  const setShowLosDebugMask = useDungeonStore((state) => state.setShowLosDebugMask)
  const setShowLosDebugRays = useDungeonStore((state) => state.setShowLosDebugRays)
  const setShowLensFocusDebugPoint = useDungeonStore((state) => state.setShowLensFocusDebugPoint)
  const setShowProjectionDebugMesh = useDungeonStore((state) => state.setShowProjectionDebugMesh)
  const debugAssetId = getDebugPanelAssetId({
    tool,
    selectedAssetIds,
    surfaceBrushAssetIds,
    assetBrowser,
    selectedObject,
    selectedOpening,
  })
  const debugAsset = debugAssetId ? getContentPackAssetById(debugAssetId) : null
  const debugAssetSourcePath = debugAssetId ? getContentPackAssetSourcePath(debugAssetId) : null
  const debugAssetSourceLink = debugAssetId ? getContentPackAssetSourceLink(debugAssetId) : null
  const webGpuSupported = isWebGpuSupported()
  const showSettingsPanel = sidebarPanel === 'settings'
  const sidebarVisible = sidebarOpen && (!isPlayMode || showSettingsPanel)
  const cameraRightOffset = sidebarVisible ? 400 : 16

  const onWindowKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (event.ctrlKey && event.shiftKey && event.key === 'F12') {
      event.preventDefault()
      setDebugPanelOpen((open) => !open)
      return
    }

    // Don't fire any scene hotkeys while the user is typing in a text field
    const active = document.activeElement
    if (
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement ||
      (active instanceof HTMLElement && active.isContentEditable)
    ) return

    const state = useDungeonStore.getState()

    if (event.key === 'Escape' && (state.selection || state.selectedRoomId)) {
      event.preventDefault()
      state.clearSelection()
      return
    }

    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      state.selectedRoomId
    ) {
      event.preventDefault()
      state.removeSelectedRoom()
      return
    }

    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      state.selection
    ) {
      event.preventDefault()
      state.removeSelectedObject()
      return
    }

    if (
      (event.key === 'r' || event.key === 'R') &&
      state.selection &&
      shouldRotateSelectionFromShortcut(state.tool)
    ) {
      event.preventDefault()
      state.rotateSelection()
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault()

      if (event.shiftKey) {
        state.redo()
        return
      }

      state.undo()
      return
    }

    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault()
      state.redo()
    }
  })

  useEffect(() => {
    window.addEventListener('keydown', onWindowKeyDown)
    return () => window.removeEventListener('keydown', onWindowKeyDown)
  }, [])

  useEffect(() => {
    const handoff = parseEditorDungeonHandoff(window.location.search)
    const storedAccess = (() => {
      try {
        const raw = window.sessionStorage.getItem(EDITOR_LIBRARY_SESSION_STORAGE_KEY)
        if (!raw) {
          return null
        }

        return JSON.parse(raw) as {
          backendUrl: string
          accessToken: string
        }
      } catch {
        return null
      }
    })()
    const access = handoff
      ? {
          backendUrl: handoff.backendUrl,
          accessToken: handoff.accessToken,
        }
      : storedAccess

    if (!access) {
      return
    }

    setEditorLibraryAccess(access)
    window.sessionStorage.setItem(EDITOR_LIBRARY_SESSION_STORAGE_KEY, JSON.stringify(access))

    if (!handoff?.dungeonId) {
      if (handoff) {
        const nextSearch = stripEditorDungeonHandoff(window.location.search)
        window.history.replaceState({}, '', `${window.location.pathname}${nextSearch}${window.location.hash}`)
      }

      return
    }

    let cancelled = false

    void (async () => {
      try {
        const dungeon = await consumeEditorDungeonHandoff(handoff)

        if (cancelled) {
          return
        }

        const loaded = useDungeonStore.getState().loadDungeon(dungeon.serializedDungeon)

        if (!loaded) {
          console.error('Remote dungeon handoff payload could not be loaded.')
          return
        }

        setCurrentRemoteDungeonId(dungeon._id)
        setEditorLibraryNotice(`Opened "${dungeon.title}" from your private library.`)
      } catch (error) {
        console.error(error)
      } finally {
        if (!cancelled) {
          const nextSearch = stripEditorDungeonHandoff(window.location.search)
          window.history.replaceState({}, '', `${window.location.pathname}${nextSearch}${window.location.hash}`)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  async function refreshEditorLibrary(access = editorLibraryAccess) {
    if (!access) {
      return []
    }

    setIsEditorLibraryLoading(true)

    try {
      const dungeons = await listEditorDungeons(access)
      setEditorLibraryRecords(dungeons)
      setEditorLibraryError(null)
      return dungeons
    } catch (error) {
      console.error(error)
      setEditorLibraryError('Loading your dungeon library failed.')
      return []
    } finally {
      setIsEditorLibraryLoading(false)
    }
  }

  async function handleOpenRemoteLibrary() {
    if (!editorLibraryAccess) {
      return
    }

    setEditorLibraryOpen(true)
    await refreshEditorLibrary(editorLibraryAccess)
  }

  async function handleOpenRemoteDungeon(dungeon: SavedDungeonSummary) {
    if (!editorLibraryAccess) {
      return
    }

    setEditorLibraryBusyAction(`open:${dungeon._id}`)

    try {
      const record = await openEditorDungeon(editorLibraryAccess, dungeon._id)
      const loaded = useDungeonStore.getState().loadDungeon(record.serializedDungeon)

      if (!loaded) {
        setEditorLibraryError('The selected dungeon could not be loaded into the editor.')
        return
      }

      setCurrentRemoteDungeonId(record._id)
      setEditorLibraryNotice(`Opened "${record.title}" from your private library.`)
      setEditorLibraryError(null)
      setEditorLibraryOpen(false)
    } catch (error) {
      console.error(error)
      setEditorLibraryError('Opening that dungeon failed.')
    } finally {
      setEditorLibraryBusyAction(null)
    }
  }

  async function handleCopyRemoteDungeon(dungeon: SavedDungeonSummary) {
    if (!editorLibraryAccess) {
      return
    }

    setEditorLibraryBusyAction(`copy:${dungeon._id}`)

    try {
      const copiedDungeon = await copyEditorDungeon(editorLibraryAccess, dungeon._id)
      setEditorLibraryNotice(`Created "${copiedDungeon.title}" in your private library.`)
      setEditorLibraryError(null)
      await refreshEditorLibrary(editorLibraryAccess)
    } catch (error) {
      console.error(error)
      setEditorLibraryError('Copying that dungeon failed.')
    } finally {
      setEditorLibraryBusyAction(null)
    }
  }

  async function handleDeleteRemoteDungeon(dungeon: SavedDungeonSummary) {
    if (!editorLibraryAccess) {
      return
    }

    if (!window.confirm(`Delete "${dungeon.title}" from your dungeon library?`)) {
      return
    }

    setEditorLibraryBusyAction(`delete:${dungeon._id}`)

    try {
      await deleteEditorDungeon(editorLibraryAccess, dungeon._id)
      if (currentRemoteDungeonId === dungeon._id) {
        setCurrentRemoteDungeonId(null)
      }
      setEditorLibraryNotice(`Deleted "${dungeon.title}" from your private library.`)
      setEditorLibraryError(null)
      await refreshEditorLibrary(editorLibraryAccess)
    } catch (error) {
      console.error(error)
      setEditorLibraryError('Deleting that dungeon failed.')
    } finally {
      setEditorLibraryBusyAction(null)
    }
  }

  async function handleSaveRemoteDungeon() {
    if (!editorLibraryAccess) {
      return
    }

    setIsSavingRemoteDungeon(true)

    try {
      const savedDungeon = await saveEditorDungeon(editorLibraryAccess, {
        dungeonId: currentRemoteDungeonId ?? undefined,
        title: dungeonName,
        serializedDungeon: exportDungeonJson(),
      })
      setCurrentRemoteDungeonId(savedDungeon._id)
      setEditorLibraryNotice(`Saved "${savedDungeon.title}" to your private library.`)
      setEditorLibraryError(null)
      if (editorLibraryOpen) {
        await refreshEditorLibrary(editorLibraryAccess)
      }
    } catch (error) {
      console.error(error)
      setEditorLibraryError('Saving to your dungeon library failed.')
    } finally {
      setIsSavingRemoteDungeon(false)
    }
  }

  function handleNewDungeon() {
    setCurrentRemoteDungeonId(null)
    setEditorLibraryError(null)
    setEditorLibraryNotice(null)
  }

  useEffect(() => {
    if (!import.meta.env.DEV) {
      return
    }

    window.__DUNGEON_DEBUG__ = {
      getSnapshot: () => useDungeonStore.getState(),
      placeAtCell: (cell: GridCell, tool = 'room') => {
        const state = useDungeonStore.getState()
        if (tool === 'prop' || tool === 'character') {
          const position = cellToWorldPosition(cell)
          const assetId = tool === 'character'
            ? state.selectedAssetIds.player ?? getDefaultAssetIdByCategory('player')
            : state.selectedAssetIds.prop ?? getDefaultAssetIdByCategory('prop')
          const asset = assetId ? getContentPackAssetById(assetId) : null

          return state.placeObject({
            type: tool === 'character' || asset?.category === 'player' ? 'player' : 'prop',
            assetId,
            position: [position[0], 0.45, position[2]],
            rotation: [0, 0, 0],
            props: {},
            cell,
            cellKey: getCellKey(cell),
          })
        }

        return state.paintCells([cell])
      },
      paintRectangle: (startCell: GridCell, endCell: GridCell) => {
        return useDungeonStore
          .getState()
          .paintCells(getRectangleCells(startCell, endCell))
      },
      eraseRectangle: (startCell: GridCell, endCell: GridCell) => {
        return useDungeonStore
          .getState()
          .eraseCells(getRectangleCells(startCell, endCell))
      },
      removeAtCell: (cell: GridCell, tool = 'room') => {
        if (tool === 'prop' || tool === 'character') {
          useDungeonStore.getState().removeObjectAtCell(getCellKey(cell))
          return
        }

        useDungeonStore.getState().eraseCells([cell])
      },
      reset: () => {
        useDungeonStore.getState().reset()
      },
      setCameraPreset: (preset: CameraPreset) => {
        useDungeonStore.getState().setCameraPreset(preset)
      },
      getCameraPose: () => getDebugCameraPose(),
      getObjectScreenPosition: (id: string) => {
        const object = (useDungeonStore.getState().placedObjects ?? {})[id]
        if (!object) {
          return null
        }

        return projectDebugWorldPoint([
          object.position[0],
          object.position[1] + 1,
          object.position[2],
        ])
      },
      getCellScreenPosition: (cell: GridCell) => {
        const [worldX, , worldZ] = cellToWorldPosition(cell)
        return projectDebugWorldPoint([worldX, 1, worldZ])
      },
      getAssetSourceLink: (assetId: string) => getContentPackAssetSourceLink(assetId),
    }

    return () => {
      delete window.__DUNGEON_DEBUG__
    }
  }, [])

  const toolHint =
    tool === 'play'
      ? 'Drag characters to move them'
      : tool === 'move'
      ? 'Navigate the scene and open settings when needed'
        : tool === 'room'
          ? roomEditMode === 'rooms'
            ? mapMode === 'outdoor'
              ? outdoorBrushMode === 'terrain-style'
                ? 'Left-drag to paint terrain styles · right-drag to reset cells to the map default'
                : outdoorBrushMode === 'terrain-sculpt'
                  ? 'Left-drag to raise stepped terrain · right-drag to lower stepped terrain into pits and trenches'
                  : 'Left-drag to paint nature with the selected style · right-drag to erase nature areas'
              : 'Click room to select · drag room edges to resize · rectangular rooms also show corner handles · left-drag empty space to build · right-drag to erase'
            : roomEditMode === 'walls'
              ? 'Top-down wall editing · drag to preview an axis-locked wall run · release to add or remove it'
            : roomEditMode === 'floor-variants'
              ? 'Pick a floor variant · click a painted tile to apply it · right-click to clear the tile override'
              : 'Pick a wall variant · click a wall segment to apply it · right-click to clear the wall override'
        : tool === 'character'
          ? 'Select a character to place · click a room cell to place it · use Edit to reopen the character sheet'
        : tool === 'prop'
          ? 'Browse props, openings, and surfaces in one place · placement behavior adapts to the selected asset'
          : 'Click to place · R to rotate · right-click to remove · Alt+click to inspect'

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <GeneratedCharacterMigrationBootstrap />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.08),_transparent_40%),linear-gradient(180deg,_rgba(28,25,23,0.35),_rgba(12,10,9,0.95))]" />
      <div className="relative flex h-screen">
        {/* Narrow vertical icon toolbar */}
        <div className="z-10 w-14 shrink-0">
          <EditorToolbar
            isSavingRemoteDungeon={isSavingRemoteDungeon}
            onNewDungeon={handleNewDungeon}
            onOpenRemoteLibrary={() => {
              void handleOpenRemoteLibrary()
            }}
            settingsOpen={showSettingsPanel}
            onOpenSettings={() => {
              setSidebarPanel('settings')
              setSidebarOpen(true)
            }}
            onSaveRemoteDungeon={() => {
              void handleSaveRemoteDungeon()
            }}
            onSelectTool={() => {
              setSidebarPanel('tool')
            }}
            remoteLibraryEnabled={Boolean(editorLibraryAccess)}
          />
        </div>

        <section
          data-testid="editor-canvas-shell"
          className="relative flex-1 overflow-hidden bg-stone-950"
          onContextMenu={(event) => event.preventDefault()}
        >
          <Suspense
            fallback={
              <div className="absolute inset-0 grid place-items-center bg-stone-950 text-sm uppercase tracking-[0.28em] text-stone-400">
                Loading editor scene
              </div>
            }
          >
            {webGpuSupported ? (
              <RendererErrorBoundary title="Scene unavailable">
                <Scene />
              </RendererErrorBoundary>
            ) : (
              <WebGpuRequiredNotice message={getWebGpuSupportMessage()} />
            )}
          </Suspense>

          {!isPlayMode && <CharacterSheetOverlay />}

          <CameraDropdown rightOffset={cameraRightOffset} />

          {/* Floor-switch transition overlay — opacity driven imperatively by FloorTransitionController */}
          <div
            ref={overlayDomRef}
            className="pointer-events-none absolute inset-0 bg-stone-950"
            style={{ opacity: 0 }}
          />

          {/* Tool hint overlay */}
          <div className="absolute left-4 top-4 rounded-2xl border border-amber-300/15 bg-stone-950/78 px-4 py-3 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">
              {tool === 'play'
                ? 'Play'
                : tool === 'select'
                  ? 'Select'
                : tool === 'move'
                    ? 'Move'
                    : tool === 'character'
                      ? 'Characters'
                    : tool === 'room'
                      ? mapMode === 'outdoor' ? 'Terrain' : 'Room'
                      : 'Assets'}
            </p>
            <p className="mt-1.5 text-xs text-stone-400">{toolHint}</p>
          </div>

          {editorLibraryNotice ? (
            <div className="absolute right-4 top-4 max-w-sm rounded-2xl border border-emerald-500/20 bg-emerald-950/45 px-4 py-3 text-sm text-emerald-100 backdrop-blur">
              {editorLibraryNotice}
            </div>
          ) : null}

          {editorLibraryError && !editorLibraryOpen ? (
            <div className="absolute right-4 top-20 max-w-sm rounded-2xl border border-red-500/25 bg-red-950/45 px-4 py-3 text-sm text-red-100 backdrop-blur">
              {editorLibraryError}
            </div>
          ) : null}

          {debugPanelOpen && (
            <DebugVisibilityPanel
              rightOffsetClass={!isPlayMode && sidebarVisible ? 'right-[23rem]' : 'right-4'}
              exploredCellCount={exploredCellCount}
              clearExploredCells={clearExploredCells}
              showLosDebugMask={showLosDebugMask}
              showLosDebugRays={showLosDebugRays}
              showLensFocusDebugPoint={showLensFocusDebugPoint}
              showProjectionDebugMesh={showProjectionDebugMesh}
              setShowLosDebugMask={setShowLosDebugMask}
              setShowLosDebugRays={setShowLosDebugRays}
              setShowLensFocusDebugPoint={setShowLensFocusDebugPoint}
              setShowProjectionDebugMesh={setShowProjectionDebugMesh}
              debugAssetName={debugAsset?.name ?? null}
              debugAssetSourcePath={debugAssetSourcePath}
              debugAssetSourceLink={debugAssetSourceLink}
            />
          )}

          {/* Stats counter */}
          <div
            data-testid="placement-counter"
            className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-teal-300/20 bg-stone-950/75 px-4 py-2 text-xs uppercase tracking-[0.25em] text-teal-200/85 backdrop-blur"
          >
            {formatCount(paintedCellCount, 'room cell')} •{' '}
            {formatCount(propCount, 'prop')}
          </div>

          {!isPlayMode && (
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 z-30 flex items-center transition-transform duration-200 ease-out ${
                sidebarVisible ? 'translate-x-0' : 'translate-x-[22rem]'
              }`}
            >
              <div className="pointer-events-auto">
                <button
                  type="button"
                  aria-controls="editor-right-panel"
                  aria-expanded={sidebarVisible}
                  aria-label={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
                  onClick={() => setSidebarOpen((open) => !open)}
                  className="flex h-16 w-8 items-center justify-center rounded-l-2xl border border-r-0 border-stone-700/70 bg-stone-950/90 text-stone-300 shadow-2xl backdrop-blur transition hover:border-stone-500 hover:text-stone-100"
                >
                  {sidebarVisible ? <ChevronRight size={16} strokeWidth={1.8} /> : <ChevronLeft size={16} strokeWidth={1.8} />}
                </button>
              </div>
              <div
                data-testid="editor-right-panel-shell"
                data-sidebar-visible={sidebarVisible}
                data-sidebar-panel={showSettingsPanel ? 'settings' : 'tool'}
                aria-hidden={!sidebarVisible}
                className={`h-full w-[22rem] pointer-events-auto ${
                  sidebarVisible ? '' : 'pointer-events-none'
                }`}
              >
                <RightPanel
                  panelMode={showSettingsPanel ? 'settings' : 'tool'}
                  onExitSettings={() => {
                    setSidebarPanel('tool')
                  }}
                />
              </div>
            </div>
          )}

          {webGpuSupported && (
            <Suspense fallback={null}>
              <FpsOverlay />
            </Suspense>
          )}

          {isPlayMode && showSettingsPanel && (
            <div
              data-testid="editor-right-panel-shell"
              data-sidebar-visible={sidebarVisible}
              data-sidebar-panel={showSettingsPanel ? 'settings' : 'tool'}
              aria-hidden={!sidebarVisible}
              className={`absolute inset-y-0 right-0 z-30 h-full w-[22rem] transition-transform duration-200 ease-out ${
                sidebarVisible ? 'translate-x-0 pointer-events-auto' : 'translate-x-full pointer-events-none'
              }`}
            >
              <RightPanel
                panelMode={showSettingsPanel ? 'settings' : 'tool'}
                onExitSettings={() => {
                  setSidebarPanel('tool')
                }}
              />
            </div>
          )}
        </section>
      </div>
      {editorLibraryOpen ? (
        <RemoteDungeonLibraryModal
          activeDungeonId={currentRemoteDungeonId}
          busyAction={editorLibraryBusyAction}
          dungeons={editorLibraryRecords}
          error={editorLibraryError}
          isLoading={isEditorLibraryLoading}
          onClose={() => setEditorLibraryOpen(false)}
          onCopy={(dungeon) => {
            void handleCopyRemoteDungeon(dungeon)
          }}
          onDelete={(dungeon) => {
            void handleDeleteRemoteDungeon(dungeon)
          }}
          onOpen={(dungeon) => {
            void handleOpenRemoteDungeon(dungeon)
          }}
        />
      ) : null}
    </div>
  )
}

export default App

function GeneratedCharacterMigrationBootstrap() {
  const generatedCharacters = useDungeonStore((state) => state.generatedCharacters)
  const updateGeneratedCharacter = useDungeonStore((state) => state.updateGeneratedCharacter)
  const migrationScheduledRef = useRef(false)

  useEffect(() => {
    if (migrationScheduledRef.current) {
      return
    }

    migrationScheduledRef.current = true
    queueMicrotask(() => {
      migrationScheduledRef.current = false
      void migrateLegacyGeneratedCharacters({
        getCharacters: () => useDungeonStore.getState().generatedCharacters,
        updateCharacter: updateGeneratedCharacter,
      })
    })
  }, [generatedCharacters, updateGeneratedCharacter])

  return null
}

function formatCount(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`
}

function DebugVisibilityPanel({
  rightOffsetClass,
  exploredCellCount,
  clearExploredCells,
  showLosDebugMask,
  showLosDebugRays,
  showLensFocusDebugPoint,
  showProjectionDebugMesh,
  setShowLosDebugMask,
  setShowLosDebugRays,
  setShowLensFocusDebugPoint,
  setShowProjectionDebugMesh,
  debugAssetName,
  debugAssetSourcePath,
  debugAssetSourceLink,
}: {
  rightOffsetClass: string
  exploredCellCount: number
  clearExploredCells: () => void
  showLosDebugMask: boolean
  showLosDebugRays: boolean
  showLensFocusDebugPoint: boolean
  showProjectionDebugMesh: boolean
  setShowLosDebugMask: (show: boolean) => void
  setShowLosDebugRays: (show: boolean) => void
  setShowLensFocusDebugPoint: (show: boolean) => void
  setShowProjectionDebugMesh: (show: boolean) => void
  debugAssetName: string | null
  debugAssetSourcePath: string | null
  debugAssetSourceLink: string | null
}) {
  return (
    <aside
      data-testid="debug-visibility-panel"
      className={`absolute top-20 z-40 flex w-72 flex-col gap-4 rounded-2xl border border-emerald-400/25 bg-stone-950/92 p-4 shadow-2xl backdrop-blur ${rightOffsetClass}`}
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/85">
          Debug Visibility
        </p>
        <p className="mt-1 text-xs text-stone-400">Ctrl+Shift+F12 to toggle this panel</p>
      </div>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={clearExploredCells}
          disabled={exploredCellCount === 0}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-stone-900/90 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200 transition hover:border-amber-300/35 hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw size={12} strokeWidth={1.8} />
          Reset reveal
        </button>

        <DebugToggleButton
          label="Render LoS rays"
          pressed={showLosDebugRays}
          onClick={() => setShowLosDebugRays(!showLosDebugRays)}
        />
        <DebugToggleButton
          label="Render LoS mask"
          pressed={showLosDebugMask}
          onClick={() => setShowLosDebugMask(!showLosDebugMask)}
        />
        <DebugToggleButton
          label="Show autofocus point"
          pressed={showLensFocusDebugPoint}
          onClick={() => setShowLensFocusDebugPoint(!showLensFocusDebugPoint)}
        />
        <DebugToggleButton
          label="Show projection mesh"
          pressed={showProjectionDebugMesh}
          onClick={() => setShowProjectionDebugMesh(!showProjectionDebugMesh)}
        />
      </div>

      <div className="rounded-xl border border-stone-800 bg-stone-900/90 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-stone-400">
          Asset source
        </p>
        <p className="mt-2 text-sm text-stone-200">{debugAssetName ?? 'No asset selected'}</p>
        <p className="mt-1 break-all text-xs text-stone-500">
          {debugAssetSourcePath ?? 'Select a placed asset or active browser asset from the dungeon pack.'}
        </p>
        <a
          href={debugAssetSourceLink ?? undefined}
          aria-disabled={!debugAssetSourceLink}
          className={`mt-3 inline-flex w-full items-center justify-center rounded-xl border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] transition ${
            debugAssetSourceLink
              ? 'border-sky-300/25 bg-sky-500/10 text-sky-200 hover:border-sky-300/40 hover:bg-sky-500/15'
              : 'pointer-events-none border-stone-800 bg-stone-950/60 text-stone-500'
          }`}
        >
          Open in VS Code
        </a>
      </div>
    </aside>
  )
}

function DebugToggleButton({
  label,
  pressed,
  onClick,
}: {
  label: string
  pressed: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
        pressed
          ? 'border-emerald-400/45 bg-emerald-400/12 text-emerald-200'
          : 'border-stone-700 bg-stone-900/90 text-stone-300 hover:border-stone-600 hover:bg-stone-800'
      }`}
    >
      <span>{label}</span>
      <span className="text-xs uppercase tracking-[0.22em]">{pressed ? 'On' : 'Off'}</span>
    </button>
  )
}
