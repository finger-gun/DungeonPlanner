import { metadataSupportsConnectorType } from '../content-packs/connectors'
import {
  getContentPackAssetById,
  getContentPackAssetsByCategory,
} from '../content-packs/registry'
import { getCellKey, type GridCell } from '../hooks/useSnapToGrid'
import { getOpeningSegments } from './openingSegments'
import { WALL_DIRECTIONS } from './wallSegments'
import type { OpeningRecord, OpeningSource, PaintedCellRecord } from './useDungeonStore'

const GENERATED_DOOR_ASSET_ID = 'core.opening_door_wall_1'

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
}

export type ProceduralRoomLayoutInput = {
  paintedCells: Record<string, PaintedCellRecord>
  wallOpenings: Record<string, OpeningRecord>
  selection: string | null
  createOpeningId: () => string
}

export type ProceduralRoomLayoutResult = {
  wallOpenings: Record<string, OpeningRecord>
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
  selection,
  createOpeningId,
}: ProceduralRoomLayoutInput): ProceduralRoomLayoutResult {
  const manualOpenings = Object.values(wallOpenings).filter((opening) => opening.source !== 'generated')
  const generatedOpenings = Object.values(wallOpenings).filter((opening) => opening.source === 'generated')
  const wallOpeningsById: Record<string, OpeningRecord> = Object.fromEntries(
    manualOpenings.map((opening) => [opening.id, opening]),
  )
  const reusableGeneratedOpenings = new Map<string, OpeningRecord[]>()
  const connectorIntents = buildGeneratedConnectorIntents(paintedCells, manualOpenings)
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

  if (nextSelection && wallOpenings[nextSelection]?.source === 'generated' && !wallOpeningsById[nextSelection]) {
    nextSelection = null
  }

  return {
    wallOpenings: areWallOpeningMapsEquivalent(wallOpenings, wallOpeningsById)
      ? wallOpenings
      : wallOpeningsById,
    selection: nextSelection,
  }
}

export function resolveGeneratedDoorAssetId() {
  const preferred = getContentPackAssetById(GENERATED_DOOR_ASSET_ID)
  if (preferred && preferred.category === 'opening') {
    return preferred.id
  }

  return getContentPackAssetsByCategory('opening').find((asset) =>
    metadataSupportsConnectorType(asset.metadata, 'WALL') &&
    (asset.metadata?.openingWidth ?? 1) === 1,
  )?.id ?? GENERATED_DOOR_ASSET_ID
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
): GeneratedConnectorIntent[] {
  const generatedDoorAssetId = resolveGeneratedDoorAssetId()
  const manualOpeningSegments = manualOpenings.map((opening) =>
    new Set(getOpeningSegments(opening.wallKey, opening.width)),
  )
  const occupiedRoomSides = new Set<RoomSideKey>()

  buildSharedBoundaryRuns(paintedCells).forEach((run) => {
    const runSegments = new Set(run.wallKeys)
    const hasManualOverlap = manualOpeningSegments.some((segments) =>
      [...segments].some((segment) => runSegments.has(segment)),
    )

    if (hasManualOverlap) {
      run.roomSideKeys.forEach((roomSideKey) => occupiedRoomSides.add(roomSideKey))
    }
  })

  const intents: GeneratedConnectorIntent[] = []

  buildSharedBoundaryRuns(paintedCells)
    .filter((run) => {
      const runSegments = new Set(run.wallKeys)
      return !manualOpeningSegments.some((segments) =>
        [...segments].some((segment) => runSegments.has(segment)),
      )
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

      const opening = buildGeneratedConnectorOpening(run, generatedDoorAssetId)
      if (!opening) {
        return
      }

      run.roomSideKeys.forEach((roomSideKey) => occupiedRoomSides.add(roomSideKey))
      intents.push({ opening })
    })

  return intents
}

function buildGeneratedConnectorOpening(
  run: SharedBoundaryRun,
  generatedDoorAssetId: string | undefined,
): Omit<OpeningRecord, 'id'> | null {
  if (run.wallKeys.length === 1) {
    const wallKey = run.wallKeys[0]
    if (!wallKey) {
      return null
    }

    return {
      assetId: null,
      wallKey,
      width: 1,
      flipped: false,
      layerId: run.layerId,
      source: 'generated' satisfies OpeningSource,
    }
  }

  if (!generatedDoorAssetId) {
    return null
  }

  const centerIndex = Math.floor((run.wallKeys.length - 1) / 2)
  const wallKey = run.wallKeys[centerIndex]
  if (!wallKey) {
    return null
  }

  return {
    assetId: generatedDoorAssetId,
    wallKey,
    width: 1,
    flipped: false,
    layerId: run.layerId,
    source: 'generated' satisfies OpeningSource,
  }
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
    opening.flipped ? 'flipped' : 'normal',
    opening.layerId,
    opening.source ?? 'manual',
  ].join(':')
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
