import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import * as THREE from 'three'
import { getContentPackRoomSetById } from '../../content-packs/registry'
import { getCellKey, GRID_SIZE } from '../../hooks/useSnapToGrid'
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
  DEFAULT_SPLINE_WALL_HEIGHT,
  type RoomSplineWallMeshData,
} from '../../store/splineWalls'
import { getInheritedWallAssetIdForRoom } from '../../store/wallSegments'
import { buildOpenWallSegmentSet } from '../../store/openWallSegments'
import { getSplineWallSegmentMidpoint, type SplineWallGraph } from '../../store/splineWallGraph'
import {
  createSplineWallQueryCache,
  findNearestSplineWallSegment,
  getSplineWallSegmentQueryData,
  sampleSplineWallSegment,
  type SplineWallQueryCache,
} from '../../store/splineWallQueries'
import {
  deriveSplineWallAssemblyData,
  type SplineWallAssemblySection,
} from '../../store/splineWallAssembly'
import {
  buildSplineWallInsertDescriptors,
  getSplineWallInsertPlacement,
  type SplineWallInsertDescriptor,
} from '../../store/splineWallInserts'
import {
  buildSplineWallOpeningDescriptorMapBySectionId,
  buildSplineWallOpeningDescriptors,
  type SplineWallOpeningDescriptor,
} from '../../store/splineWallOpenings'
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
  applySplineWallDisplacementNodes,
  applySplineWallParallaxNodes,
  configureSplineWallTexture,
  type SplineWallMaterialBundle,
  type SplineWallMaterialPreset,
  type SplineWallPbrTextures,
  useSplineWallMaterialLibrary,
} from './splineWallMaterial'
import { useRegisteredLightSources } from './objectSourceRegistry'
import {
  getRelevantStaticLightSourcesForBounds,
  sampleOccludedSurfaceLightAtWorldPosition,
  type BakedFloorLightField,
} from '../../rendering/dungeonLightField'
import {
  applyBakedLightToSplineWallMaterialLibrary,
  applyBakedLightToSplineWallTopCapMaterial,
  applyBakedLightToSplineWallStyleMaterial,
} from './splineWallBakedLight'
import { ContentPackInstance } from './ContentPackInstance'
import { createStandardCompatibleMaterial } from '../../rendering/nodeMaterialUtils'
import {
  createSplineWallSegmentSideSelectionKey,
  parseSplineWallSegmentSideSelectionKey,
  type SplineWallSegmentSide,
} from '../../store/wallStyleAssignments'
import { AUTOFOCUS_RAYCAST_LAYER } from './autofocusRaycast'

const ROOM_SET_CONTENT_PACK_ID = 'dungeon'
const NODE_HANDLE_COLOR = new THREE.Color('#f59e0b')
const NODE_HANDLE_ACTIVE_COLOR = new THREE.Color('#fbbf24')
const SEGMENT_HANDLE_COLOR = new THREE.Color('#38bdf8')
const WALL_STYLE_HANDLE_COLOR = new THREE.Color('#a855f7')
const WALL_STYLE_HANDLE_ACTIVE_COLOR = new THREE.Color('#c084fc')
const NODE_HANDLE_RADIUS = GRID_SIZE * 0.08
const SEGMENT_HANDLE_RADIUS = GRID_SIZE * 0.06
const WALL_STYLE_HANDLE_RADIUS = GRID_SIZE * 0.05
const NODE_HANDLE_Y = 0.08
const SEGMENT_HANDLE_Y = 0.16
const WALL_STYLE_HANDLE_Y = 1.1
const SPLINE_WALL_CUTOUT_DEBUG_COLOR = new THREE.Color('#f97316')
const SPLINE_WALL_CUTOUT_DEBUG_ARCH_SEGMENTS = 12
const DRAG_PLANE = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
const noRaycast: THREE.Object3D['raycast'] = () => {}
const AUTOFOCUS_PROXY_MATERIAL = new THREE.MeshBasicMaterial({
  colorWrite: false,
  depthWrite: false,
  depthTest: false,
  side: THREE.DoubleSide,
})
const SPLINE_WALL_SECTION_MAX_MITER_SCALE = 2

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
  wallStyleAssignments,
  wallCoreAssignments,
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
  wallStyleAssignments: Record<string, string>
  wallCoreAssignments: Record<string, string>
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
  const selection = useDungeonStore((state) => state.selection)
  const selectObject = useDungeonStore((state) => state.selectObject)
  const showSplineWallCutoutDebug = useDungeonStore((state) => state.showSplineWallCutoutDebug)
  const moveSplineWallNode = useDungeonStore((state) => state.moveSplineWallNode)
  const removeSplineWallNode = useDungeonStore((state) => state.removeSplineWallNode)
  const splitSplineWallSegment = useDungeonStore((state) => state.splitSplineWallSegment)
  const [dragNodeState, setDragNodeState] = useState<SplineNodeDragState | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const lastDispatchedComputeKeysRef = useRef(new Map<string, string>())
  const graphSuppressedWallKeys = useMemo(() => new Set<string>(), [])
  const legacySuppressedWallKeys = useMemo(
    () => buildSplineSuppressedWallSegmentSet(wallOpenings),
    [wallOpenings],
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
  const hasGraphWalls = Object.keys(effectiveSplineWallGraph.paths).length > 0
  const showNodeHandles = floorId === activeFloorId
    && tool === 'room'
    && roomEditMode === 'walls'
    && Object.keys(splineWallGraph.paths).length > 0
  const wallMeshes = useMemo(
    () => hasGraphWalls ? [] : buildRoomSplineWallMeshes(paintedCells, suppressedWallKeys),
    [hasGraphWalls, paintedCells, suppressedWallKeys],
  )
  const cachedWallEntries = useMemo(
    () => dragNodeState || hasGraphWalls
        ? []
      : getCachedSplineWallRenderEntries({
          floorId,
          dirtyInfo,
          paintedCells,
          splineWallGraph,
          visibleLayerIds,
          suppressedWallKeys,
        }),
    [dirtyInfo, dragNodeState, floorId, hasGraphWalls, paintedCells, splineWallGraph, suppressedWallKeys, visibleLayerIds],
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
    () => showSplineWallCutoutDebug && hasGraphWalls
      ? collectSplineWallComputePrototypeDebugCutouts(
          effectiveSplineWallGraph,
          visibleLayerIds,
          null,
          {},
        )
      : [],
    [effectiveSplineWallGraph, hasGraphWalls, showSplineWallCutoutDebug, visibleLayerIds],
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
    if (hasGraphWalls) {
      return []
    }
    if (!dirtyInfo || dirtyInfo.fullRefresh) {
      return visibleGraphRoomIds
    }

    if (dirtyInfo.dirtyCellKeys.length > 0) {
      return visibleGraphRoomIds
    }

    const affectedRoomIds = new Set(
      Object.values(splineWallGraph.segments)
        .filter((segment) => segment.wallKey && dirtyInfo.dirtyWallKeys.includes(segment.wallKey))
        .map((segment) => segment.roomId)
        .filter((roomId): roomId is string => typeof roomId === 'string' && roomId.length > 0),
    )

    return affectedRoomIds.size > 0 ? [...affectedRoomIds] : visibleGraphRoomIds
  }, [dirtyInfo, hasGraphWalls, splineWallGraph.segments, visibleGraphRoomIds])
  const roomVisibilityById = useMemo(() => {
    if (!visibility.active) {
      return new Map<string, PlayVisibilityState>()
    }

    const roomIds = new Set<string>([
      ...cachedWallEntries.map((entry) => entry.roomId),
      ...wallMeshes.map((mesh) => mesh.roomId),
      ...Object.values(effectiveSplineWallGraph.paths)
        .map((path) => path.roomId)
        .filter((roomId): roomId is string => typeof roomId === 'string' && roomId.length > 0),
    ])

    return new Map(
      [...roomIds].map((roomId) => [
        roomId,
        getRoomVisibilityState(roomId, paintedCells, visibility.getCellVisibility),
      ]),
    )
  }, [cachedWallEntries, effectiveSplineWallGraph.paths, paintedCells, visibility, wallMeshes])
  const wallQueryCache = useMemo(
    () => createSplineWallQueryCache(effectiveSplineWallGraph, { visibleLayerIds }),
    [effectiveSplineWallGraph, visibleLayerIds],
  )
  const { analyzedBoundaries, assemblySections } = useMemo(
    () => hasGraphWalls
      ? deriveSplineWallAssemblyData({
          splineWallGraph: effectiveSplineWallGraph,
          visibleLayerIds,
          wallStyleAssignments,
          wallCoreAssignments,
          rooms,
        })
      : { analyzedBoundaries: [], assemblySections: [] },
    [effectiveSplineWallGraph, hasGraphWalls, rooms, visibleLayerIds, wallCoreAssignments, wallStyleAssignments],
  )
  const renderSectionGroups = useMemo(
    () => buildSplineWallRenderSectionGroups(assemblySections),
    [assemblySections],
  )
  const wallSectionGroups = useMemo(
    () => renderSectionGroups.filter((group) => group.sections[0]?.layerKind !== 'structural-core'),
    [renderSectionGroups],
  )
  const topCapSectionGroups = useMemo(
    () => renderSectionGroups.filter((group) => group.sections[0]?.layerKind === 'structural-core'),
    [renderSectionGroups],
  )
  const openingDescriptors = useMemo(
    () => hasGraphWalls
      ? buildSplineWallOpeningDescriptors({
          splineWallGraph: effectiveSplineWallGraph,
          wallOpenings,
          assemblySections,
        })
      : [],
    [assemblySections, effectiveSplineWallGraph, hasGraphWalls, wallOpenings],
  )
  const openingDescriptorsBySectionId = useMemo(
    () => buildSplineWallOpeningDescriptorMapBySectionId(openingDescriptors),
    [openingDescriptors],
  )
  const structuralCoreSegmentIds = useMemo(
    () => new Set(
      assemblySections
        .filter((section) => section.layerKind === 'structural-core')
        .map((section) => section.structuralSegmentId),
    ),
    [assemblySections],
  )
  const insertDescriptors = useMemo(
    () => buildSplineWallInsertDescriptors({
      analyzedBoundaries,
      assemblySections: assemblySections.filter((section) => section.layerKind !== 'structural-core'),
    }),
    [analyzedBoundaries, assemblySections],
  )
  const selectedWallSection = useMemo(
    () => parseSplineWallSegmentSideSelectionKey(selection),
    [selection],
  )
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
    applyBakedLightToSplineWallMaterialLibrary(wallMaterials, null, {
      useAttributeLight: Boolean(bakedLightField),
    })
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
      || hasGraphWalls
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
    hasGraphWalls,
    invalidate,
    renderer,
    splineWallGraph,
    suppressedWallKeys,
    computeDispatchRoomIds,
    visibleLayerIds,
  ])

  return (
    <>
      {!hasGraphWalls && dragNodeState
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
                bakedLightField={bakedLightField}
              />
            )
          })
        : !hasGraphWalls
          ? cachedWallEntries.map((entry) => {
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
                bakedLightField={bakedLightField}
              />
            )
          })
          : null}
      {wallSectionGroups.map((group) => {
        const section = group.sections[0]!
        const roomVisibility = visibility.active
          ? (section.roomId ? (roomVisibilityById.get(section.roomId) ?? 'hidden') : 'visible')
          : 'visible'
        if (!shouldRenderLineOfSightGeometry(roomVisibility, visibility.active)) {
          return null
        }

        return (
          <SplineWallStyleSectionGroupMesh
            key={group.id}
            group={group}
            queryCache={wallQueryCache}
            openingsBySectionId={openingDescriptorsBySectionId}
            topCapOwnerStructuralSegmentIds={structuralCoreSegmentIds}
            bakedLightField={bakedLightField}
            selectable={tool === 'select' || (tool === 'room' && roomEditMode === 'walls')}
            onSelect={(segmentId, side) => selectObject(createSplineWallSegmentSideSelectionKey(segmentId, side))}
          />
        )
      })}
      {topCapSectionGroups.map((group) => {
        const section = group.sections[0]!
        const roomVisibility = visibility.active
          ? (section.roomId ? (roomVisibilityById.get(section.roomId) ?? 'hidden') : 'visible')
          : 'visible'
        if (!shouldRenderLineOfSightGeometry(roomVisibility, visibility.active)) {
          return null
        }

        return (
          <SplineWallTopCapGroupMesh
            key={`${group.id}:top-cap`}
            group={group}
            queryCache={wallQueryCache}
            openingsBySectionId={openingDescriptorsBySectionId}
            bakedLightField={bakedLightField}
          />
        )
      })}
      {openingDescriptors
        .filter((descriptor) =>
          shouldRenderSplineWallOpeningReveal(descriptor, structuralCoreSegmentIds))
        .map((descriptor) => {
          const section = assemblySections.find((candidate) => candidate.id === descriptor.sectionId)
          if (!section) {
            return null
          }
          const roomVisibility = visibility.active
            ? (descriptor.roomId ? (roomVisibilityById.get(descriptor.roomId) ?? 'hidden') : 'visible')
            : 'visible'
          if (!shouldRenderLineOfSightGeometry(roomVisibility, visibility.active)) {
            return null
          }

          return (
            <SplineWallOpeningRevealMesh
              key={`${descriptor.id}:reveal`}
              descriptor={descriptor}
              section={section}
              queryCache={wallQueryCache}
              bakedLightField={bakedLightField}
            />
          )
        })}
      {insertDescriptors.map((descriptor) => {
        const roomVisibility = visibility.active
          ? (descriptor.roomId ? (roomVisibilityById.get(descriptor.roomId) ?? 'hidden') : 'visible')
          : 'visible'
        if (!shouldRenderLineOfSightGeometry(roomVisibility, visibility.active)) {
          return null
        }

        return (
          <SplineWallSemanticInsert
            key={descriptor.id}
            descriptor={descriptor}
            queryCache={wallQueryCache}
            bakedLightField={bakedLightField}
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
      {showNodeHandles ? (
        <SplineWallStyleHandles
          sections={assemblySections}
          queryCache={wallQueryCache}
          selection={selectedWallSection}
          onSelect={(segmentId, side) => selectObject(createSplineWallSegmentSideSelectionKey(segmentId, side))}
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
  bakedLightField,
}: {
  entry: SplineWallRenderEntry
  materialBundle: SplineWallMaterialBundle
  bakedLightField: BakedFloorLightField | null
}) {
  useEffect(() => {
    syncSplineWallGeometryBakedLight(entry.geometry, bakedLightField)
  }, [bakedLightField, entry.geometry])

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
  bakedLightField,
}: {
  meshData: RoomSplineWallMeshData
  materialBundle: SplineWallMaterialBundle
  bakedLightField: BakedFloorLightField | null
}) {
  const geometry = useMemo(() => {
    const nextGeometry = new THREE.BufferGeometry()
    applySplineWallMeshDataToGeometry(nextGeometry, meshData)
    return nextGeometry
  }, [meshData])

  useEffect(() => {
    syncSplineWallGeometryBakedLight(geometry, bakedLightField)
  }, [bakedLightField, geometry])
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

type SplineWallRenderSectionGroup = {
  id: string
  sections: readonly SplineWallAssemblySection[]
}
type SplineWallSectionSample = NonNullable<ReturnType<typeof sampleSplineWallSegment>>
type SplineWallSectionRun = {
  sectionIndex: number
  section: SplineWallAssemblySection
  bandStartHeight: number
  bandEndHeight: number
  bandProfile: readonly (readonly [number, number])[]
  bandProfileUvDistances: readonly number[]
  startSample: SplineWallSectionSample
  endSample: SplineWallSectionSample
  startUvDistance: number
  endUvDistance: number
}

function SplineWallStyleSectionGroupMesh({
  group,
  queryCache,
  openingsBySectionId,
  topCapOwnerStructuralSegmentIds,
  bakedLightField,
  selectable,
  onSelect,
}: {
  group: SplineWallRenderSectionGroup
  queryCache: SplineWallQueryCache
  openingsBySectionId: ReadonlyMap<string, readonly SplineWallOpeningDescriptor[]>
  topCapOwnerStructuralSegmentIds: ReadonlySet<string>
  bakedLightField: BakedFloorLightField | null
  selectable: boolean
  onSelect: (segmentId: string, side: SplineWallSegmentSide) => void
}) {
  const section = group.sections[0]!
  const geometryKey = createSplineWallSectionGroupGeometryKey(
    group,
    openingsBySectionId,
    queryCache,
    topCapOwnerStructuralSegmentIds,
  )
  const geometryCacheRef = useRef<{ key: string; geometry: THREE.BufferGeometry } | null>(null)
  if (!geometryCacheRef.current || geometryCacheRef.current.key !== geometryKey) {
    geometryCacheRef.current?.geometry.dispose()
    geometryCacheRef.current = {
      key: geometryKey,
      geometry: buildSplineWallSectionGroupGeometry(
        group.sections,
        queryCache,
        openingsBySectionId,
        topCapOwnerStructuralSegmentIds,
      ),
    }
  }
  const geometry = geometryCacheRef.current.geometry

  const textures = useSplineWallStyleTextures(section.material)
  const material = useMemo(() => {
    const polygonOffset = getSplineWallSectionPolygonOffset(section)
    return createSplineWallStyleMaterial(section, textures, polygonOffset)
  }, [section, textures])
  const allowOppositeFallback = section.layerKind !== 'exterior-face'

  useEffect(() => () => geometryCacheRef.current?.geometry.dispose(), [])
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => {
    syncSplineWallGeometryBakedLight(geometry, bakedLightField, {
      allowOppositeFallback,
    })
    applyBakedLightToSplineWallStyleMaterial(material, null, {
      useDirectionAttribute: true,
      useDirectionalFaceMask: true,
      useDirectionalSampleOffset: false,
    })
  }, [allowOppositeFallback, bakedLightField, geometry, material])

  if ((geometry.getAttribute('position')?.count ?? 0) === 0) {
    return null
  }
  const selectionSide = section.side

  return (
    <>
      <mesh
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        raycast={selectable ? undefined : noRaycast}
        renderOrder={section.layerKind === 'structural-core' ? 0 : 1}
        onPointerDown={selectable && selectionSide ? (event) => {
          const hit = findNearestSplineWallSegment(queryCache, [event.point.x, event.point.z])
          if (!hit) {
            return
          }

          event.stopPropagation()
          onSelect(hit.segmentId, selectionSide)
        } : undefined}
      />
      <SplineWallAutofocusProxy geometry={geometry} />
    </>
  )
}

function SplineWallTopCapGroupMesh({
  group,
  queryCache,
  openingsBySectionId,
  bakedLightField,
}: {
  group: SplineWallRenderSectionGroup
  queryCache: SplineWallQueryCache
  openingsBySectionId: ReadonlyMap<string, readonly SplineWallOpeningDescriptor[]>
  bakedLightField: BakedFloorLightField | null
}) {
  const section = group.sections[0]!
  const geometryKey = createSplineWallSectionGroupGeometryKey(group, openingsBySectionId, queryCache)
  const geometryCacheRef = useRef<{ key: string; geometry: THREE.BufferGeometry } | null>(null)
  if (!geometryCacheRef.current || geometryCacheRef.current.key !== geometryKey) {
    geometryCacheRef.current?.geometry.dispose()
    geometryCacheRef.current = {
      key: geometryKey,
      geometry: buildSplineWallTopCapGroupGeometry(group.sections, queryCache, openingsBySectionId),
    }
  }
  const geometry = geometryCacheRef.current.geometry
  const material = useMemo(() => createSplineWallTopCapMaterial(section), [section])

  useEffect(() => () => geometryCacheRef.current?.geometry.dispose(), [])
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => {
    syncSplineWallGeometryBakedLight(geometry, bakedLightField, {
      allowOppositeFallback: false,
    })
    applyBakedLightToSplineWallTopCapMaterial(material, bakedLightField)
  }, [bakedLightField, geometry, material])

  if ((geometry.getAttribute('position')?.count ?? 0) === 0) {
    return null
  }

  return (
    <>
      <mesh
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        raycast={noRaycast}
        renderOrder={2}
      />
      <SplineWallAutofocusProxy geometry={geometry} />
    </>
  )
}

function SplineWallOpeningRevealMesh({
  descriptor,
  section,
  queryCache,
  bakedLightField,
}: {
  descriptor: SplineWallOpeningDescriptor
  section: SplineWallAssemblySection
  queryCache: SplineWallQueryCache
  bakedLightField: BakedFloorLightField | null
}) {
  const geometryKey = createSplineWallOpeningRevealGeometryKey(section, descriptor, queryCache)
  const geometryCacheRef = useRef<{ key: string; geometry: THREE.BufferGeometry } | null>(null)
  if (!geometryCacheRef.current || geometryCacheRef.current.key !== geometryKey) {
    geometryCacheRef.current?.geometry.dispose()
    geometryCacheRef.current = {
      key: geometryKey,
      geometry: buildSplineWallOpeningRevealGeometry(section, descriptor, queryCache),
    }
  }
  const geometry = geometryCacheRef.current.geometry
  const textures = useSplineWallStyleTextures(section.material)
  const material = useMemo(() => createSplineWallStyleMaterial(section, textures, {
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  }), [section, textures])
  const allowOppositeFallback = section.layerKind !== 'exterior-face'

  useEffect(() => () => geometryCacheRef.current?.geometry.dispose(), [])
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => {
    syncSplineWallGeometryBakedLight(geometry, bakedLightField, {
      allowOppositeFallback,
    })
    applyBakedLightToSplineWallStyleMaterial(material, null, {
      useDirectionAttribute: true,
      useDirectionalFaceMask: true,
      useDirectionalSampleOffset: false,
    })
  }, [allowOppositeFallback, bakedLightField, geometry, material])

  if ((geometry.getAttribute('position')?.count ?? 0) === 0) {
    return null
  }

  return (
    <>
      <mesh
        geometry={geometry}
        material={material}
        castShadow
        receiveShadow
        raycast={noRaycast}
        renderOrder={2}
      />
      <SplineWallAutofocusProxy geometry={geometry} />
    </>
  )
}

function SplineWallAutofocusProxy({
  geometry,
}: {
  geometry: THREE.BufferGeometry
}) {
  const ref = useRef<THREE.Mesh>(null)
  useLayoutEffect(() => {
    ref.current?.layers.set(AUTOFOCUS_RAYCAST_LAYER)
  }, [])

  return (
    <mesh
      ref={ref}
      dispose={null}
      geometry={geometry}
      material={AUTOFOCUS_PROXY_MATERIAL}
      userData={{ lensFocusProxy: true }}
      renderOrder={-100}
    />
  )
}

function SplineWallSemanticInsert({
  descriptor,
  queryCache,
  bakedLightField,
}: {
  descriptor: SplineWallInsertDescriptor
  queryCache: SplineWallQueryCache
  bakedLightField: BakedFloorLightField | null
}) {
  const placement = getSplineWallInsertPlacement(descriptor, queryCache)
  return (
    <ContentPackInstance
      assetId={descriptor.assetId}
      variant="prop"
      position={[placement.position[0], 0, placement.position[1]]}
      rotation={[0, 0, 0]}
      castShadow
      receiveShadow
      bakedLightField={bakedLightField}
      useLineOfSightPostMask={false}
    />
  )
}

function SplineWallStyleHandles({
  sections,
  queryCache,
  selection,
  onSelect,
}: {
  sections: readonly SplineWallAssemblySection[]
  queryCache: SplineWallQueryCache
  selection: { segmentId: string; side: SplineWallSegmentSide } | null
  onSelect: (segmentId: string, side: SplineWallSegmentSide) => void
}) {
  const handleEntries = useMemo(() => sections.flatMap((section) => {
    if (!section.side || (section.layerKind !== 'room-face' && section.layerKind !== 'exterior-face')) {
      return []
    }
    const midpoint = sampleSplineWallSegment(queryCache, section.segmentId, 0.5)
    if (!midpoint) {
      return []
    }

    const sideNormal = getSectionSideNormal(section.side, midpoint.normal)
    return [{
      id: section.id,
      segmentId: section.segmentId,
      side: section.side,
      position: [
        midpoint.position[0] + (sideNormal[0] * GRID_SIZE * 0.18),
        WALL_STYLE_HANDLE_Y,
        midpoint.position[1] + (sideNormal[1] * GRID_SIZE * 0.18),
      ] as const,
    }]
  }), [queryCache, sections])

  return handleEntries.map((handle) => {
    const active = selection?.segmentId === handle.segmentId && selection.side === handle.side
    return (
      <mesh
        key={handle.id}
        position={handle.position}
        onPointerDown={(event) => {
          event.stopPropagation()
          onSelect(handle.segmentId, handle.side)
        }}
      >
        <sphereGeometry args={[WALL_STYLE_HANDLE_RADIUS, 12, 12]} />
        <meshStandardMaterial color={active ? WALL_STYLE_HANDLE_ACTIVE_COLOR : WALL_STYLE_HANDLE_COLOR} />
      </mesh>
    )
  })
}

export function buildSplineWallRenderSectionGroups(
  sections: readonly SplineWallAssemblySection[],
): SplineWallRenderSectionGroup[] {
  const groups = new Map<string, SplineWallAssemblySection[]>()

  sections.forEach((section) => {
    const key = getSplineWallRenderSectionGroupKey(section)
    const existing = groups.get(key)
    if (existing) {
      existing.push(section)
    } else {
      groups.set(key, [section])
    }
  })

  return [...groups.entries()].map(([id, groupSections]) => ({
    id,
    sections: groupSections,
  }))
}

function getSplineWallRenderSectionGroupKey(section: SplineWallAssemblySection) {
  return [
    section.pathId,
    section.layerKind,
    section.roomId ?? 'no-room',
    section.oppositeRoomId ?? 'no-opposite-room',
    section.side ?? 'center',
    section.wallStyleId,
    createSplineWallProfileSignature(section),
    createSplineWallMaterialSignature(section),
    section.render?.hiddenProfileSegmentIndices?.join(',') ?? 'visible',
  ].join('|')
}

function createSplineWallProfileSignature(section: SplineWallAssemblySection) {
  return section.profile.points.map((point) => `${point[0]},${point[1]}`).join(';')
}

function createSplineWallMaterialSignature(section: SplineWallAssemblySection) {
  return JSON.stringify({
    textures: section.material.textures,
    shading: section.material.shading ?? null,
    uv: section.material.uv ?? null,
  })
}

export function buildSplineWallSectionGeometry(
  section: SplineWallAssemblySection,
  queryCache: SplineWallQueryCache,
  openings: readonly SplineWallOpeningDescriptor[],
  topCapOwnerStructuralSegmentIds: ReadonlySet<string> | null = null,
) {
  return buildSplineWallSectionGroupGeometry(
    [section],
    queryCache,
    new Map([[section.id, openings]]),
    topCapOwnerStructuralSegmentIds,
  )
}

export function buildSplineWallTopCapGroupGeometry(
  sections: readonly SplineWallAssemblySection[],
  queryCache: SplineWallQueryCache,
  openingsBySectionId: ReadonlyMap<string, readonly SplineWallOpeningDescriptor[]>,
) {
  const structuralSections = sections.filter((section) => section.layerKind === 'structural-core')
  if (structuralSections.length === 0) {
    return new THREE.BufferGeometry()
  }

  const topCapProfile = getSplineWallTopCapProfile(structuralSections[0]!)
  if (topCapProfile.points.length < 2) {
    return new THREE.BufferGeometry()
  }

  const sampleRuns = buildSplineWallTopCapSampleRuns(structuralSections, queryCache, openingsBySectionId)
  if (sampleRuns.length === 0) {
    return new THREE.BufferGeometry()
  }

  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []
  const rowSize = topCapProfile.points.length
  let vertexOffset = 0

  sampleRuns.forEach((sampleRun) => {
    const samples = mergeSplineWallSectionLoopClosureSamples(sampleRun)
    if (samples.length < 2) {
      return
    }

    const sampleDistances = buildSampleUvDistances(samples, 0)
    samples.forEach((_, sampleIndex) => {
      topCapProfile.points.forEach((point, pointIndex) => {
        const position = getSectionProfileStripWorldPoint(
          structuralSections[0]!,
          samples,
          sampleIndex,
          point,
        )
        positions.push(position[0], position[1], position[2])
        normals.push(0, 1, 0)
        uvs.push(sampleDistances[sampleIndex] ?? 0, topCapProfile.uvDistances[pointIndex] ?? pointIndex)
      })
    })

    for (let sampleIndex = 0; sampleIndex < samples.length - 1; sampleIndex += 1) {
      const baseIndex = vertexOffset + sampleIndex * rowSize
      for (let pointIndex = 0; pointIndex < rowSize - 1; pointIndex += 1) {
        const current = baseIndex + pointIndex
        const next = current + rowSize
        indices.push(
          current,
          current + 1,
          next + 1,
          current,
          next + 1,
          next,
        )
      }
    }

    vertexOffset += samples.length * rowSize
  })

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
  return geometry
}

export function buildSplineWallSectionGroupGeometry(
  sections: readonly SplineWallAssemblySection[],
  queryCache: SplineWallQueryCache,
  openingsBySectionId: ReadonlyMap<string, readonly SplineWallOpeningDescriptor[]>,
  topCapOwnerStructuralSegmentIds: ReadonlySet<string> | null = null,
) {
  const geometry = new THREE.BufferGeometry()
  if (sections.length === 0 || sections[0]!.profile.points.length < 2) {
    return geometry
  }

  if (
    sections.length > 1
    && !hasSplineWallSectionGroupOpenings(sections, openingsBySectionId)
    && shouldUseContinuousSplineWallSectionGroupGeometry(sections)
  ) {
    return buildContinuousSplineWallSectionGroupGeometry(
      sections,
      queryCache,
      topCapOwnerStructuralSegmentIds,
    )
  }

  const positions: number[] = []
  const indices: number[] = []
  const uvs: number[] = []
  const bakedLightDirections: number[] = []
  const boundaryRunsBySectionIndex = new Map<number, { start: SplineWallSectionRun[]; end: SplineWallSectionRun[] }>()
  let vertexOffset = 0
  let sectionUvDistanceOffset = 0

  sections.forEach((section, sectionIndex) => {
    const resolvedWallHeight = getSectionResolvedWallHeight(section)
    const profileUvDistances = buildSectionProfileUvDistances(section, resolvedWallHeight)
    const queryData = getSplineWallSegmentQueryData(queryCache, section.segmentId)
    const bands = buildSplineWallSectionHeightBands(section, openingsBySectionId.get(section.id) ?? [])
    bands.forEach((band) => {
      const adjustedBandEndHeight = getSplineWallGeometryBandEndHeight(
        section,
        band.endHeight,
        topCapOwnerStructuralSegmentIds,
      )
      if (adjustedBandEndHeight - band.startHeight <= 1e-5) {
        return
      }

      const bandProfile = clipSectionProfilePointsToBand(section, band.startHeight, adjustedBandEndHeight, {
        hideRenderSegments: true,
      })
      const renderBandProfile = subdivideSectionProfileForDisplacement(section, bandProfile, resolvedWallHeight)
      if (renderBandProfile.length < 2) {
        return
      }
      const bandProfileUvDistances = renderBandProfile.map((point) =>
        getSectionProfileUvV(section, point, profileUvDistances, resolvedWallHeight))
      const bandRuns: SplineWallSectionRun[] = []

      band.visibleIntervals.forEach(([startRatio, endRatio]) => {
        const sectionStartRatio = getSectionSegmentRatio(section, startRatio)
        const sectionEndRatio = getSectionSegmentRatio(section, endRatio)
        const samples = sampleSplineWallSectionInterval(
          queryCache,
          section.segmentId,
          sectionStartRatio,
          sectionEndRatio,
          getSectionGeometrySampleStep(section),
        )
        if (samples.length < 2) {
          return
        }
        const sampleUvDistances = buildSampleUvDistances(
          samples,
          sectionUvDistanceOffset + (queryData ? getSplineWallSegmentUvDistanceAtRatio(queryData, sectionStartRatio) : 0),
        )

        samples.forEach((sample, sampleIndex) => {
          const bakedLightDirection = getSectionBakedLightDirection(section, sample)
          renderBandProfile.forEach((point, pointIndex) => {
            const [worldX, worldY, worldZ] = getSectionProfileStripWorldPoint(
              section,
              samples,
              sampleIndex,
              point,
            )
            positions.push(worldX, worldY, worldZ)
            uvs.push(
              getSectionUvU(section, sampleUvDistances[sampleIndex]!, resolvedWallHeight),
              bandProfileUvDistances[pointIndex]!,
            )
            bakedLightDirections.push(bakedLightDirection[0], 0, bakedLightDirection[1])
          })
        })

        const rowSize = renderBandProfile.length
        const reverseWinding = shouldReverseSectionFaceWinding(section)
        for (let rowIndex = 0; rowIndex < samples.length - 1; rowIndex += 1) {
          for (let columnIndex = 0; columnIndex < rowSize - 1; columnIndex += 1) {
            const a = vertexOffset + (rowIndex * rowSize) + columnIndex
            const b = a + rowSize
            const c = b + 1
            const d = a + 1
            if (reverseWinding) {
              indices.push(a, d, b, b, d, c)
            } else {
              indices.push(a, b, d, b, c, d)
            }
          }
        }

        bandRuns.push({
          sectionIndex,
          section,
          bandStartHeight: band.startHeight,
          bandEndHeight: band.endHeight,
          bandProfile: renderBandProfile,
          bandProfileUvDistances,
          startSample: samples[0]!,
          endSample: samples[samples.length - 1]!,
          startUvDistance: sampleUvDistances[0]!,
          endUvDistance: sampleUvDistances[sampleUvDistances.length - 1]!,
        })
        vertexOffset += samples.length * rowSize
      })

      if (bandRuns.length === 0) {
        return
      }

      boundaryRunsBySectionIndex.set(sectionIndex, {
        start: [
          ...(boundaryRunsBySectionIndex.get(sectionIndex)?.start ?? []),
          bandRuns[0]!,
        ],
        end: [
          ...(boundaryRunsBySectionIndex.get(sectionIndex)?.end ?? []),
          bandRuns[bandRuns.length - 1]!,
        ],
      })
    })

    sectionUvDistanceOffset += queryData
      ? Math.abs(
          getSplineWallSegmentUvDistanceAtRatio(queryData, section.endRatio)
          - getSplineWallSegmentUvDistanceAtRatio(queryData, section.startRatio),
        )
      : section.length * GRID_SIZE
  })

  appendSplineWallSectionBoundarySeams(
    sections,
    boundaryRunsBySectionIndex,
    positions,
    indices,
    uvs,
    bakedLightDirections,
  )

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('uv2', new THREE.Float32BufferAttribute([...uvs], 2))
  setBakedLightDirectionAttribute(geometry, bakedLightDirections)
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  smoothSplineWallGeometryNormalsByPosition(geometry)
  syncBakedLightDirectionsToGeometryNormals(geometry)
  geometry.computeBoundingSphere()
  return geometry
}

function hasSplineWallSectionGroupOpenings(
  sections: readonly SplineWallAssemblySection[],
  openingsBySectionId: ReadonlyMap<string, readonly SplineWallOpeningDescriptor[]>,
) {
  return sections.some((section) => (openingsBySectionId.get(section.id)?.length ?? 0) > 0)
}

function shouldUseContinuousSplineWallSectionGroupGeometry(
  sections: readonly SplineWallAssemblySection[],
) {
  return sections.every((section, index) => {
    const nextIndex = index === sections.length - 1 ? 0 : index + 1
    const nextSection = sections[nextIndex]
    if (!nextSection || !pointsEqual2(section.end, nextSection.start)) {
      return true
    }
    if (nextIndex === 0 && sections.length < 3) {
      return true
    }

    const currentTangent = normalize2([
      section.end[0] - section.start[0],
      section.end[1] - section.start[1],
    ], [0, 0])
    const nextTangent = normalize2([
      nextSection.end[0] - nextSection.start[0],
      nextSection.end[1] - nextSection.start[1],
    ], [0, 0])
    const tangentCross = Math.abs(cross2(currentTangent, nextTangent))
    const tangentDot = (currentTangent[0] * nextTangent[0]) + (currentTangent[1] * nextTangent[1])

    return tangentCross <= 0.25 && tangentDot >= 0.95
  })
}

function buildContinuousSplineWallSectionGroupGeometry(
  sections: readonly SplineWallAssemblySection[],
  queryCache: SplineWallQueryCache,
  topCapOwnerStructuralSegmentIds: ReadonlySet<string> | null,
) {
  const geometry = new THREE.BufferGeometry()
  const section = sections[0]!
  const profilePoints = section.profile.points
  if (profilePoints.length < 2) {
    return geometry
  }

  const sampleRuns = buildContinuousSplineWallSectionSampleRuns(sections, queryCache)
  if (sampleRuns.length === 0) {
    return geometry
  }

  const positions: number[] = []
  const indices: number[] = []
  const uvs: number[] = []
  const bakedLightDirections: number[] = []
  let vertexOffset = 0
  const resolvedWallHeight = getSectionResolvedWallHeight(section)
  const profileUvDistances = buildSectionProfileUvDistances(section, resolvedWallHeight)
  const bands = buildSplineWallSectionHeightBands(section, [])
  bands.forEach((band) => {
    const adjustedBandEndHeight = getSplineWallGeometryBandEndHeight(
      section,
      band.endHeight,
      topCapOwnerStructuralSegmentIds,
    )
    if (adjustedBandEndHeight - band.startHeight <= 1e-5) {
      return
    }

    const bandProfile = clipSectionProfilePointsToBand(section, band.startHeight, adjustedBandEndHeight, {
      hideRenderSegments: true,
    })
    const renderBandProfile = subdivideSectionProfileForDisplacement(section, bandProfile, resolvedWallHeight)
    if (renderBandProfile.length < 2) {
      return
    }
    const bandProfileUvDistances = renderBandProfile.map((point) =>
      getSectionProfileUvV(section, point, profileUvDistances, resolvedWallHeight))

    sampleRuns.forEach((sampleRun) => {
      const samples = mergeSplineWallSectionLoopClosureSamples(sampleRun)
      if (samples.length < 2) {
        return
      }
      const sampleUvDistances = buildSampleUvDistances(samples, 0)
      samples.forEach((sample, sampleIndex) => {
        const bakedLightDirection = getSectionBakedLightDirection(section, sample)
        renderBandProfile.forEach((point, pointIndex) => {
          const [worldX, worldY, worldZ] = getSectionProfileStripWorldPoint(
            section,
            samples,
            sampleIndex,
            point,
          )
          positions.push(worldX, worldY, worldZ)
          uvs.push(
            getSectionUvU(section, sampleUvDistances[sampleIndex]!, resolvedWallHeight),
            bandProfileUvDistances[pointIndex]!,
          )
          bakedLightDirections.push(bakedLightDirection[0], 0, bakedLightDirection[1])
        })
      })

      const rowSize = renderBandProfile.length
      const reverseWinding = shouldReverseSectionFaceWinding(section)
      for (let rowIndex = 0; rowIndex < samples.length - 1; rowIndex += 1) {
        for (let columnIndex = 0; columnIndex < rowSize - 1; columnIndex += 1) {
          const a = vertexOffset + (rowIndex * rowSize) + columnIndex
          const b = a + rowSize
          const c = b + 1
          const d = a + 1
          if (reverseWinding) {
            indices.push(a, d, b, b, d, c)
          } else {
            indices.push(a, b, d, b, c, d)
          }
        }
      }

      vertexOffset += samples.length * rowSize
    })
  })

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('uv2', new THREE.Float32BufferAttribute([...uvs], 2))
  setBakedLightDirectionAttribute(geometry, bakedLightDirections)
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  smoothSplineWallGeometryNormalsByPosition(geometry)
  syncBakedLightDirectionsToGeometryNormals(geometry)
  geometry.computeBoundingSphere()
  return geometry
}

function buildContinuousSplineWallSectionSampleRuns(
  sections: readonly SplineWallAssemblySection[],
  queryCache: SplineWallQueryCache,
) {
  const runs: SplineWallSectionSample[][] = []
  let currentRun: SplineWallSectionSample[] = []

  sections.forEach((section) => {
    const samples = sampleSplineWallSectionInterval(
      queryCache,
      section.segmentId,
      section.startRatio,
      section.endRatio,
      getSectionGeometrySampleStep(section),
    )
    if (samples.length < 2) {
      return
    }

    if (currentRun.length === 0) {
      currentRun = [...samples]
      return
    }

    const previous = currentRun.at(-1)!
    const next = samples[0]!
    if (canMergeSplineWallSectionSamples(previous, next)) {
      currentRun[currentRun.length - 1] = mergeSplineWallSectionSamples(previous, next)
      currentRun.push(...samples.slice(1))
      return
    }

    runs.push(currentRun)
    currentRun = [...samples]
  })

  if (currentRun.length > 0) {
    runs.push(currentRun)
  }

  return runs
}

function canMergeSplineWallSectionSamples(
  previous: SplineWallSectionSample,
  next: SplineWallSectionSample,
) {
  return Math.hypot(
    previous.position[0] - next.position[0],
    previous.position[1] - next.position[1],
  ) <= 1e-5
}

function mergeSplineWallSectionSamples(
  previous: SplineWallSectionSample,
  next: SplineWallSectionSample,
): SplineWallSectionSample {
  return {
    ...previous,
    tangent: normalize2([
      previous.tangent[0] + next.tangent[0],
      previous.tangent[1] + next.tangent[1],
    ], previous.tangent),
    normal: normalize2([
      previous.normal[0] + next.normal[0],
      previous.normal[1] + next.normal[1],
    ], previous.normal),
  }
}

function mergeSplineWallSectionLoopClosureSamples(
  samples: readonly SplineWallSectionSample[],
) {
  if (samples.length < 2) {
    return samples
  }

  const first = samples[0]!
  const last = samples.at(-1)!
  if (!canMergeSplineWallSectionSamples(first, last)) {
    return samples
  }

  const mergedClosureSample = mergeSplineWallSectionSamples(first, last)
  const mergedSamples = [...samples]
  mergedSamples[0] = mergedClosureSample
  mergedSamples[mergedSamples.length - 1] = mergedClosureSample
  return mergedSamples
}

function getSplineWallTopCapProfile(section: SplineWallAssemblySection) {
  const maxHeight = Math.max(...section.profile.points.map((point) => point[1]))
  const points = section.profile.points.filter((point) => Math.abs(point[1] - maxHeight) <= 1e-5)
  return {
    points,
    uvDistances: buildProfileUvDistances(points, getSectionResolvedWallHeight(section)),
  }
}

function buildSplineWallTopCapSampleRuns(
  sections: readonly SplineWallAssemblySection[],
  queryCache: SplineWallQueryCache,
  openingsBySectionId: ReadonlyMap<string, readonly SplineWallOpeningDescriptor[]>,
) {
  const runs: SplineWallSectionSample[][] = []
  let currentRun: SplineWallSectionSample[] = []

  const appendRunSamples = (samples: readonly SplineWallSectionSample[]) => {
    if (samples.length < 2) {
      return
    }
    if (currentRun.length === 0) {
      currentRun = [...samples]
      return
    }

    const previous = currentRun.at(-1)!
    const next = samples[0]!
    if (canMergeSplineWallSectionSamples(previous, next)) {
      currentRun[currentRun.length - 1] = mergeSplineWallSectionSamples(previous, next)
      currentRun.push(...samples.slice(1))
      return
    }

    runs.push(currentRun)
    currentRun = [...samples]
  }

  sections.forEach((section) => {
    const resolvedWallHeight = getSectionResolvedWallHeight(section)
    const topBand = buildSplineWallSectionHeightBands(
      section,
      openingsBySectionId.get(section.id) ?? [],
    ).find((band) => Math.abs(band.endHeight - resolvedWallHeight) <= 1e-5)

    if (!topBand || topBand.visibleIntervals.length === 0) {
      if (currentRun.length > 0) {
        runs.push(currentRun)
        currentRun = []
      }
      return
    }

    topBand.visibleIntervals.forEach(([startRatio, endRatio]) => {
      appendRunSamples(sampleSplineWallSectionInterval(
        queryCache,
        section.segmentId,
        getSectionSegmentRatio(section, startRatio),
        getSectionSegmentRatio(section, endRatio),
        getSectionGeometrySampleStep(section),
      ))
    })
  })

  if (currentRun.length > 0) {
    runs.push(currentRun)
  }

  return runs
}

function appendSplineWallSectionBoundarySeams(
  sections: readonly SplineWallAssemblySection[],
  boundaryRunsBySectionIndex: ReadonlyMap<number, { start: readonly SplineWallSectionRun[]; end: readonly SplineWallSectionRun[] }>,
  positions: number[],
  indices: number[],
  uvs: number[],
  bakedLightDirections: number[],
) {
  if (sections.length < 2) {
    return
  }

  sections.forEach((section, index) => {
    const nextIndex = index === sections.length - 1 ? 0 : index + 1
    const nextSection = sections[nextIndex]
    if (!nextSection) {
      return
    }

    const closesLoop = nextIndex === 0
    if (!pointsEqual2(section.end, nextSection.start)) {
      return
    }
    if (closesLoop && sections.length < 3) {
      return
    }

    const currentBoundaryRuns = boundaryRunsBySectionIndex.get(index)?.end ?? []
    const nextBoundaryRuns = boundaryRunsBySectionIndex.get(nextIndex)?.start ?? []
    currentBoundaryRuns.forEach((currentRun) => {
      const matchingNextRun = nextBoundaryRuns.find((candidate) =>
        Math.abs(candidate.bandStartHeight - currentRun.bandStartHeight) <= 1e-5
        && Math.abs(candidate.bandEndHeight - currentRun.bandEndHeight) <= 1e-5)
      if (!matchingNextRun) {
        return
      }

      appendSplineWallSectionBoundarySeam(
        currentRun,
        matchingNextRun,
        positions,
        indices,
        uvs,
        bakedLightDirections,
      )
    })
  })
}

function appendSplineWallSectionBoundarySeam(
  currentRun: SplineWallSectionRun,
  nextRun: SplineWallSectionRun,
  positions: number[],
  indices: number[],
  uvs: number[],
  bakedLightDirections: number[],
) {
  const currentSeamProfile = getSectionRunSeamProfile(currentRun)
  const nextSeamProfile = getSectionRunSeamProfile(nextRun)
  if (currentSeamProfile.length < 2 || currentSeamProfile.length !== nextSeamProfile.length) {
    return
  }
  if (!pointsEqual2(currentRun.endSample.position, nextRun.startSample.position)) {
    return
  }

  const tangentCross = Math.abs(cross2(currentRun.endSample.tangent, nextRun.startSample.tangent))
  const tangentDot =
    (currentRun.endSample.tangent[0] * nextRun.startSample.tangent[0])
    + (currentRun.endSample.tangent[1] * nextRun.startSample.tangent[1])
  if (tangentCross <= 1e-4 && tangentDot >= 0.995) {
    return
  }

  const currentResolvedWallHeight = getSectionResolvedWallHeight(currentRun.section)
  const nextResolvedWallHeight = getSectionResolvedWallHeight(nextRun.section)
  const currentU = getSectionUvU(currentRun.section, currentRun.endUvDistance, currentResolvedWallHeight)
  const nextU = getSectionUvU(nextRun.section, nextRun.startUvDistance, nextResolvedWallHeight)
  const seamU = (currentU + nextU) / 2
  const currentDirection = getSectionBakedLightDirection(currentRun.section, currentRun.endSample)
  const nextDirection = getSectionBakedLightDirection(nextRun.section, nextRun.startSample)
  const seamRows = currentSeamProfile.map(({ point, uvV }, index) => {
    const nextProfilePoint = nextSeamProfile[index]!
    const currentPoint = getSectionProfileWorldPoint(currentRun.section, currentRun.endSample, point)
    const nextPoint = getSectionProfileWorldPoint(nextRun.section, nextRun.startSample, nextProfilePoint.point)
    const seamPoint = getSectionProfileBoundarySeamWorldPoint(
      currentRun.section,
      currentRun.endSample.position,
      currentRun.endSample.tangent,
      nextRun.startSample.tangent,
      point,
    )
    return {
      currentPoint,
      seamPoint,
      nextPoint,
      currentV: uvV,
      nextV: nextProfilePoint.uvV,
    }
  })

  if (seamRows.every((row) =>
    Math.hypot(
      row.currentPoint[0] - row.seamPoint[0],
      row.currentPoint[1] - row.seamPoint[1],
      row.currentPoint[2] - row.seamPoint[2],
    ) <= 1e-5
    && Math.hypot(
      row.nextPoint[0] - row.seamPoint[0],
      row.nextPoint[1] - row.seamPoint[1],
      row.nextPoint[2] - row.seamPoint[2],
    ) <= 1e-5)) {
    return
  }

  const vertexOffset = positions.length / 3
  seamRows.forEach((row) => {
    positions.push(...row.currentPoint, ...row.seamPoint, ...row.nextPoint)
    uvs.push(currentU, row.currentV, seamU, row.currentV, nextU, row.nextV)
    bakedLightDirections.push(
      currentDirection[0], 0, currentDirection[1],
      currentDirection[0], 0, currentDirection[1],
      nextDirection[0], 0, nextDirection[1],
    )
  })

  const reverseWinding = shouldReverseSectionFaceWinding(currentRun.section)
  for (let index = 0; index < seamRows.length - 1; index += 1) {
    const a = vertexOffset + (index * 3)
    const b = a + 1
    const c = a + 2
    const d = a + 3
    const e = a + 4
    const f = a + 5
    if (reverseWinding) {
      indices.push(a, d, b, b, d, e, b, e, c, c, e, f)
    } else {
      indices.push(a, b, d, b, e, d, b, c, e, c, f, e)
    }
  }

  function getSectionRunSeamProfile(
    run: SplineWallSectionRun,
  ) {
    if (run.section.layerKind !== 'structural-core') {
      return run.bandProfile.map((point, index) => ({
        point,
        uvV: run.bandProfileUvDistances[index]!,
      }))
    }

    const resolvedWallHeight = getSectionResolvedWallHeight(run.section)
    if (Math.abs(run.bandEndHeight - resolvedWallHeight) > 1e-5) {
      return []
    }

    const maxY = Math.max(...run.bandProfile.map((point) => point[1]))
    return run.bandProfile
      .map((point, index) => ({
        point,
        uvV: run.bandProfileUvDistances[index]!,
      }))
      .filter(({ point }) => Math.abs(point[1] - maxY) <= 1e-5)
  }
}

function getSectionProfileBoundarySeamWorldPoint(
  section: SplineWallAssemblySection,
  position: readonly [number, number],
  incomingTangent: readonly [number, number],
  outgoingTangent: readonly [number, number],
  point: readonly [number, number],
): [number, number, number] {
  const resolvedWallHeight = getSectionResolvedWallHeight(section)
  const lateralOffset = getSectionProfileLateralOffset(section, point)
  const incomingPoint = offsetSectionSamplePoint(section, position, incomingTangent, lateralOffset)
  const outgoingPoint = offsetSectionSamplePoint(section, position, outgoingTangent, lateralOffset)
  const intersection = intersectSectionOffsetLines(
    incomingPoint,
    incomingTangent,
    outgoingPoint,
    outgoingTangent,
  )
  const seamPoint = intersection
    ? clampSectionMiterPoint(position, intersection, lateralOffset)
    : incomingPoint

  return [seamPoint[0], point[1] * resolvedWallHeight, seamPoint[1]]
}

export function shouldRenderSplineWallOpeningReveal(
  descriptor: SplineWallOpeningDescriptor,
  structuralCoreSegmentIds: ReadonlySet<string>,
) {
  if (descriptor.openingMode === 'framed') {
    return false
  }

  if (descriptor.openingMode === 'sleeve') {
    return descriptor.layerKind !== 'structural-core'
  }

  if (descriptor.source === 'manual' && descriptor.layerKind === 'structural-core') {
    return false
  }

  return (descriptor.layerKind === 'structural-core' && descriptor.roomId !== null)
    || (
      descriptor.layerKind === 'room-face'
      && !structuralCoreSegmentIds.has(descriptor.structuralSegmentId)
    )
}

export function buildSplineWallSectionHeightBands(
  section: SplineWallAssemblySection,
  openings: readonly SplineWallOpeningDescriptor[],
) {
  const resolvedWallHeight = getSectionResolvedWallHeight(section)
  const splitHeights = [...new Set([
    0,
    resolvedWallHeight,
    ...openings.flatMap((opening) => [
      clampSectionHeight(opening.bottomHeight, resolvedWallHeight),
      clampSectionHeight(opening.topHeight ?? resolvedWallHeight, resolvedWallHeight),
    ]),
  ])].sort((left, right) => left - right)

  const bands: Array<{
    startHeight: number
    endHeight: number
    visibleIntervals: Array<readonly [number, number]>
  }> = []

  for (let index = 0; index < splitHeights.length - 1; index += 1) {
    const startHeight = splitHeights[index]!
    const endHeight = splitHeights[index + 1]!
    if (endHeight - startHeight <= 1e-5) {
      continue
    }

    const overlappingOpenings = openings
      .filter((opening) => {
        const openingTopHeight = clampSectionHeight(opening.topHeight ?? resolvedWallHeight, resolvedWallHeight)
        return opening.bottomHeight < endHeight - 1e-5 && openingTopHeight > startHeight + 1e-5
      })
      .map((opening) => [Math.max(0, opening.startRatio), Math.min(1, opening.endRatio)] as const)
      .sort((left, right) => left[0] - right[0])

    bands.push({
      startHeight,
      endHeight,
      visibleIntervals: buildVisibleIntervalsFromCutouts(overlappingOpenings),
    })
  }

  return bands
}

function buildVisibleIntervalsFromCutouts(
  cutoutIntervals: readonly (readonly [number, number])[],
) {
  const visibleIntervals: Array<readonly [number, number]> = []
  let cursor = 0

  cutoutIntervals.forEach(([startRatio, endRatio]) => {
    if (startRatio > cursor + 1e-5) {
      visibleIntervals.push([cursor, startRatio])
    }
    cursor = Math.max(cursor, endRatio)
  })

  if (cursor < 1 - 1e-5) {
    visibleIntervals.push([cursor, 1])
  }

  return visibleIntervals
}

function sampleSplineWallSectionInterval(
  queryCache: SplineWallQueryCache,
  segmentId: string,
  startRatio: number,
  endRatio: number,
  maxStep = 0.18,
) {
  const segmentData = getSplineWallSegmentQueryData(queryCache, segmentId)
  if (!segmentData) {
    return []
  }

  const samples = []
  const clampedMaxStep = Math.max(0.025, maxStep)
  const stepCount = Math.max(1, Math.ceil((segmentData.totalLength * Math.max(endRatio - startRatio, 0)) / clampedMaxStep))
  for (let index = 0; index <= stepCount; index += 1) {
    const ratio = startRatio + ((endRatio - startRatio) * (index / stepCount))
    const sample = sampleSplineWallSegment(queryCache, segmentId, ratio)
    if (sample) {
      samples.push(sample)
    }
  }

  return samples
}

function getSectionGeometrySampleStep(section: SplineWallAssemblySection) {
  const displacementScale = section.material.shading?.displacementScale ?? 0
  const vertexStep = section.material.shading?.displacementVertexStep ?? 0
  if (displacementScale <= 0 || vertexStep <= 0) {
    return 0.18
  }

  return Math.min(0.18, vertexStep)
}

function getSectionSegmentRatio(section: SplineWallAssemblySection, localRatio: number) {
  return section.startRatio + ((section.endRatio - section.startRatio) * Math.min(1, Math.max(0, localRatio)))
}

function getSectionSideNormal(
  side: SplineWallSegmentSide,
  normal: readonly [number, number],
): readonly [number, number] {
  return side === 'left' ? normal : ([-normal[0], -normal[1]] as const)
}

function getSectionBakedLightDirection(
  section: SplineWallAssemblySection,
  sample: SplineWallSectionSample,
): readonly [number, number] {
  if (section.layerKind === 'structural-core' || !section.side) {
    return [0, 0]
  }

  return getSectionSideNormal(section.side, sample.normal)
}

function setBakedLightDirectionAttribute(
  geometry: THREE.BufferGeometry,
  directions: readonly number[],
) {
  if (directions.length > 0) {
    geometry.setAttribute('bakedLightDirection', new THREE.Float32BufferAttribute(directions, 3))
  }
}

function syncSplineWallGeometryBakedLight(
  geometry: THREE.BufferGeometry,
  bakedLightField: BakedFloorLightField | null,
  options: { allowOppositeFallback?: boolean } = {},
) {
  const positions = geometry.getAttribute('position')
  if (!positions || positions.count === 0) {
    return
  }

  const normals = geometry.getAttribute('normal')
  let directions = geometry.getAttribute('bakedLightDirection')
  const bakedLightValues = new Float32Array(positions.count * 3)

  if (!bakedLightField) {
    geometry.setAttribute('bakedLight', new THREE.BufferAttribute(bakedLightValues, 3))
    return
  }

  if (
    (!directions || directions.count !== positions.count || directions.itemSize !== 3)
    && normals
    && normals.count === positions.count
  ) {
    syncBakedLightDirectionsToGeometryNormals(geometry)
    directions = geometry.getAttribute('bakedLightDirection')
  }

  geometry.computeBoundingBox()
  const lightLookupBounds = geometry.boundingBox?.clone().expandByScalar(GRID_SIZE * 0.5) ?? null
  const relevantLightSources = getRelevantStaticLightSourcesForBounds(
    bakedLightField,
    lightLookupBounds,
  )

  const resolvedDirectionValues = new Float32Array(positions.count * 3)
  for (let index = 0; index < positions.count; index += 1) {
    const directionX = directions?.getX(index) ?? normals?.getX(index) ?? 0
    const directionY = directions?.getY(index) ?? normals?.getY(index) ?? 0
    const directionZ = directions?.getZ(index) ?? normals?.getZ(index) ?? 0
    const directionLength = Math.hypot(directionX, directionY, directionZ)
    const normalizedDirectionX = directionLength > 1e-5 ? directionX / directionLength : 0
    const normalizedDirectionY = directionLength > 1e-5 ? directionY / directionLength : 0
    const normalizedDirectionZ = directionLength > 1e-5 ? directionZ / directionLength : 0
    const resolvedSample = resolveSplineWallBakedLightSample(
      bakedLightField,
      [positions.getX(index), positions.getY(index), positions.getZ(index)],
      [normalizedDirectionX, normalizedDirectionY, normalizedDirectionZ],
      options,
    )
    const sampledLight = sampleOccludedSurfaceLightAtWorldPosition(
      bakedLightField,
      resolvedSample.position,
      relevantLightSources,
    )
    bakedLightValues[index * 3] = sampledLight[0]
    bakedLightValues[(index * 3) + 1] = sampledLight[1]
    bakedLightValues[(index * 3) + 2] = sampledLight[2]
    resolvedDirectionValues[index * 3] = resolvedSample.direction[0]
    resolvedDirectionValues[(index * 3) + 1] = resolvedSample.direction[1]
    resolvedDirectionValues[(index * 3) + 2] = resolvedSample.direction[2]
  }

  const bakedLightDirectionAttribute = geometry.getAttribute('bakedLightDirection')
  if (
    bakedLightDirectionAttribute instanceof THREE.BufferAttribute
    && bakedLightDirectionAttribute.count === positions.count
    && bakedLightDirectionAttribute.itemSize === 3
  ) {
    bakedLightDirectionAttribute.array.set(resolvedDirectionValues)
    bakedLightDirectionAttribute.needsUpdate = true
  } else {
    geometry.setAttribute('bakedLightDirection', new THREE.BufferAttribute(resolvedDirectionValues, 3))
  }

  const bakedLightAttribute = geometry.getAttribute('bakedLight')
  if (
    bakedLightAttribute instanceof THREE.BufferAttribute
    && bakedLightAttribute.count === positions.count
    && bakedLightAttribute.itemSize === 3
  ) {
    bakedLightAttribute.array.set(bakedLightValues)
    bakedLightAttribute.needsUpdate = true
    return
  }

  geometry.setAttribute('bakedLight', new THREE.BufferAttribute(bakedLightValues, 3))
}

export function resolveSplineWallBakedLightSamplePosition(
  bakedLightField: Pick<BakedFloorLightField, 'sampleByCellKey'>,
  worldPosition: readonly [number, number, number],
  direction: readonly [number, number, number],
  options: { allowOppositeFallback?: boolean } = {},
) {
  return resolveSplineWallBakedLightSample(bakedLightField, worldPosition, direction, options).position
}

export function resolveSplineWallBakedLightSample(
  bakedLightField: Pick<BakedFloorLightField, 'sampleByCellKey'>,
  worldPosition: readonly [number, number, number],
  direction: readonly [number, number, number],
  { allowOppositeFallback = true }: { allowOppositeFallback?: boolean } = {},
) {
  const primary = buildSplineWallBakedLightSamplePosition(worldPosition, direction, 1)
  const horizontalDirectionLength = Math.hypot(direction[0], direction[2])
  if (
    horizontalDirectionLength <= 1e-5
    || isBakedLightSampleInsideFloor(bakedLightField, primary)
    || !allowOppositeFallback
  ) {
    return {
      position: primary,
      direction,
    }
  }

  const opposite = buildSplineWallBakedLightSamplePosition(worldPosition, direction, -1)
  return isBakedLightSampleInsideFloor(bakedLightField, opposite)
    ? {
        position: opposite,
        direction: flipSplineWallBakedLightDirection(direction),
      }
    : {
        position: primary,
        direction,
      }
}

function flipSplineWallBakedLightDirection(direction: readonly [number, number, number]) {
  return direction.map((value) => (value === 0 ? 0 : -value)) as [number, number, number]
}

function buildSplineWallBakedLightSamplePosition(
  worldPosition: readonly [number, number, number],
  direction: readonly [number, number, number],
  directionSign: 1 | -1,
): [number, number, number] {
  return [
    worldPosition[0] + direction[0] * directionSign * GRID_SIZE * 0.24,
    worldPosition[1] + Math.max(direction[1] * directionSign * 0.08, 0.06),
    worldPosition[2] + direction[2] * directionSign * GRID_SIZE * 0.24,
  ]
}

function isBakedLightSampleInsideFloor(
  bakedLightField: Pick<BakedFloorLightField, 'sampleByCellKey'>,
  worldPosition: readonly [number, number, number],
) {
  const cellKey = getCellKey([
    Math.floor(worldPosition[0] / GRID_SIZE),
    Math.floor(worldPosition[2] / GRID_SIZE),
  ])
  return Object.prototype.hasOwnProperty.call(bakedLightField.sampleByCellKey, cellKey)
}

function syncBakedLightDirectionsToGeometryNormals(geometry: THREE.BufferGeometry) {
  const normals = geometry.getAttribute('normal')
  if (!normals || normals.count === 0) {
    return
  }

  const directions = new Float32Array(normals.count * 3)
  for (let index = 0; index < normals.count; index += 1) {
    directions[index * 3] = normals.getX(index)
    directions[(index * 3) + 1] = normals.getY(index)
    directions[(index * 3) + 2] = normals.getZ(index)
  }

  geometry.setAttribute('bakedLightDirection', new THREE.BufferAttribute(directions, 3))
}

function createSplineWallSectionGeometryKey(
  section: SplineWallAssemblySection,
  openings: readonly SplineWallOpeningDescriptor[],
  queryCache: SplineWallQueryCache,
  topCapOwnerStructuralSegmentIds: ReadonlySet<string> | null = null,
) {
  const queryData = getSplineWallSegmentQueryData(queryCache, section.segmentId)
  return [
    section.id,
    section.wallStyleId,
    section.layerKind,
    section.side ?? 'center',
    section.startRatio,
    section.endRatio,
    queryData?.totalLength ?? 0,
    ...(queryData?.edges.flatMap((edge) => [
      edge.start[0],
      edge.start[1],
      edge.end[0],
      edge.end[1],
    ]) ?? []),
    ...section.profile.points.flatMap((point) => [point[0], point[1]]),
    ...(section.render?.hiddenProfileSegmentIndices ?? []),
    hasSplineWallTopCapOwner(section, topCapOwnerStructuralSegmentIds) ? 'top-cap-owned' : 'no-top-cap-owner',
    ...openings.flatMap((opening) => [
      opening.id,
      opening.startRatio,
      opening.endRatio,
      opening.bottomHeight,
      opening.topHeight ?? -1,
      opening.openingMode,
    ]),
  ].join('|')
}

function createSplineWallSectionGroupGeometryKey(
  group: SplineWallRenderSectionGroup,
  openingsBySectionId: ReadonlyMap<string, readonly SplineWallOpeningDescriptor[]>,
  queryCache: SplineWallQueryCache,
  topCapOwnerStructuralSegmentIds: ReadonlySet<string> | null = null,
) {
  return group.sections.map((section) =>
    createSplineWallSectionGeometryKey(
      section,
      openingsBySectionId.get(section.id) ?? [],
      queryCache,
      topCapOwnerStructuralSegmentIds,
    )).join('||')
}

function createSplineWallOpeningRevealGeometryKey(
  section: SplineWallAssemblySection,
  descriptor: SplineWallOpeningDescriptor,
  queryCache: SplineWallQueryCache,
) {
  return [
    createSplineWallSectionGeometryKey(section, [descriptor], queryCache),
    descriptor.bottomHeight,
    descriptor.topHeight ?? -1,
    descriptor.openingMode,
  ].join('|')
}

function getFallbackSectionColor(section: SplineWallAssemblySection) {
  switch (section.layerKind) {
    case 'structural-core':
      return '#7f8a97'
    case 'exterior-face':
      return '#9b7c61'
    default:
      return '#cfd6df'
  }
}

function getSectionResolvedWallHeight(_section: SplineWallAssemblySection) {
  return DEFAULT_SPLINE_WALL_HEIGHT
}

function hasSplineWallTopCapOwner(
  section: SplineWallAssemblySection,
  topCapOwnerStructuralSegmentIds: ReadonlySet<string> | null,
) {
  return section.layerKind !== 'structural-core'
    && (topCapOwnerStructuralSegmentIds?.has(section.structuralSegmentId) ?? false)
}

function getSplineWallGeometryBandEndHeight(
  section: SplineWallAssemblySection,
  endHeight: number,
  topCapOwnerStructuralSegmentIds: ReadonlySet<string> | null,
) {
  const resolvedWallHeight = getSectionResolvedWallHeight(section)
  if (
    !hasSplineWallTopCapOwner(section, topCapOwnerStructuralSegmentIds)
    || Math.abs(endHeight - resolvedWallHeight) > 1e-5
  ) {
    return endHeight
  }

  return endHeight
}

function clampSectionHeight(height: number, resolvedWallHeight: number) {
  return Math.max(0, Math.min(resolvedWallHeight, height))
}

function clipSectionProfilePointsToBand(
  section: SplineWallAssemblySection,
  startHeight: number,
  endHeight: number,
  options: {
    hideRenderSegments?: boolean
  } = {},
) {
  const resolvedWallHeight = getSectionResolvedWallHeight(section)
  const bandStart = startHeight / resolvedWallHeight
  const bandEnd = endHeight / resolvedWallHeight
  const clipped: Array<readonly [number, number]> = []
  const hiddenSegmentIndices = options.hideRenderSegments
    ? new Set(section.render?.hiddenProfileSegmentIndices ?? [])
    : null

  const appendPoint = (point: readonly [number, number]) => {
    const previous = clipped.at(-1)
    if (previous && Math.abs(previous[0] - point[0]) <= 1e-5 && Math.abs(previous[1] - point[1]) <= 1e-5) {
      return
    }
    clipped.push(point)
  }

  for (let index = 0; index < section.profile.points.length - 1; index += 1) {
    const startPoint = section.profile.points[index]!
    const endPoint = section.profile.points[index + 1]!
    const forceStructuralFillSegment = shouldRenderStructuralCoreFillSegment(section, startPoint, endPoint)
    if (hiddenSegmentIndices?.has(index) && !forceStructuralFillSegment) {
      continue
    }

    const clippedSegment = clipProfileSegmentToBand(startPoint, endPoint, bandStart, bandEnd)
    clippedSegment.forEach(appendPoint)
  }

  return clipped
}

function shouldRenderStructuralCoreFillSegment(
  section: SplineWallAssemblySection,
  startPoint: readonly [number, number],
  endPoint: readonly [number, number],
) {
  return section.layerKind === 'structural-core'
    && Math.abs(startPoint[1] - 1) <= 1e-5
    && Math.abs(endPoint[1] - 1) <= 1e-5
    && Math.abs(startPoint[0] - endPoint[0]) > 1e-5
}

function clipProfileSegmentToBand(
  startPoint: readonly [number, number],
  endPoint: readonly [number, number],
  bandStart: number,
  bandEnd: number,
) {
  const deltaY = endPoint[1] - startPoint[1]
  const parameterCandidates = [0, 1]

  if (Math.abs(deltaY) > 1e-5) {
    parameterCandidates.push((bandStart - startPoint[1]) / deltaY, (bandEnd - startPoint[1]) / deltaY)
  }

  const parameters = [...new Set(
    parameterCandidates
      .filter((value) => Number.isFinite(value) && value >= -1e-5 && value <= 1 + 1e-5)
      .map((value) => Math.min(1, Math.max(0, value))),
  )].sort((left, right) => left - right)

  const points: Array<readonly [number, number]> = []
  parameters.forEach((parameter, index) => {
    if (index === parameters.length - 1) {
      return
    }
    const nextParameter = parameters[index + 1]!
    const midpoint = (parameter + nextParameter) / 2
    const midpointY = startPoint[1] + ((endPoint[1] - startPoint[1]) * midpoint)
    if (midpointY < bandStart - 1e-5 || midpointY > bandEnd + 1e-5) {
      return
    }

    points.push(
      interpolateProfilePoint(startPoint, endPoint, parameter),
      interpolateProfilePoint(startPoint, endPoint, nextParameter),
    )
  })

  return points
}

function interpolateProfilePoint(
  startPoint: readonly [number, number],
  endPoint: readonly [number, number],
  parameter: number,
): readonly [number, number] {
  return [
    startPoint[0] + ((endPoint[0] - startPoint[0]) * parameter),
    startPoint[1] + ((endPoint[1] - startPoint[1]) * parameter),
  ]
}

function getSectionProfileWorldPoint(
  section: SplineWallAssemblySection,
  sample: NonNullable<ReturnType<typeof sampleSplineWallSegment>>,
  point: readonly [number, number],
): [number, number, number] {
  const resolvedWallHeight = getSectionResolvedWallHeight(section)
  const lateralOffset = getSectionProfileLateralOffset(section, point)
  const normal = getSectionOffsetNormal(section, sample.tangent)

  return [
    sample.position[0] + (normal[0] * lateralOffset),
    point[1] * resolvedWallHeight,
    sample.position[1] + (normal[1] * lateralOffset),
  ]
}

function getSectionProfileStripWorldPoint(
  section: SplineWallAssemblySection,
  samples: readonly SplineWallSectionSample[],
  sampleIndex: number,
  point: readonly [number, number],
): [number, number, number] {
  const resolvedWallHeight = getSectionResolvedWallHeight(section)
  const [worldX, worldZ] = resolveSectionStripOffsetPoint(
    section,
    samples,
    sampleIndex,
    getSectionProfileLateralOffset(section, point),
  )
  return [worldX, point[1] * resolvedWallHeight, worldZ]
}

function getSectionProfileLateralOffset(
  section: SplineWallAssemblySection,
  point: readonly [number, number],
) {
  return section.layerKind === 'structural-core'
    ? point[0]
    : Math.abs(point[0])
}

function resolveSectionStripOffsetPoint(
  section: SplineWallAssemblySection,
  samples: readonly SplineWallSectionSample[],
  sampleIndex: number,
  lateralOffset: number,
): readonly [number, number] {
  const sample = samples[sampleIndex]!
  if (Math.abs(lateralOffset) <= 1e-5) {
    return sample.position
  }

  const previous = getSectionStripAdjacentSample(samples, sampleIndex, -1)
  const next = getSectionStripAdjacentSample(samples, sampleIndex, 1)
  const incomingTangent = previous
    ? normalize2([
        sample.position[0] - previous.position[0],
        sample.position[1] - previous.position[1],
      ], sample.tangent)
    : null
  const outgoingTangent = next
    ? normalize2([
        next.position[0] - sample.position[0],
        next.position[1] - sample.position[1],
      ], sample.tangent)
    : null

  if (incomingTangent && outgoingTangent) {
    const incomingPoint = offsetSectionSamplePoint(section, sample.position, incomingTangent, lateralOffset)
    const outgoingPoint = offsetSectionSamplePoint(section, sample.position, outgoingTangent, lateralOffset)
    const intersection = intersectSectionOffsetLines(
      incomingPoint,
      incomingTangent,
      outgoingPoint,
      outgoingTangent,
    )
    if (intersection) {
      return clampSectionMiterPoint(sample.position, intersection, lateralOffset)
    }
  }

  return offsetSectionSamplePoint(
    section,
    sample.position,
    outgoingTangent ?? incomingTangent ?? sample.tangent,
    lateralOffset,
  )
}

function getSectionStripAdjacentSample(
  samples: readonly SplineWallSectionSample[],
  sampleIndex: number,
  direction: -1 | 1,
) {
  const adjacentIndex = sampleIndex + direction
  if (adjacentIndex >= 0 && adjacentIndex < samples.length) {
    return samples[adjacentIndex]!
  }

  if (
    samples.length > 2
    && pointsEqual2(samples[0]!.position, samples[samples.length - 1]!.position)
  ) {
    if (direction < 0 && sampleIndex === 0) {
      return samples[samples.length - 2]!
    }
    if (direction > 0 && sampleIndex === samples.length - 1) {
      return samples[1]!
    }
  }

  return null
}

function offsetSectionSamplePoint(
  section: SplineWallAssemblySection,
  position: readonly [number, number],
  tangent: readonly [number, number],
  lateralOffset: number,
): readonly [number, number] {
  const normal = getSectionOffsetNormal(section, tangent)
  return [
    position[0] + (normal[0] * lateralOffset),
    position[1] + (normal[1] * lateralOffset),
  ]
}

function getSectionOffsetNormal(
  section: SplineWallAssemblySection,
  tangent: readonly [number, number],
): readonly [number, number] {
  const leftNormal = [-tangent[1], tangent[0]] as const
  if (section.layerKind === 'structural-core' || !section.side) {
    return leftNormal
  }
  return getSectionSideNormal(section.side, leftNormal)
}

function intersectSectionOffsetLines(
  leftPoint: readonly [number, number],
  leftDirection: readonly [number, number],
  rightPoint: readonly [number, number],
  rightDirection: readonly [number, number],
) {
  const denominator = cross2(leftDirection, rightDirection)
  if (Math.abs(denominator) <= 1e-5) {
    return null
  }

  const delta = [
    rightPoint[0] - leftPoint[0],
    rightPoint[1] - leftPoint[1],
  ] as const
  const leftScale = cross2(delta, rightDirection) / denominator
  return [
    leftPoint[0] + (leftDirection[0] * leftScale),
    leftPoint[1] + (leftDirection[1] * leftScale),
  ] as const
}

function clampSectionMiterPoint(
  origin: readonly [number, number],
  point: readonly [number, number],
  lateralOffset: number,
): readonly [number, number] {
  const delta = [
    point[0] - origin[0],
    point[1] - origin[1],
  ] as const
  const distance = Math.hypot(delta[0], delta[1])
  const maxDistance = Math.abs(lateralOffset) * SPLINE_WALL_SECTION_MAX_MITER_SCALE
  if (distance <= maxDistance + 1e-5 || distance <= 1e-5) {
    return point
  }

  const scale = maxDistance / distance
  return [
    origin[0] + (delta[0] * scale),
    origin[1] + (delta[1] * scale),
  ] as const
}

export function buildSplineWallOpeningRevealGeometry(
  section: SplineWallAssemblySection,
  descriptor: SplineWallOpeningDescriptor,
  queryCache: SplineWallQueryCache,
) {
  const geometry = new THREE.BufferGeometry()
  const polygon = buildClosedSectionProfileForOpeningBand(
    section,
    descriptor.bottomHeight,
    descriptor.topHeight ?? getSectionResolvedWallHeight(section),
  )
  if (polygon.length < 3) {
    return geometry
  }

  const startSample = sampleSplineWallSegment(queryCache, section.segmentId, getSectionSegmentRatio(section, descriptor.startRatio))
  const endSample = sampleSplineWallSegment(queryCache, section.segmentId, getSectionSegmentRatio(section, descriptor.endRatio))
  if (!startSample || !endSample) {
    return geometry
  }

  const positions: number[] = []
  const indices: number[] = []
  const uvs: number[] = []
  const bakedLightDirections: number[] = []
  appendOpeningRevealSpan(
    positions,
    indices,
    uvs,
    bakedLightDirections,
    section,
    descriptor,
    queryCache,
    startSample,
    endSample,
    polygon,
  )
  appendOpeningRevealCap(positions, indices, uvs, bakedLightDirections, section, startSample, polygon, false)
  appendOpeningRevealCap(positions, indices, uvs, bakedLightDirections, section, endSample, polygon, true)

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  geometry.setAttribute('uv2', new THREE.Float32BufferAttribute([...uvs], 2))
  setBakedLightDirectionAttribute(geometry, bakedLightDirections)
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  syncBakedLightDirectionsToGeometryNormals(geometry)
  geometry.computeBoundingSphere()
  return geometry
}

function buildClosedSectionProfileForOpeningBand(
  section: SplineWallAssemblySection,
  startHeight: number,
  endHeight: number,
) {
  const clippedProfile = clipSectionProfilePointsToBand(section, startHeight, endHeight)
  if (clippedProfile.length < 2) {
    return []
  }

  if (section.layerKind === 'structural-core') {
    return clippedProfile
  }

  const firstPoint = clippedProfile[0]!
  const lastPoint = clippedProfile[clippedProfile.length - 1]!
  return dedupeProfilePolygonPoints([
    [0, firstPoint[1]] as const,
    ...clippedProfile,
    [0, lastPoint[1]] as const,
  ])
}

function dedupeProfilePolygonPoints(points: readonly (readonly [number, number])[]) {
  const deduped: Array<readonly [number, number]> = []
  points.forEach((point) => {
    const previous = deduped.at(-1)
    if (previous && Math.abs(previous[0] - point[0]) <= 1e-5 && Math.abs(previous[1] - point[1]) <= 1e-5) {
      return
    }
    deduped.push(point)
  })
  return deduped
}

function appendOpeningRevealSpan(
  positions: number[],
  indices: number[],
  uvs: number[],
  bakedLightDirections: number[],
  section: SplineWallAssemblySection,
  descriptor: SplineWallOpeningDescriptor,
  queryCache: SplineWallQueryCache,
  startSample: NonNullable<ReturnType<typeof sampleSplineWallSegment>>,
  endSample: NonNullable<ReturnType<typeof sampleSplineWallSegment>>,
  polygon: readonly (readonly [number, number])[],
) {
  if (polygon.length < 2) {
    return
  }

  const resolvedWallHeight = getSectionResolvedWallHeight(section)
  const polygonUvDistances = buildProfileUvDistances([...polygon, polygon[0]!], resolvedWallHeight).slice(0, -1)
  const startSegmentRatio = getSectionSegmentRatio(section, descriptor.startRatio)
  const endSegmentRatio = getSectionSegmentRatio(section, descriptor.endRatio)
  const queryData = getSplineWallSegmentQueryData(queryCache, section.segmentId)
  const openingSpanDistance = queryData
    ? Math.abs(
        getSplineWallSegmentUvDistanceAtRatio(queryData, endSegmentRatio)
        - getSplineWallSegmentUvDistanceAtRatio(queryData, startSegmentRatio),
      )
    : Math.hypot(
        endSample.position[0] - startSample.position[0],
        endSample.position[1] - startSample.position[1],
      )
  const openingSpanUv = getSectionUvU(section, openingSpanDistance, resolvedWallHeight)
  const startDirection = getSectionBakedLightDirection(section, startSample)
  const endDirection = getSectionBakedLightDirection(section, endSample)

  for (let index = 0; index < polygon.length; index += 1) {
    const nextIndex = (index + 1) % polygon.length
    const startPoint = polygon[index]!
    const endPoint = polygon[nextIndex]!
    if (!shouldRenderOpeningRevealSpanEdge(section, startPoint, endPoint)) {
      continue
    }

    const vertexOffset = positions.length / 3
    const startWorldA = getSectionProfileWorldPoint(section, startSample, startPoint)
    const endWorldA = getSectionProfileWorldPoint(section, endSample, startPoint)
    const endWorldB = getSectionProfileWorldPoint(section, endSample, endPoint)
    const startWorldB = getSectionProfileWorldPoint(section, startSample, endPoint)

    positions.push(...startWorldA, ...endWorldA, ...endWorldB, ...startWorldB)
    uvs.push(
      0, polygonUvDistances[index] ?? 0,
      openingSpanUv, polygonUvDistances[index] ?? 0,
      openingSpanUv, polygonUvDistances[nextIndex] ?? polygonUvDistances[index] ?? 0,
      0, polygonUvDistances[nextIndex] ?? polygonUvDistances[index] ?? 0,
    )
    bakedLightDirections.push(
      startDirection[0], 0, startDirection[1],
      endDirection[0], 0, endDirection[1],
      endDirection[0], 0, endDirection[1],
      startDirection[0], 0, startDirection[1],
    )

    if (shouldReverseSectionFaceWinding(section)) {
      indices.push(vertexOffset, vertexOffset + 3, vertexOffset + 1, vertexOffset + 1, vertexOffset + 3, vertexOffset + 2)
    } else {
      indices.push(vertexOffset, vertexOffset + 1, vertexOffset + 3, vertexOffset + 1, vertexOffset + 2, vertexOffset + 3)
    }
  }
}

function shouldRenderOpeningRevealSpanEdge(
  section: SplineWallAssemblySection,
  startPoint: readonly [number, number],
  endPoint: readonly [number, number],
) {
  if (section.layerKind === 'structural-core') {
    return true
  }

  return Math.abs(startPoint[0]) > 1e-5 || Math.abs(endPoint[0]) > 1e-5
}

function appendOpeningRevealCap(
  positions: number[],
  indices: number[],
  uvs: number[],
  bakedLightDirections: number[],
  section: SplineWallAssemblySection,
  sample: NonNullable<ReturnType<typeof sampleSplineWallSegment>>,
  polygon: readonly (readonly [number, number])[],
  reverseWinding: boolean,
) {
  const vertexOffset = positions.length / 3
  const polygonUvs = buildOpeningRevealPolygonUvs(polygon, getSectionResolvedWallHeight(section))
  const effectiveReverseWinding = reverseWinding !== shouldReverseSectionFaceWinding(section)
  const bakedLightDirection = getSectionBakedLightDirection(section, sample)
  polygon.forEach((point) => {
    const [worldX, worldY, worldZ] = getSectionProfileWorldPoint(section, sample, point)
    positions.push(worldX, worldY, worldZ)
    bakedLightDirections.push(bakedLightDirection[0], 0, bakedLightDirection[1])
  })
  polygonUvs.forEach(([u, v]) => {
    uvs.push(u, v)
  })

  for (let index = 1; index < polygon.length - 1; index += 1) {
    if (effectiveReverseWinding) {
      indices.push(vertexOffset, vertexOffset + index + 1, vertexOffset + index)
    } else {
      indices.push(vertexOffset, vertexOffset + index, vertexOffset + index + 1)
    }
  }
}

function shouldReverseSectionFaceWinding(section: SplineWallAssemblySection) {
  return section.layerKind !== 'structural-core' && section.side === 'right'
}

function useSplineWallStyleTextures(material: SplineWallAssemblySection['material']): SplineWallPbrTextures {
  const textureUrlMap = useMemo(() => buildSplineWallTextureUrlMap(material), [material])
  const loadedTextures = useTexture(textureUrlMap) as Record<string, THREE.Texture>
  const textures = useMemo<SplineWallPbrTextures>(() => ({
    albedo: loadedTextures.albedo,
    normal: loadedTextures.normal ?? null,
    ao: loadedTextures.ao ?? null,
    height: loadedTextures.height ?? null,
    displacement: loadedTextures.displacement ?? null,
    roughness: loadedTextures.roughness ?? null,
    metallic: loadedTextures.metallic ?? null,
  }), [loadedTextures])

  useEffect(() => {
    const verticalWrap = material.uv?.verticalWrap ?? 'repeat'
    configureSplineWallTexture(textures.albedo, 'color', verticalWrap)
    if (textures.normal) {
      configureSplineWallTexture(textures.normal, 'data', verticalWrap)
    }
    if (textures.ao) {
      configureSplineWallTexture(textures.ao, 'data', verticalWrap)
    }
    if (textures.height) {
      configureSplineWallTexture(textures.height, 'data', verticalWrap)
    }
    if (textures.displacement) {
      configureSplineWallTexture(textures.displacement, 'data', verticalWrap)
    }
    if (textures.roughness) {
      configureSplineWallTexture(textures.roughness, 'data', verticalWrap)
    }
    if (textures.metallic) {
      configureSplineWallTexture(textures.metallic, 'data', verticalWrap)
    }
  }, [material.uv?.verticalWrap, textures])

  return textures
}

function buildSplineWallTextureUrlMap(material: SplineWallAssemblySection['material']) {
  return {
    albedo: material.textures.albedoUrl,
    ...(material.textures.normalUrl ? { normal: material.textures.normalUrl } : {}),
    ...(material.textures.aoUrl ? { ao: material.textures.aoUrl } : {}),
    ...(material.textures.heightUrl ? { height: material.textures.heightUrl } : {}),
    ...(material.textures.displacementUrl ? { displacement: material.textures.displacementUrl } : {}),
    ...(material.textures.roughnessUrl ? { roughness: material.textures.roughnessUrl } : {}),
    ...(material.textures.metallicUrl ? { metallic: material.textures.metallicUrl } : {}),
  }
}

function createSplineWallStyleMaterial(
  section: SplineWallAssemblySection,
  textures: SplineWallPbrTextures,
  {
    polygonOffsetFactor,
    polygonOffsetUnits,
  }: {
    polygonOffsetFactor: number
    polygonOffsetUnits: number
  },
) {
  const shading = section.material.shading
  const materialTextures = section.layerKind === 'structural-core' ? null : textures
  const material = createStandardCompatibleMaterial({
    color: section.layerKind === 'structural-core' ? getFallbackSectionColor(section) : (shading?.tintColor ?? getFallbackSectionColor(section)),
    map: materialTextures?.albedo,
    normalMap: materialTextures?.normal,
    aoMap: materialTextures?.ao,
    aoMapIntensity: materialTextures?.ao ? (shading?.aoMapIntensity ?? 1) : 0,
    bumpMap: materialTextures?.height,
    bumpScale: materialTextures?.height ? (shading?.bumpScale ?? 0.18) : 0,
    roughnessMap: materialTextures?.roughness,
    metalnessMap: materialTextures?.metallic,
    roughness: materialTextures?.roughness ? 1 : (shading?.roughness ?? 0.68),
    metalness: materialTextures?.metallic ? 1 : (shading?.metalness ?? 0.04),
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor,
    polygonOffsetUnits,
  })
  if (materialTextures) {
    applySplineWallParallaxNodes(material, materialTextures, section.material)
    applySplineWallDisplacementNodes(material, materialTextures, section.material)
  }
  material.needsUpdate = true
  return material
}

function createSplineWallTopCapMaterial(section: SplineWallAssemblySection) {
  const shading = section.material.shading
  const material = createStandardCompatibleMaterial({
    color: shading?.topSurfaceColor ?? getFallbackSectionColor(section),
    roughness: shading?.topSurfaceRoughness ?? shading?.roughness ?? 0.68,
    metalness: shading?.topSurfaceMetalness ?? shading?.metalness ?? 0.04,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  })
  material.needsUpdate = true
  return material
}

function getSplineWallSectionPolygonOffset(section: SplineWallAssemblySection) {
  return section.layerKind === 'structural-core'
    ? {
        polygonOffsetFactor: 0,
        polygonOffsetUnits: 0,
      }
    : {
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      }
}

function buildSampleUvDistances(
  samples: readonly NonNullable<ReturnType<typeof sampleSplineWallSegment>>[],
  initialDistance = 0,
) {
  const distances = [initialDistance]
  for (let index = 1; index < samples.length; index += 1) {
    const previous = samples[index - 1]!
    const current = samples[index]!
    distances.push(
      distances[index - 1]! + Math.hypot(
        current.position[0] - previous.position[0],
        current.position[1] - previous.position[1],
      ),
    )
  }
  return distances
}

function getSplineWallSegmentUvDistanceAtRatio(
  segmentData: NonNullable<ReturnType<typeof getSplineWallSegmentQueryData>>,
  ratio: number,
) {
  const clampedRatio = Math.min(1, Math.max(0, ratio))
  let distance = 0
  for (const edge of segmentData.edges) {
    const minRatio = Math.min(edge.startRatio, edge.endRatio)
    const maxRatio = Math.max(edge.startRatio, edge.endRatio)
    if (clampedRatio >= minRatio - 1e-5 && clampedRatio <= maxRatio + 1e-5) {
      const ratioSpan = edge.endRatio - edge.startRatio
      const localRatio = Math.abs(ratioSpan) <= 1e-5
        ? 0
        : Math.min(1, Math.max(0, (clampedRatio - edge.startRatio) / ratioSpan))
      return distance + (edge.length * localRatio)
    }

    distance += edge.length
  }

  return clampedRatio <= 0 ? 0 : segmentData.totalLength
}

function smoothSplineWallGeometryNormalsByPosition(geometry: THREE.BufferGeometry) {
  const positionAttribute = geometry.getAttribute('position')
  const normalAttribute = geometry.getAttribute('normal')
  if (!positionAttribute || !normalAttribute) {
    return
  }

  const normalSums = new Map<string, THREE.Vector3>()
  for (let index = 0; index < positionAttribute.count; index += 1) {
    const key = createGeometryPositionKey(positionAttribute, index)
    const sum = normalSums.get(key) ?? new THREE.Vector3()
    sum.x += normalAttribute.getX(index)
    sum.y += normalAttribute.getY(index)
    sum.z += normalAttribute.getZ(index)
    normalSums.set(key, sum)
  }

  normalSums.forEach((normal) => normal.normalize())
  for (let index = 0; index < positionAttribute.count; index += 1) {
    const normal = normalSums.get(createGeometryPositionKey(positionAttribute, index))
    if (!normal) {
      continue
    }
    normalAttribute.setXYZ(index, normal.x, normal.y, normal.z)
  }
  normalAttribute.needsUpdate = true
}

function createGeometryPositionKey(
  positionAttribute: THREE.BufferAttribute | THREE.InterleavedBufferAttribute,
  index: number,
) {
  return [
    Math.round(positionAttribute.getX(index) * 100000),
    Math.round(positionAttribute.getY(index) * 100000),
    Math.round(positionAttribute.getZ(index) * 100000),
  ].join(':')
}

function cross2(
  left: readonly [number, number],
  right: readonly [number, number],
) {
  return (left[0] * right[1]) - (left[1] * right[0])
}

function pointsEqual2(
  left: readonly [number, number],
  right: readonly [number, number],
) {
  return Math.hypot(left[0] - right[0], left[1] - right[1]) <= 1e-5
}

function normalize2(
  point: readonly [number, number],
  fallback: readonly [number, number],
): readonly [number, number] {
  const length = Math.hypot(point[0], point[1])
  if (length <= 1e-8) {
    return fallback
  }
  return [point[0] / length, point[1] / length]
}

function buildProfileUvDistances(
  profilePoints: readonly (readonly [number, number])[],
  resolvedWallHeight: number,
) {
  const distances = [0]
  for (let index = 1; index < profilePoints.length; index += 1) {
    const previous = profilePoints[index - 1]!
    const current = profilePoints[index]!
    distances.push(
      distances[index - 1]! + Math.hypot(
        current[0] - previous[0],
        (current[1] - previous[1]) * resolvedWallHeight,
      ),
    )
  }
  return distances
}

function buildSectionProfileUvDistances(
  section: SplineWallAssemblySection,
  resolvedWallHeight: number,
) {
  return buildProfileUvDistances(section.profile.points, resolvedWallHeight)
}

function subdivideSectionProfileForDisplacement(
  section: SplineWallAssemblySection,
  points: readonly (readonly [number, number])[],
  resolvedWallHeight: number,
) {
  const displacementScale = section.material.shading?.displacementScale ?? 0
  const vertexStep = section.material.shading?.displacementVertexStep ?? 0
  if (displacementScale <= 0 || vertexStep <= 0 || points.length < 2) {
    return points
  }

  const output: Array<readonly [number, number]> = [points[0]!]
  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1]!
    const current = points[index]!
    const deltaX = current[0] - previous[0]
    const deltaY = (current[1] - previous[1]) * resolvedWallHeight
    const segmentLength = Math.hypot(deltaX, deltaY)
    const stepCount = Math.max(1, Math.ceil(segmentLength / vertexStep))
    for (let stepIndex = 1; stepIndex <= stepCount; stepIndex += 1) {
      const ratio = stepIndex / stepCount
      output.push([
        previous[0] + (deltaX * ratio),
        previous[1] + ((current[1] - previous[1]) * ratio),
      ])
    }
  }

  return output
}

function getSectionProfileUvV(
  section: SplineWallAssemblySection,
  point: readonly [number, number],
  sourceDistances: readonly number[],
  resolvedWallHeight: number,
) {
  let v: number
  if (section.material.uv?.verticalMode === 'fit-height') {
    v = Math.min(1, Math.max(0, point[1]))
  } else {
    v = getProfileUvDistanceAtPoint(section.profile.points, sourceDistances, point, resolvedWallHeight)
  }

  return section.layerKind === 'exterior-face' && section.material.uv?.flipVOnExterior
    ? 1 - v
    : v
}

function getSectionUvU(
  section: SplineWallAssemblySection,
  distance: number,
  resolvedWallHeight: number,
) {
  if (section.material.uv?.verticalMode === 'fit-height') {
    return distance / Math.max(resolvedWallHeight, 1e-5)
  }

  return distance
}

function getProfileUvDistanceAtPoint(
  sourceProfilePoints: readonly (readonly [number, number])[],
  sourceDistances: readonly number[],
  point: readonly [number, number],
  resolvedWallHeight: number,
) {
  let nearestDistance = sourceDistances[0] ?? 0
  let nearestDistanceSquared = Number.POSITIVE_INFINITY

  for (let index = 0; index < sourceProfilePoints.length - 1; index += 1) {
    const start = sourceProfilePoints[index]!
    const end = sourceProfilePoints[index + 1]!
    const segmentDistance = getPointDistanceAlongProfileSegment(start, end, point, resolvedWallHeight)
    const candidateDistance = (sourceDistances[index] ?? 0) + segmentDistance.distanceAlongSegment
    if (segmentDistance.distanceSquared <= nearestDistanceSquared) {
      nearestDistanceSquared = segmentDistance.distanceSquared
      nearestDistance = candidateDistance
    }
  }

  return nearestDistance
}

function getPointDistanceAlongProfileSegment(
  start: readonly [number, number],
  end: readonly [number, number],
  point: readonly [number, number],
  resolvedWallHeight: number,
) {
  const startX = start[0]
  const startY = start[1] * resolvedWallHeight
  const endX = end[0]
  const endY = end[1] * resolvedWallHeight
  const pointX = point[0]
  const pointY = point[1] * resolvedWallHeight
  const deltaX = endX - startX
  const deltaY = endY - startY
  const lengthSquared = (deltaX * deltaX) + (deltaY * deltaY)
  if (lengthSquared <= 1e-10) {
    return {
      distanceAlongSegment: 0,
      distanceSquared: ((pointX - startX) ** 2) + ((pointY - startY) ** 2),
    }
  }

  const ratio = Math.min(1, Math.max(0, (((pointX - startX) * deltaX) + ((pointY - startY) * deltaY)) / lengthSquared))
  const projectedX = startX + (deltaX * ratio)
  const projectedY = startY + (deltaY * ratio)
  return {
    distanceAlongSegment: Math.sqrt(lengthSquared) * ratio,
    distanceSquared: ((pointX - projectedX) ** 2) + ((pointY - projectedY) ** 2),
  }
}

function buildOpeningRevealPolygonUvs(
  polygon: readonly (readonly [number, number])[],
  resolvedWallHeight: number,
) {
  const minOffset = polygon.reduce((current, point) => Math.min(current, point[0]), Infinity)
  const minHeight = polygon.reduce((current, point) => Math.min(current, point[1] * resolvedWallHeight), Infinity)
  return polygon.map((point) => [
    point[0] - minOffset,
    (point[1] * resolvedWallHeight) - minHeight,
  ] as const)
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
) {
  return buildOpenWallSegmentSet(wallOpenings)
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
