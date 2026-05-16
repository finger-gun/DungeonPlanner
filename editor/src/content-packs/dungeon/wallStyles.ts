import type {
  ContentPackWallStyle,
  ContentPackWallStyleInsertAnchor,
  ContentPackWallStyleMaterial,
  ContentPackWallStyleProfile,
} from '../types'

function resolveAssetUrl(relativePath: string) {
  return new URL(relativePath, import.meta.url).href
}

function createMaterial({
  albedoPath,
  normalPath,
  aoPath,
  heightPath,
  roughnessPath,
  metallicPath,
  shading,
  uv,
}: {
  albedoPath: string
  normalPath?: string
  aoPath?: string
  heightPath?: string
  roughnessPath?: string
  metallicPath?: string
  shading?: ContentPackWallStyleMaterial['shading']
  uv?: ContentPackWallStyleMaterial['uv']
}): ContentPackWallStyleMaterial {
  return {
    textures: {
      albedoUrl: resolveAssetUrl(albedoPath),
      ...(normalPath ? { normalUrl: resolveAssetUrl(normalPath) } : {}),
      ...(aoPath ? { aoUrl: resolveAssetUrl(aoPath) } : {}),
      ...(heightPath ? { heightUrl: resolveAssetUrl(heightPath) } : {}),
      ...(roughnessPath ? { roughnessUrl: resolveAssetUrl(roughnessPath) } : {}),
      ...(metallicPath ? { metallicUrl: resolveAssetUrl(metallicPath) } : {}),
    },
    ...(shading ? { shading } : {}),
    ...(uv ? { uv } : {}),
  }
}

function createProfile(points: readonly (readonly [number, number])[]): ContentPackWallStyleProfile {
  return { points }
}

function createInsertRule(assetId: string, anchors: readonly ContentPackWallStyleInsertAnchor[], interval?: number) {
  return {
    assetId,
    anchors,
    ...(typeof interval === 'number' ? { interval } : {}),
  }
}

export const DEFAULT_DUNGEON_WALL_STYLE_ID = 'art-deco-cobblestone'

export const dungeonWallStyles: ContentPackWallStyle[] = [
  {
    id: 'art-deco-cobblestone',
    name: 'Art Deco Cobblestone',
    previewImageUrl: resolveAssetUrl('../../assets/materials/dungeon/wall-materials/classy-art-deco-wallpaper/classy-art-deco-wallpaper_preview.png'),
    structuralCore: {
      profile: createProfile([
        [-0.18, 0],
        [-0.18, 1],
        [0.25, 1],
        [0.25, 0.8625],
        [0.125, 0.8],
        [0.125, 0.125],
        [0.25, 0.0625],
        [0.25, 0],
      ]),
      material: createMaterial({
        albedoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png',
        normalPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_normal.png',
        aoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_ao.png',
        shading: {
          tintColor: '#ffffff',
          roughness: 0.45,
          metalness: 0,
          topSurfaceColor: '#514a42',
          topSurfaceRoughness: 0.82,
        },
      }),
      render: {
        hiddenProfileSegmentIndices: [0, 1, 2, 3, 4, 5, 6],
      },
    },
    roomFace: {
      profile: createProfile([
        [-0.181, 0.48],
        [-0.181, 1],
      ]),
      material: createMaterial({
        albedoPath: '../../assets/materials/dungeon/wall-materials/modern-brick1/modern-brick1_albedo.png',
        normalPath: '../../assets/materials/dungeon/wall-materials/modern-brick1/modern-brick1_normal-ogl.png',
        aoPath: '../../assets/materials/dungeon/wall-materials/modern-brick1/modern-brick1_ao.png',
        heightPath: '../../assets/materials/dungeon/wall-materials/modern-brick1/modern-brick1_height.png',
        shading: {
          tintColor: '#ffffff',
          roughness: 0.72,
          metalness: 0,
        },
      }),
    },
    roomFaceDetails: [
      {
        profile: createProfile([
          [-0.245, 0],
          [-0.245, 0.48],
          [-0.181, 0.48],
        ]),
        material: createMaterial({
          albedoPath: '../../assets/materials/dungeon/wall-materials/tavern-wood-planks/tavern-wood-planks1_albedo.png',
          normalPath: '../../assets/materials/dungeon/wall-materials/tavern-wood-planks/tavern-wood-planks1_normal-ogl.png',
          aoPath: '../../assets/materials/dungeon/wall-materials/tavern-wood-planks/tavern-wood-planks1_ao.png',
          heightPath: '../../assets/materials/dungeon/wall-materials/tavern-wood-planks/tavern-wood-planks1_height.png',
          shading: {
            tintColor: '#ffffff',
            roughness: 0.66,
            metalness: 0,
          },
        }),
      },
    ],
    exteriorFace: {
      profile: createProfile([
        [0.25, 0],
        [0.25, 0.0625],
        [0.125, 0.125],
        [0.125, 0.8],
        [0.25, 0.8625],
        [0.25, 1],
      ]),
      material: createMaterial({
        albedoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png',
        shading: {
          tintColor: '#aaaaaa',
          roughness: 0.45,
          metalness: 0,
        },
        uv: {
          verticalMode: 'fit-height',
        },
      }),
    },
    joinMode: 'cover-piece',
    inserts: [
      createInsertRule('dungeon.props_pillars_pillar', ['start', 'end', 'convex-corner', 'curvature-change']),
      createInsertRule('dungeon.props_pillars_pillar', ['interval'], 3),
    ],
    curvatureLimits: {
      minInnerRadius: 1.5,
      maxTurnDegrees: 120,
    },
    openingRules: {
      defaultMode: 'structural',
      supportedModes: ['framed', 'structural'],
      supportedKinds: ['door', 'window', 'passage'],
      compatibleAssetIds: ['core.opening_door_custom', 'core.opening_door_wall_1', 'dungeon.wall_wall_opening'],
    },
  },
  {
    id: 'stone-keep',
    name: 'Stone Keep',
    previewImageUrl: resolveAssetUrl('../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png'),
    structuralCore: {
      profile: createProfile([
        [-0.22, 0],
        [-0.22, 1],
        [0.22, 1],
        [0.22, 0],
      ]),
      material: createMaterial({
        albedoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png',
        aoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_ao.png',
        shading: {
          tintColor: '#d7dde8',
          roughness: 0.35,
          metalness: 0.15,
          topSurfaceColor: '#2f3442',
          topSurfaceRoughness: 0.7,
        },
      }),
    },
    roomFace: {
      profile: createProfile([
        [-0.06, 0],
        [-0.08, 0.2],
        [-0.08, 0.78],
        [-0.02, 0.9],
        [0, 1],
      ]),
      material: createMaterial({
        albedoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png',
        shading: {
          tintColor: '#cfd6df',
          
          roughness: 0.28,
          metalness: 0.1,
        },
      }),
    },
    exteriorFace: {
      profile: createProfile([
        [0, 0],
        [0.06, 0.15],
        [0.14, 0.72],
        [0.08, 0.88],
        [0.18, 1],
      ]),
      material: createMaterial({
        albedoPath: '../../assets/materials/dungeon/wall-materials/wedged-cobblestone/wall_albedo.png',
        normalPath: '../../assets/materials/dungeon/wall-materials/wedged-cobblestone/wall_normal.png',
        aoPath: '../../assets/materials/dungeon/wall-materials/wedged-cobblestone/wall_ao.png',
        heightPath: '../../assets/materials/dungeon/wall-materials/wedged-cobblestone/wall_height.png',
        shading: {
          tintColor: '#ffffff',
          roughness: 0.52,
          metalness: 0.08,
        },
      }),
    },
    joinMode: 'cover-piece',
    inserts: [
      createInsertRule('dungeon.props_pillars_pillar', ['start', 'end', 'convex-corner', 'curvature-change']),
      createInsertRule('dungeon.props_pillars_pillar', ['interval'], 3),
    ],
    curvatureLimits: {
      minInnerRadius: 1.2,
      maxTurnDegrees: 135,
    },
    openingRules: {
      defaultMode: 'structural',
      supportedModes: ['framed', 'structural'],
      supportedKinds: ['door', 'window', 'passage'],
      compatibleAssetIds: ['core.opening_door_custom', 'core.opening_door_wall_1', 'dungeon.wall_wall_opening'],
    },
  },
  {
    id: 'manor-plaster',
    name: 'Manor Plaster',
    previewImageUrl: resolveAssetUrl('../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png'),
    structuralCore: {
      profile: createProfile([
        [-0.18, 0],
        [-0.18, 1],
        [0.18, 1],
        [0.18, 0],
      ]),
      material: createMaterial({
        albedoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png',
        shading: {
          tintColor: '#ff0000',
          roughness: 0.48,
          metalness: 0.02,
          topSurfaceColor: '#6a5949',
          topSurfaceRoughness: 0.75,
        },
      }),
    },
    roomFace: {
      profile: createProfile([
        [-0.02, 0],
        [-0.04, 0.28],
        [-0.01, 0.82],
        [0, 1],
      ]),
      material: createMaterial({
        albedoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png',
        shading: {
          tintColor: '#efe7db',
          roughness: 0.62,
          metalness: 0,
        },
      }),
    },
    exteriorFace: {
      profile: createProfile([
        [0, 0],
        [0.04, 0.22],
        [0.12, 0.84],
        [0.1, 1],
      ]),
      material: createMaterial({
        albedoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png',
        normalPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_normal.png',
        aoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_ao.png',
        heightPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_roughness.png',
        shading: {
          tintColor: '#b19074',
          roughness: 0.55,
          metalness: 0.03,
        },
      }),
    },
    joinMode: 'bevel',
    inserts: [
      createInsertRule('dungeon.props_pillars_pillar', ['start', 'end', 'convex-corner']),
    ],
    curvatureLimits: {
      minInnerRadius: 1.5,
      maxTurnDegrees: 120,
    },
    openingRules: {
      defaultMode: 'sleeve',
      supportedModes: ['framed', 'sleeve'],
      supportedKinds: ['door', 'window', 'passage'],
      compatibleAssetIds: ['core.opening_door_custom', 'core.opening_door_wall_1', 'dungeon.wall_wall_opening'],
    },
  },
]
