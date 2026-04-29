import { Html } from '@react-three/drei'
import { useThree } from '@react-three/fiber'
import { Maximize2, Move, RotateCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent } from 'react'
import * as THREE from 'three'
import {
  getObjectInstanceScale,
  withObjectInstanceScale,
} from '../../store/objectAppearance'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getRegisteredObject, useObjectRegistryVersion } from './objectRegistry'

const UNDER_MODEL_OFFSET = 0.28
const OBJECT_SCALE_DRAG_SENSITIVITY = 0.008
const OBJECT_ROTATION_DRAG_SENSITIVITY = 0.015

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

export function SelectionContextualUi() {
  const tool = useDungeonStore((state) => state.tool)
  const selection = useDungeonStore((state) => state.selection)
  const isObjectDragActive = useDungeonStore((state) => state.isObjectDragActive)
  const pickedUpObject = useDungeonStore((state) => state.pickedUpObject)
  const selectedObject = useDungeonStore((state) =>
    selection ? state.placedObjects[selection] : null,
  )
  const setObjectProps = useDungeonStore((state) => state.setObjectProps)
  const repositionObject = useDungeonStore((state) => state.repositionObject)
  const removeSelectedObject = useDungeonStore((state) => state.removeSelectedObject)
  const setObjectScalePreview = useDungeonStore((state) => state.setObjectScalePreview)
  const setObjectRotationPreview = useDungeonStore((state) => state.setObjectRotationPreview)
  const setObjectDragActive = useDungeonStore((state) => state.setObjectDragActive)
  const setObjectMoveDragPointer = useDungeonStore((state) => state.setObjectMoveDragPointer)
  const pickUpObject = useDungeonStore((state) => state.pickUpObject)
  const objectRegistryVersion = useObjectRegistryVersion()
  const { controls, invalidate } = useThree()
  const transformDragStateRef = useRef<TransformDragState | null>(null)
  const transformCleanupRef = useRef<(() => void) | null>(null)
  const moveDragCleanupRef = useRef<(() => void) | null>(null)

  const anchorPosition = useMemo(() => {
    if (!selection || !selectedObject) {
      return null
    }

    return getObjectAnchorPosition(
      selectedObject.id,
      selectedObject.position,
      selectedObject.props,
      objectRegistryVersion,
    )
  }, [objectRegistryVersion, selectedObject, selection])

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

  const handleDeletePointerDown = useCallback((event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    removeSelectedObject()
    invalidate()
  }, [invalidate, removeSelectedObject])

  if (
    tool !== 'select' ||
    !selection ||
    !selectedObject ||
    !anchorPosition ||
    isObjectDragActive ||
    pickedUpObject
  ) {
    return null
  }

  return (
    // The anchor sits low on the model; letting Html occlude here hides the widget
    // inside many meshes, so the "under model" treatment is done in screen space.
    <Html
      occlude={false}
      position={anchorPosition}
      distanceFactor={10}
      zIndexRange={[120, 0]}
    >
      <div
        className="pointer-events-auto -translate-x-1/2 translate-y-3 flex items-center gap-2 rounded-full border border-stone-700/80 bg-stone-950/90 px-2 py-2 shadow-lg shadow-black/40 backdrop-blur"
        data-testid="selection-contextual-ui"
      >
        <button
          type="button"
          aria-label="Scale selected object"
          className="rounded-full border border-stone-700 bg-stone-900/90 p-2 text-stone-100 transition hover:border-sky-400/70 hover:text-sky-200"
          onPointerDown={handleScalePointerDown}
        >
          <Maximize2 size={14} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Rotate selected object"
          className="rounded-full border border-stone-700 bg-stone-900/90 p-2 text-stone-100 transition hover:border-violet-400/70 hover:text-violet-200"
          onPointerDown={handleRotatePointerDown}
        >
          <RotateCw size={14} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Move selected object"
          className="rounded-full border border-stone-700 bg-stone-900/90 p-2 text-stone-100 transition hover:border-amber-400/70 hover:text-amber-200 disabled:cursor-not-allowed disabled:opacity-45"
          onPointerDown={handleMovePointerDown}
          disabled={!selectedObject.assetId}
        >
          <Move size={14} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          aria-label="Delete selected object"
          className="rounded-full border border-stone-700 bg-stone-900/90 p-2 text-stone-100 transition hover:border-rose-400/70 hover:text-rose-200"
          onPointerDown={handleDeletePointerDown}
        >
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      </div>
    </Html>
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
