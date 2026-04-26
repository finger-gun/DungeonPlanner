import type { ContentPackAsset, ContentPackAssetMetadata } from '../../types'
import { listAvailableKayKitModelNames } from '../shared/createKayKitAsset'
import { createKayKitContentPackAsset } from '../shared/createKayKitContentPackAsset'
import { getOutdoorTerrainStyleLabel, type OutdoorTerrainStyle } from '../../../store/outdoorTerrainStyles'

type ForestAssetFamily = 'tree' | 'tree-bare' | 'bush' | 'grass' | 'rock'

type ForestModelDefinition = {
  modelName: string
  baseName: string
  style: string
  family: ForestAssetFamily
}

const FLOOR_CONNECTORS: NonNullable<ContentPackAssetMetadata['connectors']> = [
  { point: [0, 0, 0], type: 'FLOOR' },
]

const FOREST_MODEL_DEFINITIONS = listAvailableKayKitModelNames()
  .map(parseForestModelName)
  .filter((definition): definition is ForestModelDefinition => definition !== null)
  .sort((left, right) => left.modelName.localeCompare(right.modelName))

export const kaykitForestPropAssets: ContentPackAsset[] = FOREST_MODEL_DEFINITIONS.map((definition) =>
  createKayKitContentPackAsset({
    id: `kaykit.forest_${definition.baseName.toLowerCase()}_${definition.style.toLowerCase()}`,
    slug: `kaykit-forest-${definition.baseName.toLowerCase().replace(/_/g, '-')}-${definition.style.toLowerCase()}`,
    name: `Forest ${humanizeForestBaseName(definition.baseName)} (${getOutdoorTerrainStyleLabel(definition.style as OutdoorTerrainStyle)})`,
    category: 'prop',
    modelName: definition.modelName,
    metadata: createForestAssetMetadata(definition),
  }),
)

function parseForestModelName(modelName: string): ForestModelDefinition | null {
  const match = modelName.match(/^(Tree_Bare|Tree|Bush|Grass|Rock)_(.+)_(Color[1-8])$/)
  if (!match) {
    return null
  }

  const [, rawFamily, rawVariant, style] = match
  if (
    rawFamily === 'Grass' &&
    !/^\d+_[A-Z](?:_Singlesided)?$/.test(rawVariant)
  ) {
    return null
  }

  if (
    (rawFamily === 'Tree' || rawFamily === 'Tree_Bare' || rawFamily === 'Bush' || rawFamily === 'Rock') &&
    !/^\d+_[A-Z]$/.test(rawVariant)
  ) {
    return null
  }

  return {
    modelName,
    baseName: `${rawFamily}_${rawVariant}`,
    style,
    family:
      rawFamily === 'Tree_Bare'
        ? 'tree-bare'
        : rawFamily === 'Tree'
          ? 'tree'
          : rawFamily === 'Bush'
            ? 'bush'
            : rawFamily === 'Grass'
              ? 'grass'
              : 'rock',
  }
}

function createForestAssetMetadata(definition: ForestModelDefinition): ContentPackAssetMetadata {
  const browserSubcategory =
    definition.family === 'rock'
      ? 'rocks'
      : definition.family === 'grass'
        ? 'grass'
        : definition.family === 'bush'
          ? 'bushes'
          : definition.family === 'tree-bare'
            ? 'bare-trees'
            : 'trees'
  const blocksLineOfSight = definition.family === 'tree' || definition.family === 'tree-bare'
  const castShadow = definition.family !== 'grass'

  return {
    snapsTo: 'FREE',
    connectors: FLOOR_CONNECTORS,
    blocksLineOfSight,
    castShadow,
    browserCategory: 'nature',
    browserSubcategory,
    browserTags: [
      'outdoor',
      'forest',
      definition.family,
      definition.style.toLowerCase(),
    ],
  }
}

function humanizeForestBaseName(baseName: string) {
  return baseName
    .replace(/_/g, ' ')
    .replace(/\bBare\b/g, 'Bare')
    .replace(/\bSinglesided\b/g, 'Single-Sided')
}
