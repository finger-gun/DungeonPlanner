import path from 'node:path'

const kaykitForestColor1SourceDir =
  'forrest-assets-tmp/KayKit_Forest_Nature_Pack_1.0_EXTRA/Assets/gltf/Color1'

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

const kaykitTerrainAssetNames = [
  'Hill_2x2x2_Color1',
  'Hill_4x2x2_Color1',
  'Hill_4x4x2_Color1',
  'Hill_8x4x2_Color1',
  'Hill_8x8x2_Color1',
  'Hill_12x6x2_Color1',
  'Hill_12x12x2_Color1',
  'Hill_2x2x4_Color1',
  'Hill_4x2x4_Color1',
  'Hill_4x4x4_Color1',
  'Hill_8x4x4_Color1',
  'Hill_8x8x4_Color1',
  'Hill_12x6x4_Color1',
  'Hill_12x12x4_Color1',
  'Hill_2x2x8_Color1',
  'Hill_4x2x8_Color1',
  'Hill_4x4x8_Color1',
  'Hill_8x4x8_Color1',
  'Hill_8x8x8_Color1',
  'Hill_12x6x8_Color1',
  'Hill_12x12x8_Color1',
  'Hill_Top_E_Center_Color1',
  'Hill_Top_B_Side_Color1',
  'Hill_Top_D_Side_Color1',
  'Hill_Top_F_Side_Color1',
  'Hill_Top_H_Side_Color1',
  'Hill_Top_A_OuterCorner_Color1',
  'Hill_Top_C_OuterCorner_Color1',
  'Hill_Top_G_OuterCorner_Color1',
  'Hill_Top_I_OuterCorner_Color1',
  'Hill_Cliff_B_Side_Color1',
  'Hill_Cliff_D_Side_Color1',
  'Hill_Cliff_F_Side_Color1',
  'Hill_Cliff_H_Side_Color1',
  'Hill_Cliff_A_OuterCorner_Color1',
  'Hill_Cliff_C_OuterCorner_Color1',
  'Hill_Cliff_G_OuterCorner_Color1',
  'Hill_Cliff_I_OuterCorner_Color1',
  'Hill_Cliff_Tall_B_Side_Color1',
  'Hill_Cliff_Tall_D_Side_Color1',
  'Hill_Cliff_Tall_F_Side_Color1',
  'Hill_Cliff_Tall_H_Side_Color1',
  'Hill_Cliff_Tall_A_OuterCorner_Color1',
  'Hill_Cliff_Tall_C_OuterCorner_Color1',
  'Hill_Cliff_Tall_G_OuterCorner_Color1',
  'Hill_Cliff_Tall_I_OuterCorner_Color1',
]

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
    sourceDir: kaykitForestColor1SourceDir,
    targetDir: path.join('src', 'assets', 'models', 'forrest'),
    include: kaykitTerrainAssetNames.map((name) => `${name}.gltf`),
    preserveArtifacts: ['forest_grass_patch.png'],
    derivedTextures: [
      {
        source: 'forest_texture.ktx2',
        output: 'forest_grass_patch.png',
        cropUv: kaykitGrassPatchUv,
        phase: 'post-optimize',
        transcode: 'rgba8',
        sampleMode: 'strip',
        sampleStripUv: kaykitGrassStripUv,
        sampleBandHeightPx: 4,
        outputSize: 32,
      },
    ],
    clean: true,
  },
}
