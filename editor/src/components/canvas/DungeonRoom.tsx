import { useCallback, useMemo, useLayoutEffect, useRef } from 'react'
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
import { getContentPackAssetById } from '../../content-packs/registry'
import {
  useDungeonStore,
  type OpeningRecord,
  type PaintedCells,
} from '../../store/useDungeonStore'
import { getCanonicalWallKey } from '../../store/wallSegments'
import { getOpeningSegments } from '../../store/openingSegments'
import { getOpeningWorldTransform } from '../../store/openingPlacement'
import { createSplineWallQueryCache, type SplineWallQueryCache } from '../../store/splineWallQueries'
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
import { registerObject, unregisterObject } from './objectRegistry'
import type { PlayVisibility, PlayVisibilityState } from './playVisibility'
import { useGLTF } from '../../rendering/useGLTF'
import { shouldActivateFloorReceiver } from './floorReceiverMode'
import type { ContentPackModelTransform } from '../../content-packs/types'
import { resolveProjectionReceiverAsset } from './tileAssetResolution'
import { getWallSpanInteriorLightDirections } from './wallLighting'
import {
  buildChunkedFloorRenderDerivedCache,
  type FloorRenderChunkBundle,
  type FloorRenderChunkCache,
  type FloorReceiverCellInput,
  type RoomWallInstance,
} from './floorRenderDerived'
import {
  getOrBuildBakedFloorLightField,
  type BakedFloorLightField,
} from '../../rendering/dungeonLightField'
import { setBuildAnimationTime } from './buildAnimationMaterial'
import { TileGpuStreamMount } from './TileGpuStreamContext'
import {
  WALL_EXTRA_DELAY_MS,
  getBuildAnimationKeyFromWallKeys,
  getOpeningHitboxSize,
} from './DungeonRoomShared'
import { getOpeningObjectProps, getOpeningPlayModeNextProps } from '../../store/openingState'
import { getTileGpuStreamMountId } from './TileGpuStreamContextShared'
import { SplineWallLayer } from './SplineWallLayer'
import { buildRoomFloorMaskData, buildRoomFloorMaskGeometry } from './roomFloorMask'
import {
  buildRoomFloorMaskRuntime,
  disposeRoomFloorMaskRuntime,
  type RoomFloorMaskRuntime,
} from './roomFloorMaskRuntime'

const ZERO_ROTATION = [0, 0, 0] as const
const IGNORE_RAYCAST: THREE.Object3D['raycast'] = () => {}

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
  const roomFloorMaskRuntime = useMemo(
    () => buildRoomFloorMaskRuntime(roomFloorMaskData),
    [roomFloorMaskData],
  )
  const openingQueryCache = useMemo(
    () => createSplineWallQueryCache(derived.data.splineWallGraph ?? EMPTY_SPLINE_WALL_GRAPH),
    [derived.data.splineWallGraph],
  )
  void openingQueryCache
  useLayoutEffect(() => () => disposeRoomFloorMaskRuntime(roomFloorMaskRuntime), [roomFloorMaskRuntime])
  useFrame(() => {
    const now = performance.now()
    const { holdBatchStart, holdReleaseAt } = getHeldBuildBatchUniformState(now)
    setBuildAnimationTime(now, getBuildAnimationTimeScale(), holdBatchStart, holdReleaseAt)
    advanceBuildAnimations(now)
  })

  return (
    <>
      <TileGpuStreamMount mountId={streamMountId} />
      <SplineWallLayer
        floorId={derived.data.floorId}
        dirtyInfo={dirtyInfo}
        paintedCells={derived.visiblePaintedCellRecords}
        splineWallGraph={derived.data.splineWallGraph ?? EMPTY_SPLINE_WALL_GRAPH}
        layers={derived.data.layers}
        rooms={derived.data.rooms}
        wallOpenings={visibleWallOpenings}
        wallSurfaceAssetIds={derived.data.wallSurfaceAssetIds}
        wallSurfaceProps={derived.data.wallSurfaceProps}
        globalWallAssetId={derived.data.globalWallAssetId}
        bakedLightField={bakedFloorLightField}
        visibility={visibility}
      />
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
            streamScopeKey={streamScopeKey}
            splineWallGraph={derived.data.splineWallGraph ?? EMPTY_SPLINE_WALL_GRAPH}
            openingQueryCache={openingQueryCache}
            wallSurfaceAssetIds={derived.data.wallSurfaceAssetIds}
            bakedFloorLightField={bakedFloorLightField}
            blockedFloorCellKeys={blockedFloorCellKeys}
            visibility={visibility}
            enableBuildAnimation={enableBuildAnimation}
            buildAnimationVersion={buildAnimationVersion}
            enableFloorReceiver={enableFloorReceiver}
            floorReceiverActive={floorReceiverActive}
            showProjectionDebugMesh={showProjectionDebugMesh}
            roomFloorMaskRuntime={roomFloorMaskRuntime}
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
  streamScopeKey,
  splineWallGraph,
  openingQueryCache,
  wallSurfaceAssetIds,
  bakedFloorLightField,
  blockedFloorCellKeys,
  visibility,
  enableBuildAnimation,
  buildAnimationVersion,
  enableFloorReceiver,
  floorReceiverActive,
  showProjectionDebugMesh,
  roomFloorMaskRuntime,
}: {
  chunkKey: string
  bundle: FloorRenderChunkBundle
  floorId: string
  mountId: string
  streamScopeKey: string
  splineWallGraph: typeof EMPTY_SPLINE_WALL_GRAPH
  openingQueryCache: SplineWallQueryCache
  wallSurfaceAssetIds: Record<string, string>
  bakedFloorLightField: BakedFloorLightField
  blockedFloorCellKeys: Set<string>
  visibility: PlayVisibility
  enableBuildAnimation: boolean
  buildAnimationVersion: number
  enableFloorReceiver: boolean
  floorReceiverActive: boolean
  showProjectionDebugMesh: boolean
  roomFloorMaskRuntime: RoomFloorMaskRuntime | null
}) {
  const isBuildAnimationCurrentlyActive = useIsBuildAnimationActive(buildAnimationVersion)
  const useLineOfSightPostMask = visibility.active
  const staticWallEntries = useMemo<StaticTileEntry[]>(
    () => bundle.walls.flatMap((wall) => {
      const hasSurfaceOverride = wall.segmentKeys.some((segmentKey) => Boolean(wallSurfaceAssetIds[segmentKey]))
      if (
        wall.source === 'boundary'
        && !hasSurfaceOverride
      ) {
        return []
      }
      const floorKey = getBuildAnimationKeyFromWallKeys(wall.segmentKeys, isBuildAnimationCurrentlyActive) ?? wall.key
      if (isInteractiveWallAsset(wall.assetId)) {
        return []
      }

      const buildAnimation = enableBuildAnimation
        ? getBuildAnimationState(floorKey, WALL_EXTRA_DELAY_MS)
        : null
      return [{
        key: wall.key,
        assetId: wall.assetId,
        position: wall.position,
        rotation: wall.rotation,
        buildAnimationDelay: buildAnimation?.delay,
        buildAnimationStart: buildAnimation?.startedAt,
        variant: 'wall',
        variantKey: wall.key,
        visibility: getWallSpanVisibilityState(visibility, wall.segmentKeys),
        bakedLightField: bakedFloorLightField,
        bakedLightDirection: wall.bakedLightDirection,
        bakedLightDirectionSecondary: wall.bakedLightDirectionSecondary,
        objectProps: wall.objectProps,
      }]
    }),
    [
      bakedFloorLightField,
      bundle.walls,
      enableBuildAnimation,
      isBuildAnimationCurrentlyActive,
      visibility,
      wallSurfaceAssetIds,
    ],
  )
  const staticInteractiveWalls = useMemo(
    () => bundle.walls.filter((wall) => {
      const floorKey = getBuildAnimationKeyFromWallKeys(wall.segmentKeys, isBuildAnimationCurrentlyActive) ?? wall.key
      return !(enableBuildAnimation && isBuildAnimationCurrentlyActive(floorKey)) && isInteractiveWallAsset(wall.assetId)
    }),
    [bundle.walls, enableBuildAnimation, isBuildAnimationCurrentlyActive],
  )
  const animatedInteractiveWalls = useMemo(
    () => bundle.walls.filter((wall) => {
      const floorKey = getBuildAnimationKeyFromWallKeys(wall.segmentKeys, isBuildAnimationCurrentlyActive) ?? wall.key
      return enableBuildAnimation && isBuildAnimationCurrentlyActive(floorKey) && isInteractiveWallAsset(wall.assetId)
    }),
    [bundle.walls, enableBuildAnimation, isBuildAnimationCurrentlyActive],
  )
  const staticCornerEntries: StaticTileEntry[] = []

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
            roomFloorMaskRuntime={roomFloorMaskRuntime}
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
        roomFloorMaskRuntime={roomFloorMaskRuntime}
      />
      <BatchedTileEntries
        entries={staticWallEntries}
        floorId={floorId}
        mountId={mountId}
        sourceId={`${streamScopeKey}:${floorId}:walls:${chunkKey}`}
        useLineOfSightPostMask={useLineOfSightPostMask}
      />
      {staticInteractiveWalls.map((wall) => (
        <WallInstanceRenderer
          key={wall.key}
          wall={wall}
          bakedLightField={bakedFloorLightField}
          visibility={visibility}
          useLineOfSightPostMask={useLineOfSightPostMask}
        />
      ))}
      {animatedInteractiveWalls.map((wall) => {
        const floorKey = getBuildAnimationKeyFromWallKeys(wall.segmentKeys, isBuildAnimationCurrentlyActive) ?? wall.key
        return (
          <AnimatedTileGroup
            key={wall.key}
            cellKey={floorKey}
            extraDelay={WALL_EXTRA_DELAY_MS}
            enabled={enableBuildAnimation}
          >
            <WallInstanceRenderer
              wall={wall}
              bakedLightField={bakedFloorLightField}
              visibility={visibility}
              useLineOfSightPostMask={useLineOfSightPostMask}
              clipBelowGround
            />
          </AnimatedTileGroup>
        )
      })}
      <BatchedTileEntries
        entries={staticCornerEntries}
        floorId={floorId}
        mountId={mountId}
        sourceId={`${streamScopeKey}:${floorId}:corners:${chunkKey}`}
        useLineOfSightPostMask={useLineOfSightPostMask}
      />
      {bundle.openings.map((opening) => (
        <OpeningRenderer
          key={opening.id}
          opening={opening}
          splineWallGraph={splineWallGraph}
          openingQueryCache={openingQueryCache}
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
  roomFloorMaskRuntime,
}: {
  group: FloorRenderGroup
  floorId: string
  mountId: string
  bakedFloorLightField: BakedFloorLightField
  blockedFloorCellKeys: Set<string>
  visibility: PlayVisibility
  enableBuildAnimation: boolean
  buildAnimationVersion: number
  roomFloorMaskRuntime: RoomFloorMaskRuntime | null
}) {
  const useLineOfSightPostMask = visibility.active
  const staticEntries = useMemo<StaticTileEntry[]>(
    () => group.cells.flatMap((cell) => {
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
        fogCell: cell,
      }]
      }),
    [
      bakedFloorLightField,
      blockedFloorCellKeys,
      buildAnimationVersion,
      enableBuildAnimation,
      group.cells,
      group.floorAssetId,
      group.rotation,
    ],
  )

  return (
    <BatchedTileEntries
      entries={staticEntries}
      floorId={floorId}
      mountId={mountId}
      sourceId={`floor-group:${floorId}:${group.groupKey}`}
      useLineOfSightPostMask={useLineOfSightPostMask}
      useRoomFloorMask
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
  roomFloorMaskRuntime,
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
  roomFloorMaskRuntime: RoomFloorMaskRuntime | null
}) {
  const useLineOfSightPostMask = visibility.active
  const isBuildAnimationCurrentlyActive = useIsBuildAnimationActive(buildAnimationVersion)
  const staticEntries = useMemo<StaticTileEntry[]>(
    () => placements.flatMap((placement) => {
      const shouldSkip =
        placement.coveredCellKeys.some((cellKey) => blockedFloorCellKeys.has(cellKey))
      if (shouldSkip) {
        return []
      }

      const buildAnimationCellKey = placement.coveredCellKeys.find((cellKey) =>
        enableBuildAnimation && isBuildAnimationCurrentlyActive(cellKey),
      ) ?? placement.anchorCellKey
      const buildAnimation = enableBuildAnimation
        ? getBuildAnimationState(buildAnimationCellKey)
        : null
      return [{
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
        fogCell: placement.anchorCell,
      }]
    }),
    [bakedFloorLightField, blockedFloorCellKeys, enableBuildAnimation, isBuildAnimationCurrentlyActive, placements],
  )

  return (
    <BatchedTileEntries
      entries={staticEntries}
      floorId={floorId}
      mountId={mountId}
      sourceId={sourceId}
      useLineOfSightPostMask={useLineOfSightPostMask}
      useRoomFloorMask
      roomFloorMaskRuntime={roomFloorMaskRuntime}
    />
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

function isInteractiveWallAsset(assetId: string | null) {
  return Boolean(getContentPackAssetById(assetId ?? '')?.getPlayModeNextProps)
}

function WallInstanceRenderer({
  wall,
  bakedLightField,
  visibility,
  useLineOfSightPostMask,
  clipBelowGround = false,
}: {
  wall: RoomWallInstance
  bakedLightField: BakedFloorLightField
  visibility: PlayVisibility
  useLineOfSightPostMask: boolean
  clipBelowGround?: boolean
}) {
  const selectObject = useDungeonStore((state) => state.selectObject)
  const tool = useDungeonStore((state) => state.tool)
  const setWallSurfaceProps = useDungeonStore((state) => state.setWallSurfaceProps)
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const asset = getContentPackAssetById(wall.assetId ?? '')
  const wallVisibility = getWallSpanVisibilityState(visibility, wall.segmentKeys)
  const wallSelectionKey = getCanonicalWallKey(wall.segmentKeys[0] ?? wall.key, paintedCells) ?? wall.segmentKeys[0] ?? wall.key
  const groupRef = useRef<THREE.Group>(null)

  useLayoutEffect(() => {
    if (groupRef.current) registerObject(wallSelectionKey, groupRef.current)
    return () => unregisterObject(wallSelectionKey)
  }, [wallSelectionKey])

  function handleClick(event: ThreeEvent<MouseEvent>) {
    if (tool === 'select') {
      event.stopPropagation()
      selectObject(wallSelectionKey)
      return
    }

    if (tool !== 'play') {
      return
    }

    const wallKey = wallSelectionKey
    if (!wallKey) {
      return
    }

    const nextProps = asset?.getPlayModeNextProps?.(wall.objectProps ?? {}) ?? null
    if (!nextProps) {
      return
    }

    event.stopPropagation()
    setWallSurfaceProps(wallKey, { ...(wall.objectProps ?? {}), ...nextProps })
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (tool !== 'select') {
      return
    }

    event.stopPropagation()
    selectObject(wallSelectionKey)
  }

  return (
    <group ref={groupRef} position={wall.position} rotation={wall.rotation}>
      <ContentPackInstance
        assetId={wall.assetId}
        position={ZERO_ROTATION}
        rotation={ZERO_ROTATION}
        selected={false}
        variant="wall"
        variantKey={wall.key}
        visibility={wallVisibility}
        useLineOfSightPostMask={useLineOfSightPostMask}
        bakedLightField={bakedLightField}
        bakedLightDirection={wall.bakedLightDirection}
        bakedLightDirectionSecondary={wall.bakedLightDirectionSecondary}
        clipBelowGround={clipBelowGround}
        objectProps={wall.objectProps}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      />
    </group>
  )
}

function OpeningRenderer({
  opening,
  splineWallGraph,
  openingQueryCache,
  bakedLightField,
  paintedCells,
  visibility,
  enableBuildAnimation,
}: {
  opening: OpeningRecord
  splineWallGraph: typeof EMPTY_SPLINE_WALL_GRAPH
  openingQueryCache: SplineWallQueryCache
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
  const openingSegmentKeys = openingTransform?.wallKeys ?? getOpeningSegments(opening.wallKey, opening.width)
  const wallVisibility = getWallSpanVisibilityState(visibility, openingSegmentKeys)
  const interiorDirections = getWallSpanInteriorLightDirections(openingSegmentKeys, paintedCells)
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
            bakedLightField={bakedLightField}
            bakedLightDirection={interiorDirections.primary}
            bakedLightDirectionSecondary={interiorDirections.secondary}
            clipBelowGround={clipBelowGround}
            objectProps={getOpeningObjectProps(opening)}
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
