import { describe, expect, it } from 'vitest'
import { GRID_SIZE } from '../hooks/useSnapToGrid'
import {
  buildRoomDraftCells,
  buildRoomDraftSplineNodes,
  buildRoomDraftWorldPoints,
  createRoomDraftFromStroke,
  getRoomDraftCornerAmountFromWorldPoint,
  setRoomDraftCorner,
} from './roomDraft'

describe('roomDraft', () => {
  it('builds a square room footprint from a drag stroke', () => {
    const draft = createRoomDraftFromStroke([0, 0], [1, 1])

    expect(buildRoomDraftCells(draft)).toEqual(expect.arrayContaining([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]))
    expect(buildRoomDraftWorldPoints(draft)).toEqual([
      [0, 2 * GRID_SIZE],
      [2 * GRID_SIZE, 2 * GRID_SIZE],
      [2 * GRID_SIZE, 0],
      [0, 0],
    ])
  })

  it('turns corner drags into rounded footprints and spline node metadata', () => {
    const rounded = setRoomDraftCorner(createRoomDraftFromStroke([0, 0], [2, 2]), 'nw', 'rounded', 1)

    const points = buildRoomDraftWorldPoints(rounded)
    expect(points.length).toBeGreaterThan(4)

    expect(buildRoomDraftSplineNodes(rounded)[0]).toEqual({
      position: [0, 3],
      cornerMode: 'rounded',
      cornerAmount: 1,
    })
  })

  it('keeps tiles under a diagonal wall span floored', () => {
    const diagonal = setRoomDraftCorner(createRoomDraftFromStroke([0, 0], [1, 1]), 'nw', 'diagonal', 1)

    expect(buildRoomDraftCells(diagonal)).toEqual(expect.arrayContaining([
      [0, 0],
      [1, 0],
      [0, 1],
      [1, 1],
    ]))
  })

  it('still removes corner tiles that the diagonal does not cross', () => {
    const diagonal = setRoomDraftCorner(createRoomDraftFromStroke([0, 0], [3, 3]), 'nw', 'diagonal', 2)
    const cells = buildRoomDraftCells(diagonal)

    expect(cells).toEqual(expect.arrayContaining([
      [0, 0],
      [1, 0],
      [2, 0],
      [3, 0],
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
      [1, 3],
      [2, 3],
      [3, 3],
    ]))
    expect(cells).not.toEqual(expect.arrayContaining([[0, 3]]))
  })

  it('measures corner drag distance in grid units', () => {
    const amount = getRoomDraftCornerAmountFromWorldPoint(
      createRoomDraftFromStroke([0, 0], [2, 2]).bounds,
      'nw',
      { x: 0.8, z: 2.1 },
    )

    expect(amount).toBe(0.5)
  })
})
