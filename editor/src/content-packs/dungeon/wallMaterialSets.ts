import type { ContentPackWallMaterialSet } from '../types'

const generatedWallMaterialSetModules = import.meta.glob('./generated/wallMaterialSets/*.ts', {
  eager: true,
}) as Record<string, { wallMaterialSet: ContentPackWallMaterialSet }>

const generatedWallMaterialSets = Object.values(generatedWallMaterialSetModules)
  .map((module) => module.wallMaterialSet)
  .sort((left, right) => left.name.localeCompare(right.name))

export const dungeonWallMaterialSets: ContentPackWallMaterialSet[] = generatedWallMaterialSets
