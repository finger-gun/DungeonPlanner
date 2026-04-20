import { describe, expect, it } from 'vitest'
import { GRID_SIZE } from '../../hooks/useSnapToGrid'
import { wallKeyToWorldPosition } from '../../store/wallSegments'
import { getRoomWallBrushAnchor, getRoomWallBrushTargets } from './roomWallBrush'

function makePaintedCells(entries: Array<{ cell: [number, number]; roomId: string | null }>) {
  return Object.fromEntries(entries.map(({ cell, roomId }) => [
    `${cell[0]}:${cell[1]}`,
    { cell, layerId: 'default', roomId },
  ]))
}

describe('roomWallBrush', () => {
  it('locks inner wall painting to the starting wall axis', () => {
    const paintedCells = makePaintedCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-a' },
      { cell: [0, 1], roomId: 'room-a' },
      { cell: [1, 1], roomId: 'room-a' },
      { cell: [2, 1], roomId: 'room-a' },
    ])
    const anchor = getRoomWallBrushAnchor({ wallKey: '0:0:north', kind: 'inner' })
    const wallPosition = wallKeyToWorldPosition('0:0:north')

    expect(anchor).not.toBeNull()
    expect(wallPosition).not.toBeNull()

    const targets = getRoomWallBrushTargets(
      anchor!,
      {
        x: wallPosition!.position[0] + GRID_SIZE * 2,
        z: wallPosition!.position[2] + GRID_SIZE * 4,
      },
      paintedCells,
      {},
      new Set<string>(),
      'paint',
    )

    expect(targets).toEqual([
      { wallKey: '0:0:north', kind: 'inner' },
      { wallKey: '1:0:north', kind: 'inner' },
      { wallKey: '2:0:north', kind: 'inner' },
    ])
  })

  it('stops erase runs when the locked shared-wall line hits a gap', () => {
    const paintedCells = makePaintedCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-a' },
      { cell: [0, 1], roomId: 'room-b' },
      { cell: [1, 1], roomId: 'room-b' },
      { cell: [2, 1], roomId: 'room-b' },
    ])
    const anchor = getRoomWallBrushAnchor({ wallKey: '0:0:north', kind: 'shared' })
    const wallPosition = wallKeyToWorldPosition('0:0:north')

    expect(anchor).not.toBeNull()
    expect(wallPosition).not.toBeNull()

    const targets = getRoomWallBrushTargets(
      anchor!,
      {
        x: wallPosition!.position[0] + GRID_SIZE * 2,
        z: wallPosition!.position[2] - GRID_SIZE * 3,
      },
      paintedCells,
      {},
      new Set<string>(['1:0:north']),
      'erase',
    )

    expect(targets).toEqual([{ wallKey: '0:0:north', kind: 'shared' }])
  })

  it('treats suppressed shared walls as paint targets so deleted walls can be restored', () => {
    const paintedCells = makePaintedCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [0, 1], roomId: 'room-b' },
      { cell: [1, 1], roomId: 'room-b' },
    ])
    const anchor = getRoomWallBrushAnchor({ wallKey: '0:0:north', kind: 'shared' })
    const wallPosition = wallKeyToWorldPosition('0:0:north')

    expect(anchor).not.toBeNull()
    expect(wallPosition).not.toBeNull()

    const targets = getRoomWallBrushTargets(
      anchor!,
      {
        x: wallPosition!.position[0] + GRID_SIZE,
        z: wallPosition!.position[2] + GRID_SIZE * 2,
      },
      paintedCells,
      {},
      new Set<string>(['0:0:north', '1:0:north']),
      'paint',
    )

    expect(targets).toEqual([
      { wallKey: '0:0:north', kind: 'shared' },
      { wallKey: '1:0:north', kind: 'shared' },
    ])
  })
})
