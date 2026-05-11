import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Maximize2, Move, RotateCw, ToggleLeft, Trash2 } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import * as THREE from 'three'
import { metadataSupportsConnectorType } from '../../content-packs/connectors'
import { getContentPackAssetById } from '../../content-packs/registry'
import type { AtlasColorVariantDefinition } from '../../content-packs/types'
import { getDungeonAtlasSwatchColor } from '../../content-packs/dungeon/shared/dungeonColorAtlas'
import { hasAtlasColorVariants } from '../../rendering/atlasColorVariants'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import { BUILD_ANIMATIONS_ENABLED, getBuildAnimationPlaybackDurationMs, triggerBuildTargets } from '../../store/buildAnimations'
import { getOpeningSegments } from '../../store/openingSegments'
import { getOpeningObjectProps, getOpeningPlayModeNextProps } from '../../store/openingState'
import { getOpeningWorldTransform } from '../../store/openingPlacement'
import {
  getObjectAtlasColorVariant,
  getObjectInstanceScale,
  withObjectAtlasColorVariant,
  withObjectInstanceScale,
} from '../../store/objectAppearance'
import { createSplineWallQueryCache } from '../../store/splineWallQueries'
import { useDungeonStore } from '../../store/useDungeonStore'
import { wallKeyToWorldPosition } from '../../store/wallSegments'
import { AtlasColorVariantPicker } from '../editor/AtlasColorVariantPicker'
import { BatchedTileEntries } from './BatchedTileEntries'
import { WALL_EXTRA_DELAY_MS } from './DungeonRoomShared'
import { getRegisteredObject, useObjectRegistryVersion } from './objectRegistry'
import { getTileGpuStreamMountId } from './TileGpuStreamContextShared'
import {
  buildRemovedRoomTileEntries,
  expandRoomMutationCells,
  getBuildAnimationTargetsForWallKeys,
  getCellsForWallKeys,
  getOriginCellForCells,
  type RoomAnimationStateInput,
} from './roomMutationAnimations'
import { useRemovalAnimationBatches } from './useRemovalAnimationBatches'

const UNDER_MODEL_OFFSET = 0.28
const OBJECT_SCALE_DRAG_SENSITIVITY = 0.008
const OBJECT_ROTATION_DRAG_SENSITIVITY = 0.015
const SELECTION_ROTATION_DRAG_SENSITIVITY = 0.015
const EMPTY_SELECTION_PROPS: Record<string, unknown> = Object.freeze({})

type TransformDragState = {
  kind: 'scale' | 'rotate'
  objectId: string
  startClientX: number
  startClientY: number
  startProps: Record<string, unknown>
  startScale: number
  previewScale: number
  startRotation: [number, number, number]
  previewRotation: [number, number, number]
}

type SelectionRotateDragState = {
  previewObject: THREE.Object3D
  wallRotationY: number
  visualRotationOffsetY: number
  startClientX: number
  startClientY: number
  startVisualRotationY: number
  previewVisualRotationY: number
  initialFlipped: boolean
}

type SelectionContextualUiProps = {
  bakedLightField?: BakedFloorLightField | null
}

export function SelectionContextualUi({ bakedLightField = null }: SelectionContextualUiProps) {
  const tool = useDungeonStore((state) => state.tool)
  const selection = useDungeonStore((state) => state.selection)
  const activeFloorId = useDungeonStore((state) => state.activeFloorId)
  const isObjectDragActive = useDungeonStore((state) => state.isObjectDragActive)
  const pickedUpObject = useDungeonStore((state) => state.pickedUpObject)
  const splineWallGraph = useDungeonStore((state) => state.splineWallGraph)
  const selectedObject = useDungeonStore((state) =>
    selection ? state.placedObjects[selection] : null,
  )
  const selectedOpening = useDungeonStore((state) =>
    selection ? state.wallOpenings[selection] : null,
  )
  const setObjectProps = useDungeonStore((state) => state.setObjectProps)
  const setOpeningProps = useDungeonStore((state) => state.setOpeningProps)
  const setOpeningAsset = useDungeonStore((state) => state.setOpeningAsset)
  const removeOpening = useDungeonStore((state) => state.removeOpening)
  const repositionObject = useDungeonStore((state) => state.repositionObject)
  const removeSelectedObject = useDungeonStore((state) => state.removeSelectedObject)
  const rotateSelection = useDungeonStore((state) => state.rotateSelection)
  const setObjectScalePreview = useDungeonStore((state) => state.setObjectScalePreview)
  const setObjectRotationPreview = useDungeonStore((state) => state.setObjectRotationPreview)
  const setObjectDragActive = useDungeonStore((state) => state.setObjectDragActive)
  const setObjectMoveDragPointer = useDungeonStore((state) => state.setObjectMoveDragPointer)
  const pickUpObject = useDungeonStore((state) => state.pickUpObject)
  const objectRegistryVersion = useObjectRegistryVersion()
  const { controls, invalidate } = useThree()
  const { removalAnimationBatches, queueRemovalAnimationBatch } = useRemovalAnimationBatches()
  const transformDragStateRef = useRef<TransformDragState | null>(null)
  const transformCleanupRef = useRef<(() => void) | null>(null)
  const selectionRotateDragStateRef = useRef<SelectionRotateDragState | null>(null)
  const selectionRotateCleanupRef = useRef<(() => void) | null>(null)
  const moveDragCleanupRef = useRef<(() => void) | null>(null)
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false)
  const openingQueryCache = useMemo(() => createSplineWallQueryCache(splineWallGraph), [splineWallGraph])

  const selectedOpeningAsset = useMemo(
    () => (selectedOpening?.assetId ? getContentPackAssetById(selectedOpening.assetId) : null),
    [selectedOpening?.assetId],
  )
  const selectedOpeningTransform = useMemo(
    () => (selectedOpening ? getOpeningWorldTransform(splineWallGraph, openingQueryCache, selectedOpening) : null),
    [openingQueryCache, selectedOpening, splineWallGraph],
  )
  const openingProps = selectedOpening ? getOpeningObjectProps(selectedOpening) : null
  const selectionMode: 'object' | 'opening' | null = selectedObject
    ? 'object'
    : selectedOpening
      ? 'opening'
      : null
  const anchorPosition = useMemo(() => {
    if (!selection || !selectionMode) {
      return null
    }

    if (selectionMode === 'opening' && selectedOpening) {
      return getSelectionAnchorPosition(
        selectedOpening.id,
        selectedOpeningTransform?.position ?? wallKeyToWorldPosition(selectedOpening.wallKey)?.position ?? [0, 0, 0],
        openingProps ?? EMPTY_SELECTION_PROPS,
        objectRegistryVersion,
      )
    }

    if (!selectedObject) {
      return null
    }

    return getObjectAnchorPosition(
      selectedObject.id,
      selectedObject.position,
      selectedObject.props,
      objectRegistryVersion,
    )
  }, [
    objectRegistryVersion,
    openingProps,
    selectedObject,
    selectedOpening,
    selectedOpeningTransform,
    selectionMode,
  ])
  const selectedAsset = selectionMode === 'object'
    ? (selectedObject?.assetId ? getContentPackAssetById(selectedObject.assetId) : null)
    : selectedOpeningAsset
  const atlasColorVariants = hasAtlasColorVariants(selectedAsset?.metadata)
    ? selectedAsset.metadata.atlasColorVariants
    : null
  const canRotateSelectedObject = !metadataSupportsConnectorType(selectedAsset?.metadata, 'WALL')
  const currentAtlasProps =
    selectionMode === 'object'
      ? (selectedObject?.props ?? null)
      : openingProps
  const currentAtlasVariant = atlasColorVariants && currentAtlasProps
    ? (
      getObjectAtlasColorVariant(currentAtlasProps, atlasColorVariants.propKey)
      ?? atlasColorVariants.defaultVariantId
      ?? null
    )
    : null
  const currentAtlasVariantDefinition = atlasColorVariants?.variants.find(
    (variant) => variant.id === currentAtlasVariant,
  ) ?? null

  const stopTransformDrag = useCallback((commit: boolean) => {
    const dragState = transformDragStateRef.current
    if (!dragState) {
      return
    }

    transformCleanupRef.current?.()
    transformCleanupRef.current = null
    transformDragStateRef.current = null

    if (commit) {
      const state = useDungeonStore.getState()
      const currentObject = state.placedObjects[dragState.objectId]
      if (currentObject) {
        if (dragState.kind === 'scale') {
          setObjectProps(
            dragState.objectId,
            withObjectInstanceScale(currentObject.props, dragState.previewScale),
          )
        } else {
          const nextLocalRotation = currentObject.parentObjectId
            ? dragState.previewRotation
            : currentObject.localRotation ?? null
          const parentObject = currentObject.parentObjectId
            ? state.placedObjects[currentObject.parentObjectId]
            : null
          const nextWorldRotation =
            currentObject.parentObjectId && parentObject
              ? deriveChildWorldRotation(parentObject.rotation, dragState.previewRotation)
              : dragState.previewRotation

          repositionObject(dragState.objectId, {
            position: currentObject.position,
            rotation: nextWorldRotation,
            props: currentObject.props,
            cell: currentObject.cell,
            cellKey: currentObject.cellKey,
            parentObjectId: currentObject.parentObjectId ?? null,
            localPosition: currentObject.localPosition ?? null,
            localRotation: nextLocalRotation,
            supportCellKey: currentObject.supportCellKey,
          })
        }
      }
    }

    setObjectScalePreview(dragState.objectId, null)
    setObjectRotationPreview(dragState.objectId, null)
    setObjectDragActive(false)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any
    if (orbitControls && 'enabled' in orbitControls) {
      orbitControls.enabled = true
    }

    invalidate()
  }, [
    controls,
    invalidate,
    repositionObject,
    setObjectDragActive,
    setObjectProps,
    setObjectRotationPreview,
    setObjectScalePreview,
  ])

  useEffect(() => () => {
    moveDragCleanupRef.current?.()
    moveDragCleanupRef.current = null
    stopTransformDrag(false)
  }, [stopTransformDrag])

  const stopSelectionRotateDrag = useCallback((commit: boolean) => {
    const dragState = selectionRotateDragStateRef.current
    if (!dragState) {
      return
    }

    selectionRotateCleanupRef.current?.()
    selectionRotateCleanupRef.current = null
    selectionRotateDragStateRef.current = null

    const nextVisualRotationY = commit
      ? getNearestWallSnapRotationY(dragState.previewVisualRotationY, dragState.wallRotationY)
      : dragState.startVisualRotationY

    dragState.previewObject.rotation.y = nextVisualRotationY - dragState.visualRotationOffsetY

    if (commit) {
      const shouldFlip = isWallRotationFlipped(nextVisualRotationY, dragState.wallRotationY)
      if (shouldFlip !== dragState.initialFlipped) {
        rotateSelection()
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any
    if (orbitControls && 'enabled' in orbitControls) {
      orbitControls.enabled = true
    }

    invalidate()
  }, [controls, invalidate, rotateSelection])

  useEffect(() => () => {
    stopSelectionRotateDrag(false)
  }, [stopSelectionRotateDrag])

  useEffect(() => {
    stopSelectionRotateDrag(false)
    setIsColorPickerOpen(false)
  }, [selection, selectedObject?.assetId, stopSelectionRotateDrag])

  const startTransformDrag = useCallback((
    kind: TransformDragState['kind'],
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    if (event.button !== 0 || !selectedObject) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const startScale = getObjectInstanceScale(selectedObject.props)
    const startRotation = (
      selectedObject.parentObjectId
        ? (selectedObject.localRotation ?? selectedObject.rotation)
        : selectedObject.rotation
    ) as [number, number, number]

    const nextDragState: TransformDragState = {
      kind,
      objectId: selectedObject.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startProps: selectedObject.props,
      startScale,
      previewScale: startScale,
      startRotation,
      previewRotation: startRotation,
    }

    transformDragStateRef.current = nextDragState
    if (kind === 'scale') {
      setObjectScalePreview(selectedObject.id, startScale)
    } else {
      setObjectRotationPreview(selectedObject.id, startRotation)
    }
    setObjectDragActive(true)

    // Disable immediately so a quick drag cannot orbit the camera first.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any
    if (orbitControls && 'enabled' in orbitControls) {
      orbitControls.enabled = false
    }

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      const dragState = transformDragStateRef.current
      if (!dragState) {
        return
      }

      const deltaX = pointerEvent.clientX - dragState.startClientX
      const deltaY = pointerEvent.clientY - dragState.startClientY
      const dominantDelta = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : -deltaY

      if (dragState.kind === 'scale') {
        const previewScale = getObjectInstanceScale(
          withObjectInstanceScale(
            dragState.startProps,
            dragState.startScale + dominantDelta * OBJECT_SCALE_DRAG_SENSITIVITY,
          ),
        )

        dragState.previewScale = previewScale
        setObjectScalePreview(dragState.objectId, previewScale)
      } else {
        const previewRotation: [number, number, number] = [
          dragState.startRotation[0],
          dragState.startRotation[1] + dominantDelta * OBJECT_ROTATION_DRAG_SENSITIVITY,
          dragState.startRotation[2],
        ]

        dragState.previewRotation = previewRotation
        setObjectRotationPreview(dragState.objectId, previewRotation)
      }

      invalidate()
    }

    const handlePointerUp = () => {
      stopTransformDrag(true)
    }

    const handleWindowBlur = () => {
      stopTransformDrag(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })
    window.addEventListener('pointercancel', handlePointerUp, { once: true })
    window.addEventListener('blur', handleWindowBlur, { once: true })
    transformCleanupRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      window.removeEventListener('blur', handleWindowBlur)
    }

    invalidate()
  }, [
    controls,
    invalidate,
    selectedObject,
    setObjectDragActive,
    setObjectRotationPreview,
    setObjectScalePreview,
    stopTransformDrag,
  ])

  const handleScalePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    startTransformDrag('scale', event)
  }, [startTransformDrag])

  const handleRotatePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    startTransformDrag('rotate', event)
  }, [startTransformDrag])

  const handleMovePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !selectedObject) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    if (!pickUpObject(selectedObject.id)) {
      return
    }

    setObjectMoveDragPointer({
      clientX: event.clientX,
      clientY: event.clientY,
    })
    setObjectDragActive(true)

    moveDragCleanupRef.current?.()
    const clearMoveDragListeners = () => {
      moveDragCleanupRef.current?.()
      moveDragCleanupRef.current = null
    }
    const handlePointerMove = (pointerEvent: PointerEvent) => {
      setObjectMoveDragPointer({
        clientX: pointerEvent.clientX,
        clientY: pointerEvent.clientY,
      })
    }
    const handlePointerUp = () => {
      clearMoveDragListeners()
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })
    window.addEventListener('pointercancel', handlePointerUp, { once: true })
    window.addEventListener('blur', handlePointerUp, { once: true })
    moveDragCleanupRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      window.removeEventListener('blur', handlePointerUp)
    }

    // Disable immediately so the move gesture does not start orbiting the camera.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any
    if (orbitControls && 'enabled' in orbitControls) {
      orbitControls.enabled = false
    }

    invalidate()
  }, [controls, invalidate, pickUpObject, selectedObject, setObjectDragActive, setObjectMoveDragPointer])

  const runAnimatedWallMutation = useCallback((
    wallKeys: string[],
    mutate: () => boolean,
  ) => {
    if (wallKeys.length === 0) {
      return
    }

    const beforeState = buildRoomAnimationStateFromStore(useDungeonStore.getState(), bakedLightField)
    if (!mutate()) {
      return
    }

    const nextState = useDungeonStore.getState()
    if (nextState.activeFloorId !== beforeState.floorId) {
      invalidate()
      return
    }

    const affectedCells = expandRoomMutationCells(getCellsForWallKeys(wallKeys))
    const originCell = getOriginCellForCells(affectedCells)
    const buildTargets = getBuildAnimationTargetsForWallKeys(wallKeys)
    const mutationStartedAt = performance.now()
    const removalEntries = buildRemovedRoomTileEntries({
      before: beforeState.state,
      after: buildRoomAnimationStateFromStore(nextState, bakedLightField).state,
      buildStartedAt: mutationStartedAt,
      cells: affectedCells,
      originCell,
    })
    queueRemovalAnimationBatch(removalEntries, beforeState.floorId)

    if (BUILD_ANIMATIONS_ENABLED && buildTargets.length > 0) {
      const scheduledBuildStartedAt = removalEntries.length > 0
        ? mutationStartedAt + getBuildAnimationPlaybackDurationMs(WALL_EXTRA_DELAY_MS)
        : mutationStartedAt
      triggerBuildTargets(buildTargets, originCell, {
        startedAt: scheduledBuildStartedAt,
      })
    }

    invalidate()
  }, [bakedLightField, invalidate, queueRemovalAnimationBatch])

  const handleDeletePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (selectionMode === 'opening' && selectedOpening) {
      runAnimatedWallMutation(
        getOpeningSegments(selectedOpening.wallKey, selectedOpening.width),
        () => {
          removeOpening(selectedOpening.id)
          return true
        },
      )
      return
    }

    removeSelectedObject()
    invalidate()
  }, [
    invalidate,
    removeOpening,
    removeSelectedObject,
    runAnimatedWallMutation,
    selectedOpening,
    selectionMode,
  ])

  const handleDiscreteRotatePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    if (
      event.button !== 0 ||
      (
        (selectionMode === 'opening' && !selection) ||
        selectionMode !== 'opening'
      )
    ) {
      return
    }

    event.preventDefault()
    event.stopPropagation()

    const previewSelectionId = selection
    if (!previewSelectionId) {
      return
    }

    const previewObject = getRegisteredObject(previewSelectionId)
    if (!previewObject) {
      return
    }

    const initialFlipped = selectedOpening?.flipped ?? false
    const visualRotationOffsetY = 0
    const startVisualRotationY = previewObject.rotation.y + visualRotationOffsetY

    selectionRotateDragStateRef.current = {
      previewObject,
      wallRotationY: getObjectWorldRotationY(previewObject) - (initialFlipped ? Math.PI : 0),
      visualRotationOffsetY,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startVisualRotationY,
      previewVisualRotationY: startVisualRotationY,
      initialFlipped,
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any
    if (orbitControls && 'enabled' in orbitControls) {
      orbitControls.enabled = false
    }

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      const dragState = selectionRotateDragStateRef.current
      if (!dragState) {
        return
      }

      const deltaX = pointerEvent.clientX - dragState.startClientX
      const deltaY = pointerEvent.clientY - dragState.startClientY
      const dominantDelta = Math.abs(deltaX) >= Math.abs(deltaY) ? deltaX : -deltaY
      const nextVisualRotationY =
        dragState.startVisualRotationY + dominantDelta * SELECTION_ROTATION_DRAG_SENSITIVITY

      dragState.previewVisualRotationY = nextVisualRotationY
      dragState.previewObject.rotation.y = nextVisualRotationY - dragState.visualRotationOffsetY
      invalidate()
    }

    const handlePointerUp = () => {
      stopSelectionRotateDrag(true)
    }

    const handleWindowBlur = () => {
      stopSelectionRotateDrag(false)
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })
    window.addEventListener('pointercancel', handlePointerUp, { once: true })
    window.addEventListener('blur', handleWindowBlur, { once: true })
    selectionRotateCleanupRef.current = () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      window.removeEventListener('blur', handleWindowBlur)
    }

    invalidate()
  }, [controls, invalidate, selectedOpening, selection, selectionMode, stopSelectionRotateDrag])

  const handleStateTogglePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    if (selectionMode === 'opening' && selectedOpening) {
      const nextProps = getOpeningPlayModeNextProps(selectedOpening)
      if (nextProps) {
        setOpeningProps(selectedOpening.id, {
          ...getOpeningObjectProps(selectedOpening),
          ...nextProps,
        })
      } else if (selectedOpening.assetId) {
        setOpeningAsset(selectedOpening.id, null)
      }
      invalidate()
    }
  }, [
    invalidate,
    selectedOpening,
    selectionMode,
    setOpeningAsset,
    setOpeningProps,
  ])

  const updateAtlasVariant = useCallback((variantId: string | null) => {
    if (!atlasColorVariants) {
      return
    }

    if (selectionMode === 'object' && selectedObject) {
      setObjectProps(
        selectedObject.id,
        withObjectAtlasColorVariant(selectedObject.props, atlasColorVariants.propKey, variantId),
      )
    } else if (selectionMode === 'opening' && selectedOpening) {
      setOpeningProps(
        selectedOpening.id,
        withObjectAtlasColorVariant(getOpeningObjectProps(selectedOpening), atlasColorVariants.propKey, variantId),
      )
    }

    invalidate()
  }, [
    atlasColorVariants,
    invalidate,
    selectedObject,
    selectedOpening,
    selectionMode,
    setObjectProps,
    setOpeningProps,
  ])

  const getVariantColor = useCallback((variant: AtlasColorVariantDefinition) => {
    if (variant.swatchColor) {
      return variant.swatchColor
    }
    if (variant.cell && selectedAsset?.id.startsWith('dungeon.')) {
      return getDungeonAtlasSwatchColor(variant.cell)
    }
    return '#9ca3af'
  }, [selectedAsset?.id])

  const currentColor = currentAtlasVariantDefinition
    ? getVariantColor(currentAtlasVariantDefinition)
    : '#9ca3af'
  const hasStateToggle = Boolean(selectionMode === 'opening' && selectedOpening && getOpeningPlayModeNextProps(selectedOpening))
  const showDiscreteRotate = Boolean(selectionMode === 'opening' && selectedOpening?.assetId)
  const deleteLabel = selectionMode === 'object'
    ? 'Delete selected object'
    : 'Delete selected opening'
  const stateLabel = selectionMode === 'opening'
    ? 'Toggle selected opening state'
    : 'Toggle selection state'
  const rotateLabel = selectionMode === 'object'
    ? 'Rotate selected object'
    : 'Flip selected opening'

  if (
    tool !== 'select' ||
    !selection ||
    !selectionMode ||
    !anchorPosition ||
    isObjectDragActive ||
    pickedUpObject
  ) {
    return null
  }

  return (
    <>
      {removalAnimationBatches
        .filter((batch) => batch.floorId === activeFloorId)
        .map((batch) => (
          <BatchedTileEntries
            key={batch.id}
            entries={batch.entries}
            floorId={batch.floorId}
            mountId={getTileGpuStreamMountId(batch.floorId, 'active')}
            sourceId={batch.id}
            useLineOfSightPostMask={false}
          />
        ))}
      {/* The anchor sits low on the model; letting Html occlude here hides the widget
          inside many meshes, so the "under model" treatment is done in screen space. */}
      <Html
        occlude={false}
        position={anchorPosition}
        distanceFactor={10}
        zIndexRange={[120, 0]}
      >
        <div
          className="pointer-events-auto -translate-x-1/2 translate-y-3 flex flex-col items-center gap-2"
          data-testid="selection-contextual-ui"
        >
          <div className="relative flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-950/90 px-2 py-2 shadow-lg shadow-black/40 backdrop-blur">
            {selectionMode === 'object' ? (
              <>
                <button
                  type="button"
                  aria-label="Scale selected object"
                  className="rounded-full border border-stone-700 bg-stone-900/90 p-2 text-stone-100 transition hover:border-sky-400/70 hover:text-sky-200"
                  onPointerDown={handleScalePointerDown}
                >
                  <Maximize2 size={14} strokeWidth={1.8} />
                </button>
                {canRotateSelectedObject ? (
                  <button
                    type="button"
                    aria-label={rotateLabel}
                    className="rounded-full border border-stone-700 bg-stone-900/90 p-2 text-stone-100 transition hover:border-violet-400/70 hover:text-violet-200"
                    onPointerDown={handleRotatePointerDown}
                  >
                    <RotateCw size={14} strokeWidth={1.8} />
                  </button>
                ) : null}
                <button
                  type="button"
                  aria-label="Move selected object"
                  className="rounded-full border border-stone-700 bg-stone-900/90 p-2 text-stone-100 transition hover:border-amber-400/70 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-45"
                  onPointerDown={handleMovePointerDown}
                  disabled={!selectedObject?.assetId}
                >
                  <Move size={14} strokeWidth={1.8} />
                </button>
              </>
            ) : (
              <>
                {hasStateToggle ? (
                  <button
                    type="button"
                    aria-label={stateLabel}
                    className="rounded-full border border-stone-700 bg-stone-900/90 p-2 text-stone-100 transition hover:border-amber-400/70 hover:text-amber-200"
                    onPointerDown={handleStateTogglePointerDown}
                  >
                    <ToggleLeft size={14} strokeWidth={1.8} />
                  </button>
                ) : null}
                {showDiscreteRotate ? (
                  <button
                    type="button"
                    aria-label={rotateLabel}
                    className="rounded-full border border-stone-700 bg-stone-900/90 p-2 text-stone-100 transition hover:border-violet-400/70 hover:text-violet-200"
                    onPointerDown={handleDiscreteRotatePointerDown}
                  >
                    <RotateCw size={14} strokeWidth={1.8} />
                  </button>
                ) : null}
              </>
            )}
            {atlasColorVariants ? (
              <div className="relative">
                <button
                  type="button"
                  aria-label="Open color variants"
                  title="Open color variants"
                  className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-stone-700 bg-stone-900/90 transition hover:border-amber-400/70"
                  onClick={(event) => {
                    event.preventDefault()
                    event.stopPropagation()
                    setIsColorPickerOpen((open) => !open)
                  }}
                >
                  <span
                    aria-hidden="true"
                    className="h-4.5 w-4.5 rounded-full border border-black/20"
                    style={{ backgroundColor: currentColor }}
                  />
                </button>
                {isColorPickerOpen ? (
                  <div className="absolute right-0 top-[calc(100%+6px)] z-10 w-max rounded-[1.75rem] border border-stone-700/80 bg-stone-950/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur">
                    <AtlasColorVariantPicker
                      config={atlasColorVariants}
                      currentVariantId={currentAtlasVariant}
                      onSelect={(variantId) => {
                        updateAtlasVariant(variantId)
                        setIsColorPickerOpen(false)
                      }}
                      onClear={currentAtlasVariant ? () => {
                        updateAtlasVariant(null)
                        setIsColorPickerOpen(false)
                      } : undefined}
                      mode="grid"
                      getVariantColor={getVariantColor}
                      className="overflow-hidden"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
            <button
              type="button"
              aria-label={deleteLabel}
              className="rounded-full border border-stone-700 bg-stone-900/90 p-2 text-stone-100 transition hover:border-rose-400/70 hover:text-rose-200"
              onPointerDown={handleDeletePointerDown}
            >
              <Trash2 size={14} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </Html>
    </>
  )
}

function deriveChildWorldRotation(
  parentRotation: [number, number, number],
  localRotation: [number, number, number],
): [number, number, number] {
  const parentQuaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(...parentRotation))
  const childQuaternion = parentQuaternion.multiply(
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...localRotation)),
  )
  const childEuler = new THREE.Euler().setFromQuaternion(childQuaternion)

  return [childEuler.x, childEuler.y, childEuler.z]
}

function buildRoomAnimationStateFromStore(
  state: ReturnType<typeof useDungeonStore.getState>,
  bakedLightField: BakedFloorLightField | null,
): {
  floorId: string
  state: RoomAnimationStateInput
} {
  return {
    floorId: state.activeFloorId,
    state: {
      activeLayerId: state.activeLayerId,
      activeRoomSetId: state.activeRoomSetId,
      bakedLightField,
      floorTileAssetIds: state.floorTileAssetIds,
      globalFloorAssetId: state.selectedAssetIds.floor,
      globalWallAssetId: state.selectedAssetIds.wall,
      innerWalls: state.innerWalls,
      paintedCells: state.paintedCells,
      rooms: state.rooms,
      wallOpenings: state.wallOpenings,
      wallSurfaceAssetIds: state.wallSurfaceAssetIds,
      wallSurfaceProps: state.wallSurfaceProps,
    },
  }
}

function getSelectionAnchorPosition(
  selectionId: string,
  fallbackPosition: [number, number, number],
  selectionProps: Record<string, unknown>,
  objectRegistryVersion: number,
) {
  return getObjectAnchorPosition(selectionId, fallbackPosition, selectionProps, objectRegistryVersion)
}

function getObjectAnchorPosition(
  objectId: string,
  fallbackPosition: [number, number, number],
  objectProps: Record<string, unknown>,
  objectRegistryVersion: number,
): [number, number, number] {
  void objectRegistryVersion
  const registeredObject = getRegisteredObject(objectId)

  if (registeredObject) {
    const box = new THREE.Box3().setFromObject(registeredObject)
    if (!box.isEmpty()) {
      const center = new THREE.Vector3()
      box.getCenter(center)
      return [center.x, box.min.y + UNDER_MODEL_OFFSET, center.z]
    }
  }

  return [
    fallbackPosition[0],
    fallbackPosition[1] + (UNDER_MODEL_OFFSET * getObjectInstanceScale(objectProps)),
    fallbackPosition[2],
  ]
}

function getObjectWorldRotationY(object: THREE.Object3D) {
  const quaternion = new THREE.Quaternion()
  const euler = new THREE.Euler()
  object.getWorldQuaternion(quaternion)
  euler.setFromQuaternion(quaternion, 'YXZ')
  return euler.y
}

function getNearestWallSnapRotationY(rotationY: number, wallRotationY: number) {
  const flippedRotationY = wallRotationY + Math.PI
  return getAngularDistance(rotationY, wallRotationY) <= getAngularDistance(rotationY, flippedRotationY)
    ? wallRotationY
    : flippedRotationY
}

function isWallRotationFlipped(rotationY: number, wallRotationY: number) {
  return getAngularDistance(rotationY, wallRotationY + Math.PI) < getAngularDistance(rotationY, wallRotationY)
}

function getAngularDistance(a: number, b: number) {
  const normalizedA = normalizeAngle(a)
  const normalizedB = normalizeAngle(b)
  const delta = Math.abs(normalizedA - normalizedB)
  return Math.min(delta, (Math.PI * 2) - delta)
}

function normalizeAngle(angle: number) {
  const fullTurn = Math.PI * 2
  const normalized = angle % fullTurn
  return normalized < 0 ? normalized + fullTurn : normalized
}
