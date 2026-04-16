import type { ReactNode } from 'react'
import type { ContentPackAsset } from '../../content-packs/types'

export type AssetCatalogSection = {
  title: string
  assets: ContentPackAsset[]
}

export function AssetCatalog({
  title = 'Catalogue',
  sections,
  isSelected,
  onSelect,
  renderActions,
  getBadgeLabel = (asset, active) => (active ? 'Selected' : asset.category),
  getBadgeClassName = (asset, active) => {
    if (active) {
      return 'bg-teal-300/15 text-teal-100'
    }

    if (asset.category === 'player') {
      return 'bg-sky-400/10 text-sky-200'
    }

    return 'bg-stone-800 text-stone-400'
  },
  getDescription = (asset) => asset.slug,
}: {
  title?: string
  sections: AssetCatalogSection[]
  isSelected: (asset: ContentPackAsset) => boolean
  onSelect: (asset: ContentPackAsset) => void
  renderActions?: (asset: ContentPackAsset) => ReactNode
  getBadgeLabel?: (asset: ContentPackAsset, active: boolean) => string
  getBadgeClassName?: (asset: ContentPackAsset, active: boolean) => string
  getDescription?: (asset: ContentPackAsset) => string
}) {
  return (
    <section>
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200/70">
        {title}
      </p>
      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.24em] text-stone-500">
              {section.title}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {section.assets.map((asset) => {
                const active = isSelected(asset)
                return (
                  <CatalogCard
                    key={asset.id}
                    asset={asset}
                    active={active}
                    onSelect={() => onSelect(asset)}
                     badgeLabel={getBadgeLabel(asset, active)}
                     badgeClassName={getBadgeClassName(asset, active)}
                     description={getDescription(asset)}
                     actions={renderActions?.(asset)}
                   />
                 )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function CatalogCard({
  asset,
  active,
  onSelect,
  badgeLabel,
  badgeClassName,
  description,
  actions,
}: {
  asset: ContentPackAsset
  active: boolean
  onSelect: () => void
  badgeLabel: string
  badgeClassName: string
  description: string
  actions?: ReactNode
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border transition ${
        active
          ? 'border-teal-300/35 bg-teal-400/10 shadow-[0_0_0_1px_rgba(94,234,212,0.12)]'
          : 'border-stone-800 bg-stone-950/60'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className={`block w-full text-left transition ${active ? '' : 'hover:border-stone-700'}`}
      >
        <div className="aspect-square border-b border-stone-800/80 bg-stone-900/80">
          {asset.thumbnailUrl ? (
            <img
              src={asset.thumbnailUrl}
              alt={`${asset.name} thumbnail`}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.24em] text-stone-600">
              No preview
            </div>
          )}
        </div>
        <div className="space-y-1 px-3 py-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-stone-100">{asset.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] ${badgeClassName}`}>
              {badgeLabel}
            </span>
          </div>
          <p className="text-[11px] text-stone-500">{description}</p>
        </div>
      </button>
      {actions ? <div className="px-3 pb-3">{actions}</div> : null}
    </div>
  )
}
