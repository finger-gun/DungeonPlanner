import { getContentPackAssetById, getContentPackAssetsByCategory } from '../../content-packs/registry'
import {
  useDungeonStore,
  type OutdoorBrushMode,
  type OutdoorTerrainDensity,
  type OutdoorTerrainSculptMode,
  type OutdoorTerrainType,
  type RoomEditMode,
} from '../../store/useDungeonStore'
import {
  OUTDOOR_TERRAIN_STYLES,
  type OutdoorTerrainStyle as TerrainStyleId,
} from '../../store/outdoorTerrainStyles'
import { AssetCatalog } from './AssetCatalog'
import { RoomPanel } from './RoomPanel'

const floorAssets = getContentPackAssetsByCategory('floor')
const wallAssets = getContentPackAssetsByCategory('wall')

const ROOM_EDIT_MODES: Array<{ id: RoomEditMode; label: string }> = [
  { id: 'rooms', label: 'Rooms' },
  { id: 'walls', label: 'Walls' },
  { id: 'floor-variants', label: 'Floor' },
  { id: 'wall-variants', label: 'Wall Variants' },
]

const TERRAIN_TYPES: Array<{ id: OutdoorTerrainType; label: string }> = [
  { id: 'mixed', label: 'Mixed Forest' },
  { id: 'rocks', label: 'Rocks' },
  { id: 'dead-forest', label: 'Dead Forest' },
]

const TERRAIN_DENSITIES: Array<{ id: OutdoorTerrainDensity; label: string }> = [
  { id: 'sparse', label: 'Sparse' },
  { id: 'medium', label: 'Medium' },
  { id: 'dense', label: 'Dense' },
]

const OUTDOOR_BRUSH_MODES: Array<{ id: OutdoorBrushMode; label: string }> = [
  { id: 'surroundings', label: 'Surroundings' },
  { id: 'terrain-sculpt', label: 'Terrain Sculpt' },
  { id: 'terrain-style', label: 'Terrain Style Paint' },
]

const OUTDOOR_SCULPT_MODES: Array<{ id: OutdoorTerrainSculptMode; label: string }> = [
  { id: 'raise', label: 'Raise' },
  { id: 'lower', label: 'Lower' },
]

const OUTDOOR_TERRAIN_STYLE_OPTIONS: Array<{ id: TerrainStyleId; label: string }> = OUTDOOR_TERRAIN_STYLES.map((style) => ({
  id: style,
  label: style.replace('Color', 'Color '),
}))

export function RoomToolPanel() {
  const mapMode = useDungeonStore((state) => state.mapMode)
  const roomEditMode = useDungeonStore((state) => state.roomEditMode)
  const surfaceBrushAssetIds = useDungeonStore((state) => state.surfaceBrushAssetIds)
  const outdoorTerrainDensity = useDungeonStore((state) => state.outdoorTerrainDensity)
  const outdoorTerrainType = useDungeonStore((state) => state.outdoorTerrainType)
  const outdoorOverpaintRegenerate = useDungeonStore((state) => state.outdoorOverpaintRegenerate)
  const outdoorBrushMode = useDungeonStore((state) => state.outdoorBrushMode)
  const outdoorTerrainSculptMode = useDungeonStore((state) => state.outdoorTerrainSculptMode)
  const defaultOutdoorTerrainStyle = useDungeonStore((state) => state.defaultOutdoorTerrainStyle)
  const outdoorTerrainStyleBrush = useDungeonStore((state) => state.outdoorTerrainStyleBrush)
  const setRoomEditMode = useDungeonStore((state) => state.setRoomEditMode)
  const setSurfaceBrushAsset = useDungeonStore((state) => state.setSurfaceBrushAsset)
  const setOutdoorTerrainDensity = useDungeonStore((state) => state.setOutdoorTerrainDensity)
  const setOutdoorTerrainType = useDungeonStore((state) => state.setOutdoorTerrainType)
  const setOutdoorOverpaintRegenerate = useDungeonStore((state) => state.setOutdoorOverpaintRegenerate)
  const setOutdoorBrushMode = useDungeonStore((state) => state.setOutdoorBrushMode)
  const setOutdoorTerrainSculptMode = useDungeonStore((state) => state.setOutdoorTerrainSculptMode)
  const setDefaultOutdoorTerrainStyle = useDungeonStore((state) => state.setDefaultOutdoorTerrainStyle)
  const setOutdoorTerrainStyleBrush = useDungeonStore((state) => state.setOutdoorTerrainStyleBrush)

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
          {mapMode === 'outdoor' ? 'Terrain Mode' : 'Room Tools'}
        </p>
        <div className={`grid gap-2 ${mapMode === 'outdoor' ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {ROOM_EDIT_MODES.map((mode) => {
            if (mapMode === 'outdoor' && mode.id !== 'rooms') {
              return null
            }

            const active = roomEditMode === mode.id
            return (
              <button
                key={mode.id}
                type="button"
                aria-pressed={active}
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
          <p className="font-medium text-stone-300">{mapMode === 'outdoor' ? 'Surrounding Paint Brush' : 'Room Tool'}</p>
          <p className="mt-1 text-xs">
            {mapMode === 'outdoor'
              ? outdoorBrushMode === 'terrain-style'
                ? 'Left-drag to paint terrain styles. Right-drag to reset painted cells back to the map default style.'
                : outdoorBrushMode === 'terrain-sculpt'
                  ? 'Left-drag raises stepped terrain. Right-drag lowers stepped terrain into pits and trenches.'
                  : 'Left-drag to paint terrain surroundings. Right-drag to erase. Painted areas auto-place terrain props and remain inaccessible.'
              : 'Left-drag to paint rooms. Right-drag to erase.'}
          </p>
          {mapMode === 'outdoor' ? (
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="mb-1 uppercase tracking-[0.2em] text-stone-500">Brush Mode</p>
                <div className="grid grid-cols-2 gap-2">
                  {OUTDOOR_BRUSH_MODES.map((mode) => {
                    const active = outdoorBrushMode === mode.id
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setOutdoorBrushMode(mode.id)}
                        className={`rounded-xl border px-2 py-1.5 transition ${
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
              </div>
              {outdoorBrushMode === 'terrain-style' ? (
                <div>
                  <p className="mb-1 uppercase tracking-[0.2em] text-stone-500">Terrain Style</p>
                  <div className="grid grid-cols-2 gap-2">
                    {OUTDOOR_TERRAIN_STYLE_OPTIONS.map((texture) => {
                      const active = outdoorTerrainStyleBrush === texture.id
                      return (
                        <button
                          key={texture.id}
                          type="button"
                          onClick={() => setOutdoorTerrainStyleBrush(texture.id)}
                          className={`rounded-xl border px-2 py-1.5 transition ${
                            active
                              ? 'border-teal-300/35 bg-teal-400/10 text-teal-200'
                              : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                          }`}
                        >
                          {texture.label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mb-1 mt-3 uppercase tracking-[0.2em] text-stone-500">Map Default</p>
                  <div className="grid grid-cols-2 gap-2">
                    {OUTDOOR_TERRAIN_STYLE_OPTIONS.map((terrainStyle) => {
                      const active = defaultOutdoorTerrainStyle === terrainStyle.id
                      return (
                        <button
                          key={`default-${terrainStyle.id}`}
                          type="button"
                          onClick={() => setDefaultOutdoorTerrainStyle(terrainStyle.id)}
                          className={`rounded-xl border px-2 py-1.5 transition ${
                            active
                              ? 'border-teal-300/35 bg-teal-400/10 text-teal-200'
                              : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                          }`}
                        >
                          {terrainStyle.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : outdoorBrushMode === 'terrain-sculpt' ? (
                <div>
                  <p className="mb-1 uppercase tracking-[0.2em] text-stone-500">Sculpt Direction</p>
                  <div className="grid grid-cols-2 gap-2">
                    {OUTDOOR_SCULPT_MODES.map((sculptMode) => {
                      const active = outdoorTerrainSculptMode === sculptMode.id
                      return (
                        <button
                          key={sculptMode.id}
                          type="button"
                          onClick={() => setOutdoorTerrainSculptMode(sculptMode.id)}
                          className={`rounded-xl border px-2 py-1.5 transition ${
                            active
                              ? 'border-teal-300/35 bg-teal-400/10 text-teal-200'
                              : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                          }`}
                        >
                          {sculptMode.label}
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-2 text-stone-500">
                    Each sculpt stroke changes the selected cells by one stepped terrain level and builds cliffs around raised plateaus and lowered pits.
                  </p>
                </div>
              ) : (
                <>
                  <div>
                    <p className="mb-1 uppercase tracking-[0.2em] text-stone-500">Terrain Type</p>
                    <div className="grid grid-cols-1 gap-2">
                      {TERRAIN_TYPES.map((terrainType) => {
                        const active = outdoorTerrainType === terrainType.id
                        return (
                          <button
                            key={terrainType.id}
                            type="button"
                            onClick={() => setOutdoorTerrainType(terrainType.id)}
                            className={`rounded-xl border px-2 py-1.5 transition ${
                              active
                                ? 'border-teal-300/35 bg-teal-400/10 text-teal-200'
                                : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                            }`}
                          >
                            {terrainType.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 uppercase tracking-[0.2em] text-stone-500">
                      {TERRAIN_TYPES.find((type) => type.id === outdoorTerrainType)?.label} Settings
                    </p>
                    <p className="mb-2 text-stone-500">Density</p>
                    <div className="grid grid-cols-3 gap-2">
                      {TERRAIN_DENSITIES.map((density) => {
                        const active = outdoorTerrainDensity === density.id
                        return (
                          <button
                            key={density.id}
                            type="button"
                            onClick={() => setOutdoorTerrainDensity(density.id)}
                            className={`rounded-xl border px-2 py-1.5 transition ${
                              active
                                ? 'border-teal-300/35 bg-teal-400/10 text-teal-200'
                                : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
                            }`}
                          >
                            {density.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 text-stone-300">
                    <input
                      type="checkbox"
                      checked={outdoorOverpaintRegenerate}
                      onChange={(event) => setOutdoorOverpaintRegenerate(event.target.checked)}
                      className="h-4 w-4 rounded border-stone-700 bg-stone-950 text-teal-400"
                    />
                    Regenerate on overpaint
                  </label>
                </>
              )}
            </div>
          ) : (
            <p className="text-xs">Click room to select, drag room edges to resize, or paint empty space to build new rooms.</p>
          )}
        </section>
      ) : roomEditMode === 'walls' ? (
        <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-sm leading-6 text-stone-400">
          <p className="font-medium text-stone-300">Wall Tool</p>
          <p className="mt-1 text-xs">Click and drag to preview a locked wall run. Release to add or remove the whole run.</p>
          <p className="text-xs">Left-drag adds inner wall runs. Right-drag removes inner or shared wall runs.</p>
          <p className="text-xs">This mode is for structure editing in top-down view, not asset placement.</p>
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

      {mapMode !== 'outdoor' && <RoomPanel />}
    </div>
  )
}
