import {
  getContentPackAssetById,
  getContentPackAssetsByCategory,
} from '../content-packs/registry'
import { getCellKey, type GridCell } from '../hooks/useSnapToGrid'
import { getOpeningSegments } from './openingSegments'
import { buildSplineWallOpeningPlacement } from './openingPlacement'
import { createSplineWallQueryCache } from './splineWallQueries'
import type { SplineWallGraph } from './splineWallGraph'
import { WALL_DIRECTIONS, wallKeyToWorldPosition } from './wallSegments'
import type { OpeningRecord, OpeningSource, PaintedCellRecord } from './useDungeonStore'

const GENERATED_SURFACE_DOOR_ASSET_ID = 'dungeon.wall_wall_doorway'
const GENERATED_SPLINE_DOOR_ASSET_ID = 'core.opening_door_custom'
const GENERATED_SURFACE_DOOR_MARKER = 'generatedConnector'

type SharedBoundaryUnit = {
  wallKey: string
  index: number
  roomIds: readonly [string, string]
  roomSides: readonly [RoomSideKey, RoomSideKey]
  layerId: string
}

type RoomSideKey = `${string}:${string}:${string}:${string}`

export type SharedBoundaryRun = {
  wallKeys: string[]
  roomIds: readonly [string, string]
  roomSideKeys: readonly [RoomSideKey, RoomSideKey]
  layerId: string
}

type GeneratedConnectorIntent = {
  opening: Omit<OpeningRecord, 'id'>
} | {
  surfaceDoor: {
    wallKey: string
    assetId: string
  }
}

export type ProceduralRoomLayoutInput = {
  paintedCells: Record<string, PaintedCellRecord>
  wallOpenings: Record<string, OpeningRecord>
  wallSurfaceAssetIds: Record<string, string>
  wallSurfaceProps: Record<string, Record<string, unknown>>
  graphBackedRoomIds?: ReadonlySet<string>
  splineWallGraph?: SplineWallGraph | null
  selection: string | null
  createOpeningId: () => string
}

export type ProceduralRoomLayoutResult = {
  wallOpenings: Record<string, OpeningRecord>
  wallSurfaceAssetIds: Record<string, string>
  wallSurfaceProps: Record<string, Record<string, unknown>>
  selection: string | null
}

export function buildSharedBoundaryRuns(
  paintedCells: Record<string, PaintedCellRecord>,
): SharedBoundaryRun[] {
  const groupedUnits = new Map<string, SharedBoundaryUnit[]>()

  for (const record of Object.values(paintedCells)) {
    const cell = record.cell
    const roomId = record.roomId
    const cellKey = getCellKey(cell)
    if (!roomId) {
      continue
    }

    for (const directionEntry of WALL_DIRECTIONS) {
      const neighbor: GridCell = [
        cell[0] + directionEntry.delta[0],
        cell[1] + directionEntry.delta[1],
      ]
      const neighborKey = getCellKey(neighbor)
      const neighborRecord = paintedCells[neighborKey]
      const neighborRoomId = neighborRecord?.roomId ?? null

      if (!neighborRecord || !neighborRoomId || roomId === neighborRoomId || cellKey > neighborKey) {
        continue
      }

      const roomIds = [roomId, neighborRoomId].sort() as [string, string]
      const axis = directionEntry.direction === 'north' || directionEntry.direction === 'south'
        ? 'x'
        : 'z'
      const line =
        directionEntry.direction === 'north'
          ? cell[1] + 1
          : directionEntry.direction === 'south'
            ? cell[1]
            : directionEntry.direction === 'east'
              ? cell[0] + 1
              : cell[0]
      const index = axis === 'x' ? cell[0] : cell[1]
      const groupKey = `${roomIds[0]}:${roomIds[1]}:${axis}:${line}:${record.layerId}`
      const wallKey = `${cellKey}:${directionEntry.direction}`
      const roomSides = [
        buildRoomSideKey(roomId, directionEntry.direction, line, record.layerId),
        buildRoomSideKey(neighborRoomId, getOppositeWallDirection(directionEntry.direction), line, record.layerId),
      ] as const
      const existing = groupedUnits.get(groupKey)

      if (existing) {
        existing.push({
          wallKey,
          index,
          roomIds,
          roomSides,
          layerId: record.layerId,
        })
      } else {
        groupedUnits.set(groupKey, [{
          wallKey,
          index,
          roomIds,
          roomSides,
          layerId: record.layerId,
        }])
      }
    }
  }

  const runs: SharedBoundaryRun[] = []
  for (const units of groupedUnits.values()) {
    const sortedUnits = [...units].sort((left, right) => left.index - right.index)
    let currentRun: SharedBoundaryUnit[] = []

    for (const unit of sortedUnits) {
      const previous = currentRun[currentRun.length - 1]
      if (!previous || unit.index === previous.index + 1) {
        currentRun.push(unit)
        continue
      }

      runs.push(makeSharedBoundaryRun(currentRun))
      currentRun = [unit]
    }

    if (currentRun.length > 0) {
      runs.push(makeSharedBoundaryRun(currentRun))
    }
  }

  return runs.sort((left, right) => {
    const leftRooms = left.roomIds.join(':')
    const rightRooms = right.roomIds.join(':')
    if (leftRooms !== rightRooms) {
      return leftRooms.localeCompare(rightRooms)
    }

    return (left.wallKeys[0] ?? '').localeCompare(right.wallKeys[0] ?? '')
  })
}

export function reconcileProceduralRoomLayout({
  paintedCells,
  wallOpenings,
  wallSurfaceAssetIds,
  wallSurfaceProps,
  graphBackedRoomIds = new Set(),
  splineWallGraph = { nodes: {}, segments: {}, paths: {} },
  selection,
  createOpeningId,
}: ProceduralRoomLayoutInput): ProceduralRoomLayoutResult {
  const resolvedSplineWallGraph = splineWallGraph ?? { nodes: {}, segments: {}, paths: {} }
  const manualOpenings = Object.values(wallOpenings).filter((opening) => opening.source !== 'generated')
  const generatedOpenings = Object.values(wallOpenings).filter((opening) => opening.source === 'generated')
  const wallOpeningsById: Record<string, OpeningRecord> = Object.fromEntries(
    manualOpenings.map((opening) => [opening.id, opening]),
  )
  const reusableGeneratedOpenings = new Map<string, OpeningRecord[]>()
  const connectorIntents = buildGeneratedConnectorIntents(
    paintedCells,
    manualOpenings,
    wallSurfaceAssetIds,
    wallSurfaceProps,
    graphBackedRoomIds,
    resolvedSplineWallGraph,
  )
  let nextSelection = selection

  generatedOpenings.forEach((opening) => {
    const signature = buildOpeningSignature(opening)
    const existing = reusableGeneratedOpenings.get(signature)
    if (existing) {
      existing.push(opening)
    } else {
      reusableGeneratedOpenings.set(signature, [opening])
    }
  })

  for (const intent of connectorIntents) {
    if ('opening' in intent) {
      const signature = buildOpeningSignature(intent.opening)
      const reusable = reusableGeneratedOpenings.get(signature)?.shift()

      if (reusable) {
        wallOpeningsById[reusable.id] = reusable
        continue
      }

      const id = createOpeningId()
      wallOpeningsById[id] = {
        ...intent.opening,
        id,
      }
    }
  }

  let nextWallSurfaceAssetIds = wallSurfaceAssetIds
  let nextWallSurfaceProps = wallSurfaceProps
  const intendedGeneratedSurfaceDoors = new Map<string, string>(
    connectorIntents
      .filter((intent): intent is Extract<GeneratedConnectorIntent, { surfaceDoor: { wallKey: string; assetId: string } }> => 'surfaceDoor' in intent)
      .map((intent) => [intent.surfaceDoor.wallKey, intent.surfaceDoor.assetId]),
  )

  Object.entries(wallSurfaceAssetIds).forEach(([wallKey, assetId]) => {
    if (!isGeneratedSurfaceDoor(wallKey, assetId, wallSurfaceProps)) {
      return
    }

    if (intendedGeneratedSurfaceDoors.has(wallKey)) {
      return
    }

    if (nextWallSurfaceAssetIds === wallSurfaceAssetIds) {
      nextWallSurfaceAssetIds = { ...wallSurfaceAssetIds }
    }
    if (nextWallSurfaceProps === wallSurfaceProps) {
      nextWallSurfaceProps = { ...wallSurfaceProps }
    }

    delete nextWallSurfaceAssetIds[wallKey]
    delete nextWallSurfaceProps[wallKey]

    if (nextSelection === wallKey) {
      nextSelection = null
    }
  })

  intendedGeneratedSurfaceDoors.forEach((assetId, wallKey) => {
    const currentAssetId = wallSurfaceAssetIds[wallKey] ?? null
    const currentProps = wallSurfaceProps[wallKey] ?? {}
    const alreadyGenerated = isGeneratedSurfaceDoor(wallKey, currentAssetId, wallSurfaceProps)

    if (currentAssetId === assetId && alreadyGenerated) {
      return
    }

    if (nextWallSurfaceAssetIds === wallSurfaceAssetIds) {
      nextWallSurfaceAssetIds = { ...wallSurfaceAssetIds }
    }
    if (nextWallSurfaceProps === wallSurfaceProps) {
      nextWallSurfaceProps = { ...wallSurfaceProps }
    }

    nextWallSurfaceAssetIds[wallKey] = assetId
    nextWallSurfaceProps[wallKey] = {
      ...currentProps,
      [GENERATED_SURFACE_DOOR_MARKER]: true,
    }
  })

  if (nextSelection && wallOpenings[nextSelection]?.source === 'generated' && !wallOpeningsById[nextSelection]) {
    const removedGeneratedOpening = wallOpenings[nextSelection]
    if (
      removedGeneratedOpening?.assetId
      && intendedGeneratedSurfaceDoors.has(removedGeneratedOpening.wallKey)
    ) {
      nextSelection = removedGeneratedOpening.wallKey
    } else {
      nextSelection = null
    }
  }

  return {
    wallOpenings: areWallOpeningMapsEquivalent(wallOpenings, wallOpeningsById)
      ? wallOpenings
      : wallOpeningsById,
    wallSurfaceAssetIds: nextWallSurfaceAssetIds,
    wallSurfaceProps: nextWallSurfaceProps,
    selection: nextSelection,
  }
}

export function resolveGeneratedSurfaceDoorAssetId() {
  const preferred = getContentPackAssetById(GENERATED_SURFACE_DOOR_ASSET_ID)
  if (preferred?.category === 'wall' && preferred.getPlayModeNextProps) {
    return preferred.id
  }

  return getContentPackAssetsByCategory('wall').find((asset) =>
    Boolean(asset.getPlayModeNextProps),
  )?.id ?? GENERATED_SURFACE_DOOR_ASSET_ID
}

function makeSharedBoundaryRun(units: SharedBoundaryUnit[]): SharedBoundaryRun {
  return {
    wallKeys: units.map((unit) => unit.wallKey),
    roomIds: units[0]?.roomIds ?? ['', ''],
    roomSideKeys: units[0]?.roomSides ?? ['', ''],
    layerId: units[0]?.layerId ?? 'default',
  }
}

function buildGeneratedConnectorIntents(
  paintedCells: Record<string, PaintedCellRecord>,
  manualOpenings: OpeningRecord[],
  wallSurfaceAssetIds: Record<string, string>,
  wallSurfaceProps: Record<string, Record<string, unknown>>,
  graphBackedRoomIds: ReadonlySet<string>,
  splineWallGraph: SplineWallGraph,
): GeneratedConnectorIntent[] {
  return buildGeneratedLegacyConnectorIntents(
    paintedCells,
    manualOpenings,
    wallSurfaceAssetIds,
    wallSurfaceProps,
    graphBackedRoomIds,
    splineWallGraph,
  )
}

function buildGeneratedLegacyConnectorIntents(
  paintedCells: Record<string, PaintedCellRecord>,
  manualOpenings: OpeningRecord[],
  wallSurfaceAssetIds: Record<string, string>,
  wallSurfaceProps: Record<string, Record<string, unknown>>,
  graphBackedRoomIds: ReadonlySet<string>,
  splineWallGraph: SplineWallGraph,
): GeneratedConnectorIntent[] {
  const generatedSurfaceDoorAssetId = resolveGeneratedSurfaceDoorAssetId()
  const manualOpeningSegments = manualOpenings.map((opening) =>
    new Set(getOpeningSegments(opening.wallKey, opening.width)),
  )
  const manualSurfaceDoorWallKeys = new Set(
    Object.entries(wallSurfaceAssetIds)
      .filter(([wallKey, assetId]) =>
        !isGeneratedSurfaceDoor(wallKey, assetId, wallSurfaceProps) && isSurfaceDoorAssetId(assetId),
      )
      .map(([wallKey]) => wallKey),
  )
  const occupiedRoomSides = new Set<RoomSideKey>()
  const queryCache = createSplineWallQueryCache(splineWallGraph)

  buildSharedBoundaryRuns(paintedCells).forEach((run) => {
    const runSegments = new Set(run.wallKeys)
    const hasManualOverlap = manualOpeningSegments.some((segments) =>
      [...segments].some((segment) => runSegments.has(segment)),
    )
    const hasManualSurfaceDoor = run.wallKeys.some((wallKey) => manualSurfaceDoorWallKeys.has(wallKey))

    if (hasManualOverlap || hasManualSurfaceDoor) {
      run.roomSideKeys.forEach((roomSideKey) => occupiedRoomSides.add(roomSideKey))
    }
  })

  const intents: GeneratedConnectorIntent[] = []
  buildSharedBoundaryRuns(paintedCells)
    .filter((run) => {
      const runSegments = new Set(run.wallKeys)
      const hasManualOpeningOverlap = manualOpeningSegments.some((segments) =>
        [...segments].some((segment) => runSegments.has(segment)),
      )
      return !hasManualOpeningOverlap && !run.wallKeys.some((wallKey) => manualSurfaceDoorWallKeys.has(wallKey))
    })
    .sort((left, right) => {
      if (right.wallKeys.length !== left.wallKeys.length) {
        return right.wallKeys.length - left.wallKeys.length
      }
      return (left.wallKeys[0] ?? '').localeCompare(right.wallKeys[0] ?? '')
    })
    .forEach((run) => {
      if (run.roomSideKeys.some((roomSideKey) => occupiedRoomSides.has(roomSideKey))) {
        return
      }

      const intent = buildGeneratedConnectorIntent(
        run,
        generatedSurfaceDoorAssetId,
        run.roomIds.every((roomId) => graphBackedRoomIds.has(roomId)),
        splineWallGraph,
        queryCache,
        paintedCells,
      )
      if (!intent) {
        return
      }

      run.roomSideKeys.forEach((roomSideKey) => occupiedRoomSides.add(roomSideKey))
      intents.push(intent)
    })

  return intents
}

function buildGeneratedConnectorIntent(
  run: SharedBoundaryRun,
  generatedSurfaceDoorAssetId: string | undefined,
  useGraphOpening: boolean,
  splineWallGraph: SplineWallGraph,
  queryCache: ReturnType<typeof createSplineWallQueryCache>,
  paintedCells: Record<string, PaintedCellRecord>,
): GeneratedConnectorIntent | null {
  if (run.wallKeys.length === 1) {
    const wallKey = run.wallKeys[0]
    if (!wallKey) {
      return null
    }

    if (useGraphOpening) {
      return {
        opening: buildGeneratedGraphConnectorOpening(run, wallKey, null, splineWallGraph, queryCache, paintedCells),
      }
    }

    return {
      opening: {
        assetId: null,
        wallKey,
        width: 1,
        flipped: false,
        layerId: run.layerId,
        source: 'generated' satisfies OpeningSource,
      },
    }
  }

  if (!generatedSurfaceDoorAssetId) {
    return null
  }

  const centerIndex = Math.floor((run.wallKeys.length - 1) / 2)
  const wallKey = run.wallKeys[centerIndex]
  if (!wallKey) {
    return null
  }

  if (useGraphOpening) {
    return {
      opening: buildGeneratedGraphConnectorOpening(
        run,
        wallKey,
        GENERATED_SPLINE_DOOR_ASSET_ID,
        splineWallGraph,
        queryCache,
        paintedCells,
      ),
    }
  }

  return {
    surfaceDoor: {
      wallKey,
      assetId: generatedSurfaceDoorAssetId,
    },
  }
}

function buildGeneratedGraphConnectorOpening(
  run: SharedBoundaryRun,
  wallKey: string,
  assetId: string | null,
  splineWallGraph: SplineWallGraph,
  queryCache: ReturnType<typeof createSplineWallQueryCache>,
  paintedCells: Record<string, PaintedCellRecord>,
) {
  const wallTransform = wallKeyToWorldPosition(wallKey)
  const placement = wallTransform
    ? buildSplineWallOpeningPlacement(
        { x: wallTransform.position[0], z: wallTransform.position[2] },
        splineWallGraph,
        queryCache,
        paintedCells,
        assetId,
      )
    : null

  return buildGeneratedSplineOpeningRecord(assetId, wallKey, run.layerId, placement)
}

function buildGeneratedSplineOpeningRecord(
  assetId: string | null,
  wallKey: string,
  layerId: string,
  placement: ReturnType<typeof buildSplineWallOpeningPlacement> | null,
) {
  return {
    assetId,
    wallKey: placement?.wallKey ?? wallKey,
    width: 1,
    segmentId: placement?.segmentId ?? null,
    segmentStartRatio: placement?.segmentStartRatio ?? null,
    segmentEndRatio: placement?.segmentEndRatio ?? null,
    flipped: false,
    layerId,
    source: 'generated' satisfies OpeningSource,
  } satisfies Omit<OpeningRecord, 'id'>
}

function buildRoomSideKey(roomId: string, direction: string, line: number, layerId: string): RoomSideKey {
  return `${roomId}:${direction}:${line}:${layerId}`
}

function getOppositeWallDirection(direction: string) {
  switch (direction) {
    case 'north':
      return 'south'
    case 'south':
      return 'north'
    case 'east':
      return 'west'
    case 'west':
      return 'east'
    default:
      return direction
  }
}

function buildOpeningSignature(opening: Omit<OpeningRecord, 'id'> | OpeningRecord) {
  return [
    opening.assetId ?? 'open',
    opening.wallKey,
    opening.width,
    opening.segmentId ?? 'no-segment',
    opening.segmentStartRatio ?? 'no-start',
    opening.segmentEndRatio ?? 'no-end',
    opening.flipped ? 'flipped' : 'normal',
    opening.layerId,
    opening.source ?? 'manual',
  ].join(':')
}

function isSurfaceDoorAssetId(assetId: string | null | undefined) {
  if (!assetId) {
    return false
  }

  const asset = getContentPackAssetById(assetId)
  return asset?.category === 'wall' && Boolean(asset.getPlayModeNextProps)
}

function isGeneratedSurfaceDoor(
  wallKey: string,
  assetId: string | null | undefined,
  wallSurfaceProps: Record<string, Record<string, unknown>>,
) {
  return isSurfaceDoorAssetId(assetId) && wallSurfaceProps[wallKey]?.[GENERATED_SURFACE_DOOR_MARKER] === true
}

function areWallOpeningMapsEquivalent(
  previous: Record<string, OpeningRecord>,
  next: Record<string, OpeningRecord>,
) {
  const previousKeys = Object.keys(previous)
  const nextKeys = Object.keys(next)
  if (previousKeys.length !== nextKeys.length) {
    return false
  }

  return previousKeys.every((key) => previous[key] === next[key])
}
