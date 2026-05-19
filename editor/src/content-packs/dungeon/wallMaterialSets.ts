import type { ContentPackWallMaterialSet } from '../types'

const wallMaterialAssetUrls = import.meta.glob(
  '../../assets/materials/dungeon/wall-materials/**/*.{png,jpg,jpeg,webp,avif}',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, string>

function resolveAssetUrl(relativePath: string) {
  const assetUrl = wallMaterialAssetUrls[relativePath]
  if (!assetUrl) {
    throw new Error(`Unknown dungeon wall material asset "${relativePath}"`)
  }

  return assetUrl
}

function createWallMaterialSet({
  id,
  name,
  previewImagePath,
  albedoPath,
  normalPath,
  aoPath,
  heightPath,
  displacementPath,
  roughnessPath,
  metallicPath,
  shading,
  uv,
}: {
  id: string
  name: string
  previewImagePath?: string
  albedoPath: string
  normalPath?: string
  aoPath?: string
  heightPath?: string
  displacementPath?: string
  roughnessPath?: string
  metallicPath?: string
  shading?: ContentPackWallMaterialSet['shading']
  uv?: ContentPackWallMaterialSet['uv']
}): ContentPackWallMaterialSet {
  const albedoUrl = resolveAssetUrl(albedoPath)

  return {
    id,
    name,
    previewImageUrl: resolveAssetUrl(previewImagePath ?? albedoPath),
    textures: {
      albedoUrl,
      ...(normalPath ? { normalUrl: resolveAssetUrl(normalPath) } : {}),
      ...(aoPath ? { aoUrl: resolveAssetUrl(aoPath) } : {}),
      ...(heightPath ? { heightUrl: resolveAssetUrl(heightPath) } : {}),
      ...(displacementPath ? { displacementUrl: resolveAssetUrl(displacementPath) } : {}),
      ...(roughnessPath ? { roughnessUrl: resolveAssetUrl(roughnessPath) } : {}),
      ...(metallicPath ? { metallicUrl: resolveAssetUrl(metallicPath) } : {}),
    },
    ...(shading ? { shading } : {}),
    ...(uv ? { uv } : {}),
  }
}

const generatedWallMaterialSetModules = import.meta.glob('./generated/wallMaterialSets/*.ts', {
  eager: true,
}) as Record<string, { wallMaterialSet: ContentPackWallMaterialSet }>

const generatedWallMaterialSets = Object.values(generatedWallMaterialSetModules)
  .map((module) => module.wallMaterialSet)
  .sort((left, right) => left.name.localeCompare(right.name))

export const dungeonWallMaterialSets: ContentPackWallMaterialSet[] = [
  createWallMaterialSet({
    id: 'kaykit-stone',
    name: 'KayKit Stone',
    albedoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png',
    shading: {
      tintColor: '#ffffff',
      roughness: 0.45,
      metalness: 0,
      topSurfaceColor: '#2f3442',
      topSurfaceRoughness: 0.7,
    },
  }),
  createWallMaterialSet({
    id: 'wedged-cobblestone',
    name: 'Wedged Cobblestone',
    albedoPath: '../../assets/materials/dungeon/wall-materials/wedged-cobblestone/wall_albedo.png',
    normalPath: '../../assets/materials/dungeon/wall-materials/wedged-cobblestone/wall_normal.png',
    aoPath: '../../assets/materials/dungeon/wall-materials/wedged-cobblestone/wall_ao.png',
    heightPath: '../../assets/materials/dungeon/wall-materials/wedged-cobblestone/wall_height.png',
  }),
  createWallMaterialSet({
    id: 'ai-gothic-depth-wall',
    name: 'AI Gothic Depth Wall',
    albedoPath: '../../assets/materials/dungeon/wall-materials/ai-gothic-depth-wall/wall_albedo.png',
    normalPath: '../../assets/materials/dungeon/wall-materials/ai-gothic-depth-wall/wall_normal.png',
    aoPath: '../../assets/materials/dungeon/wall-materials/ai-gothic-depth-wall/wall_ao.png',
    heightPath: '../../assets/materials/dungeon/wall-materials/ai-gothic-depth-wall/wall_height.png',
    roughnessPath: '../../assets/materials/dungeon/wall-materials/ai-gothic-depth-wall/wall_roughness.png',
    shading: {
      roughness: 0.86,
      metalness: 0,
      bumpScale: 0.08,
      parallaxScale: 0.055,
      parallaxSteps: 10,
      parallaxInvert: true,
      aoMapIntensity: 0.65,
      topSurfaceColor: '#262a31',
      topSurfaceRoughness: 0.82,
      topSurfaceMetalness: 0,
    },
    uv: {
      verticalMode: 'fit-height',
      verticalWrap: 'clamp',
    },
  }),
  ...generatedWallMaterialSets,
]
