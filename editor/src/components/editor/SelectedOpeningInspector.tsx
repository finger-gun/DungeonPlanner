import { getContentPackAssetById, getContentPackAssetsByCategory } from '../../content-packs/registry'
import type { ContentPackAsset } from '../../content-packs/types'
import { metadataSupportsConnectorType } from '../../content-packs/connectors'
import type { OpeningRecord } from '../../store/useDungeonStore'
import { useDungeonStore } from '../../store/useDungeonStore'
import { CompactPillButton } from './CompactPillButton'

type SelectedOpeningInspectorProps = {
  opening: OpeningRecord
  asset: ContentPackAsset | null
  onDelete: () => void
  title?: string
}

export function SelectedOpeningInspector({
  opening,
  asset,
  onDelete,
  title = 'Selected Opening',
}: SelectedOpeningInspectorProps) {
  const rotateSelection = useDungeonStore((state) => state.rotateSelection)
  const selectedOpeningAssetId = useDungeonStore((state) => state.selectedAssetIds.opening)
  const setOpeningAsset = useDungeonStore((state) => state.setOpeningAsset)
  const fallbackClosedAsset = resolveClosedOpeningAsset(opening.width, selectedOpeningAssetId)

  const stateAction = opening.assetId
    ? {
        label: 'Open Passage',
        onClick: () => setOpeningAsset(opening.id, null),
      }
    : fallbackClosedAsset
      ? {
          label: `Close with ${fallbackClosedAsset.name}`,
          onClick: () => setOpeningAsset(opening.id, fallbackClosedAsset.id),
        }
      : null

  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/70">
        {title}
      </p>
      <div className="rounded-2xl border border-stone-800 bg-stone-900/80 p-4">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-stone-500">
              {opening.assetId ? (asset?.name ?? 'Unknown opening') : 'Open passage'}
            </p>
            <p className="mt-1 font-mono text-sm text-stone-200">
              {opening.id.slice(0, 8)}
            </p>
          </div>
          <CompactPillButton
            type="button"
            onClick={onDelete}
            tone="rose"
            size="sm"
          >
            Delete
          </CompactPillButton>
        </div>

        <div className="grid gap-2 text-xs">
          <InfoRow label="Wall" value={opening.wallKey} />
          <InfoRow label="Width" value={`${opening.width} segment${opening.width > 1 ? 's' : ''}`} />
          <InfoRow label="Direction" value={opening.wallKey.split(':')[2] ?? 'unknown'} />
        </div>

        <div className="mt-4 border-t border-stone-800 pt-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200/70">
            State
          </p>
          <div className="flex flex-wrap gap-2">
            {stateAction ? (
              <CompactPillButton type="button" onClick={stateAction.onClick} tone="amber" size="sm">
                {stateAction.label}
              </CompactPillButton>
            ) : (
              <p className="text-xs text-stone-500">
                Choose a matching wall opening asset in the browser to close this passage.
              </p>
            )}
            {opening.assetId ? (
              <CompactPillButton type="button" onClick={rotateSelection} tone="stone" size="sm">
                Flip Facing
              </CompactPillButton>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

function resolveClosedOpeningAsset(width: OpeningRecord['width'], selectedAssetId: string | null) {
  const selectedAsset = selectedAssetId ? getContentPackAssetById(selectedAssetId) : null
  if (isMatchingWallOpeningAsset(selectedAsset, width)) {
    return selectedAsset
  }

  return getContentPackAssetsByCategory('opening').find((candidate) =>
    isMatchingWallOpeningAsset(candidate, width),
  ) ?? null
}

function isMatchingWallOpeningAsset(asset: ContentPackAsset | null, width: OpeningRecord['width']) {
  if (!asset || asset.category !== 'opening') {
    return false
  }

  return metadataSupportsConnectorType(asset.metadata, 'WALL') && (asset.metadata?.openingWidth ?? 1) === width
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 rounded-xl border border-stone-800 bg-stone-950/60 px-3 py-2">
      <span className="uppercase tracking-[0.2em] text-stone-500">{label}</span>
      <span className="break-all text-right text-stone-300">{value}</span>
    </div>
  )
}
