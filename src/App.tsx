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
import { LayerPanel } from './components/editor/LayerPanel'
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
import { RotateCcw } from 'lucide-react'
import { RendererErrorBoundary } from './components/RendererErrorBoundary'
import { WebGpuRequiredNotice } from './components/WebGpuRequiredNotice'
import { getWebGpuSupportMessage, isWebGpuSupported } from './rendering/webgpuSupport'

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

function RightPanel() {
  const tool = useDungeonStore((state) => state.tool)
  const mapMode = useDungeonStore((state) => state.mapMode)
  return (
    <aside data-testid="editor-right-panel" className="flex h-full flex-col overflow-hidden border-l border-stone-800/80 bg-stone-950/85 backdrop-blur">
      {/* Scene graph — always visible at the top */}
      <div className="shrink-0 border-b border-stone-800/60 p-5">
        <ScenePanel />
      </div>

      {/* Tool-specific panel */}
      <div className="flex-1 overflow-y-auto p-5">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/75">
          {tool === 'play'
            ? 'Play'
            : tool === 'select'
              ? 'Select'
              : tool === 'move'
                ? 'Settings'
                : tool === 'room'
                  ? mapMode === 'outdoor' ? 'Terrain' : 'Room'
                  : tool === 'character'
                    ? 'Characters'
                    : 'Assets'}
        </p>
        {tool === 'play' && null}
        {tool === 'select' && <SelectToolPanel />}
        {tool === 'move' && <MoveToolPanel />}
        {tool === 'room' && <RoomToolPanel />}
        {tool === 'character' && <CharacterToolPanel />}
        {tool === 'prop' && <PropToolPanel />}
      </div>

      {/* Layers — always visible at the bottom */}
      <div className="shrink-0 border-t border-stone-800/60 p-5 flex flex-col gap-6">
        <LayerPanel />
      </div>
    </aside>
  )
}

function App() {
  const tool = useDungeonStore((state) => state.tool)
  const mapMode = useDungeonStore((state) => state.mapMode)
  const roomEditMode = useDungeonStore((state) => state.roomEditMode)
  const outdoorBrushMode = useDungeonStore((state) => state.outdoorBrushMode)
  const isPlayMode = tool === 'play'
  const [debugPanelOpen, setDebugPanelOpen] = useState(false)
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
      ? 'Application settings and performance controls'
        : tool === 'room'
          ? roomEditMode === 'rooms'
            ? mapMode === 'outdoor'
              ? outdoorBrushMode === 'ground-texture'
                ? 'Left-drag to paint ground texture · right-drag to erase texture paint'
                : 'Left-drag to paint terrain surroundings · right-drag to erase surrounding areas'
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
          <EditorToolbar />
        </div>

        {/* Canvas + right panel */}
        <div className="flex flex-1 overflow-hidden">
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

            <CameraDropdown />

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
                      ? 'Settings'
                      : tool === 'character'
                        ? 'Characters'
                      : tool === 'room'
                        ? mapMode === 'outdoor' ? 'Terrain' : 'Room'
                        : 'Assets'}
              </p>
              <p className="mt-1.5 text-xs text-stone-400">{toolHint}</p>
            </div>

            {debugPanelOpen && (
              <DebugVisibilityPanel
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

            {webGpuSupported && (
              <Suspense fallback={null}>
                <FpsOverlay />
              </Suspense>
            )}
          </section>

          {/* Right panel */}
          {!isPlayMode && (
            <div className="w-[22rem] shrink-0">
              <RightPanel />
            </div>
          )}
        </div>
      </div>
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
      className="absolute right-4 top-20 z-20 flex w-72 flex-col gap-4 rounded-2xl border border-emerald-400/25 bg-stone-950/92 p-4 shadow-2xl backdrop-blur"
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
