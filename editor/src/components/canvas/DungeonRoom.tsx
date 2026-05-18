import { Suspense, useCallback, useEffect, useMemo, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import {
  cellToWorldPosition,
  getCellKey,
} from '../../hooks/useSnapToGrid'
import type { FloorDirtyInfo } from '../../store/floorDirtyDomains'
import { EMPTY_SPLINE_WALL_GRAPH } from '../../store/splineWallGraph'
import {
  useDungeonStore,
  type OpeningRecord,
  type PaintedCells,
} from '../../store/useDungeonStore'
import { getOpeningSegments } from '../../store/openingSegments'
import { getOpeningRenderContext, getOpeningWorldTransform } from '../../store/openingPlacement'
import { createSplineWallQueryCache, type SplineWallQueryCache } from '../../store/splineWallQueries'
import { buildSplineWallAssemblySections } from '../../store/splineWallAssembly'
import {
  buildSplineWallOpeningDescriptors,
  getSplineWallOpeningRenderContext,
  type SplineWallOpeningDescriptor,
} from '../../store/splineWallOpenings'
import { analyzeSplineWallGraphBoundaries } from '../../store/splineWallStyleAnalysis'
import {
  advanceBuildAnimations,
  getBuildAnimationTimeScale,
  getHeldBuildBatchUniformState,
  getBuildAnimationState,
  getBuildYOffset,
  isAnimationActive,
  useBuildAnimationVersion,
} from '../../store/buildAnimations'
import { getFloorTileSpan, type FloorRenderGroup, type FloorSurfacePlacement } from '../../store/floorSurfaceLayout'
import {
  type FloorSceneDerivedBundle,
} from '../../store/derived/floorDerived'
import { isDownStairAssetId } from '../../store/stairAssets'
import { ContentPackInstance } from './ContentPackInstance'
import { BatchedTileEntries, type StaticTileEntry } from './BatchedTileEntries'
import { buildMergedFloorReceiverGeometry } from './floorReceiverGeometry'
import { registerDecalReceivers, unregisterDecalReceivers } from './decalReceiverRegistry'
import type { PlayVisibility, PlayVisibilityState } from './playVisibility'
import { useGLTF } from '../../rendering/useGLTF'
import { shouldActivateFloorReceiver } from './floorReceiverMode'
import type { ContentPackModelTransform } from '../../content-packs/types'
import { resolveProjectionReceiverAsset } from './tileAssetResolution'
import {
  getWallSpanInteriorLightDirections,
  getWallSpanSurfaceLightSamplePositions,
} from './wallLighting'
import {
  buildChunkedFloorRenderDerivedCache,
  type FloorRenderChunkBundle,
  type FloorRenderChunkCache,
  type FloorReceiverCellInput,
} from './floorRenderDerived'
import {
  getBakedLightSampleForCell,
  getOrBuildBakedFloorLightField,
  type BakedFloorLightField,
} from '../../rendering/dungeonLightField'
import {
  getCachedRuntimeSurfaceLightProbe,
  releaseCachedRuntimeSurfaceLightingProbe,
} from '../../rendering/surfaceLightingCache'
import { setBuildAnimationTime } from './buildAnimationMaterial'
import { TileGpuStreamMount } from './TileGpuStreamContext'
import {
  getBuildAnimationKeyFromWallKeys,
  getOpeningHitboxSize,
} from './DungeonRoomShared'
import { getOpeningObjectProps, getOpeningPlayModeNextProps } from '../../store/openingState'
import { registerObject, unregisterObject } from './objectRegistry'
import { getTileGpuStreamMountId } from './TileGpuStreamContextShared'
import { SplineWallLayer } from './SplineWallLayer'
import {
  buildRoomFloorMaskData,
  buildRoomFloorMaskDataByRoomId,
  buildRoomFloorMaskGeometry,
  filterCellsToRoomFloorMask,
  type RoomFloorMaskData,
} from './roomFloorMask'
import {
  buildRoomFloorMaskRuntime,
  disposeRoomFloorMaskRuntime,
  type RoomFloorMaskRuntime,
} from './roomFloorMaskRuntime'
import { SurfaceProbeDebugOverlay } from './SurfaceProbeDebugOverlay'

const ZERO_ROTATION = [0, 0, 0] as const
const IGNORE_RAYCAST: THREE.Object3D['raycast'] = () => {}

function averageBakedLightSamples(
  lightField: BakedFloorLightField,
  cellKeys: readonly string[],
) {
  if (cellKeys.length === 0) {
    return [0, 0, 0] as const
  }

  let sumR = 0
  let sumG = 0
  let sumB = 0
  cellKeys.forEach((cellKey) => {
    const sample = getBakedLightSampleForCell(lightField, cellKey)
    sumR += sample[0]
    sumG += sample[1]
    sumB += sample[2]
  })

  return [
    sumR / cellKeys.length,
    sumG / cellKeys.length,
    sumB / cellKeys.length,
  ] as const
}

function useIsBuildAnimationActive(buildAnimationVersion: number) {
  return useCallback((cellKey: string) => {
    void buildAnimationVersion
    return isAnimationActive(cellKey)
  }, [buildAnimationVersion])
}

type ResolvedFloorReceiverCellInput = FloorReceiverCellInput & {
  assetUrl: string
  receiverTransform?: ContentPackModelTransform
}

export type { DungeonRoomData } from '../../store/derived/floorDerived'

export function DungeonRoom({
  visibility,
  derived,
  bakedLightField,
  enableBuildAnimation = true,
  enableFloorReceiver = true,
  streamScopeKey = 'active',
  dirtyInfo = null,
}: {
  visibility: PlayVisibility
  derived: FloorSceneDerivedBundle
  bakedLightField?: BakedFloorLightField | null
  enableBuildAnimation?: boolean
  enableFloorReceiver?: boolean
  streamScopeKey?: string
  dirtyInfo?: FloorDirtyInfo | null
}) {
  const buildAnimationVersion = useBuildAnimationVersion()
  const tool = useDungeonStore((state) => state.tool)
  const showProjectionDebugMesh = useDungeonStore((state) => state.showProjectionDebugMesh)
  const showSurfaceProbeDebug = useDungeonStore((state) => state.showSurfaceProbeDebug)
  const { placedObjects } = derived.data
  const floorId = derived.data.floorId
  const floorReceiverActive = enableFloorReceiver && shouldActivateFloorReceiver(tool, showProjectionDebugMesh)
  const floorRenderChunkCacheRef = useRef<FloorRenderChunkCache | null>(null)

  // Floor cells occupied by a StaircaseDown have no floor tile — the staircase
  // model fills the space and a tile would clip through it.
  const blockedFloorCellKeys = useMemo(() => {
    const set = new Set<string>()
    for (const obj of Object.values(placedObjects)) {
      if (isDownStairAssetId(obj.assetId)) {
        set.add(`${obj.cell[0]}:${obj.cell[1]}`)
      }
    }
    return set
  }, [placedObjects])
  const bakedFloorLightField = useMemo(() => {
    if (bakedLightField) {
      return bakedLightField
    }

    return getOrBuildBakedFloorLightField(derived.bakedLightBuildInput)
  }, [bakedLightField, derived.bakedLightBuildInput])
  const renderInvalidationHaloCells = useMemo(
    () => Math.max(
      1,
      ...Object.values(derived.data.floorTileAssetIds).map((assetId) => {
        const span = getFloorTileSpan(assetId)
        return Math.max(span.gridWidth - 1, span.gridHeight - 1)
      }),
    ),
    [derived.data.floorTileAssetIds],
  )
  const floorRenderChunkCache = useMemo(
    () => buildChunkedFloorRenderDerivedCache({
      previous: floorRenderChunkCacheRef.current,
      floorId,
      input: {
        paintedCells: derived.data.paintedCells,
        layers: derived.data.layers,
        rooms: derived.data.rooms,
        wallOpenings: derived.data.wallOpenings,
        globalFloorAssetId: derived.data.globalFloorAssetId,
        floorTileAssetIds: derived.data.floorTileAssetIds,
        globalWallAssetId: derived.data.globalWallAssetId,
        wallSurfaceAssetIds: derived.data.wallSurfaceAssetIds,
        wallSurfaceProps: derived.data.wallSurfaceProps,
        innerWalls: derived.data.innerWalls,
        splineWallGraph: derived.data.splineWallGraph,
      },
      dirtyInfo,
      includeFloorReceivers: floorReceiverActive,
      haloCells: renderInvalidationHaloCells,
    }),
    [
      derived.data.floorTileAssetIds,
      derived.data.globalFloorAssetId,
      derived.data.globalWallAssetId,
      derived.data.innerWalls,
      derived.data.layers,
      derived.data.paintedCells,
      derived.data.rooms,
      derived.data.splineWallGraph,
      derived.data.wallOpenings,
      derived.data.wallSurfaceAssetIds,
      derived.data.wallSurfaceProps,
      dirtyInfo,
      floorId,
      floorReceiverActive,
      renderInvalidationHaloCells,
    ],
  )
  floorRenderChunkCacheRef.current = floorRenderChunkCache
  const streamMountId = useMemo(
    () => getTileGpuStreamMountId(floorId, streamScopeKey),
    [floorId, streamScopeKey],
  )
  const visibleWallOpenings = useMemo(
    () => Object.fromEntries(derived.visibleOpenings.map((opening) => [opening.id, opening])),
    [derived.visibleOpenings],
  )
  const roomFloorMaskData = useMemo(
    () => buildRoomFloorMaskData({
      paintedCellRecords: Object.values(derived.visiblePaintedCellRecords),
      layers: derived.data.layers,
      splineWallGraph: derived.data.splineWallGraph ?? EMPTY_SPLINE_WALL_GRAPH,
    }),
    [derived.data.layers, derived.data.splineWallGraph, derived.visiblePaintedCellRecords],
  )
  const roomFloorMaskDataByRoomId = useMemo(
    () => buildRoomFloorMaskDataByRoomId({
      paintedCellRecords: Object.values(derived.visiblePaintedCellRecords),
      layers: derived.data.layers,
      splineWallGraph: derived.data.splineWallGraph ?? EMPTY_SPLINE_WALL_GRAPH,
    }),
    [derived.data.layers, derived.data.splineWallGraph, derived.visiblePaintedCellRecords],
  )
  const roomFloorMaskRuntimeByRoomId = useMemo(
    () => Object.fromEntries(
      Object.entries(roomFloorMaskDataByRoomId).flatMap(([roomId, maskData]) => {
        const runtime = buildRoomFloorMaskRuntime(maskData)
        return runtime ? [[roomId, runtime] as const] : []
      }),
    ) as Record<string, RoomFloorMaskRuntime>,
    [roomFloorMaskDataByRoomId],
  )
  const openingQueryCache = useMemo(
    () => createSplineWallQueryCache(derived.data.splineWallGraph ?? EMPTY_SPLINE_WALL_GRAPH),
    [derived.data.splineWallGraph],
  )
  const openingAnalyzedBoundaries = useMemo(
    () => analyzeSplineWallGraphBoundaries(
      derived.data.splineWallGraph ?? EMPTY_SPLINE_WALL_GRAPH,
    ),
    [derived.data.splineWallGraph],
  )
  const openingAssemblySections = useMemo(
    () => buildSplineWallAssemblySections({
      analyzedBoundaries: openingAnalyzedBoundaries,
      wallStyleAssignments: derived.data.wallStyleAssignments,
      wallCoreAssignments: derived.data.wallCoreAssignments,
      rooms: derived.data.rooms,
    }),
    [derived.data.rooms, derived.data.wallCoreAssignments, derived.data.wallStyleAssignments, openingAnalyzedBoundaries],
  )
  const openingDescriptors = useMemo(
    () => buildSplineWallOpeningDescriptors({
      splineWallGraph: derived.data.splineWallGraph ?? EMPTY_SPLINE_WALL_GRAPH,
      wallOpenings: visibleWallOpenings,
      assemblySections: openingAssemblySections,
    }),
    [derived.data.splineWallGraph, openingAssemblySections, visibleWallOpenings],
  )
  useLayoutEffect(
    () => () => Object.values(roomFloorMaskRuntimeByRoomId).forEach((runtime) => disposeRoomFloorMaskRuntime(runtime)),
    [roomFloorMaskRuntimeByRoomId],
  )
  useFrame(() => {
    const now = performance.now()
    const { holdBatchStart, holdReleaseAt } = getHeldBuildBatchUniformState(now)
    setBuildAnimationTime(now, getBuildAnimationTimeScale(), holdBatchStart, holdReleaseAt)
    advanceBuildAnimations(now)
  })

  return (
    <>
      <TileGpuStreamMount mountId={streamMountId} />
      <Suspense fallback={null}>
        <SplineWallLayer
          floorId={derived.data.floorId}
          dirtyInfo={dirtyInfo}
          paintedCells={derived.visiblePaintedCellRecords}
          splineWallGraph={derived.data.splineWallGraph ?? EMPTY_SPLINE_WALL_GRAPH}
          layers={derived.data.layers}
          rooms={derived.data.rooms}
          wallOpenings={visibleWallOpenings}
          wallStyleAssignments={derived.data.wallStyleAssignments}
          wallCoreAssignments={derived.data.wallCoreAssignments}
          globalWallAssetId={derived.data.globalWallAssetId}
          bakedLightField={bakedFloorLightField}
          visibility={visibility}
        />
      </Suspense>
      {showSurfaceProbeDebug && (
        <SurfaceProbeDebugOverlay
          bakedLightField={bakedFloorLightField}
          paintedCells={derived.visiblePaintedCellRecords}
          visibleOpenings={derived.visibleOpenings}
          splineWallGraph={derived.data.splineWallGraph ?? EMPTY_SPLINE_WALL_GRAPH}
        />
      )}
      <RoomFloorMaskDebugOverlay maskData={roomFloorMaskData} />
      {floorRenderChunkCache.orderedChunkKeys.map((chunkKey) => {
        const bundle = floorRenderChunkCache.bundlesByChunk.get(chunkKey)
        if (!bundle) {
          return null
        }

        return (
          <FloorRenderChunkRenderer
            key={chunkKey}
            chunkKey={chunkKey}
            bundle={bundle}
            floorId={floorId}
            mountId={streamMountId}
            splineWallGraph={derived.data.splineWallGraph ?? EMPTY_SPLINE_WALL_GRAPH}
            openingQueryCache={openingQueryCache}
            openingDescriptors={openingDescriptors}
            bakedFloorLightField={bakedFloorLightField}
            blockedFloorCellKeys={blockedFloorCellKeys}
            visibility={visibility}
            enableBuildAnimation={enableBuildAnimation}
            buildAnimationVersion={buildAnimationVersion}
            enableFloorReceiver={enableFloorReceiver}
            floorReceiverActive={floorReceiverActive}
            showProjectionDebugMesh={showProjectionDebugMesh}
            roomFloorMaskDataByRoomId={roomFloorMaskDataByRoomId}
            roomFloorMaskRuntimeByRoomId={roomFloorMaskRuntimeByRoomId}
          />
        )
      })}
    </>
  )
}

function FloorRenderChunkRenderer({
  chunkKey,
  bundle,
  floorId,
  mountId,
  splineWallGraph,
  openingQueryCache,
  openingDescriptors,
  bakedFloorLightField,
  blockedFloorCellKeys,
  visibility,
  enableBuildAnimation,
  buildAnimationVersion,
  enableFloorReceiver,
  floorReceiverActive,
  showProjectionDebugMesh,
  roomFloorMaskDataByRoomId,
  roomFloorMaskRuntimeByRoomId,
}: {
  chunkKey: string
  bundle: FloorRenderChunkBundle
  floorId: string
  mountId: string
  splineWallGraph: typeof EMPTY_SPLINE_WALL_GRAPH
  openingQueryCache: SplineWallQueryCache
  openingDescriptors: readonly SplineWallOpeningDescriptor[]
  bakedFloorLightField: BakedFloorLightField
  blockedFloorCellKeys: Set<string>
  visibility: PlayVisibility
  enableBuildAnimation: boolean
  buildAnimationVersion: number
  enableFloorReceiver: boolean
  floorReceiverActive: boolean
  showProjectionDebugMesh: boolean
  roomFloorMaskDataByRoomId: Record<string, RoomFloorMaskData>
  roomFloorMaskRuntimeByRoomId: Record<string, RoomFloorMaskRuntime>
}) {
  return (
    <>
      {enableFloorReceiver && (
        <FloorDecalReceiver
          receiverId={`floor-receiver:${mountId}:${chunkKey}`}
          cells={bundle.visibleFloorReceiverCells}
          blockedFloorCellKeys={blockedFloorCellKeys}
          enabled={floorReceiverActive}
          showProjectionDebugMesh={showProjectionDebugMesh}
        />
      )}
      {bundle.floorGroups.map((group) => (
        <CellGroupRenderer
          key={group.groupKey}
          group={group}
          floorId={floorId}
          mountId={mountId}
          bakedFloorLightField={bakedFloorLightField}
            blockedFloorCellKeys={blockedFloorCellKeys}
            visibility={visibility}
            enableBuildAnimation={enableBuildAnimation}
            buildAnimationVersion={buildAnimationVersion}
            roomFloorMaskDataByRoomId={roomFloorMaskDataByRoomId}
            roomFloorMaskRuntimeByRoomId={roomFloorMaskRuntimeByRoomId}
          />
        ))}
      <FloorSurfaceRenderer
        placements={bundle.floorSurfaceEntries}
        floorId={floorId}
        mountId={mountId}
        sourceId={`floor-surfaces:${floorId}:${chunkKey}`}
        bakedFloorLightField={bakedFloorLightField}
        blockedFloorCellKeys={blockedFloorCellKeys}
        visibility={visibility}
        enableBuildAnimation={enableBuildAnimation}
        buildAnimationVersion={buildAnimationVersion}
        roomFloorMaskDataByRoomId={roomFloorMaskDataByRoomId}
        roomFloorMaskRuntimeByRoomId={roomFloorMaskRuntimeByRoomId}
      />
      {bundle.openings.map((opening) => (
        <OpeningRenderer
          key={opening.id}
          opening={opening}
          splineWallGraph={splineWallGraph}
          openingQueryCache={openingQueryCache}
          openingDescriptors={openingDescriptors}
          bakedLightField={bakedFloorLightField}
          paintedCells={bundle.contextPaintedCells}
          visibility={visibility}
          enableBuildAnimation={enableBuildAnimation}
        />
      ))}
    </>
  )
}

function CellGroupRenderer({
  group,
  floorId,
  mountId,
  bakedFloorLightField,
  blockedFloorCellKeys,
  visibility,
  enableBuildAnimation,
  buildAnimationVersion,
  roomFloorMaskDataByRoomId,
  roomFloorMaskRuntimeByRoomId,
}: {
  group: FloorRenderGroup
  floorId: string
  mountId: string
  bakedFloorLightField: BakedFloorLightField
  blockedFloorCellKeys: Set<string>
  visibility: PlayVisibility
  enableBuildAnimation: boolean
  buildAnimationVersion: number
  roomFloorMaskDataByRoomId: Record<string, RoomFloorMaskData>
  roomFloorMaskRuntimeByRoomId: Record<string, RoomFloorMaskRuntime>
}) {
  const useLineOfSightPostMask = visibility.active
  const roomFloorMaskData = group.roomId
    ? roomFloorMaskDataByRoomId[group.roomId] ?? null
    : null
  const roomFloorMaskRuntime = group.roomId
    ? roomFloorMaskRuntimeByRoomId[group.roomId] ?? null
    : null
  const renderableCells = useMemo(
    () => roomFloorMaskData
      ? filterCellsToRoomFloorMask(group.cells, roomFloorMaskData)
      : group.cells,
    [group.cells, roomFloorMaskData],
  )
  const staticEntries = useMemo<StaticTileEntry[]>(
    () => renderableCells.flatMap((cell) => {
      void buildAnimationVersion
      const key = getCellKey(cell)
      if (blockedFloorCellKeys.has(key)) {
        return []
      }

      const buildAnimation = enableBuildAnimation
        ? getBuildAnimationState(key)
        : null
      return [{
        key: `floor:${key}`,
        assetId: group.floorAssetId,
        position: cellToWorldPosition(cell),
        rotation: group.rotation,
        buildAnimationDelay: buildAnimation?.delay,
        buildAnimationStart: buildAnimation?.startedAt,
        variant: 'floor',
        variantKey: key,
        visibility: 'visible',
        bakedLightField: bakedFloorLightField,
        bakedLight: getBakedLightSampleForCell(bakedFloorLightField, key),
        fogCell: cell,
      }]
      }),
    [
      bakedFloorLightField,
      blockedFloorCellKeys,
      buildAnimationVersion,
      enableBuildAnimation,
      group.floorAssetId,
      group.rotation,
      renderableCells,
    ],
  )

  return (
    <BatchedTileEntries
      entries={staticEntries}
      floorId={floorId}
      mountId={mountId}
      sourceId={`floor-group:${floorId}:${group.groupKey}`}
      useLineOfSightPostMask={useLineOfSightPostMask}
      useRoomFloorMask={roomFloorMaskRuntime !== null}
      roomFloorMaskRuntime={roomFloorMaskRuntime}
    />
  )
}

function FloorSurfaceRenderer({
  placements,
  floorId,
  mountId,
  sourceId,
  bakedFloorLightField,
  blockedFloorCellKeys,
  visibility,
  enableBuildAnimation,
  buildAnimationVersion,
  roomFloorMaskDataByRoomId,
  roomFloorMaskRuntimeByRoomId,
}: {
  placements: FloorSurfacePlacement[]
  floorId: string
  mountId: string
  sourceId: string
  bakedFloorLightField: BakedFloorLightField
  blockedFloorCellKeys: Set<string>
  visibility: PlayVisibility
  enableBuildAnimation: boolean
  buildAnimationVersion: number
  roomFloorMaskDataByRoomId: Record<string, RoomFloorMaskData>
  roomFloorMaskRuntimeByRoomId: Record<string, RoomFloorMaskRuntime>
}) {
  const useLineOfSightPostMask = visibility.active
  const isBuildAnimationCurrentlyActive = useIsBuildAnimationActive(buildAnimationVersion)
  const placementGroups = useMemo(
    () => Object.values(
      placements.reduce<Record<string, {
        key: string
        roomId: string | null
        entries: StaticTileEntry[]
      }>>((groups, placement) => {
        const shouldSkip =
          placement.coveredCellKeys.some((cellKey) => blockedFloorCellKeys.has(cellKey))
        if (shouldSkip) {
          return groups
        }

        const buildAnimationCellKey = placement.coveredCellKeys.find((cellKey) =>
          enableBuildAnimation && isBuildAnimationCurrentlyActive(cellKey),
        ) ?? placement.anchorCellKey
        const buildAnimation = enableBuildAnimation
          ? getBuildAnimationState(buildAnimationCellKey)
          : null
        const roomId = placement.roomId ?? null
        const roomFloorMaskData = roomId
          ? roomFloorMaskDataByRoomId[roomId] ?? null
          : null
        if (roomFloorMaskData && filterCellsToRoomFloorMask(placement.coveredCells, roomFloorMaskData).length === 0) {
          return groups
        }
        const groupKey = roomId ?? 'legacy'
        const entry: StaticTileEntry = {
          key: `floor-surface:${placement.anchorCellKey}`,
          assetId: placement.assetId,
          position: placement.position,
          rotation: ZERO_ROTATION,
          buildAnimationDelay: buildAnimation?.delay,
          buildAnimationStart: buildAnimation?.startedAt,
          variant: 'floor',
          variantKey: placement.anchorCellKey,
          visibility: 'visible',
          bakedLightField: bakedFloorLightField,
          bakedLight: averageBakedLightSamples(bakedFloorLightField, placement.coveredCellKeys),
          fogCell: placement.anchorCell,
        }

        if (!groups[groupKey]) {
          groups[groupKey] = {
            key: groupKey,
            roomId,
            entries: [entry],
          }
          return groups
        }

        groups[groupKey]!.entries.push(entry)
        return groups
      }, {}),
    ),
    [bakedFloorLightField, blockedFloorCellKeys, enableBuildAnimation, isBuildAnimationCurrentlyActive, placements, roomFloorMaskDataByRoomId],
  )

  return (
    <>
      {placementGroups.map((group) => {
        const roomFloorMaskRuntime = group.roomId
          ? roomFloorMaskRuntimeByRoomId[group.roomId] ?? null
          : null
        return (
          <BatchedTileEntries
            key={`${sourceId}:${group.key}`}
            entries={group.entries}
            floorId={floorId}
            mountId={mountId}
            sourceId={`${sourceId}:${group.key}`}
            useLineOfSightPostMask={useLineOfSightPostMask}
            useRoomFloorMask={roomFloorMaskRuntime !== null}
            roomFloorMaskRuntime={roomFloorMaskRuntime}
          />
        )
      })}
    </>
  )
}

function RoomFloorMaskDebugOverlay({
  maskData,
}: {
  maskData: ReturnType<typeof buildRoomFloorMaskData>
}) {
  const showRoomFloorMaskDebug = useDungeonStore((state) => state.showRoomFloorMaskDebug)
  const debugGeometry = useMemo(
    () => showRoomFloorMaskDebug ? buildRoomFloorMaskGeometry(maskData, 0.00005) : null,
    [maskData, showRoomFloorMaskDebug],
  )
  const debugMaterial = useMemo(
    () => new THREE.MeshBasicMaterial({
      color: '#2dd4bf',
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      depthWrite: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      toneMapped: false,
    }),
    [],
  )

  useLayoutEffect(() => () => debugGeometry?.dispose(), [debugGeometry])
  useLayoutEffect(() => () => debugMaterial.dispose(), [debugMaterial])

  if (!showRoomFloorMaskDebug || !debugGeometry) {
    return null
  }

  return (
    <mesh
      geometry={debugGeometry}
      material={debugMaterial}
      renderOrder={6}
      raycast={IGNORE_RAYCAST}
    />
  )
}

function FloorDecalReceiver({
  receiverId,
  cells,
  blockedFloorCellKeys,
  enabled,
  showProjectionDebugMesh,
}: {
  receiverId: string
  cells: FloorReceiverCellInput[]
  blockedFloorCellKeys: Set<string>
  enabled: boolean
  showProjectionDebugMesh: boolean
}) {
  const receiverCells = useMemo(
    () => (enabled
      ? cells.flatMap((cell) => {
      const resolved = resolveProjectionReceiverAsset(cell.assetId, cell.cellKey)
      if (!resolved) {
        return []
      }

      return [{
        ...cell,
        assetUrl: resolved.assetUrl,
        receiverTransform: mergeFloorReceiverTransforms(resolved.transform, cell.receiverTransformOverride),
      }] satisfies ResolvedFloorReceiverCellInput[]
    })
      : []),
    [cells, enabled],
  )

  if (!enabled || receiverCells.length === 0) {
    return null
  }

  return (
    <ResolvedFloorDecalReceiver
      receiverId={receiverId}
      receiverCells={receiverCells}
      blockedFloorCellKeys={blockedFloorCellKeys}
      showProjectionDebugMesh={showProjectionDebugMesh}
    />
  )
}

function ResolvedFloorDecalReceiver({
  receiverId,
  receiverCells,
  blockedFloorCellKeys,
  showProjectionDebugMesh,
}: {
  receiverId: string
  receiverCells: ResolvedFloorReceiverCellInput[]
  blockedFloorCellKeys: Set<string>
  showProjectionDebugMesh: boolean
}) {
  const meshRef = useRef<THREE.Mesh>(null)
  const receiverAssetUrls = useMemo(
    () => Array.from(new Set(receiverCells.map((cell) => cell.assetUrl))),
    [receiverCells],
  )
  const gltfs = useGLTF(receiverAssetUrls as string[])
  const receiverScenesByUrl = useMemo(() => {
    const loaded = Array.isArray(gltfs) ? gltfs : [gltfs]
    return new Map(
      receiverAssetUrls.map((assetUrl, index) => [assetUrl, loaded[index]?.scene ?? null]),
    )
  }, [gltfs, receiverAssetUrls])
  const resolvedReceiverCells = useMemo(
    () => receiverCells.flatMap((cell) => {
      const receiverScene = receiverScenesByUrl.get(cell.assetUrl)
      if (!receiverScene) {
        return []
      }

      return [{
        cell: cell.cell,
        receiverScene,
        receiverTransform: cell.receiverTransform,
      }]
    }),
    [receiverCells, receiverScenesByUrl],
  )
  const geometry = useMemo(
    () => resolvedReceiverCells.length
      ? buildMergedFloorReceiverGeometry({
          cells: resolvedReceiverCells,
          blockedFloorCellKeys,
        })
      : null,
    [blockedFloorCellKeys, resolvedReceiverCells],
  )

  const projectionReceiverMesh = useMemo(() => {
    if (!geometry) {
      return null
    }

    const mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial())
    mesh.matrixAutoUpdate = false
    mesh.updateMatrixWorld(true)
    return mesh
  }, [geometry])

  useLayoutEffect(() => {
    if (!meshRef.current || !projectionReceiverMesh) {
      return
    }

    meshRef.current.userData.ignoreLosRaycast = true
    meshRef.current.raycast = () => {}
    registerDecalReceivers(receiverId, [projectionReceiverMesh])

    return () => unregisterDecalReceivers(receiverId)
  }, [projectionReceiverMesh, receiverId])

  useLayoutEffect(() => () => geometry?.dispose(), [geometry])
  useLayoutEffect(
    () => () => {
      if (projectionReceiverMesh?.material instanceof THREE.Material) {
        projectionReceiverMesh.material.dispose()
      }
    },
    [projectionReceiverMesh],
  )

  if (!geometry) {
    return null
  }

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      visible={showProjectionDebugMesh}
      renderOrder={showProjectionDebugMesh ? 4 : -1}
    >
      <meshBasicMaterial
        color="#8d8d8d"
        transparent={false}
        opacity={1}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-4}
        toneMapped={false}
      />
    </mesh>
  )
}

function mergeFloorReceiverTransforms(
  base?: ContentPackModelTransform,
  override?: ContentPackModelTransform,
): ContentPackModelTransform | undefined {
  if (!base && !override) {
    return undefined
  }

  const basePosition = base?.position ?? [0, 0, 0]
  const overridePosition = override?.position ?? [0, 0, 0]
  return {
    position: [
      basePosition[0] + overridePosition[0],
      basePosition[1] + overridePosition[1],
      basePosition[2] + overridePosition[2],
    ],
    rotation: override?.rotation ?? base?.rotation,
    scale: override?.scale ?? base?.scale,
  }
}

function AnimatedTileGroup({
  cellKey,
  extraDelay = 0,
  enabled = true,
  children,
}: {
  cellKey: string
  extraDelay?: number
  enabled?: boolean
  children: ReactNode
}) {
  const groupRef = useRef<THREE.Group>(null)
  const lastYRef = useRef(0)

  useFrame(() => {
    const group = groupRef.current
    if (!group) {
      return
    }

    const now = performance.now()
    const nextY = enabled ? getBuildYOffset(cellKey, now, extraDelay) : 0
    if (nextY !== lastYRef.current) {
      group.position.y = nextY
      lastYRef.current = nextY
    }
  })

  useLayoutEffect(() => {
    const group = groupRef.current
    if (!group) {
      return
    }

    group.position.y = 0
    lastYRef.current = 0

    return () => {
      group.position.y = 0
      lastYRef.current = 0
    }
  }, [])

  return <group ref={groupRef}>{children}</group>
}

function OpeningRenderer({
  opening,
  splineWallGraph,
  openingQueryCache,
  openingDescriptors,
  bakedLightField,
  paintedCells,
  visibility,
  enableBuildAnimation,
}: {
  opening: OpeningRecord
  splineWallGraph: typeof EMPTY_SPLINE_WALL_GRAPH
  openingQueryCache: SplineWallQueryCache
  openingDescriptors: readonly SplineWallOpeningDescriptor[]
  bakedLightField: BakedFloorLightField
  paintedCells: PaintedCells
  visibility: PlayVisibility
  enableBuildAnimation: boolean
}) {
  const selection = useDungeonStore((state) => state.selection)
  const selectObject = useDungeonStore((state) => state.selectObject)
  const setOpeningProps = useDungeonStore((state) => state.setOpeningProps)
  const selected = selection === opening.id
  const useLineOfSightPostMask = visibility.active
  const buildAnimationVersion = useBuildAnimationVersion()
  const isBuildAnimationCurrentlyActive = useIsBuildAnimationActive(buildAnimationVersion)
  const openingTransform = getOpeningWorldTransform(splineWallGraph, openingQueryCache, opening)
  const openingRenderContext = opening.assetId
    ? getSplineWallOpeningRenderContext({
        splineWallGraph,
        openingQueryCache,
        opening,
        openingDescriptors,
      }) ?? getOpeningRenderContext(splineWallGraph, openingQueryCache, opening)
    : null
  const openingSegmentKeys = openingTransform?.wallKeys ?? getOpeningSegments(opening.wallKey, opening.width)
  const wallVisibility = getWallSpanVisibilityState(visibility, openingSegmentKeys)
  const interiorDirections = getWallSpanInteriorLightDirections(openingSegmentKeys, paintedCells)
  const openingSurfaceSamplePositions = useMemo(
    () => getWallSpanSurfaceLightSamplePositions(openingSegmentKeys, paintedCells),
    [openingSegmentKeys, paintedCells],
  )
  const openingSurfaceLightProbe = useMemo(
    () => getCachedRuntimeSurfaceLightProbe({
      lightField: bakedLightField,
      instanceKey: `opening:${opening.id}`,
      samplePositions: openingSurfaceSamplePositions,
    }),
    [bakedLightField, opening.id, openingSurfaceSamplePositions],
  )
  const openingAnimationCellKey =
    getBuildAnimationKeyFromWallKeys(openingSegmentKeys, isBuildAnimationCurrentlyActive)
    ?? opening.wallKey.split(':').slice(0, 2).join(':')
  const clipBelowGround = enableBuildAnimation && isBuildAnimationCurrentlyActive(openingAnimationCellKey)

  const groupRef = useRef<THREE.Group>(null)
  const assetGroupRef = useRef<THREE.Group>(null)
  useLayoutEffect(() => {
    const selectionTarget = opening.assetId ? assetGroupRef.current : groupRef.current
    if (selectionTarget) registerObject(opening.id, selectionTarget)
    return () => unregisterObject(opening.id)
  }, [opening.assetId, opening.id])
  useEffect(() => () => {
    releaseCachedRuntimeSurfaceLightingProbe(bakedLightField.floorId, `opening:${opening.id}`)
  }, [bakedLightField.floorId, opening.id])

  const tool = useDungeonStore((state) => state.tool)

  if (!openingTransform) return null
  const rotation = openingTransform.rotation

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (event.altKey) {
      event.stopPropagation()
      selectObject(opening.id)
      return
    }

    if (tool !== 'play') {
      return
    }

    const nextProps = getOpeningPlayModeNextProps(opening)
    if (!nextProps) {
      return
    }

    event.stopPropagation()
    setOpeningProps(opening.id, {
      ...getOpeningObjectProps(opening),
      ...nextProps,
    })
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (tool !== 'select') {
      return
    }

    event.stopPropagation()
    selectObject(opening.id)
  }

  return (
    <AnimatedTileGroup
      cellKey={openingAnimationCellKey}
      enabled={enableBuildAnimation}
    >
      <group ref={groupRef} position={openingTransform.position} rotation={rotation}>
        <mesh onClick={handleClick} onPointerDown={handlePointerDown}>
          <boxGeometry args={getOpeningHitboxSize(opening.width)} />
          <meshBasicMaterial
            transparent
            opacity={0}
            colorWrite={false}
            depthWrite={false}
            depthTest={false}
          />
        </mesh>
      {opening.assetId ? (
        <group ref={assetGroupRef}>
          <ContentPackInstance
            assetId={opening.assetId}
            selected={false}
            variant="wall"
            visibility={wallVisibility}
            useLineOfSightPostMask={useLineOfSightPostMask}
            bakedLightField={null}
            bakedLight={openingSurfaceLightProbe?.light}
            bakedLightDirection={interiorDirections.primary}
            bakedLightDirectionSecondary={interiorDirections.secondary}
            bakedLightProbeDirection={openingSurfaceLightProbe?.lightDirection}
            bakedLightDirectionalStrength={openingSurfaceLightProbe?.directionalStrength}
            clipBelowGround={clipBelowGround}
            objectProps={getOpeningObjectProps(opening)}
            openingContext={openingRenderContext ?? undefined}
            onClick={handleClick}
            onPointerDown={handlePointerDown}
          />
        </group>
      ) : (
        <>
          {selected && (
            <mesh>
              <boxGeometry args={getOpeningHitboxSize(opening.width)} />
              <meshBasicMaterial
                transparent
                opacity={0.18}
                color="#22c55e"
                depthWrite={false}
                depthTest={false}
              />
            </mesh>
          )}
        </>
      )}
      </group>
    </AnimatedTileGroup>
  )
}

function getWallSpanVisibilityState(
  visibility: PlayVisibility,
  wallKeys: string[],
): PlayVisibilityState {
  let resolved: PlayVisibilityState = 'hidden'

  for (const wallKey of wallKeys) {
    const next = visibility.getWallVisibility(wallKey)
    if (next === 'visible') {
      return 'visible'
    }
    if (next === 'explored') {
      resolved = 'explored'
    }
  }

  return resolved
}
