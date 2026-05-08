import * as THREE from 'three'
import {
  extractSplineWallComputePrototypeGeometry,
  populateSplineWallComputePrototypeFallbackOutputs,
  prepareSplineWallComputePrototype,
} from './gpu'
import type { FloorDirtyInfo } from '../store/floorDirtyDomains'
import type { PaintedCells } from '../store/useDungeonStore'
import type { SplineWallGraph } from '../store/splineWallGraph'
import {
  buildRoomSplineWallMeshes,
  type RoomSplineWallMeshData,
} from '../store/splineWalls'

export type SplineWallRenderEntry = {
  roomId: string
  geometry: THREE.BufferGeometry
}

type FloorSplineWallRenderResource = {
  floorId: string
  sourceKey: string | null
  mode: 'graph' | 'painted' | null
  visibleLayerKey: string
  suppressedWallKey: string
  entriesByRoom: Map<string, SplineWallRenderEntry>
  entries: SplineWallRenderEntry[]
}

const floorSplineWallRenderResources = new Map<string, FloorSplineWallRenderResource>()
const sourceIdentityCache = new WeakMap<object, number>()
let nextSourceIdentity = 1

export function getCachedSplineWallRenderEntries({
  floorId,
  paintedCells,
  splineWallGraph,
  visibleLayerIds,
  suppressedWallKeys,
  dirtyInfo = null,
}: {
  floorId: string
  paintedCells: PaintedCells
  splineWallGraph: SplineWallGraph
  visibleLayerIds: ReadonlySet<string>
  suppressedWallKeys: ReadonlySet<string>
  dirtyInfo?: FloorDirtyInfo | null
}) {
  const mode: 'graph' | 'painted' = Object.keys(splineWallGraph.paths).length > 0 ? 'graph' : 'painted'
  const visibleLayerKey = buildSetKey(visibleLayerIds)
  const suppressedWallKey = buildSetKey(suppressedWallKeys)
  const sourceKey = buildSplineWallRenderSourceKey({
    mode,
    paintedCells,
    splineWallGraph,
    visibleLayerKey,
    suppressedWallKey,
  })
  const resource = getOrCreateFloorSplineWallRenderResource(floorId)
  if (resource.sourceKey === sourceKey) {
    return resource.entries
  }

  const affectedRoomIds = resolveAffectedSplineWallRoomIds({
    mode,
    paintedCells,
    splineWallGraph,
    dirtyInfo,
  })
  const canPatchRooms =
    resource.mode === mode
    && resource.visibleLayerKey === visibleLayerKey
    && resource.suppressedWallKey === suppressedWallKey
    && affectedRoomIds
    && affectedRoomIds.size > 0

  if (canPatchRooms) {
    const nextMeshes = mode === 'graph'
      ? buildRoomSplineWallMeshesFromComputePrototype({
          floorId,
          splineWallGraph,
          visibleLayerIds,
          suppressedWallKeys,
          roomIds: affectedRoomIds,
        })
      : buildRoomSplineWallMeshes(paintedCells, suppressedWallKeys, {}, affectedRoomIds)
    applyRoomMeshUpdates(resource, affectedRoomIds, nextMeshes)
    resource.entries = [...resource.entriesByRoom.values()]
  } else {
    const nextMeshes = mode === 'graph'
      ? buildRoomSplineWallMeshesFromComputePrototype({
          floorId,
          splineWallGraph,
          visibleLayerIds,
          suppressedWallKeys,
        })
      : buildRoomSplineWallMeshes(paintedCells, suppressedWallKeys)
    replaceAllRoomMeshes(resource, nextMeshes)
  }

  resource.sourceKey = sourceKey
  resource.mode = mode
  resource.visibleLayerKey = visibleLayerKey
  resource.suppressedWallKey = suppressedWallKey

  return resource.entries
}

export function pruneSplineWallRenderCache(retainedFloorIds: Iterable<string>) {
  const retainedFloorIdSet = new Set(retainedFloorIds)
  for (const [floorId, resource] of floorSplineWallRenderResources.entries()) {
    if (retainedFloorIdSet.has(floorId)) {
      continue
    }

    resource.entriesByRoom.forEach((entry) => entry.geometry.dispose())
    floorSplineWallRenderResources.delete(floorId)
  }
}

export function clearSplineWallRenderCache() {
  pruneSplineWallRenderCache([])
}

export function getSplineWallRenderCacheStats() {
  return {
    floorIds: [...floorSplineWallRenderResources.keys()],
    geometryCount: [...floorSplineWallRenderResources.values()].reduce(
      (sum, resource) => sum + resource.entriesByRoom.size,
      0,
    ),
  }
}

export function getSplineWallRenderCacheSourceKey(floorId: string) {
  return floorSplineWallRenderResources.get(floorId)?.sourceKey ?? null
}

export function applyComputedSplineWallRenderEntry({
  floorId,
  roomId,
  expectedSourceKey,
  meshData,
}: {
  floorId: string
  roomId: string
  expectedSourceKey: string | null
  meshData: RoomSplineWallMeshData
}) {
  const resource = floorSplineWallRenderResources.get(floorId)
  if (!resource || resource.sourceKey !== expectedSourceKey) {
    return false
  }

  upsertSplineWallRenderEntry(resource.entriesByRoom, {
    ...meshData,
    roomId,
  })
  resource.entries = [...resource.entriesByRoom.values()]
  return true
}

function getOrCreateFloorSplineWallRenderResource(floorId: string) {
  const existing = floorSplineWallRenderResources.get(floorId)
  if (existing) {
    return existing
  }

  const nextResource = {
    floorId,
    sourceKey: null,
    mode: null,
    visibleLayerKey: '',
    suppressedWallKey: '',
    entriesByRoom: new Map<string, SplineWallRenderEntry>(),
    entries: [],
  } satisfies FloorSplineWallRenderResource
  floorSplineWallRenderResources.set(floorId, nextResource)
  return nextResource
}

function replaceAllRoomMeshes(
  resource: FloorSplineWallRenderResource,
  nextMeshes: RoomSplineWallMeshData[],
) {
  const nextRoomIds = new Set(nextMeshes.map((mesh) => mesh.roomId))
  for (const [roomId, entry] of resource.entriesByRoom.entries()) {
    if (nextRoomIds.has(roomId)) {
      continue
    }

    entry.geometry.dispose()
    resource.entriesByRoom.delete(roomId)
  }

  resource.entries = nextMeshes.map((meshData) =>
    upsertSplineWallRenderEntry(resource.entriesByRoom, meshData))
}

function applyRoomMeshUpdates(
  resource: FloorSplineWallRenderResource,
  roomIds: ReadonlySet<string>,
  nextMeshes: RoomSplineWallMeshData[],
) {
  const nextMeshByRoomId = new Map(nextMeshes.map((mesh) => [mesh.roomId, mesh]))

  roomIds.forEach((roomId) => {
    const nextMesh = nextMeshByRoomId.get(roomId)
    if (!nextMesh) {
      const existingEntry = resource.entriesByRoom.get(roomId)
      if (existingEntry) {
        existingEntry.geometry.dispose()
        resource.entriesByRoom.delete(roomId)
      }
      return
    }

    upsertSplineWallRenderEntry(resource.entriesByRoom, nextMesh)
  })
}

function upsertSplineWallRenderEntry(
  entriesByRoom: Map<string, SplineWallRenderEntry>,
  meshData: RoomSplineWallMeshData,
) {
  const existingEntry = entriesByRoom.get(meshData.roomId)
  if (existingEntry) {
    applySplineWallMeshDataToGeometry(existingEntry.geometry, meshData)
    return existingEntry
  }

  const geometry = new THREE.BufferGeometry()
  applySplineWallMeshDataToGeometry(geometry, meshData)
  const nextEntry = {
    roomId: meshData.roomId,
    geometry,
  } satisfies SplineWallRenderEntry
  entriesByRoom.set(meshData.roomId, nextEntry)
  return nextEntry
}

export function applySplineWallMeshDataToGeometry(
  geometry: THREE.BufferGeometry,
  meshData: RoomSplineWallMeshData,
) {
  geometry.setAttribute('position', new THREE.BufferAttribute(meshData.positions, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(meshData.normals, 3))
  geometry.setAttribute('uv', new THREE.BufferAttribute(meshData.uvs, 2))
  geometry.setAttribute('uv1', new THREE.BufferAttribute(meshData.uvs.slice(), 2))
  geometry.setAttribute('uv2', new THREE.BufferAttribute(meshData.uvs.slice(), 2))
  const groupedIndexData = buildSplineWallMaterialGroupedIndexData(meshData)
  geometry.setIndex(new THREE.BufferAttribute(groupedIndexData.indices, 1))
  geometry.clearGroups()
  if (groupedIndexData.sideIndexCount > 0) {
    geometry.addGroup(0, groupedIndexData.sideIndexCount, 0)
  }
  if (groupedIndexData.topIndexCount > 0) {
    geometry.addGroup(groupedIndexData.sideIndexCount, groupedIndexData.topIndexCount, 1)
  }
  geometry.computeBoundingSphere()
}

export function buildSplineWallMaterialGroupedIndexData(meshData: Pick<RoomSplineWallMeshData, 'indices' | 'normals'>) {
  const sideIndices: number[] = []
  const topIndices: number[] = []

  for (let index = 0; index < meshData.indices.length; index += 3) {
    const a = meshData.indices[index]
    const b = meshData.indices[index + 1]
    const c = meshData.indices[index + 2]
    if (a === undefined || b === undefined || c === undefined) {
      continue
    }

    const target = isTopFacingTriangle(meshData.normals, a, b, c) ? topIndices : sideIndices
    target.push(a, b, c)
  }

  return {
    indices: new Uint32Array([...sideIndices, ...topIndices]),
    sideIndexCount: sideIndices.length,
    topIndexCount: topIndices.length,
  }
}

function isTopFacingTriangle(
  normals: Float32Array,
  a: number,
  b: number,
  c: number,
) {
  return (
    getNormalY(normals, a) >= 0.99
    && getNormalY(normals, b) >= 0.99
    && getNormalY(normals, c) >= 0.99
  )
}

function getNormalY(normals: Float32Array, vertexIndex: number) {
  return normals[(vertexIndex * 3) + 1] ?? 0
}

function buildSplineWallRenderSourceKey({
  mode,
  paintedCells,
  splineWallGraph,
  visibleLayerKey,
  suppressedWallKey,
}: {
  mode: 'graph' | 'painted'
  paintedCells: PaintedCells
  splineWallGraph: SplineWallGraph
  visibleLayerKey: string
  suppressedWallKey: string
}) {
  return [
    mode === 'graph'
      ? `graph:${getSourceIdentity(splineWallGraph)}`
      : `painted:${getSourceIdentity(paintedCells)}`,
    `layers:${visibleLayerKey}`,
    `suppressed:${suppressedWallKey}`,
  ].join('|')
}

function resolveAffectedSplineWallRoomIds({
  mode,
  paintedCells,
  splineWallGraph,
  dirtyInfo,
}: {
  mode: 'graph' | 'painted'
  paintedCells: PaintedCells
  splineWallGraph: SplineWallGraph
  dirtyInfo: FloorDirtyInfo | null | undefined
}) {
  if (!dirtyInfo || dirtyInfo.fullRefresh) {
    return null
  }

  if (mode === 'graph') {
    const roomIds = new Set(
      Object.values(splineWallGraph.segments)
        .filter((segment) => segment.wallKey && dirtyInfo.dirtyWallKeys.includes(segment.wallKey))
        .map((segment) => segment.roomId)
        .filter((roomId): roomId is string => typeof roomId === 'string' && roomId.length > 0),
    )
    return roomIds.size > 0 ? roomIds : null
  }

  const roomIds = new Set(
    dirtyInfo.dirtyCellKeys
      .map((cellKey) => paintedCells[cellKey]?.roomId)
      .filter((roomId): roomId is string => typeof roomId === 'string' && roomId.length > 0),
  )
  return roomIds.size > 0 ? roomIds : null
}

function buildSetKey(values: ReadonlySet<string>) {
  return [...values].sort().join(',')
}

function buildRoomSplineWallMeshesFromComputePrototype({
  floorId,
  splineWallGraph,
  visibleLayerIds,
  suppressedWallKeys,
  roomIds = null,
}: {
  floorId: string
  splineWallGraph: SplineWallGraph
  visibleLayerIds: ReadonlySet<string>
  suppressedWallKeys: ReadonlySet<string>
  roomIds?: ReadonlySet<string> | null
}) {
  const targetRoomIds = roomIds
    ? [...roomIds].sort()
    : [...new Set(
        Object.values(splineWallGraph.paths)
          .filter((path) => visibleLayerIds.has(path.layerId))
          .map((path) => path.roomId)
          .filter((roomId): roomId is string => typeof roomId === 'string' && roomId.length > 0),
      )].sort()

  return targetRoomIds.flatMap((roomId) => {
    const prototype = prepareSplineWallComputePrototype({
      floorId,
      splineWallGraph,
      visibleLayerIds,
      suppressedWallKeys,
      roomIds: new Set([roomId]),
    })
    if (!prototype) {
      return []
    }

    populateSplineWallComputePrototypeFallbackOutputs(prototype.packed)
    return [{
      roomId,
      ...extractSplineWallComputePrototypeGeometry(prototype.packed),
    }]
  })
}

function getSourceIdentity(value: object) {
  const cached = sourceIdentityCache.get(value)
  if (cached) {
    return cached
  }

  const identity = nextSourceIdentity
  nextSourceIdentity += 1
  sourceIdentityCache.set(value, identity)
  return identity
}
