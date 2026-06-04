import type { ContentPackWallMaterialSet } from '../types'
import { dungeonWallStyleMaterials } from './wallStyleProfiles'

const wallMaterialAssetUrls = import.meta.glob(
  '../../assets/materials/dungeon/wall-materials/**/*.{png,jpg,jpeg,webp,avif,ktx2}',
  {
    eager: true,
    import: 'default',
  },
) as Record<string, string>

const generatedWallMaterialSetModules = import.meta.glob('./generated/wallMaterialSets/*.ts', {
  eager: true,
}) as Record<string, { wallMaterialSet: ContentPackWallMaterialSet }>

const generatedWallMaterialSets = Object.values(generatedWallMaterialSetModules)
  .map((module) => module.wallMaterialSet)
  .sort((left, right) => left.name.localeCompare(right.name))

function resolveAssetUrl(relativePath: string) {
  const assetUrl = wallMaterialAssetUrls[relativePath]
  if (!assetUrl) {
    throw new Error(`Unknown dungeon wall material asset "${relativePath}"`)
  }

  return assetUrl
}

function createBuiltinWallMaterialSet(
  id: string,
  name: string,
): ContentPackWallMaterialSet {
  const definition = dungeonWallStyleMaterials[id]
  if (!definition) {
    throw new Error(`Unknown dungeon wall style material "${id}"`)
  }

  return {
    id,
    name,
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

const builtinDungeonWallMaterialSets: ContentPackWallMaterialSet[] = [
  createBuiltinWallMaterialSet('kaykit-stone', 'KayKit Stone'),
  createBuiltinWallMaterialSet('wedged-cobblestone', 'Wedged Cobblestone'),
  createBuiltinWallMaterialSet('rough-rockface-1-pbr-material', 'Rough Rockface 1'),
  createBuiltinWallMaterialSet('ai-gothic-depth-wall', 'AI Gothic Depth Wall'),
  createBuiltinWallMaterialSet('classy-art-deco-wallpaper', 'Classy Art Deco Wallpaper'),
  createBuiltinWallMaterialSet('modern-brick1', 'Modern Brick1'),
  createBuiltinWallMaterialSet('tavern-wood-planks', 'Tavern Wood Planks'),
]

export const dungeonWallMaterialSets: ContentPackWallMaterialSet[] = [
  ...builtinDungeonWallMaterialSets,
  ...generatedWallMaterialSets.filter((set) => !builtinDungeonWallMaterialSets.some((builtin) => builtin.id === set.id)),
]
