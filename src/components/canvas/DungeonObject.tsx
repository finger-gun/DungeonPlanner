import { memo, useMemo, useRef, useLayoutEffect } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Group, PointLight } from 'three'
import { useDungeonStore, type DungeonObjectRecord } from '../../store/useDungeonStore'
import { ContentPackInstance } from './ContentPackInstance'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { PropLight } from '../../content-packs/types'
import { registerObject, unregisterObject } from './objectRegistry'
import type { PlayVisibility } from './playVisibility'

type DungeonObjectProps = {
  object: DungeonObjectRecord
  visibility: PlayVisibility
  onPlayDragStart?: (object: DungeonObjectRecord, event: ThreeEvent<PointerEvent>) => void
  playerAnimationState?: 'default' | 'selected' | 'pickup' | 'holding' | 'release'
}

export const DungeonObject = memo(function DungeonObject({
  object,
  visibility,
  onPlayDragStart,
  playerAnimationState,
}: DungeonObjectProps) {
  const selection = useDungeonStore((state) => state.selection)
  const selectObject = useDungeonStore((state) => state.selectObject)
  const removeObject = useDungeonStore((state) => state.removeObject)
  const setObjectProps = useDungeonStore((state) => state.setObjectProps)
  const ppEnabled = useDungeonStore((state) => state.postProcessing.enabled)
  const tool = useDungeonStore((state) => state.tool)
  const selected = selection === object.id
  const visibilityState = visibility.getObjectVisibility(`${object.cell[0]}:${object.cell[1]}`)

  const groupRef = useRef<Group>(null)
  useLayoutEffect(() => {
    if (groupRef.current) registerObject(object.id, groupRef.current)
    return () => unregisterObject(object.id)
  }, [object.id])

  const asset = object.assetId ? getContentPackAssetById(object.assetId) : null
  const light = asset?.getLight?.(object.props) ?? asset?.metadata?.light ?? null

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (tool === 'play') {
      const nextProps = asset?.getPlayModeNextProps?.(object.props) ?? null
      if (nextProps) {
        event.stopPropagation()
        setObjectProps(object.id, nextProps)
      }
      return
    }

    if (tool === 'select') {
      event.stopPropagation()
      selectObject(object.id)
      return
    }
    if (!event.altKey) return
    event.stopPropagation()
    selectObject(object.id)
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (tool !== 'play' || object.type !== 'player' || event.button !== 0) {
      return
    }

    event.stopPropagation()
    selectObject(object.id)
    onPlayDragStart?.(object, event)
  }

  function handleContextMenu(event: ThreeEvent<PointerEvent>) {
    if (tool === 'play') {
      return
    }
    event.stopPropagation()
    event.nativeEvent.preventDefault()
    removeObject(object.id)
  }

  const showHullOutline = selected && !ppEnabled && object.type !== 'player'
  const showPlayerSelectionRing = selected && object.type === 'player'

  return (
    <group ref={groupRef} position={object.position} rotation={object.rotation}>
      <ContentPackInstance
        assetId={object.assetId}
        selected={showHullOutline}
        poseSelected={false}
        playerAnimationState={playerAnimationState ?? 'default'}
        variantKey={object.cellKey}
        objectProps={object.props}
        visibility={visibilityState}
        userData={{ objectId: object.id }}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        variant="prop"
      />
      {showPlayerSelectionRing && <PlayerSelectionRing />}
      {light && visibilityState === 'visible' && <PropPointLight light={light} />}
    </group>
  )
})

export function PlayerSelectionRing({ color = '#22c55e' }: { color?: string }) {
  const geometry = useMemo(() => new THREE.RingGeometry(0.32, 0.44, 48), [])

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
      renderOrder={3}
    >
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.85}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  )
}

function PropPointLight({ light }: { light: PropLight }) {
  const ref = useRef<PointLight>(null)

  useFrame(({ clock }) => {
    if (!ref.current || !light.flicker) return
    const t = clock.elapsedTime
    // Layered sin waves at different frequencies give organic, non-repeating flicker
    const noise =
      Math.sin(t * 11.3) * 0.10 +
      Math.sin(t * 7.1)  * 0.08 +
      Math.sin(t * 23.7) * 0.05
    ref.current.intensity = light.intensity * (1 + noise)
  })

  return (
    <pointLight
      ref={ref}
      position={light.offset ?? [0, 0, 0]}
      color={light.color}
      intensity={light.intensity}
      distance={light.distance}
      decay={light.decay ?? 2}
      castShadow={light.castShadow ?? false}
    />
  )
}
