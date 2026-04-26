import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF } from '../../../../rendering/useGLTF'
import { cloneSceneWithNodeMaterials } from '../../../../rendering/nodeMaterialUtils'
import type { ContentPackComponentProps } from '../../../types'
import {
  createDungeonWallAsset,
  resolveDungeonWallAssetResources,
  WALL_CORNER_ROTATION,
  WALL_CORNER_SCALE,
  WALL_DEFAULT_TRANSFORM,
} from '../../shared/createDungeonWallAsset'

const DOOR_NODE_NAME = 'wall_doorway_scaffold_door'
const DOOR_OPEN_ANGLE = -Math.PI / 2
const DOOR_ANIMATION_SPEED = 14

const { assetUrl, cornerAssetUrl } = resolveDungeonWallAssetResources({
  modelName: 'wall_doorway_scaffold',
})

type DoorSceneSetup = {
  baseScene: THREE.Object3D
  doorLeaf: THREE.Object3D | null
  pivotOffset: number
}

function DungeonWallDoorwayScaffoldVariant({ objectProps, ...props }: ContentPackComponentProps) {
  const kind = objectProps?.kind === 'corner' ? 'corner' : 'wall'
  const modelUrl = kind === 'corner' ? cornerAssetUrl : assetUrl
  const gltf = useGLTF(modelUrl)
  const doorPivotRef = useRef<THREE.Group>(null)
  const scene = useMemo(() => createDoorSceneSetup(gltf.scene), [gltf.scene])
  const transform = kind === 'corner'
    ? { position: [0, 0, 0] as const, rotation: WALL_CORNER_ROTATION, scale: WALL_CORNER_SCALE }
    : WALL_DEFAULT_TRANSFORM
  const targetDoorAngle = kind === 'wall' && objectProps?.open === true ? DOOR_OPEN_ANGLE : 0

  useFrame((_, delta) => {
    if (!doorPivotRef.current || kind !== 'wall' || !scene.doorLeaf) {
      return
    }

    doorPivotRef.current.rotation.y = THREE.MathUtils.damp(
      doorPivotRef.current.rotation.y,
      targetDoorAngle,
      DOOR_ANIMATION_SPEED,
      delta,
    )
  })

  return (
    <group {...props}>
      <group position={transform.position} rotation={transform.rotation} scale={transform.scale}>
        <primitive object={scene.baseScene} />
        {kind === 'wall' && scene.doorLeaf ? (
          <group ref={doorPivotRef} position={[scene.pivotOffset, 0, 0]}>
            <primitive object={scene.doorLeaf} />
          </group>
        ) : null}
      </group>
    </group>
  )
}

function createDoorSceneSetup(sourceScene: THREE.Object3D): DoorSceneSetup {
  const baseScene = cloneSceneWithNodeMaterials(sourceScene)
  const doorSource = sourceScene.getObjectByName(DOOR_NODE_NAME)
  const doorInBase = baseScene.getObjectByName(DOOR_NODE_NAME)
  if (!doorSource || !doorInBase) {
    return { baseScene, doorLeaf: null, pivotOffset: 0 }
  }

  doorInBase.parent?.remove(doorInBase)
  const doorLeaf = cloneSceneWithNodeMaterials(doorSource)
  const hingeOffset = resolveDoorLeftEdge(doorLeaf)
  doorLeaf.position.x -= hingeOffset

  return {
    baseScene,
    doorLeaf,
    pivotOffset: hingeOffset,
  }
}

function resolveDoorLeftEdge(doorLeaf: THREE.Object3D) {
  const bounds = new THREE.Box3().setFromObject(doorLeaf)
  return Number.isFinite(bounds.min.x) ? bounds.min.x : 0
}

export const dungeonWallDoorwayScaffoldAsset = createDungeonWallAsset({
  id: 'dungeon.wall_wall_doorway_scaffold',
  slug: 'dungeon-wall-wall-doorway-scaffold',
  name: 'Dungeon Wall Doorway Scaffold',
  modelName: 'wall_doorway_scaffold',
  Component: DungeonWallDoorwayScaffoldVariant,
  getPlayModeNextProps: (objectProps) => ({
    open: objectProps.open !== true,
  }),
})
