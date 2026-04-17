import { getContentPackAssetById, getContentPackAssetsByCategory } from '../../content-packs/registry'
import { useDungeonStore, type RoomEditMode } from '../../store/useDungeonStore'
import { AssetCatalog } from './AssetCatalog'
import { RoomPanel } from './RoomPanel'

const floorAssets = getContentPackAssetsByCategory('floor')
const wallAssets = getContentPackAssetsByCategory('wall')

const ROOM_EDIT_MODES: Array<{ id: RoomEditMode; label: string }> = [
  { id: 'rooms', label: 'Rooms' },
  { id: 'floor-variants', label: 'Floor' },
  { id: 'wall-variants', label: 'Walls' },
]

export function RoomToolPanel() {
  const roomEditMode = useDungeonStore((state) => state.roomEditMode)
  const surfaceBrushAssetIds = useDungeonStore((state) => state.surfaceBrushAssetIds)
  const setRoomEditMode = useDungeonStore((state) => state.setRoomEditMode)
  const setSurfaceBrushAsset = useDungeonStore((state) => state.setSurfaceBrushAsset)

  const selectedFloorAsset = surfaceBrushAssetIds.floor
    ? getContentPackAssetById(surfaceBrushAssetIds.floor)
    : null
  const selectedWallAsset = surfaceBrushAssetIds.wall
    ? getContentPackAssetById(surfaceBrushAssetIds.wall)
    : null

  return (
    <div className="space-y-5">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Surface Mode
        </p>
        <div className="grid grid-cols-3 gap-2">
          {ROOM_EDIT_MODES.map((mode) => {
            const active = roomEditMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setRoomEditMode(mode.id)}
                className={`rounded-2xl border px-3 py-2 text-xs font-medium uppercase tracking-[0.2em] transition ${
                  active
                    ? 'border-teal-300/35 bg-teal-400/10 text-teal-200'
                    : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                }`}
              >
                {mode.label}
              </button>
            )
          })}
        </div>
      </section>

      {roomEditMode === 'rooms' ? (
        <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-sm leading-6 text-stone-400">
          <p className="font-medium text-stone-300">Room Tool</p>
          <p className="mt-1 text-xs">Left-drag to paint rooms. Right-drag to erase.</p>
        </section>
      ) : (
        <>
          <AssetCatalog
            title={roomEditMode === 'floor-variants' ? 'Floor Variants' : 'Wall Variants'}
            sections={[{
              title: roomEditMode === 'floor-variants' ? 'Floor Assets' : 'Wall Assets',
              assets: roomEditMode === 'floor-variants' ? floorAssets : wallAssets,
            }]}
            isSelected={(asset) =>
              roomEditMode === 'floor-variants'
                ? surfaceBrushAssetIds.floor === asset.id
                : surfaceBrushAssetIds.wall === asset.id
            }
            onSelect={(asset) =>
              setSurfaceBrushAsset(roomEditMode === 'floor-variants' ? 'floor' : 'wall', asset.id)
            }
          />

          <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-xs leading-6 text-stone-400">
            <p className="font-medium text-stone-300">
              {roomEditMode === 'floor-variants' ? 'Floor Variant Brush' : 'Wall Variant Brush'}
            </p>
            <p className="mt-1">
              {roomEditMode === 'floor-variants'
                ? 'Click a painted tile to apply the selected floor asset. Right-click to clear the tile override.'
                : 'Click a boundary wall segment to apply the selected wall asset. Right-click to clear the wall override.'}
            </p>
            <p>
              Current brush:{' '}
              <span className="text-stone-200">
                {roomEditMode === 'floor-variants'
                  ? (selectedFloorAsset?.name ?? 'None')
                  : (selectedWallAsset?.name ?? 'None')}
              </span>
            </p>
          </section>
        </>
      )}

      <RoomPanel />
    </div>
  )
}
