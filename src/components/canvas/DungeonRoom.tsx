import { useRef, useMemo, useLayoutEffect } from 'react'
import type { ReactNode } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import {
  GRID_SIZE,
  cellToWorldPosition,
  getCellKey,
  type GridCell,
} from '../../hooks/useSnapToGrid'
import { getContentPackAssetById } from '../../content-packs/registry'
import {
  useDungeonStore,
  type DungeonObjectRecord,
  type Layer,
  type OpeningRecord,
  type PaintedCells,
  type Room,
} from '../../store/useDungeonStore'
import { getOpeningSegments } from '../../store/openingSegments'
import { getBuildYOffset, isAnimationActive } from '../../store/buildAnimations'
import {
  collectBoundaryWallSegments,
  getInheritedWallAssetIdForWallKey,
  getOppositeDirection,
  wallKeyToWorldPosition,
  type BoundaryWallSegment,
} from '../../store/wallSegments'
import { isDownStairAssetId } from '../../store/stairAssets'
import { ContentPackInstance } from './ContentPackInstance'
import { BatchedTileEntries, type StaticTileEntry } from './BatchedTileEntries'
import { buildMergedFloorReceiverGeometry } from './floorReceiverGeometry'
import { registerDecalReceivers, unregisterDecalReceivers } from './decalReceiverRegistry'
import { registerObject, unregisterObject } from './objectRegistry'
import type { PlayVisibility, PlayVisibilityState } from './playVisibility'
import { deriveWallCornersFromSegments, type WallCornerInstance } from './wallCornerLayout'
import { shouldActivateFloorReceiver } from './floorReceiverMode'
import type { ContentPackModelTransform } from '../../content-packs/types'
import { resolveProjectionReceiverAsset } from './tileAssetResolution'

const WALL_EXTRA_DELAY_MS = 70
const ZERO_ROTATION = [0, 0, 0] as const

type RoomWallInstance = {
  key: string
  assetId: string | null
  segmentKeys: string[]
  position: [number, number, number]
  rotation: [number, number, number]
  objectProps?: Record<string, unknown>
}

type RoomCornerRenderInstance = WallCornerInstance & {
  assetId: string | null
}

type FloorGroup = {
  floorAssetId: string | null
  cells: GridCell[]
}

type FloorReceiverCellInput = {
  cell: GridCell
  cellKey: string
  assetId: string | null
}

type ResolvedFloorReceiverCellInput = FloorReceiverCellInput & {
  assetUrl: string
  receiverTransform?: ContentPackModelTransform
}

type BoundaryWallSegmentWithAsset = BoundaryWallSegment & {
  assetId: string | null
}

function isWallDirection(value: string): value is 'north' | 'south' | 'east' | 'west' {
  return value === 'north' || value === 'south' || value === 'east' || value === 'west'
}

export type DungeonRoomData = {
  paintedCells: PaintedCells
  layers: Record<string, Layer>
  rooms: Record<string, Room>
  wallOpenings: Record<string, OpeningRecord>
  placedObjects: Record<string, DungeonObjectRecord>
  floorTileAssetIds: Record<string, string>
  wallSurfaceAssetIds: Record<string, string>
  globalFloorAssetId: string | null
  globalWallAssetId: string | null
}

export function DungeonRoom({
  visibility,
  data,
  enableBuildAnimation = true,
}: {
  visibility: PlayVisibility
  data?: DungeonRoomData
  enableBuildAnimation?: boolean
}) {
  const livePaintedCells = useDungeonStore((state) => state.paintedCells)
  const liveLayers = useDungeonStore((state) => state.layers)
  const liveRooms = useDungeonStore((state) => state.rooms)
  const liveWallOpenings = useDungeonStore((state) => state.wallOpenings)
  const livePlacedObjects = useDungeonStore((state) => state.placedObjects)
  const liveFloorTileAssetIds = useDungeonStore((state) => state.floorTileAssetIds)
  const liveWallSurfaceAssetIds = useDungeonStore((state) => state.wallSurfaceAssetIds)
  const liveGlobalFloorAssetId = useDungeonStore((state) => state.selectedAssetIds.floor)
  const liveGlobalWallAssetId = useDungeonStore((state) => state.selectedAssetIds.wall)
  const resolvedData = data ?? {
    paintedCells: livePaintedCells,
    layers: liveLayers,
    rooms: liveRooms,
    wallOpenings: liveWallOpenings,
    placedObjects: livePlacedObjects,
    floorTileAssetIds: liveFloorTileAssetIds,
    wallSurfaceAssetIds: liveWallSurfaceAssetIds,
    globalFloorAssetId: liveGlobalFloorAssetId,
    globalWallAssetId: liveGlobalWallAssetId,
  }
  const {
    paintedCells,
    layers,
    rooms,
    wallOpenings,
    placedObjects,
    floorTileAssetIds,
    wallSurfaceAssetIds,
    globalFloorAssetId,
    globalWallAssetId,
  } = resolvedData

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

  // Pre-compute which wall keys are suppressed by openings.
  // For each segment we add both the stored key AND its mirror (same physical wall
  // seen from the neighbouring cell), because inter-room walls are always rendered
  // by the canonical (lower-key) cell — which may be on the other side of the opening.
  const suppressedWallKeys = useMemo(() => {
    const set = new Set<string>()
    Object.values(wallOpenings).forEach((opening) => {
      getOpeningSegments(opening.wallKey, opening.width).forEach((segKey) => {
        set.add(segKey)
        const position = wallKeyToWorldPosition(segKey)
        const parts = segKey.split(':')
        const cx = Number.parseInt(parts[0] ?? '', 10)
        const cz = Number.parseInt(parts[1] ?? '', 10)
        const direction = parts[2]
        if (position && !Number.isNaN(cx) && !Number.isNaN(cz) && isWallDirection(direction)) {
          const opposite = getOppositeDirection(direction)
          const [dx, dz] =
            direction === 'north'
              ? [0, 1]
              : direction === 'south'
                ? [0, -1]
                : direction === 'east'
                  ? [1, 0]
                  : [-1, 0]
          set.add(`${cx + dx}:${cz + dz}:${opposite}`)
        }
      })
    })
    return set
  }, [wallOpenings])

  const visiblePaintedCells = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(paintedCells).filter(([, record]) => layers[record.layerId]?.visible !== false),
      ) as PaintedCells,
    [layers, paintedCells],
  )
  const floorGroups = useMemo<FloorGroup[]>(
    () => deriveFloorGroups(visiblePaintedCells, rooms, globalFloorAssetId, floorTileAssetIds),
    [floorTileAssetIds, globalFloorAssetId, rooms, visiblePaintedCells],
  )
  const visibleFloorReceiverCells = useMemo(
    () => deriveFloorReceiverCells(visiblePaintedCells, rooms, globalFloorAssetId, floorTileAssetIds),
    [floorTileAssetIds, globalFloorAssetId, rooms, visiblePaintedCells],
  )
  const walls = useMemo(
    () =>
      deriveWallInstances(
        visiblePaintedCells,
        rooms,
        globalWallAssetId,
        wallSurfaceAssetIds,
        suppressedWallKeys,
      ),
    [globalWallAssetId, rooms, suppressedWallKeys, visiblePaintedCells, wallSurfaceAssetIds],
  )
  const corners = useMemo(
    () =>
      deriveVisibleWallCorners(
        visiblePaintedCells,
        rooms,
        globalWallAssetId,
        wallSurfaceAssetIds,
        suppressedWallKeys,
      ),
    [globalWallAssetId, rooms, suppressedWallKeys, visiblePaintedCells, wallSurfaceAssetIds],
  )
  const useLineOfSightPostMask = visibility.active && visibility.mask !== null
  const staticWallEntries = useMemo<StaticTileEntry[]>(
    () => walls.flatMap((wall) => {
      const floorKey = wall.segmentKeys[0]?.split(':').slice(0, 2).join(':') ?? wall.key
      if (enableBuildAnimation && isAnimationActive(floorKey)) {
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
        objectProps: wall.objectProps,
      }]
    }),
    [enableBuildAnimation, visibility, walls],
  )
  const animatedWalls = useMemo(
    () => walls.filter((wall) => {
      const floorKey = wall.segmentKeys[0]?.split(':').slice(0, 2).join(':') ?? wall.key
      return enableBuildAnimation && isAnimationActive(floorKey)
    }),
    [enableBuildAnimation, walls],
  )
  const staticCornerEntries = useMemo<StaticTileEntry[]>(
    () => corners.flatMap((corner) => {
      const cellKey = corner.key.split(':').slice(0, 2).join(':')
      if (enableBuildAnimation && isAnimationActive(cellKey)) {
        return []
      }

      return [{
        key: corner.key,
        assetId: corner.assetId,
        position: corner.position,
        rotation: corner.rotation,
        variant: 'wall',
        variantKey: corner.key,
        visibility: getWallSpanVisibilityState(visibility, corner.wallKeys),
        objectProps: corner.objectProps,
      }]
    }),
    [corners, enableBuildAnimation, visibility],
  )
  const animatedCorners = useMemo(
    () => corners.filter((corner) => {
      const cellKey = corner.key.split(':').slice(0, 2).join(':')
      return enableBuildAnimation && isAnimationActive(cellKey)
    }),
    [corners, enableBuildAnimation],
  )

  return (
    <>
      {!data && (
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
            blockedFloorCellKeys={blockedFloorCellKeys}
            visibility={visibility}
            enableBuildAnimation={enableBuildAnimation}
          />
        ))}
      <BatchedTileEntries
        entries={staticWallEntries}
        useLineOfSightPostMask={useLineOfSightPostMask}
      />
      {animatedWalls.map((wall) => {
        const floorKey = wall.segmentKeys[0]?.split(':').slice(0, 2).join(':') ?? wall.key
        return (
          <AnimatedTileGroup
            key={wall.key}
            cellKey={floorKey}
            extraDelay={WALL_EXTRA_DELAY_MS}
            enabled={enableBuildAnimation}
          >
            <ContentPackInstance
              assetId={wall.assetId}
              position={wall.position}
              rotation={wall.rotation}
              variant="wall"
              variantKey={wall.key}
              visibility={getWallSpanVisibilityState(visibility, wall.segmentKeys)}
              useLineOfSightPostMask={useLineOfSightPostMask}
              objectProps={wall.objectProps}
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
            objectProps={corner.objectProps}
          />
        </AnimatedTileGroup>
      ))}
      {Object.values(wallOpenings).map((opening) => (
        <OpeningRenderer
          key={opening.id}
          opening={opening}
          visibility={visibility}
          enableBuildAnimation={enableBuildAnimation}
          layerVisible={layers[opening.layerId]?.visible !== false}
        />
      ))}
    </>
  )
}

function CellGroupRenderer({
  group,
  blockedFloorCellKeys,
  visibility,
  enableBuildAnimation,
}: {
  group: FloorGroup
  blockedFloorCellKeys: Set<string>
  visibility: PlayVisibility
  enableBuildAnimation: boolean
}) {
  const useLineOfSightPostMask = visibility.active && visibility.mask !== null
  const staticEntries = useMemo<StaticTileEntry[]>(
    () => group.cells.flatMap((cell) => {
      const key = getCellKey(cell)
      if (blockedFloorCellKeys.has(key) || (enableBuildAnimation && isAnimationActive(key))) {
        return []
      }

      return [{
        key: `floor:${key}`,
        assetId: group.floorAssetId,
        position: cellToWorldPosition(cell),
        rotation: ZERO_ROTATION,
        variant: 'floor',
        variantKey: key,
        visibility: visibility.getCellVisibility(key),
      }]
    }),
    [blockedFloorCellKeys, enableBuildAnimation, group.cells, group.floorAssetId, visibility],
  )
  const animatedCells = useMemo(
    () => group.cells.filter((cell) => {
      const key = getCellKey(cell)
      return !blockedFloorCellKeys.has(key) && enableBuildAnimation && isAnimationActive(key)
    }),
    [blockedFloorCellKeys, enableBuildAnimation, group.cells],
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
              visibility={visibility.getCellVisibility(key)}
              useLineOfSightPostMask={useLineOfSightPostMask}
            />
          </AnimatedTileGroup>
        )
      })}
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
        receiverTransform: resolved.transform,
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

function deriveFloorReceiverCells(
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalFloorAssetId: string | null,
  floorTileAssetIds: Record<string, string>,
): FloorReceiverCellInput[] {
  return Object.entries(paintedCells).map(([cellKey, record]) => {
    const room = record.roomId ? rooms[record.roomId] : null
    return {
      cell: record.cell,
      cellKey,
      assetId: floorTileAssetIds[cellKey] ?? room?.floorAssetId ?? globalFloorAssetId,
    }
  })
}

/**
 * Wraps a tile in a group whose Y position is driven each frame by the build
 * animation registry. When there is no active animation the group stays at Y=0
 * with negligible overhead (one Map lookup per frame).
 */
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

function deriveFloorGroups(
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalFloorAssetId: string | null,
  floorTileAssetIds: Record<string, string>,
): FloorGroup[] {
  const groups = new Map<string, FloorGroup>()

  Object.entries(paintedCells).forEach(([cellKey, record]) => {
    const room = record.roomId ? rooms[record.roomId] : null
    const floorAssetId = floorTileAssetIds[cellKey] ?? room?.floorAssetId ?? globalFloorAssetId
    const groupKey = floorAssetId ?? 'none'
    if (!groups.has(groupKey)) {
      groups.set(groupKey, {
        floorAssetId,
        cells: [],
      })
    }
    groups.get(groupKey)!.cells.push(record.cell)
  })

  return Array.from(groups.values())
}

function deriveWallInstances(
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalWallAssetId: string | null,
  wallSurfaceAssetIds: Record<string, string>,
  suppressedWallKeys: Set<string>,
): RoomWallInstance[] {
  const wallSegments = collectBoundaryWallSegments(paintedCells, { suppressedWallKeys }).map((segment) => ({
    ...segment,
    assetId:
      wallSurfaceAssetIds[segment.key] ??
      getInheritedWallAssetIdForWallKey(segment.key, paintedCells, rooms, globalWallAssetId),
  }))

  const groups = new Map<string, BoundaryWallSegmentWithAsset[]>()
  wallSegments.forEach((segment) => {
    const [xPart, zPart] = segment.key.split(':')
    const lineKey =
      segment.direction === 'north' || segment.direction === 'south'
        ? `${segment.direction}:${zPart}`
        : `${segment.direction}:${xPart}`
    const groupKey = `${segment.assetId ?? 'none'}|${lineKey}`
    if (!groups.has(groupKey)) {
      groups.set(groupKey, [])
    }
    groups.get(groupKey)!.push(segment)
  })

  const walls: RoomWallInstance[] = []
  groups.forEach((segments) => {
    const sorted = [...segments].sort((left, right) => left.index - right.index)
    let runStart = 0

    while (runStart < sorted.length) {
      let runEnd = runStart + 1
      while (runEnd < sorted.length && sorted[runEnd].index === sorted[runEnd - 1].index + 1) {
        runEnd += 1
      }

      const run = sorted.slice(runStart, runEnd)
      const wallSpan = getContentPackAssetById(run[0]?.assetId ?? '')?.metadata?.wallSpan ?? 1
      let offset = 0

      while (offset < run.length) {
        const remaining = run.length - offset
        const span = remaining >= wallSpan ? wallSpan : 1
        const segmentKeys = run.slice(offset, offset + span).map((segment) => segment.key)
        const transform = getWallSpanWorldTransform(segmentKeys)
        if (transform) {
          walls.push({
            key: segmentKeys.join('|'),
            assetId: run[offset]?.assetId ?? null,
            segmentKeys,
            position: transform.position,
            rotation: transform.rotation,
            ...(wallSpan > 1 ? { objectProps: { span } } : {}),
          })
        }

        offset += span
      }

      runStart = runEnd
    }
  })

  return walls
}

function deriveVisibleWallCorners(
  paintedCells: PaintedCells,
  rooms: Record<string, Room>,
  globalWallAssetId: string | null,
  wallSurfaceAssetIds: Record<string, string>,
  suppressedWallKeys: Set<string>,
): RoomCornerRenderInstance[] {
  const wallSegments = collectBoundaryWallSegments(paintedCells, { suppressedWallKeys }).map((segment) => ({
    ...segment,
    assetId:
      wallSurfaceAssetIds[segment.key] ??
      getInheritedWallAssetIdForWallKey(segment.key, paintedCells, rooms, globalWallAssetId),
  }))
  const wallAssetIdsByKey = new Map(wallSegments.map((segment) => [segment.key, segment.assetId]))

  return deriveWallCornersFromSegments(wallSegments)
    .flatMap<RoomCornerRenderInstance>((corner) => {
      const assetId =
        corner.wallKeys
          .map((wallKey) => wallAssetIdsByKey.get(wallKey) ?? null)
          .find((candidate) => getContentPackAssetById(candidate ?? '')?.metadata?.wallCornerType === 'solitary') ??
        null

      return assetId ? [{ ...corner, assetId }] : []
    })
}

function OpeningRenderer({
  opening,
  visibility,
  enableBuildAnimation,
  layerVisible,
}: {
  opening: OpeningRecord
  visibility: PlayVisibility
  enableBuildAnimation: boolean
  layerVisible: boolean
}) {
  const selection = useDungeonStore((state) => state.selection)
  const selectObject = useDungeonStore((state) => state.selectObject)
  const ppEnabled = useDungeonStore((state) => state.postProcessing.enabled)
  const selected = selection === opening.id
  const useLineOfSightPostMask = visibility.active && visibility.mask !== null
  const openingSegmentKeys = getOpeningSegments(opening.wallKey, opening.width)
  const wallVisibility = getWallSpanVisibilityState(visibility, openingSegmentKeys)

  const groupRef = useRef<THREE.Group>(null)
  useLayoutEffect(() => {
    if (groupRef.current) registerObject(opening.id, groupRef.current)
    return () => unregisterObject(opening.id)
  }, [opening.id])

  const tool = useDungeonStore((state) => state.tool)

  if (!layerVisible) return null

  const wallPosition = getWallSpanWorldTransform(openingSegmentKeys)
  if (!wallPosition) return null

  // Apply 180° flip when requested (front/back swap)
  const rotation: [number, number, number] = opening.flipped
    ? [wallPosition.rotation[0], wallPosition.rotation[1] + Math.PI, wallPosition.rotation[2]]
    : wallPosition.rotation

  function handleClick(e: ThreeEvent<MouseEvent>) {
    if (tool === 'select') {
      e.stopPropagation()
      selectObject(opening.id)
      return
    }
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
      {opening.assetId ? (
        <ContentPackInstance
          assetId={opening.assetId}
          selected={selected && !ppEnabled}
          variant="wall"
          visibility={wallVisibility}
          useLineOfSightPostMask={useLineOfSightPostMask}
          onClick={handleClick}
        />
      ) : (
        <>
          <mesh onClick={handleClick}>
            <boxGeometry args={[opening.width * GRID_SIZE * 0.95, 2.2, 0.1]} />
            <meshBasicMaterial
              transparent
              opacity={0}
              colorWrite={false}
              depthWrite={false}
              depthTest={false}
            />
          </mesh>
          {selected && (
            <mesh>
              <boxGeometry args={[opening.width * GRID_SIZE * 0.95, 2.2, 0.1]} />
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
