import { describe, expect, it } from 'vitest'
import { buildSplineWallGraphFromPaintedCells } from '../../store/splineWalls'
import { buildRoomFloorMaskData, buildRoomFloorMaskGeometry } from './roomFloorMask'

describe('roomFloorMask', () => {
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
})
