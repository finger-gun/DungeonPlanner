import { describe, expect, it } from 'vitest'
import { getRoomPreviewCells } from './gridPreview'
import type { PaintedCells } from '../../store/useDungeonStore'

function makePaintedCells(entries: Array<{ cell: [number, number]; roomId: string | null }>): PaintedCells {
  return Object.fromEntries(entries.map(({ cell, roomId }) => [
    `${cell[0]}:${cell[1]}`,
    { cell, layerId: 'default', roomId },
  ]))
}

describe('getRoomPreviewCells', () => {
  it('shows the hovered room preview by default', () => {
    expect(getRoomPreviewCells({
      hoveredCell: {
        cell: [2, 3],
        key: '2:3',
        position: [5, 0, 7],
      },
      paintedCells: {},
      strokeCurrentCell: null,
      strokeMode: null,
      strokeStartCell: null,
      suppressRoomPreview: false,
      tool: 'room',
    })).toEqual([[2, 3]])
  })

  it('hides the hovered room preview while a resize handle is active', () => {
    expect(getRoomPreviewCells({
      hoveredCell: {
        cell: [2, 3],
        key: '2:3',
        position: [5, 0, 7],
      },
      paintedCells: makePaintedCells([{ cell: [0, 0], roomId: 'room-a' }]),
      strokeCurrentCell: null,
      strokeMode: null,
      strokeStartCell: null,
      suppressRoomPreview: true,
      tool: 'room',
    })).toEqual([])
  })

  it('keeps a latched preview visible after commit when no active stroke remains', () => {
    expect(getRoomPreviewCells({
      hoveredCell: {
        cell: [2, 3],
        key: '2:3',
        position: [5, 0, 7],
      },
      latchedPreviewCells: [[4, 4], [5, 4]],
      paintedCells: {},
      strokeCurrentCell: null,
      strokeMode: null,
      strokeStartCell: null,
      suppressRoomPreview: false,
      tool: 'room',
    })).toEqual([[4, 4], [5, 4]])
  })
})
