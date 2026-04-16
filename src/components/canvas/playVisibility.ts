import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { getContentPackAssetById } from '../../content-packs/registry'
import { GRID_SIZE, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import { getOpeningSegments } from '../../store/openingSegments'
import { useDungeonStore, type OpeningRecord, type PaintedCells } from '../../store/useDungeonStore'
import type { DungeonObjectRecord, Layer } from '../../store/useDungeonStore'
import { getRegisteredObject, useObjectRegistryVersion } from './objectRegistry'
import { isGeneratedCharacterAssetId } from '../../content-packs/runtimeRegistry'
import type { GeneratedCharacterRecord } from '../../generated-characters/types'

const PLAYER_VISION_RANGE = 8
const MASK_BASE_SAMPLE_COUNT = 1024
const MASK_ANGLE_EPSILON = 0.0001
const MASK_DISTANCE_EPSILON = 0.0005
const MASK_OPENING_INSET = GRID_SIZE * 0.22
const LOS_BLOCKER_RAYCAST_Y = 0.38
const EMPTY_EXPLORED_CELLS: Record<string, true> = {}

type BlockerBroadPhase = {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

type BlockerCandidate = {
  triangles: number[]
  broadPhase: BlockerBroadPhase | null
}

type BlockerCellEntry = {
  hasRegisteredObject: boolean
  candidates: BlockerCandidate[]
}

type BlockerLookupValue = BlockerCellEntry | string[]
type BlockerLookup = Map<string, BlockerLookupValue>
const blockerBounds = new THREE.Box3()

type PlayVisibilityWorkerInput = {
  paintedCells: PaintedCells
  wallOpenings: Record<string, OpeningRecord>
  origins: GridCell[]
  range: number
  blockingCellKeys: string[]
  blockerLookupEntries: Array<[string, BlockerLookupValue]>
}

type PlayVisibilityComputation = {
  visibleCellKeys: string[]
  mask: PlayVisibilityMask | null
}

export type PlayVisibilityState = 'visible' | 'explored' | 'hidden'

export type PlayVisibility = {
  active: boolean
  getCellVisibility: (cellKey: string) => PlayVisibilityState
  getObjectVisibility: (object: DungeonObjectRecord) => PlayVisibilityState
  getWallVisibility: (wallKey: string) => PlayVisibilityState
  mask: PlayVisibilityMask | null
}

export type VisibilityPolygon = Array<readonly [x: number, z: number]>

export type VisibilitySample = {
  angle: number
  point: readonly [x: number, z: number]
}

export type VisibilitySource = {
  origin: readonly [x: number, z: number]
  polygon: VisibilityPolygon
  sectors: VisibilityPolygon[]
}

export type PlayVisibilityMask = {
  bounds: {
    minX: number
    maxX: number
    minZ: number
    maxZ: number
  }
  paintedCellKeys: string[]
  exploredCellKeys: string[]
  sources: VisibilitySource[]
  polygons: VisibilityPolygon[]
}

type WallDirection = 'north' | 'south' | 'east' | 'west'

type PortalSegment = {
  orientation: 'horizontal' | 'vertical'
  fixed: number
  min: number
  max: number
}

const WALL_DIRECTIONS: Record<WallDirection, { delta: GridCell; opposite: WallDirection }> = {
  north: { delta: [0, 1], opposite: 'south' },
  south: { delta: [0, -1], opposite: 'north' },
  east: { delta: [1, 0], opposite: 'west' },
  west: { delta: [-1, 0], opposite: 'east' },
}

export function usePlayVisibility(): PlayVisibility {
  const tool = useDungeonStore((state) => state.tool)
  const paintedCells = useDungeonStore((state) => state.paintedCells)
  const exploredCells = useDungeonStore((state) => state.exploredCells)
  const wallOpenings = useDungeonStore((state) => state.wallOpenings)
  const placedObjects = useDungeonStore((state) => state.placedObjects)
  const layers = useDungeonStore((state) => state.layers)
  const generatedCharacters = useDungeonStore((state) => state.generatedCharacters)
  const mergeExploredCells = useDungeonStore((state) => state.mergeExploredCells)
  const objectRegistryVersion = useObjectRegistryVersion()

  const workerInput = useMemo(() => {
    if (tool !== 'play') {
      return null
    }
    const playerOrigins = Object.values(placedObjects)
      .filter((object) => isVisiblePlayerOrigin(object, paintedCells, layers, generatedCharacters))
      .map((object) => object.cell)
    const blockerLookup = getBlockingObjectIdsByCell(placedObjects, layers)
    return {
      paintedCells,
      wallOpenings,
      origins: playerOrigins,
      range: PLAYER_VISION_RANGE,
      blockingCellKeys: [...blockerLookup.keys()],
      blockerLookupEntries: [...blockerLookup.entries()],
    } satisfies PlayVisibilityWorkerInput
  }, [generatedCharacters, layers, objectRegistryVersion, paintedCells, placedObjects, tool, wallOpenings])
  const [visibilityData, setVisibilityData] = useState<PlayVisibilityComputation>({
    visibleCellKeys: [],
    mask: null,
  })

  useEffect(() => {
    if (tool !== 'play' || !workerInput) {
      setVisibilityData({ visibleCellKeys: [], mask: null })
      return
    }

    setVisibilityData(computePlayVisibilityData(workerInput))
  }, [tool, workerInput])

  const mask = useMemo(
    () => withExploredCellKeys(visibilityData.mask, exploredCells),
    [exploredCells, visibilityData.mask],
  )

  useEffect(() => {
    if (tool === 'play') {
      mergeExploredCells(visibilityData.visibleCellKeys)
    }
  }, [mergeExploredCells, tool, visibilityData.visibleCellKeys])

  return useMemo(() => {
    if (tool !== 'play') {
      return {
        active: false,
        getCellVisibility: () => 'visible' as const,
        getObjectVisibility: () => 'visible' as const,
        getWallVisibility: () => 'visible' as const,
        mask: null,
      }
    }

    const visibleSet = new Set(visibilityData.visibleCellKeys)

    const getCellVisibility = (cellKey: string): PlayVisibilityState => {
      if (visibleSet.has(cellKey)) {
        return 'visible'
      }
      if (exploredCells[cellKey]) {
        return 'explored'
      }
      return 'hidden'
    }

    return {
      active: true,
      getCellVisibility,
      getObjectVisibility: (object) =>
        getObjectVisibilityState(object, getCellVisibility, generatedCharacters),
      mask,
      getWallVisibility: (wallKey: string) => {
        const parsed = parseWallKey(wallKey)
        if (!parsed) {
          return 'hidden'
        }

        const cellVisibility = getCellVisibility(parsed.cellKey)
        const adjacentVisibility = getCellVisibility(parsed.neighborCellKey)

        return maxVisibility(cellVisibility, adjacentVisibility)
      },
    }
  }, [exploredCells, generatedCharacters, mask, tool, visibilityData.visibleCellKeys])
}

export function computePlayVisibilityData(input: PlayVisibilityWorkerInput): PlayVisibilityComputation {
  const blockerLookup = new Map<string, BlockerLookupValue>(input.blockerLookupEntries)
  const blockingCells = new Set(input.blockingCellKeys)
  const visibleCellKeys = computeVisibleCellKeys(
    input.paintedCells,
    input.wallOpenings,
    input.origins,
    input.range,
    blockingCells,
    blockerLookup,
  )
  const mask = computeVisibilityMask(
    input.paintedCells,
    EMPTY_EXPLORED_CELLS,
    input.wallOpenings,
    input.origins,
    input.range,
    blockingCells,
    blockerLookup,
  )

  return { visibleCellKeys, mask }
}

function withExploredCellKeys(
  mask: PlayVisibilityMask | null,
  exploredCells: Record<string, true>,
): PlayVisibilityMask | null {
  if (!mask) {
    return null
  }

  return {
    ...mask,
    exploredCellKeys: Object.keys(exploredCells),
  }
}

export function isVisiblePlayerOrigin(
  object: DungeonObjectRecord,
  paintedCells: PaintedCells,
  layers: Record<string, Layer>,
  generatedCharacters: Record<string, GeneratedCharacterRecord>,
) {
  const generatedCharacter =
    object.assetId && isGeneratedCharacterAssetId(object.assetId)
      ? generatedCharacters[object.assetId] ?? null
      : null

  return (
    object.type === 'player' &&
    generatedCharacter?.kind !== 'npc' &&
    layers[object.layerId]?.visible !== false &&
    Boolean(paintedCells[getCellKey(object.cell)])
  )
}

export function getObjectVisibilityState(
  object: DungeonObjectRecord,
  getCellVisibility: (cellKey: string) => PlayVisibilityState,
  generatedCharacters: Record<string, GeneratedCharacterRecord>,
): PlayVisibilityState {
  const cellVisibility = getCellVisibility(getCellKey(object.cell))
  const generatedCharacter =
    object.assetId && isGeneratedCharacterAssetId(object.assetId)
      ? generatedCharacters[object.assetId] ?? null
      : null

  if (generatedCharacter?.kind === 'npc' && cellVisibility !== 'visible') {
    return 'hidden'
  }

  return cellVisibility
}

export function computeVisibleCellKeys(
  paintedCells: PaintedCells,
  wallOpenings: Record<string, OpeningRecord>,
  origins: GridCell[],
  range: number,
  blockingCellKeys: Iterable<string> = [],
  blockerLookup: BlockerLookup = new Map(),
): string[] {
  const openWalls = buildOpenWallSet(wallOpenings)
  const blockingCells = new Set(blockingCellKeys)
  const visible = new Set<string>()
  const maxOffset = Math.ceil(range)
  const rangeSquared = range * range

  for (const origin of origins) {
    const originKey = getCellKey(origin)
    if (!paintedCells[originKey] || visible.has(originKey)) {
      continue
    }

    visible.add(originKey)

    for (let deltaZ = -maxOffset; deltaZ <= maxOffset; deltaZ += 1) {
      for (let deltaX = -maxOffset; deltaX <= maxOffset; deltaX += 1) {
        if (deltaX * deltaX + deltaZ * deltaZ > rangeSquared) {
          continue
        }

        const targetCell: GridCell = [origin[0] + deltaX, origin[1] + deltaZ]
        const targetKey = getCellKey(targetCell)
        if (visible.has(targetKey) || !paintedCells[targetKey]) {
          continue
        }

        if (hasLineOfSight(origin, targetCell, paintedCells, openWalls, blockingCells, blockerLookup)) {
          visible.add(targetKey)
        }
      }
    }
  }

  return [...visible]
}

function buildOpenWallSet(wallOpenings: Record<string, OpeningRecord>) {
  const openWalls = new Set<string>()

  for (const opening of Object.values(wallOpenings)) {
    for (const wallKey of getOpeningSegments(opening.wallKey, opening.width)) {
      openWalls.add(wallKey)

      const parsed = parseWallKey(wallKey)
      if (parsed) {
        openWalls.add(parsed.mirroredWallKey)
      }
    }
  }

  return openWalls
}

function hasLineOfSight(
  origin: GridCell,
  target: GridCell,
  paintedCells: PaintedCells,
  openWalls: Set<string>,
  blockingCells: Set<string>,
  blockerLookup: BlockerLookup,
) {
  if (origin[0] === target[0] && origin[1] === target[1]) {
    return true
  }

  let current: GridCell = [origin[0], origin[1]]
  const originPoint: readonly [number, number] = [
    (origin[0] + 0.5) * GRID_SIZE,
    (origin[1] + 0.5) * GRID_SIZE,
  ]
  const targetPoint: readonly [number, number] = [
    (target[0] + 0.5) * GRID_SIZE,
    (target[1] + 0.5) * GRID_SIZE,
  ]
  const dx = target[0] - origin[0]
  const dz = target[1] - origin[1]
  const stepX = Math.sign(dx)
  const stepZ = Math.sign(dz)
  const tDeltaX = stepX === 0 ? Number.POSITIVE_INFINITY : 1 / Math.abs(dx)
  const tDeltaZ = stepZ === 0 ? Number.POSITIVE_INFINITY : 1 / Math.abs(dz)
  let tMaxX = stepX === 0 ? Number.POSITIVE_INFINITY : tDeltaX * 0.5
  let tMaxZ = stepZ === 0 ? Number.POSITIVE_INFINITY : tDeltaZ * 0.5

  while (current[0] !== target[0] || current[1] !== target[1]) {
    if (approximatelyEqual(tMaxX, tMaxZ)) {
      if (stepX === 0 || stepZ === 0) {
        return false
      }

      const nextDiagonal: GridCell = [current[0] + stepX, current[1] + stepZ]
      const viaX: GridCell = [current[0] + stepX, current[1]]
      const viaZ: GridCell = [current[0], current[1] + stepZ]
      const canPassViaX = canTraverseAdjacent(
        current,
        viaX,
        paintedCells,
        openWalls,
      ) && !isBlockingSightCell(viaX, target, blockingCells, blockerLookup, originPoint, targetPoint) && canTraverseAdjacent(
        viaX,
        nextDiagonal,
        paintedCells,
        openWalls,
      )
      const canPassViaZ = canTraverseAdjacent(
        current,
        viaZ,
        paintedCells,
        openWalls,
      ) && !isBlockingSightCell(viaZ, target, blockingCells, blockerLookup, originPoint, targetPoint) && canTraverseAdjacent(
        viaZ,
        nextDiagonal,
        paintedCells,
        openWalls,
      )

      if (!canPassViaX && !canPassViaZ) {
        return false
      }

      current = nextDiagonal
      if (isBlockingSightCell(current, target, blockingCells, blockerLookup, originPoint, targetPoint)) {
        return false
      }
      tMaxX += tDeltaX
      tMaxZ += tDeltaZ
      continue
    }

    if (tMaxX < tMaxZ) {
      const nextCell: GridCell = [current[0] + stepX, current[1]]
      if (!canTraverseAdjacent(current, nextCell, paintedCells, openWalls)) {
        return false
      }
      current = nextCell
      if (isBlockingSightCell(current, target, blockingCells, blockerLookup, originPoint, targetPoint)) {
        return false
      }
      tMaxX += tDeltaX
      continue
    }

    const nextCell: GridCell = [current[0], current[1] + stepZ]
    if (!canTraverseAdjacent(current, nextCell, paintedCells, openWalls)) {
      return false
    }
    current = nextCell
    if (isBlockingSightCell(current, target, blockingCells, blockerLookup, originPoint, targetPoint)) {
      return false
    }
    tMaxZ += tDeltaZ
  }

  return true
}

function canTraverseAdjacent(
  from: GridCell,
  to: GridCell,
  paintedCells: PaintedCells,
  openWalls: Set<string>,
) {
  const direction = getDirection(from, to)
  if (!direction) {
    return false
  }

  const fromKey = getCellKey(from)
  const toKey = getCellKey(to)
  const fromRecord = paintedCells[fromKey]
  const toRecord = paintedCells[toKey]
  if (!fromRecord || !toRecord) {
    return false
  }

  if ((fromRecord.roomId ?? null) === (toRecord.roomId ?? null)) {
    return true
  }

  return openWalls.has(`${fromKey}:${direction}`)
}

function getDirection(from: GridCell, to: GridCell): WallDirection | null {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]

  if (dx === 1 && dz === 0) return 'east'
  if (dx === -1 && dz === 0) return 'west'
  if (dx === 0 && dz === 1) return 'north'
  if (dx === 0 && dz === -1) return 'south'
  return null
}

function parseWallKey(wallKey: string) {
  const [xText, zText, directionText] = wallKey.split(':')
  const x = Number.parseInt(xText ?? '', 10)
  const z = Number.parseInt(zText ?? '', 10)
  if (!Number.isFinite(x) || !Number.isFinite(z)) {
    return null
  }

  if (
    directionText !== 'north' &&
    directionText !== 'south' &&
    directionText !== 'east' &&
    directionText !== 'west'
  ) {
    return null
  }

  const direction = WALL_DIRECTIONS[directionText]
  const cellKey = `${x}:${z}`
  const neighborCellKey = `${x + direction.delta[0]}:${z + direction.delta[1]}`

  return {
    cellKey,
    neighborCellKey,
    mirroredWallKey: `${neighborCellKey}:${direction.opposite}`,
  }
}

function maxVisibility(a: PlayVisibilityState, b: PlayVisibilityState): PlayVisibilityState {
  if (a === 'visible' || b === 'visible') {
    return 'visible'
  }
  if (a === 'explored' || b === 'explored') {
    return 'explored'
  }
  return 'hidden'
}

function approximatelyEqual(a: number, b: number) {
  return Math.abs(a - b) < 1e-9
}

export function computeVisibilityMask(
  paintedCells: PaintedCells,
  exploredCells: Record<string, true>,
  wallOpenings: Record<string, OpeningRecord>,
  origins: GridCell[],
  range: number,
  blockingCellKeys: Iterable<string>,
  blockerLookup: BlockerLookup = new Map(),
): PlayVisibilityMask | null {
  const paintedCellKeys = Object.keys(paintedCells)
  if (paintedCellKeys.length === 0) {
    return null
  }

  const blockingCells = new Set(blockingCellKeys)
  const portalLookup = buildPortalLookup(wallOpenings)
  const sources = origins
    .map((origin) => {
      const samples = computeVisibilitySamples(
        origin,
        paintedCells,
        portalLookup,
        blockingCells,
        range,
        blockerLookup,
      )
      const polygon = samples.map((sample) => sample.point)
      const sectors = splitVisibilityPolygonIntoSectors(
        origin,
        samples,
        paintedCells,
        portalLookup,
        blockingCells,
        range * GRID_SIZE,
        blockerLookup,
      )
      if (sectors.length === 0) {
        return null
      }

      return {
        origin: [
          (origin[0] + 0.5) * GRID_SIZE,
          (origin[1] + 0.5) * GRID_SIZE,
        ] as const,
        polygon,
        sectors,
      }
    })
    .filter((source): source is VisibilitySource => source !== null)
  const polygons = sources.flatMap((source) => source.sectors)

  const cells = Object.values(paintedCells)
  const minCellX = Math.min(...cells.map((record) => record.cell[0]))
  const maxCellX = Math.max(...cells.map((record) => record.cell[0]))
  const minCellZ = Math.min(...cells.map((record) => record.cell[1]))
  const maxCellZ = Math.max(...cells.map((record) => record.cell[1]))

  return {
    bounds: {
      minX: minCellX * GRID_SIZE,
      maxX: (maxCellX + 1) * GRID_SIZE,
      minZ: minCellZ * GRID_SIZE,
      maxZ: (maxCellZ + 1) * GRID_SIZE,
    },
    paintedCellKeys,
    exploredCellKeys: Object.keys(exploredCells),
    sources,
    polygons,
  }
}

export function computeVisibilitySamples(
  originCell: GridCell,
  paintedCells: PaintedCells,
  portalLookup: Map<string, PortalSegment>,
  blockingCells: Set<string>,
  range: number,
  blockerLookup: BlockerLookup = new Map(),
): VisibilitySample[] {
  const origin: readonly [number, number] = [
    (originCell[0] + 0.5) * GRID_SIZE,
    (originCell[1] + 0.5) * GRID_SIZE,
  ]
  const maxDistance = range * GRID_SIZE
  return buildMaskAngles(origin, portalLookup, blockingCells, maxDistance)
    .map((angle) => normalizeAngle(angle))
    .sort((left, right) => left - right)
    .map((angle) => ({
      angle,
      point: castVisibilityMaskRayWithLookup(
        originCell,
        origin,
        angle,
        paintedCells,
        portalLookup,
        blockingCells,
        maxDistance,
        blockerLookup,
      ),
    }))
}

function splitVisibilityPolygonIntoSectors(
  originCell: GridCell,
  samples: VisibilitySample[],
  paintedCells: PaintedCells,
  portalLookup: Map<string, PortalSegment>,
  blockingCells: Set<string>,
  maxDistance: number,
  blockerLookup: BlockerLookup,
): VisibilityPolygon[] {
  if (samples.length < 3) {
    return []
  }

  const origin: readonly [number, number] = [
    (originCell[0] + 0.5) * GRID_SIZE,
    (originCell[1] + 0.5) * GRID_SIZE,
  ]
  const breaks = new Set<number>()

  for (let index = 0; index < samples.length; index += 1) {
    const current = samples[index]
    const next = samples[(index + 1) % samples.length]
    if (
      shouldSplitVisibilitySector(
        originCell,
        origin,
        current,
        next,
        paintedCells,
        portalLookup,
        blockingCells,
        maxDistance,
        blockerLookup,
      )
    ) {
      breaks.add(index)
    }
  }

  if (breaks.size === 0) {
    return [samples.map((sample) => sample.point)]
  }

  const sectors: VisibilityPolygon[] = []
  const startIndex = (([...breaks][0] ?? 0) + 1) % samples.length
  let currentSector: VisibilityPolygon = []

  for (let offset = 0; offset < samples.length; offset += 1) {
    const index = (startIndex + offset) % samples.length
    currentSector.push(samples[index].point)

    if (breaks.has(index)) {
      if (currentSector.length >= 3) {
        sectors.push(currentSector)
      }
      currentSector = []
    }
  }

  if (currentSector.length >= 3) {
    sectors.push(currentSector)
  }

  return sectors
}

function shouldSplitVisibilitySector(
  originCell: GridCell,
  origin: readonly [number, number],
  left: VisibilitySample,
  right: VisibilitySample,
  paintedCells: PaintedCells,
  portalLookup: Map<string, PortalSegment>,
  blockingCells: Set<string>,
  maxDistance: number,
  blockerLookup: BlockerLookup,
) {
  const angleDelta = normalizeAngleDelta(right.angle - left.angle)
  if (angleDelta <= MASK_ANGLE_EPSILON * 4) {
    return false
  }

  const midpointAngle = normalizeAngle(left.angle + angleDelta * 0.5)
  const midpoint = castVisibilityMaskRayWithLookup(
    originCell,
    origin,
    midpointAngle,
    paintedCells,
    portalLookup,
    blockingCells,
    maxDistance,
    blockerLookup,
  )

  const midpointDistance = pointDistance(origin, midpoint)
  const edgeDistance = Math.min(
    pointDistance(origin, left.point),
    pointDistance(origin, right.point),
  )

  return midpointDistance + GRID_SIZE * 0.35 < edgeDistance
}

export function castVisibilityMaskRay(
  originCell: GridCell,
  angle: number,
  paintedCells: PaintedCells,
  wallOpenings: Record<string, OpeningRecord>,
  range: number,
  blockingCellKeys: Iterable<string> = [],
  blockerLookup: BlockerLookup = new Map(),
): readonly [number, number] {
  const origin: readonly [number, number] = [
    (originCell[0] + 0.5) * GRID_SIZE,
    (originCell[1] + 0.5) * GRID_SIZE,
  ]
  return castVisibilityMaskRayWithLookup(
    originCell,
    origin,
    angle,
    paintedCells,
    buildPortalLookup(wallOpenings),
    new Set(blockingCellKeys),
    range * GRID_SIZE,
    blockerLookup,
  )
}

function castVisibilityMaskRayWithLookup(
  originCell: GridCell,
  origin: readonly [number, number],
  angle: number,
  paintedCells: PaintedCells,
  portalLookup: Map<string, PortalSegment>,
  blockingCells: Set<string>,
  maxDistance: number,
  blockerLookup: BlockerLookup,
): readonly [number, number] {
  const direction: readonly [number, number] = [Math.cos(angle), Math.sin(angle)]
  const stepX = Math.sign(direction[0])
  const stepZ = Math.sign(direction[1])
  const tDeltaX = stepX === 0 ? Number.POSITIVE_INFINITY : GRID_SIZE / Math.abs(direction[0])
  const tDeltaZ = stepZ === 0 ? Number.POSITIVE_INFINITY : GRID_SIZE / Math.abs(direction[1])
  let current: GridCell = [originCell[0], originCell[1]]
  let tMaxX =
    stepX === 0
      ? Number.POSITIVE_INFINITY
      : ((((stepX > 0 ? current[0] + 1 : current[0]) * GRID_SIZE) - origin[0]) / direction[0])
  let tMaxZ =
    stepZ === 0
      ? Number.POSITIVE_INFINITY
      : ((((stepZ > 0 ? current[1] + 1 : current[1]) * GRID_SIZE) - origin[1]) / direction[1])

  while (Math.min(tMaxX, tMaxZ) <= maxDistance) {
    if (approximatelyEqual(tMaxX, tMaxZ)) {
      const distance = tMaxX
      const crossPoint = pointAtDistance(origin, direction, distance)
      const viaX: GridCell = [current[0] + stepX, current[1]]
      const viaZ: GridCell = [current[0], current[1] + stepZ]
      const diagonal: GridCell = [current[0] + stepX, current[1] + stepZ]
      const canPassViaX =
        stepX !== 0 &&
        stepZ !== 0 &&
        canTraverseRayBoundary(current, viaX, crossPoint, paintedCells, portalLookup) &&
        canTraverseRayBoundary(viaX, diagonal, crossPoint, paintedCells, portalLookup)
      const canPassViaZ =
        stepX !== 0 &&
        stepZ !== 0 &&
        canTraverseRayBoundary(current, viaZ, crossPoint, paintedCells, portalLookup) &&
        canTraverseRayBoundary(viaZ, diagonal, crossPoint, paintedCells, portalLookup)

      if (!canPassViaX && !canPassViaZ) {
        return pointAtDistance(origin, direction, Math.max(0, distance - MASK_DISTANCE_EPSILON))
      }

      current = diagonal
      const nextTMaxX = tMaxX + tDeltaX
      const nextTMaxZ = tMaxZ + tDeltaZ
      const diagonalHitDistance = getBlockingRayHitDistance(
        current,
        originCell,
        origin,
        direction,
        distance,
        Math.min(maxDistance, Math.min(nextTMaxX, nextTMaxZ)),
        blockingCells,
        blockerLookup,
      )
      if (diagonalHitDistance !== null) {
        return pointAtDistance(origin, direction, diagonalHitDistance)
      }

      tMaxX = nextTMaxX
      tMaxZ = nextTMaxZ
      continue
    }

    if (tMaxX < tMaxZ) {
      const distance = tMaxX
      const nextCell: GridCell = [current[0] + stepX, current[1]]
      const crossPoint = pointAtDistance(origin, direction, distance)
      if (!canTraverseRayBoundary(current, nextCell, crossPoint, paintedCells, portalLookup)) {
        return pointAtDistance(origin, direction, Math.max(0, distance - MASK_DISTANCE_EPSILON))
      }

      current = nextCell
      const nextTMaxX = tMaxX + tDeltaX
      const horizontalHitDistance = getBlockingRayHitDistance(
        current,
        originCell,
        origin,
        direction,
        distance,
        Math.min(maxDistance, Math.min(nextTMaxX, tMaxZ)),
        blockingCells,
        blockerLookup,
      )
      if (horizontalHitDistance !== null) {
        return pointAtDistance(origin, direction, horizontalHitDistance)
      }

      tMaxX = nextTMaxX
      continue
    }

    const distance = tMaxZ
    const nextCell: GridCell = [current[0], current[1] + stepZ]
    const crossPoint = pointAtDistance(origin, direction, distance)
    if (!canTraverseRayBoundary(current, nextCell, crossPoint, paintedCells, portalLookup)) {
      return pointAtDistance(origin, direction, Math.max(0, distance - MASK_DISTANCE_EPSILON))
    }

    current = nextCell
    const nextTMaxZ = tMaxZ + tDeltaZ
    const verticalHitDistance = getBlockingRayHitDistance(
      current,
      originCell,
      origin,
      direction,
      distance,
      Math.min(maxDistance, Math.min(tMaxX, nextTMaxZ)),
      blockingCells,
      blockerLookup,
    )
    if (verticalHitDistance !== null) {
      return pointAtDistance(origin, direction, verticalHitDistance)
    }

    tMaxZ = nextTMaxZ
  }

  return pointAtDistance(origin, direction, maxDistance)
}

function buildMaskAngles(
  origin: readonly [number, number],
  portalLookup: Map<string, PortalSegment>,
  blockingCells: Set<string>,
  maxDistance: number,
) {
  const angles = Array.from({ length: MASK_BASE_SAMPLE_COUNT }, (_, index) =>
    (index / MASK_BASE_SAMPLE_COUNT) * Math.PI * 2,
  )
  const seenPortals = new Set<string>()

  for (const portal of portalLookup.values()) {
    const key = `${portal.orientation}:${portal.fixed}:${portal.min}:${portal.max}`
    if (seenPortals.has(key)) {
      continue
    }
    seenPortals.add(key)

    const endpoints =
      portal.orientation === 'horizontal'
        ? [
            [portal.min, portal.fixed],
            [portal.max, portal.fixed],
          ]
        : [
            [portal.fixed, portal.min],
            [portal.fixed, portal.max],
          ]

    for (const endpoint of endpoints) {
      addEdgeAngles(angles, origin, endpoint as [number, number], maxDistance)
    }
  }

  for (const cellKey of blockingCells) {
    const [xText, zText] = cellKey.split(':')
    const cellX = Number.parseInt(xText ?? '', 10)
    const cellZ = Number.parseInt(zText ?? '', 10)
    if (!Number.isFinite(cellX) || !Number.isFinite(cellZ)) {
      continue
    }

    const minX = cellX * GRID_SIZE
    const maxX = (cellX + 1) * GRID_SIZE
    const minZ = cellZ * GRID_SIZE
    const maxZ = (cellZ + 1) * GRID_SIZE
    addEdgeAngles(angles, origin, [minX, minZ], maxDistance)
    addEdgeAngles(angles, origin, [minX, maxZ], maxDistance)
    addEdgeAngles(angles, origin, [maxX, minZ], maxDistance)
    addEdgeAngles(angles, origin, [maxX, maxZ], maxDistance)
  }

  return angles
}

function addEdgeAngles(
  angles: number[],
  origin: readonly [number, number],
  endpoint: readonly [number, number],
  maxDistance: number,
) {
  const dx = endpoint[0] - origin[0]
  const dz = endpoint[1] - origin[1]
  if (dx * dx + dz * dz > maxDistance * maxDistance) {
    return
  }

  const angle = Math.atan2(dz, dx)
  angles.push(angle - MASK_ANGLE_EPSILON, angle, angle + MASK_ANGLE_EPSILON)
}

export function buildPortalLookup(wallOpenings: Record<string, OpeningRecord>) {
  const lookup = new Map<string, PortalSegment>()

  for (const opening of Object.values(wallOpenings)) {
    const portal = getOpeningPortalSegment(opening)
    for (const wallKey of getOpeningSegments(opening.wallKey, opening.width)) {
      lookup.set(wallKey, portal)
      const parsed = parseWallKey(wallKey)
      if (parsed) {
        lookup.set(parsed.mirroredWallKey, portal)
      }
    }
  }

  return lookup
}

function getOpeningPortalSegment(opening: OpeningRecord): PortalSegment {
  const segments = getOpeningSegments(opening.wallKey, opening.width)
  const [xText, zText, directionText] = opening.wallKey.split(':')
  const x = Number.parseInt(xText ?? '', 10)
  const z = Number.parseInt(zText ?? '', 10)
  const inset = opening.assetId ? MASK_OPENING_INSET : MASK_DISTANCE_EPSILON
  const indices = segments.map((segment) => segment.split(':')).map(([sx, sz]) => ({
    x: Number.parseInt(sx ?? '', 10),
    z: Number.parseInt(sz ?? '', 10),
  }))

  if (directionText === 'north' || directionText === 'south') {
    const minX = Math.min(...indices.map((entry) => entry.x)) * GRID_SIZE
    const maxX = (Math.max(...indices.map((entry) => entry.x)) + 1) * GRID_SIZE
    const fixed = directionText === 'north' ? (z + 1) * GRID_SIZE : z * GRID_SIZE
    return normalizePortalSegment({
      orientation: 'horizontal',
      fixed,
      min: minX + inset,
      max: maxX - inset,
    })
  }

  const minZ = Math.min(...indices.map((entry) => entry.z)) * GRID_SIZE
  const maxZ = (Math.max(...indices.map((entry) => entry.z)) + 1) * GRID_SIZE
  const fixed = directionText === 'east' ? (x + 1) * GRID_SIZE : x * GRID_SIZE
  return normalizePortalSegment({
    orientation: 'vertical',
    fixed,
    min: minZ + inset,
    max: maxZ - inset,
  })
}

function normalizePortalSegment(portal: PortalSegment): PortalSegment {
  if (portal.max - portal.min >= 0.1) {
    return portal
  }

  const midpoint = (portal.min + portal.max) * 0.5
  return {
    ...portal,
    min: midpoint - 0.05,
    max: midpoint + 0.05,
  }
}

function canTraverseRayBoundary(
  from: GridCell,
  to: GridCell,
  crossPoint: readonly [number, number],
  paintedCells: PaintedCells,
  portalLookup: Map<string, PortalSegment>,
) {
  const direction = getDirection(from, to)
  if (!direction) {
    return false
  }

  const fromKey = getCellKey(from)
  const toKey = getCellKey(to)
  const fromRecord = paintedCells[fromKey]
  const toRecord = paintedCells[toKey]
  if (!fromRecord || !toRecord) {
    return false
  }

  if ((fromRecord.roomId ?? null) === (toRecord.roomId ?? null)) {
    return true
  }

  const portal = portalLookup.get(`${fromKey}:${direction}`)
  if (!portal) {
    return false
  }

  return pointPassesPortal(crossPoint, portal)
}

function pointPassesPortal(point: readonly [number, number], portal: PortalSegment) {
  const axisValue = portal.orientation === 'horizontal' ? point[0] : point[1]
  return axisValue >= portal.min - MASK_DISTANCE_EPSILON && axisValue <= portal.max + MASK_DISTANCE_EPSILON
}

function pointAtDistance(
  origin: readonly [number, number],
  direction: readonly [number, number],
  distance: number,
): readonly [number, number] {
  return [
    origin[0] + direction[0] * distance,
    origin[1] + direction[1] * distance,
  ]
}

function pointDistance(
  left: readonly [number, number],
  right: readonly [number, number],
) {
  return Math.hypot(right[0] - left[0], right[1] - left[1])
}

function normalizeAngle(angle: number) {
  const wrapped = angle % (Math.PI * 2)
  return wrapped < 0 ? wrapped + Math.PI * 2 : wrapped
}

function normalizeAngleDelta(angle: number) {
  const normalized = normalizeAngle(angle)
  return normalized <= 0 ? normalized + Math.PI * 2 : normalized
}

function isMaskBlockingCell(
  cell: GridCell,
  originCell: GridCell,
  blockingCells: Set<string>,
) {
  return (cell[0] !== originCell[0] || cell[1] !== originCell[1]) && blockingCells.has(getCellKey(cell))
}

function getBlockingObjectIdsByCell(
  placedObjects: Record<string, DungeonObjectRecord>,
  layers: Record<string, Layer>,
): BlockerLookup {
  const blockingCells = new Map<string, string[]>()

  for (const object of Object.values(placedObjects)) {
    if (layers[object.layerId]?.visible === false) {
      continue
    }

    const asset = object.assetId ? getContentPackAssetById(object.assetId) : null
    if (!asset?.metadata?.blocksLineOfSight || asset.metadata.connectsTo !== 'FLOOR') {
      continue
    }

    const cellKey = getCellKey(object.cell)
    const ids = blockingCells.get(cellKey)
    if (ids) {
      ids.push(object.id)
    } else {
      blockingCells.set(cellKey, [object.id])
    }
  }

  return new Map(
    [...blockingCells.entries()].map(([cellKey, ids]) => [
      cellKey,
      buildBlockerCellEntry(ids),
    ]),
  )
}

function buildBlockerCellEntry(blockerIds: string[]): BlockerCellEntry {
  const candidates: BlockerCandidate[] = []
  let hasRegisteredObject = false

  for (const blockerId of blockerIds) {
    const blocker = getRegisteredObject(blockerId)
    if (!blocker) {
      continue
    }

    hasRegisteredObject = true
    blocker.updateWorldMatrix(true, true)
    const candidate = buildBlockerCandidate(blocker)
    if (candidate) {
      candidates.push(candidate)
    }
  }

  return { hasRegisteredObject, candidates }
}

function buildBlockerCandidate(blocker: THREE.Object3D): BlockerCandidate | null {
  const triangles: number[] = []
  let broadPhase: BlockerBroadPhase | null = null
  const vertexA = new THREE.Vector3()
  const vertexB = new THREE.Vector3()
  const vertexC = new THREE.Vector3()

  blocker.traverse((node) => {
    if (!isLosSolidMesh(node, blocker)) {
      return
    }

    const mesh = node as THREE.Mesh
    const geometry = mesh.geometry
    const positions = geometry.getAttribute('position')
    if (!positions) {
      return
    }
    const index = geometry.getIndex()
    const triangleCount = index ? index.count / 3 : positions.count / 3
    if (!Number.isFinite(triangleCount) || triangleCount <= 0) {
      return
    }

    if (!geometry.boundingBox) {
      geometry.computeBoundingBox()
    }
    if (geometry.boundingBox) {
      blockerBounds.copy(geometry.boundingBox).applyMatrix4(node.matrixWorld)
    }

    for (let triangleIndex = 0; triangleIndex < triangleCount; triangleIndex += 1) {
      const indexOffset = triangleIndex * 3
      const vertexIndexA = index ? index.getX(indexOffset) : indexOffset
      const vertexIndexB = index ? index.getX(indexOffset + 1) : indexOffset + 1
      const vertexIndexC = index ? index.getX(indexOffset + 2) : indexOffset + 2
      vertexA.fromBufferAttribute(positions, vertexIndexA).applyMatrix4(node.matrixWorld)
      vertexB.fromBufferAttribute(positions, vertexIndexB).applyMatrix4(node.matrixWorld)
      vertexC.fromBufferAttribute(positions, vertexIndexC).applyMatrix4(node.matrixWorld)

      triangles.push(
        vertexA.x, vertexA.y, vertexA.z,
        vertexB.x, vertexB.y, vertexB.z,
        vertexC.x, vertexC.y, vertexC.z,
      )

      const minY = Math.min(vertexA.y, vertexB.y, vertexC.y)
      const maxY = Math.max(vertexA.y, vertexB.y, vertexC.y)
      if (maxY < LOS_BLOCKER_RAYCAST_Y || minY > LOS_BLOCKER_RAYCAST_Y) {
        continue
      }

      const minX = Math.min(vertexA.x, vertexB.x, vertexC.x)
      const maxX = Math.max(vertexA.x, vertexB.x, vertexC.x)
      const minZ = Math.min(vertexA.z, vertexB.z, vertexC.z)
      const maxZ = Math.max(vertexA.z, vertexB.z, vertexC.z)

      if (broadPhase) {
        broadPhase.minX = Math.min(broadPhase.minX, minX)
        broadPhase.maxX = Math.max(broadPhase.maxX, maxX)
        broadPhase.minZ = Math.min(broadPhase.minZ, minZ)
        broadPhase.maxZ = Math.max(broadPhase.maxZ, maxZ)
      } else {
        broadPhase = { minX, maxX, minZ, maxZ }
      }
    }
  })

  return triangles.length > 0 ? { triangles, broadPhase } : null
}

function isBlockingSightCell(
  cell: GridCell,
  target: GridCell,
  blockingCells: Set<string>,
  blockerLookup: BlockerLookup,
  originPoint: readonly [number, number],
  targetPoint: readonly [number, number],
) {
  if (cell[0] === target[0] && cell[1] === target[1]) {
    return false
  }

  const cellKey = getCellKey(cell)
  if (!blockingCells.has(cellKey)) {
    return false
  }

  const blockerEntry = getBlockerCellEntry(blockerLookup.get(cellKey))
  if (!blockerEntry) {
    return true
  }

  const hitDistance = getBlockingMeshHitDistance(
    blockerEntry,
    originPoint,
    normalizeDirection([
      targetPoint[0] - originPoint[0],
      targetPoint[1] - originPoint[1],
    ]),
    pointDistance(originPoint, targetPoint),
  )

  return hitDistance !== null
}

function getBlockingRayHitDistance(
  cell: GridCell,
  originCell: GridCell,
  origin: readonly [number, number],
  direction: readonly [number, number],
  entryDistance: number,
  exitDistance: number,
  blockingCells: Set<string>,
  blockerLookup: BlockerLookup,
) {
  if (!isMaskBlockingCell(cell, originCell, blockingCells)) {
    return null
  }

  const blockerEntry = getBlockerCellEntry(blockerLookup.get(getCellKey(cell)))
  const hitDistance = getBlockingMeshHitDistance(
    blockerEntry,
    origin,
    direction,
    exitDistance,
  )

  if (hitDistance === null) {
    return blockerEntry?.hasRegisteredObject
      ? null
      : Math.min(exitDistance, entryDistance + (exitDistance - entryDistance) * 0.5)
  }

  return hitDistance >= Math.max(0, entryDistance - MASK_DISTANCE_EPSILON) ? hitDistance : null
}

function getBlockingMeshHitDistance(
  blockerEntry: BlockerCellEntry | undefined,
  origin: readonly [number, number],
  direction: readonly [number, number],
  maxDistance: number,
) {
  if (!blockerEntry || maxDistance <= 0) {
    return null
  }

  let nearestHitDistance: number | null = null

  for (const candidate of blockerEntry.candidates) {
    if (!candidate.broadPhase) {
      continue
    }

    if (!rayIntersectsBlockerBroadPhase(origin, direction, maxDistance, candidate.broadPhase)) {
      continue
    }

    const hitDistance = getNearestTriangleHitDistance(candidate.triangles, origin, direction, maxDistance)
    if (hitDistance === null) {
      continue
    }

    nearestHitDistance =
      nearestHitDistance === null
        ? hitDistance
        : Math.min(nearestHitDistance, hitDistance)
  }

  if (nearestHitDistance !== null) {
    return nearestHitDistance
  }

  return blockerEntry.hasRegisteredObject ? null : maxDistance * 0.5
}

function getNearestTriangleHitDistance(
  triangles: number[],
  origin: readonly [number, number],
  direction: readonly [number, number],
  maxDistance: number,
) {
  const originX = origin[0]
  const originY = LOS_BLOCKER_RAYCAST_Y
  const originZ = origin[1]
  const directionX = direction[0]
  const directionY = 0
  const directionZ = direction[1]
  let nearestHitDistance: number | null = null

  for (let index = 0; index < triangles.length; index += 9) {
    const hitDistance = intersectRayWithTriangle(
      originX,
      originY,
      originZ,
      directionX,
      directionY,
      directionZ,
      triangles[index] ?? 0,
      triangles[index + 1] ?? 0,
      triangles[index + 2] ?? 0,
      triangles[index + 3] ?? 0,
      triangles[index + 4] ?? 0,
      triangles[index + 5] ?? 0,
      triangles[index + 6] ?? 0,
      triangles[index + 7] ?? 0,
      triangles[index + 8] ?? 0,
    )
    if (hitDistance === null || hitDistance > maxDistance) {
      continue
    }

    nearestHitDistance =
      nearestHitDistance === null ? hitDistance : Math.min(nearestHitDistance, hitDistance)
  }

  return nearestHitDistance
}

function intersectRayWithTriangle(
  originX: number,
  originY: number,
  originZ: number,
  directionX: number,
  directionY: number,
  directionZ: number,
  ax: number,
  ay: number,
  az: number,
  bx: number,
  by: number,
  bz: number,
  cx: number,
  cy: number,
  cz: number,
) {
  const edge1X = bx - ax
  const edge1Y = by - ay
  const edge1Z = bz - az
  const edge2X = cx - ax
  const edge2Y = cy - ay
  const edge2Z = cz - az
  const pX = directionY * edge2Z - directionZ * edge2Y
  const pY = directionZ * edge2X - directionX * edge2Z
  const pZ = directionX * edge2Y - directionY * edge2X
  const determinant = edge1X * pX + edge1Y * pY + edge1Z * pZ
  if (Math.abs(determinant) <= 0.000001) {
    return null
  }

  const inverseDeterminant = 1 / determinant
  const tVecX = originX - ax
  const tVecY = originY - ay
  const tVecZ = originZ - az
  const u = (tVecX * pX + tVecY * pY + tVecZ * pZ) * inverseDeterminant
  if (u < 0 || u > 1) {
    return null
  }

  const qX = tVecY * edge1Z - tVecZ * edge1Y
  const qY = tVecZ * edge1X - tVecX * edge1Z
  const qZ = tVecX * edge1Y - tVecY * edge1X
  const v = (directionX * qX + directionY * qY + directionZ * qZ) * inverseDeterminant
  if (v < 0 || u + v > 1) {
    return null
  }

  const distance = (edge2X * qX + edge2Y * qY + edge2Z * qZ) * inverseDeterminant
  return distance >= 0 ? distance : null
}

function getBlockerCellEntry(value: BlockerLookupValue | undefined): BlockerCellEntry | undefined {
  if (!value) {
    return undefined
  }

  return Array.isArray(value) ? buildBlockerCellEntry(value) : value
}

function isLosSolidMesh(object: THREE.Object3D, blockerRoot: THREE.Object3D) {
  if (!(object as THREE.Mesh).isMesh) {
    return false
  }

  let current: THREE.Object3D | null = object
  while (current) {
    if (current.userData.ignoreLosRaycast === true) {
      return false
    }
    if (current === blockerRoot) {
      break
    }
    current = current.parent
  }

  return true
}

function rayIntersectsBlockerBroadPhase(
  origin: readonly [number, number],
  direction: readonly [number, number],
  maxDistance: number,
  broadPhase: BlockerBroadPhase,
) {
  let entryDistance = 0
  let exitDistance = maxDistance

  if (
    !intersectRayAxis(origin[0], direction[0], broadPhase.minX, broadPhase.maxX, {
      entryDistanceRef: (value) => {
        entryDistance = Math.max(entryDistance, value)
      },
      exitDistanceRef: (value) => {
        exitDistance = Math.min(exitDistance, value)
      },
    })
  ) {
    return false
  }

  if (
    !intersectRayAxis(origin[1], direction[1], broadPhase.minZ, broadPhase.maxZ, {
      entryDistanceRef: (value) => {
        entryDistance = Math.max(entryDistance, value)
      },
      exitDistanceRef: (value) => {
        exitDistance = Math.min(exitDistance, value)
      },
    })
  ) {
    return false
  }

  return exitDistance >= entryDistance && exitDistance >= 0
}

function intersectRayAxis(
  origin: number,
  direction: number,
  min: number,
  max: number,
  ranges: {
    entryDistanceRef: (value: number) => void
    exitDistanceRef: (value: number) => void
  },
) {
  if (Math.abs(direction) <= 0.000001) {
    return origin >= min && origin <= max
  }

  const inverseDirection = 1 / direction
  const distanceA = (min - origin) * inverseDirection
  const distanceB = (max - origin) * inverseDirection
  const entryDistance = Math.min(distanceA, distanceB)
  const exitDistance = Math.max(distanceA, distanceB)

  ranges.entryDistanceRef(entryDistance)
  ranges.exitDistanceRef(exitDistance)
  return true
}

function normalizeDirection(direction: readonly [number, number]): readonly [number, number] {
  const length = Math.hypot(direction[0], direction[1])
  if (length <= 0.000001) {
    return [1, 0]
  }

  return [direction[0] / length, direction[1] / length]
}
