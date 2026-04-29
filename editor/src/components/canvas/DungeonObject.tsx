import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { type ThreeEvent } from '@react-three/fiber'
import type { Group } from 'three'
import { useDungeonStore, type DungeonObjectRecord } from '../../store/useDungeonStore'
import { ContentPackInstance } from './ContentPackInstance'
import { getContentPackAssetById } from '../../content-packs/registry'
import { registerObject, unregisterObject } from './objectRegistry'
import { registerObjectSources, unregisterObjectSources } from './objectSourceRegistry'
import { shouldAllowObjectContextDelete } from './openPassageInteraction'
import type { PlayVisibility } from './playVisibility'
import { ProjectedGroundDecal } from './ProjectedGroundDecal'
import { DEFAULT_GENERATED_CHARACTER_SIZE } from '../../generated-characters/types'
import {
  getGeneratedCharacterIndicatorSize,
  getGeneratedCharacterScale,
} from '../../generated-characters/rendering'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import { SELECTION_OUTLINE_IGNORE_USER_DATA } from '../../postprocessing/selectionOutlineConfig'

const PROP_STATE_BAKED_LIGHT_SUSPEND_MS = 450

type DungeonObjectProps = {
  object: DungeonObjectRecord
  visibility: PlayVisibility
  sourceScopeKey: string
  bakedLightField?: BakedFloorLightField | null
  childrenByParent?: Record<string, DungeonObjectRecord[]>
  onPlayDragStart?: (object: DungeonObjectRecord, event: ThreeEvent<PointerEvent>) => void
  playerAnimationState?: 'default' | 'selected' | 'pickup' | 'holding' | 'release'
}

export const DungeonObject = memo(function DungeonObject({
  object,
  visibility,
  sourceScopeKey,
  bakedLightField = null,
  childrenByParent,
  onPlayDragStart,
  playerAnimationState,
}: DungeonObjectProps) {
  const selection = useDungeonStore((state) => state.selection)
  const selectObject = useDungeonStore((state) => state.selectObject)
  const removeObject = useDungeonStore((state) => state.removeObject)
  const setObjectProps = useDungeonStore((state) => state.setObjectProps)
  const tool = useDungeonStore((state) => state.tool)
  const assetBrowserCategory = useDungeonStore((state) => state.assetBrowser.category)
  const characterSize = useDungeonStore(
    (state) => object.assetId
      ? (state.generatedCharacters[object.assetId]?.size ?? DEFAULT_GENERATED_CHARACTER_SIZE)
      : DEFAULT_GENERATED_CHARACTER_SIZE,
  )
  const selected = selection === object.id
  const visibilityState = visibility.getObjectVisibility(object)
  const useLineOfSightPostMask = visibility.active
  const [suspendBakedLight, setSuspendBakedLight] = useState(false)
  const hasSeenInitialPropsRef = useRef(false)
  const suspendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const groupRef = useRef<Group>(null)
  useLayoutEffect(() => {
    if (groupRef.current) registerObject(object.id, groupRef.current)
    return () => unregisterObject(object.id)
  }, [object.id])

  useLayoutEffect(() => {
    registerObjectSources(sourceScopeKey, object)
    return () => unregisterObjectSources(sourceScopeKey, object.id)
  }, [
    object,
    object.assetId,
    object.cellKey,
    object.id,
    object.position,
    object.props,
    object.rotation,
    sourceScopeKey,
  ])

  const asset = object.assetId ? getContentPackAssetById(object.assetId) : null
  const isStatefulProp = object.type === 'prop' && Boolean(asset?.getPlayModeNextProps)

  useEffect(() => {
    if (!isStatefulProp) {
      setSuspendBakedLight(false)
      return
    }

    if (!hasSeenInitialPropsRef.current) {
      hasSeenInitialPropsRef.current = true
      return
    }

    setSuspendBakedLight(true)
    if (suspendTimeoutRef.current) {
      clearTimeout(suspendTimeoutRef.current)
    }
    suspendTimeoutRef.current = setTimeout(() => {
      setSuspendBakedLight(false)
      suspendTimeoutRef.current = null
    }, PROP_STATE_BAKED_LIGHT_SUSPEND_MS)

    return () => {
      if (suspendTimeoutRef.current) {
        clearTimeout(suspendTimeoutRef.current)
        suspendTimeoutRef.current = null
      }
    }
  }, [isStatefulProp, object.props])

  const disableBakedLight = suspendBakedLight || (playerAnimationState != null && playerAnimationState !== 'default')

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (tool === 'play') {
      const nextProps = asset?.getPlayModeNextProps?.(object.props) ?? null
      if (nextProps) {
        event.stopPropagation()
        setObjectProps(object.id, { ...object.props, ...nextProps })
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
    event.nativeEvent.preventDefault()
    event.nativeEvent.stopImmediatePropagation()
    selectObject(object.id)
    onPlayDragStart?.(object, event)
  }

  function handleContextMenu(event: ThreeEvent<PointerEvent>) {
    if (
      tool === 'play'
      || !shouldAllowObjectContextDelete(tool, assetBrowserCategory)
    ) {
      return
    }
    event.stopPropagation()
    event.nativeEvent.preventDefault()
    removeObject(object.id)
  }

  const showPlayerSelectionRing = selected && object.type === 'player'
  const childObjects = childrenByParent?.[object.id] ?? []
  const position = object.parentObjectId ? (object.localPosition ?? object.position) : object.position
  const rotation = object.parentObjectId ? (object.localRotation ?? object.rotation) : object.rotation
  const showPlayDragHitArea = tool === 'play' && object.type === 'player'
  const playerHitRadius = getGeneratedCharacterIndicatorSize(characterSize) * 0.42
  const playerHitHeight = 2.4 * getGeneratedCharacterScale(characterSize)

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {showPlayDragHitArea && (
        <mesh
          position={[0, playerHitHeight * 0.5, 0]}
          onPointerDown={handlePointerDown}
          onClick={handleClick}
          userData={{ [SELECTION_OUTLINE_IGNORE_USER_DATA]: true }}
        >
          <cylinderGeometry args={[playerHitRadius, playerHitRadius, playerHitHeight, 24]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}
      <ContentPackInstance
        assetId={object.assetId}
        selected={false}
        poseSelected={false}
        playerAnimationState={playerAnimationState ?? 'default'}
        variantKey={object.cellKey}
        objectProps={object.props}
        visibility={visibilityState}
        useLineOfSightPostMask={useLineOfSightPostMask}
        userData={{ objectId: object.id }}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        variant="prop"
        bakedLightField={bakedLightField}
        disableBakedLight={disableBakedLight}
      />
      {showPlayerSelectionRing && <PlayerSelectionRing assetId={object.assetId} />}
      {childObjects.map((childObject) => (
        <DungeonObject
          key={childObject.id}
          object={childObject}
          visibility={visibility}
          sourceScopeKey={sourceScopeKey}
          bakedLightField={bakedLightField}
          childrenByParent={childrenByParent}
          onPlayDragStart={onPlayDragStart}
        />
      ))}
    </group>
  )
})

export function PlayerSelectionRing({
  assetId = null,
  color = '#d4a72c',
}: {
  assetId?: string | null
  color?: string
}) {
  const characterSize = useDungeonStore(
    (state) => assetId
      ? (state.generatedCharacters[assetId]?.size ?? DEFAULT_GENERATED_CHARACTER_SIZE)
      : DEFAULT_GENERATED_CHARACTER_SIZE,
  )
  return (
    <ProjectedGroundDecal
      color={color}
      size={getGeneratedCharacterIndicatorSize(characterSize)}
    />
  )
}
