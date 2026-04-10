import { Suspense, lazy, useEffect, useEffectEvent } from 'react'
import { getDefaultAssetIdByCategory } from './content-packs/registry'
import { EditorToolbar } from './components/editor/EditorToolbar'
import { MoveToolPanel } from './components/editor/MoveToolPanel'
import { RoomToolPanel } from './components/editor/RoomToolPanel'
import { PropToolPanel } from './components/editor/PropToolPanel'
import { OpeningToolPanel } from './components/editor/OpeningToolPanel'
import { LayerPanel } from './components/editor/LayerPanel'
import { PostProcessingPanel } from './components/editor/PostProcessingPanel'
import { ScenePanel } from './components/editor/ScenePanel'
import { useDungeonStore } from './store/useDungeonStore'
import {
  cellToWorldPosition,
  getCellKey,
  getRectangleCells,
  type GridCell,
} from './hooks/useSnapToGrid'

const Scene = lazy(() =>
  import('./components/canvas/Scene').then((module) => ({
    default: module.Scene,
  })),
)

function RightPanel() {
  const tool = useDungeonStore((state) => state.tool)
  return (
    <aside className="flex h-full flex-col overflow-hidden border-l border-stone-800/80 bg-stone-950/85 backdrop-blur">
      {/* Scene graph — always visible at the top */}
      <div className="shrink-0 border-b border-stone-800/60 p-5">
        <ScenePanel />
      </div>

      {/* Tool-specific panel */}
      <div className="flex-1 overflow-y-auto p-5">
        <p className="mb-5 text-xs font-semibold uppercase tracking-[0.32em] text-sky-200/75">
          {tool === 'move' ? 'Camera' : tool === 'room' ? 'Room' : tool === 'opening' ? 'Openings' : 'Props'}
        </p>
        {tool === 'move' && <MoveToolPanel />}
        {tool === 'room' && <RoomToolPanel />}
        {tool === 'prop' && <PropToolPanel />}
        {tool === 'opening' && <OpeningToolPanel />}
      </div>

      {/* Layers + Lens — always visible at the bottom */}
      <div className="shrink-0 border-t border-stone-800/60 p-5 flex flex-col gap-6">
        <LayerPanel />
        <PostProcessingPanel />
      </div>
    </aside>
  )
}

function App() {
  const tool = useDungeonStore((state) => state.tool)
  const propCount = useDungeonStore(
    (state) => Object.keys(state.placedObjects).length,
  )
  const paintedCellCount = useDungeonStore(
    (state) => Object.keys(state.paintedCells).length,
  )

  const onWindowKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const state = useDungeonStore.getState()

    if (
      (event.key === 'Delete' || event.key === 'Backspace') &&
      state.selection
    ) {
      event.preventDefault()
      state.removeSelectedObject()
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
        if (tool === 'prop') {
          const position = cellToWorldPosition(cell)
          const assetId =
            state.selectedAssetIds.prop ?? getDefaultAssetIdByCategory('prop')

          return state.placeObject({
            type: 'prop',
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
        if (tool === 'prop') {
          useDungeonStore.getState().removeObjectAtCell(getCellKey(cell))
          return
        }

        useDungeonStore.getState().eraseCells([cell])
      },
      reset: () => {
        useDungeonStore.getState().reset()
      },
    }

    return () => {
      delete window.__DUNGEON_DEBUG__
    }
  }, [])

  const toolHint =
    tool === 'move'
      ? 'WASD / arrows to pan · Q/E to rotate'
      : tool === 'room'
        ? 'Left-drag to build · right-drag to erase'
        : 'Click to place · R to rotate · right-click to remove · Alt+click to inspect'

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
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
              <Scene />
            </Suspense>

            {/* Tool hint overlay */}
            <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-amber-300/15 bg-stone-950/78 px-4 py-3 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/80">
                {tool === 'move' ? 'Move' : tool === 'room' ? 'Room' : 'Prop'}
              </p>
              <p className="mt-1.5 text-xs text-stone-400">{toolHint}</p>
            </div>

            {/* Stats counter */}
            <div
              data-testid="placement-counter"
              className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-teal-300/20 bg-stone-950/75 px-4 py-2 text-xs uppercase tracking-[0.25em] text-teal-200/85 backdrop-blur"
            >
              {formatCount(paintedCellCount, 'room cell')} •{' '}
              {formatCount(propCount, 'prop')}
            </div>
          </section>

          {/* Right panel */}
          <div className="w-[22rem] shrink-0">
            <RightPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App

function formatCount(count: number, singular: string) {
  return `${count} ${count === 1 ? singular : `${singular}s`}`
}
