import { createGeneratedFloorMaterialAsset } from './shared/createGeneratedFloorMaterialAsset'
import type { ContentPackAsset } from '../types'

const generatedFloorMaterialModules = import.meta.glob('./generated/floorMaterials/*.ts', {
  eager: true,
}) as Record<string, { floorMaterial: Parameters<typeof createGeneratedFloorMaterialAsset>[0] }>

export const dungeonGeneratedFloorAssets: ContentPackAsset[] = Object.values(generatedFloorMaterialModules)
  .map((module) => createGeneratedFloorMaterialAsset(module.floorMaterial))
  .sort((left, right) => left.name.localeCompare(right.name))
