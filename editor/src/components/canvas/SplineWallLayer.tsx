import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
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
  DEFAULT_SPLINE_WALL_HEIGHT,
  type RoomSplineWallMeshData,
} from '../../store/splineWalls'
import { getInheritedWallAssetIdForRoom } from '../../store/wallSegments'
import { buildOpenWallSegmentSet } from '../../store/openWallSegments'
import { getSplineWallSegmentMidpoint, type SplineWallGraph } from '../../store/splineWallGraph'
import {
  createSplineWallQueryCache,
  getSplineWallSegmentQueryData,
  sampleSplineWallSegment,
  type SplineWallQueryCache,
} from '../../store/splineWallQueries'
import { analyzeSplineWallGraphBoundaries } from '../../store/splineWallStyleAnalysis'
import { buildSplineWallAssemblySections, type SplineWallAssemblySection } from '../../store/splineWallAssembly'
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
  configureSplineWallTexture,
  type SplineWallMaterialBundle,
  type SplineWallMaterialPreset,
  type SplineWallPbrTextures,
  useSplineWallMaterialLibrary,
} from './splineWallMaterial'
import { useRegisteredLightSources } from './objectSourceRegistry'
import type { BakedFloorLightField } from '../../rendering/dungeonLightField'
import {
  applyBakedLightToSplineWallMaterialLibrary,
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
const SPLINE_WALL_RENDER_STITCH_MIN_NORMAL_DOT = Math.cos(Math.PI / 6)

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
  const analyzedBoundaries = useMemo(
    () => hasGraphWalls ? analyzeSplineWallGraphBoundaries(effectiveSplineWallGraph, visibleLayerIds) : [],
    [effectiveSplineWallGraph, hasGraphWalls, visibleLayerIds],
  )
  const assemblySections = useMemo(
    () => hasGraphWalls
      ? buildSplineWallAssemblySections({
          analyzedBoundaries,
          wallStyleAssignments,
          wallCoreAssignments,
        })
      : [],
    [analyzedBoundaries, hasGraphWalls, wallCoreAssignments, wallStyleAssignments],
  )
  const renderSectionGroups = useMemo(
    () => buildSplineWallRenderSectionGroups(assemblySections),
    [assemblySections],
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
              />
            )
          })
          : null}
      {renderSectionGroups.map((group) => {
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
            bakedLightField={bakedLightField}
          />
        )
      })}
      {openingDescriptors
        .filter((descriptor) =>
          descriptor.openingMode !== 'framed'
          && (
            (descriptor.openingMode === 'sleeve' && descriptor.layerKind !== 'structural-core')
            || (descriptor.openingMode === 'structural' && descriptor.layerKind === 'structural-core')
          ))
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

type SplineWallRenderSectionGroup = {
  id: string
  sections: readonly SplineWallAssemblySection[]
}
type SplineWallSectionSample = NonNullable<ReturnType<typeof sampleSplineWallSegment>>

function SplineWallStyleSectionGroupMesh({
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
      geometry: buildSplineWallSectionGroupGeometry(group.sections, queryCache, openingsBySectionId),
    }
  }
  const geometry = geometryCacheRef.current.geometry

  const textures = useSplineWallStyleTextures(section.material)
  const material = useMemo(() => {
    const polygonOffset = getSplineWallSectionPolygonOffset(section)
    return createSplineWallStyleMaterial(section, textures, polygonOffset)
  }, [section, textures])

  useEffect(() => () => geometryCacheRef.current?.geometry.dispose(), [])
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => {
    applyBakedLightToSplineWallStyleMaterial(material, bakedLightField, {
      useDirectionAttribute: true,
      useDirectionalFaceMask: true,
      useDirectionalSampleOffset: true,
    })
  }, [bakedLightField, material])

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
        renderOrder={section.layerKind === 'structural-core' ? 0 : 1}
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

  useEffect(() => () => geometryCacheRef.current?.geometry.dispose(), [])
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => {
    applyBakedLightToSplineWallStyleMaterial(material, bakedLightField, {
      useDirectionAttribute: true,
      useDirectionalFaceMask: true,
      useDirectionalSampleOffset: true,
    })
  }, [bakedLightField, material])

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
) {
  return buildSplineWallSectionGroupGeometry(
    [section],
    queryCache,
    new Map([[section.id, openings]]),
  )
}

export function buildSplineWallSectionGroupGeometry(
  sections: readonly SplineWallAssemblySection[],
  queryCache: SplineWallQueryCache,
  openingsBySectionId: ReadonlyMap<string, readonly SplineWallOpeningDescriptor[]>,
) {
  const geometry = new THREE.BufferGeometry()
  if (sections.length === 0 || sections[0]!.profile.points.length < 2) {
    return geometry
  }

  if (sections.length > 1 && !hasSplineWallSectionGroupOpenings(sections, openingsBySectionId)) {
    return buildContinuousSplineWallSectionGroupGeometry(sections, queryCache)
  }

  const positions: number[] = []
  const indices: number[] = []
  const uvs: number[] = []
  const bakedLightDirections: number[] = []
  let vertexOffset = 0
  let sectionUvDistanceOffset = 0

  sections.forEach((section) => {
    const resolvedWallHeight = getSectionResolvedWallHeight(section)
    const profileUvDistances = buildSectionProfileUvDistances(section, resolvedWallHeight)
    const queryData = getSplineWallSegmentQueryData(queryCache, section.segmentId)
    const bands = buildSplineWallSectionHeightBands(section, openingsBySectionId.get(section.id) ?? [])
    bands.forEach((band) => {
      const bandProfile = clipSectionProfilePointsToBand(section, band.startHeight, band.endHeight, {
        hideRenderSegments: true,
      })
      if (bandProfile.length < 2) {
        return
      }
      const bandProfileUvDistances = bandProfile.map((point) =>
        getSectionProfileUvV(section, point, profileUvDistances, resolvedWallHeight))

      band.visibleIntervals.forEach(([startRatio, endRatio]) => {
        const sectionStartRatio = getSectionSegmentRatio(section, startRatio)
        const sectionEndRatio = getSectionSegmentRatio(section, endRatio)
        const samples = sampleSplineWallSectionInterval(queryCache, section.segmentId, sectionStartRatio, sectionEndRatio)
        if (samples.length < 2) {
          return
        }
        const sampleUvDistances = buildSampleUvDistances(
          samples,
          sectionUvDistanceOffset + (queryData ? getSplineWallSegmentUvDistanceAtRatio(queryData, sectionStartRatio) : 0),
        )

        samples.forEach((sample, sampleIndex) => {
          const bakedLightDirection = getSectionBakedLightDirection(section, sample)
          bandProfile.forEach((point, pointIndex) => {
            const [worldX, worldY, worldZ] = getSectionProfileWorldPoint(section, sample, point)
            positions.push(worldX, worldY, worldZ)
            uvs.push(sampleUvDistances[sampleIndex]!, bandProfileUvDistances[pointIndex]!)
            bakedLightDirections.push(bakedLightDirection[0], 0, bakedLightDirection[1])
          })
        })

        const rowSize = bandProfile.length
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

    sectionUvDistanceOffset += queryData
      ? Math.abs(
          getSplineWallSegmentUvDistanceAtRatio(queryData, section.endRatio)
          - getSplineWallSegmentUvDistanceAtRatio(queryData, section.startRatio),
        )
      : section.length * GRID_SIZE
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

function buildContinuousSplineWallSectionGroupGeometry(
  sections: readonly SplineWallAssemblySection[],
  queryCache: SplineWallQueryCache,
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
    const bandProfile = clipSectionProfilePointsToBand(section, band.startHeight, band.endHeight, {
      hideRenderSegments: true,
    })
    if (bandProfile.length < 2) {
      return
    }
    const bandProfileUvDistances = bandProfile.map((point) =>
      getSectionProfileUvV(section, point, profileUvDistances, resolvedWallHeight))

    sampleRuns.forEach((samples) => {
      if (samples.length < 2) {
        return
      }
      const sampleUvDistances = buildSampleUvDistances(samples, 0)
      samples.forEach((sample, sampleIndex) => {
        const bakedLightDirection = getSectionBakedLightDirection(section, sample)
        bandProfile.forEach((point, pointIndex) => {
          const [worldX, worldY, worldZ] = getSectionProfileWorldPoint(section, sample, point)
          positions.push(worldX, worldY, worldZ)
          uvs.push(sampleUvDistances[sampleIndex]!, bandProfileUvDistances[pointIndex]!)
          bakedLightDirections.push(bakedLightDirection[0], 0, bakedLightDirection[1])
        })
      })

      const rowSize = bandProfile.length
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

function hasSplineWallSectionGroupOpenings(
  sections: readonly SplineWallAssemblySection[],
  openingsBySectionId: ReadonlyMap<string, readonly SplineWallOpeningDescriptor[]>,
) {
  return sections.some((section) => (openingsBySectionId.get(section.id)?.length ?? 0) > 0)
}

function buildContinuousSplineWallSectionSampleRuns(
  sections: readonly SplineWallAssemblySection[],
  queryCache: SplineWallQueryCache,
) {
  const runs: SplineWallSectionSample[][] = []
  let currentRun: SplineWallSectionSample[] = []

  sections.forEach((section) => {
    const samples = sampleSplineWallSectionInterval(queryCache, section.segmentId, section.startRatio, section.endRatio)
    if (samples.length < 2) {
      return
    }

    if (currentRun.length === 0) {
      currentRun = [...samples]
      return
    }

    const previous = currentRun.at(-1)!
    const next = samples[0]!
    if (canStitchSplineWallSectionSamples(previous, next)) {
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

function canStitchSplineWallSectionSamples(
  previous: SplineWallSectionSample,
  next: SplineWallSectionSample,
) {
  return Math.hypot(
    previous.position[0] - next.position[0],
    previous.position[1] - next.position[1],
  ) <= 1e-5
    && dot2(previous.normal, next.normal) >= SPLINE_WALL_RENDER_STITCH_MIN_NORMAL_DOT
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
) {
  const segmentData = getSplineWallSegmentQueryData(queryCache, segmentId)
  if (!segmentData) {
    return []
  }

  const samples = []
  const stepCount = Math.max(1, Math.ceil((segmentData.totalLength * Math.max(endRatio - startRatio, 0)) / 0.18))
  for (let index = 0; index <= stepCount; index += 1) {
    const ratio = startRatio + ((endRatio - startRatio) * (index / stepCount))
    const sample = sampleSplineWallSegment(queryCache, segmentId, ratio)
    if (sample) {
      samples.push(sample)
    }
  }

  return samples
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
) {
  return group.sections.map((section) =>
    createSplineWallSectionGeometryKey(section, openingsBySectionId.get(section.id) ?? [], queryCache)).join('||')
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
    if (hiddenSegmentIndices?.has(index)) {
      continue
    }
    const startPoint = section.profile.points[index]!
    const endPoint = section.profile.points[index + 1]!
    const clippedSegment = clipProfileSegmentToBand(startPoint, endPoint, bandStart, bandEnd)
    clippedSegment.forEach(appendPoint)
  }

  return clipped
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
  const lateralOffset = section.layerKind === 'structural-core'
    ? point[0]
    : Math.abs(point[0])
  const normal = section.layerKind === 'structural-core'
    ? sample.normal
    : getSectionSideNormal(section.side!, sample.normal)

  return [
    sample.position[0] + (normal[0] * lateralOffset),
    point[1] * resolvedWallHeight,
    sample.position[1] + (normal[1] * lateralOffset),
  ]
}

function buildSplineWallOpeningRevealGeometry(
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
    roughness: loadedTextures.roughness ?? null,
    metallic: loadedTextures.metallic ?? null,
  }), [loadedTextures])

  useEffect(() => {
    configureSplineWallTexture(textures.albedo, 'color')
    if (textures.normal) {
      configureSplineWallTexture(textures.normal, 'data')
    }
    if (textures.ao) {
      configureSplineWallTexture(textures.ao, 'data')
    }
    if (textures.height) {
      configureSplineWallTexture(textures.height, 'data')
    }
    if (textures.roughness) {
      configureSplineWallTexture(textures.roughness, 'data')
    }
    if (textures.metallic) {
      configureSplineWallTexture(textures.metallic, 'data')
    }
  }, [textures])

  return textures
}

function buildSplineWallTextureUrlMap(material: SplineWallAssemblySection['material']) {
  return {
    albedo: material.textures.albedoUrl,
    ...(material.textures.normalUrl ? { normal: material.textures.normalUrl } : {}),
    ...(material.textures.aoUrl ? { ao: material.textures.aoUrl } : {}),
    ...(material.textures.heightUrl ? { height: material.textures.heightUrl } : {}),
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
  const material = createStandardCompatibleMaterial({
    color: shading?.tintColor ?? getFallbackSectionColor(section),
    map: textures.albedo,
    normalMap: textures.normal,
    aoMap: textures.ao,
    aoMapIntensity: textures.ao ? (shading?.aoMapIntensity ?? 1) : 0,
    bumpMap: textures.height,
    bumpScale: textures.height ? (shading?.bumpScale ?? 0.18) : 0,
    roughnessMap: textures.roughness,
    metalnessMap: textures.metallic,
    roughness: textures.roughness ? 1 : (shading?.roughness ?? 0.68),
    metalness: textures.metallic ? 1 : (shading?.metalness ?? 0.04),
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor,
    polygonOffsetUnits,
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

function dot2(
  left: readonly [number, number],
  right: readonly [number, number],
) {
  return (left[0] * right[0]) + (left[1] * right[1])
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

function getSectionProfileUvV(
  section: SplineWallAssemblySection,
  point: readonly [number, number],
  sourceDistances: readonly number[],
  resolvedWallHeight: number,
) {
  if (section.material.uv?.verticalMode === 'fit-height') {
    return Math.min(1, Math.max(0, point[1]))
  }

  return getProfileUvDistanceAtPoint(section.profile.points, sourceDistances, point, resolvedWallHeight)
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
