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
import { getObjectInstanceScale, getObjectTintColor } from '../../store/objectAppearance'
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
  const pickedUpObjectId = useDungeonStore((state) => state.pickedUpObject?.objectId ?? null)
  const objectScalePreview = useDungeonStore((state) => state.objectScalePreviewOverrides[object.id] ?? null)
  const objectRotationPreview = useDungeonStore((state) => state.objectRotationPreviewOverrides[object.id] ?? null)
  const assetBrowserCategory = useDungeonStore((state) => state.assetBrowser.category)
  const characterSize = useDungeonStore(
    (state) => object.assetId
      ? (state.generatedCharacters[object.assetId]?.size ?? DEFAULT_GENERATED_CHARACTER_SIZE)
      : DEFAULT_GENERATED_CHARACTER_SIZE,
  )
  const selected = selection === object.id
  const visibilityState = visibility.getObjectVisibility(object)
  const useLineOfSightPostMask = visibility.active
  const isPickedUp = pickedUpObjectId === object.id
  const objectScale = objectScalePreview ?? getObjectInstanceScale(object.props)
  const objectTint = getObjectTintColor(object.props)
  const [suspendBakedLight, setSuspendBakedLight] = useState(false)
  const hasSeenInitialPropsRef = useRef(false)
  const suspendTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const groupRef = useRef<Group>(null)
  useLayoutEffect(() => {
    if (isPickedUp || !groupRef.current) {
      unregisterObject(object.id)
      return
    }

    if (groupRef.current) registerObject(object.id, groupRef.current)
    return () => unregisterObject(object.id)
  }, [isPickedUp, object.id])

  useLayoutEffect(() => {
    if (isPickedUp) {
      unregisterObjectSources(sourceScopeKey, object.id)
      return
    }

    registerObjectSources(sourceScopeKey, object)
    return () => unregisterObjectSources(sourceScopeKey, object.id)
  }, [
    isPickedUp,
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
    if (pickedUpObjectId !== null) {
      return
    }

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
    if (pickedUpObjectId !== null) {
      return
    }

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
  const baseRotation = object.parentObjectId ? (object.localRotation ?? object.rotation) : object.rotation
  const rotation = objectRotationPreview ?? baseRotation
  const showPlayDragHitArea = tool === 'play' && object.type === 'player'
  const playerHitRadius = getGeneratedCharacterIndicatorSize(characterSize) * 0.42 * objectScale
  const playerHitHeight = 2.4 * getGeneratedCharacterScale(characterSize) * objectScale

  if (isPickedUp) {
    return null
  }

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={objectScale}>
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
        tint={objectTint ?? undefined}
        propInstanceKey={object.id}
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
      {showPlayerSelectionRing && <PlayerSelectionRing assetId={object.assetId} scale={objectScale} />}
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
  scale = 1,
}: {
  assetId?: string | null
  color?: string
  scale?: number
}) {
  const characterSize = useDungeonStore(
    (state) => assetId
      ? (state.generatedCharacters[assetId]?.size ?? DEFAULT_GENERATED_CHARACTER_SIZE)
      : DEFAULT_GENERATED_CHARACTER_SIZE,
  )
  return (
    <ProjectedGroundDecal
      color={color}
      size={getGeneratedCharacterIndicatorSize(characterSize) * scale}
    />
  )
}
