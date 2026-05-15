import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  remapSceneUvCells,
  resolveAtlasColorSwatchVariant,
  type AtlasCell,
} from '../../../shared/atlasColorVariants'
import { useGLTF } from '../../../../rendering/useGLTF'
import { cloneSceneWithNodeMaterials } from '../../../../rendering/nodeMaterialUtils'
import type { ContentPackComponentProps } from '../../../types'
import { advanceDoorAngle } from './doorAnimation'
import { DUNGEON_COLOR_SWATCHES } from '../../shared/dungeonColorAtlas'
import {
  createDungeonWallAsset,
  resolveDungeonWallAssetResources,
  WALL_CORNER_ROTATION,
  WALL_CORNER_SCALE,
  WALL_DEFAULT_TRANSFORM,
} from '../../shared/createDungeonWallAsset'

const DOOR_NODE_NAME = 'wall_doorway_door'
const DOOR_OPEN_ANGLE = -Math.PI / 2
const DOOR_ANIMATION_SPEED = 14
const DOOR_COLOR_SOURCE_CELLS: AtlasCell[] = [[4, 0]]

const { assetUrl, cornerAssetUrl } = resolveDungeonWallAssetResources({
  modelName: 'wall_doorway',
})

type DoorSceneSetup = {
  baseScene: THREE.Object3D
  doorLeaf: THREE.Object3D | null
  pivotOffset: number
}

export function DungeonWallDoorwayVariant({ objectProps, ...props }: ContentPackComponentProps) {
  const kind = objectProps?.kind === 'corner' ? 'corner' : 'wall'
  const modelUrl = kind === 'corner' ? cornerAssetUrl : assetUrl
  const gltf = useGLTF(modelUrl)
  const invalidate = useThree((state) => state.invalidate)
  const doorPivotRef = useRef<THREE.Group>(null)
  const selectedColorCell = resolveAtlasColorSwatchVariant(
    objectProps?.colorVariant,
    'orange',
    DUNGEON_COLOR_SWATCHES,
  ).cell
  const scene = useMemo(
    () => createDoorSceneSetup(gltf.scene, selectedColorCell),
    [gltf.scene, selectedColorCell],
  )
  const transform = kind === 'corner'
    ? { position: [0, 0, 0] as const, rotation: WALL_CORNER_ROTATION, scale: WALL_CORNER_SCALE }
    : WALL_DEFAULT_TRANSFORM
  const targetDoorAngle = kind === 'wall' && objectProps?.open === true ? DOOR_OPEN_ANGLE : 0

  useEffect(() => {
    if (kind === 'wall' && scene.doorLeaf) {
      invalidate()
    }
  }, [invalidate, kind, scene.doorLeaf, targetDoorAngle])

  useFrame((_, delta) => {
    if (!doorPivotRef.current || kind !== 'wall' || !scene.doorLeaf) {
      return
    }

    const { nextAngle, needsInvalidate } = advanceDoorAngle(
      doorPivotRef.current.rotation.y,
      targetDoorAngle,
      delta,
      DOOR_ANIMATION_SPEED,
    )
    doorPivotRef.current.rotation.y = nextAngle
    if (needsInvalidate) {
      invalidate()
    }
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

export function createDoorSceneSetup(sourceScene: THREE.Object3D, targetColorCell: AtlasCell): DoorSceneSetup {
  const baseScene = cloneSceneWithNodeMaterials(sourceScene)
  remapSceneUvCells(baseScene, DOOR_COLOR_SOURCE_CELLS, targetColorCell, {
    columns: 8,
    rows: 4,
  })
  const doorSource = sourceScene.getObjectByName(DOOR_NODE_NAME)
  const doorInBase = baseScene.getObjectByName(DOOR_NODE_NAME)
  if (!doorSource || !doorInBase) {
    return { baseScene, doorLeaf: null, pivotOffset: 0 }
  }

  doorInBase.parent?.remove(doorInBase)
  const doorLeaf = cloneSceneWithNodeMaterials(doorSource)
  remapSceneUvCells(doorLeaf, DOOR_COLOR_SOURCE_CELLS, targetColorCell, {
    columns: 8,
    rows: 4,
  })
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

export const dungeonWallDoorwayAsset = createDungeonWallAsset({
  id: 'dungeon.wall_wall_doorway',
  slug: 'dungeon-wall-wall-doorway',
  name: 'Dungeon Wall Doorway',
  modelName: 'wall_doorway',
  Component: DungeonWallDoorwayVariant,
  metadata: {
    atlasColorVariants: {
      propKey: 'colorVariant',
      defaultVariantId: 'orange',
      variants: DUNGEON_COLOR_SWATCHES,
    },
  },
  getPlayModeNextProps: (objectProps) => ({
    open: objectProps.open !== true,
  }),
})
