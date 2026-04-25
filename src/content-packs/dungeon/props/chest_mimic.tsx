import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useGLTF } from '../../../rendering/useGLTF'
import { cloneSceneWithNodeMaterials } from '../../../rendering/nodeMaterialUtils'
import type { ContentPackComponentProps } from '../../types'
import { createDungeonAsset, resolveDungeonModelAssetUrl } from '../shared/createDungeonAsset'
import { DUNGEON_PROP_TRANSFORM } from '../shared/dungeonConstants'

const MODEL_NAME = 'chest_mimic'
const LID_NODE_NAME = 'chest_mimic_lid'
const LID_OPEN_ANGLE = -(80 * Math.PI / 180)
const LID_ANIMATION_SPEED = 14
const MIMIC_CHOMP_COUNT = 6
const MIMIC_CHOMP_DURATION = 0.18
const MIMIC_ATTACK_DURATION = MIMIC_CHOMP_COUNT * MIMIC_CHOMP_DURATION
const assetUrl = resolveDungeonModelAssetUrl(MODEL_NAME)

type ChestSceneSetup = {
  baseScene: THREE.Object3D
  lid: THREE.Object3D | null
  pivotOffsetY: number
  pivotOffsetZ: number
}

type MimicAttackPose = {
  active: boolean
  lidOpenAmount: number
  offsetX: number
  offsetY: number
  offsetZ: number
}

function DungeonChestMimicVariant({ objectProps, ...props }: ContentPackComponentProps) {
  const gltf = useGLTF(assetUrl)
  const bodyRef = useRef<THREE.Group>(null)
  const lidPivotRef = useRef<THREE.Group>(null)
  const attackElapsedRef = useRef(MIMIC_ATTACK_DURATION)
  const wasOpenRef = useRef(false)
  const scene = useMemo(() => createChestSceneSetup(gltf.scene), [gltf.scene])
  const open = objectProps?.open === true

  useFrame((_, delta) => {
    if (!bodyRef.current || !lidPivotRef.current || !scene.lid) {
      return
    }

    if (open && !wasOpenRef.current) {
      attackElapsedRef.current = 0
    } else if (!open) {
      attackElapsedRef.current = MIMIC_ATTACK_DURATION
    } else {
      attackElapsedRef.current = Math.min(
        attackElapsedRef.current + delta,
        MIMIC_ATTACK_DURATION,
      )
    }
    wasOpenRef.current = open

    const pose = open
      ? getMimicAttackPose(attackElapsedRef.current)
      : { active: false, lidOpenAmount: 0, offsetX: 0, offsetY: 0, offsetZ: 0 }
    const targetLidAngle = LID_OPEN_ANGLE * pose.lidOpenAmount

    bodyRef.current.position.x = THREE.MathUtils.damp(
      bodyRef.current.position.x,
      pose.offsetX,
      LID_ANIMATION_SPEED,
      delta,
    )
    bodyRef.current.position.y = THREE.MathUtils.damp(
      bodyRef.current.position.y,
      pose.offsetY,
      LID_ANIMATION_SPEED,
      delta,
    )
    bodyRef.current.position.z = THREE.MathUtils.damp(
      bodyRef.current.position.z,
      pose.offsetZ,
      LID_ANIMATION_SPEED,
      delta,
    )
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
        ref={bodyRef}
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

export function getMimicAttackPose(elapsed: number): MimicAttackPose {
  if (elapsed >= MIMIC_ATTACK_DURATION) {
    return {
      active: false,
      lidOpenAmount: 1,
      offsetX: 0,
      offsetY: 0,
      offsetZ: 0,
    }
  }

  const progress = Math.max(0, elapsed) / MIMIC_ATTACK_DURATION
  const chompProgress = Math.max(0, elapsed) / MIMIC_CHOMP_DURATION
  const lidOpenAmount = 0.5 - (0.5 * Math.cos(chompProgress * Math.PI * 2))
  const motionEnvelope = Math.sin(progress * Math.PI)

  return {
    active: true,
    lidOpenAmount,
    offsetX: Math.sin(elapsed * 34) * 0.32 * motionEnvelope,
    offsetY: Math.abs(Math.sin(elapsed * 42)) * 0.48 * motionEnvelope,
    offsetZ: Math.sin(elapsed * 26 + 0.9) * 0.22 * motionEnvelope,
  }
}

useGLTF.preload(assetUrl)

export const dungeonChestMimicAsset = createDungeonAsset({
  id: 'dungeon.props_chest_mimic',
  slug: 'dungeon-props-chest-mimic',
  name: 'Dungeon Chest Mimic',
  category: 'prop',
  modelName: MODEL_NAME,
  transform: DUNGEON_PROP_TRANSFORM,
  Component: DungeonChestMimicVariant,
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
