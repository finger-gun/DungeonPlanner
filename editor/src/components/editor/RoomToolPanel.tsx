import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, Search } from 'lucide-react'
import { getContentPackWallStyles } from '../../content-packs/registry'
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
const WALLS_MODE_LABEL = 'Spline walls'

const WALL_STYLE_TAG_LABELS: Record<string, string> = {
  stone: 'Stone',
  wood: 'Wood',
  metal: 'Metal',
  plaster: 'Plaster',
  organic: 'Organic',
  ice: 'Ice',
  lava: 'Lava',
  arcane: 'Arcane',
  ruined: 'Ruined',
  noble: 'Noble',
  cave: 'Cave',
}

const WALL_STYLE_TAG_ORDER = Object.keys(WALL_STYLE_TAG_LABELS)

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
  const selectedRoomId = useDungeonStore((state) => state.selectedRoomId)
  const activeInteriorWallStyleId = useDungeonStore((state) => state.activeInteriorWallStyleId)
  const activeExteriorWallStyleId = useDungeonStore((state) => state.activeExteriorWallStyleId)
  const outdoorTerrainDensity = useDungeonStore((state) => state.outdoorTerrainDensity)
  const outdoorTerrainType = useDungeonStore((state) => state.outdoorTerrainType)
  const outdoorOverpaintRegenerate = useDungeonStore((state) => state.outdoorOverpaintRegenerate)
  const outdoorBrushMode = useDungeonStore((state) => state.outdoorBrushMode)
  const outdoorTerrainSculptMode = useDungeonStore((state) => state.outdoorTerrainSculptMode)
  const defaultOutdoorTerrainStyle = useDungeonStore((state) => state.defaultOutdoorTerrainStyle)
  const outdoorTerrainStyleBrush = useDungeonStore((state) => state.outdoorTerrainStyleBrush)
  const setRoomEditMode = useDungeonStore((state) => state.setRoomEditMode)
  const setActiveInteriorWallStyleId = useDungeonStore((state) => state.setActiveInteriorWallStyleId)
  const setActiveExteriorWallStyleId = useDungeonStore((state) => state.setActiveExteriorWallStyleId)
  const setRoomBoundaryWallStyle = useDungeonStore((state) => state.setRoomBoundaryWallStyle)
  const setOutdoorTerrainDensity = useDungeonStore((state) => state.setOutdoorTerrainDensity)
  const setOutdoorTerrainType = useDungeonStore((state) => state.setOutdoorTerrainType)
  const setOutdoorOverpaintRegenerate = useDungeonStore((state) => state.setOutdoorOverpaintRegenerate)
  const setOutdoorBrushMode = useDungeonStore((state) => state.setOutdoorBrushMode)
  const setOutdoorTerrainSculptMode = useDungeonStore((state) => state.setOutdoorTerrainSculptMode)
  const setDefaultOutdoorTerrainStyle = useDungeonStore((state) => state.setDefaultOutdoorTerrainStyle)
  const setOutdoorTerrainStyleBrush = useDungeonStore((state) => state.setOutdoorTerrainStyleBrush)
  const wallStyles = useMemo(
    () => getContentPackWallStyles(ROOM_SET_CONTENT_PACK_ID).map(buildWallStylePreview),
    [],
  )
  const showWallStylePicker = mapMode !== 'outdoor' && (roomEditMode === 'rooms' || roomEditMode === 'walls')
  const handleSelectInteriorWallStyle = useCallback((wallStyleId: string) => {
    setActiveInteriorWallStyleId(wallStyleId)
    if (selectedRoomId) {
      setRoomBoundaryWallStyle(selectedRoomId, 'room-face', wallStyleId)
    }
  }, [selectedRoomId, setActiveInteriorWallStyleId, setRoomBoundaryWallStyle])
  const handleSelectExteriorWallStyle = useCallback((wallStyleId: string) => {
    setActiveExteriorWallStyleId(wallStyleId)
    if (selectedRoomId) {
      setRoomBoundaryWallStyle(selectedRoomId, 'exterior-face', wallStyleId)
    }
  }, [selectedRoomId, setActiveExteriorWallStyleId, setRoomBoundaryWallStyle])

  useEffect(() => {
    if (roomEditMode === 'floor-variants') {
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
                : 'Click and drag to draft a room footprint. Release to keep the blue edit anchors in-scene, drag corners to round them, hold Ctrl for diagonals, then Commit or Cancel.'}
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
                  : 'Best for drafting a room footprint before committing it.'}
              </p>
              {showWallStylePicker ? (
                <WallStyleControls
                  wallStyles={wallStyles}
                  activeInteriorWallStyleId={activeInteriorWallStyleId}
                  activeExteriorWallStyleId={activeExteriorWallStyleId}
                  onSelectInteriorWallStyle={handleSelectInteriorWallStyle}
                  onSelectExteriorWallStyle={handleSelectExteriorWallStyle}
                  selectedRoomActive={Boolean(selectedRoomId)}
                />
              ) : null}
            </>
          )}
        </section>
      ) : roomEditMode === 'walls' ? (
        <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-sm leading-6 text-stone-400">
          <p className="font-medium text-stone-300">{WALLS_MODE_LABEL}</p>
          <p className="mt-1 text-xs">
            Use the amber node handles to drag/select spline nodes, click blue split handles to insert new nodes, and press Delete or right-click a node to remove it.
          </p>
          {showWallStylePicker ? (
            <WallStyleControls
              wallStyles={wallStyles}
              activeInteriorWallStyleId={activeInteriorWallStyleId}
              activeExteriorWallStyleId={activeExteriorWallStyleId}
              onSelectInteriorWallStyle={handleSelectInteriorWallStyle}
              onSelectExteriorWallStyle={handleSelectExteriorWallStyle}
              selectedRoomActive={Boolean(selectedRoomId)}
            />
          ) : null}
        </section>
      ) : (
        <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-sm leading-6 text-stone-400">
          <p className="font-medium text-stone-300">Room Tool</p>
          <p className="mt-1 text-xs">Left-drag to paint rooms. Right-drag to erase.</p>
          <p className="text-xs">Use Props for floor brushes and openings.</p>
        </section>
      )}

    </div>
  )
}

function WallStyleControls({
  wallStyles,
  activeInteriorWallStyleId,
  activeExteriorWallStyleId,
  onSelectInteriorWallStyle,
  onSelectExteriorWallStyle,
  selectedRoomActive,
}: {
  wallStyles: Array<ReturnType<typeof buildWallStylePreview>>
  activeInteriorWallStyleId: string
  activeExteriorWallStyleId: string
  onSelectInteriorWallStyle: (wallStyleId: string) => void
  onSelectExteriorWallStyle: (wallStyleId: string) => void
  selectedRoomActive: boolean
}) {
  return (
    <div className="mt-4 space-y-4">
      {selectedRoomActive ? (
        <p className="text-xs text-stone-500">Changes apply to the selected room and stay active for new rooms.</p>
      ) : null}
      <WallStylePicker
        label="Interior Wall"
        wallStyles={wallStyles}
        activeWallStyleId={activeInteriorWallStyleId}
        onSelect={onSelectInteriorWallStyle}
      />
      <WallStylePicker
        label="Exterior Wall"
        wallStyles={wallStyles}
        activeWallStyleId={activeExteriorWallStyleId}
        onSelect={onSelectExteriorWallStyle}
      />
    </div>
  )
}

function WallStylePicker({
  label,
  wallStyles,
  activeWallStyleId,
  onSelect,
}: {
  label: string
  wallStyles: Array<ReturnType<typeof buildWallStylePreview>>
  activeWallStyleId: string
  onSelect: (wallStyleId: string) => void
}) {
  const [query, setQuery] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const [selectedFamilyKey, setSelectedFamilyKey] = useState<string | null>(null)
  const groups = useMemo(() => buildWallStyleGroups(wallStyles), [wallStyles])
  const availableTags = useMemo(() => {
    const tags = new Set<string>()
    for (const style of wallStyles) {
      for (const tag of style.tags) {
        tags.add(tag)
      }
    }
    return WALL_STYLE_TAG_ORDER.filter((tag) => tags.has(tag))
  }, [wallStyles])
  const filteredGroups = useMemo(
    () => filterWallStyleGroups(groups, query, activeTag),
    [activeTag, groups, query],
  )
  const activeGroup = groups.find((group) => group.styles.some((style) => style.id === activeWallStyleId))
  const selectedGroup =
    filteredGroups.find((group) => group.key === selectedFamilyKey)
    ?? filteredGroups.find((group) => group.key === activeGroup?.key)
    ?? filteredGroups[0]

  if (wallStyles.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">{label}</p>
        <span className="text-[0.65rem] font-medium text-stone-600">{wallStyles.length}</span>
      </div>
      <label className="flex h-8 items-center gap-2 rounded-lg border border-stone-800 bg-stone-950/70 px-2 text-stone-500 focus-within:border-amber-300/35 focus-within:text-amber-200">
        <Search aria-hidden="true" size={13} strokeWidth={2} />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search"
          aria-label={`${label} search`}
          className="min-w-0 flex-1 bg-transparent text-xs text-stone-200 outline-none placeholder:text-stone-600"
        />
      </label>
      {availableTags.length > 0 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            className={`shrink-0 rounded-md border px-2 py-1 text-[0.65rem] font-medium transition ${
              activeTag === null
                ? 'border-amber-300/40 bg-amber-400/10 text-amber-100'
                : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
            }`}
          >
            All
          </button>
          {availableTags.map((tag) => (
            <button
              key={`${label}-${tag}`}
              type="button"
              onClick={() => setActiveTag(tag)}
              className={`shrink-0 rounded-md border px-2 py-1 text-[0.65rem] font-medium transition ${
                activeTag === tag
                  ? 'border-amber-300/40 bg-amber-400/10 text-amber-100'
                  : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700 hover:text-stone-200'
              }`}
            >
              {WALL_STYLE_TAG_LABELS[tag] ?? tag}
            </button>
          ))}
        </div>
      ) : null}
      <div className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
        {filteredGroups.map((group) => {
          const active = group.styles.some((style) => style.id === activeWallStyleId)
          const representativeStyle = active
            ? group.styles.find((style) => style.id === activeWallStyleId) ?? group.representativeStyle
            : group.representativeStyle
          return (
            <button
              key={`${label}-${group.key}`}
              type="button"
              aria-label={`${label}: ${group.family}`}
              onClick={() => {
                setSelectedFamilyKey(group.key)
                onSelect(representativeStyle.id)
              }}
              className={`grid grid-cols-[2.75rem_minmax(0,1fr)_1rem] items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                active
                  ? 'border-amber-300/40 bg-amber-400/10 text-amber-100'
                  : 'border-stone-800 bg-stone-950/60 text-stone-300 hover:border-stone-700 hover:text-stone-100'
              }`}
            >
              <span className="block h-9 w-11 overflow-hidden rounded border border-stone-700/80 bg-stone-900">
                {representativeStyle.previewImageUrl ? (
                  <img
                    src={representativeStyle.previewImageUrl}
                    alt=""
                    loading="lazy"
                    data-testid={`${label}-${representativeStyle.id}-preview`}
                    className="h-full w-full object-cover"
                    draggable={false}
                  />
                ) : null}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-medium">{group.family}</span>
                {group.styles.length > 1 ? (
                  <span className="block truncate text-[0.65rem] text-stone-500">{group.styles.length} variants</span>
                ) : null}
              </span>
              {active ? <Check aria-hidden="true" size={13} strokeWidth={2} className="text-amber-200" /> : null}
            </button>
          )
        })}
      </div>
      {selectedGroup && selectedGroup.styles.length > 1 ? (
        <div className="space-y-2">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-stone-600">
            {selectedGroup.family}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {selectedGroup.styles.map((wallStyle) => {
              const active = wallStyle.id === activeWallStyleId
              return (
                <button
                  key={`${label}-${wallStyle.id}`}
                  type="button"
                  aria-label={`${label}: ${wallStyle.name}`}
                  onClick={() => onSelect(wallStyle.id)}
                  className={`grid grid-cols-[1.5rem_minmax(0,1fr)_0.75rem] items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left transition ${
                    active
                      ? 'border-amber-300/40 bg-amber-400/10 text-amber-100'
                      : 'border-stone-800 bg-stone-950/60 text-stone-300 hover:border-stone-700 hover:text-stone-100'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="block h-4 w-4 rounded border border-stone-700"
                    style={{ backgroundColor: wallStyle.swatchColor ?? '#78716c' }}
                  />
                  <span className="min-w-0 truncate text-[0.7rem] font-medium">
                    {wallStyle.variant ?? wallStyle.name}
                  </span>
                  {active ? <Check aria-hidden="true" size={12} strokeWidth={2} className="text-amber-200" /> : null}
                </button>
              )
            })}
          </div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <p className="rounded-lg border border-stone-800 bg-stone-950/60 px-3 py-2 text-xs text-stone-500">
          No wall styles match.
        </p>
      ) : null}
    </div>
  )
}

function buildWallStylePreview(wallStyle: ReturnType<typeof getContentPackWallStyles>[number]) {
  const browser = wallStyle.browser
  return {
    id: wallStyle.id,
    name: wallStyle.name,
    family: browser?.family ?? wallStyle.name,
    variant: browser?.variant ?? browser?.colorway,
    colorway: browser?.colorway,
    swatchColor: browser?.swatchColor,
    tags: [...(browser?.tags ?? [])],
    source: browser?.source,
    previewImageUrl:
      wallStyle.previewImageUrl
      ?? wallStyle.roomFace.material.textures.albedoUrl
      ?? wallStyle.exteriorFace.material.textures.albedoUrl
      ?? wallStyle.structuralCore.material.textures.albedoUrl,
  }
}

type WallStylePreview = ReturnType<typeof buildWallStylePreview>

type WallStyleGroup = {
  key: string
  family: string
  styles: WallStylePreview[]
  representativeStyle: WallStylePreview
  searchText: string
}

function buildWallStyleGroups(wallStyles: WallStylePreview[]): WallStyleGroup[] {
  const groups = new Map<string, WallStylePreview[]>()
  for (const style of wallStyles) {
    const key = style.family.toLowerCase()
    const groupStyles = groups.get(key)
    if (groupStyles) {
      groupStyles.push(style)
    } else {
      groups.set(key, [style])
    }
  }

  return [...groups.entries()]
    .map(([key, styles]) => {
      const sortedStyles = [...styles].sort(compareWallStyleVariants)
      const family = sortedStyles[0]?.family ?? 'Wall Style'
      return {
        key,
        family,
        styles: sortedStyles,
        representativeStyle: sortedStyles[0]!,
        searchText: [
          family,
          ...sortedStyles.flatMap((style) => [style.name, style.variant, style.colorway, ...style.tags]),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      }
    })
    .sort((a, b) => a.family.localeCompare(b.family))
}

function compareWallStyleVariants(a: WallStylePreview, b: WallStylePreview) {
  const variantCompare = (a.variant ?? a.name).localeCompare(b.variant ?? b.name)
  return variantCompare || a.name.localeCompare(b.name)
}

function filterWallStyleGroups(groups: WallStyleGroup[], query: string, activeTag: string | null) {
  const normalizedQuery = query.trim().toLowerCase()
  return groups.filter((group) => {
    if (activeTag && group.styles.every((style) => !style.tags.includes(activeTag))) {
      return false
    }
    if (!normalizedQuery) {
      return true
    }
    return group.searchText.includes(normalizedQuery)
  })
}
