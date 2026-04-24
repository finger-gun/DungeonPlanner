import { useMemo, type JSX } from 'react'
import * as THREE from 'three'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'
import { useGLTF } from '../../../rendering/useGLTF'
import { OUTDOOR_TERRAIN_STYLES, type OutdoorTerrainStyle } from '../../../store/outdoorTerrainStyles'
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
  modelBaseName: string
  family: 'top' | 'cliff' | 'cliff-tall'
}

export const STEPPED_OUTDOOR_TERRAIN_ASSETS: Record<SteppedOutdoorTerrainAssetKey, TerrainAssetDefinition> = {
  'block-2': { key: 'block-2', modelBaseName: 'Hill_2x2x2', family: 'top' },
  'block-4x2-2': { key: 'block-4x2-2', modelBaseName: 'Hill_4x2x2', family: 'top' },
  'block-4x4-2': { key: 'block-4x4-2', modelBaseName: 'Hill_4x4x2', family: 'top' },
  'block-8x4-2': { key: 'block-8x4-2', modelBaseName: 'Hill_8x4x2', family: 'top' },
  'block-8x8-2': { key: 'block-8x8-2', modelBaseName: 'Hill_8x8x2', family: 'top' },
  'block-12x6-2': { key: 'block-12x6-2', modelBaseName: 'Hill_12x6x2', family: 'top' },
  'block-12x12-2': { key: 'block-12x12-2', modelBaseName: 'Hill_12x12x2', family: 'top' },
  'block-4': { key: 'block-4', modelBaseName: 'Hill_2x2x4', family: 'top' },
  'block-4x2-4': { key: 'block-4x2-4', modelBaseName: 'Hill_4x2x4', family: 'top' },
  'block-4x4-4': { key: 'block-4x4-4', modelBaseName: 'Hill_4x4x4', family: 'top' },
  'block-8x4-4': { key: 'block-8x4-4', modelBaseName: 'Hill_8x4x4', family: 'top' },
  'block-8x8-4': { key: 'block-8x8-4', modelBaseName: 'Hill_8x8x4', family: 'top' },
  'block-12x6-4': { key: 'block-12x6-4', modelBaseName: 'Hill_12x6x4', family: 'top' },
  'block-12x12-4': { key: 'block-12x12-4', modelBaseName: 'Hill_12x12x4', family: 'top' },
  'block-8': { key: 'block-8', modelBaseName: 'Hill_2x2x8', family: 'top' },
  'block-4x2-8': { key: 'block-4x2-8', modelBaseName: 'Hill_4x2x8', family: 'top' },
  'block-4x4-8': { key: 'block-4x4-8', modelBaseName: 'Hill_4x4x8', family: 'top' },
  'block-8x4-8': { key: 'block-8x4-8', modelBaseName: 'Hill_8x4x8', family: 'top' },
  'block-8x8-8': { key: 'block-8x8-8', modelBaseName: 'Hill_8x8x8', family: 'top' },
  'block-12x6-8': { key: 'block-12x6-8', modelBaseName: 'Hill_12x6x8', family: 'top' },
  'block-12x12-8': { key: 'block-12x12-8', modelBaseName: 'Hill_12x12x8', family: 'top' },
  'top-center': { key: 'top-center', modelBaseName: 'Hill_Top_E_Center', family: 'top' },
  'top-north': { key: 'top-north', modelBaseName: 'Hill_Top_B_Side', family: 'top' },
  'top-west': { key: 'top-west', modelBaseName: 'Hill_Top_D_Side', family: 'top' },
  'top-east': { key: 'top-east', modelBaseName: 'Hill_Top_F_Side', family: 'top' },
  'top-south': { key: 'top-south', modelBaseName: 'Hill_Top_H_Side', family: 'top' },
  'top-north-west': { key: 'top-north-west', modelBaseName: 'Hill_Top_A_OuterCorner', family: 'top' },
  'top-north-east': { key: 'top-north-east', modelBaseName: 'Hill_Top_C_OuterCorner', family: 'top' },
  'top-south-west': { key: 'top-south-west', modelBaseName: 'Hill_Top_G_OuterCorner', family: 'top' },
  'top-south-east': { key: 'top-south-east', modelBaseName: 'Hill_Top_I_OuterCorner', family: 'top' },
  'cliff-north': { key: 'cliff-north', modelBaseName: 'Hill_Cliff_B_Side', family: 'cliff' },
  'cliff-west': { key: 'cliff-west', modelBaseName: 'Hill_Cliff_D_Side', family: 'cliff' },
  'cliff-east': { key: 'cliff-east', modelBaseName: 'Hill_Cliff_F_Side', family: 'cliff' },
  'cliff-south': { key: 'cliff-south', modelBaseName: 'Hill_Cliff_H_Side', family: 'cliff' },
  'cliff-north-west': { key: 'cliff-north-west', modelBaseName: 'Hill_Cliff_A_OuterCorner', family: 'cliff' },
  'cliff-north-east': { key: 'cliff-north-east', modelBaseName: 'Hill_Cliff_C_OuterCorner', family: 'cliff' },
  'cliff-south-west': { key: 'cliff-south-west', modelBaseName: 'Hill_Cliff_G_OuterCorner', family: 'cliff' },
  'cliff-south-east': { key: 'cliff-south-east', modelBaseName: 'Hill_Cliff_I_OuterCorner', family: 'cliff' },
  'cliff-tall-north': { key: 'cliff-tall-north', modelBaseName: 'Hill_Cliff_Tall_B_Side', family: 'cliff-tall' },
  'cliff-tall-west': { key: 'cliff-tall-west', modelBaseName: 'Hill_Cliff_Tall_D_Side', family: 'cliff-tall' },
  'cliff-tall-east': { key: 'cliff-tall-east', modelBaseName: 'Hill_Cliff_Tall_F_Side', family: 'cliff-tall' },
  'cliff-tall-south': { key: 'cliff-tall-south', modelBaseName: 'Hill_Cliff_Tall_H_Side', family: 'cliff-tall' },
  'cliff-tall-north-west': { key: 'cliff-tall-north-west', modelBaseName: 'Hill_Cliff_Tall_A_OuterCorner', family: 'cliff-tall' },
  'cliff-tall-north-east': { key: 'cliff-tall-north-east', modelBaseName: 'Hill_Cliff_Tall_C_OuterCorner', family: 'cliff-tall' },
  'cliff-tall-south-west': { key: 'cliff-tall-south-west', modelBaseName: 'Hill_Cliff_Tall_G_OuterCorner', family: 'cliff-tall' },
  'cliff-tall-south-east': { key: 'cliff-tall-south-east', modelBaseName: 'Hill_Cliff_Tall_I_OuterCorner', family: 'cliff-tall' },
}

function getTerrainModelName(modelBaseName: string, terrainStyle: OutdoorTerrainStyle) {
  return `${modelBaseName}_${terrainStyle}`
}

export function resolveSteppedOutdoorTerrainAssetUrl(
  key: SteppedOutdoorTerrainAssetKey,
  terrainStyle: OutdoorTerrainStyle = 'Color1',
) {
  return resolveKayKitModelAssetUrl(getTerrainModelName(STEPPED_OUTDOOR_TERRAIN_ASSETS[key].modelBaseName, terrainStyle))
}

export function applyTerrainShadowSettings(root: THREE.Object3D) {
  root.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.castShadow = true
      object.receiveShadow = true
    }
  })

  return root
}

for (const terrainStyle of OUTDOOR_TERRAIN_STYLES) {
  for (const assetKey of Object.keys(STEPPED_OUTDOOR_TERRAIN_ASSETS) as SteppedOutdoorTerrainAssetKey[]) {
    useGLTF.preload(resolveSteppedOutdoorTerrainAssetUrl(assetKey, terrainStyle))
  }
}

export function SteppedOutdoorTerrainAsset({
  assetKey,
  terrainStyle = 'Color1',
  ...props
}: JSX.IntrinsicElements['group'] & {
  assetKey: SteppedOutdoorTerrainAssetKey
  terrainStyle?: OutdoorTerrainStyle
}) {
  const assetUrl = resolveSteppedOutdoorTerrainAssetUrl(assetKey, terrainStyle)
  const gltf = useGLTF(assetUrl)
  const scene = useMemo(
    () => applyTerrainShadowSettings(cloneSceneWithNodeMaterials(gltf.scene)),
    [gltf.scene],
  )

  return (
    <group {...props}>
      <primitive object={scene} />
    </group>
  )
}
