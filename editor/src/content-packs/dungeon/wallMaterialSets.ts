import type { ContentPackWallMaterialSet } from '../types'

function resolveAssetUrl(relativePath: string) {
  return new URL(relativePath, import.meta.url).href
}

function createWallMaterialSet({
  id,
  name,
  previewImagePath,
  albedoPath,
  normalPath,
  aoPath,
  heightPath,
  roughnessPath,
  metallicPath,
  shading,
}: {
  id: string
  name: string
  previewImagePath?: string
  albedoPath: string
  normalPath?: string
  aoPath?: string
  heightPath?: string
  roughnessPath?: string
  metallicPath?: string
  shading?: ContentPackWallMaterialSet['shading']
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
      ...(roughnessPath ? { roughnessUrl: resolveAssetUrl(roughnessPath) } : {}),
      ...(metallicPath ? { metallicUrl: resolveAssetUrl(metallicPath) } : {}),
    },
    ...(shading ? { shading } : {}),
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
    aoPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png',
    normalPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_normal.png',
    roughnessPath: '../../assets/materials/dungeon/wall-materials/kaykit-stone/wall_albedo.png',
    shading: {
      //tintColor: '#ffffff',
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
  ...generatedWallMaterialSets,
]
