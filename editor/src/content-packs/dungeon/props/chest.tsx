import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF } from '../../../rendering/useGLTF'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'
import {
  remapSceneUvCells,
  resolveAtlasColorSwatchVariant,
  type AtlasCell,
} from '../../shared/atlasColorVariants'
import type { ContentPackComponentProps } from '../../types'
import { createDungeonAsset, resolveDungeonModelAssetUrl } from '../shared/createDungeonAsset'
import {
  DUNGEON_COLOR_ATLAS_COLUMNS,
  DUNGEON_COLOR_ATLAS_ROWS,
  DUNGEON_COLOR_SWATCHES,
} from '../shared/dungeonColorAtlas'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

const MODEL_NAME = 'chest'
const LID_NODE_NAME = 'chest_lid'
const LID_OPEN_ANGLE = -(80 * Math.PI / 180)
const LID_ANIMATION_SPEED = 14
const CHEST_COLOR_SOURCE_CELLS: AtlasCell[] = [[4, 0]]
const assetUrl = resolveDungeonModelAssetUrl(MODEL_NAME)

type ChestSceneSetup = {
  baseScene: THREE.Object3D
  lid: THREE.Object3D | null
  pivotOffsetY: number
  pivotOffsetZ: number
}

function DungeonChestVariant({ objectProps, ...props }: ContentPackComponentProps) {
  const gltf = useGLTF(assetUrl)
  const lidPivotRef = useRef<THREE.Group>(null)
  const selectedCell = resolveAtlasColorSwatchVariant(
    objectProps?.colorVariant,
    'orange',
    DUNGEON_COLOR_SWATCHES,
  ).cell
  const scene = useMemo(() => createChestSceneSetup(gltf.scene, selectedCell), [gltf.scene, selectedCell])
  const targetLidAngle = objectProps?.open === true ? LID_OPEN_ANGLE : 0

  useFrame((_, delta) => {
    if (!lidPivotRef.current || !scene.lid) {
      return
    }

    lidPivotRef.current.rotation.x = THREE.MathUtils.damp(
      lidPivotRef.current.rotation.x,
      targetLidAngle,
      LID_ANIMATION_SPEED,
      delta,
    )
  })

  return (
    <group {...props}>
      <group
        position={DUNGEON_PROP_TRANSFORM.position}
        rotation={DUNGEON_PROP_TRANSFORM.rotation}
        scale={DUNGEON_PROP_TRANSFORM.scale}
      >
        <primitive object={scene.baseScene} />
        {scene.lid ? (
          <group ref={lidPivotRef} position={[0, scene.pivotOffsetY, scene.pivotOffsetZ]}>
            <primitive object={scene.lid} />
          </group>
        ) : null}
      </group>
    </group>
  )
}

function createChestSceneSetup(sourceScene: THREE.Object3D, targetCell: AtlasCell): ChestSceneSetup {
  const baseScene = cloneSceneWithNodeMaterials(sourceScene)
  remapSceneUvCells(baseScene, CHEST_COLOR_SOURCE_CELLS, targetCell, {
    columns: DUNGEON_COLOR_ATLAS_COLUMNS,
    rows: DUNGEON_COLOR_ATLAS_ROWS,
  })
  const lidSource = sourceScene.getObjectByName(LID_NODE_NAME)
  const lidInBase = baseScene.getObjectByName(LID_NODE_NAME)
  if (!lidSource || !lidInBase) {
    return { baseScene, lid: null, pivotOffsetY: 0, pivotOffsetZ: 0 }
  }

  lidInBase.parent?.remove(lidInBase)
  const lid = cloneSceneWithNodeMaterials(lidSource)
  remapSceneUvCells(lid, CHEST_COLOR_SOURCE_CELLS, targetCell, {
    columns: DUNGEON_COLOR_ATLAS_COLUMNS,
    rows: DUNGEON_COLOR_ATLAS_ROWS,
  })
  const bounds = new THREE.Box3().setFromObject(lid)
  const pivotOffsetY = Number.isFinite(bounds.min.y) ? bounds.min.y : 0
  const pivotOffsetZ = Number.isFinite(bounds.min.z) ? bounds.min.z : 0
  lid.position.y -= pivotOffsetY
  lid.position.z -= pivotOffsetZ

  return { baseScene, lid, pivotOffsetY, pivotOffsetZ }
}

export const dungeonChestAsset = createDungeonAsset({
  id: 'dungeon.props_chest',
  slug: 'dungeon-props-chest',
  name: 'Dungeon Chest',
  category: 'prop',
  modelName: MODEL_NAME,
  transform: DUNGEON_PROP_TRANSFORM,
  Component: DungeonChestVariant,
  metadata: {
    atlasColorVariants: {
      propKey: 'colorVariant',
      defaultVariantId: 'orange',
      variants: DUNGEON_COLOR_SWATCHES,
    },
    connectors: [
      {
        point: [0, 0, 0],
        type: 'FLOOR',
      },
    ],
    blocksLineOfSight: false,
  },
  getPlayModeNextProps: (objectProps) => ({
    open: objectProps.open !== true,
  }),
})
