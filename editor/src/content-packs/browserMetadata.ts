import { getMetadataConnectors, metadataSupportsConnectorType } from './connectors'
import type {
  AssetBrowserCategory,
  AssetBrowserSubcategory,
  ContentPackAsset,
} from './types'

export type AssetPlacementMode =
  | 'prop'
  | 'opening-floor'
  | 'opening-wall'
  | 'surface-floor'
  | 'surface-wall'

export function getAssetPlacementMode(asset: ContentPackAsset): AssetPlacementMode {
  if (asset.category === 'opening') {
    return metadataSupportsConnectorType(asset.metadata, 'WALL')
      ? 'opening-wall'
      : 'opening-floor'
  }

  if (asset.category === 'floor') {
    return 'surface-floor'
  }

  if (asset.category === 'wall') {
    return 'surface-wall'
  }

  return 'prop'
}

export function getAssetBrowserCategory(asset: ContentPackAsset): AssetBrowserCategory {
  if (asset.metadata?.browserCategory) {
    return asset.metadata.browserCategory
  }

  if (asset.category === 'opening') {
    return 'openings'
  }

  if (asset.category === 'floor' || asset.category === 'wall') {
    return 'surfaces'
  }

  const label = `${asset.id} ${asset.name}`.toLowerCase()

  if (matches(label, ['bookcase', 'shelf', 'shelves', 'table', 'chair', 'bench', 'stool', 'bed', 'bar_', 'bartop', 'table_round', 'post'])) {
    return 'furniture'
  }

  if (matches(label, ['chest', 'crate', 'box', 'trunk', 'barrel', 'keg', 'bucket'])) {
    return 'storage'
  }

  if (matches(label, ['coin', 'key', 'gold', 'treasure'])) {
    return 'treasure'
  }

  if (matches(label, ['pillar', 'column', 'scaffold', 'wall_endcap', 'wall_corner', 'rubble', 'rocks', 'bars'])) {
    return 'structure'
  }

  return 'decor'
}

export function getAssetBrowserSubcategory(asset: ContentPackAsset): AssetBrowserSubcategory {
  if (asset.metadata?.browserSubcategory) {
    return asset.metadata.browserSubcategory
  }

  if (asset.category === 'opening') {
    return asset.metadata?.stairDirection ? 'stairs' : 'doors'
  }

  if (asset.category === 'floor') {
    return 'floors'
  }

  if (asset.category === 'wall') {
    return 'walls'
  }

  const label = `${asset.id} ${asset.name}`.toLowerCase()

  if (matches(label, ['table', 'bartop', 'table_round'])) return 'tables'
  if (matches(label, ['chair', 'bench', 'stool'])) return 'seating'
  if (matches(label, ['bed'])) return 'beds'
  if (matches(label, ['bookcase', 'shelf', 'shelves', 'post'])) return 'shelving'
  if (matches(label, ['chest', 'crate', 'box', 'trunk'])) return 'containers'
  if (matches(label, ['barrel', 'keg', 'bucket'])) return 'barrels'
  if (matches(label, ['torch', 'candle'])) return 'lighting'
  if (matches(label, ['banner'])) return 'banners'
  if (matches(label, ['plate', 'bottle', 'food'])) return 'tabletop'
  if (matches(label, ['book'])) return 'books'
  if (matches(label, ['coin', 'key', 'gold', 'treasure'])) return 'loot'
  if (matches(label, ['pickaxe', 'sword', 'shield'])) return 'tools'
  if (matches(label, ['rubble', 'rocks'])) return 'rubble'
  if (matches(label, ['pillar', 'column', 'scaffold'])) return 'pillars'
  if (matches(label, ['bars', 'bar_'])) return 'bars'

  return 'misc'
}

export function getAssetBrowserTags(asset: ContentPackAsset) {
  const tags = new Set<string>(asset.metadata?.browserTags ?? [])

  if (asset.category === 'opening') tags.add('opening')
  if (asset.metadata?.light || asset.getLight) tags.add('light')
  if (asset.metadata?.propSurface) tags.add('surface')
  if (metadataSupportsConnectorType(asset.metadata, 'WALL')) tags.add('wall-mounted')
  if (metadataSupportsConnectorType(asset.metadata, 'FLOOR')) tags.add('floor')
  if (metadataSupportsConnectorType(asset.metadata, 'SURFACE')) tags.add('stackable')
  if ((asset.metadata?.connectors ?? getMetadataConnectors(asset.metadata)).length > 1) tags.add('multi-mode')

  return [...tags]
}

function matches(label: string, patterns: string[]) {
  return patterns.some((pattern) => label.includes(pattern))
}
