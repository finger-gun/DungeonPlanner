import { describe, expect, it } from 'vitest'
import {
  areGridCellArraysEqual,
  areRoomBoundsEqual,
  shouldUpdateRoomResizeDragState,
} from './roomResizeDragState'

describe('roomResizeDragState', () => {
  it('treats identical bounds as unchanged', () => {
    expect(areRoomBoundsEqual(
      { minX: 0, maxX: 2, minZ: 1, maxZ: 3 },
      { minX: 0, maxX: 2, minZ: 1, maxZ: 3 },
    )).toBe(true)
  })

  it('treats identical cell arrays as unchanged', () => {
    expect(areGridCellArraysEqual([[0, 0], [1, 0]], [[0, 0], [1, 0]])).toBe(true)
    expect(areGridCellArraysEqual([[0, 0], [1, 0]], [[1, 0], [0, 0]])).toBe(false)
  })

  it('skips resize drag updates when the snapped rect bounds do not change', () => {
    expect(shouldUpdateRoomResizeDragState(
      {
        kind: 'rect',
        handle: { kind: 'edge', edge: 'east' },
        bounds: { minX: 0, maxX: 2, minZ: 0, maxZ: 2 },
        valid: true,
      },
      {
        kind: 'rect',
        handle: { kind: 'edge', edge: 'east' },
        bounds: { minX: 0, maxX: 2, minZ: 0, maxZ: 2 },
        valid: true,
      },
    )).toBe(false)
  })

  it('skips resize drag updates when run cells and boundary do not change', () => {
    expect(shouldUpdateRoomResizeDragState(
      {
        kind: 'run',
        run: { direction: 'north', line: 1, start: 0, end: 1 },
        boundary: 2,
        cells: [[0, 0], [0, 1]],
        valid: true,
      },
      {
        kind: 'run',
        run: { direction: 'north', line: 1, start: 0, end: 1 },
        boundary: 2,
        cells: [[0, 0], [0, 1]],
        valid: true,
      },
    )).toBe(false)
  })
})
