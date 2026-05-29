import type { ComponentType } from 'react'
import type { JSX } from 'react'

export type ContentPackCategory = 'floor' | 'wall' | 'prop' | 'opening' | 'player'
export type ContentPackOpeningSpanSample = {
  position: readonly [number, number, number]
  tangent: readonly [number, number, number]
  normal: readonly [number, number, number]
  distance: number
}
export type ContentPackOpeningContext = {
  clearSpan: number
  spanSamples: readonly ContentPackOpeningSpanSample[]
  openingKind?: ContentPackWallStyleOpeningKind
  openingMode?: ContentPackWallStyleOpeningMode
  compatibleWithWallStyle?: boolean
}
export type ContentPackComponentProps = JSX.IntrinsicElements['group'] & {
  variantKey?: string
  objectProps?: Record<string, unknown>
  poseSelected?: boolean
  playerAnimationState?: 'default' | 'selected' | 'pickup' | 'holding' | 'release'
  openingContext?: ContentPackOpeningContext
}
export type ContentPackModelTransform = {
  position?: readonly [number, number, number]
  rotation?: readonly [number, number, number]
  scale?: number | readonly [number, number, number]
}
export type ContentPackBatchRender = {
  getAssetUrl?: (
    variantKey?: string,
    objectProps?: Record<string, unknown>,
  ) => string | undefined
  transform?:
    | ContentPackModelTransform
    | ((variantKey?: string, objectProps?: Record<string, unknown>) => ContentPackModelTransform | undefined)
}
export type ConnectsTo = 'FLOOR' | 'WALL' | 'SURFACE'
export type SnapsTo = 'GRID' | 'FREE'
export type AssetBrowserCategory =
  | 'furniture'
  | 'storage'
  | 'decor'
  | 'nature'
  | 'treasure'
  | 'structure'
  | 'openings'
  | 'surfaces'
export type AssetBrowserSubcategory =
  | 'tables'
  | 'seating'
  | 'beds'
  | 'shelving'
  | 'containers'
  | 'barrels'
  | 'lighting'
  | 'banners'
  | 'tabletop'
  | 'books'
  | 'trees'
  | 'bare-trees'
  | 'bushes'
  | 'grass'
  | 'rocks'
  | 'loot'
  | 'tools'
  | 'rubble'
  | 'pillars'
  | 'bars'
  | 'doors'
  | 'stairs'
  | 'floors'
  | 'walls'
  | 'misc'

export type Connector = {
  /** Position in local object space relative to model origin */
  point: readonly [number, number, number]
  /** What this connector can attach to */
  type: ConnectsTo
  /** Optional rotation adjustment when connected (euler angles in radians) */
  rotation?: readonly [number, number, number]
}

// Legacy type kept for backward compatibility
export type PropConnector = 'FLOOR' | 'WALL' | 'WALLFLOOR' | 'FREE'

export type PropLight = {
  color: string
  intensity: number
  distance: number
  decay?: number
  /** Position of the light in local object space (e.g. move up to where a flame would be) */
  offset?: [number, number, number]
  flicker?: boolean
  /** Whether this light casts shadows. Defaults to false (point light shadows are expensive). */
  castShadow?: boolean
}

export type ContentPackEffectPreset = 'fire'

export type ContentPackEffectEmitter = {
  /** Position of the effect emitter in local object space. */
  offset?: [number, number, number]
  /** Scales particle size and motion for this emitter. */
  scale?: number
  /** Multiplies the preset brightness/density for this emitter. */
  intensity?: number
  /** Optional runtime tint, typically linked to the matching light color. */
  color?: string
}

export type ContentPackEffect = {
  preset: ContentPackEffectPreset
  emitters?: ContentPackEffectEmitter[]
}

export type TileSpan = {
  /** How many grid cells wide this tile spans (1 cell = GRID_SIZE units). */
  gridWidth: 1 | 2 | 4
  /** How many grid cells deep this tile spans (1 cell = GRID_SIZE units). */
  gridHeight: 1 | 2 | 4
}

export type AtlasColorVariantDefinition = {
  id: string
  label: string
  swatchColor?: string
  cell?: readonly [number, number]
  uvOffset: readonly [number, number]
  uvScale?: readonly [number, number]
}

export type AtlasColorVariantsConfig = {
  propKey: string
  defaultVariantId?: string
  materialNames?: string[]
  variants: AtlasColorVariantDefinition[]
}

export type ContentPackAssetMetadata = {
  /**
   * @deprecated Use `connectors` instead so placement behavior is defined per connector.
   * What this asset connects to. Supports single value, array, or legacy PropConnector types.
   */
  connectsTo?: PropConnector | ConnectsTo | ConnectsTo[]
  /** How this asset snaps during placement: GRID (snap to grid/wall centers) or FREE (freeform) */
  snapsTo?: SnapsTo
  /** Multiple connection points for objects that can attach in different ways */
  connectors?: Connector[]
  /** Whether other props can be placed on this object's surface */
  propSurface?: boolean
  light?: PropLight
  /** Whether this asset blocks play-mode line of sight when placed on a floor cell. */
  blocksLineOfSight?: boolean
  /** Whether this asset's meshes cast shadows. Defaults to true when omitted. */
  castShadow?: boolean
  /** Whether this asset's meshes receive shadows. Defaults to true when omitted. */
  receiveShadow?: boolean
  /** Width in wall segments for category='wall'. Default 1. */
  wallSpan?: 1 | 2 | 3
  /** Whether the wall should add auto-placed convex exterior corner pieces. */
  wallCornerType?: 'solitary'
  /** Width in wall segments (1–3). Only meaningful for category='opening'. Default 1. */
  openingWidth?: 1 | 2 | 3
  /** Opening interaction semantics: passages are always open, doors can toggle state. */
  openingKind?: 'passage' | 'door' | 'window'
  /** Optional centered clear width, in world units, to remove from a single wall segment. */
  openingCutoutWidth?: number
  /** Optional clear height, in world units, for a door-like opening below the wall top. */
  openingCutoutHeight?: number
  /** Optional structural cutout shape used by procedural wall collapsing. Defaults to rectangle. */
  openingCutoutShape?: 'rectangle' | 'arched'
  /** Marks a floor-connected opening as staircase that links floors. */
  stairDirection?: 'up' | 'down'
  /** Matching staircase asset to place on the adjacent floor. */
  pairedAssetId?: string
  /** How many grid cells this floor/ceiling tile spans. Default is 1x1. */
  tileSpan?: TileSpan
  /** User-facing browser grouping for unified asset placement. */
  browserCategory?: AssetBrowserCategory
  /** Secondary browser grouping within a top-level category. */
  browserSubcategory?: AssetBrowserSubcategory
  /** Optional filter tags exposed by the asset browser. */
  browserTags?: string[]
  /** Optional per-prop atlas-backed color variants exposed as named swatches. */
  atlasColorVariants?: AtlasColorVariantsConfig
}

export type ContentPackAsset = {
  id: string
  slug: string
  name: string
  category: ContentPackCategory
  assetUrl?: string
  thumbnailUrl?: string
  Component: ComponentType<ContentPackComponentProps>
  metadata?: ContentPackAssetMetadata
  projectionReceiver?: {
    getAssetUrl?: (variantKey?: string) => string | undefined
    transform?: ContentPackModelTransform
  }
  batchRender?: ContentPackBatchRender
  getLight?: (objectProps: Record<string, unknown>) => PropLight | null
  getEffect?: (objectProps: Record<string, unknown>) => ContentPackEffect | null
  getPlayModeNextProps?: (objectProps: Record<string, unknown>) => Record<string, unknown> | null
}

export type ContentPackRoomSetFloor =
  | {
      kind: 'single'
      assetId: string
    }
  | {
      kind: 'randomized'
      assetIds: string[]
      randomQuarterTurns?: boolean
    }

export type ContentPackWallMaterialTextures = {
  albedoUrl: string
  normalUrl?: string
  aoUrl?: string
  heightUrl?: string
  packedOrmHeightUrl?: string
  displacementUrl?: string
  roughnessUrl?: string
  metallicUrl?: string
}

export type ContentPackWallMaterialShading = {
  tintColor?: string
  roughness?: number
  metalness?: number
  bumpScale?: number
  parallaxScale?: number
  parallaxSteps?: number
  parallaxInvert?: boolean
  displacementScale?: number
  displacementBias?: number
  displacementVertexStep?: number
  aoMapIntensity?: number
  topSurfaceColor?: string
  topSurfaceRoughness?: number
  topSurfaceMetalness?: number
}

export type ContentPackWallStyleMaterialUv = {
  verticalMode?: 'distance' | 'fit-height'
  verticalWrap?: 'repeat' | 'clamp'
  flipV?: boolean
  flipVOnExterior?: boolean
}

export type ContentPackWallMaterialSet = {
  id: string
  name: string
  previewImageUrl?: string
  textures: ContentPackWallMaterialTextures
  shading?: ContentPackWallMaterialShading
  uv?: ContentPackWallStyleMaterialUv
}

export type ContentPackWallStyleBrowserMetadata = {
  family: string
  variant?: string
  colorway?: string
  swatchColor?: string
  tags?: readonly string[]
  source?: 'built-in' | 'generated' | 'imported'
}

export type ContentPackWallStyleProfilePoint = readonly [number, number]

export type ContentPackWallStyleProfile = {
  points: readonly ContentPackWallStyleProfilePoint[]
}

export type ContentPackWallStyleMaterial = {
  textures: ContentPackWallMaterialTextures
  shading?: ContentPackWallMaterialShading
  uv?: ContentPackWallStyleMaterialUv
}

export type ContentPackWallStyleLayerRender = {
  hiddenProfileSegmentIndices?: readonly number[]
}

export type ContentPackWallStyleLayer = {
  profile: ContentPackWallStyleProfile
  material: ContentPackWallStyleMaterial
  render?: ContentPackWallStyleLayerRender
}

export type ContentPackWallStyleJoinMode = 'miter' | 'bevel' | 'cap' | 'cover-piece'

export type ContentPackWallStyleInsertAnchor =
  | 'start'
  | 'end'
  | 'convex-corner'
  | 'concave-corner'
  | 'curvature-change'
  | 'interval'

export type ContentPackWallStyleInsertRule = {
  assetId: string
  anchors: readonly ContentPackWallStyleInsertAnchor[]
  interval?: number
}

export type ContentPackWallStyleOpeningMode = 'framed' | 'sleeve' | 'structural'
export type ContentPackWallStyleOpeningKind = 'door' | 'window' | 'passage'

export type ContentPackWallStyleOpeningRules = {
  defaultMode: ContentPackWallStyleOpeningMode
  supportedModes: readonly ContentPackWallStyleOpeningMode[]
  supportedKinds?: readonly ContentPackWallStyleOpeningKind[]
  compatibleAssetIds?: readonly string[]
}

export type ContentPackWallStyleCurvatureLimits = {
  minInnerRadius?: number
  maxTurnDegrees?: number
}

export type ContentPackWallStyle = {
  id: string
  name: string
  previewImageUrl?: string
  browser?: ContentPackWallStyleBrowserMetadata
  structuralCore: ContentPackWallStyleLayer
  roomFace: ContentPackWallStyleLayer
  roomFaceDetails?: readonly ContentPackWallStyleLayer[]
  exteriorFace: ContentPackWallStyleLayer
  joinMode?: ContentPackWallStyleJoinMode
  inserts?: readonly ContentPackWallStyleInsertRule[]
  curvatureLimits?: ContentPackWallStyleCurvatureLimits
  openingRules?: ContentPackWallStyleOpeningRules
}

export type ContentPackRoomSet = {
  id: string
  name: string
  previewWallAssetId: string
  wallAssetId: string
  pillarAssetId: string
  openingAssetId?: string
  wallStyleId?: string
  wallMaterialSetId?: string
  floor: ContentPackRoomSetFloor
}

export type ContentPack = {
  id: string
  name: string
  assets: ContentPackAsset[]
  roomSets?: ContentPackRoomSet[]
  wallMaterialSets?: ContentPackWallMaterialSet[]
  wallStyles?: ContentPackWallStyle[]
  /** Optional default assets for each category. Using the asset object keeps defaults type-safe. */
  defaultAssets?: {
    floor?: ContentPackAsset & { category: 'floor' }
    wall?: ContentPackAsset & { category: 'wall' }
    opening?: ContentPackAsset & { category: 'opening' }
    prop?: ContentPackAsset & { category: 'prop' }
    player?: ContentPackAsset & { category: 'player' }
  }
}

export function defaultAssetForCategory<TCategory extends ContentPackCategory>(
  category: TCategory,
  asset: ContentPackAsset,
) {
  if (asset.category !== category) {
    throw new Error(`Default asset category mismatch: expected ${category}, got ${asset.category}`)
  }

  return asset as ContentPackAsset & { category: TCategory }
}
