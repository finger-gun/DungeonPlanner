import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF } from '../../../rendering/useGLTF'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'
import type { ContentPackComponentProps } from '../../types'
import { createDungeonAsset, resolveDungeonModelAssetUrl } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

const MODEL_NAME = 'chest_gold'
const LID_NODE_NAME = 'chest_gold_lid'
const LID_OPEN_ANGLE = -(80 * Math.PI / 180)
const LID_ANIMATION_SPEED = 14
const assetUrl = resolveDungeonModelAssetUrl(MODEL_NAME)

type ChestSceneSetup = {
  baseScene: THREE.Object3D
  lid: THREE.Object3D | null
  pivotOffsetY: number
  pivotOffsetZ: number
}

function DungeonChestGoldVariant({ objectProps, ...props }: ContentPackComponentProps) {
  const gltf = useGLTF(assetUrl)
  const lidPivotRef = useRef<THREE.Group>(null)
  const scene = useMemo(() => createChestSceneSetup(gltf.scene), [gltf.scene])
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

function createChestSceneSetup(sourceScene: THREE.Object3D): ChestSceneSetup {
  const baseScene = cloneSceneWithNodeMaterials(sourceScene)
  const lidSource = sourceScene.getObjectByName(LID_NODE_NAME)
  const lidInBase = baseScene.getObjectByName(LID_NODE_NAME)
  if (!lidSource || !lidInBase) {
    return { baseScene, lid: null, pivotOffsetY: 0, pivotOffsetZ: 0 }
  }

  lidInBase.parent?.remove(lidInBase)
  const lid = cloneSceneWithNodeMaterials(lidSource)
  const bounds = new THREE.Box3().setFromObject(lid)
  const pivotOffsetY = Number.isFinite(bounds.min.y) ? bounds.min.y : 0
  const pivotOffsetZ = Number.isFinite(bounds.min.z) ? bounds.min.z : 0
  lid.position.y -= pivotOffsetY
  lid.position.z -= pivotOffsetZ

  return { baseScene, lid, pivotOffsetY, pivotOffsetZ }
}

useGLTF.preload(assetUrl)

export const dungeonChestGoldAsset = createDungeonAsset({
  id: 'dungeon.props_chest_gold',
  slug: 'dungeon-props-chest-gold',
  name: 'Dungeon Chest Gold',
  category: 'prop',
  modelName: MODEL_NAME,
  transform: DUNGEON_PROP_TRANSFORM,
  Component: DungeonChestGoldVariant,
  metadata: {
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
