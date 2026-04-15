import { useEffect, useMemo, useRef } from 'react'
import { useAnimations, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import type { Group } from 'three'
import { SkeletonUtils } from 'three-stdlib'
import type { ContentPackAsset, ContentPackComponentProps } from '../../types'
import playerRigMediumGeneralAssetUrl from '../../../assets/models/core/player-rig-medium-general.glb'
import playerRigMediumMovementBasicAssetUrl from '../../../assets/models/core/player-rig-medium-movement-basic.glb'
import { getPlayerAnimationName } from './playerAnimation'

const PLAYER_PIVOT_OFFSET = [0, 0, 0] as const

export function AnimatedRigMediumPlayer({
  assetUrl,
  poseSelected = false,
  playerAnimationState = poseSelected ? 'selected' : 'default',
  ...props
}: ContentPackComponentProps & { assetUrl: string }) {
  const groupRef = useRef<Group>(null)
  const gltf = useGLTF(assetUrl)
  const generalAnimationGltf = useGLTF(playerRigMediumGeneralAssetUrl)
  const movementAnimationGltf = useGLTF(playerRigMediumMovementBasicAssetUrl)
  const scene = useMemo(() => SkeletonUtils.clone(gltf.scene), [gltf.scene])
  const animations = useMemo(
    () => [...generalAnimationGltf.animations, ...movementAnimationGltf.animations],
    [generalAnimationGltf.animations, movementAnimationGltf.animations],
  )
  const { actions } = useAnimations(animations, groupRef)
  const animationName = useMemo(
    () => getPlayerAnimationName(animations.map((clip) => clip.name), playerAnimationState),
    [animations, playerAnimationState],
  )

  useEffect(() => {
    if (!animationName) {
      return
    }

    const action = actions[animationName]
    const clip = animations.find((candidate) => candidate.name === animationName)
    if (!action || !clip) {
      return
    }

    action.reset()
    action.paused = false
    if (clip.duration === 0) {
      action.setLoop(THREE.LoopOnce, 1)
      action.clampWhenFinished = true
      action.play()
      action.paused = true
      return () => {
        action.stop()
        action.paused = false
      }
    }

    action.clampWhenFinished =
      playerAnimationState === 'pickup' || playerAnimationState === 'release'
    action.setLoop(
      playerAnimationState === 'pickup' || playerAnimationState === 'release'
        ? THREE.LoopOnce
        : THREE.LoopRepeat,
      playerAnimationState === 'pickup' || playerAnimationState === 'release'
        ? 1
        : Infinity,
    )
    action.fadeIn(0.12)
    action.play()

    return () => {
      action.fadeOut(0.12)
    }
  }, [actions, animations, animationName, playerAnimationState])

  return (
    <group ref={groupRef} position={PLAYER_PIVOT_OFFSET}>
      <group {...props}>
        <primitive object={scene} />
      </group>
    </group>
  )
}

export function preloadAnimatedRigMediumPlayer(assetUrl: string) {
  useGLTF.preload(assetUrl)
  useGLTF.preload(playerRigMediumGeneralAssetUrl)
  useGLTF.preload(playerRigMediumMovementBasicAssetUrl)
}

export function createRigMediumPlayerAsset(config: {
  id: string
  slug: string
  name: string
  assetUrl: string
  thumbnailUrl: string
  Component: ContentPackAsset['Component']
}): ContentPackAsset {
  return {
    id: config.id,
    slug: config.slug,
    name: config.name,
    category: 'player',
    assetUrl: config.assetUrl,
    thumbnailUrl: config.thumbnailUrl,
    Component: config.Component,
    metadata: {
      connectsTo: 'FLOOR',
    },
  }
}
