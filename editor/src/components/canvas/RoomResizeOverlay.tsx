import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { GRID_SIZE, type GridCell } from '../../hooks/useSnapToGrid'
import { useDungeonStore } from '../../store/useDungeonStore'
import { getCornerHandleLayout, getEdgeProps } from './roomResizeHandleLayout'
import {
  getRoomBoundaryRuns,
  getRoomBoundaryRunSegment,
  canResizeRoomToBounds,
  getCornerBoundary,
  getRoomBounds,
  getRoomCells,
  getRoomOutlineSegments,
  getRoomOutlineSegmentsForCells,
  getResizedRoomCellsForRun,
  getRoomWorldRect,
  isRectangularRoom,
  resizeBoundsFromCorner,
  resizeBoundsFromEdge,
  snapWorldToBoundary,
  type RoomBoundaryRun,
  type RoomBounds,
  type RoomResizeCorner,
  type RoomResizeEdge,
} from '../../store/roomResize'

const OVERLAY_Y = 0.3
const HANDLE_CORNERS: RoomResizeCorner[] = ['nw', 'ne', 'se', 'sw']
const HANDLE_EDGES: RoomResizeEdge[] = ['north', 'south', 'east', 'west']

type DragHandle =
  | { kind: 'corner'; corner: RoomResizeCorner }
  | { kind: 'edge'; edge: RoomResizeEdge }

type DragState =
  | {
      kind: 'rect'
      handle: DragHandle
      bounds: RoomBounds
      valid: boolean
    }
  | {
      kind: 'run'
      run: RoomBoundaryRun
      boundary: number
      cells: GridCell[]
      valid: boolean
    }

export function RoomResizeOverlay() {
  const tool = useDungeonStore((state) => state.tool)
  const roomPaintMode = useDungeonStore((state) => state.roomPaintMode)
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const selectedRoomId = useDungeonStore((state) => state.selectedRoomId)
  const resizeRoom = useDungeonStore((state) => state.resizeRoom)
  const resizeRoomByBoundaryRun = useDungeonStore((state) => state.resizeRoomByBoundaryRun)
  const setRoomResizeHandleActive = useDungeonStore((state) => state.setRoomResizeHandleActive)
  const { camera, gl, invalidate, controls } = useThree()

  const [dragState, setDragState] = useState<DragState | null>(null)
  const dragStateRef = useRef<DragState | null>(null)

  useEffect(() => {
    dragStateRef.current = dragState
  }, [dragState])

  // Lock/unlock camera controls during resize drag
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orbitControls = controls as any
    if (!orbitControls || !('enabled' in orbitControls)) {
      return
    }

    if (dragState) {
      // Disable orbit controls when dragging
      orbitControls.enabled = false
    } else {
      // Re-enable orbit controls when not dragging
      orbitControls.enabled = true
    }
  }, [dragState, controls])

  const baseBounds = useMemo(
    () => selectedRoomId ? getRoomBounds(selectedRoomId, paintedCells) : null,
    [paintedCells, selectedRoomId],
  )
  const isRectangular = useMemo(
    () => selectedRoomId ? isRectangularRoom(selectedRoomId, paintedCells, baseBounds) : false,
    [baseBounds, paintedCells, selectedRoomId],
  )
  const roomCells = useMemo(
    () => selectedRoomId ? getRoomCells(selectedRoomId, paintedCells) : [],
    [paintedCells, selectedRoomId],
  )
  const outlineSegments = useMemo(
    () => selectedRoomId ? getRoomOutlineSegments(selectedRoomId, paintedCells) : [],
    [paintedCells, selectedRoomId],
  )
  const boundaryRuns = useMemo(
    () => selectedRoomId ? getRoomBoundaryRuns(selectedRoomId, paintedCells) : [],
    [paintedCells, selectedRoomId],
  )

  const displayBounds = dragState?.kind === 'rect' ? dragState.bounds : baseBounds
  const previewOutlineSegments = useMemo(() => {
    if (dragState?.kind === 'run') {
      return getRoomOutlineSegmentsForCells(dragState.cells)
    }

    return outlineSegments
  }, [dragState, outlineSegments])
  const valid = dragState?.valid ?? Boolean(
    selectedRoomId &&
    displayBounds &&
    canResizeRoomToBounds(selectedRoomId, displayBounds, paintedCells),
  )

  const stopDrag = useCallback(() => {
    gl.domElement.style.cursor = ''
    setRoomResizeHandleActive(false)
    setDragState(null)
    dragStateRef.current = null
    invalidate()
  }, [gl, invalidate, setRoomResizeHandleActive])

  const unitBoxGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])

  useEffect(() => () => {
    gl.domElement.style.cursor = ''
    setRoomResizeHandleActive(false)
    // Ensure controls are re-enabled on unmount
    const orbitControls = controls as any
    if (orbitControls && 'enabled' in orbitControls) {
      orbitControls.enabled = true
    }
  }, [gl, setRoomResizeHandleActive, controls])

  const showOverlay = tool === 'room' && roomPaintMode === 'resize' && Boolean(selectedRoomId)

  useEffect(() => {
    if (showOverlay) {
      return
    }

    gl.domElement.style.cursor = ''
    dragStateRef.current = null
    setDragState(null)
    setRoomResizeHandleActive(false)
    
    // Ensure controls are re-enabled when overlay is hidden
    const orbitControls = controls as any
    if (orbitControls && 'enabled' in orbitControls) {
      orbitControls.enabled = true
    }
  }, [gl, setRoomResizeHandleActive, showOverlay, controls])

  useEffect(() => {
     if (!dragState || !selectedRoomId) {
       return
     }

     const roomId = selectedRoomId
     const originBounds = baseBounds
     const originCells = roomCells
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const point = new THREE.Vector3()

    function updateDrag(clientX: number, clientY: number) {
      const rect = gl.domElement.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) {
        return
      }

      ndc.set(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      )

      raycaster.setFromCamera(ndc, camera)
      if (!raycaster.ray.intersectPlane(plane, point)) {
        return
      }

      setDragState((current) => {
        if (!current) {
          return current
        }

         if (current.kind === 'rect') {
           if (!originBounds) {
             return current
           }

           const nextBounds = current.handle.kind === 'corner'
             ? resizeBoundsFromCorner(
                 originBounds,
                 current.handle.corner,
                 snapWorldToBoundary(point.x),
                 snapWorldToBoundary(point.z),
               )
             : resizeBoundsFromEdge(
                 originBounds,
                 current.handle.edge,
                 current.handle.edge === 'north' || current.handle.edge === 'south'
                   ? snapWorldToBoundary(point.z)
                   : snapWorldToBoundary(point.x),
               )

           return {
             ...current,
             bounds: nextBounds,
             valid: canResizeRoomToBounds(roomId, nextBounds, paintedCells),
           }
         }

         const boundary = current.run.direction === 'north' || current.run.direction === 'south'
           ? snapWorldToBoundary(point.z)
           : snapWorldToBoundary(point.x)
         const nextCells = getResizedRoomCellsForRun(roomId, paintedCells, current.run, boundary)

         return {
           ...current,
           boundary,
           cells: nextCells ?? originCells,
           valid: nextCells !== null,
         }
       })
       invalidate()
     }

    function handlePointerMove(event: PointerEvent) {
      updateDrag(event.clientX, event.clientY)
    }

     function handlePointerUp() {
       const current = dragStateRef.current
       if (current?.kind === 'rect' && current.valid) {
         resizeRoom(roomId, current.bounds)
       }
       if (current?.kind === 'run' && current.valid) {
         resizeRoomByBoundaryRun(roomId, current.run, current.boundary)
       }
       stopDrag()
     }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp, { once: true })

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
   }, [baseBounds, camera, dragState, gl, invalidate, paintedCells, resizeRoom, resizeRoomByBoundaryRun, roomCells, selectedRoomId, stopDrag])

  if (tool !== 'room' || !selectedRoomId || !baseBounds) {
    return null
  }

  const color = dragState?.valid === false
    ? '#ef4444'
    : '#60a5fa'

  if (!isRectangular || !displayBounds) {
    return (
      <group renderOrder={20}>
        {previewOutlineSegments.map((segment, index) => (
          <RoomEdge
            key={`${segment.position.join(':')}:${index}`}
            geometry={unitBoxGeometry}
            position={[segment.position[0], OVERLAY_Y, segment.position[2]]}
            size={segment.size}
            color={color}
          />
        ))}
        {!dragState && boundaryRuns.map((run, index) => {
          const segment = getRoomBoundaryRunSegment(run)
          const cursor = getResizeCursor(run.direction)

          return (
            <RoomEdge
              key={`${run.direction}:${run.line}:${run.start}:${run.end}:${index}`}
              geometry={unitBoxGeometry}
              position={[segment.position[0], OVERLAY_Y, segment.position[2]]}
              size={segment.size}
              color={color}
              hitScale={getRunHitScale(segment.size)}
              onPointerOver={() => {
                setRoomResizeHandleActive(true)
                gl.domElement.style.cursor = cursor
              }}
              onPointerOut={() => {
                if (!dragStateRef.current) {
                  setRoomResizeHandleActive(false)
                  gl.domElement.style.cursor = ''
                }
              }}
              onPointerDown={(event) => startBoundaryRunDrag(
                event,
                run,
                roomCells,
                setDragState,
                invalidate,
                gl.domElement,
                setRoomResizeHandleActive,
              )}
            />
          )
        })}
      </group>
    )
  }

  const rect = getRoomWorldRect(displayBounds)
  const centerX = (rect.minX + rect.maxX) / 2
  const centerZ = (rect.minZ + rect.maxZ) / 2
  const width = rect.maxX - rect.minX
  const depth = rect.maxZ - rect.minZ
  const cornerHandleLayout = getCornerHandleLayout()

  return (
    <group renderOrder={20}>
      {HANDLE_EDGES.map((edge) => {
        const edgeProps = getEdgeProps(edge, rect, centerX, centerZ, width, depth)
        const cursor = getResizeCursor(edge)

        return (
          <RoomEdge
            key={edge}
            geometry={unitBoxGeometry}
            position={edgeProps.position}
            size={edgeProps.size}
            color={color}
            hitScale={edgeProps.hitScale}
            onPointerOver={() => {
              setRoomResizeHandleActive(true)
              gl.domElement.style.cursor = cursor
            }}
            onPointerOut={() => {
              if (!dragStateRef.current) {
                setRoomResizeHandleActive(false)
                gl.domElement.style.cursor = ''
              }
            }}
            onPointerDown={(event) => startHandleDrag(
              event,
              { kind: 'edge', edge },
              displayBounds,
              valid,
              setDragState,
              invalidate,
              gl.domElement,
              setRoomResizeHandleActive,
            )}
          />
        )
      })}

      {HANDLE_CORNERS.map((corner) => {
        const [boundaryX, boundaryZ] = getCornerBoundary(displayBounds, corner)
        const cursor = getResizeCursor(corner)
        return (
          <CornerHandle
            key={corner}
            geometry={unitBoxGeometry}
            position={[boundaryX * GRID_SIZE, OVERLAY_Y + 0.04, boundaryZ * GRID_SIZE]}
            visibleScale={cornerHandleLayout.visibleScale}
            hitScale={cornerHandleLayout.hitScale}
            color={color}
            onPointerOver={() => {
              setRoomResizeHandleActive(true)
              gl.domElement.style.cursor = cursor
            }}
            onPointerOut={() => {
              if (!dragStateRef.current) {
                setRoomResizeHandleActive(false)
                gl.domElement.style.cursor = ''
              }
            }}
            onPointerDown={(event) => startHandleDrag(
              event,
              { kind: 'corner', corner },
              displayBounds,
              valid,
              setDragState,
              invalidate,
              gl.domElement,
              setRoomResizeHandleActive,
            )}
          />
        )
      })}
    </group>
  )
}

function RoomEdge({
  geometry,
  position,
  size,
  color,
  hitScale,
  onPointerOver,
  onPointerOut,
  onPointerDown,
}: {
  geometry: THREE.BoxGeometry
  position: [number, number, number]
  size: [number, number, number]
  color: string
  hitScale?: [number, number, number]
  onPointerOver?: () => void
  onPointerOut?: () => void
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void
}) {
  return (
    <group position={position} renderOrder={20}>
      <mesh geometry={geometry} scale={size}>
        <meshBasicMaterial color={color} depthTest={false} transparent opacity={0.95} />
      </mesh>
      {onPointerDown && hitScale && (
        <mesh
          geometry={geometry}
          scale={hitScale}
          onPointerOver={onPointerOver}
          onPointerOut={onPointerOut}
          onPointerDown={onPointerDown}
        >
          <meshBasicMaterial transparent opacity={0} depthTest={false} />
        </mesh>
      )}
    </group>
  )
}

function CornerHandle({
  geometry,
  position,
  visibleScale,
  hitScale,
  color,
  onPointerOver,
  onPointerOut,
  onPointerDown,
}: {
  geometry: THREE.BoxGeometry
  position: [number, number, number]
  visibleScale: [number, number, number]
  hitScale: [number, number, number]
  color: string
  onPointerOver?: () => void
  onPointerOut?: () => void
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void
}) {
  return (
    <group position={position} renderOrder={21}>
      <mesh geometry={geometry} scale={visibleScale}>
        <meshBasicMaterial color={color} depthTest={false} />
      </mesh>
      <mesh
        geometry={geometry}
        scale={hitScale}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        onPointerDown={onPointerDown}
      >
        <meshBasicMaterial transparent opacity={0} depthTest={false} />
      </mesh>
    </group>
  )
}

function startHandleDrag(
  event: ThreeEvent<PointerEvent>,
  handle: DragHandle,
  bounds: RoomBounds,
  valid: boolean,
  setDragState: Dispatch<SetStateAction<DragState | null>>,
  invalidate: () => void,
  canvas: HTMLCanvasElement,
  setRoomResizeHandleActive: (active: boolean) => void,
) {
  if (event.button !== 0) {
    return
  }

  event.stopPropagation()
  canvas.style.cursor = getResizeCursor(handle.kind === 'corner' ? handle.corner : handle.edge)
  setRoomResizeHandleActive(true)
  setDragState({ kind: 'rect', handle, bounds, valid })
  invalidate()
}

function startBoundaryRunDrag(
  event: ThreeEvent<PointerEvent>,
  run: RoomBoundaryRun,
  cells: GridCell[],
  setDragState: Dispatch<SetStateAction<DragState | null>>,
  invalidate: () => void,
  canvas: HTMLCanvasElement,
  setRoomResizeHandleActive: (active: boolean) => void,
) {
  if (event.button !== 0) {
    return
  }

  event.stopPropagation()
  canvas.style.cursor = getResizeCursor(run.direction)
  setRoomResizeHandleActive(true)
  setDragState({
    kind: 'run',
    run,
    boundary: run.line,
    cells,
    valid: true,
  })
  invalidate()
}

function getResizeCursor(handle: RoomResizeCorner | RoomResizeEdge) {
  switch (handle) {
    case 'north':
    case 'south':
      return 'ns-resize'
    case 'east':
    case 'west':
      return 'ew-resize'
    case 'nw':
    case 'se':
      return 'nesw-resize'
    case 'ne':
    case 'sw':
      return 'nwse-resize'
  }
}

function getRunHitScale(size: [number, number, number]): [number, number, number] {
  return size[0] > size[2]
    ? [size[0], 0.24, Math.max(size[2], 0.48)]
    : [Math.max(size[0], 0.48), 0.24, size[2]]
}
