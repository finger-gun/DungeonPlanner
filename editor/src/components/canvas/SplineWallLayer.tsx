import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { getContentPackRoomSetById } from '../../content-packs/registry'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import {
  applyComputedSplineWallRenderEntry,
  applySplineWallMeshDataToGeometry,
  getCachedSplineWallRenderEntries,
  getSplineWallRenderCacheSourceKey,
  type SplineWallRenderEntry,
} from '../../rendering/splineWallRenderCache'
import {
  canDispatchSplineWallComputePrototype,
  collectSplineWallComputePrototypeDebugCutouts,
  dispatchSplineWallComputePrototype,
  prepareSplineWallComputePrototype,
  type SplineWallComputePrototypeDebugCutout,
} from '../../rendering/gpu'
import type { FloorDirtyInfo } from '../../store/floorDirtyDomains'
import {
  buildRoomSplineWallMeshes,
  buildRoomSplineWallMeshesFromGraph,
  type RoomSplineWallMeshData,
} from '../../store/splineWalls'
import { getInheritedWallAssetIdForRoom } from '../../store/wallSegments'
import { buildOpenWallSegmentSet } from '../../store/openWallSegments'
import { getSplineWallSegmentMidpoint, type SplineWallGraph } from '../../store/splineWallGraph'
import {
  useDungeonStore,
  type Layer,
  type OpeningRecord,
  type PaintedCells,
  type Room,
} from '../../store/useDungeonStore'
import { shouldRenderLineOfSightGeometry } from './losRendering'
import { getRoomVisibilityState, type PlayVisibility, type PlayVisibilityState } from './playVisibility'
import {
  type SplineWallMaterialBundle,
  type SplineWallMaterialPreset,
  useSplineWallMaterialLibrary,
} from './splineWallMaterial'
import { useRegisteredLightSources } from './objectSourceRegistry'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import { applyBakedLightToSplineWallMaterialLibrary } from './splineWallBakedLight'

const ROOM_SET_CONTENT_PACK_ID = 'dungeon'
const NODE_HANDLE_COLOR = new THREE.Color('#f59e0b')
const NODE_HANDLE_ACTIVE_COLOR = new THREE.Color('#fbbf24')
const SEGMENT_HANDLE_COLOR = new THREE.Color('#38bdf8')
const NODE_HANDLE_RADIUS = GRID_SIZE * 0.08
const SEGMENT_HANDLE_RADIUS = GRID_SIZE * 0.06
const NODE_HANDLE_Y = 0.08
const SEGMENT_HANDLE_Y = 0.16
const SPLINE_WALL_CUTOUT_DEBUG_COLOR = new THREE.Color('#f97316')
const SPLINE_WALL_CUTOUT_DEBUG_ARCH_SEGMENTS = 12
const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const noRaycast: THREE.Object3D['raycast'] = () => {}

type SplineNodeDragState = {
  nodeId: string
  originalPosition: [number, number]
  position: [number, number]
}

export function SplineWallLayer({
  floorId,
  dirtyInfo = null,
  paintedCells,
  splineWallGraph,
  layers,
  rooms,
  wallOpenings,
  wallSurfaceAssetIds,
  wallSurfaceProps,
  globalWallAssetId,
  bakedLightField = null,
  visibility,
}: {
  floorId: string
  dirtyInfo?: FloorDirtyInfo | null
  paintedCells: PaintedCells
  splineWallGraph: SplineWallGraph
  layers: Record<string, Layer>
  rooms: Record<string, Room>
  wallOpenings: Record<string, OpeningRecord>
  wallSurfaceAssetIds: Record<string, string>
  wallSurfaceProps: Record<string, Record<string, unknown>>
  globalWallAssetId: string | null
  bakedLightField?: BakedFloorLightField | null
  visibility: PlayVisibility
}) {
  const renderer = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const activeWallMaterialSetId = useDungeonStore((state) => state.activeWallMaterialSetId)
  const wallMaterials = useSplineWallMaterialLibrary(activeWallMaterialSetId)
  const registeredLightSources = useRegisteredLightSources(floorId)
  const dynamicPointLightsActive = registeredLightSources.length > 0
  const activeFloorId = useDungeonStore((state) => state.activeFloorId)
  const tool = useDungeonStore((state) => state.tool)
  const roomEditMode = useDungeonStore((state) => state.roomEditMode)
  const showSplineWallCutoutDebug = useDungeonStore((state) => state.showSplineWallCutoutDebug)
  const moveSplineWallNode = useDungeonStore((state) => state.moveSplineWallNode)
  const removeSplineWallNode = useDungeonStore((state) => state.removeSplineWallNode)
  const splitSplineWallSegment = useDungeonStore((state) => state.splitSplineWallSegment)
  const [dragNodeState, setDragNodeState] = useState<SplineNodeDragState | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const lastDispatchedComputeKeysRef = useRef(new Map<string, string>())
  const graphSuppressedWallKeys = useMemo(
    () => buildSplineSuppressedWallSegmentSet({}, wallSurfaceAssetIds, wallSurfaceProps),
    [wallSurfaceAssetIds, wallSurfaceProps],
  )
  const legacySuppressedWallKeys = useMemo(
    () => buildSplineSuppressedWallSegmentSet(wallOpenings, wallSurfaceAssetIds, wallSurfaceProps),
    [wallOpenings, wallSurfaceAssetIds, wallSurfaceProps],
  )
  const suppressedWallKeys = Object.keys(splineWallGraph.paths).length > 0
    ? graphSuppressedWallKeys
    : legacySuppressedWallKeys
  const visibleLayerIds = useMemo(
    () => new Set(Object.values(layers).filter((layer) => layer.visible).map((layer) => layer.id)),
    [layers],
  )
  const effectiveSplineWallGraph = useMemo(() => {
    if (!dragNodeState) {
      return splineWallGraph
    }

    const node = splineWallGraph.nodes[dragNodeState.nodeId]
    if (!node) {
      return splineWallGraph
    }

    return {
      ...splineWallGraph,
      nodes: {
        ...splineWallGraph.nodes,
        [dragNodeState.nodeId]: {
          ...node,
          position: [...dragNodeState.position] as [number, number],
        },
      },
    }
  }, [dragNodeState, splineWallGraph])
  const showNodeHandles = floorId === activeFloorId
    && tool === 'room'
    && roomEditMode === 'walls'
    && Object.keys(splineWallGraph.paths).length > 0
  const wallMeshes = useMemo(
    () => Object.keys(effectiveSplineWallGraph.paths).length > 0
      ? buildRoomSplineWallMeshesFromGraph(effectiveSplineWallGraph, visibleLayerIds, suppressedWallKeys)
      : buildRoomSplineWallMeshes(paintedCells, suppressedWallKeys),
    [effectiveSplineWallGraph, paintedCells, suppressedWallKeys, visibleLayerIds],
  )
  const cachedWallEntries = useMemo(
    () => dragNodeState
        ? []
      : getCachedSplineWallRenderEntries({
          floorId,
          dirtyInfo,
          paintedCells,
          splineWallGraph,
          visibleLayerIds,
          suppressedWallKeys,
        }),
    [dirtyInfo, dragNodeState, floorId, paintedCells, splineWallGraph, suppressedWallKeys, visibleLayerIds],
  )
  const visibleGraphNodes = useMemo(
    () => showNodeHandles
      ? Object.values(effectiveSplineWallGraph.nodes).filter((node) => visibleLayerIds.has(node.layerId))
      : [],
    [effectiveSplineWallGraph.nodes, showNodeHandles, visibleLayerIds],
  )
  const visibleGraphSegments = useMemo(
    () => showNodeHandles && !dragNodeState
      ? Object.values(effectiveSplineWallGraph.segments).filter((segment) =>
          visibleLayerIds.has(segment.layerId)
          && (!segment.wallKey || !suppressedWallKeys.has(segment.wallKey))
          && Boolean(effectiveSplineWallGraph.nodes[segment.startNodeId] && effectiveSplineWallGraph.nodes[segment.endNodeId]))
      : [],
    [dragNodeState, effectiveSplineWallGraph.nodes, effectiveSplineWallGraph.segments, showNodeHandles, suppressedWallKeys, visibleLayerIds],
  )
  const splineWallCutoutDebugData = useMemo(
    () => showSplineWallCutoutDebug && Object.keys(effectiveSplineWallGraph.paths).length > 0
      ? collectSplineWallComputePrototypeDebugCutouts(
          effectiveSplineWallGraph,
          visibleLayerIds,
          null,
          {},
        )
      : [],
    [effectiveSplineWallGraph, showSplineWallCutoutDebug, visibleLayerIds],
  )
  const visibleGraphRoomIds = useMemo(
    () => [...new Set(
      Object.values(splineWallGraph.paths)
        .filter((path) => visibleLayerIds.has(path.layerId))
        .map((path) => path.roomId)
        .filter((roomId): roomId is string => typeof roomId === 'string' && roomId.length > 0),
    )],
    [splineWallGraph.paths, visibleLayerIds],
  )
  const computeDispatchRoomIds = useMemo(() => {
    if (!dirtyInfo || dirtyInfo.fullRefresh) {
      return visibleGraphRoomIds
    }

    const affectedRoomIds = new Set(
      Object.values(splineWallGraph.segments)
        .filter((segment) => segment.wallKey && dirtyInfo.dirtyWallKeys.includes(segment.wallKey))
        .map((segment) => segment.roomId)
        .filter((roomId): roomId is string => typeof roomId === 'string' && roomId.length > 0),
    )

    return affectedRoomIds.size > 0 ? [...affectedRoomIds] : visibleGraphRoomIds
  }, [dirtyInfo, splineWallGraph.segments, visibleGraphRoomIds])
  const roomVisibilityById = useMemo(() => {
    if (!visibility.active) {
      return new Map<string, PlayVisibilityState>()
    }

    const roomIds = new Set<string>([
      ...cachedWallEntries.map((entry) => entry.roomId),
      ...wallMeshes.map((mesh) => mesh.roomId),
    ])

    return new Map(
      [...roomIds].map((roomId) => [
        roomId,
        getRoomVisibilityState(roomId, paintedCells, visibility.getCellVisibility),
      ]),
    )
  }, [cachedWallEntries, paintedCells, visibility, wallMeshes])
  const handleCommitNodeMove = useCallback((nodeId: string, position: [number, number]) => {
    moveSplineWallNode(nodeId, position)
  }, [moveSplineWallNode])
  const handleRemoveNode = useCallback((nodeId: string) => {
    setSelectedNodeId((current) => (current === nodeId ? null : current))
    removeSplineWallNode(nodeId)
  }, [removeSplineWallNode])
  const handleSplitSegment = useCallback((segmentId: string) => {
    splitSplineWallSegment(segmentId)
  }, [splitSplineWallSegment])

  useEffect(() => {
    Object.values(wallMaterials).forEach(({ side, top }) => {
      side.needsUpdate = true
      top.needsUpdate = true
    })
  }, [dynamicPointLightsActive, wallMaterials])

  useEffect(() => {
    applyBakedLightToSplineWallMaterialLibrary(wallMaterials, bakedLightField)
  }, [bakedLightField, wallMaterials])

  useEffect(() => {
    if (!selectedNodeId || effectiveSplineWallGraph.nodes[selectedNodeId]) {
      return
    }

    setSelectedNodeId(null)
  }, [effectiveSplineWallGraph.nodes, selectedNodeId])

  useEffect(() => {
    if (!showNodeHandles || !selectedNodeId) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Backspace' && event.key !== 'Delete') {
        return
      }

      event.preventDefault()
      setSelectedNodeId(null)
      removeSplineWallNode(selectedNodeId)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [removeSplineWallNode, selectedNodeId, showNodeHandles])

  useEffect(() => {
    if (
      dragNodeState
      || Object.keys(splineWallGraph.paths).length === 0
      || !canDispatchSplineWallComputePrototype(renderer)
      || computeDispatchRoomIds.length === 0
    ) {
      return
    }

    const expectedSourceKey = getSplineWallRenderCacheSourceKey(floorId)
    if (!expectedSourceKey) {
      return
    }

    let cancelled = false

    const dispatchCompute = async () => {
      for (const roomId of computeDispatchRoomIds) {
        if (cancelled) {
          return
        }

        const dispatchKey = `${expectedSourceKey}|${roomId}`
        if (lastDispatchedComputeKeysRef.current.get(roomId) === dispatchKey) {
          continue
        }

        const prototype = prepareSplineWallComputePrototype({
          floorId,
          splineWallGraph,
          visibleLayerIds,
          suppressedWallKeys,
          roomIds: new Set([roomId]),
        })
        if (!prototype) {
          continue
        }

        try {
          const geometry = await dispatchSplineWallComputePrototype(renderer, prototype)
          if (cancelled) {
            return
          }

          const applied = applyComputedSplineWallRenderEntry({
            floorId,
            roomId,
            expectedSourceKey,
            meshData: {
              roomId,
              ...geometry,
            },
          })
          if (applied) {
            lastDispatchedComputeKeysRef.current.set(roomId, dispatchKey)
            invalidate()
          }
        } catch (error) {
          console.error('Failed to dispatch spline wall compute for room', roomId, error)
        }
      }
    }

    void dispatchCompute()

    return () => {
      cancelled = true
    }
  }, [
    dragNodeState,
    floorId,
    invalidate,
    renderer,
    splineWallGraph,
    suppressedWallKeys,
    computeDispatchRoomIds,
    visibleLayerIds,
  ])

  return (
    <>
      {dragNodeState
        ? wallMeshes.map((meshData) => {
            const roomVisibility = visibility.active
              ? (roomVisibilityById.get(meshData.roomId) ?? 'hidden')
              : 'visible'
            if (!shouldRenderLineOfSightGeometry(roomVisibility, visibility.active)) {
              return null
            }

            return (
              <SplineWallPreviewMesh
                key={meshData.roomId}
                meshData={meshData}
                materialBundle={wallMaterials[getSplineWallMaterialPreset(rooms[meshData.roomId], globalWallAssetId)]}
              />
            )
          })
        : cachedWallEntries.map((entry) => {
            const roomVisibility = visibility.active
              ? (roomVisibilityById.get(entry.roomId) ?? 'hidden')
              : 'visible'
            if (!shouldRenderLineOfSightGeometry(roomVisibility, visibility.active)) {
              return null
            }

            return (
              <SplineWallCachedMesh
                key={entry.roomId}
                entry={entry}
                materialBundle={wallMaterials[getSplineWallMaterialPreset(rooms[entry.roomId], globalWallAssetId)]}
              />
            )
          })}
      {showNodeHandles ? (
        <SplineWallNodeHandles
          nodes={visibleGraphNodes}
          dragState={dragNodeState}
          selectedNodeId={selectedNodeId}
          setDragState={setDragNodeState}
          setSelectedNodeId={setSelectedNodeId}
          onCommitNodeMove={handleCommitNodeMove}
          onRemoveNode={handleRemoveNode}
        />
      ) : null}
      {showNodeHandles ? (
        <SplineWallSegmentHandles
          graph={effectiveSplineWallGraph}
          segments={visibleGraphSegments}
          onSplitSegment={handleSplitSegment}
        />
      ) : null}
      {showSplineWallCutoutDebug ? (
        <SplineWallCutoutDebugOverlay cutouts={splineWallCutoutDebugData} />
      ) : null}
    </>
  )
}

function SplineWallCachedMesh({
  entry,
  materialBundle,
}: {
  entry: SplineWallRenderEntry
  materialBundle: SplineWallMaterialBundle
}) {
  return (
    <mesh
      geometry={entry.geometry}
      castShadow
      receiveShadow
      raycast={noRaycast}
      material={[materialBundle.side, materialBundle.top]}
    />
  )
}

function SplineWallPreviewMesh({
  meshData,
  materialBundle,
}: {
  meshData: RoomSplineWallMeshData
  materialBundle: SplineWallMaterialBundle
}) {
  const geometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry()
    applySplineWallMeshDataToGeometry(nextGeometry, meshData)
    return nextGeometry
  }, [meshData])

  useEffect(() => () => {
    geometry.dispose()
  }, [geometry])

  return (
    <mesh
      geometry={geometry}
      castShadow
      receiveShadow
      raycast={noRaycast}
      material={[materialBundle.side, materialBundle.top]}
    />
  )
}

function SplineWallCutoutDebugOverlay({
  cutouts,
}: {
  cutouts: readonly SplineWallComputePrototypeDebugCutout[]
}) {
  const geometry = useMemo(
    () => buildSplineWallCutoutDebugGeometry(cutouts),
    [cutouts],
  )
  const material = useMemo(
    () => new THREE.LineBasicMaterial({
      color: SPLINE_WALL_CUTOUT_DEBUG_COLOR,
      transparent: true,
      opacity: 0.95,
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    }),
    [],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  if (cutouts.length === 0 || geometry.getAttribute('position').count === 0) {
    return null
  }

  return (
    <lineSegments
      geometry={geometry}
      material={material}
      renderOrder={8}
      raycast={noRaycast}
    />
  )
}

function getSplineWallMaterialPreset(
  room: Room | undefined,
  globalWallAssetId: string | null,
): SplineWallMaterialPreset {
  const inheritedWallAssetId = getInheritedWallAssetIdForRoom(room, globalWallAssetId)
  if (inheritedWallAssetId?.includes('cave')) {
    return 'cave'
  }

  const roomSet = getContentPackRoomSetById(ROOM_SET_CONTENT_PACK_ID, room?.roomSetId)
  if (roomSet?.id === 'timber-frame') {
    return 'timber'
  }

  return 'dungeon'
}

function buildSplineWallCutoutDebugGeometry(
  cutouts: readonly SplineWallComputePrototypeDebugCutout[],
) {
  const positions: number[] = []

  cutouts.forEach((cutout) => {
    const frontLoop = buildSplineWallCutoutDebugLoop(cutout, cutout.halfThickness)
    const backLoop = buildSplineWallCutoutDebugLoop(cutout, -cutout.halfThickness)

    appendSplineWallCutoutDebugLoopSegments(positions, frontLoop)
    appendSplineWallCutoutDebugLoopSegments(positions, backLoop)

    const connectorCount = Math.min(frontLoop.length, backLoop.length)
    for (let index = 0; index < connectorCount; index += 1) {
      appendSplineWallCutoutDebugLine(positions, frontLoop[index]!, backLoop[index]!)
    }
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  return geometry
}

function buildSplineWallCutoutDebugLoop(
  cutout: SplineWallComputePrototypeDebugCutout,
  depth: number,
) {
  if (cutout.shapeType === 1 && cutout.radius > 0) {
    return buildSplineWallArchedCutoutDebugLoop(cutout, depth)
  }

  return [
    getSplineWallCutoutDebugPoint(cutout, cutout.startDistance, depth, cutout.bottomHeight),
    getSplineWallCutoutDebugPoint(cutout, cutout.endDistance, depth, cutout.bottomHeight),
    getSplineWallCutoutDebugPoint(cutout, cutout.endDistance, depth, cutout.topHeight),
    getSplineWallCutoutDebugPoint(cutout, cutout.startDistance, depth, cutout.topHeight),
  ]
}

function buildSplineWallArchedCutoutDebugLoop(
  cutout: SplineWallComputePrototypeDebugCutout,
  depth: number,
) {
  const loop = [
    getSplineWallCutoutDebugPoint(cutout, cutout.startDistance, depth, cutout.bottomHeight),
    getSplineWallCutoutDebugPoint(cutout, cutout.endDistance, depth, cutout.bottomHeight),
  ]
  const centerDistance = (cutout.startDistance + cutout.endDistance) / 2

  for (let step = 0; step <= SPLINE_WALL_CUTOUT_DEBUG_ARCH_SEGMENTS; step += 1) {
    const angle = (step / SPLINE_WALL_CUTOUT_DEBUG_ARCH_SEGMENTS) * Math.PI
    loop.push(getSplineWallCutoutDebugPoint(
      cutout,
      centerDistance + (Math.cos(angle) * cutout.radius),
      depth,
      cutout.archBaseHeight + (Math.sin(angle) * cutout.radius),
    ))
  }

  return loop
}

function getSplineWallCutoutDebugPoint(
  cutout: SplineWallComputePrototypeDebugCutout,
  distance: number,
  depth: number,
  height: number,
): [number, number, number] {
  const lateralX = -cutout.tangent[1]
  const lateralZ = cutout.tangent[0]
  return [
    cutout.origin[0] + (cutout.tangent[0] * distance) + (lateralX * depth),
    height,
    cutout.origin[1] + (cutout.tangent[1] * distance) + (lateralZ * depth),
  ]
}

function appendSplineWallCutoutDebugLoopSegments(
  positions: number[],
  loop: ReadonlyArray<readonly [number, number, number]>,
) {
  if (loop.length < 2) {
    return
  }

  for (let index = 0; index < loop.length; index += 1) {
    appendSplineWallCutoutDebugLine(
      positions,
      loop[index]!,
      loop[(index + 1) % loop.length]!,
    )
  }
}

function appendSplineWallCutoutDebugLine(
  positions: number[],
  start: readonly [number, number, number],
  end: readonly [number, number, number],
) {
  positions.push(
    start[0], start[1], start[2],
    end[0], end[1], end[2],
  )
}

function SplineWallSegmentHandles({
  graph,
  segments,
  onSplitSegment,
}: {
  graph: SplineWallGraph
  segments: Array<SplineWallGraph['segments'][string]>
  onSplitSegment: (segmentId: string) => void
}) {
  const handleGeometry = useMemo(
    () => new THREE.OctahedronGeometry(SEGMENT_HANDLE_RADIUS, 0),
    [],
  )

  useEffect(() => () => {
    handleGeometry.dispose()
  }, [handleGeometry])

  return (
    <>
      {segments.map((segment) => {
        const midpoint = getSplineWallSegmentMidpoint(graph, segment.id)
        if (!midpoint) {
          return null
        }

        return (
          <mesh
            key={segment.id}
            geometry={handleGeometry}
            position={[midpoint[0] * GRID_SIZE, SEGMENT_HANDLE_Y, midpoint[1] * GRID_SIZE]}
            castShadow={false}
            receiveShadow={false}
            onClick={(event) => {
              event.stopPropagation()
              onSplitSegment(segment.id)
            }}
          >
            <meshStandardMaterial
              color={SEGMENT_HANDLE_COLOR}
              emissive={SEGMENT_HANDLE_COLOR}
              emissiveIntensity={0.25}
              roughness={0.35}
              metalness={0.2}
            />
          </mesh>
        )
      })}
    </>
  )
}

function SplineWallNodeHandles({
  nodes,
  dragState,
  selectedNodeId,
  setDragState,
  setSelectedNodeId,
  onCommitNodeMove,
  onRemoveNode,
}: {
  nodes: Array<SplineWallGraph['nodes'][string]>
  dragState: SplineNodeDragState | null
  selectedNodeId: string | null
  setDragState: Dispatch<SetStateAction<SplineNodeDragState | null>>
  setSelectedNodeId: Dispatch<SetStateAction<string | null>>
  onCommitNodeMove: (nodeId: string, position: [number, number]) => void
  onRemoveNode: (nodeId: string) => void
}) {
  const { controls, gl, invalidate } = useThree()
  const handleGeometry = useMemo(
    () => new THREE.SphereGeometry(NODE_HANDLE_RADIUS, 16, 16),
    [],
  )

  useEffect(() => () => {
    handleGeometry.dispose()
  }, [handleGeometry])

  useEffect(() => {
    const orbitControls = controls as { enabled?: boolean } | undefined
    if (orbitControls && 'enabled' in orbitControls) {
      orbitControls.enabled = !dragState
    }
    gl.domElement.style.cursor = dragState ? 'grabbing' : ''

    return () => {
      if (orbitControls && 'enabled' in orbitControls) {
        orbitControls.enabled = true
      }
      gl.domElement.style.cursor = ''
    }
  }, [controls, dragState, gl])

  const updateDragPosition = useCallback((
    event: ThreeEvent<PointerEvent>,
    nodeId: string,
    originalPosition: [number, number],
  ) => {
    const intersection = new THREE.Vector3()
    if (!event.ray.intersectPlane(DRAG_PLANE, intersection)) {
      return
    }

    const nextPosition = snapSplineNodePosition([
      intersection.x / GRID_SIZE,
      intersection.z / GRID_SIZE,
    ])

    setDragState((current) => (
      current?.nodeId === nodeId
        ? { ...current, position: nextPosition }
        : {
            nodeId,
            originalPosition,
            position: nextPosition,
          }
    ))
    invalidate()
  }, [invalidate, setDragState])

  const finishDrag = useCallback((event: ThreeEvent<PointerEvent>, nodeId: string) => {
    if (dragState?.nodeId !== nodeId) {
      return
    }

    event.stopPropagation()
    const target = event.target as PointerCaptureTarget
    target.releasePointerCapture?.(event.pointerId)
    const changed = dragState.originalPosition[0] !== dragState.position[0]
      || dragState.originalPosition[1] !== dragState.position[1]
    const finalPosition = dragState.position
    setDragState(null)
    if (changed) {
      onCommitNodeMove(nodeId, finalPosition)
    }
    invalidate()
  }, [dragState, invalidate, onCommitNodeMove, setDragState])

  return (
    <>
      {nodes.map((node) => {
        const position = dragState?.nodeId === node.id ? dragState.position : node.position
        const active = dragState?.nodeId === node.id || selectedNodeId === node.id

        return (
          <mesh
            key={node.id}
            geometry={handleGeometry}
            position={[position[0] * GRID_SIZE, NODE_HANDLE_Y, position[1] * GRID_SIZE]}
            castShadow={false}
            receiveShadow={false}
            onPointerDown={(event) => {
              event.stopPropagation()
              const target = event.target as PointerCaptureTarget
              target.setPointerCapture?.(event.pointerId)
              setSelectedNodeId(node.id)
              updateDragPosition(event, node.id, [...node.position] as [number, number])
            }}
            onPointerMove={(event) => {
              if (dragState?.nodeId !== node.id) {
                return
              }

              event.stopPropagation()
              updateDragPosition(event, node.id, dragState.originalPosition)
            }}
            onPointerUp={(event) => finishDrag(event, node.id)}
            onPointerCancel={(event) => finishDrag(event, node.id)}
            onClick={(event) => {
              event.stopPropagation()
              setSelectedNodeId(node.id)
            }}
            onContextMenu={(event) => {
              event.stopPropagation()
              event.nativeEvent.preventDefault()
              setDragState(null)
              setSelectedNodeId(null)
              onRemoveNode(node.id)
            }}
          >
            <meshStandardMaterial
              color={active ? NODE_HANDLE_ACTIVE_COLOR : NODE_HANDLE_COLOR}
              emissive={active ? NODE_HANDLE_ACTIVE_COLOR : NODE_HANDLE_COLOR}
              emissiveIntensity={active ? 0.7 : 0.35}
              roughness={0.45}
              metalness={0.1}
            />
          </mesh>
        )
      })}
    </>
  )
}

function buildSplineSuppressedWallSegmentSet(
  wallOpenings: Record<string, OpeningRecord>,
  wallSurfaceAssetIds: Record<string, string>,
  wallSurfaceProps: Record<string, Record<string, unknown>>,
) {
  const suppressed = buildOpenWallSegmentSet(wallOpenings, wallSurfaceAssetIds, wallSurfaceProps)
  for (const wallKey of Object.keys(wallSurfaceAssetIds)) {
    suppressed.add(wallKey)
  }
  return suppressed
}

function snapSplineNodePosition(position: [number, number]): [number, number] {
  return [
    Math.round(position[0] * 4) / 4,
    Math.round(position[1] * 4) / 4,
  ]
}

type PointerCaptureTarget = EventTarget & {
  setPointerCapture?: (pointerId: number) => void
  releasePointerCapture?: (pointerId: number) => void
}
