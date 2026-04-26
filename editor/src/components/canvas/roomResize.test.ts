import { describe, expect, it } from 'vitest'
import { getCornerHandleLayout, getEdgeProps } from './roomResizeHandleLayout'
import {
  canResizeRoomToBounds,
  getResizedRoomCellsForRun,
  getRoomBoundaryRuns,
  getCornerBoundary,
  getRoomBounds,
  getRoomOutlineSegments,
  isRectangularRoom,
  resizeBoundsFromCorner,
  resizeBoundsFromEdge,
} from '../../store/roomResize'
import type { PaintedCells } from '../../store/useDungeonStore'

function makePaintedCells(entries: Array<{ cell: [number, number]; roomId: string | null }>): PaintedCells {
  return Object.fromEntries(entries.map(({ cell, roomId }) => [
    `${cell[0]}:${cell[1]}`,
    { cell, layerId: 'default', roomId },
  ]))
}

describe('roomResize', () => {
  it('computes bounds for a rectangular room', () => {
    const paintedCells = makePaintedCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [0, 1], roomId: 'room-a' },
      { cell: [1, 1], roomId: 'room-a' },
    ])

    expect(getRoomBounds('room-a', paintedCells)).toEqual({
      minX: 0,
      maxX: 1,
      minZ: 0,
      maxZ: 1,
    })
    expect(isRectangularRoom('room-a', paintedCells)).toBe(true)
  })

  it('detects non-rectangular rooms', () => {
    const paintedCells = makePaintedCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [0, 1], roomId: 'room-a' },
    ])

    expect(isRectangularRoom('room-a', paintedCells)).toBe(false)
  })

  it('builds an outline for non-rectangular rooms', () => {
    const paintedCells = makePaintedCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [0, 1], roomId: 'room-a' },
    ])

    const outline = getRoomOutlineSegments('room-a', paintedCells)

    expect(outline).toHaveLength(8)
    expect(outline).toContainEqual({
      position: [2, 0, 3],
      size: [0.08, 0.02, 2],
    })
    expect(outline).toContainEqual({
      position: [3, 0, 2],
      size: [2, 0.02, 0.08],
    })
  })

  it('merges exposed non-rectangular edges into draggable runs', () => {
    const paintedCells = makePaintedCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [0, 1], roomId: 'room-a' },
    ])

    expect(getRoomBoundaryRuns('room-a', paintedCells)).toContainEqual({
      direction: 'north',
      line: 1,
      start: 1,
      end: 1,
    })
    expect(getRoomBoundaryRuns('room-a', paintedCells)).toContainEqual({
      direction: 'west',
      line: 0,
      start: 0,
      end: 1,
    })
  })

  it('prevents resizing into another room', () => {
    const paintedCells = makePaintedCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-b' },
    ])

    expect(canResizeRoomToBounds('room-a', {
      minX: 0,
      maxX: 2,
      minZ: 0,
      maxZ: 0,
    }, paintedCells)).toBe(false)
  })

  it('resizes from a dragged corner while keeping at least one cell', () => {
    const bounds = { minX: 0, maxX: 1, minZ: 0, maxZ: 1 }

    expect(getCornerBoundary(bounds, 'ne')).toEqual([2, 2])
    expect(resizeBoundsFromCorner(bounds, 'ne', 4, 3)).toEqual({
      minX: 0,
      maxX: 3,
      minZ: 0,
      maxZ: 2,
    })
    expect(resizeBoundsFromCorner(bounds, 'ne', 0, 1)).toEqual({
      minX: 0,
      maxX: 0,
      minZ: 0,
      maxZ: 0,
    })
  })

  it('resizes from a dragged edge in one direction only', () => {
    const bounds = { minX: 0, maxX: 2, minZ: 0, maxZ: 2 }

    expect(resizeBoundsFromEdge(bounds, 'north', 5)).toEqual({
      minX: 0,
      maxX: 2,
      minZ: 0,
      maxZ: 4,
    })
    expect(resizeBoundsFromEdge(bounds, 'west', 2)).toEqual({
      minX: 2,
      maxX: 2,
      minZ: 0,
      maxZ: 2,
    })
  })

  it('resizes a non-rectangular room by dragging an exposed run', () => {
    const paintedCells = makePaintedCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [0, 1], roomId: 'room-a' },
    ])
    const run = { direction: 'north', line: 1, start: 1, end: 1 } as const

    expect(getResizedRoomCellsForRun('room-a', paintedCells, run, 2)).toEqual(
      expect.arrayContaining([[0, 0], [1, 0], [0, 1], [1, 1]]),
    )
    expect(getResizedRoomCellsForRun('room-a', paintedCells, run, 0)).toEqual(
      expect.arrayContaining([[0, 0], [0, 1]]),
    )
  })

  it('keeps edge hit targets away from the corners', () => {
    const edge = getEdgeProps('north', {
      minX: 0,
      maxX: 4,
      minZ: 0,
      maxZ: 4,
    }, 2, 2, 4, 4)

    expect(edge.size[0]).toBe(4)
    expect(edge.hitScale[0]).toBeLessThan(edge.size[0])
  })

  it('uses a larger invisible hit target for corners', () => {
    const corner = getCornerHandleLayout()

    expect(corner.hitScale[0]).toBeGreaterThan(corner.visibleScale[0])
    expect(corner.hitScale[2]).toBeGreaterThan(corner.visibleScale[2])
  })
})
