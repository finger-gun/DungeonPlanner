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

const builtinDungeonWallStyleMaterials = {
  'kaykit-stone': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_ormh.ktx2',
    shading: {
      tintColor: '#cfd6df',
      roughness: 0.45,
      metalness: 0,
    },
  },
  'keep-core-blue': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-bone-white-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-bone-white-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-bone-white-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/wall_ormh.ktx2',
    shading: {
      tintColor: '#d7dde8',
      topSurfaceColor: '#2f3442',
      roughness: 0.45,
      metalness: 0,
    },
  },
  'keep-room-stone': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-bone-white-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_ormh.ktx2',
    shading: {
      tintColor: '#cfd6df',
      roughness: 0.45,
      metalness: 0,
    },
  },
  'tavern-wood-base': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/wall_ormh.ktx2',
    shading: {
      roughness: 0.58,
      metalness: 0.02,
    },
  },
  'wedged-cobblestone-exterior': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-slate-grey-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-slate-grey-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-slate-grey-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_ormh.ktx2',
    shading: {
      roughness: 0.5,
      metalness: 0,
    },
  },
  'wedged-cobblestone': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-slate-grey-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-slate-grey-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-castle-stone-with-massive-ashlar-masonry-blocks-and-weathered-slate-grey-bevel-edges-with-a-heavy-stone-corbel-protruding-near-the-top-edge-00001/wall_ormh.ktx2',
    shading: {
      roughness: 0.5,
      metalness: 0,
    },
  },
  'rough-rockface-1-pbr-material': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-slate-grey-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-slate-grey-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-goblin-cave-with-jagged-asymmetric-slate-grey-rock-strata-and-crude-tool-pickaxe-gouges-with-an-uneven-stone-buttress-rough-hewn-directly-into-the-cave-wall-00001/wall_ormh.ktx2',
    shading: {
      roughness: 0.82,
      metalness: 0,
    },
  },
  'ai-gothic-depth-wall': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-slate-grey-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-slate-grey-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-keep-granite-with-rugged-slate-grey-fortress-block-edges-and-deep-structural-stress-fractures-with-an-iron-reinforced-stone-archway-frame-flush-against-the-masonry-00001/wall_ormh.ktx2',
    shading: {
      parallaxScale: 0.055,
      parallaxSteps: 10,
      parallaxInvert: true,
      roughness: 0.42,
      metalness: 0,
    },
    uv: {
      verticalMode: 'fit-height',
      verticalWrap: 'clamp',
    },
  },
  'classy-art-deco-wallpaper': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-charcoal-black-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-charcoal-black-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-palace-marble-with-polished-decorative-relief-borders-and-intricate-charcoal-black-hieroglyph-patterns-with-a-flat-marble-pilaster-flanking-the-side-of-the-texture-00001/wall_ormh.ktx2',
    shading: {
      roughness: 0.4,
      metalness: 0.04,
    },
  },
  'modern-brick1': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-bone-white-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-bone-white-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-bone-white-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/wall_ormh.ktx2',
    shading: {
      tintColor: '#dddddd',
      roughness: 0.2,
      metalness: 0.2,
    },
    uv: {
      verticalMode: 'fit-height',
      verticalWrap: 'clamp',
    },
  },
  'modern-brick1-core': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-bone-white-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-bone-white-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-dwarf-brick-with-heavy-geometric-chisel-marks-and-deep-recessed-bone-white-mortar-with-an-integrated-flat-pillar-decorated-with-geometric-dwarven-runes-00001/wall_ormh.ktx2',
    shading: {
      tintColor: '#ffffff',
      roughness: 0.45,
      metalness: 0,
    },
    uv: {
      verticalMode: 'fit-height',
      verticalWrap: 'clamp',
    },
  },
  'tavern-wood-planks': {
    albedoPath: '../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/wall_albedo.ktx2',
    normalPath: '../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/wall_normal.ktx2',
    packedOrmHeightPath: '../../assets/materials/dungeon/wall-materials/generated-manor-wainscoting-with-raised-rectangular-rust-brown-panels-and-ornate-crown-molding-bevels-with-a-heavy-dark-oak-chair-rail-dividing-the-upper-and-lower-sections-00001/wall_ormh.ktx2',
    shading: {
      roughness: 0.62,
      metalness: 0.02,
    },
  },
} as const satisfies Record<string, WallStyleMaterialDefinition>

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
