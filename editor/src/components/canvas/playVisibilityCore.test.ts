import { describe, expect, it } from 'vitest'
import { computeVisibilityMask, computeVisibleCellKeys } from './playVisibilityCore'
import type { PaintedCells } from '../../store/useDungeonStore'

function makeCells(entries: Array<{ cell: [number, number]; roomId?: string | null }>): PaintedCells {
  return Object.fromEntries(
    entries.map(({ cell, roomId = null }) => [
      `${cell[0]}:${cell[1]}`,
      { cell, layerId: 'default', roomId },
    ]),
  )
}

describe('computeVisibleCellKeys', () => {
  it('casts visibility from every player even when another player already revealed their cell', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-a' },
      { cell: [2, 0], roomId: 'room-a' },
      { cell: [3, 0], roomId: 'room-a' },
    ])

    expect(computeVisibleCellKeys(paintedCells, {}, [[0, 0], [2, 0]], 2)).toEqual(
      expect.arrayContaining(['0:0', '1:0', '2:0', '3:0']),
    )
  })

  it('passes through wall segments with open wall state', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
    ])

    expect(
      computeVisibleCellKeys(
        paintedCells,
        {},
        [[0, 0]],
        3,
        [],
        new Map(),
        new Set(),
        { '0:0:east': { open: true } },
      ),
    ).toEqual(expect.arrayContaining(['0:0', '1:0']))
  })
})

describe('computeVisibilityMask', () => {
  it('treats opened wall state as a full-width LOS portal', () => {
    const paintedCells = makeCells([
      { cell: [0, 0], roomId: 'room-a' },
      { cell: [1, 0], roomId: 'room-b' },
      { cell: [2, 0], roomId: 'room-c' },
      { cell: [1, 1], roomId: 'room-b' },
      { cell: [2, 1], roomId: 'room-c' },
    ])

    const mask = computeVisibilityMask(paintedCells, {}, {}, [[0, 0]], 3, [], new Map(), new Set(), {
      '0:0:east': { open: true },
    })

    expect(mask).not.toBeNull()
    expect(mask?.sources[0]?.polygon.some((point) => point[0] > 2.3)).toBe(true)
  })
})
