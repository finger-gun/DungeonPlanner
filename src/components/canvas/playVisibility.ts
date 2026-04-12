import { useEffect, useMemo } from 'react'
import { getContentPackAssetById } from '../../content-packs/registry'
import { GRID_SIZE, getCellKey, type GridCell } from '../../hooks/useSnapToGrid'
import { getOpeningSegments, useDungeonStore, type OpeningRecord, type PaintedCells } from '../../store/useDungeonStore'
import type { DungeonObjectRecord, Layer } from '../../store/useDungeonStore'

const PLAYER_VISION_RANGE = 8
const MASK_BASE_SAMPLE_COUNT = 1024
const MASK_ANGLE_EPSILON = 0.0001
const MASK_DISTANCE_EPSILON = 0.0005
const MASK_OPENING_INSET = GRID_SIZE * 0.22

export type PlayVisibilityState = 'visible' | 'explored' | 'hidden'

export type PlayVisibility = {
  active: boolean
  getCellVisibility: (cellKey: string) => PlayVisibilityState
  getObjectVisibility: (cellKey: string) => PlayVisibilityState
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
  const mergeExploredCells = useDungeonStore((state) => state.mergeExploredCells)

  const visibilityData = useMemo(() => {
    if (tool !== 'play') {
      return {
        visibleCellKeys: [] as string[],
        mask: null as PlayVisibilityMask | null,
      }
    }

    const playerOrigins = Object.values(placedObjects)
      .filter((object) => isVisiblePlayerOrigin(object, paintedCells, layers))
      .map((object) => object.cell)
    const blockingCells = getBlockingCellKeys(placedObjects, layers)
    const visibleCellKeys = computeVisibleCellKeys(
      paintedCells,
      wallOpenings,
      playerOrigins,
      PLAYER_VISION_RANGE,
      blockingCells,
    )
    const mask = computeVisibilityMask(
      paintedCells,
      exploredCells,
      wallOpenings,
      playerOrigins,
      PLAYER_VISION_RANGE,
      blockingCells,
    )

    return { visibleCellKeys, mask }
  }, [exploredCells, layers, paintedCells, placedObjects, tool, wallOpenings])

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
      getObjectVisibility: getCellVisibility,
      mask: visibilityData.mask,
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
  }, [exploredCells, tool, visibilityData.mask, visibilityData.visibleCellKeys])
}

export function isVisiblePlayerOrigin(
  object: DungeonObjectRecord,
  paintedCells: PaintedCells,
  layers: Record<string, Layer>,
) {
  return (
    object.type === 'player' &&
    layers[object.layerId]?.visible !== false &&
    Boolean(paintedCells[getCellKey(object.cell)])
  )
}

export function computeVisibleCellKeys(
  paintedCells: PaintedCells,
  wallOpenings: Record<string, OpeningRecord>,
  origins: GridCell[],
  range: number,
  blockingCellKeys: Iterable<string> = [],
): string[] {
  const openWalls = buildOpenWallSet(wallOpenings)
  const blockingCells = new Set(blockingCellKeys)
  const visible = new Set<string>()
  const paintedCellList = Object.values(paintedCells)

  for (const origin of origins) {
    const originKey = getCellKey(origin)
    if (!paintedCells[originKey] || visible.has(originKey)) {
      continue
    }

    visible.add(originKey)

    for (const target of paintedCellList) {
      const targetKey = getCellKey(target.cell)
      if (visible.has(targetKey)) {
        continue
      }

      const dx = target.cell[0] - origin[0]
      const dz = target.cell[1] - origin[1]
      if (dx * dx + dz * dz > range * range) {
        continue
      }

      if (hasLineOfSight(origin, target.cell, paintedCells, openWalls, blockingCells)) {
        visible.add(targetKey)
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
) {
  if (origin[0] === target[0] && origin[1] === target[1]) {
    return true
  }

  let current: GridCell = [origin[0], origin[1]]
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
      ) && !isBlockingSightCell(viaX, target, blockingCells) && canTraverseAdjacent(
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
      ) && !isBlockingSightCell(viaZ, target, blockingCells) && canTraverseAdjacent(
        viaZ,
        nextDiagonal,
        paintedCells,
        openWalls,
      )

      if (!canPassViaX && !canPassViaZ) {
        return false
      }

      current = nextDiagonal
      if (isBlockingSightCell(current, target, blockingCells)) {
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
      if (isBlockingSightCell(current, target, blockingCells)) {
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
    if (isBlockingSightCell(current, target, blockingCells)) {
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
      )
      const polygon = samples.map((sample) => sample.point)
      const sectors = splitVisibilityPolygonIntoSectors(
        origin,
        samples,
        paintedCells,
        portalLookup,
        blockingCells,
        range * GRID_SIZE,
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
      if (isMaskBlockingCell(current, originCell, blockingCells)) {
        return pointAtDistance(
          origin,
          direction,
          Math.min(maxDistance, distance + (Math.min(nextTMaxX, nextTMaxZ) - distance) * 0.5),
        )
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
      if (isMaskBlockingCell(current, originCell, blockingCells)) {
        return pointAtDistance(
          origin,
          direction,
          Math.min(maxDistance, distance + (Math.min(nextTMaxX, tMaxZ) - distance) * 0.5),
        )
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
    if (isMaskBlockingCell(current, originCell, blockingCells)) {
      return pointAtDistance(
        origin,
        direction,
        Math.min(maxDistance, distance + (Math.min(tMaxX, nextTMaxZ) - distance) * 0.5),
      )
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
    const portal = getOpeningPortalSegment(opening.wallKey, opening.width)
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

function getOpeningPortalSegment(wallKey: string, width: 1 | 2 | 3): PortalSegment {
  const segments = getOpeningSegments(wallKey, width)
  const [xText, zText, directionText] = wallKey.split(':')
  const x = Number.parseInt(xText ?? '', 10)
  const z = Number.parseInt(zText ?? '', 10)
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
      min: minX + MASK_OPENING_INSET,
      max: maxX - MASK_OPENING_INSET,
    })
  }

  const minZ = Math.min(...indices.map((entry) => entry.z)) * GRID_SIZE
  const maxZ = (Math.max(...indices.map((entry) => entry.z)) + 1) * GRID_SIZE
  const fixed = directionText === 'east' ? (x + 1) * GRID_SIZE : x * GRID_SIZE
  return normalizePortalSegment({
    orientation: 'vertical',
    fixed,
    min: minZ + MASK_OPENING_INSET,
    max: maxZ - MASK_OPENING_INSET,
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

function getBlockingCellKeys(
  placedObjects: Record<string, DungeonObjectRecord>,
  layers: Record<string, Layer>,
) {
  const blockingCells = new Set<string>()

  for (const object of Object.values(placedObjects)) {
    if (layers[object.layerId]?.visible === false) {
      continue
    }

    const asset = object.assetId ? getContentPackAssetById(object.assetId) : null
    if (!asset?.metadata?.blocksLineOfSight || asset.metadata.connectsTo !== 'FLOOR') {
      continue
    }

    blockingCells.add(getCellKey(object.cell))
  }

  return blockingCells
}

function isBlockingSightCell(
  cell: GridCell,
  target: GridCell,
  blockingCells: Set<string>,
) {
  return (cell[0] !== target[0] || cell[1] !== target[1]) && blockingCells.has(getCellKey(cell))
}
