import { useMemo, type JSX } from 'react'
import { useGLTF } from '@react-three/drei'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'
import { resolveKayKitModelAssetUrl } from '../shared/createKayKitAsset'

export type SteppedOutdoorTerrainAssetKey =
  | 'block-2'
  | 'block-4x2-2'
  | 'block-4x4-2'
  | 'block-8x4-2'
  | 'block-8x8-2'
  | 'block-12x6-2'
  | 'block-12x12-2'
  | 'block-4'
  | 'block-4x2-4'
  | 'block-4x4-4'
  | 'block-8x4-4'
  | 'block-8x8-4'
  | 'block-12x6-4'
  | 'block-12x12-4'
  | 'block-8'
  | 'block-4x2-8'
  | 'block-4x4-8'
  | 'block-8x4-8'
  | 'block-8x8-8'
  | 'block-12x6-8'
  | 'block-12x12-8'
  | 'top-center'
  | 'top-north'
  | 'top-west'
  | 'top-east'
  | 'top-south'
  | 'top-north-west'
  | 'top-north-east'
  | 'top-south-west'
  | 'top-south-east'
  | 'cliff-north'
  | 'cliff-west'
  | 'cliff-east'
  | 'cliff-south'
  | 'cliff-north-west'
  | 'cliff-north-east'
  | 'cliff-south-west'
  | 'cliff-south-east'
  | 'cliff-tall-north'
  | 'cliff-tall-west'
  | 'cliff-tall-east'
  | 'cliff-tall-south'
  | 'cliff-tall-north-west'
  | 'cliff-tall-north-east'
  | 'cliff-tall-south-west'
  | 'cliff-tall-south-east'

type TerrainAssetDefinition = {
  key: SteppedOutdoorTerrainAssetKey
  modelName: string
  family: 'top' | 'cliff' | 'cliff-tall'
}

export const STEPPED_OUTDOOR_TERRAIN_ASSETS: Record<SteppedOutdoorTerrainAssetKey, TerrainAssetDefinition> = {
  'block-2': { key: 'block-2', modelName: 'Hill_2x2x2_Color1', family: 'top' },
  'block-4x2-2': { key: 'block-4x2-2', modelName: 'Hill_4x2x2_Color1', family: 'top' },
  'block-4x4-2': { key: 'block-4x4-2', modelName: 'Hill_4x4x2_Color1', family: 'top' },
  'block-8x4-2': { key: 'block-8x4-2', modelName: 'Hill_8x4x2_Color1', family: 'top' },
  'block-8x8-2': { key: 'block-8x8-2', modelName: 'Hill_8x8x2_Color1', family: 'top' },
  'block-12x6-2': { key: 'block-12x6-2', modelName: 'Hill_12x6x2_Color1', family: 'top' },
  'block-12x12-2': { key: 'block-12x12-2', modelName: 'Hill_12x12x2_Color1', family: 'top' },
  'block-4': { key: 'block-4', modelName: 'Hill_2x2x4_Color1', family: 'top' },
  'block-4x2-4': { key: 'block-4x2-4', modelName: 'Hill_4x2x4_Color1', family: 'top' },
  'block-4x4-4': { key: 'block-4x4-4', modelName: 'Hill_4x4x4_Color1', family: 'top' },
  'block-8x4-4': { key: 'block-8x4-4', modelName: 'Hill_8x4x4_Color1', family: 'top' },
  'block-8x8-4': { key: 'block-8x8-4', modelName: 'Hill_8x8x4_Color1', family: 'top' },
  'block-12x6-4': { key: 'block-12x6-4', modelName: 'Hill_12x6x4_Color1', family: 'top' },
  'block-12x12-4': { key: 'block-12x12-4', modelName: 'Hill_12x12x4_Color1', family: 'top' },
  'block-8': { key: 'block-8', modelName: 'Hill_2x2x8_Color1', family: 'top' },
  'block-4x2-8': { key: 'block-4x2-8', modelName: 'Hill_4x2x8_Color1', family: 'top' },
  'block-4x4-8': { key: 'block-4x4-8', modelName: 'Hill_4x4x8_Color1', family: 'top' },
  'block-8x4-8': { key: 'block-8x4-8', modelName: 'Hill_8x4x8_Color1', family: 'top' },
  'block-8x8-8': { key: 'block-8x8-8', modelName: 'Hill_8x8x8_Color1', family: 'top' },
  'block-12x6-8': { key: 'block-12x6-8', modelName: 'Hill_12x6x8_Color1', family: 'top' },
  'block-12x12-8': { key: 'block-12x12-8', modelName: 'Hill_12x12x8_Color1', family: 'top' },
  'top-center': { key: 'top-center', modelName: 'Hill_Top_E_Center_Color1', family: 'top' },
  'top-north': { key: 'top-north', modelName: 'Hill_Top_B_Side_Color1', family: 'top' },
  'top-west': { key: 'top-west', modelName: 'Hill_Top_D_Side_Color1', family: 'top' },
  'top-east': { key: 'top-east', modelName: 'Hill_Top_F_Side_Color1', family: 'top' },
  'top-south': { key: 'top-south', modelName: 'Hill_Top_H_Side_Color1', family: 'top' },
  'top-north-west': { key: 'top-north-west', modelName: 'Hill_Top_A_OuterCorner_Color1', family: 'top' },
  'top-north-east': { key: 'top-north-east', modelName: 'Hill_Top_C_OuterCorner_Color1', family: 'top' },
  'top-south-west': { key: 'top-south-west', modelName: 'Hill_Top_G_OuterCorner_Color1', family: 'top' },
  'top-south-east': { key: 'top-south-east', modelName: 'Hill_Top_I_OuterCorner_Color1', family: 'top' },
  'cliff-north': { key: 'cliff-north', modelName: 'Hill_Cliff_B_Side_Color1', family: 'cliff' },
  'cliff-west': { key: 'cliff-west', modelName: 'Hill_Cliff_D_Side_Color1', family: 'cliff' },
  'cliff-east': { key: 'cliff-east', modelName: 'Hill_Cliff_F_Side_Color1', family: 'cliff' },
  'cliff-south': { key: 'cliff-south', modelName: 'Hill_Cliff_H_Side_Color1', family: 'cliff' },
  'cliff-north-west': { key: 'cliff-north-west', modelName: 'Hill_Cliff_A_OuterCorner_Color1', family: 'cliff' },
  'cliff-north-east': { key: 'cliff-north-east', modelName: 'Hill_Cliff_C_OuterCorner_Color1', family: 'cliff' },
  'cliff-south-west': { key: 'cliff-south-west', modelName: 'Hill_Cliff_G_OuterCorner_Color1', family: 'cliff' },
  'cliff-south-east': { key: 'cliff-south-east', modelName: 'Hill_Cliff_I_OuterCorner_Color1', family: 'cliff' },
  'cliff-tall-north': { key: 'cliff-tall-north', modelName: 'Hill_Cliff_Tall_B_Side_Color1', family: 'cliff-tall' },
  'cliff-tall-west': { key: 'cliff-tall-west', modelName: 'Hill_Cliff_Tall_D_Side_Color1', family: 'cliff-tall' },
  'cliff-tall-east': { key: 'cliff-tall-east', modelName: 'Hill_Cliff_Tall_F_Side_Color1', family: 'cliff-tall' },
  'cliff-tall-south': { key: 'cliff-tall-south', modelName: 'Hill_Cliff_Tall_H_Side_Color1', family: 'cliff-tall' },
  'cliff-tall-north-west': { key: 'cliff-tall-north-west', modelName: 'Hill_Cliff_Tall_A_OuterCorner_Color1', family: 'cliff-tall' },
  'cliff-tall-north-east': { key: 'cliff-tall-north-east', modelName: 'Hill_Cliff_Tall_C_OuterCorner_Color1', family: 'cliff-tall' },
  'cliff-tall-south-west': { key: 'cliff-tall-south-west', modelName: 'Hill_Cliff_Tall_G_OuterCorner_Color1', family: 'cliff-tall' },
  'cliff-tall-south-east': { key: 'cliff-tall-south-east', modelName: 'Hill_Cliff_Tall_I_OuterCorner_Color1', family: 'cliff-tall' },
}

const TERRAIN_ASSET_URLS = Object.fromEntries(
  Object.entries(STEPPED_OUTDOOR_TERRAIN_ASSETS).map(([key, definition]) => [
    key,
    resolveKayKitModelAssetUrl(definition.modelName),
  ]),
) as Record<SteppedOutdoorTerrainAssetKey, string>

Object.values(TERRAIN_ASSET_URLS).forEach((assetUrl) => {
  useGLTF.preload(assetUrl)
})

export function resolveSteppedOutdoorTerrainAssetUrl(key: SteppedOutdoorTerrainAssetKey) {
  return TERRAIN_ASSET_URLS[key]
}

export function SteppedOutdoorTerrainAsset({
  assetKey,
  ...props
}: JSX.IntrinsicElements['group'] & { assetKey: SteppedOutdoorTerrainAssetKey }) {
  const assetUrl = TERRAIN_ASSET_URLS[assetKey]
  const gltf = useGLTF(assetUrl)
  const scene = useMemo(() => cloneSceneWithNodeMaterials(gltf.scene), [gltf.scene])

  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  )
}
