import type {
  ContentPackWallStyle,
  ContentPackWallStyleBrowserMetadata,
  ContentPackWallStyleInsertAnchor,
  ContentPackWallStyleJoinMode,
  ContentPackWallStyleLayerRender,
  ContentPackWallStyleMaterial,
  ContentPackWallStyleOpeningKind,
  ContentPackWallStyleOpeningMode,
  ContentPackWallStyleProfile,
} from '../types'

const wallMaterialAssetUrls = import.meta.glob(
  '../../assets/materials/dungeon/wall-materials/**/*.{png,jpg,jpeg,webp,avif,ktx2}',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, string>

export type WallStyleMaterialDefinition = {
  albedoPath: string
  normalPath?: string
  aoPath?: string
  heightPath?: string
  packedOrmHeightPath?: string
  displacementPath?: string
  roughnessPath?: string
  metallicPath?: string
  shading?: ContentPackWallStyleMaterial['shading']
  uv?: ContentPackWallStyleMaterial['uv']
}

export type GeneratedWallStyleMaterialDefinition = WallStyleMaterialDefinition & {
  id: string
}

type WallStyleLayerRecipe = {
  profile: keyof typeof dungeonWallStyleProfiles
  material: string
  render?: ContentPackWallStyleLayerRender
}

type WallStyleInsertRecipe = {
  assetId: string
  anchors: readonly ContentPackWallStyleInsertAnchor[]
  interval?: number
}

export type WallStyleRecipe = {
  id: string
  name: string
  previewImagePath?: string
  browser?: ContentPackWallStyleBrowserMetadata
  structuralCore: WallStyleLayerRecipe
  roomFace: WallStyleLayerRecipe
  roomFaceDetails?: readonly WallStyleLayerRecipe[]
  exteriorFace: WallStyleLayerRecipe
  joinMode?: ContentPackWallStyleJoinMode
  inserts?: readonly WallStyleInsertRecipe[]
  curvatureLimits?: ContentPackWallStyle['curvatureLimits']
  openingRules?: {
    defaultMode: ContentPackWallStyleOpeningMode
    supportedModes: readonly ContentPackWallStyleOpeningMode[]
    supportedKinds?: readonly ContentPackWallStyleOpeningKind[]
    compatibleAssetIds?: readonly string[]
  }
}

function resolveAssetUrl(relativePath: string) {
  const assetUrl = wallMaterialAssetUrls[relativePath]
  if (!assetUrl) {
    throw new Error(`Unknown dungeon wall style asset "${relativePath}"`)
  }

  return assetUrl
}

function createProfile(points: readonly (readonly [number, number])[]): ContentPackWallStyleProfile {
  return { points }
}

function createMaterial(definition: WallStyleMaterialDefinition): ContentPackWallStyleMaterial {
  return {
    textures: {
      albedoUrl: resolveAssetUrl(definition.albedoPath),
      ...(definition.normalPath ? { normalUrl: resolveAssetUrl(definition.normalPath) } : {}),
      ...(definition.aoPath ? { aoUrl: resolveAssetUrl(definition.aoPath) } : {}),
      ...(definition.heightPath ? { heightUrl: resolveAssetUrl(definition.heightPath) } : {}),
      ...(definition.packedOrmHeightPath ? { packedOrmHeightUrl: resolveAssetUrl(definition.packedOrmHeightPath) } : {}),
      ...(definition.displacementPath ? { displacementUrl: resolveAssetUrl(definition.displacementPath) } : {}),
      ...(definition.roughnessPath ? { roughnessUrl: resolveAssetUrl(definition.roughnessPath) } : {}),
      ...(definition.metallicPath ? { metallicUrl: resolveAssetUrl(definition.metallicPath) } : {}),
    },
    ...(definition.shading ? { shading: definition.shading } : {}),
    ...(definition.uv ? { uv: definition.uv } : {}),
  }
}

function createLayer(recipe: WallStyleLayerRecipe) {
  const materialDefinition = dungeonWallStyleMaterials[recipe.material]
  if (!materialDefinition) {
    throw new Error(`Unknown dungeon wall style material "${recipe.material}"`)
  }

  return {
    profile: createProfile(dungeonWallStyleProfiles[recipe.profile]),
    material: createMaterial(materialDefinition),
    ...(recipe.render ? { render: recipe.render } : {}),
  }
}

export const dungeonWallStyleProfiles = {
  'wainscot-core': [
    [-0.18, 0],
    [-0.18, 1],
    [0.25, 1],
    [0.25, 0.8625],
    [0.125, 0.8],
    [0.125, 0.125],
    [0.25, 0.0625],
    [0.25, 0],
  ],
  'wainscot-room-face': [
    [-0.181, 0.48],
    [-0.181, 1],
  ],
  'wainscot-room-base': [
    [-0.245, 0],
    [-0.245, 0.48],
    [-0.181, 0.48],
  ],
  'wainscot-exterior-face': [
    [0.25, 0],
    [0.25, 0.0625],
    [0.125, 0.125],
    [0.125, 0.8],
    [0.25, 0.8625],
    [0.25, 1],
  ],
  'thick-stone-core': [
    [-0.22, 0],
    [-0.22, 1],
    [0.22, 1],
    [0.22, 0],
  ],
  'sloped-stone-room-face': [
    [-0.06, 0],
    [-0.08, 0.2],
    [-0.08, 0.78],
    [-0.02, 0.9],
    [0, 1],
  ],
  'sloped-stone-exterior-face': [
    [0, 0],
    [0.06, 0.15],
    [0.14, 0.72],
    [0.08, 0.88],
    [0.18, 1],
  ],
  'ai-gothic-wall-face': [
    [0.22, 0],
    [0.22, 1],
  ],
  'plaster-core': [
    [-0.18, 0],
    [-0.18, 1],
    [0.18, 1],
    [0.18, 0],
  ],
  'soft-plaster-room-face': [
    [-0.02, 0],
    [-0.04, 0.28],
    [-0.01, 0.82],
    [0, 1],
  ],
  'soft-plaster-exterior-face': [
    [0, 0],
    [0.04, 0.22],
    [0.12, 0.84],
    [0.1, 1],
  ],
  'cave-rock-core': [
    [-0.26, 0],
    [-0.31, 0.16],
    [-0.25, 0.42],
    [-0.3, 0.72],
    [-0.22, 1],
    [0.24, 1],
    [0.3, 0.78],
    [0.23, 0.48],
    [0.29, 0.18],
    [0.22, 0],
  ],
  'cave-rock-room-face': [
    [-0.13, 0],
    [-0.19, 0.18],
    [-0.12, 0.38],
    [-0.17, 0.64],
    [-0.09, 0.84],
    [-0.12, 1],
  ],
  'cave-rock-exterior-face': [
    [0.12, 0],
    [0.2, 0.2],
    [0.14, 0.44],
    [0.22, 0.7],
    [0.15, 0.9],
    [0.2, 1],
  ],
} as const satisfies Record<string, readonly (readonly [number, number])[]>

const generatedWallStyleMaterialModules = import.meta.glob('./generated/wallStyleMaterials/*.ts', {
  eager: true,
}) as Record<string, { wallStyleMaterial: GeneratedWallStyleMaterialDefinition }>

const generatedWallStyleMaterials = Object.fromEntries(
  Object.values(generatedWallStyleMaterialModules).map((module) => [
    module.wallStyleMaterial.id,
    module.wallStyleMaterial,
  ]),
) as Record<string, WallStyleMaterialDefinition>

const builtinDungeonWallStyleMaterials = {} as const satisfies Record<string, WallStyleMaterialDefinition>

export const dungeonWallStyleMaterials: Record<string, WallStyleMaterialDefinition> = {
  ...builtinDungeonWallStyleMaterials,
  ...generatedWallStyleMaterials,
}

export function createWallStyleFromRecipe(recipe: WallStyleRecipe): ContentPackWallStyle {
  return {
    id: recipe.id,
    name: recipe.name,
    ...(recipe.previewImagePath ? { previewImageUrl: resolveAssetUrl(recipe.previewImagePath) } : {}),
    ...(recipe.browser ? { browser: recipe.browser } : {}),
    structuralCore: createLayer(recipe.structuralCore),
    roomFace: createLayer(recipe.roomFace),
    ...(recipe.roomFaceDetails ? { roomFaceDetails: recipe.roomFaceDetails.map(createLayer) } : {}),
    exteriorFace: createLayer(recipe.exteriorFace),
    ...(recipe.joinMode ? { joinMode: recipe.joinMode } : {}),
    ...(recipe.inserts ? { inserts: recipe.inserts } : {}),
    ...(recipe.curvatureLimits ? { curvatureLimits: recipe.curvatureLimits } : {}),
    ...(recipe.openingRules ? { openingRules: recipe.openingRules } : {}),
  }
}
