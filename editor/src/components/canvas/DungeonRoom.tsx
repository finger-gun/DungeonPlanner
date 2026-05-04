import { useCallback, useMemo, useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import {
  GRID_SIZE,
  cellToWorldPosition,
  getCellKey,
} from '../../hooks/useSnapToGrid'
import type { FloorDirtyInfo } from '../../store/floorDirtyDomains'
import { getContentPackAssetById } from '../../content-packs/registry'
import {
  useDungeonStore,
  type OpeningRecord,
  type PaintedCells,
} from '../../store/useDungeonStore'
import { getOpeningSegments } from '../../store/openingSegments'
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
import { wallKeyToWorldPosition } from '../../store/wallSegments'
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
import { TileGpuStreamMount, getTileGpuStreamMountId } from './TileGpuStreamContext'

const WALL_EXTRA_DELAY_MS = 70
const ZERO_ROTATION = [0, 0, 0] as const

function useIsBuildAnimationActive(buildAnimationVersion: number) {
  return useCallback((cellKey: string) => {
    void buildAnimationVersion
    return isAnimationActive(cellKey)
  }, [buildAnimationVersion])
}

function getWallCellKey(wallKey: string) {
  const [x, z] = wallKey.split(':')
  if (x === undefined || z === undefined) {
    return null
  }

  return `${x}:${z}`
}

export function getBuildAnimationCellKeyFromWallKeys(
  wallKeys: string[],
  isBuildAnimationCurrentlyActive?: (cellKey: string) => boolean,
) {
  const cellKeys = [...new Set(
    wallKeys
      .map(getWallCellKey)
      .filter((cellKey): cellKey is string => cellKey !== null),
  )]

  if (cellKeys.length === 0) {
    return null
  }

  return isBuildAnimationCurrentlyActive
    ? (cellKeys.find((cellKey) => isBuildAnimationCurrentlyActive(cellKey)) ?? cellKeys[0])
    : cellKeys[0]
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
  useFrame(() => {
    const now = performance.now()
    const { holdBatchStart, holdReleaseAt } = getHeldBuildBatchUniformState(now)
    setBuildAnimationTime(now, getBuildAnimationTimeScale(), holdBatchStart, holdReleaseAt)
    advanceBuildAnimations(now)
  })

  return (
    <>
      <TileGpuStreamMount mountId={streamMountId} />
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
            bakedFloorLightField={bakedFloorLightField}
            blockedFloorCellKeys={blockedFloorCellKeys}
            visibility={visibility}
            enableBuildAnimation={enableBuildAnimation}
            buildAnimationVersion={buildAnimationVersion}
            enableFloorReceiver={enableFloorReceiver}
            floorReceiverActive={floorReceiverActive}
            showProjectionDebugMesh={showProjectionDebugMesh}
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
  bakedFloorLightField,
  blockedFloorCellKeys,
  visibility,
  enableBuildAnimation,
  buildAnimationVersion,
  enableFloorReceiver,
  floorReceiverActive,
  showProjectionDebugMesh,
}: {
  chunkKey: string
  bundle: FloorRenderChunkBundle
  floorId: string
  mountId: string
  streamScopeKey: string
  bakedFloorLightField: BakedFloorLightField
  blockedFloorCellKeys: Set<string>
  visibility: PlayVisibility
  enableBuildAnimation: boolean
  buildAnimationVersion: number
  enableFloorReceiver: boolean
  floorReceiverActive: boolean
  showProjectionDebugMesh: boolean
}) {
  const isBuildAnimationCurrentlyActive = useIsBuildAnimationActive(buildAnimationVersion)
  const useLineOfSightPostMask = visibility.active
  const staticWallEntries = useMemo<StaticTileEntry[]>(
    () => bundle.walls.flatMap((wall) => {
      const floorKey = getBuildAnimationCellKeyFromWallKeys(wall.segmentKeys, isBuildAnimationCurrentlyActive) ?? wall.key
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
    [bakedFloorLightField, bundle.walls, enableBuildAnimation, isBuildAnimationCurrentlyActive, visibility],
  )
  const staticInteractiveWalls = useMemo(
    () => bundle.walls.filter((wall) => {
      const floorKey = getBuildAnimationCellKeyFromWallKeys(wall.segmentKeys, isBuildAnimationCurrentlyActive) ?? wall.key
      return !(enableBuildAnimation && isBuildAnimationCurrentlyActive(floorKey)) && isInteractiveWallAsset(wall.assetId)
    }),
    [bundle.walls, enableBuildAnimation, isBuildAnimationCurrentlyActive],
  )
  const animatedInteractiveWalls = useMemo(
    () => bundle.walls.filter((wall) => {
      const floorKey = getBuildAnimationCellKeyFromWallKeys(wall.segmentKeys, isBuildAnimationCurrentlyActive) ?? wall.key
      return enableBuildAnimation && isBuildAnimationCurrentlyActive(floorKey) && isInteractiveWallAsset(wall.assetId)
    }),
    [bundle.walls, enableBuildAnimation, isBuildAnimationCurrentlyActive],
  )
  const staticCornerEntries = useMemo<StaticTileEntry[]>(
    () => bundle.corners.map((corner) => {
      const cellKey = getBuildAnimationCellKeyFromWallKeys(corner.wallKeys, isBuildAnimationCurrentlyActive) ?? corner.key
      const buildAnimation = enableBuildAnimation
        ? getBuildAnimationState(cellKey, WALL_EXTRA_DELAY_MS)
        : null

      return {
        key: corner.key,
        assetId: corner.assetId,
        position: corner.position,
        rotation: corner.rotation,
        buildAnimationDelay: buildAnimation?.delay,
        buildAnimationStart: buildAnimation?.startedAt,
        variant: 'wall',
        variantKey: corner.key,
        visibility: getWallSpanVisibilityState(visibility, corner.wallKeys),
        objectProps: corner.objectProps,
      }
    }),
    [bundle.corners, enableBuildAnimation, isBuildAnimationCurrentlyActive, visibility],
  )

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
        const floorKey = getBuildAnimationCellKeyFromWallKeys(wall.segmentKeys, isBuildAnimationCurrentlyActive) ?? wall.key
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
}: {
  group: FloorRenderGroup
  floorId: string
  mountId: string
  bakedFloorLightField: BakedFloorLightField
  blockedFloorCellKeys: Set<string>
  visibility: PlayVisibility
  enableBuildAnimation: boolean
  buildAnimationVersion: number
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
          rotation: ZERO_ROTATION,
          buildAnimationDelay: buildAnimation?.delay,
          buildAnimationStart: buildAnimation?.startedAt,
          variant: 'floor',
          variantKey: key,
          visibility: 'visible',
          bakedLightField: bakedFloorLightField,
        fogCell: cell,
      }]
      }),
    [bakedFloorLightField, blockedFloorCellKeys, buildAnimationVersion, enableBuildAnimation, group.cells, group.floorAssetId],
  )

  return (
    <BatchedTileEntries
      entries={staticEntries}
      floorId={floorId}
      mountId={mountId}
      sourceId={`floor-group:${floorId}:${group.groupKey}`}
      useLineOfSightPostMask={useLineOfSightPostMask}
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
  const asset = getContentPackAssetById(wall.assetId ?? '')
  const wallVisibility = getWallSpanVisibilityState(visibility, wall.segmentKeys)
  const wallSelectionKey = wall.segmentKeys[0] ?? wall.key
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

    const wallKey = wall.segmentKeys[0]
    if (!wallKey) {
      return
    }

    const nextProps = asset?.getPlayModeNextProps?.(wall.objectProps ?? {}) ?? null
    if (!nextProps) {
      return
    }

    event.stopPropagation()
    setWallSurfaceProps(wallKey, nextProps)
  }

  function handlePointerDown(event: ThreeEvent<PointerEvent>) {
    if (tool !== 'select') {
      return
    }

    event.stopPropagation()
    selectObject(wallSelectionKey)
  }

  return (
    <group ref={groupRef}>
      <ContentPackInstance
        assetId={wall.assetId}
        position={wall.position}
        rotation={wall.rotation}
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
  bakedLightField,
  paintedCells,
  visibility,
  enableBuildAnimation,
}: {
  opening: OpeningRecord
  bakedLightField: BakedFloorLightField
  paintedCells: PaintedCells
  visibility: PlayVisibility
  enableBuildAnimation: boolean
}) {
  const selection = useDungeonStore((state) => state.selection)
  const selectObject = useDungeonStore((state) => state.selectObject)
  const selected = selection === opening.id
  const useLineOfSightPostMask = visibility.active
  const buildAnimationVersion = useBuildAnimationVersion()
  const isBuildAnimationCurrentlyActive = useIsBuildAnimationActive(buildAnimationVersion)
  const openingSegmentKeys = getOpeningSegments(opening.wallKey, opening.width)
  const wallVisibility = getWallSpanVisibilityState(visibility, openingSegmentKeys)
  const interiorDirections = getWallSpanInteriorLightDirections(openingSegmentKeys, paintedCells)
  const openingAnimationCellKey = opening.wallKey.split(':').slice(0, 2).join(':')
  const clipBelowGround = enableBuildAnimation && isBuildAnimationCurrentlyActive(openingAnimationCellKey)

  const groupRef = useRef<THREE.Group>(null)
  useLayoutEffect(() => {
    if (groupRef.current) registerObject(opening.id, groupRef.current)
    return () => unregisterObject(opening.id)
  }, [opening.id])

  const tool = useDungeonStore((state) => state.tool)

  const wallPosition = getWallSpanWorldTransform(openingSegmentKeys)
  if (!wallPosition) return null

  // Apply 180° flip when requested (front/back swap)
  const rotation: [number, number, number] = opening.flipped
    ? [wallPosition.rotation[0], wallPosition.rotation[1] + Math.PI, wallPosition.rotation[2]]
    : wallPosition.rotation

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (tool === 'select') return
    if (!e.altKey) return
    e.stopPropagation()
    selectObject(opening.id)
  }

  return (
    <AnimatedTileGroup
      cellKey={openingAnimationCellKey}
      enabled={enableBuildAnimation}
    >
      <group ref={groupRef} position={wallPosition.position} rotation={rotation}>
        <mesh onClick={handleClick}>
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
        />
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

export function getOpeningHitboxSize(width: number): [number, number, number] {
  return [width * GRID_SIZE * 0.95, 2.2, 0.1]
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

function getWallSpanWorldTransform(
  wallKeys: string[],
): { position: [number, number, number]; rotation: [number, number, number] } | null {
  if (wallKeys.length === 0) {
    return null
  }

  const transforms = wallKeys
    .map((wallKey) => wallKeyToWorldPosition(wallKey))
    .filter((transform): transform is NonNullable<ReturnType<typeof wallKeyToWorldPosition>> => Boolean(transform))

  if (transforms.length === 0) {
    return null
  }

  const position = transforms.reduce<[number, number, number]>(
    (accumulator, transform) => [
      accumulator[0] + transform.position[0],
      accumulator[1] + transform.position[1],
      accumulator[2] + transform.position[2],
    ],
    [0, 0, 0],
  )

  return {
    position: [
      position[0] / transforms.length,
      position[1] / transforms.length,
      position[2] / transforms.length,
    ],
    rotation: transforms[0].rotation,
  }
}
