import { useCallback, useRef, useMemo, useLayoutEffect } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import {
  GRID_SIZE,
  cellToWorldPosition,
  getCellKey,
} from '../../hooks/useSnapToGrid'
import { getContentPackAssetById } from '../../content-packs/registry'
import {
  useDungeonStore,
  type OpeningRecord,
  type PaintedCells,
} from '../../store/useDungeonStore'
import { getOpeningSegments } from '../../store/openingSegments'
import { getBuildYOffset, isAnimationActive, useBuildAnimationVersion } from '../../store/buildAnimations'
import type { FloorRenderGroup, FloorSurfacePlacement } from '../../store/floorSurfaceLayout'
import { wallKeyToWorldPosition } from '../../store/wallSegments'
import {
  buildFloorDerivedBundle,
  type FloorDerivedBundle,
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
import { getCornerInteriorLightDirections, getWallSpanInteriorLightDirections } from './wallLighting'
import {
  buildFloorRenderDerivedBundle,
  type FloorReceiverCellInput,
  type RoomWallInstance,
} from './floorRenderDerived'
import {
  getBakedLightSampleForCell,
  getOrBuildBakedFloorLightField,
  type BakedFloorLightField,
} from '../../rendering/dungeonLightField'

const WALL_EXTRA_DELAY_MS = 70
const ZERO_ROTATION = [0, 0, 0] as const

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
}: {
  visibility: PlayVisibility
  derived?: FloorDerivedBundle
  bakedLightField?: BakedFloorLightField | null
  enableBuildAnimation?: boolean
  enableFloorReceiver?: boolean
}) {
  const livePaintedCells = useDungeonStore((state) => state.paintedCells)
  const liveActiveFloorId = useDungeonStore((state) => state.activeFloorId)
  const liveLayers = useDungeonStore((state) => state.layers)
  const liveRooms = useDungeonStore((state) => state.rooms)
  const liveWallOpenings = useDungeonStore((state) => state.wallOpenings)
  const liveInnerWalls = useDungeonStore((state) => state.innerWalls)
  const livePlacedObjects = useDungeonStore((state) => state.placedObjects)
  const liveFloorTileAssetIds = useDungeonStore((state) => state.floorTileAssetIds)
  const liveWallSurfaceAssetIds = useDungeonStore((state) => state.wallSurfaceAssetIds)
  const liveWallSurfaceProps = useDungeonStore((state) => state.wallSurfaceProps)
  const liveGlobalFloorAssetId = useDungeonStore((state) => state.selectedAssetIds.floor)
  const liveGlobalWallAssetId = useDungeonStore((state) => state.selectedAssetIds.wall)
  const buildAnimationVersion = useBuildAnimationVersion()
  const isBuildAnimationCurrentlyActive = useIsBuildAnimationActive(buildAnimationVersion)
  const liveDerived = useMemo(
    () => buildFloorDerivedBundle({
      floorId: liveActiveFloorId,
      paintedCells: livePaintedCells,
      layers: liveLayers,
      rooms: liveRooms,
      wallOpenings: liveWallOpenings,
      innerWalls: liveInnerWalls,
      placedObjects: livePlacedObjects,
      floorTileAssetIds: liveFloorTileAssetIds,
      wallSurfaceAssetIds: liveWallSurfaceAssetIds,
      wallSurfaceProps: liveWallSurfaceProps,
      globalFloorAssetId: liveGlobalFloorAssetId,
      globalWallAssetId: liveGlobalWallAssetId,
    }),
    [
      liveActiveFloorId,
      liveGlobalFloorAssetId,
      liveGlobalWallAssetId,
      liveFloorTileAssetIds,
      liveInnerWalls,
      liveLayers,
      livePaintedCells,
      livePlacedObjects,
      liveRooms,
      liveWallOpenings,
      liveWallSurfaceAssetIds,
      liveWallSurfaceProps,
    ],
  )
  const resolvedDerived = derived ?? liveDerived
  const { placedObjects } = resolvedDerived.data

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

    return getOrBuildBakedFloorLightField(resolvedDerived.bakedLightBuildInput)
  }, [bakedLightField, resolvedDerived])
  const floorRenderDerived = useMemo(
    () => buildFloorRenderDerivedBundle(resolvedDerived),
    [resolvedDerived],
  )
  const {
    floorGroups,
    floorSurfaceEntries,
    visibleFloorReceiverCells,
    walls,
    corners,
  } = floorRenderDerived
  const useLineOfSightPostMask = visibility.active
  const staticWallEntries = useMemo<StaticTileEntry[]>(
    () => walls.flatMap((wall) => {
      const floorKey = wall.segmentKeys[0]?.split(':').slice(0, 2).join(':') ?? wall.key
      if ((enableBuildAnimation && isBuildAnimationCurrentlyActive(floorKey)) || isInteractiveWallAsset(wall.assetId)) {
        return []
      }

        return [{
          key: wall.key,
          assetId: wall.assetId,
          position: wall.position,
          rotation: wall.rotation,
          variant: 'wall',
          variantKey: wall.key,
          visibility: getWallSpanVisibilityState(visibility, wall.segmentKeys),
          bakedLightField: bakedFloorLightField,
          bakedLight: getBakedLightSampleForCell(bakedFloorLightField, floorKey),
          bakedLightDirection: wall.bakedLightDirection,
          bakedLightDirectionSecondary: wall.bakedLightDirectionSecondary,
        objectProps: wall.objectProps,
      }]
    }),
    [bakedFloorLightField, enableBuildAnimation, isBuildAnimationCurrentlyActive, visibility, walls],
  )
  const staticInteractiveWalls = useMemo(
    () => walls.filter((wall) => {
      const floorKey = wall.segmentKeys[0]?.split(':').slice(0, 2).join(':') ?? wall.key
      return !(enableBuildAnimation && isBuildAnimationCurrentlyActive(floorKey)) && isInteractiveWallAsset(wall.assetId)
    }),
    [enableBuildAnimation, isBuildAnimationCurrentlyActive, walls],
  )
  const animatedWalls = useMemo(
    () => walls.filter((wall) => {
      const floorKey = wall.segmentKeys[0]?.split(':').slice(0, 2).join(':') ?? wall.key
      return enableBuildAnimation && isBuildAnimationCurrentlyActive(floorKey)
    }),
    [enableBuildAnimation, isBuildAnimationCurrentlyActive, walls],
  )
  const staticCornerEntries = useMemo<StaticTileEntry[]>(
    () => corners.flatMap((corner) => {
      const cellKey = corner.key.split(':').slice(0, 2).join(':')
      if (enableBuildAnimation && isBuildAnimationCurrentlyActive(cellKey)) {
        return []
      }

      const interiorDirections = getCornerInteriorLightDirections(corner.wallKeys)

      return [{
        key: corner.key,
        assetId: corner.assetId,
        position: corner.position,
        rotation: corner.rotation,
        variant: 'wall',
        variantKey: corner.key,
        visibility: getWallSpanVisibilityState(visibility, corner.wallKeys),
        bakedLightField: bakedFloorLightField,
        bakedLightDirection: interiorDirections.primary,
        bakedLightDirectionSecondary: interiorDirections.secondary,
        objectProps: corner.objectProps,
      }]
    }),
    [bakedFloorLightField, corners, enableBuildAnimation, isBuildAnimationCurrentlyActive, visibility],
  )
  const animatedCorners = useMemo(
    () => corners.filter((corner) => {
      const cellKey = corner.key.split(':').slice(0, 2).join(':')
      return enableBuildAnimation && isBuildAnimationCurrentlyActive(cellKey)
    }),
    [corners, enableBuildAnimation, isBuildAnimationCurrentlyActive],
  )

  return (
    <>
      {enableFloorReceiver && (
        <FloorDecalReceiver
          receiverId="floor-receiver:active"
          cells={visibleFloorReceiverCells}
          blockedFloorCellKeys={blockedFloorCellKeys}
        />
      )}
      {floorGroups.map((group) => (
          <CellGroupRenderer
            key={group.floorAssetId ?? 'none'}
            group={group}
            bakedFloorLightField={bakedFloorLightField}
            blockedFloorCellKeys={blockedFloorCellKeys}
            visibility={visibility}
            enableBuildAnimation={enableBuildAnimation}
            buildAnimationVersion={buildAnimationVersion}
          />
        ))}
      <FloorSurfaceRenderer
        placements={floorSurfaceEntries}
        bakedFloorLightField={bakedFloorLightField}
        blockedFloorCellKeys={blockedFloorCellKeys}
        visibility={visibility}
        enableBuildAnimation={enableBuildAnimation}
        buildAnimationVersion={buildAnimationVersion}
      />
      <BatchedTileEntries
        entries={staticWallEntries}
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
      {animatedWalls.map((wall) => {
        const floorKey = wall.segmentKeys[0]?.split(':').slice(0, 2).join(':') ?? wall.key
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
            />
          </AnimatedTileGroup>
        )
      })}
      <BatchedTileEntries
        entries={staticCornerEntries}
        useLineOfSightPostMask={useLineOfSightPostMask}
      />
      {animatedCorners.map((corner) => (
        <AnimatedTileGroup
          key={corner.key}
          cellKey={corner.key.split(':').slice(0, 2).join(':')}
          extraDelay={WALL_EXTRA_DELAY_MS}
          enabled={enableBuildAnimation}
        >
          <ContentPackInstance
            assetId={corner.assetId}
            position={corner.position}
            rotation={corner.rotation}
            variant="wall"
            variantKey={corner.key}
            visibility={getWallSpanVisibilityState(visibility, corner.wallKeys)}
            useLineOfSightPostMask={useLineOfSightPostMask}
            bakedLightField={bakedFloorLightField}
            bakedLightDirection={getCornerInteriorLightDirections(corner.wallKeys).primary}
            bakedLightDirectionSecondary={getCornerInteriorLightDirections(corner.wallKeys).secondary}
            objectProps={corner.objectProps}
          />
        </AnimatedTileGroup>
      ))}
      {resolvedDerived.visibleOpenings.map((opening) => (
        <OpeningRenderer
          key={opening.id}
          opening={opening}
          bakedLightField={bakedFloorLightField}
          paintedCells={resolvedDerived.visiblePaintedCellRecords}
          visibility={visibility}
          enableBuildAnimation={enableBuildAnimation}
        />
      ))}
    </>
  )
}

function CellGroupRenderer({
  group,
  bakedFloorLightField,
  blockedFloorCellKeys,
  visibility,
  enableBuildAnimation,
  buildAnimationVersion,
}: {
  group: FloorRenderGroup
  bakedFloorLightField: BakedFloorLightField
  blockedFloorCellKeys: Set<string>
  visibility: PlayVisibility
  enableBuildAnimation: boolean
  buildAnimationVersion: number
}) {
  const useLineOfSightPostMask = visibility.active
  const isBuildAnimationCurrentlyActive = useIsBuildAnimationActive(buildAnimationVersion)
  const staticEntries = useMemo<StaticTileEntry[]>(
    () => group.cells.flatMap((cell) => {
      const key = getCellKey(cell)
      if (blockedFloorCellKeys.has(key) || (enableBuildAnimation && isBuildAnimationCurrentlyActive(key))) {
        return []
      }

        return [{
          key: `floor:${key}`,
          assetId: group.floorAssetId,
          position: cellToWorldPosition(cell),
          rotation: ZERO_ROTATION,
          variant: 'floor',
          variantKey: key,
          visibility: 'visible',
          bakedLightField: bakedFloorLightField,
          bakedLight: getBakedLightSampleForCell(bakedFloorLightField, key),
        fogCell: cell,
      }]
      }),
    [bakedFloorLightField, blockedFloorCellKeys, enableBuildAnimation, group.cells, group.floorAssetId, isBuildAnimationCurrentlyActive],
  )
  const animatedCells = useMemo(
    () => group.cells.filter((cell) => {
      const key = getCellKey(cell)
      return !blockedFloorCellKeys.has(key) && enableBuildAnimation && isBuildAnimationCurrentlyActive(key)
    }),
    [blockedFloorCellKeys, enableBuildAnimation, group.cells, isBuildAnimationCurrentlyActive],
  )

  return (
    <>
      <BatchedTileEntries
        entries={staticEntries}
        useLineOfSightPostMask={useLineOfSightPostMask}
      />
      {animatedCells.map((cell) => {
        const key = getCellKey(cell)
        return (
          <AnimatedTileGroup key={`floor:${key}`} cellKey={key} enabled={enableBuildAnimation}>
            <ContentPackInstance
              assetId={group.floorAssetId}
              position={cellToWorldPosition(cell)}
              variant="floor"
              variantKey={key}
              visibility="visible"
              useLineOfSightPostMask={useLineOfSightPostMask}
              bakedLightField={bakedFloorLightField}
            />
          </AnimatedTileGroup>
        )
      })}
    </>
  )
}

function FloorSurfaceRenderer({
  placements,
  bakedFloorLightField,
  blockedFloorCellKeys,
  visibility,
  enableBuildAnimation,
  buildAnimationVersion,
}: {
  placements: FloorSurfacePlacement[]
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
        || placement.coveredCellKeys.some((cellKey) => enableBuildAnimation && isBuildAnimationCurrentlyActive(cellKey))
      if (shouldSkip) {
        return []
      }

      return [{
        key: `floor-surface:${placement.anchorCellKey}`,
        assetId: placement.assetId,
        position: placement.position,
        rotation: ZERO_ROTATION,
        variant: 'floor',
        variantKey: placement.anchorCellKey,
        visibility: 'visible',
        bakedLightField: bakedFloorLightField,
        bakedLight: getBakedLightSampleForCell(bakedFloorLightField, placement.anchorCellKey),
        fogCell: placement.anchorCell,
      }]
    }),
    [bakedFloorLightField, blockedFloorCellKeys, enableBuildAnimation, isBuildAnimationCurrentlyActive, placements],
  )
  const animatedPlacements = useMemo(
    () => placements.filter((placement) =>
      !placement.coveredCellKeys.some((cellKey) => blockedFloorCellKeys.has(cellKey))
      && placement.coveredCellKeys.some((cellKey) => enableBuildAnimation && isBuildAnimationCurrentlyActive(cellKey))),
    [blockedFloorCellKeys, enableBuildAnimation, isBuildAnimationCurrentlyActive, placements],
  )

  return (
    <>
      <BatchedTileEntries
        entries={staticEntries}
        useLineOfSightPostMask={useLineOfSightPostMask}
      />
      {animatedPlacements.map((placement) => (
        <AnimatedTileGroup
          key={`floor-surface:${placement.anchorCellKey}`}
          cellKey={placement.anchorCellKey}
          enabled={enableBuildAnimation}
        >
          <ContentPackInstance
            assetId={placement.assetId}
            position={placement.position}
            variant="floor"
            variantKey={placement.anchorCellKey}
            visibility="visible"
            useLineOfSightPostMask={useLineOfSightPostMask}
            bakedLightField={bakedFloorLightField}
          />
        </AnimatedTileGroup>
      ))}
    </>
  )
}

function FloorDecalReceiver({
  receiverId,
  cells,
  blockedFloorCellKeys,
}: {
  receiverId: string
  cells: FloorReceiverCellInput[]
  blockedFloorCellKeys: Set<string>
}) {
  const tool = useDungeonStore((state) => state.tool)
  const showProjectionDebugMesh = useDungeonStore((state) => state.showProjectionDebugMesh)
  const receiverCells = useMemo(
    () => cells.flatMap((cell) => {
      const resolved = resolveProjectionReceiverAsset(cell.assetId, cell.cellKey)
      if (!resolved) {
        return []
      }

      return [{
        ...cell,
        assetUrl: resolved.assetUrl,
        receiverTransform: mergeFloorReceiverTransforms(resolved.transform, cell.receiverTransformOverride),
      }] satisfies ResolvedFloorReceiverCellInput[]
    }),
    [cells],
  )

  if (receiverCells.length === 0) {
    return null
  }

  if (!shouldActivateFloorReceiver(tool, showProjectionDebugMesh)) {
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
  // Once the animation registry entry is gone and y has settled to 0, stop running.
  const doneRef = useRef(!enabled)

  useLayoutEffect(() => {
    doneRef.current = !enabled
    if (!enabled && groupRef.current) {
      groupRef.current.position.y = 0
    }
  }, [enabled])

  useFrame(() => {
    if (doneRef.current || !enabled) return
    const group = groupRef.current
    if (!group) return
    const y = getBuildYOffset(cellKey, performance.now(), extraDelay)
    if (group.position.y !== y) group.position.y = y
    // Self-disable once the registry entry is cleaned up and position is at rest
    if (y === 0 && !isAnimationActive(cellKey)) doneRef.current = true
  })

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
}: {
  wall: RoomWallInstance
  bakedLightField: BakedFloorLightField
  visibility: PlayVisibility
  useLineOfSightPostMask: boolean
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
  const openingSegmentKeys = getOpeningSegments(opening.wallKey, opening.width)
  const wallVisibility = getWallSpanVisibilityState(visibility, openingSegmentKeys)
  const interiorDirections = getWallSpanInteriorLightDirections(openingSegmentKeys, paintedCells)

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
      cellKey={opening.wallKey.split(':').slice(0, 2).join(':')}
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
