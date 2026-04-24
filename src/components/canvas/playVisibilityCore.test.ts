import { describe, expect, it } from 'vitest'
import { computeVisibleCellKeys } from './playVisibilityCore'
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
})
