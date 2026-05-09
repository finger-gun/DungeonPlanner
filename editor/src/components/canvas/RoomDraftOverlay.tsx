import { Html } from '@react-three/drei'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { Check, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import {
  buildRoomDraftWorldPoints,
  getRoomDraftCenterWorldPosition,
  getRoomDraftCornerAmountFromWorldPoint,
  getRoomDraftCornerWorldPosition,
  getRoomDraftEdgeWorldPosition,
  setRoomDraftBounds,
  setRoomDraftCorner,
  type RoomDraftState,
} from '../../store/roomDraft'
import type { RoomDraftHandleVisibility } from '../../store/roomDraftClip'
import {
  resizeBoundsFromEdge,
  snapWorldToBoundary,
  type RoomResizeCorner,
  type RoomResizeEdge,
} from '../../store/roomResize'
import { useDungeonStore } from '../../store/useDungeonStore'

const OVERLAY_Y = 0.04
const HANDLE_Y = 0.08
const EDGE_HANDLE_SIZE: [number, number, number] = [0.34, 0.08, 0.34]
const CORNER_HANDLE_RADIUS = 0.16
const CORNER_ORDER: RoomResizeCorner[] = ['nw', 'ne', 'se', 'sw']
const EDGE_ORDER: RoomResizeEdge[] = ['north', 'south', 'east', 'west']

type RoomDraftOverlayProps = {
  draft: RoomDraftState
  valid: boolean
  previewPoints?: readonly (readonly [number, number])[]
  centerPosition?: readonly [number, number, number]
  handleVisibility?: RoomDraftHandleVisibility
  invalidTitle?: string
  onChange: (draft: RoomDraftState) => void
  onCommit: () => void
  onCancel: () => void
}

type DragState =
  | { kind: 'edge'; edge: RoomResizeEdge }
  | { kind: 'corner'; corner: RoomResizeCorner }

export function RoomDraftOverlay({
  draft,
  valid,
  previewPoints: providedPreviewPoints,
  centerPosition: providedCenterPosition,
  handleVisibility,
  invalidTitle,
  onChange,
  onCommit,
  onCancel,
}: RoomDraftOverlayProps) {
  const setRoomResizeHandleActive = useDungeonStore((state) => state.setRoomResizeHandleActive)
  const { camera, controls, gl, invalidate } = useThree()
  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragStateRef = useRef<DragState | null>(null)
  const draftRef = useRef(draft)
  const raycasterRef = useRef(new THREE.Raycaster())
  const pointerRef = useRef(new THREE.Vector2())
  const dragPlaneRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0))

  useEffect(() => {
    draftRef.current = draft
  }, [draft])

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  const previewPoints = useMemo(
    () => providedPreviewPoints ?? buildRoomDraftWorldPoints(draft),
    [draft, providedPreviewPoints],
  )
  const centerPosition = useMemo(
    () => providedCenterPosition ?? getRoomDraftCenterWorldPosition(draft),
    [draft, providedCenterPosition],
  )

  const fillGeometry = useMemo(() => {
    if (previewPoints.length < 3) {
      return null
    }

    const shape = new THREE.Shape()
    const [firstPoint, ...rest] = previewPoints
    shape.moveTo(firstPoint![0], firstPoint![1])
    rest.forEach((point) => {
      shape.lineTo(point[0], point[1])
    })
    shape.closePath()

    const geometry = new THREE.ShapeGeometry(shape)
    geometry.rotateX(Math.PI / 2)
    geometry.translate(0, OVERLAY_Y, 0)
    return geometry
  }, [previewPoints])

  const outlinePositions = useMemo(() => {
    if (previewPoints.length === 0) {
      return new Float32Array()
    }

    const points = [...previewPoints, previewPoints[0]!]
    return new Float32Array(points.flatMap((point) => [point[0], OVERLAY_Y + 0.01, point[1]]))
  }, [previewPoints])

  useEffect(() => () => {
    fillGeometry?.dispose()
  }, [fillGeometry])

  const stopDrag = useCallback(() => {
    dragStateRef.current = null
    setDragState(null)
    setRoomResizeHandleActive(false)
    gl.domElement.style.cursor = ''
    invalidate()
    const orbitControls = controls as { enabled?: boolean } | undefined
    if (orbitControls && typeof orbitControls.enabled === 'boolean') {
      orbitControls.enabled = true
    }
  }, [controls, gl, invalidate, setRoomResizeHandleActive])

  useEffect(() => {
    if (!dragState) {
      return
    }

    const orbitControls = controls as { enabled?: boolean } | undefined
    if (orbitControls && typeof orbitControls.enabled === 'boolean') {
      orbitControls.enabled = false
    }

    const handlePointerMove = (event: PointerEvent) => {
      const activeDrag = dragStateRef.current
      const currentDraft = draftRef.current
      if (!activeDrag || !currentDraft) {
        return
      }

      const rect = gl.domElement.getBoundingClientRect()
      pointerRef.current.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -(((event.clientY - rect.top) / rect.height) * 2 - 1),
      )
      raycasterRef.current.setFromCamera(pointerRef.current, camera)
      const hitPoint = new THREE.Vector3()
      if (!raycasterRef.current.ray.intersectPlane(dragPlaneRef.current, hitPoint)) {
        return
      }

      if (activeDrag.kind === 'edge') {
        const boundary = activeDrag.edge === 'east' || activeDrag.edge === 'west'
          ? snapWorldToBoundary(hitPoint.x)
          : snapWorldToBoundary(hitPoint.z)
        onChange(setRoomDraftBounds(currentDraft, resizeBoundsFromEdge(currentDraft.bounds, activeDrag.edge, boundary)))
        invalidate()
        return
      }

      const amount = getRoomDraftCornerAmountFromWorldPoint(
        currentDraft.bounds,
        activeDrag.corner,
        { x: hitPoint.x, z: hitPoint.z },
      )
      onChange(setRoomDraftCorner(
        currentDraft,
        activeDrag.corner,
        event.ctrlKey ? 'diagonal' : 'rounded',
        amount,
      ))
      invalidate()
    }

    const handlePointerUp = () => {
      stopDrag()
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [camera, controls, dragState, gl, invalidate, onChange, stopDrag])

  useEffect(() => () => {
    stopDrag()
  }, [stopDrag])

  const startDrag = useCallback((nextDragState: DragState, event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation()
    event.nativeEvent.preventDefault()
    dragStateRef.current = nextDragState
    setDragState(nextDragState)
    setRoomResizeHandleActive(true)
    gl.domElement.style.cursor = 'grabbing'
    invalidate()
  }, [gl, invalidate, setRoomResizeHandleActive])

  return (
    <group>
      {fillGeometry ? (
        <mesh geometry={fillGeometry}>
          <meshBasicMaterial
            color={valid ? '#4dabff' : '#ef4444'}
            transparent
            opacity={0.22}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ) : null}
      {outlinePositions.length > 0 ? (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[outlinePositions, 3]}
            />
          </bufferGeometry>
          <lineBasicMaterial color={valid ? '#93c5fd' : '#fca5a5'} transparent opacity={0.95} />
        </line>
      ) : null}
      {EDGE_ORDER.map((edge) => {
        if (handleVisibility && !handleVisibility.edges[edge]) {
          return null
        }
        const position = getRoomDraftEdgeWorldPosition(draft, edge)
        return (
          <mesh
            key={edge}
            position={[position[0], HANDLE_Y, position[2]]}
            onPointerDown={(event) => startDrag({ kind: 'edge', edge }, event)}
            onPointerEnter={() => {
              if (!dragStateRef.current) {
                gl.domElement.style.cursor = 'grab'
              }
            }}
            onPointerLeave={() => {
              if (!dragStateRef.current) {
                gl.domElement.style.cursor = ''
              }
            }}
          >
            <boxGeometry args={EDGE_HANDLE_SIZE} />
            <meshBasicMaterial color={valid ? '#38bdf8' : '#f87171'} transparent opacity={0.95} />
          </mesh>
        )
      })}
      {CORNER_ORDER.map((corner) => {
        if (handleVisibility && !handleVisibility.corners[corner]) {
          return null
        }
        const position = getRoomDraftCornerWorldPosition(draft, corner)
        return (
          <mesh
            key={corner}
            position={[position[0], HANDLE_Y, position[2]]}
            onPointerDown={(event) => startDrag({ kind: 'corner', corner }, event)}
            onPointerEnter={() => {
              if (!dragStateRef.current) {
                gl.domElement.style.cursor = 'grab'
              }
            }}
            onPointerLeave={() => {
              if (!dragStateRef.current) {
                gl.domElement.style.cursor = ''
              }
            }}
          >
            <sphereGeometry args={[CORNER_HANDLE_RADIUS, 16, 16]} />
            <meshBasicMaterial color={valid ? '#60a5fa' : '#f87171'} transparent opacity={0.98} />
          </mesh>
        )
      })}
      <Html
        occlude={false}
        position={[centerPosition[0], 0.06, centerPosition[2]]}
        distanceFactor={10}
        zIndexRange={[120, 0]}
      >
        <div
          className="pointer-events-auto -translate-x-1/2 translate-y-3 flex items-center gap-2"
          data-testid="room-draft-controls"
        >
            <button
              type="button"
              aria-label="Commit draft room"
              title={valid ? 'Commit draft room' : (invalidTitle ?? 'Draft overlaps another room')}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-400/70 bg-slate-950/90 text-emerald-100 shadow-lg shadow-slate-950/35 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500 disabled:opacity-60"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onCommit()
              }}
              disabled={!valid}
            >
              <Check size={18} strokeWidth={2} />
            </button>
            <button
              type="button"
              aria-label="Cancel draft room"
              title="Cancel draft room"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-rose-400/70 bg-slate-950/90 text-rose-100 shadow-lg shadow-slate-950/35 transition hover:border-rose-300"
              onPointerDown={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onCancel()
              }}
            >
              <Trash2 size={18} strokeWidth={2} />
            </button>
        </div>
      </Html>
    </group>
  )
}
