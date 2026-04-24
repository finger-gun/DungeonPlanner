import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

const kaykitForestSourceDir =
  'forrest-assets-tmp/KayKit_Forest_Nature_Pack_1.0_EXTRA/Assets/gltf'

const kaykitTerrainStyles = [
  'Color1',
  'Color2',
  'Color3',
  'Color4',
  'Color5',
  'Color6',
  'Color7',
  'Color8',
]

const kaykitGrassPatchUv = {
  minU: 0.03,
  maxU: 0.062,
  minV: 0.072,
  maxV: 0.108,
}

const kaykitGrassStripUv = {
  minU: 0.0354,
  maxU: 0.0559,
  v: 0.0894,
}

function getKaykitStyleIndex(style) {
  return Number.parseInt(style.replace('Color', ''), 10) - 1
}

function getKaykitGrassPatchUvForStyle(style) {
  const offset = getKaykitStyleIndex(style) * 0.125
  return {
    ...kaykitGrassPatchUv,
    minU: kaykitGrassPatchUv.minU + offset,
    maxU: kaykitGrassPatchUv.maxU + offset,
  }
}

function getKaykitGrassStripUvForStyle(style) {
  const offset = getKaykitStyleIndex(style) * 0.125
  return {
    ...kaykitGrassStripUv,
    minU: kaykitGrassStripUv.minU + offset,
    maxU: kaykitGrassStripUv.maxU + offset,
  }
}

const kaykitTerrainAssetBaseNames = [
  'Hill_2x2x2',
  'Hill_4x2x2',
  'Hill_4x4x2',
  'Hill_8x4x2',
  'Hill_8x8x2',
  'Hill_12x6x2',
  'Hill_12x12x2',
  'Hill_2x2x4',
  'Hill_4x2x4',
  'Hill_4x4x4',
  'Hill_8x4x4',
  'Hill_8x8x4',
  'Hill_12x6x4',
  'Hill_12x12x4',
  'Hill_2x2x8',
  'Hill_4x2x8',
  'Hill_4x4x8',
  'Hill_8x4x8',
  'Hill_8x8x8',
  'Hill_12x6x8',
  'Hill_12x12x8',
  'Hill_Top_E_Center',
  'Hill_Top_B_Side',
  'Hill_Top_D_Side',
  'Hill_Top_F_Side',
  'Hill_Top_H_Side',
  'Hill_Top_A_OuterCorner',
  'Hill_Top_C_OuterCorner',
  'Hill_Top_G_OuterCorner',
  'Hill_Top_I_OuterCorner',
  'Hill_Cliff_B_Side',
  'Hill_Cliff_D_Side',
  'Hill_Cliff_F_Side',
  'Hill_Cliff_H_Side',
  'Hill_Cliff_A_OuterCorner',
  'Hill_Cliff_C_OuterCorner',
  'Hill_Cliff_G_OuterCorner',
  'Hill_Cliff_I_OuterCorner',
  'Hill_Cliff_Tall_B_Side',
  'Hill_Cliff_Tall_D_Side',
  'Hill_Cliff_Tall_F_Side',
  'Hill_Cliff_Tall_H_Side',
  'Hill_Cliff_Tall_A_OuterCorner',
  'Hill_Cliff_Tall_C_OuterCorner',
  'Hill_Cliff_Tall_G_OuterCorner',
  'Hill_Cliff_Tall_I_OuterCorner',
]

const kaykitTerrainAssetNames = kaykitTerrainStyles.flatMap((style) => (
  kaykitTerrainAssetBaseNames.map((name) => `${style}/${name}_${style}.gltf`)
))

function listKaykitForestAssetNames(sourceDir) {
  const absoluteSourceDir = path.resolve(sourceDir)
  if (!existsSync(absoluteSourceDir)) {
    return kaykitTerrainAssetNames
  }

  const assetNames = []
  const pendingDirs = ['']
  while (pendingDirs.length > 0) {
    const relativeDir = pendingDirs.pop()
    const absoluteDir = path.join(absoluteSourceDir, relativeDir)
    for (const entry of readdirSync(absoluteDir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) {
        continue
      }

      const relativePath = path.join(relativeDir, entry.name)
      if (entry.isDirectory()) {
        pendingDirs.push(relativePath)
        continue
      }

      if (!entry.name.endsWith('.gltf')) {
        continue
      }

      const normalizedPath = relativePath.replace(/\\/g, '/')
      if (!normalizedPath.startsWith('Color')) {
        continue
      }

      assetNames.push(normalizedPath)
    }
  }

  return assetNames.sort((left, right) => left.localeCompare(right))
}

const kaykitForestAssetNames = listKaykitForestAssetNames(kaykitForestSourceDir)

const kaykitPreservedArtifacts = kaykitTerrainStyles.flatMap((style) => [
  `${style}/forest_grass_patch.png`,
])

const kaykitDerivedTextures = kaykitTerrainStyles.map((style) => ({
  source: `${style}/forest_texture.png`,
  output: `${style}/forest_grass_patch.png`,
  cropUv: getKaykitGrassPatchUvForStyle(style),
  phase: 'pre-optimize',
  sampleMode: 'strip',
  sampleStripUv: getKaykitGrassStripUvForStyle(style),
  sampleBandHeightPx: 4,
  outputSize: 32,
}))

export const corePackAssetNames = [
  'floor',
  'floor_001',
  'floor_002',
  'floor_003',
  'floor_004',
  'floor_005',
  'floor_006',
  'floor_007',
  'props_wall_torch',
  'wall',
  'wall_001',
  'wall_002',
  'wall_003',
  'wall_004',
  'wall_005',
]

export const modelPackConfigs = {
  core: {
    sourceDirEnv: 'DUNGEONPLANNER_CORE_SOURCE_DIR',
    targetDir: path.join('src', 'assets', 'models', 'core'),
    include: corePackAssetNames.map((name) => `${name}.glb`),
    clean: true,
  },
  kaykit: {
    sourceDir: kaykitForestSourceDir,
    targetDir: path.join('src', 'assets', 'models', 'forrest'),
    include: kaykitForestAssetNames,
    preserveArtifacts: kaykitPreservedArtifacts,
    derivedTextures: kaykitDerivedTextures,
    convertToGlb: true,
    clean: true,
  },
}
