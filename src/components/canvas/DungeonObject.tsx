import { useRef, useLayoutEffect } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import type { Group, PointLight } from 'three'
import { useDungeonStore, type DungeonObjectRecord } from '../../store/useDungeonStore'
import { ContentPackInstance } from './ContentPackInstance'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { PropLight } from '../../content-packs/types'
import { registerObject, unregisterObject } from './objectRegistry'

type DungeonObjectProps = { object: DungeonObjectRecord }

export function DungeonObject({ object }: DungeonObjectProps) {
  const selection = useDungeonStore((state) => state.selection)
  const selectObject = useDungeonStore((state) => state.selectObject)
  const removeObject = useDungeonStore((state) => state.removeObject)
  const selected = selection === object.id

  const groupRef = useRef<Group>(null)
  useLayoutEffect(() => {
    if (groupRef.current) registerObject(object.id, groupRef.current)
    return () => unregisterObject(object.id)
  }, [object.id])

  const asset = object.assetId ? getContentPackAssetById(object.assetId) : null
  const light = asset?.metadata?.light

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (!event.altKey) return
    event.stopPropagation()
    selectObject(object.id)
  }

  function handleContextMenu(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation()
    event.nativeEvent.preventDefault()
    removeObject(object.id)
  }

  // When postprocessing is enabled the outline is handled by the TSL
  // toonOutlinePass (layer-based). Fall back to the inverted-hull technique
  // when postprocessing is off so there's always a selection indicator.
  const showHullOutline = selected

  return (
    <group ref={groupRef} position={object.position} rotation={object.rotation}>
      <ContentPackInstance
        assetId={object.assetId}
        selected={showHullOutline}
        variantKey={object.cellKey}
        userData={{ objectId: object.id }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        variant="prop"
      />
      {light && <PropPointLight light={light} />}
    </group>
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
