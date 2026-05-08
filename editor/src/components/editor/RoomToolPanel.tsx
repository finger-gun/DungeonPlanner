import { useEffect, useMemo } from 'react'
import { getContentPackAssetById, getContentPackRoomSets } from '../../content-packs/registry'
import {
  useDungeonStore,
  type OutdoorBrushMode,
  type OutdoorTerrainDensity,
  type OutdoorTerrainSculptMode,
  type OutdoorTerrainType,
} from '../../store/useDungeonStore'
import {
  OUTDOOR_TERRAIN_STYLES,
  getOutdoorTerrainStyleLabel,
  type OutdoorTerrainStyle as TerrainStyleId,
} from '../../store/outdoorTerrainStyles'
import { CompactPillButton } from './CompactPillButton'

const ROOM_SET_CONTENT_PACK_ID = 'dungeon'

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
  { id: 'surroundings', label: 'Nature' },
  { id: 'terrain-sculpt', label: 'Sculpt' },
  { id: 'terrain-style', label: 'Style' },
]

const OUTDOOR_SCULPT_MODES: Array<{ id: OutdoorTerrainSculptMode; label: string }> = [
  { id: 'raise', label: 'Raise' },
  { id: 'lower', label: 'Lower' },
]

const OUTDOOR_TERRAIN_STYLE_OPTIONS: Array<{ id: TerrainStyleId; label: string }> = OUTDOOR_TERRAIN_STYLES.map((style) => ({
  id: style,
  label: getOutdoorTerrainStyleLabel(style),
}))

export function RoomToolPanel() {
  const mapMode = useDungeonStore((state) => state.mapMode)
  const roomEditMode = useDungeonStore((state) => state.roomEditMode)
  const roomPaintMode = useDungeonStore((state) => state.roomPaintMode)
  const activeRoomSetId = useDungeonStore((state) => state.activeRoomSetId)
  const outdoorTerrainDensity = useDungeonStore((state) => state.outdoorTerrainDensity)
  const outdoorTerrainType = useDungeonStore((state) => state.outdoorTerrainType)
  const outdoorOverpaintRegenerate = useDungeonStore((state) => state.outdoorOverpaintRegenerate)
  const outdoorBrushMode = useDungeonStore((state) => state.outdoorBrushMode)
  const outdoorTerrainSculptMode = useDungeonStore((state) => state.outdoorTerrainSculptMode)
  const defaultOutdoorTerrainStyle = useDungeonStore((state) => state.defaultOutdoorTerrainStyle)
  const outdoorTerrainStyleBrush = useDungeonStore((state) => state.outdoorTerrainStyleBrush)
  const setRoomEditMode = useDungeonStore((state) => state.setRoomEditMode)
  const setActiveRoomSetId = useDungeonStore((state) => state.setActiveRoomSetId)
  const setOutdoorTerrainDensity = useDungeonStore((state) => state.setOutdoorTerrainDensity)
  const setOutdoorTerrainType = useDungeonStore((state) => state.setOutdoorTerrainType)
  const setOutdoorOverpaintRegenerate = useDungeonStore((state) => state.setOutdoorOverpaintRegenerate)
  const setOutdoorBrushMode = useDungeonStore((state) => state.setOutdoorBrushMode)
  const setOutdoorTerrainSculptMode = useDungeonStore((state) => state.setOutdoorTerrainSculptMode)
  const setDefaultOutdoorTerrainStyle = useDungeonStore((state) => state.setDefaultOutdoorTerrainStyle)
  const setOutdoorTerrainStyleBrush = useDungeonStore((state) => state.setOutdoorTerrainStyleBrush)
  const roomSets = useMemo(
    () => getContentPackRoomSets(ROOM_SET_CONTENT_PACK_ID).map(buildRoomSetPreview),
    [],
  )
  const showRoomSetPicker = mapMode !== 'outdoor'
    && (
      (roomEditMode === 'rooms' && (roomPaintMode === 'area' || roomPaintMode === 'paint'))
      || roomEditMode === 'walls'
    )

  useEffect(() => {
    if (roomEditMode === 'floor-variants' || roomEditMode === 'wall-variants') {
      setRoomEditMode('rooms')
    }
  }, [roomEditMode, setRoomEditMode])

  return (
    <div className="space-y-5">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          {mapMode === 'outdoor' ? 'Terrain Tools' : 'Room Tools'}
        </p>
      </section>

      {roomEditMode === 'rooms' ? (
        <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-sm leading-6 text-stone-400">
          <p className="font-medium text-stone-300">
            {mapMode === 'outdoor'
              ? outdoorBrushMode === 'terrain-style'
                ? 'Style Brush'
                : outdoorBrushMode === 'terrain-sculpt'
                  ? 'Sculpt Tool'
                  : 'Nature Brush'
              : roomPaintMode === 'paint'
                ? 'Paint Tool'
                : roomPaintMode === 'resize'
                  ? 'Resize Tool'
                  : 'Area Tool'}
          </p>
          <p className="mt-1 text-xs">
            {mapMode === 'outdoor'
              ? outdoorBrushMode === 'terrain-style'
                ? 'Left-drag to paint terrain styles. Right-drag resets painted cells back to the map default.'
                : outdoorBrushMode === 'terrain-sculpt'
                  ? 'Left-drag raises stepped terrain. Right-drag lowers stepped terrain into pits and trenches.'
                  : 'Left-drag to paint nature. Right-drag to erase. Painted areas auto-place nature props and remain inaccessible.'
              : roomPaintMode === 'paint'
                ? 'Click and hold to paint rooms cell-by-cell. Release to commit the stroke. Right-drag erases.'
                : roomPaintMode === 'resize'
                  ? 'Click a room to show resize handles. Drag edges or corners to reshape it, or press Delete to remove the selected room.'
                  : 'Click and drag to draw a rectangular room selection. Release to commit. Right-drag erases.'}
          </p>
          {mapMode === 'outdoor' ? (
            <div className="mt-4 space-y-3 text-xs">
              <div>
                <p className="mb-1 uppercase tracking-[0.2em] text-stone-500">Tool</p>
                <div className="flex flex-wrap gap-1.5">
                  {OUTDOOR_BRUSH_MODES.map((mode) => {
                    const active = outdoorBrushMode === mode.id
                    return (
                      <CompactPillButton
                        key={mode.id}
                        type="button"
                        onClick={() => setOutdoorBrushMode(mode.id)}
                        active={active}
                        tone="teal"
                        size="xs"
                      >
                        {mode.label}
                      </CompactPillButton>
                    )
                  })}
                </div>
              </div>
              {outdoorBrushMode === 'terrain-style' ? (
                <div>
                  <p className="mb-1 uppercase tracking-[0.2em] text-stone-500">Style</p>
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
                  <div className="flex flex-wrap gap-1.5">
                    {OUTDOOR_SCULPT_MODES.map((sculptMode) => {
                      const active = outdoorTerrainSculptMode === sculptMode.id
                      return (
                        <CompactPillButton
                          key={sculptMode.id}
                          type="button"
                          onClick={() => setOutdoorTerrainSculptMode(sculptMode.id)}
                          active={active}
                          tone="teal"
                          size="xs"
                        >
                          {sculptMode.label}
                        </CompactPillButton>
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
                    <p className="mb-1 uppercase tracking-[0.2em] text-stone-500">Nature Style</p>
                    <div className="grid grid-cols-2 gap-2">
                      {OUTDOOR_TERRAIN_STYLE_OPTIONS.map((terrainStyle) => {
                        const active = outdoorTerrainStyleBrush === terrainStyle.id
                        return (
                          <button
                            key={`surroundings-${terrainStyle.id}`}
                            type="button"
                            onClick={() => setOutdoorTerrainStyleBrush(terrainStyle.id)}
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
                  <div>
                    <p className="mb-1 uppercase tracking-[0.2em] text-stone-500">Terrain Type</p>
                      <div className="flex flex-wrap gap-1.5">
                        {TERRAIN_TYPES.map((terrainType) => {
                        const active = outdoorTerrainType === terrainType.id
                        return (
                          <CompactPillButton
                            key={terrainType.id}
                            type="button"
                            onClick={() => setOutdoorTerrainType(terrainType.id)}
                            active={active}
                            tone="teal"
                            size="xs"
                          >
                            {terrainType.label}
                          </CompactPillButton>
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="mb-1 uppercase tracking-[0.2em] text-stone-500">
                      {TERRAIN_TYPES.find((type) => type.id === outdoorTerrainType)?.label} Settings
                    </p>
                    <p className="mb-2 text-stone-500">Density</p>
                    <div className="flex flex-wrap gap-1.5">
                      {TERRAIN_DENSITIES.map((density) => {
                        const active = outdoorTerrainDensity === density.id
                        return (
                          <CompactPillButton
                            key={density.id}
                            type="button"
                            onClick={() => setOutdoorTerrainDensity(density.id)}
                            active={active}
                            tone="teal"
                            size="xs"
                          >
                            {density.label}
                          </CompactPillButton>
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
            <>
              <p className="text-xs">
                {roomPaintMode === 'paint'
                  ? 'Best for freeform room shapes and corridors.'
                  : roomPaintMode === 'resize'
                    ? 'Best for adjusting existing rooms after they are placed.'
                    : 'Best for fast rectangular rooms.'}
              </p>
              {showRoomSetPicker ? (
                <RoomSetPicker
                  roomSets={roomSets}
                  activeRoomSetId={activeRoomSetId}
                  onSelect={setActiveRoomSetId}
                />
              ) : null}
            </>
          )}
        </section>
      ) : roomEditMode === 'walls' ? (
        <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-sm leading-6 text-stone-400">
          <p className="font-medium text-stone-300">Inner walls</p>
          <p className="mt-1 text-xs">Click and drag to preview a locked wall run. Release to add or remove the whole run.</p>
          <p className="text-xs">Left-drag adds inner wall runs. Right-drag removes inner or shared wall runs.</p>
          <p className="text-xs">This mode is for structure editing in top-down view, not asset placement.</p>
          {showRoomSetPicker ? (
            <RoomSetPicker
              roomSets={roomSets}
              activeRoomSetId={activeRoomSetId}
              onSelect={setActiveRoomSetId}
            />
          ) : null}
        </section>
      ) : (
        <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-sm leading-6 text-stone-400">
          <p className="font-medium text-stone-300">Room Tool</p>
          <p className="mt-1 text-xs">Left-drag to paint rooms. Right-drag to erase.</p>
          <p className="text-xs">Use Props for floor and wall variant brushes.</p>
        </section>
      )}

    </div>
  )
}

function RoomSetPicker({
  roomSets,
  activeRoomSetId,
  onSelect,
}: {
  roomSets: Array<ReturnType<typeof buildRoomSetPreview>>
  activeRoomSetId: string
  onSelect: (roomSetId: string) => void
}) {
  if (roomSets.length === 0) {
    return null
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">Set</p>
      <div className="grid grid-cols-2 gap-2">
        {roomSets.map((roomSet) => {
          const active = roomSet.id === activeRoomSetId
          return (
            <button
              key={roomSet.id}
              type="button"
              onClick={() => onSelect(roomSet.id)}
              className={`overflow-hidden rounded-2xl border text-left transition ${
                active
                  ? 'border-amber-300/40 bg-amber-400/10 text-amber-100'
                  : 'border-stone-800 bg-stone-950/60 text-stone-300 hover:border-stone-700 hover:text-stone-100'
              }`}
            >
              {roomSet.previewAsset?.thumbnailUrl ? (
                <img
                  src={roomSet.previewAsset.thumbnailUrl}
                  alt=""
                  className="h-20 w-full border-b border-inherit object-cover"
                />
              ) : (
                <div className="h-20 w-full border-b border-inherit bg-stone-900/80" />
              )}
              <div className="px-3 py-2 text-xs font-medium">{roomSet.name}</div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function buildRoomSetPreview(roomSet: ReturnType<typeof getContentPackRoomSets>[number]) {
  return {
    ...roomSet,
    previewAsset: getContentPackAssetById(roomSet.previewWallAssetId),
  }
}
