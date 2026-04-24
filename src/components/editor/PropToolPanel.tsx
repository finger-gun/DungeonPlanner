import { getAssetBrowserCategory, getAssetBrowserSubcategory, getAssetBrowserTags } from '../../content-packs/browserMetadata'
import { metadataSupportsConnectorType } from '../../content-packs/connectors'
import { getContentPackAssetById, getContentPackAssetsByCategory } from '../../content-packs/registry'
import type { AssetBrowserCategory, AssetBrowserSubcategory, ContentPackAsset } from '../../content-packs/types'
import { useDungeonStore } from '../../store/useDungeonStore'
import { AssetCatalog, type AssetCatalogSection } from './AssetCatalog'
import { CompactPillButton } from './CompactPillButton'
import { SelectedPropInspector } from './SelectedPropInspector'

const ASSET_BROWSER_CATEGORIES: Array<{ id: AssetBrowserCategory; label: string }> = [
  { id: 'furniture', label: 'Furniture' },
  { id: 'storage', label: 'Storage' },
  { id: 'decor', label: 'Decor' },
  { id: 'nature', label: 'Nature' },
  { id: 'treasure', label: 'Treasure' },
  { id: 'structure', label: 'Structure' },
  { id: 'openings', label: 'Openings' },
  { id: 'surfaces', label: 'Surfaces' },
]

const SUBCATEGORY_LABELS: Record<AssetBrowserSubcategory, string> = {
  tables: 'Tables',
  seating: 'Seating',
  beds: 'Beds',
  shelving: 'Shelving',
  containers: 'Containers',
  barrels: 'Barrels',
  lighting: 'Lighting',
  banners: 'Banners',
  tabletop: 'Tabletop',
  books: 'Books',
  trees: 'Trees',
  'bare-trees': 'Bare Trees',
  bushes: 'Bushes',
  grass: 'Grass',
  rocks: 'Rocks',
  loot: 'Loot',
  tools: 'Tools',
  rubble: 'Rubble',
  pillars: 'Pillars',
  bars: 'Bars',
  doors: 'Doors',
  stairs: 'Stairs',
  floors: 'Floors',
  walls: 'Walls',
  misc: 'Misc',
}

export function PropToolPanel() {
  const mapMode = useDungeonStore((state) => state.mapMode)
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
  const setSelectedAsset = useDungeonStore((state) => state.setSelectedAsset)
  const setSurfaceBrushAsset = useDungeonStore((state) => state.setSurfaceBrushAsset)
  const setWallConnectionMode = useDungeonStore((state) => state.setWallConnectionMode)
  const setAssetBrowserCategory = useDungeonStore((state) => state.setAssetBrowserCategory)
  const setAssetBrowserSubcategory = useDungeonStore((state) => state.setAssetBrowserSubcategory)
  const removeSelectedObject = useDungeonStore((state) => state.removeSelectedObject)
  const removeOpening = useDungeonStore((state) => state.removeOpening)
  const visibleCategories = mapMode === 'outdoor'
    ? ASSET_BROWSER_CATEGORIES
    : ASSET_BROWSER_CATEGORIES.filter(({ id }) => id !== 'nature')

  const allAssets = [
    ...getContentPackAssetsByCategory('prop'),
    ...getContentPackAssetsByCategory('opening'),
    ...getContentPackAssetsByCategory('floor'),
    ...getContentPackAssetsByCategory('wall'),
  ].filter((asset) => asset.category !== 'player')

  const categoryAssets = allAssets.filter((asset) => getAssetBrowserCategory(asset) === assetBrowser.category)
  const openingCatalogAssets = categoryAssets
  const subcategorySections = buildSections(openingCatalogAssets)
  const shouldShowOpeningCatalog = true
  const filteredSections = assetBrowser.subcategory
    ? subcategorySections.filter((section) => section.id === assetBrowser.subcategory)
    : subcategorySections
  const visibleSections = !shouldShowOpeningCatalog
    ? []
    : filteredSections.length > 0
      ? filteredSections
      : subcategorySections

  const selectedCatalogAssetId =
    assetBrowser.category === 'openings'
      ? selectedAssetIds.opening
      : assetBrowser.category === 'surfaces'
        ? assetBrowser.subcategory === 'walls'
          ? surfaceBrushAssetIds.wall
          : surfaceBrushAssetIds.floor
        : selectedAssetIds.prop

  const selectedAsset = selectedCatalogAssetId
    ? getContentPackAssetById(selectedCatalogAssetId)
    : null
  const selectedObjectAsset = selectedObject?.assetId
    ? getContentPackAssetById(selectedObject.assetId)
    : null

  return (
    <div className="space-y-4">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
          Asset Categories
        </p>
        <div className="flex flex-wrap gap-1.5">
          {visibleCategories.map(({ id, label }) => {
            const active = assetBrowser.category === id
            return (
              <CompactPillButton
                key={id}
                type="button"
                onClick={() => {
                  setAssetBrowserCategory(id)
                  if (id === 'openings') {
                    setWallConnectionMode('door')
                  }
                }}
                active={active}
                tone="teal"
                size="sm"
              >
                {label}
              </CompactPillButton>
            )
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-xs leading-6 text-stone-400">
        <p className="font-medium text-stone-300">Placement Tool</p>
        <p className="mt-1">
          {mapMode === 'outdoor'
            ? 'Click terrain to place. Right-click to remove.'
            : 'Click a room cell to place. Right-click to remove.'}
        </p>
        <p>Hold <kbd>Alt</kbd> + click to inspect.</p>
      </section>

      {shouldShowOpeningCatalog && subcategorySections.length > 1 && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
            Subcategories
          </p>
          <div className="flex flex-wrap gap-1.5">
            <CompactPillButton
              type="button"
              onClick={() => setAssetBrowserSubcategory(null)}
              active={assetBrowser.subcategory === null}
              tone="sky"
              size="xs"
            >
              All
            </CompactPillButton>
            {subcategorySections.map((section) => {
              const active = assetBrowser.subcategory === section.id
              return (
                <CompactPillButton
                  key={section.id}
                  type="button"
                  onClick={() => setAssetBrowserSubcategory(section.id)}
                  active={active}
                  tone="sky"
                  size="xs"
                >
                  {section.title}
                </CompactPillButton>
              )
            })}
          </div>
        </section>
      )}

      {shouldShowOpeningCatalog && visibleSections.length === 0 ? (
        <p className="rounded-2xl border border-stone-800 bg-stone-950/50 px-4 py-3 text-xs text-stone-500">
          No assets available in this category.
        </p>
      ) : shouldShowOpeningCatalog ? (
        <AssetCatalog
          title="Asset Catalogue"
          sections={visibleSections.map(({ title, assets }) => ({ title, assets }))}
          isSelected={(asset) => selectedCatalogAssetId === asset.id}
          onSelect={(asset) => {
            if (asset.category === 'opening') {
              setSelectedAsset('opening', asset.id)
              return
            }

            if (asset.category === 'floor' || asset.category === 'wall') {
              setSurfaceBrushAsset(asset.category, asset.id)
              return
            }

            setSelectedAsset('prop', asset.id)
          }}
          getBadgeLabel={getAssetBadgeLabel}
          getBadgeClassName={getAssetBadgeClassName}
          getDescription={(asset) => describeAsset(asset)}
        />
      ) : null}

      <section className="rounded-2xl border border-stone-800 bg-stone-950/50 p-4 text-xs leading-6 text-stone-400">
        <p className="font-medium text-stone-300">Asset Tool</p>
        <p className="mt-1">
          {assetBrowser.category === 'openings'
            ? 'Browse doors and stairs here. Shared-wall editing now lives under Room -> Walls.'
            : assetBrowser.category === 'nature'
              ? 'Browse outdoor nature props by family. Only full placeable assets appear here; terrain cliff and top pieces stay out of the prop browser.'
            : assetBrowser.category === 'surfaces'
              ? 'Browse floor and wall variants here. Selecting a surface asset keeps the faster brush workflow on the canvas.'
              : 'Browse props by category and subcategory. Wall, floor, and surface-aware placement still comes from asset metadata.'}
        </p>
        <p>
          Current selection:{' '}
          <span className="text-stone-200">{selectedAsset?.name ?? 'None'}</span>
        </p>
      </section>

      {selectedObject?.type === 'prop' && assetBrowser.category !== 'openings' && (
        <SelectedPropInspector
          object={selectedObject}
          asset={selectedObjectAsset}
          onDelete={removeSelectedObject}
        />
      )}

      {selectedOpening && (
        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">
            Selected Opening
          </p>
          <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
                  {selectedOpening.assetId ? (getContentPackAssetById(selectedOpening.assetId)?.name ?? 'Unknown opening') : 'Open passage'}
                </p>
                <p className="mt-1 font-mono text-sm text-stone-200">
                  {selectedOpening.id.slice(0, 8)}
                </p>
              </div>
              <CompactPillButton
                type="button"
                onClick={() => removeOpening(selectedOpening.id)}
                tone="rose"
                size="sm"
              >
                Delete
              </CompactPillButton>
            </div>
            <div className="grid gap-2 text-xs">
              <PropRow label="Wall" value={selectedOpening.wallKey} />
              <PropRow label="Width" value={`${selectedOpening.width} segment${selectedOpening.width > 1 ? 's' : ''}`} />
              <PropRow label="Direction" value={selectedOpening.wallKey.split(':')[2]} />
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

type BrowserSection = AssetCatalogSection & { id: AssetBrowserSubcategory }

function buildSections(assets: ContentPackAsset[]): BrowserSection[] {
  const grouped = new Map<AssetBrowserSubcategory, ContentPackAsset[]>()

  assets.forEach((asset) => {
    const subcategory = getAssetBrowserSubcategory(asset)
    const group = grouped.get(subcategory)
    if (group) {
      group.push(asset)
    } else {
      grouped.set(subcategory, [asset])
    }
  })

  return [...grouped.entries()]
    .map(([id, groupedAssets]) => ({
      id,
      title: SUBCATEGORY_LABELS[id],
      assets: groupedAssets.sort((left, right) => left.name.localeCompare(right.name)),
    }))
    .sort((left, right) => left.title.localeCompare(right.title))
}

function getAssetBadgeLabel(asset: ContentPackAsset, active: boolean) {
  if (active) {
    return 'Selected'
  }

  if (asset.category === 'opening') {
    return asset.metadata?.stairDirection ? 'stairs' : `w${asset.metadata?.openingWidth ?? 1}`
  }

  const tags = getAssetBrowserTags(asset)
  if (tags.includes('wall-mounted')) return 'wall'
  if (asset.category === 'floor' || asset.category === 'wall') return asset.category
  if (tags.includes('light')) return 'light'

  return SUBCATEGORY_LABELS[getAssetBrowserSubcategory(asset)].toLowerCase()
}

function getAssetBadgeClassName(asset: ContentPackAsset, active: boolean) {
  if (active) {
    return 'bg-teal-300/15 text-teal-100'
  }

  if (asset.category === 'opening') {
    return 'bg-violet-400/10 text-violet-200'
  }

  if (asset.category === 'floor' || asset.category === 'wall') {
    return 'bg-amber-400/10 text-amber-200'
  }

  return metadataSupportsConnectorType(asset.metadata, 'WALL')
    ? 'bg-sky-400/10 text-sky-200'
    : 'bg-stone-800 text-stone-400'
}

function describeAsset(asset: ContentPackAsset) {
  const category = getAssetBrowserCategory(asset)
  const subcategory = SUBCATEGORY_LABELS[getAssetBrowserSubcategory(asset)]
  const tags = getAssetBrowserTags(asset)

  return [category, subcategory, ...tags.slice(0, 2)].join(' · ')
}

function PropRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2">
      <span className="uppercase tracking-[0.2em] text-stone-500">{label}</span>
      <span className="break-all text-right text-stone-300">{value}</span>
    </div>
  )
}
