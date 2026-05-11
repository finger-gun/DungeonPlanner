import * as THREE from 'three'
import { beforeEach, describe, expect, it } from 'vitest'
import { GRID_SIZE, cellToWorldPosition } from '../../hooks/useSnapToGrid'
import { buildRoomDraftCells, buildRoomDraftSplineNodes, createRoomDraftFromStroke, setRoomDraftCorner } from '../../store/roomDraft'
import { buildRoomDraftOccupancyPolygons, clipRoomDraft } from '../../store/roomDraftClip'
import {
  buildRoomSplineWallChainsFromGraph,
  buildSampledSplineWallFrames,
  buildSplineWallGraphFromPaintedCells,
} from '../../store/splineWalls'
import { useDungeonStore } from '../../store/useDungeonStore'
import { buildRoomFloorMaskData, buildRoomFloorMaskGeometry } from './roomFloorMask'

describe('roomFloorMask', () => {
  beforeEach(() => {
    useDungeonStore.getState().reset()
  })

  it('prefers graph polygons over legacy square cells for graph-backed rooms', () => {
    const graph = buildSplineWallGraphFromPaintedCells({
      '0:0': { cell: [0, 0], layerId: 'main', roomId: 'room-a' },
      '1:0': { cell: [1, 0], layerId: 'main', roomId: 'room-a' },
      '0:1': { cell: [0, 1], layerId: 'main', roomId: 'room-a' },
      '1:1': { cell: [1, 1], layerId: 'main', roomId: 'room-a' },
    })

    const maskData = buildRoomFloorMaskData({
      paintedCellRecords: [
        { cell: [0, 0], layerId: 'main', roomId: 'room-a' },
        { cell: [1, 0], layerId: 'main', roomId: 'room-a' },
        { cell: [2, 0], layerId: 'main', roomId: 'room-b' },
      ],
      layers: {
        main: { id: 'main', name: 'Main', visible: true, locked: false },
      },
      splineWallGraph: graph,
    })

    expect(maskData.polygons).toHaveLength(1)
    expect(maskData.legacyCells).toEqual([[2, 0]])

    const geometry = buildRoomFloorMaskGeometry(maskData)
    expect(geometry).toBeTruthy()
    geometry?.dispose()
  })

  it('keeps the surviving graph-backed room fully masked after deleting a shared rounded neighbor', () => {
    const { ownerRoomId, overlappingRoomId } = commitRoundedOverlapRoomPair()
    useDungeonStore.getState().removeRoom(ownerRoomId)

    const state = useDungeonStore.getState()
    const maskData = buildRoomFloorMaskData({
      paintedCellRecords: Object.values(state.paintedCells),
      layers: state.layers,
      splineWallGraph: state.splineWallGraph,
    })
    const geometry = buildRoomFloorMaskGeometry(maskData)
    expect(geometry).toBeTruthy()
    if (!geometry) {
      return
    }

    const chains = buildRoomSplineWallChainsFromGraph(state.splineWallGraph)
    const remainingChain = chains.find((chain) => chain.roomId === overlappingRoomId)
    expect(remainingChain).toBeDefined()
    if (!remainingChain) {
      geometry.dispose()
      return
    }

    const polygon = buildSampledSplineWallFrames(remainingChain, {
      curveSubdivisions: 12,
    }).map((frame) => frame.position)
    expect(maskData.polygons).toHaveLength(1)
    expect(maskData.polygons[0]?.points).toEqual(polygon)
    const uncoveredSamples = collectUncoveredInteriorSamples(
      geometry,
      polygon,
      Object.values(state.paintedCells)
        .filter((record) => record.roomId === overlappingRoomId)
        .map((record) => record.cell),
    )

    geometry.dispose()
    expect(uncoveredSamples).toEqual([])
  })
})

function commitRoundedOverlapRoomPair() {
  const ownerDraft = setRoomDraftCorner(
    setRoomDraftCorner(createRoomDraftFromStroke([0, 0], [2, 2]), 'ne', 'rounded', 1),
    'se',
    'rounded',
    1,
  )
  const ownerRoomId = useDungeonStore.getState().commitDraftRoom({
    cells: buildRoomDraftCells(ownerDraft),
    splineNodes: buildRoomDraftSplineNodes(ownerDraft),
  })
  expect(ownerRoomId).toBeTruthy()

  const state = useDungeonStore.getState()
  const clipped = clipRoomDraft(
    createRoomDraftFromStroke([2, 0], [4, 2]),
    buildRoomDraftOccupancyPolygons(state.paintedCells, state.splineWallGraph),
    new Set(Object.keys(state.paintedCells)),
  )
  expect(clipped.valid).toBe(true)

  const overlappingRoomId = useDungeonStore.getState().commitDraftRoom({
    cells: clipped.commitCells,
    splineNodes: clipped.splineNodes,
  })
  expect(overlappingRoomId).toBeTruthy()

  return {
    ownerRoomId: ownerRoomId!,
    overlappingRoomId: overlappingRoomId!,
  }
}

function collectUncoveredInteriorSamples(
  geometry: THREE.BufferGeometry,
  polygon: readonly (readonly [number, number])[],
  cells: readonly (readonly [number, number])[],
) {
  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }),
  )
  mesh.updateMatrixWorld(true)

  const uncovered: Array<[number, number]> = []
  const sampleOffsets = [-0.8, -0.4, 0, 0.4, 0.8]

  for (const cell of cells) {
    const [centerX, , centerZ] = cellToWorldPosition(cell as [number, number])
    for (const offsetX of sampleOffsets) {
      for (const offsetZ of sampleOffsets) {
        const sample: [number, number] = [
          centerX + offsetX * (GRID_SIZE / 2),
          centerZ + offsetZ * (GRID_SIZE / 2),
        ]
        if (!isPointInPolygon(sample, polygon)) {
          continue
        }
        if (maskContainsPoint(mesh, sample)) {
          continue
        }
        uncovered.push([Number(sample[0].toFixed(3)), Number(sample[1].toFixed(3))])
      }
    }
  }

  mesh.material.dispose()
  return uncovered
}

function maskContainsPoint(mesh: THREE.Mesh, [x, z]: readonly [number, number]) {
  const raycaster = new THREE.Raycaster(
    new THREE.Vector3(x, 1, z),
    new THREE.Vector3(0, -1, 0),
    0,
    2,
  )
  return raycaster.intersectObject(mesh, false).length > 0
}

function isPointInPolygon(
  [x, z]: readonly [number, number],
  polygon: readonly (readonly [number, number])[],
) {
  let inside = false

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index, index += 1) {
    const [currentX, currentZ] = polygon[index]!
    const [previousX, previousZ] = polygon[previous]!
    const crosses = ((currentZ > z) !== (previousZ > z))
      && (x < ((previousX - currentX) * (z - currentZ)) / ((previousZ - currentZ) || Number.EPSILON) + currentX)
    if (crosses) {
      inside = !inside
    }
  }

  return inside
}
